// src/components/ui/BottomNav.jsx
import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Sparkles, Calendar, MessageCircle, User, Map } from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: Home,          label: 'Home'    },
  { to: '/match',     icon: Sparkles,       label: 'Match'   },
  { to: '/map',       icon: Map,            label: 'Map',  center: true },
  { to: '/events',    icon: Calendar,       label: 'Events'  },
  { to: '/chats',     icon: MessageCircle,  label: 'Chats'   },
];

const BottomNav = memo(function BottomNav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      height: 64,
      paddingBottom: 'env(safe-area-inset-bottom)',
      background: 'rgba(15,11,33,0.9)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid #2D2653',
      display: 'flex', alignItems: 'center',
      maxWidth: 480, margin: '0 auto',
    }}>
      {NAV.map(({ to, icon: Icon, label, center }) => (
        <NavLink key={to} to={to} style={{ flex: 1, textDecoration: 'none' }}>
          {({ isActive }) => center ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingBottom: 6 }}>
              <motion.div
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                style={{
                  width: 48, height: 48, borderRadius: 16,
                  background: isActive
                    ? 'linear-gradient(135deg, #7C3AED, #2DD4BF)'
                    : 'linear-gradient(135deg, #2D2653, #1A1535)',
                  border: isActive ? 'none' : '1.5px solid #433B72',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  boxShadow: isActive ? '0 4px 20px rgba(124,58,237,0.5)' : '0 2px 8px rgba(0,0,0,0.4)',
                  cursor: 'pointer', marginTop: -10,
                }}
              >
                <Icon size={20} color={isActive ? 'white' : '#6E6893'} strokeWidth={isActive ? 2 : 1.5} />
                <span style={{ fontSize: 9, fontWeight: 600, color: isActive ? 'white' : '#6E6893', letterSpacing: '0.02em' }}>Map</span>
              </motion.div>
            </div>
          ) : (
            <motion.div
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, paddingTop: 10, paddingBottom: 6, cursor: 'pointer' }}
            >
              <Icon size={20} color={isActive ? '#2DD4BF' : '#6E6893'} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 400, color: isActive ? '#2DD4BF' : '#6E6893', letterSpacing: '0.02em' }}>
                {label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-dot"
                  style={{ width: 4, height: 4, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #2DD4BF)', marginTop: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.div>
          )}
        </NavLink>
      ))}
    </nav>
  );
});

export default BottomNav;
