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
          closedSomething = true;
        }
        if (closedSomething) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [searchOpen, askType, showReportForm, showFoundReportForm]);

  const performSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&addressdetails=1&limit=10`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
      setSearchOpen(true);
    } catch (e) {
      setResults([]);
      setSearchOpen(true);
    } finally {
      setSearching(false);
    }
  };

  const selectResult = (r) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    setFocusPoint({ lat, lng, zoom: 16 });
    setSearchMarker({ lat, lng, label: r.display_name });
  };

  const testDatabaseConnection = async () => {
    console.log('Testing database connection...');
    setDbTestResult('Testing...');
    try {
      const missingPets = await missingPetsApi.getAll();
      const foundPets = await foundPetsApi.getAll();
      setDbTestResult(`Success! Found ${missingPets.length} missing pets and ${foundPets.length} found pets`);
    } catch (error) {
      console.error('Database test failed:', error);
      setDbTestResult(`Error: ${error.message}`);
    }
  };

  const testDatabaseWriteRead = async () => {
    setDbWriteTestResult({ status: 'running', message: 'Running write/read test...' });
    const tag = `db_test_${Date.now()}`;
    let missingId = null;
    let foundId = null;
    try {
      // Insert into missing_pets
      const { data: insertMissing, error: insertMissingErr } = await supabase
        .from('missing_pets')
        .insert([
          {
            pet_name: 'DB_TEST',
            breed: 'N/A',
            species: 'Dog',
            last_seen: 'TEST_LOCATION',
            contact: tag,
            lat: 0,
            lng: 0,
            type: 'missing'
          }
        ])
        .select();
      if (insertMissingErr) throw new Error(`missing_pets insert failed: ${insertMissingErr.message}`);
      missingId = insertMissing?.[0]?.id;

      // Verify missing_pets row
      const { data: checkMissing, error: checkMissingErr } = await supabase
        .from('missing_pets')
        .select('id, contact')
        .eq('id', missingId)
        .maybeSingle();
      if (checkMissingErr) throw new Error(`missing_pets select failed: ${checkMissingErr.message}`);
      if (!checkMissing || checkMissing.contact !== tag) throw new Error('missing_pets verification failed');

      // Insert into found_pets
      const { data: insertFound, error: insertFoundErr } = await supabase
        .from('found_pets')
        .insert([
          {
            pet_name: 'DB_TEST',
            breed: 'N/A',
            species: 'Dog',
            found_at: 'TEST_LOCATION',
            contact: tag,
            lat: 0,
            lng: 0,
            type: 'found'
          }
        ])
        .select();
      if (insertFoundErr) throw new Error(`found_pets insert failed: ${insertFoundErr.message}`);
      foundId = insertFound?.[0]?.id;

      // Verify found_pets row
      const { data: checkFound, error: checkFoundErr } = await supabase
        .from('found_pets')
        .select('id, contact')
        .eq('id', foundId)
        .maybeSingle();
      if (checkFoundErr) throw new Error(`found_pets select failed: ${checkFoundErr.message}`);
      if (!checkFound || checkFound.contact !== tag) throw new Error('found_pets verification failed');

      setDbWriteTestResult({ status: 'success', message: 'Write/Read test passed. Cleaning up test rows...' });

      // Clean up
      const { error: delMissingErr } = await supabase.from('missing_pets').delete().eq('id', missingId);
      if (delMissingErr) throw new Error(`missing_pets delete failed: ${delMissingErr.message}`);
      const { error: delFoundErr } = await supabase.from('found_pets').delete().eq('id', foundId);
      if (delFoundErr) throw new Error(`found_pets delete failed: ${delFoundErr.message}`);

      setDbWriteTestResult({ status: 'success', message: 'Write/Read/Delete test completed successfully.' });
    } catch (e) {
      setDbWriteTestResult({ status: 'error', message: e?.message || String(e) });
    }
  };

  return (
    <div className="app-container">
      <Map reports={reports} foundReports={foundReports} onMapClick={handleMapClick} searchMarker={searchMarker} focusPoint={focusPoint} />

      {/* Search icon moved into buttons overlay */}

      {/* Collapsible sidebar */}
      <aside className={`sidebar ${searchOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="font-medium">Search</div>
          <Button size="sm" variant="ghost" onClick={() => setSearchOpen(false)} aria-label="Close results" title="Close">×</Button>
        </div>
        <div className="sidebar-content space-y-2">
          <div className="flex gap-2">
            <Input
              ref={sidebarInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search places..."
              onKeyDown={(e) => { if (e.key === 'Enter') performSearch(); }}
            />
            <Button onClick={performSearch} disabled={searching} size="icon" aria-label="Search" title="Search">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {results.length === 0 && (
            <div className="text-sm text-muted-foreground">
              {searching ? 'Searching…' : (hasSearched ? 'No results' : 'Type a place above to search')}
            </div>
          )}
          {results.map((r) => (
            <div key={r.place_id} className="search-result-item" onClick={() => selectResult(r)}>
              <div className="text-sm font-medium truncate">{r.display_name}</div>
              {r.type && <div className="text-xs text-muted-foreground">{r.type}</div>}
            </div>
          ))}
        </div>
      </aside>

      {/* Error banner */}
      {error && (
        <div className="db-test-result error" style={{ position: 'absolute', top: 8, left: 8, right: 8, zIndex: 1000 }}>
          {error.type === 'connection' ? `Connection error: ${error.message}` : `Data integrity issue: ${error.message}`}
        </div>
      )}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Loading reports...</div>
        </div>
      )}
      <div className="buttons-overlay">
        <Button onClick={() => setSearchOpen(true)} className="bg-black text-white hover:bg-black/90" aria-label="Open search" title="Open search">
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
        <Button variant="secondary" onClick={() => openMissingModal(null)}>Report Missing Pet</Button>
        <Button variant="secondary" onClick={() => openFoundModal(null)}>Report Found Pet</Button>
      </div>
      
      {askType && (
        <div className="report-form-container">
          <div className="w-[320px] rounded-md border bg-background p-4 shadow">
            <div className="mb-3 text-sm">Create report at clicked location?</div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setAskType(false); setPendingCoords(null); }}>Cancel</Button>
              <Button onClick={chooseMissing}>Missing</Button>
              <Button variant="secondary" onClick={chooseFound}>Found</Button>
            </div>
          </div>
        </div>
      )}

      {showReportForm && <ReportForm addReport={addReport} onCancel={() => { closeAllModals(); setPendingCoords(null); }} initialCoords={pendingCoords} />}
      {showFoundReportForm && <FoundReportForm addFoundReport={addFoundReport} onCancel={() => { closeAllModals(); setPendingCoords(null); }} initialCoords={pendingCoords} />}
    </div>
  )
}

export default App
