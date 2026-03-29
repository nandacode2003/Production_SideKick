// src/pages/DashboardPage.js
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Sparkles, Calendar, MessageCircle, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../layouts/AppLayout';
import { SkeletonList, StatCard, ActionRow, ActionCard, GradientText } from '../components/ui/UIKit';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import api from '../utils/api';

const sp = { type: 'spring', stiffness: 300, damping: 28 };

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState({ matches: 0, events: 0 });
  const [loadingPending, setLoadingPending] = useState(true);
  const [heroPlayed, setHeroPlayed] = useState(false);
  const actionsRef = useRef(null);
  useScrollAnimation(actionsRef, { from: { y: 40, opacity: 0 }, to: { y: 0, opacity: 1 }, stagger: 0.08 });

  useEffect(() => {
    api.get('/dashboard/stats').then(r => {
      setStats({ matches: r.data.activeMatches || 0, events: r.data.eventsJoined || 0 });
    }).catch(() => {});
    api.get('/matches/pending').then(r => setPending(r.data || [])).catch(() => {}).finally(() => setLoadingPending(false));
    setTimeout(() => setHeroPlayed(true), 2200);
  }, []);

  const respond = async (matchId, action) => {
    try {
      await api.post(`/matches/${matchId}/${action}`);
      setPending(p => p.filter(m => m._id !== matchId));
      if (action === 'accept') {
        setStats(s => ({ ...s, matches: s.matches + 1 }));
        toast.success('Match accepted! 🎉');
      } else {
        toast.success('Request declined');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
    { icon: Sparkles,      title: 'Find Companions',  sub: 'See your matches',           to: '/match'   },
    { icon: Calendar,      title: 'Browse Events',    sub: 'Discover activities nearby', to: '/events'  },
    { icon: MessageCircle, title: 'Messages',         sub: 'Chat with your SideKicks',   to: '/chats'   },
  ];

  return (
    <AppLayout>
      {/* Cinematic hero */}
      <div style={{ marginBottom: 28, overflow: 'hidden' }}>
        {!heroPlayed ? (
          <div style={{ height: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <motion.div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                style={{ fontSize: 22, fontWeight: 400, color: '#A8A3C7' }}>Find your</motion.span>
              <motion.span initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.6 }}
                style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #7C3AED, #2DD4BF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                SideKick.
              </motion.span>
            </motion.div>
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 1.2, ease: 'easeOut' }}
              style={{ height: 1, background: '#2D2653', width: '60%', transformOrigin: 'left', marginTop: 10 }} />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={sp}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F1F0F7', letterSpacing: '-0.025em' }}>
              Hey, {firstName}
            </h1>
            {user?.city && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <MapPin size={13} color="#6E6893" />
                <span style={{ fontSize: 13, color: '#6E6893' }}>{user.city}</span>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: 0.1 }}
        style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <StatCard label="Active Matches" value={stats.matches} icon={Sparkles} gradient="purple-teal" onClick={() => navigate('/match')} />
        <StatCard label="Events Joined"  value={stats.events}  icon={Calendar}  gradient="rose-amber"  onClick={() => navigate('/events')} />
      </motion.div>

      {/* Pending requests */}
      {loadingPending ? (
        <SkeletonList count={2} height={68} />
      ) : pending.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: 0.2 }} style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6E6893', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Requests ({pending.length})
          </p>
          <div style={{ background: '#1A1535', borderRadius: 16, border: '1px solid #2D2653', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            {pending.map((match, i) => (
              <div key={match._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < pending.length - 1 ? '1px solid #2D2653' : 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #2DD4BF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {match.users?.find(u => u._id !== match.initiator)?.name?.[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#F1F0F7' }}>{match.users?.find(u => u._id !== match.initiator)?.name}</p>
                  <p style={{ fontSize: 12, color: '#6E6893', marginTop: 1 }}>{match.users?.find(u => u._id !== match.initiator)?.vibe || 'Wants to connect'}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => respond(match._id, 'reject')}
                    style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => respond(match._id, 'accept')}
                    style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={14} />
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: 0.3 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#6E6893', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Get started</p>
        <ActionCard>
          <div ref={actionsRef}>
            {ACTIONS.map(({ icon, title, sub, to }, i) => (
              <ActionRow key={to} icon={icon} title={title} subtitle={sub} onClick={() => navigate(to)} divider={i < ACTIONS.length - 1} />
            ))}
          </div>
        </ActionCard>
      </motion.div>

      {/* Quote */}
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }}
        style={{ textAlign: 'center', marginTop: 32, fontSize: 14, fontStyle: 'italic', fontWeight: 400 }}>
        <GradientText gradient="purple-teal">"Your next adventure is one match away"</GradientText>
      </motion.p>
    </AppLayout>
  );
}
