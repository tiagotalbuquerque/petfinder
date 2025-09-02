import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ReportForm({ addReport, onCancel, initialCoords }) {
  const [petName, setPetName] = useState('');
  const [breed, setBreed] = useState('');
  const [species, setSpecies] = useState('dog');
  const [lastSeen, setLastSeen] = useState('');
  const [contact, setContact] = useState('');

  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [coords, setCoords] = useState(null); // { lat, lng }

  // Prefill from map click if provided
  useEffect(() => {
    const init = initialCoords;
    if (!init) return;
    const alreadySame = coords && Math.abs(coords.lat - init.lat) < 1e-9 && Math.abs(coords.lng - init.lng) < 1e-9;
    if (alreadySame) return;
    setCoords(init);
    (async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${init.lat}&lon=${init.lng}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        setLastSeen(data.display_name || `${init.lat}, ${init.lng}`);
      } catch {
        setLastSeen(`${init.lat}, ${init.lng}`);
      }
    })();
  }, [initialCoords?.lat, initialCoords?.lng]);

  useEffect(() => {
    const controller = new AbortController();
    const q = lastSeen.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return () => controller.abort();
    }
    setLoadingSuggest(true);
    const timeout = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&addressdetails=1&limit=5`;
        const res = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
        if (!res.ok) throw new Error('Failed to fetch suggestions');
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        setLoadingSuggest(false);
      }
    }, 350); // debounce
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [lastSeen]);

  const selectSuggestion = (item) => {
    setLastSeen(item.display_name || '');
    setCoords({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setSuggestions([]);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        setLastSeen(data.display_name || `${latitude}, ${longitude}`);
      } catch {
        setLastSeen(`${latitude}, ${longitude}`);
      }
      setCoords({ lat: latitude, lng: longitude });
      setSuggestions([]);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { petName, breed, species, lastSeen, contact };
    if (coords) {
      payload.lat = coords.lat;
      payload.lng = coords.lng;
    }
    addReport(payload);
  };

  const handleCancel = () => {
    setPetName('');
    setBreed('');
    setSpecies('dog');
    setLastSeen('');
    setContact('');
    setSuggestions([]);
    setCoords(null);
    if (onCancel) onCancel();
  };

  return (
    <div className="report-form-container">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Report a Missing Pet</CardTitle>
          <CardDescription>Enter the details of the missing pet.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="petName">Pet's Name</Label>
                <Input id="petName" placeholder="Name of your pet" value={petName} onChange={(e) => setPetName(e.target.value)} />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="breed">Breed</Label>
                <Input id="breed" placeholder="Breed of your pet" value={breed} onChange={(e) => setBreed(e.target.value)} />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="species">Species</Label>
                <select
                  id="species"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  className="h-10 w-full rounded-md border px-3 text-sm"
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex flex-col space-y-1.5 relative">
                <Label htmlFor="lastSeen">Last Seen Location</Label>
                <div className="flex gap-2">
                  <Input id="lastSeen" placeholder="Search address" value={lastSeen} onChange={(e) => { setLastSeen(e.target.value); setCoords(null); }} />
                  <Button type="button" variant="secondary" onClick={useMyLocation}>My location</Button>
                </div>
                {loadingSuggest && <div className="text-xs text-muted-foreground">Searching…</div>}
                {suggestions.length > 0 && (
                  <ul className="absolute top-full mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow z-[2000]">
                    {suggestions.map((s) => (
                      <li key={`${s.place_id}`} className="cursor-pointer px-3 py-2 hover:bg-accent" onClick={() => selectSuggestion(s)}>
                        {s.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="contact">Contact Information</Label>
                <Input id="contact" placeholder="Your contact information" value={contact} onChange={(e) => setContact(e.target.value)} />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit Report</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default ReportForm;