// src/pages/MapPage.js
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';
import AppLayout from '../layouts/AppLayout';

// Fix default marker icons broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CATEGORY_EMOJI = {
  movie: '🎬', sports: '⚽', food: '🍜', music: '🎵',
  hangout: '☕', study: '📚', drive: '🛣️', rideshare: '🚗',
  travel: '✈️', gaming: '🎮', art: '🎨', default: '📍',
};

const emoji = (cat) => CATEGORY_EMOJI[cat?.toLowerCase()] || CATEGORY_EMOJI.default;

// Custom emoji marker
const makeIcon = (cat) => L.divIcon({
  html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6))">${emoji(cat)}</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Fly to location helper
function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], 13, { duration: 1 });
  }, [coords]);
  return null;
}

export default function MapPage() {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [flyTo, setFlyTo]       = useState(null);

  useEffect(() => {
    api.get('/events')
      .then(r => setEvents((r.data.events || []).filter(e => e.location?.lat && e.location?.lng)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F1F0F7', letterSpacing: '-0.025em' }}>Event Map</h1>
          <p style={{ fontSize: 13, color: '#6E6893', marginTop: 2 }}>
            {loading ? 'Loading events…' : `${events.length} event${events.length !== 1 ? 's' : ''} on the map`}
          </p>
        </div>
      </div>

      {/* Map */}
      <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #2D2653', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', height: 420, position: 'relative' }}>
        <MapContainer
          center={[20.2961, 85.8245]}
          zoom={5}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {flyTo && <FlyTo coords={flyTo} />}
          {events.map(ev => (
            <Marker
              key={ev._id}
              position={[ev.location.lat, ev.location.lng]}
              icon={makeIcon(ev.category)}
              eventHandlers={{
                click: () => { setSelected(ev); setFlyTo({ lat: ev.location.lat, lng: ev.location.lng }); }
              }}
            >
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>{emoji(ev.category)} {ev.title}</p>
                  <p style={{ fontSize: 12, color: '#666', margin: '2px 0' }}>
                    📅 {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {ev.timeSlot ? ` · ${ev.timeSlot}` : ''}
                  </p>
                  {ev.location?.city && <p style={{ fontSize: 12, color: '#666', margin: '2px 0' }}>📍 {ev.location.city}</p>}
                  <p style={{ fontSize: 12, color: '#666', margin: '2px 0' }}>
                    👥 {ev.participants?.length || 0}/{ev.maxParticipants}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,11,33,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 20, zIndex: 1000 }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(124,58,237,0.2)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.65s linear infinite' }} />
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, background: '#1A1535', borderRadius: 16, border: '1px solid #2D2653', padding: '12px 16px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#6E6893', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Legend</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {Object.entries(CATEGORY_EMOJI).filter(([k]) => k !== 'default').map(([cat, em]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 16 }}>{em}</span>
              <span style={{ fontSize: 12, color: '#A8A3C7', textTransform: 'capitalize' }}>{cat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Event list */}
      {events.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6E6893', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>All Events</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.map(ev => (
              <motion.div key={ev._id} whileTap={{ scale: 0.98 }}
                onClick={() => { setSelected(ev); setFlyTo({ lat: ev.location.lat, lng: ev.location.lng }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: selected?._id === ev._id ? 'rgba(124,58,237,0.1)' : '#1A1535', border: `1px solid ${selected?._id === ev._id ? 'rgba(124,58,237,0.3)' : '#2D2653'}`, borderRadius: 14, padding: '10px 14px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{emoji(ev.category)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#F1F0F7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</p>
                  <p style={{ fontSize: 12, color: '#6E6893', marginTop: 1 }}>
                    {ev.location?.city || 'Unknown'} · {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <span style={{ fontSize: 11, color: '#6E6893', flexShrink: 0 }}>{ev.participants?.length || 0}/{ev.maxParticipants}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && !loading && (
        <div style={{ marginTop: 16, background: '#1A1535', borderRadius: 16, border: '1px solid #2D2653', padding: '32px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 16, color: '#A8A3C7' }}>No events with location data yet</p>
          <p style={{ fontSize: 13, color: '#6E6893', marginTop: 4 }}>Create an event with a city to see it on the map</p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .leaflet-container { background: #1a1535; }`}</style>
    </AppLayout>
  );
}
