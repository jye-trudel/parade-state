import { createClient, SupabaseClient } from '@supabase/supabase-js'

// The Vite environment variables are only available at build time. If they
// aren't set the project should still work in "standalone" mode using
// localStorage; we avoid creating a client with undefined values because
// supabase-js will throw.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null
