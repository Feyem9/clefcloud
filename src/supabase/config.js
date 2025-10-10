import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://moiojsgocanyxxvrmcnz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaW9qc2dvY2FueXh4dnJtY256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwODg0NzgsImV4cCI6MjA3NTY2NDQ3OH0.aOt1rqJVO_xg17LR_DrkuVO5WiFFngy_KeHAcC9qakw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
