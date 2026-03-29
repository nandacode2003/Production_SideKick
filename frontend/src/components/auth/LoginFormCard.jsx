import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedInput from './AnimatedInput';
import GradientButton from './GradientButton';

export default function LoginFormCard({
  onSubmit, loading, error, emailValue, passwordValue,
  onEmailChange, onPasswordChange, scooterShake,
}) {
  const [remember, setRemember] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.1 }}
      style={{
        width: '100%',
        maxWidth: 420,
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: '40px 36px',
        position: 'relative',
        zIndex: 20,
      }}
    >
      {/* Animated border glow */}
      <style>{`
        @keyframes borderGlow {
          0%,100% { box-shadow: 0 0 30px rgba(139,92,246,0.15), 0 0 0 1px rgba(139,92,246,0.2); }
          33%      { box-shadow: 0 0 30px rgba(6,182,212,0.15),  0 0 0 1px rgba(6,182,212,0.2); }
          66%      { box-shadow: 0 0 30px rgba(255,107,107,0.15),0 0 0 1px rgba(255,107,107,0.2); }
        }
        @keyframes waveHand {
          0%,100% { transform: rotate(0deg); }
          25%      { transform: rotate(-10deg); }
          75%      { transform: rotate(20deg); }
        }
        @keyframes underlineSlide {
          from { width: 0; }
          to   { width: 100%; }
        }
        .signup-link { position: relative; display: inline-block; }
        .signup-link::after {
          content: '';
          position: absolute;
          bottom: -1px; left: 0;
          height: 1px;
          background: linear-gradient(to right, #8B5CF6, #FF6B6B);
          width: 0;
          transition: width 0.3s ease;
        }
        .signup-link:hover::after { width: 100%; }
        .form-card-inner { animation: borderGlow 8s ease-in-out infinite; border-radius: 24px; }
      `}</style>

      <div className="form-card-inner" style={{ borderRadius: 24 }}>
        {/* Title */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
            Welcome Back{' '}
            <motion.span
              animate={{ rotate: [-10, 20, -10, 20, 0] }}
              transition={{ duration: 1.2, delay: 0.5, ease: 'easeInOut' }}
              style={{ display: 'inline-block', transformOrigin: '70% 70%' }}
            >
              👋
            </motion.span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 6 }}>
            Sign in to find your SideKick
          </p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'rgba(255,107,107,0.12)',
                border: '1px solid rgba(255,107,107,0.25)',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 16,
                color: '#FF6B6B',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inputs */}
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AnimatedInput
            label="Email address"
            type="email"
            value={emailValue}
            onChange={onEmailChange}
            icon="📧"
            placeholder="you@email.com"
            required
          />
          <AnimatedInput
            label="Password"
            type="password"
            value={passwordValue}
            onChange={onPasswordChange}
            icon="🔒"
            placeholder="••••••••"
            required
          />

          {/* Remember + Forgot */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <motion.div
                onClick={() => setRemember(r => !r)}
                whileTap={{ scale: 0.85 }}
                style={{
                  width: 18, height: 18, borderRadius: 5,
                  border: `2px solid ${remember ? '#8B5CF6' : 'rgba(255,255,255,0.2)'}`,
                  background: remember ? '#8B5CF6' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', cursor: 'pointer',
                }}
              >
                {remember && <span style={{ color: 'white', fontSize: 11, fontWeight: 900 }}>✓</span>}
              </motion.div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Remember me</span>
            </label>
            <button type="button" style={{ background: 'none', border: 'none', color: '#8B5CF6', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <div style={{ marginTop: 4 }}>
            <GradientButton type="submit" loading={loading}>
              Let's Ride! 🛵
            </GradientButton>
          </div>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Social buttons — Google only */}
        <motion.button
          whileHover={{ scale: 1.03, background: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.96 }}
          style={{
            width: '100%', height: 44, borderRadius: 12,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.2s',
          }}
        >
          {/* Google SVG icon */}
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.1C9.5 35.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.2 5.2C41.1 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-3.9z"/>
          </svg>
          Continue with Google
        </motion.button>

        {/* Sign up link */}
        <p style={{ textAlign: 'center', marginTop: 20, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          New here?{' '}
          <Link
            to="/register"
            className="signup-link"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6, #FF6B6B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Sign Up →
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
