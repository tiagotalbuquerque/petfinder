import { supabase, isUsingRealCredentials } from './supabase';

// Mock data for when not using real Supabase credentials
const mockMissingPets = [
  {
    id: 'm1',
    pet_name: 'Max',
    breed: 'Golden Retriever',
    species: 'Dog',
    last_seen: '123 Main St',
    contact: 'john@example.com',
    lat: 40.7128,
    lng: -74.006,
    type: 'missing',
    created_at: new Date().toISOString()
  },
  {
    id: 'm2',
    pet_name: 'Whiskers',
    breed: 'Tabby',
    species: 'Cat',
    last_seen: '456 Park Ave',
    contact: 'sarah@example.com',
    lat: 40.7135,
    lng: -74.0080,
    type: 'missing',
    created_at: new Date().toISOString()
  }
];

const mockFoundPets = [
  {
    id: 'f1',
    pet_name: 'Unknown',
    breed: 'Beagle',
    species: 'Dog',
    last_seen: 'Central Park',
    contact: 'mike@example.com',
    lat: 40.7821,
    lng: -73.9665,
    type: 'found',
    created_at: new Date().toISOString()
  }
];

// Helper to generate unique IDs for mock data
const generateId = () => Math.random().toString(36).substring(2, 15);

// Missing Pets API
export const missingPetsApi = {
  // Get all missing pet reports
  getAll: async () => {
    // Use mock data if not using real credentials
    if (!isUsingRealCredentials()) {
      console.log('Using mock missing pets data');
      return [...mockMissingPets];
    }

    try {
      const { data, error } = await supabase
        .from('missing_pets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching missing pets:', error);
        console.error('This might indicate that the missing_pets table does not exist in your Supabase database.');
        console.error('Please run the create-tables.sql script in your Supabase SQL editor.');
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in Supabase operation:', error);
      console.error('Please check your Supabase configuration.');
      throw error;
    }
  },
  
  // Add a new missing pet report
  add: async (report) => {
    // Use mock data if not using real credentials
    if (!isUsingRealCredentials()) {
      console.log('Adding mock missing pet');
      const newPet = {
        id: generateId(),
        pet_name: report.petName,
        breed: report.breed,
        species: report.species,
        last_seen: report.lastSeen,
        contact: report.contact,
        lat: report.lat,
        lng: report.lng,
        type: 'missing',
        created_at: new Date().toISOString()
      };
      mockMissingPets.unshift(newPet);
      return newPet;
    }

    try {
      const { data, error } = await supabase
        .from('missing_pets')
        .insert([
          {
            pet_name: report.petName,
            breed: report.breed,
            species: report.species,
            last_seen: report.lastSeen,
            contact: report.contact,
            lat: report.lat,
            lng: report.lng,
            type: 'missing'
          }
        ])
        .select();
      
      if (error) {
        console.error('Error adding missing pet report:', error);
        throw error;
      }
      
      return data?.[0];
    } catch (error) {
      console.error('Error in Supabase operation:', error);
      // Do NOT fallback to mock when using real credentials; surface the error instead
      throw error;
    }
  }
};

// Found Pets API
export const foundPetsApi = {
  // Get all found pet reports
  getAll: async () => {
    // Use mock data if not using real credentials
    if (!isUsingRealCredentials()) {
      console.log('Using mock found pets data');
      return [...mockFoundPets];
    }

    try {
      const { data, error } = await supabase
        .from('found_pets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching found pets:', error);
        console.error('This might indicate that the found_pets table does not exist in your Supabase database.');
        console.error('Please run the create-tables.sql script in your Supabase SQL editor.');
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in Supabase operation:', error);
      console.error('Please check your Supabase configuration.');
      throw error;
    }
  },
  
  // Add a new found pet report
  add: async (report) => {
    // Use mock data if not using real credentials
    if (!isUsingRealCredentials()) {
      console.log('Adding mock found pet');
      const newPet = {
        id: generateId(),
        pet_name: report.petName,
        breed: report.breed,
        species: report.species,
        found_at: report.foundAt,
        contact: report.contact,
        lat: report.lat,
        lng: report.lng,
        type: 'found',
        created_at: new Date().toISOString()
      };
      mockFoundPets.unshift(newPet);
      return newPet;
    }

    try {
      const { data, error } = await supabase
        .from('found_pets')
        .insert([
          {
            pet_name: report.petName,
            breed: report.breed,
            species: report.species,
            found_at: report.foundAt,
            contact: report.contact,
            lat: report.lat,
            lng: report.lng,
            type: 'found'
          }
        ])
        .select();
      
      if (error) {
        console.error('Error adding found pet report:', error);
        throw error;
      }
      
      return data?.[0];
    } catch (error) {
      console.error('Error in Supabase operation:', error);
      // Do NOT fallback to mock when using real credentials; surface the error instead
      throw error;
    }
  }
};