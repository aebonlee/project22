import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// .env에 값이 있을 때만 클라이언트 생성 (없으면 null — 화면은 정상 동작)
export const supabase = url && key ? createClient(url, key) : null;
