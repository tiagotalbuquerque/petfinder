import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Custom icons for missing and found pets
const missingIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const foundIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const searchIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng || {};
      if (onMapClick && typeof onMapClick === 'function') onMapClick({ lat, lng });
    },
  });
  return null;
}

function MapController({ focusPoint }) {
  const map = useMap();
  useEffect(() => {
    if (focusPoint && typeof focusPoint.lat === 'number' && typeof focusPoint.lng === 'number') {
      const zoom = focusPoint.zoom ?? Math.max(map.getZoom(), 15);
      map.flyTo([focusPoint.lat, focusPoint.lng], zoom);
    }
  }, [focusPoint?.lat, focusPoint?.lng, focusPoint?.zoom]);
  return null;
}

function Map({ reports, foundReports, onMapClick, searchMarker, focusPoint }) {
  return (
    <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100vh', width: '100vw' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />
      <MapController focusPoint={focusPoint} />
      {searchMarker && (
        <Marker position={[searchMarker.lat, searchMarker.lng]} icon={searchIcon}>
          <Popup>{searchMarker.label || 'Search result'}</Popup>
        </Marker>
      )}
      {reports.map(report => (
        <Marker key={report.id} position={[report.lat, report.lng]} icon={missingIcon}>
          <Popup>
            <strong>{report.petName}</strong> ({report.breed})<br />
            Last seen: {report.lastSeen}<br />
            Contact: {report.contact}
          </Popup>
        </Marker>
      ))}
      {foundReports && foundReports.map(report => (
        <Marker key={report.id} position={[report.lat, report.lng]} icon={foundIcon}>
          <Popup>
            <strong>Found Pet: {report.petName}</strong> ({report.breed})<br />
            Found at: {report.foundAt}<br />
            Contact: {report.contact}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default Map;