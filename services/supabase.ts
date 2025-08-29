import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oggabkywjtcghojhzepn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nZ2Fia3l3anRjZ2hvamh6ZXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNjIwNjIsImV4cCI6MjA3MTczODA2Mn0.x2eABhTnCuYMzLfl0Jzmn_BtXANW08rXlniikaLVsvU';

if (!supabaseUrl || !supabaseAnonKey) {
  // This check is more for development purposes, to ensure credentials are not forgotten.
  // In a real-world scenario, you might have more robust error handling.
  throw new Error('Supabase URL and Anon Key must be provided in services/supabase.ts');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
