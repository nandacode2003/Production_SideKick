// src/pages/MapPage.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import ReactMapGL, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Users, Layers } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import api from '../utils/api';
import AppLayout from '../layouts/AppLayout';

const TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Category → emoji mapping
const CATEGORY_EMOJI = {
  movie:   '🎬',
  sports:  '⚽',
  food:    '🍜',
  music:   '🎵',
  hangout: '☕',
  study:   '📚',
  drive:     '🛣️',
  rideshare: '🚗',
  travel:    '✈️',
  gaming:    '🎮',
  art:       '🎨',
  default:   '📍',
};

// Geocode a city name → [lng, lat] using Mapbox Geocoding API
async function geocodeCity(city) {
  if (!city) return null;
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?access_token=${TOKEN}&limit=1`
    );
    const data = await res.json();
    if (data.features?.length) {
      const [lng, lat] = data.features[0].center;
      return { lng, lat };
    }
  } catch (_) {}
  return null;
}

const STYLE_OPTIONS = [
  { label: 'Dark',      value: 'mapbox://styles/mapbox/dark-v11'      },
  { label: 'Streets',   value: 'mapbox://styles/mapbox/streets-v12'   },
  { label: 'Satellite', value: 'mapbox://styles/mapbox/satellite-street-v12' },
];

export default function MapPage() {
  const [events, setEvents]         = useState([]);
  const [mapped, setMapped]         = useState([]);   // events with coords
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [styleIdx, setStyleIdx]     = useState(0);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [viewState, setViewState]   = useState({ longitude: 78.9629, latitude: 20.5937, zoom: 4 });
  const mapRef = useRef(null);

  // Fetch events then geocode each one
  useEffect(() => {
    api.get('/events')
      .then(r => setEvents(r.data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!events.length) return;
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        events.map(async ev => {
          // Use stored coords if available
          if (ev.location?.lat && ev.location?.lng) {
            return { ...ev, coords: { lat: ev.location.lat, lng: ev.location.lng } };
          }
          const city = ev.location?.city || ev.location?.venue;
          if (!city) return null;
          const coords = await geocodeCity(city);
          return coords ? { ...ev, coords } : null;
        })
      );
      if (!cancelled) setMapped(results.filter(Boolean));
    })();
    return () => { cancelled = true; };
  }, [events]);

  const flyTo = useCallback((lng, lat) => {
    setViewState(v => ({ ...v, longitude: lng, latitude: lat, zoom: 13, transitionDuration: 800 }));
  }, []);

  const emoji = (cat) => CATEGORY_EMOJI[cat?.toLowerCase()] || CATEGORY_EMOJI.default;

  return (
    <AppLayout>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F1F0F7', letterSpacing: '-0.025em' }}>Event Map</h1>
          <p style={{ fontSize: 13, color: '#6E6893', marginTop: 2 }}>
            {loading ? 'Loading events…' : `${mapped.length} event${mapped.length !== 1 ? 's' : ''} on the map`}
          </p>
        </div>

        {/* Map style switcher */}
        <div style={{ position: 'relative' }}>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setShowStyleMenu(s => !s)}
            style={{ height: 36, width: 36, borderRadius: 10, background: '#1A1535', border: '1px solid #2D2653', color: '#A8A3C7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Layers size={16} />
          </motion.button>
          <AnimatePresence>
            {showStyleMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{ position: 'absolute', right: 0, top: 42, background: '#1A1535', border: '1px solid #2D2653', borderRadius: 12, overflow: 'hidden', zIndex: 100, minWidth: 130, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
              >
                {STYLE_OPTIONS.map((opt, i) => (
                  <button key={opt.value} onClick={() => { setStyleIdx(i); setShowStyleMenu(false); }}
                    style={{ display: 'block', width: '100%', padding: '10px 16px', background: styleIdx === i ? 'rgba(124,58,237,0.15)' : 'transparent', border: 'none', color: styleIdx === i ? '#7C3AED' : '#A8A3C7', fontSize: 13, fontWeight: styleIdx === i ? 600 : 400, cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif' }}>
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Map container */}
      <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #2D2653', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', height: 420, position: 'relative' }}>
        <ReactMapGL
          ref={mapRef}
          {...viewState}
          style={{ width: '100%', height: '100%' }}
          onMove={e => setViewState(e.viewState)}
          mapStyle={STYLE_OPTIONS[styleIdx].value}
          mapboxAccessToken={TOKEN}
          onClick={() => setSelected(null)}
        >
          <NavigationControl style={{ top: 10, right: 10 }} showCompass={false} />
          <GeolocateControl style={{ top: 50, right: 10 }} trackUserLocation />

          {mapped.map(ev => (
            <Marker
              key={ev._id}
              longitude={ev.coords.lng}
              latitude={ev.coords.lat}
              anchor="bottom"
              onClick={e => { e.originalEvent?.stopPropagation(); setSelected(ev); flyTo(ev.coords.lng, ev.coords.lat); }}
            >
              <motion.div
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
              >
                <div style={{
                  fontSize: 28,
                  filter: selected?._id === ev._id
                    ? 'drop-shadow(0 0 8px rgba(124,58,237,0.9))'
                    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
                  transition: 'filter 0.2s',
                }}>
                  {emoji(ev.category)}
                </div>
                {/* Dot below emoji */}
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: selected?._id === ev._id ? '#7C3AED' : '#2DD4BF', boxShadow: '0 0 6px rgba(45,212,191,0.6)' }} />
              </motion.div>
            </Marker>
          ))}

          {/* Popup */}
          <AnimatePresence>
            {selected && (
              <Popup
                longitude={selected.coords.lng}
                latitude={selected.coords.lat}
                anchor="top"
                closeButton={false}
                closeOnClick={false}
                offset={20}
                style={{ zIndex: 10 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  style={{ background: '#1A1535', borderRadius: 14, border: '1px solid #2D2653', padding: '12px 14px', minWidth: 200, maxWidth: 240, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', position: 'relative' }}
                >
                  {/* Close */}
                  <button onClick={() => setSelected(null)}
                    style={{ position: 'absolute', top: 8, right: 8, background: '#2D2653', border: 'none', borderRadius: 6, width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A8A3C7' }}>
                    <X size={12} />
                  </button>

                  {/* Emoji + title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingRight: 24 }}>
                    <span style={{ fontSize: 22 }}>{emoji(selected.category)}</span>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#F1F0F7', lineHeight: 1.3 }}>{selected.title}</p>
                  </div>

                  {/* Category badge */}
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: 'rgba(124,58,237,0.15)', color: '#7C3AED', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid rgba(124,58,237,0.2)', marginBottom: 8 }}>
                    {selected.category}
                  </span>

                  {/* Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {selected.location?.city && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MapPin size={11} color="#6E6893" />
                        <span style={{ fontSize: 12, color: '#A8A3C7' }}>
                          {selected.location.city}{selected.location.venue ? ` · ${selected.location.venue}` : ''}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Calendar size={11} color="#6E6893" />
                      <span style={{ fontSize: 12, color: '#A8A3C7' }}>
                        {new Date(selected.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {selected.timeSlot}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Users size={11} color="#6E6893" />
                      <span style={{ fontSize: 12, color: '#A8A3C7' }}>
                        {selected.participants?.length || 0}/{selected.maxParticipants} joined
                      </span>
                    </div>
                    {selected.description && (
                      <p style={{ fontSize: 12, color: '#6E6893', marginTop: 2, lineHeight: 1.5, borderTop: '1px solid #2D2653', paddingTop: 6 }}>
                        {selected.description}
                      </p>
                    )}
                  </div>

                  {/* Join button */}
                  {selected.isOpen && (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => api.post(`/events/${selected._id}/join`).catch(() => {})}
                      style={{ marginTop: 10, width: '100%', height: 34, background: 'linear-gradient(135deg, #7C3AED, #2DD4BF)', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                    >
                      Join Event
                    </motion.button>
                  )}
                </motion.div>
              </Popup>
            )}
          </AnimatePresence>
        </ReactMapGL>

        {/* Loading overlay */}
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,11,33,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}>
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

      {/* Event list below map */}
      {mapped.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6E6893', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>All Events</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mapped.map(ev => (
              <motion.div
                key={ev._id}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setSelected(ev); flyTo(ev.coords.lng, ev.coords.lat); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: selected?._id === ev._id ? 'rgba(124,58,237,0.1)' : '#1A1535', border: `1px solid ${selected?._id === ev._id ? 'rgba(124,58,237,0.3)' : '#2D2653'}`, borderRadius: 14, padding: '10px 14px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .mapboxgl-popup-content { background: transparent !important; padding: 0 !important; box-shadow: none !important; border: none !important; } .mapboxgl-popup-tip { display: none !important; }`}</style>
    </AppLayout>
  );
}
