import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gldnerjdfpgmplnwpmgf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsZG5lcmpkZnBnbXBsbndwbWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NDUzNDIsImV4cCI6MjA2MzAyMTM0Mn0.b0kiQqWKIAUi0UsvdAEB8CCn9aelB8f-r1iqyRMKIK0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);