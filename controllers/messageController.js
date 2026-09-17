const Message = require('../models/Message');

// יוצר הודעה חדשה מטופס יצירת הקשר.

exports.createMessage = async (req, res) => {
  try {
    const { name, email, subject, body } = req.body;

    if (!name || !email || !body) {
      return res.status(400).json({ message: 'Name, email and message are required' });
    }

    // רק ארבעה שדות — isRead תמיד false ביצירה
    const message = await Message.create({ name, email, subject, body });

    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// מחזיר את כל הודעות יצירת הקשר, מהחדשה לישנה.
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// מסמן הודעה מסוימת כנקראה.
exports.markRead = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};