import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!user) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      return;
    }
    const token = localStorage.getItem('token');
    socketRef.current = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current.on('connect_error', (err) => console.warn('Socket error:', err.message));
    return () => { socketRef.current?.disconnect(); socketRef.current = null; };
  }, [user]);

  const emitSendMessage  = (chatId, text)  => socketRef.current?.emit('send-message', { chatId, text });
  const emitTyping       = (chatId)        => socketRef.current?.emit('typing', { chatId });
  const emitStopTyping   = (chatId)        => socketRef.current?.emit('stop-typing', { chatId });
  const emitMarkRead     = (chatId)        => socketRef.current?.emit('mark-read', { chatId });

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers, emitSendMessage, emitTyping, emitStopTyping, emitMarkRead }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
