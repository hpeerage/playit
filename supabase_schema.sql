/* 
  Playit Platform - Supabase Database Schema 
  매장 운영의 핵심 데이터를 관리하기 위한 SQL 스크립트입니다.
  Supabase 대시보드 -> SQL Editor에서 실행하세요.
*/

-- 1. 전역 설정 (Realtime 활성화 준비)
-- Realtime 기능을 사용하려면 레플리카 ID를 생성해야 합니다.
-- SQL Editor에서 실행 후 Tables 설정에서 실시간 구독을 켜주세요.

-- 2. 회원 관리 테이블 (Members)
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL, -- 회원 로그인 아이디
    name TEXT NOT NULL,
    rank TEXT DEFAULT 'Silver', -- Silver, Gold, VIP, Diamond
    points INTEGER DEFAULT 0,
    remaining_time INTERVAL DEFAULT '00:00:00',
    is_admin BOOLEAN DEFAULT false, -- 관리자 권한 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 좌석 관리 테이블 (Rooms/Seats)
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number INTEGER UNIQUE NOT NULL,
    status TEXT DEFAULT 'Empty', -- Empty, Using, Maintenance, Cleaning
    zone TEXT DEFAULT 'Common', -- Common, FPS, VIP
    current_user_id UUID REFERENCES public.members(id),
    last_status_change TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. 상품 정보 테이블 (Products)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    stock INTEGER DEFAULT -1, -- -1은 무제한
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. 주문 관리 테이블 (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.rooms(id) NOT NULL,
    user_id UUID REFERENCES public.members(id),
    status TEXT DEFAULT 'Pending', -- Pending, Processing, Completed, Cancelled
    total_price INTEGER NOT NULL,
    order_items JSONB NOT NULL, -- [{product_id, name, count, price}, ...]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. 인덱스 설정 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);

-- 8. 알림 테이블 (Notifications) - 관리자 호출 및 시스템 알림용
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- Call, Order, System
    message TEXT NOT NULL,
    room_id UUID REFERENCES public.rooms(id),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 9. 리모트 명령 테이블 (Remote Commands) - WBS 104 연동
CREATE TABLE IF NOT EXISTS public.remote_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.rooms(id) NOT NULL,
    command TEXT NOT NULL, -- LOGOUT, MESSAGE, RESTART
    payload JSONB DEFAULT '{}',
    is_executed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_remote_commands_room_id ON public.remote_commands(room_id);

-- 10. 시간 사용 로그 테이블 (Time Logs) - WBS 101 연동
CREATE TABLE IF NOT EXISTS public.time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.members(id) NOT NULL,
    type TEXT NOT NULL, -- Charge, Use, Refund
    amount INTERVAL NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON public.time_logs(user_id);

-- 11. 주문 결제 및 재고 차감 함수 (pay_order) - WBS 201 연동
CREATE OR REPLACE FUNCTION public.pay_order(
    p_user_id UUID,
    p_room_id UUID,
    p_total_price INTEGER,
    p_order_items JSONB
) RETURNS JSON AS $$
DECLARE
    v_user_points INTEGER;
    v_item RECORD;
    v_order_id UUID;
BEGIN
    -- 1. 포인트 잔액 확인
    SELECT points INTO v_user_points FROM public.members WHERE id = p_user_id;
    IF v_user_points < p_total_price THEN
        RETURN json_build_object('success', false, 'message', '포인트가 부족합니다.');
    END IF;

    -- 2. 각 품목별 재고 확인 (stock > -1 인 경우만)
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_order_items) AS x(product_id UUID, count INTEGER, name TEXT)
    LOOP
        IF EXISTS (SELECT 1 FROM public.products WHERE id = v_item.product_id AND stock <> -1 AND stock < v_item.count) THEN
            RETURN json_build_object('success', false, 'message', v_item.name || '의 재고가 부족합니다.');
        END IF;
    END LOOP;

    -- 3. 포인트 차감
    UPDATE public.members 
    SET points = points - p_total_price,
        updated_at = now()
    WHERE id = p_user_id;

    -- 4. 재고 차감 (stock > -1 인 경우만)
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_order_items) AS x(product_id UUID, count INTEGER)
    LOOP
        UPDATE public.products 
        SET stock = stock - v_item.count,
            updated_at = now()
        WHERE id = v_item.product_id AND stock <> -1;
    END LOOP;

    -- 5. 주문 생성
    INSERT INTO public.orders (room_id, user_id, total_price, order_items, status)
    VALUES (p_room_id, p_user_id, p_total_price, p_order_items, 'Pending')
    RETURNING id INTO v_order_id;

    RETURN json_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 12. 주문 취소 및 환불 함수 (cancel_order) - WBS 201 연동
CREATE OR REPLACE FUNCTION public.cancel_order(
    p_order_id UUID
) RETURNS JSON AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    
    IF v_order IS NULL THEN 
        RETURN json_build_object('success', false, 'message', '주문을 찾을 수 없습니다.'); 
    END IF;

    IF v_order.status = 'Cancelled' THEN
        RETURN json_build_object('success', false, 'message', '이미 취소된 주문입니다.');
    END IF;

    -- 1. 주문 상태 변경
    UPDATE public.orders SET status = 'Cancelled', updated_at = now() WHERE id = p_order_id;

    -- 2. 포인트 환불
    IF v_order.user_id IS NOT NULL THEN
        UPDATE public.members SET points = points + v_order.total_price WHERE id = v_order.user_id;
    END IF;

    -- 3. 재고 복구 (stock > -1 인 경우만)
    FOR v_item IN SELECT * FROM jsonb_to_recordset(v_order.order_items) AS x(product_id UUID, count INTEGER)
    LOOP
        UPDATE public.products 
        SET stock = stock + v_item.count 
        WHERE id = v_item.product_id AND stock <> -1;
    END LOOP;

    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql;


