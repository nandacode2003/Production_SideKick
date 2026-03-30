// src/pages/ChatRoomPage.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socket';
import { Avatar } from '../components/ui/UIKit';
import api from '../utils/api';

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [typing, setTyping]       = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [focused, setFocused]     = useState(false);
  const bottomRef   = useRef();
  const typingTimer = useRef();

  useEffect(() => {
    api.get(`/chats/${roomId}`).then(r => {
      setMessages(r.data.messages || []);
      const other = r.data.messages?.[0]?.sender;
      if (other && other._id !== user._id) setOtherUser(other);
    }).catch(() => navigate('/chats'));

    const socket = getSocket();
    socket.emit('join_room', roomId);
    socket.on('new_message', (msg) => { if (msg.roomId === roomId) setMessages(prev => [...prev, msg]); });
    socket.on('user_typing', ({ isTyping }) => setTyping(isTyping));
    return () => { socket.off('new_message'); socket.off('user_typing'); };
  }, [roomId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = () => {
    const content = input.trim();
    if (!content) return;
    const socket = getSocket();
    socket.emit('send_message', { roomId, content });
    setInput('');
    clearTimeout(typingTimer.current);
    socket.emit('typing', { roomId, isTyping: false });
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const socket = getSocket();
    socket.emit('typing', { roomId, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit('typing', { roomId, isTyping: false }), 1500);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

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
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.sender?._id === user._id || msg.sender === user._id;
            return (
              <motion.div key={msg._id}
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
                  <span style={{ color: isMe ? 'white' : '#F1F0F7' }}>{msg.content}</span>
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
