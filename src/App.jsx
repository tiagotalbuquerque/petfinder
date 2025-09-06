import { useState, useEffect, useRef } from 'react';
import './App.css'
import ReportForm from './components/ReportForm';
import FoundReportForm from './components/FoundReportForm';
import Map from './components/Map';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import { missingPetsApi, foundPetsApi } from './lib/api';
import { supabase } from './lib/supabase';

function App() {
  const [showReportForm, setShowReportForm] = useState(false);
  const [showFoundReportForm, setShowFoundReportForm] = useState(false);
  const [reports, setReports] = useState([]);
  const [foundReports, setFoundReports] = useState([]);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [askType, setAskType] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbTestResult, setDbTestResult] = useState(null);
  const [dbWriteTestResult, setDbWriteTestResult] = useState(null);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [searchMarker, setSearchMarker] = useState(null);
  const [focusPoint, setFocusPoint] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const sidebarInputRef = useRef(null);

  // Load reports from Supabase on component mount
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        // Fetch missing pets
        const missingPets = await missingPetsApi.getAll();
        setReports(missingPets.map(pet => ({
          id: pet.id,
          petName: pet.pet_name,
          breed: pet.breed,
          species: pet.species,
          lastSeen: pet.last_seen,
          contact: pet.contact,
          lat: pet.lat,
          lng: pet.lng,
          photoUrl: pet.photo_url || null,
          type: 'missing'
        })));
        
        // Fetch found pets
        const foundPets = await foundPetsApi.getAll();
        setFoundReports(foundPets.map(pet => ({
          id: pet.id,
          petName: pet.pet_name,
          breed: pet.breed,
          species: pet.species,
          foundAt: pet.found_at,
          contact: pet.contact,
          lat: pet.lat,
          lng: pet.lng,
          photoUrl: pet.photo_url || null,
          type: 'found'
        })));

        // Basic data integrity checks
        const invalidMissing = !Array.isArray(missingPets) || missingPets.some(p => !p || p.id == null || p.pet_name == null || Number.isNaN(Number(p.lat)) || Number.isNaN(Number(p.lng)));
        const invalidFound = !Array.isArray(foundPets) || foundPets.some(p => !p || p.id == null || p.pet_name == null || Number.isNaN(Number(p.lat)) || Number.isNaN(Number(p.lng)));
        if (invalidMissing || invalidFound) {
          setError({ type: 'integrity', message: `Data integrity issue detected${invalidMissing ? ' in missing_pets' : ''}${invalidMissing && invalidFound ? ' and' : ''}${invalidFound ? ' in found_pets' : ''}.` });
        } else {
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
        setError({ type: 'connection', message: error?.message || 'Failed to fetch reports.' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
    
    // Set up real-time subscription for missing pets
    const missingPetsSubscription = supabase
      .channel('missing_pets_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'missing_pets' }, () => {
        // Refresh missing pets data when changes occur
        missingPetsApi.getAll().then(data => {
          setReports(data.map(pet => ({
            id: pet.id,
            petName: pet.pet_name,
            breed: pet.breed,
            species: pet.species,
            lastSeen: pet.last_seen,
            contact: pet.contact,
            lat: pet.lat,
            lng: pet.lng,
            photoUrl: pet.photo_url || null,
            type: 'missing'
          })));
        });
      })
      .subscribe();
      
    // Set up real-time subscription for found pets
    const foundPetsSubscription = supabase
      .channel('found_pets_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'found_pets' }, () => {
        // Refresh found pets data when changes occur
        foundPetsApi.getAll().then(data => {
          setFoundReports(data.map(pet => ({
            id: pet.id,
            petName: pet.pet_name,
            breed: pet.breed,
            species: pet.species,
            foundAt: pet.found_at,
            contact: pet.contact,
            lat: pet.lat,
            lng: pet.lng,
            photoUrl: pet.photo_url || null,
            type: 'found'
          })));
        });
      })
      .subscribe();
    
    // Focus search input when search is opened
    if (searchOpen && sidebarInputRef.current) {
      sidebarInputRef.current.focus();
    }
    
    // Cleanup subscriptions on unmount
    return () => {
      missingPetsSubscription.unsubscribe();
      foundPetsSubscription.unsubscribe();
    };
  }, [searchOpen]);

  const addReport = async (report) => {
    try {
      const lat = report.lat ?? 51.505;
      const lng = report.lng ?? -0.09;
      
      // Save to Supabase
      const savedReport = await missingPetsApi.add({
        ...report,
        lat,
        lng
      });
      
      // Update local state with the saved report from Supabase
      if (savedReport) {
        const formattedReport = {
          id: savedReport.id,
          petName: savedReport.pet_name,
          breed: savedReport.breed,
          species: savedReport.species,
          lastSeen: savedReport.last_seen,
          contact: savedReport.contact,
          lat: savedReport.lat,
          lng: savedReport.lng,
          photoUrl: savedReport.photo_url || null,
          type: 'missing'
        };
        setReports(prev => [...prev, formattedReport]);
      }
      
      setShowReportForm(false);
      setPendingCoords(null);
    } catch (error) {
      console.error('Error adding missing pet report:', error);
      setError({ type: 'connection', message: error?.message || 'Failed to save the report.' });
    }
  };

  const addFoundReport = async (report) => {
    try {
      const lat = report.lat ?? 51.515;
      const lng = report.lng ?? -0.1;
      
      // Save to Supabase
      const savedReport = await foundPetsApi.add({
        ...report,
        lat,
        lng
      });
      
      // Update local state with the saved report from Supabase
      if (savedReport) {
        const formattedReport = {
          id: savedReport.id,
          petName: savedReport.pet_name,
          breed: savedReport.breed,
          species: savedReport.species,
          foundAt: savedReport.found_at,
          contact: savedReport.contact,
          lat: savedReport.lat,
          lng: savedReport.lng,
          photoUrl: savedReport.photo_url || null,
          type: 'found'
        };
        setFoundReports(prev => [...prev, formattedReport]);
      }
      
      setShowFoundReportForm(false);
      setPendingCoords(null);
    } catch (error) {
      console.error('Error adding found pet report:', error);
      setError({ type: 'connection', message: error?.message || 'Failed to save the report.' });
    }
  };

  const handleMapClick = ({ lat, lng }) => {
    setPendingCoords({ lat, lng });
    closeAllModals();
    setAskType(true);
  };

  const chooseMissing = () => {
    closeAllModals();
    setShowReportForm(true);
  };

  const chooseFound = () => {
    closeAllModals();
    setShowFoundReportForm(true);
  };

  // Ensure only one modal is open at a time
  const closeAllModals = () => {
    setShowReportForm(false);
    setShowFoundReportForm(false);
    setAskType(false);
  };

  const openMissingModal = (coords = null) => {
    setPendingCoords(coords);
    closeAllModals();
    setShowReportForm(true);
  };

  const openFoundModal = (coords = null) => {
    setPendingCoords(coords);
    closeAllModals();
    setShowFoundReportForm(true);
  };

  // Global ESC key handler to close search sidebar and any open report modals
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        let closedSomething = false;
        if (searchOpen) {
          setSearchOpen(false);
          closedSomething = true;
        }
        if (askType || showReportForm || showFoundReportForm) {
          // Close all modals and clear pending coords for consistency with Cancel actions
          setShowReportForm(false);
          setShowFoundReportForm(false);
          setAskType(false);
          setPendingCoords(null);
        }
        if (!closedSomething && !askType && !showReportForm && !showFoundReportForm) {
          setSearchOpen(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchOpen, askType, showReportForm, showFoundReportForm]);

  return (
    <div style={{ "--sidebar-offset": searchOpen ? "min(24rem, 80vw)" : "0px" }}>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-[1000] p-4 flex items-center justify-center gap-3 bg-transparent shadow-none">
        <Button
          onClick={() => setSearchOpen(o => !o)}
          variant="secondary"
          size="icon"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => openMissingModal()}
          variant="default"
        >
          Report Missing Pet
        </Button>
        <Button
          onClick={() => openFoundModal()}
          variant="outline"
        >
          Report Found Pet
        </Button>
      </div>

      {/* Search sidebar */}
      <div className={`fixed top-0 left-0 bottom-0 w-96 max-w-[80vw] bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow z-[900] p-4 overflow-auto transform transition-transform duration-300 ease-out ${searchOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}`}>
        <h2 className="text-lg font-semibold mb-3">Search for Pet or Location</h2>
        <div className="flex items-center gap-2 mb-4">
          <Input ref={sidebarInputRef} placeholder="Search by name, breed, species, or place" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Button onClick={() => { /* implement search later */ }}>Go</Button>
        </div>
        <div className="text-sm text-muted-foreground">Search results coming soon…</div>
      </div>

      {/* Map */}
      <Map
        reports={reports}
        foundReports={foundReports}
        onMapClick={handleMapClick}
        searchMarker={searchMarker}
        focusPoint={focusPoint}
      />

      {/* Modals */}
      {askType && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50">
          <div className="bg-card text-card-foreground p-6 rounded-xl shadow border w-[360px]">
            <h2 className="text-lg font-semibold mb-4">What would you like to report?</h2>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAskType(false)}>Cancel</Button>
              <Button onClick={chooseMissing}>Missing</Button>
              <Button variant="secondary" onClick={chooseFound}>Found</Button>
            </div>
          </div>
        </div>
      )}
      {showReportForm && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50">
          <ReportForm addReport={addReport} onCancel={() => setShowReportForm(false)} initialCoords={pendingCoords} />
        </div>
      )}
      {showFoundReportForm && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50">
          <FoundReportForm addFoundReport={addFoundReport} onCancel={() => setShowFoundReportForm(false)} initialCoords={pendingCoords} />
        </div>
      )}
    </div>
  );
}

export default App
