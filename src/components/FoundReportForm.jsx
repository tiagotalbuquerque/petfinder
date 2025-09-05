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

function FoundReportForm({ addFoundReport, onCancel, initialCoords }) {
  const [petName, setPetName] = useState('');
  const [breed, setBreed] = useState('');
  const [species, setSpecies] = useState('dog');
  const [foundAt, setFoundAt] = useState('');
  const [contact, setContact] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [coords, setCoords] = useState(null);

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
        setFoundAt(data.display_name || `${init.lat}, ${init.lng}`);
      } catch {
        setFoundAt(`${init.lat}, ${init.lng}`);
      }
    })();
  }, [initialCoords?.lat, initialCoords?.lng]);

  useEffect(() => {
    const controller = new AbortController();
    const q = foundAt.trim();
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
    }, 350);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [foundAt]);

  const selectSuggestion = (item) => {
    setFoundAt(item.display_name || '');
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
        setFoundAt(data.display_name || `${latitude}, ${longitude}`);
      } catch {
        setFoundAt(`${latitude}, ${longitude}`);
      }
      setCoords({ lat: latitude, lng: longitude });
      setSuggestions([]);
    });
  };

  const onPhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setPhotoFile(file || null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (file) {
      try {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } catch {
        setPreviewUrl(null);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { petName, breed, species, foundAt, contact };
    if (coords) {
      payload.lat = coords.lat;
      payload.lng = coords.lng;
    }
    if (photoFile) payload.photoFile = photoFile;
    addFoundReport(payload);
  };

  const handleCancel = () => {
    setPetName('');
    setBreed('');
    setSpecies('dog');
    setFoundAt('');
    setContact('');
    setSuggestions([]);
    setCoords(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPhotoFile(null);
    if (onCancel) onCancel();
  };

  return (
    <div className="report-form-container">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Report a Found Pet</CardTitle>
          <CardDescription>Enter the details of the found pet.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="petName">Pet's Name (if known)</Label>
                <Input id="petName" placeholder="Name of the pet" value={petName} onChange={(e) => setPetName(e.target.value)} />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="breed">Breed</Label>
                <Input id="breed" placeholder="Breed of the pet" value={breed} onChange={(e) => setBreed(e.target.value)} />
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
                <Label htmlFor="foundAt">Found At Location</Label>
                <div className="flex gap-2">
                  <Input id="foundAt" placeholder="Search address" value={foundAt} onChange={(e) => { setFoundAt(e.target.value); setCoords(null); }} />
                  <Button type="button" variant="secondary" onClick={useMyLocation}>My location</Button>
                </div>
                {loadingSuggest && <div className="text-xs text-muted-foreground">Searching…</div>}
                {suggestions.length > 0 && (
                  <ul className="absolute top-full mt-1 max-h-60 w-full overflow-auto rounded-md border bg-card text-card-foreground shadow z-[2000]">
                    {suggestions.map((s) => (
                      <li key={`${s.place_id}`} className="cursor-pointer px-3 py-2 hover:bg-accent" onClick={() => selectSuggestion(s)}>
                        {s.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="contact">Your Contact Information</Label>
                <Input id="contact" placeholder="Your contact information" value={contact} onChange={(e) => setContact(e.target.value)} />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="photo">Pet Photo (optional)</Label>
                <Input id="photo" type="file" accept="image/*" onChange={onPhotoChange} />
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="mt-2 max-h-40 rounded border object-cover" />)
                }
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit Found Pet Report</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default FoundReportForm;