# PetFinder Application

PetFinder is a web application that helps reunite lost pets with their owners. Users can report missing pets and found pets, view reports on an interactive map, and search for locations.

## Features

- Report missing pets with details and location
- Report found pets with details and location
- Interactive map showing all reports with different markers for missing and found pets
- Location search functionality
- Persistent storage using Supabase
- Real-time updates when new reports are added

## Technologies Used

- React
- Vite
- Leaflet for maps
- Supabase for database
- Tailwind CSS with shadcn/ui components

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Supabase account (for database)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up Supabase (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions)
4. Create a `.env` file in the project root with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. Start the development server:
   ```
   npm run dev
   ```

## Usage

- Click "Report Missing Pet" to create a report for a lost pet
- Click "Report Found Pet" to create a report for a pet you've found
- Click on the map to create a report at that specific location
- Use the search icon to find specific locations
- Click on markers to view details about reported pets

## License

This project is licensed under the MIT License.
