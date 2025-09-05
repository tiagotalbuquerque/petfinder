-- Create missing_pets table
CREATE TABLE IF NOT EXISTS missing_pets (
  id SERIAL PRIMARY KEY,
  pet_name VARCHAR(255) NOT NULL,
  breed VARCHAR(255),
  species VARCHAR(100) NOT NULL,
  last_seen TEXT,
  contact VARCHAR(255) NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  photo_url TEXT,
  type VARCHAR(50) DEFAULT 'missing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create found_pets table
CREATE TABLE IF NOT EXISTS found_pets (
  id SERIAL PRIMARY KEY,
  pet_name VARCHAR(255) NOT NULL,
  breed VARCHAR(255),
  species VARCHAR(100) NOT NULL,
  found_at TEXT,
  contact VARCHAR(255) NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  photo_url TEXT,
  type VARCHAR(50) DEFAULT 'found',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE missing_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE found_pets ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (for demo purposes)
CREATE POLICY "Allow public read access on missing_pets" ON missing_pets
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on missing_pets" ON missing_pets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on found_pets" ON found_pets
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on found_pets" ON found_pets
  FOR INSERT WITH CHECK (true);