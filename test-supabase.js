import { supabase } from './src/lib/supabase.js';

async function testSupabase() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test missing_pets table
    const { data: missingData, error: missingError } = await supabase
      .from('missing_pets')
      .select('*')
      .limit(1);
    
    if (missingError) {
      console.error('Error querying missing_pets:', missingError);
    } else {
      console.log('missing_pets query successful:', missingData);
    }
    
    // Test found_pets table
    const { data: foundData, error: foundError } = await supabase
      .from('found_pets')
      .select('*')
      .limit(1);
    
    if (foundError) {
      console.error('Error querying found_pets:', foundError);
    } else {
      console.log('found_pets query successful:', foundData);
    }
    
  } catch (error) {
    console.error('Connection error:', error);
  }
}

testSupabase();