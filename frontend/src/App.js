import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SmoothScrollProvider } from './providers/SmoothScrollProvider';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import VerifyOtpPage    from './pages/VerifyOtpPage';
import VerifyIdPage     from './pages/VerifyIdPage';
import SetupProfilePage from './pages/SetupProfilePage';
import DashboardPage    from './pages/DashboardPage';
import MatchPage        from './pages/MatchPage';
import ChatListPage     from './pages/ChatListPage';
import ChatRoomPage     from './pages/ChatRoomPage';
import EventsPage       from './pages/EventsPage';
import ProfilePage      from './pages/ProfilePage';

const pv = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 28 } },
  exit:    { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.18 } },
};
const PW = ({ children }) => (
  <motion.div variants={pv} initial="initial" animate="animate" exit="exit" style={{ height: '100%' }}>
    {children}
  </motion.div>
);

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/login"         element={<PublicRoute><PW><LoginPage /></PW></PublicRoute>} />
        <Route path="/register"      element={<PublicRoute><PW><RegisterPage /></PW></PublicRoute>} />

        {/* Semi-protected (token optional) */}
        <Route path="/verify-otp"    element={<PW><VerifyOtpPage /></PW>} />
        <Route path="/verify-id"     element={<ProtectedRoute><PW><VerifyIdPage /></PW></ProtectedRoute>} />
        <Route path="/setup-profile" element={<ProtectedRoute><PW><SetupProfilePage /></PW></ProtectedRoute>} />

        {/* Protected */}
        <Route path="/dashboard"     element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/match"         element={<ProtectedRoute><MatchPage /></ProtectedRoute>} />
        <Route path="/chats"         element={<ProtectedRoute><ChatListPage /></ProtectedRoute>} />
        <Route path="/chat/:chatId"  element={<ProtectedRoute><ChatRoomPage /></ProtectedRoute>} />
        <Route path="/events"        element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
        <Route path="/profile"       element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Redirects */}
        <Route path="/"              element={<Navigate to="/dashboard" replace />} />
        <Route path="*"              element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <SmoothScrollProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <AnimatedRoutes />
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: '#1A1535', color: '#F1F0F7',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 1px rgba(124,58,237,0.2)',
                  borderRadius: '14px', border: '1px solid #2D2653',
                  padding: '12px 20px', fontSize: '14px', fontWeight: 500, fontFamily: 'Inter, sans-serif',
                },
                success: { iconTheme: { primary: '#34D399', secondary: '#0F0B21' } },
                error:   { iconTheme: { primary: '#F87171', secondary: '#0F0B21' } },
                duration: 3000,
              }}
            />
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </SmoothScrollProvider>
  );
}
