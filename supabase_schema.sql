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
