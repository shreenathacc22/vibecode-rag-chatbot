const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('conversations').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
      console.error('Supabase connection error:', error);
      return false;
    }
    console.log('Supabase connected successfully');
    return true;
  } catch (err) {
    console.error('Supabase connection failed:', err.message);
    return false;
  }
}

module.exports = { supabase, testSupabaseConnection };
