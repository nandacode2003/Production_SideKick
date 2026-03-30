// src/pages/ChatListPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MessageCircle } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import { EmptyState, SkeletonList, Avatar, PageHeader } from '../components/ui/UIKit';
import api from '../utils/api';

const sp = { type: 'spring', stiffness: 300, damping: 28 };

function ChatRow({ room, index, total, formatTime, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
      transition={{ ...sp, delay: index * 0.05 }}
      whileTap={{ scale: 0.99 }} onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', borderBottom: index < total - 1 ? '1px solid #2D2653' : 'none', minHeight: 72, background: hovered ? '#231E42' : 'transparent', transition: 'background 0.15s' }}>
      <Avatar name={room.other?.name} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#F1F0F7' }}>{room.other?.name || 'SideKick'}</p>
          <span style={{ fontSize: 12, color: '#6E6893', flexShrink: 0, marginLeft: 8 }}>{formatTime(room.lastMessage?.createdAt)}</span>
        </div>
        <p style={{ fontSize: 13, color: '#6E6893', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {room.lastMessage?.content || 'Start the conversation!'}
        </p>
      </div>
    </motion.div>
  );
}

export default function ChatListPage() {
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/chats/rooms').then(r => setRooms(r.data.rooms || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = rooms.filter(r => r.other?.name?.toLowerCase().includes(search.toLowerCase()));

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (Date.now() - d < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return 'Yesterday';
  };

  return (
    <AppLayout>
      <PageHeader title="Messages" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: 0.08 }}
        style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} color="#6E6893" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder="Search conversations..."
          style={{ width: '100%', height: 44, background: focused ? '#362F5E' : '#2D2653', border: `1.5px solid ${focused ? '#7C3AED' : '#433B72'}`, borderRadius: 14, paddingLeft: 40, paddingRight: 14, fontSize: 14, color: '#F1F0F7', fontFamily: 'Inter, sans-serif', outline: 'none', boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.3)' : 'none', transition: 'all 0.25s ease' }}
        />
      </motion.div>

      {loading && <SkeletonList count={4} height={72} />}

      {!loading && filtered.length === 0 && (
        <EmptyState icon={MessageCircle} title="No messages yet" subtitle="Match with someone to start chatting" action="Find Matches" onAction={() => navigate('/match')} />
      )}

      {!loading && filtered.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ background: '#1A1535', borderRadius: 20, border: '1px solid #2D2653', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
          {filtered.map((room, i) => (
            <ChatRow key={room.roomId} room={room} index={i} total={filtered.length} formatTime={formatTime} onClick={() => navigate(`/chat/${room.roomId}`)} />
          ))}
        </motion.div>
      )}
    </AppLayout>
  );
}
