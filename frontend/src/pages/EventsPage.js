// src/pages/EventsPage.js
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../layouts/AppLayout';
import { EmptyState, SkeletonList, CategoryChip, TabBar, PageHeader, GradientButton } from '../components/ui/UIKit';
import api from '../utils/api';

const sp = { type: 'spring', stiffness: 300, damping: 28 };
const CATEGORIES = ['All', 'movie', 'sports', 'food', 'music', 'hangout', 'study'];
const TABS = [{ key: 'browse', label: 'Browse' }, { key: 'mine', label: 'My Events' }];

function EventCard({ event, joined, onJoin, showJoin, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay }}
      whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(124,58,237,0.08)' }}
      style={{ background: '#1A1535', borderRadius: 20, border: '1px solid #2D2653', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', padding: 16, position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.25s ease' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #7C3AED, #2DD4BF)', borderRadius: '20px 20px 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, paddingRight: 8 }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#F1F0F7' }}>{event.title}</p>
          {event.description && <p style={{ fontSize: 13, color: '#A8A3C7', marginTop: 3, lineHeight: 1.5 }}>{event.description}</p>}
        </div>
        <span style={{ padding: '2px 10px', borderRadius: 20, background: 'rgba(124,58,237,0.15)', color: '#7C3AED', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0, border: '1px solid rgba(124,58,237,0.2)' }}>
          {event.category}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={13} color="#6E6893" />
          <span style={{ fontSize: 13, color: '#A8A3C7' }}>{new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {event.time}</span>
        </div>
        {event.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={13} color="#6E6893" />
            <span style={{ fontSize: 13, color: '#A8A3C7' }}>{event.city}{event.location ? `, ${event.location}` : ''}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Users size={13} color="#6E6893" />
          <span style={{ fontSize: 13, color: '#A8A3C7' }}>{event.participants?.length || 0}/{event.maxParticipants}</span>
        </div>
      </div>
      {event.creator && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #2DD4BF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>
            {event.creator.name?.[0]}
          </div>
          <span style={{ fontSize: 12, color: '#6E6893' }}>by {event.creator.name}</span>
        </div>
      )}
      {showJoin && event.status === 'upcoming' && (
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => !joined.has(event._id) && onJoin(event._id)} disabled={joined.has(event._id)}
          style={{ marginTop: 14, width: '100%', height: 40, background: 'transparent', color: joined.has(event._id) ? '#34D399' : '#2DD4BF', border: `1.5px solid ${joined.has(event._id) ? 'rgba(52,211,153,0.3)' : '#2DD4BF'}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: joined.has(event._id) ? 'default' : 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}>
          {joined.has(event._id) ? 'Joined ✓' : 'Join Event'}
        </motion.button>
      )}
      {event.status === 'cancelled' && (
        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: '#6E6893', padding: '8px', background: '#231E42', borderRadius: 8 }}>Event cancelled</div>
      )}
    </motion.div>
  );
}

export default function EventsPage() {
  const [events, setEvents]         = useState([]);
  const [myEvents, setMyEvents]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('browse');
  const [category, setCategory]     = useState('All');
  const [joined, setJoined]         = useState(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'hangout', date: '', time: 'evening', city: '', location: '', maxParticipants: 5 });
  const [creating, setCreating]     = useState(false);

  const fetchEvents = () => {
    const params = {};
    if (category !== 'All') params.category = category;
    api.get('/events', { params }).then(r => setEvents(r.data.events || [])).catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    fetchEvents();
    api.get('/events/my/created').then(r => setMyEvents(r.data.events || [])).catch(() => {});
    api.get('/events/my/joined').then(r => {
      const ids = new Set((r.data.events || []).map(e => e._id));
      setJoined(ids);
    }).catch(() => {});
    setLoading(false);
  }, [category]);

  const joinEvent = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/join`);
      setJoined(j => new Set([...j, eventId]));
      fetchEvents();
      toast.success('Joined event!');
    } catch (err) { toast.error(err.response?.data?.message || 'Could not join event'); }
  };

  const createEvent = async () => {
    if (!form.title || !form.date || !form.city || !form.location) return toast.error('Title, date, city and location are required');
    setCreating(true);
    try {
      await api.post('/events', form);
      setShowCreate(false);
      setForm({ title: '', description: '', category: 'hangout', date: '', time: 'evening', city: '', location: '', maxParticipants: 5 });
      fetchEvents();
      toast.success('Event created! 🎉');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create event'); }
    finally { setCreating(false); }
  };

  const inputStyle = { width: '100%', height: 44, background: '#2D2653', border: '1.5px solid #433B72', borderRadius: 12, padding: '0 14px', color: '#F1F0F7', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none' };

  return (
    <AppLayout>
      <PageHeader title="Events" subtitle="Find things to do together"
        rightAction={
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowCreate(!showCreate)}
            style={{ height: 36, padding: '0 14px', background: showCreate ? '#2D2653' : 'linear-gradient(135deg, #7C3AED, #2DD4BF)', color: showCreate ? '#A8A3C7' : 'white', border: showCreate ? '1px solid #433B72' : 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6, boxShadow: showCreate ? 'none' : '0 4px 16px rgba(124,58,237,0.3)' }}>
            {showCreate ? <X size={14} /> : <Plus size={14} />}
            {showCreate ? 'Cancel' : 'Create'}
          </motion.button>
        }
      />

      <AnimatePresence>
        {showCreate && (
          <motion.div key="create-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ background: '#1A1535', borderRadius: 20, border: '1px solid #2D2653', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', padding: 20 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#F1F0F7', marginBottom: 14 }}>Create Event</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input style={inputStyle} placeholder="Event title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                <textarea style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'none' }} placeholder="Description (optional)" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {['movie','sports','food','music','hangout','study'].map(c => <option key={c} value={c} style={{ background: '#1A1535' }}>{c}</option>)}
                  </select>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}>
                    {['morning','afternoon','evening','night'].map(s => <option key={s} value={s} style={{ background: '#1A1535' }}>{s}</option>)}
                  </select>
                </div>
                <input style={inputStyle} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} min={new Date().toISOString().split('T')[0]} />
                <input style={inputStyle} placeholder="City *" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                <input style={inputStyle} placeholder="Venue / Location *" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                <input style={inputStyle} type="number" placeholder="Max participants (2-20)" min={2} max={20} value={form.maxParticipants} onChange={e => setForm({ ...form, maxParticipants: Number(e.target.value) })} />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={createEvent} disabled={creating}
                  style={{ height: 44, background: 'linear-gradient(135deg, #7C3AED, #2DD4BF)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
                  {creating ? <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.65s linear infinite', display: 'inline-block' }} /> : 'Create Event'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <AnimatePresence mode="wait">
        {tab === 'browse' && (
          <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, scrollbarWidth: 'none' }}>
              {CATEGORIES.map(c => <CategoryChip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />)}
            </div>
            {loading ? <SkeletonList count={3} height={160} /> :
              events.length === 0 ? (
                <EmptyState icon={Calendar} title="No events found" subtitle="Be the first to create one!" action="Create Event" onAction={() => setShowCreate(true)} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {events.map((e, i) => <EventCard key={e._id} event={e} joined={joined} onJoin={joinEvent} showJoin delay={i * 0.06} />)}
                </div>
              )
            }
          </motion.div>
        )}
        {tab === 'mine' && (
          <motion.div key="mine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {myEvents.length === 0 ? (
              <EmptyState icon={Calendar} title="No events yet" subtitle="Join or create an event to see it here" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {myEvents.map((e, i) => <EventCard key={e._id} event={e} joined={joined} onJoin={joinEvent} showJoin={false} delay={i * 0.06} />)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
