import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hxfefvgdoccspxjjavhc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZmVmdmdkb2Njc3B4amphdmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODI0MTIsImV4cCI6MjA4OTI1ODQxMn0.G1R0Oc1hhrKbn1j81dywYAU2Mqx3bCD-22tC8Dy7Vkc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)