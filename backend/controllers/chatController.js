const { Chat } = require('../models/index');

exports.getChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'name vibe isOnline lastActive')
      .sort({ 'lastMessage.createdAt': -1 });

    const result = chats.map(chat => {
      const other = chat.participants.find(p => p._id.toString() !== req.user._id.toString());
      const unreadCount = chat.messages.filter(m => !m.read && m.sender.toString() !== req.user._id.toString()).length;
      return { chatId: chat._id, otherUser: other, lastMessage: chat.lastMessage, unreadCount };
    });

    res.json(result);
  } catch (err) { next(err); }
};

exports.getMessages = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.chatId, participants: req.user._id });
    if (!chat) return res.status(403).json({ message: 'Access denied' });

    const { page = 1, limit = 50 } = req.query;
    const total = chat.messages.length;
    const start = Math.max(0, total - page * limit);
    const end = total - (page - 1) * limit;
    const messages = chat.messages.slice(start, end).reverse();

    // Mark as read
    let updated = false;
    chat.messages.forEach(m => {
      if (!m.read && m.sender.toString() !== req.user._id.toString()) {
        m.read = true; updated = true;
      }
    });
    if (updated) await chat.save();

    res.json({ messages, total, page: Number(page) });
  } catch (err) { next(err); }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message text is required' });

    const chat = await Chat.findOne({ _id: req.params.chatId, participants: req.user._id });
    if (!chat) return res.status(403).json({ message: 'Access denied' });

    const message = { sender: req.user._id, text: text.trim(), read: false, createdAt: new Date() };
    chat.messages.push(message);
    chat.lastMessage = { text: text.trim(), sender: req.user._id, createdAt: new Date() };
    await chat.save();

    const saved = chat.messages[chat.messages.length - 1];

    // Emit via socket if available
    const io = req.app.get('io');
    if (io) {
      const otherId = chat.participants.find(p => p.toString() !== req.user._id.toString());
      io.to(otherId?.toString()).emit('new-message', { chatId: chat._id, message: saved });
      io.to(req.user._id.toString()).emit('chat-updated', { chatId: chat._id });
    }

    res.status(201).json({ message: saved });
  } catch (err) { next(err); }
};
