import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('ordenes').select('*, items_orden(*)').limit(1);
  console.log('Error:', error);
  console.dir(data, { depth: null });
}
run();
