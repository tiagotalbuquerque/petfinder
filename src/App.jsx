import { useState, useEffect, useRef } from 'react';
import './App.css'
import ReportForm from './components/ReportForm';
import FoundReportForm from './components/FoundReportForm';
import Map from './components/Map';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';

function App() {
  const [showReportForm, setShowReportForm] = useState(false);
  const [showFoundReportForm, setShowFoundReportForm] = useState(false);
  const [reports, setReports] = useState([]);
  const [foundReports, setFoundReports] = useState([]);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [askType, setAskType] = useState(false);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [searchMarker, setSearchMarker] = useState(null);
  const [focusPoint, setFocusPoint] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const sidebarInputRef = useRef(null);

  useEffect(() => {
    if (searchOpen && sidebarInputRef.current) {
      sidebarInputRef.current.focus();
    }
  }, [searchOpen]);

  const addReport = (report) => {
    const lat = report.lat ?? 51.505;
    const lng = report.lng ?? -0.09;
    setReports([...reports, { ...report, id: reports.length + 1, lat, lng, type: 'missing' }]);
    setShowReportForm(false);
    setPendingCoords(null);
  };

  const addFoundReport = (report) => {
    const lat = report.lat ?? 51.515;
    const lng = report.lng ?? -0.1;
    setFoundReports([...foundReports, { ...report, id: foundReports.length + 1, lat, lng, type: 'found' }]);
    setShowFoundReportForm(false);
    setPendingCoords(null);
  };

  const handleMapClick = ({ lat, lng }) => {
    setPendingCoords({ lat, lng });
    setAskType(true);
  };

  const chooseMissing = () => {
    setAskType(false);
    setShowReportForm(true);
  };

  const chooseFound = () => {
    setAskType(false);
    setShowFoundReportForm(true);
  };

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

  return (
    <div className="app-container">
      <Map reports={reports} foundReports={foundReports} onMapClick={handleMapClick} searchMarker={searchMarker} focusPoint={focusPoint} />

      {/* Search icon overlay (no input shown here) */}
      <div className="search-overlay">
        <div className="flex gap-2">
          <Button onClick={() => setSearchOpen(true)} size="icon" aria-label="Open search" title="Open search">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

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

      <div className="buttons-overlay">
        <Button onClick={() => { setPendingCoords(null); setShowReportForm(true); }}>Report Missing Pet</Button>
        <Button variant="secondary" onClick={() => { setPendingCoords(null); setShowFoundReportForm(true); }}>Report Found Pet</Button>
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

      {showReportForm && <ReportForm addReport={addReport} onCancel={() => { setShowReportForm(false); setPendingCoords(null); }} initialCoords={pendingCoords} />}
      {showFoundReportForm && <FoundReportForm addFoundReport={addFoundReport} onCancel={() => { setShowFoundReportForm(false); setPendingCoords(null); }} initialCoords={pendingCoords} />}
    </div>
  )
}

export default App
