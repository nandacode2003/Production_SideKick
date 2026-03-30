// src/pages/ProfilePage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, LogOut, ChevronRight, Edit2, Clock, Shield, Bell, Eye, HelpCircle, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../layouts/AppLayout';
import { Badge, GradientText } from '../components/ui/UIKit';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const sp = { type: 'spring', stiffness: 300, damping: 28 };
const INTERESTS = ['Movies','Cricket','Football','Food','Music','Books','Gaming','Adventure','Coffee','Travel','Dancing','Art'];

function SettingRow({ icon: Icon, label, sub, onClick, divider, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div whileTap={{ scale: 0.99 }} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer', minHeight: 56, background: hov ? (danger ? 'rgba(248,113,113,0.05)' : '#231E42') : 'transparent', borderBottom: divider ? '1px solid #2D2653' : 'none', transition: 'background 0.2s, transform 0.2s', transform: hov && !danger ? 'translateX(3px)' : 'translateX(0)' }}>
      {Icon && <Icon size={18} color={danger ? '#F87171' : '#2DD4BF'} strokeWidth={1.8} />}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: danger ? '#F87171' : '#F1F0F7' }}>{label}</p>
        {sub && <p style={{ fontSize: 13, color: '#6E6893', marginTop: 1 }}>{sub}</p>}
      </div>
      {!danger && <ChevronRight size={16} color={hov ? '#2DD4BF' : '#4A4570'} style={{ transition: 'color 0.2s', flexShrink: 0 }} />}
    </motion.div>
  );
}

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio: user?.bio || '', city: user?.location?.city || '', interests: user?.interests || [], vibeTag: user?.vibeTag || '' });
  const [saving, setSaving] = useState(false);

  const toggleInterest = (i) => setForm(f => ({ ...f, interests: f.interests.includes(i) ? f.interests.filter(x => x !== i) : [...f.interests, i] }));

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', { bio: form.bio, location: { city: form.city }, interests: form.interests, vibeTag: form.vibeTag });
      updateUser(data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };
  const safetyScore = user?.safetyScore ?? 100;

  const SETTINGS = [
    { icon: Clock,       label: 'Availability',    sub: 'Set your schedule',        onClick: () => navigate('/setup-profile') },
    { icon: Shield,      label: 'Safety Circle',   sub: 'Manage trusted contacts',  onClick: () => {} },
    { icon: Bell,        label: 'Notifications',   sub: 'Manage alerts',            onClick: () => {} },
    { icon: Eye,         label: 'Privacy',         sub: 'Control your data',        onClick: () => {} },
    { icon: Activity,    label: 'System Status',   sub: 'Check all services live',  onClick: () => navigate('/status') },
    { icon: HelpCircle,  label: 'Help & Support',  sub: 'Get assistance',           onClick: () => {} },
  ];

  const inputStyle = { width: '100%', background: '#2D2653', border: '1.5px solid #433B72', borderRadius: 12, padding: '10px 14px', color: '#F1F0F7', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none' };

  return (
    <AppLayout>
      {/* Profile header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={sp}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, paddingTop: 8 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #2DD4BF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700, color: 'white', boxShadow: '0 8px 32px rgba(124,58,237,0.3)', marginBottom: 12, animation: 'rotateGradient 6s linear infinite' }}>
          <style>{`@keyframes rotateGradient { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }`}</style>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F1F0F7', letterSpacing: '-0.02em' }}>{user?.name}</h2>
        <p style={{ fontSize: 14, color: '#6E6893', marginTop: 2 }}>{user?.email}</p>
        {user?.location?.city && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <MapPin size={13} color="#6E6893" />
            <span style={{ fontSize: 14, color: '#A8A3C7' }}>{user.location.city}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Badge type="id"   verified={user?.isIdVerified} />
          <Badge type="face" verified={user?.isFaceVerified} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '6px 14px', background: 'rgba(52,211,153,0.1)', borderRadius: 20, border: '1px solid rgba(52,211,153,0.2)' }}>
          <Shield size={14} color="#34D399" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#A8A3C7' }}>Safety Score: </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#34D399' }}>{safetyScore}/100</span>
        </div>
        {!editing && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setEditing(true)}
            style={{ marginTop: 14, height: 36, padding: '0 20px', background: '#2D2653', border: '1.5px solid #433B72', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#A8A3C7', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Edit2 size={14} color="#6E6893" /> Edit Profile
          </motion.button>
        )}
      </motion.div>

      {/* Edit form */}
      <AnimatePresence>
        {editing && (
          <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ background: '#1A1535', borderRadius: 20, border: '1px solid #2D2653', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#F1F0F7', marginBottom: 14 }}>Edit Profile</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={{ fontSize: 11, fontWeight: 700, color: '#6E6893', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Bio</label><textarea style={{ ...inputStyle, height: 'auto', resize: 'none' }} rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell others about yourself..." /></div>
              <div><label style={{ fontSize: 11, fontWeight: 700, color: '#6E6893', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>City</label><input style={inputStyle} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Your city" /></div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6E6893', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Interests</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {INTERESTS.map(i => (
                    <motion.button key={i} whileTap={{ scale: 0.93 }} onClick={() => toggleInterest(i)}
                      style={{ height: 32, padding: '0 14px', borderRadius: 20, border: `1.5px solid ${form.interests.includes(i) ? '#7C3AED' : '#433B72'}`, background: form.interests.includes(i) ? 'rgba(124,58,237,0.15)' : '#2D2653', color: form.interests.includes(i) ? '#7C3AED' : '#A8A3C7', fontSize: 13, fontWeight: form.interests.includes(i) ? 600 : 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}>
                      {i}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setEditing(false)}
                  style={{ flex: 1, height: 44, background: '#2D2653', border: '1.5px solid #433B72', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#A8A3C7', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={save} disabled={saving}
                  style={{ flex: 2, height: 44, background: 'linear-gradient(135deg, #7C3AED, #2DD4BF)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
                  {saving ? <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.65s linear infinite', display: 'inline-block' }} /> : 'Save Changes'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interests */}
      {!editing && user?.interests?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: 0.1 }}
          style={{ background: '#1A1535', borderRadius: 20, border: '1px solid #2D2653', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6E6893', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Interests</p>
            <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: '#2DD4BF', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Edit</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {user.interests.map(i => (
              <span key={i} style={{ padding: '5px 14px', borderRadius: 20, background: 'rgba(124,58,237,0.15)', color: '#7C3AED', fontSize: 13, fontWeight: 500, border: '1px solid rgba(124,58,237,0.25)' }}>{i}</span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Settings */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: 0.15 }}
        style={{ background: '#1A1535', borderRadius: 20, border: '1px solid #2D2653', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', overflow: 'hidden', marginBottom: 12 }}>
        {SETTINGS.map(({ icon, label, sub, onClick }, i) => (
          <SettingRow key={label} icon={icon} label={label} sub={sub} onClick={onClick} divider={i < SETTINGS.length - 1} />
        ))}
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: 0.2 }}
        style={{ background: '#1A1535', borderRadius: 20, border: '1px solid rgba(248,113,113,0.15)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <SettingRow icon={LogOut} label="Log Out" onClick={handleLogout} danger />
      </motion.div>
    </AppLayout>
  );
}
