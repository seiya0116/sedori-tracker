import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_KEY:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'undefined');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
