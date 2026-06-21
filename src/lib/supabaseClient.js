import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const envVal = import.meta.env.VITE_USE_LOCAL
export const USE_LOCAL = envVal === undefined ? true : envVal === '1' || envVal === 'true'

let supabase = null
if (!USE_LOCAL && supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }
export default supabase
