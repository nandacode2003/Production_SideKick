const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Chat } = require('../models/index');

const initSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    socket.join(userId);

    await User.findByIdAndUpdate(userId, { isOnline: true, lastActive: new Date() });
    console.log(`🔌 Connected: ${userId}`);

    socket.on('send-message', async ({ chatId, text }) => {
      try {
        if (!text?.trim()) return;
        const chat = await Chat.findOne({ _id: chatId, participants: userId });
        if (!chat) return;

        const message = { sender: userId, text: text.trim(), read: false, createdAt: new Date() };
        chat.messages.push(message);
        chat.lastMessage = { text: text.trim(), sender: userId, createdAt: new Date() };
        await chat.save();

        const saved = chat.messages[chat.messages.length - 1];
        const otherId = chat.participants.find(p => p.toString() !== userId)?.toString();

        io.to(otherId).emit('new-message', { chatId, message: saved });
        io.to(userId).emit('new-message', { chatId, message: saved });
        io.to(otherId).emit('chat-updated', { chatId, lastMessage: chat.lastMessage });
      } catch (err) {
        socket.emit('error', { message: 'Message failed' });
      }
    });

    socket.on('typing', ({ chatId }) => {
      Chat.findOne({ _id: chatId, participants: userId }).then(chat => {
        if (!chat) return;
        const otherId = chat.participants.find(p => p.toString() !== userId)?.toString();
        io.to(otherId).emit('user-typing', { chatId, userId });
      });
    });

    socket.on('stop-typing', ({ chatId }) => {
      Chat.findOne({ _id: chatId, participants: userId }).then(chat => {
        if (!chat) return;
        const otherId = chat.participants.find(p => p.toString() !== userId)?.toString();
        io.to(otherId).emit('user-stop-typing', { chatId, userId });
      });
    });

    socket.on('mark-read', async ({ chatId }) => {
      try {
        const chat = await Chat.findOne({ _id: chatId, participants: userId });
        if (!chat) return;
        let updated = false;
        chat.messages.forEach(m => {
          if (!m.read && m.sender.toString() !== userId) { m.read = true; updated = true; }
        });
        if (updated) await chat.save();
        const otherId = chat.participants.find(p => p.toString() !== userId)?.toString();
        io.to(otherId).emit('messages-read', { chatId });
      } catch {}
    });

    socket.on('disconnect', async () => {
      await User.findByIdAndUpdate(userId, { isOnline: false, lastActive: new Date() });
      console.log(`🔌 Disconnected: ${userId}`);
    });
  });
};

module.exports = { initSocket };
