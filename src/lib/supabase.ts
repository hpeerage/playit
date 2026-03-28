/* src/lib/supabase.ts */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Supabase 클라이언트 초기화
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type RoomStatus = 'Empty' | 'Using' | 'Cleaning' | 'Maintenance';

export interface Room {
  id: string;
  room_number: number;
  status: RoomStatus;
  zone?: string;
  current_user_id?: string;
  last_status_change?: string;
  created_at: string;
}

export interface Member {
  id: string;
  user_id: string;
  name: string;
  rank: 'Silver' | 'Gold' | 'VIP' | 'Diamond';
  points: number;
  remaining_time: string;
  is_admin?: boolean;
  email?: string;
  user_id_display?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  room_id: string;
  user_id?: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  total_price: number;
  order_items: any; // [{product_id, name, count, price}, ...]
  created_at: string;
  updated_at: string;
}
