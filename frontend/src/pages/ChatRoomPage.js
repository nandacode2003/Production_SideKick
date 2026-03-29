// src/pages/ChatRoomPage.js
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Avatar } from '../components/ui/UIKit';
import api from '../utils/api';

export default function ChatRoomPage() {
  const { chatId }  = useParams();
  const { user }    = useAuth();
  const { socket, emitTyping, emitStopTyping, emitMarkRead } = useSocket();
  const navigate    = useNavigate();

  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [typing, setTyping]       = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [focused, setFocused]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const bottomRef   = useRef();
  const typingTimer = useRef();

  useEffect(() => {
    api.get(`/chats/${chatId}/messages`)
      .then(r => {
        const msgs = r.data.messages || [];
        setMessages(msgs);
      })
      .catch(() => navigate('/chats'))
      .finally(() => setLoading(false));

    // Get other user from chat list
    api.get('/chats').then(r => {
      const chat = (r.data || []).find(c => c.chatId === chatId);
      if (chat?.otherUser) setOtherUser(chat.otherUser);
    }).catch(() => {});

    emitMarkRead(chatId);
  }, [chatId, navigate]);

  useEffect(() => {
    if (!socket) return;
    const onNewMessage = ({ chatId: cId, message }) => {
      if (cId === chatId) {
        setMessages(prev => [...prev, message]);
        emitMarkRead(chatId);
      }
    };
    const onTyping     = ({ chatId: cId }) => { if (cId === chatId) setTyping(true); };
    const onStopTyping = ({ chatId: cId }) => { if (cId === chatId) setTyping(false); };

    socket.on('new-message',       onNewMessage);
    socket.on('user-typing',       onTyping);
    socket.on('user-stop-typing',  onStopTyping);
    return () => {
      socket.off('new-message',      onNewMessage);
      socket.off('user-typing',      onTyping);
      socket.off('user-stop-typing', onStopTyping);
    };
  }, [socket, chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    clearTimeout(typingTimer.current);
    emitStopTyping(chatId);
    try {
      const { data } = await api.post(`/chats/${chatId}/messages`, { text });
      setMessages(prev => [...prev, data.message]);
    } catch {}
  }, [input, chatId, emitStopTyping]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    emitTyping(chatId);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitStopTyping(chatId), 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 480, margin: '0 auto', background: '#0F0B21' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ height: 56, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(15,11,33,0.9)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid #2D2653', position: 'sticky', top: 0, zIndex: 10 }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/chats')}
          style={{ width: 36, height: 36, borderRadius: 10, background: '#2D2653', border: '1px solid #433B72', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={18} color="#A8A3C7" />
        </motion.button>
        <Avatar name={otherUser?.name} size={36} />
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#F1F0F7' }}>{otherUser?.name || 'SideKick'}</p>
          <AnimatePresence>
            {typing && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ fontSize: 12, color: '#2DD4BF', fontWeight: 500 }}>typing...</motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
            <div style={{ width: 24, height: 24, border: '2px solid rgba(124,58,237,0.2)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.65s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const senderId = msg.sender?._id || msg.sender;
            const isMe = senderId?.toString() === user?._id?.toString();
            return (
              <motion.div key={msg._id || idx}
                initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <div style={{
                  maxWidth: '75%', padding: '10px 14px', fontSize: 14, lineHeight: 1.55,
                  background: isMe ? 'linear-gradient(135deg, #7C3AED, #6D28D9)' : '#1A1535',
                  border: isMe ? 'none' : '1px solid #2D2653',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  boxShadow: isMe ? '0 2px 12px rgba(124,58,237,0.25)' : 'none',
                }}>
                  <span style={{ color: isMe ? 'white' : '#F1F0F7' }}>{msg.text}</span>
                  <div style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.5)' : '#6E6893', marginTop: 4, textAlign: 'right' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '10px 16px 16px', borderTop: '1px solid #2D2653', display: 'flex', gap: 10, background: 'rgba(15,11,33,0.9)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <input placeholder="Type a message..." value={input}
          onChange={handleInputChange} onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ flex: 1, height: 44, borderRadius: 22, background: focused ? '#362F5E' : '#2D2653', border: `1.5px solid ${focused ? '#7C3AED' : '#433B72'}`, padding: '0 18px', fontSize: 14, color: '#F1F0F7', fontFamily: 'Inter, sans-serif', outline: 'none', boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.3)' : 'none', transition: 'all 0.25s ease' }}
        />
        <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }} onClick={send} disabled={!input.trim()}
          style={{ width: 44, height: 44, borderRadius: '50%', background: input.trim() ? 'linear-gradient(135deg, #7C3AED, #2DD4BF)' : '#2D2653', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0, boxShadow: input.trim() ? '0 4px 12px rgba(124,58,237,0.3)' : 'none' }}>
          <Send size={18} color={input.trim() ? 'white' : '#4A4570'} />
        </motion.button>
      </motion.div>
    </div>
  );
}
