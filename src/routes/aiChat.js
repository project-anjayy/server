const express = require('express');
const { Event } = require('../config/database');
const { Op } = require('sequelize');
const authenticateToken = require('../middleware/auth');
const OpenAI = require('openai');

const router = express.Router();

// POST /api/events/recommend/chat
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { history } = req.body;
    if (!Array.isArray(history) || history.length === 0) {
      return res.status(400).json({ status: 'error', message: 'History array is required' });
    }

    // Ambil preferensi user dari history
    let category = null;
    let location = null;
    for (let i = 0; i < history.length; i++) {
      const msg = history[i];
      if (msg.role === 'user') {
        // Sederhana: deteksi kategori dan lokasi dari urutan chat
        if (!category) category = msg.content.toLowerCase();
        else if (!location) location = msg.content.toLowerCase();
      }
    }

    // Query event yang cocok
    const now = new Date();
  let where = { time: { [Op.gte]: now } };
  if (category) where.category = category;
  if (location) where.location = { [Op.iLike]: `%${location}%` };
  const events = await Event.findAll({ where, order: [['time', 'ASC']] });

    let aiReply = '';
    if (events.length === 0) {
      aiReply = `Maaf, belum ada event ${category && location ? category + ' di ' + location : ''} yang sesuai.`;
    } else {
      const eventList = events.map(e => `- ${e.title} di ${e.location} pada ${e.time.toISOString()}`).join('\n');
      const systemPrompt = `Kamu adalah asisten rekomendasi event olahraga. Berikut event yang cocok dengan permintaan user:\n${eventList}\n\nJelaskan secara singkat dan promosikan event di atas. Jawab dalam bahasa Indonesia.`;
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history
      ];
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 300
      });
      aiReply = completion.choices[0].message.content;
    }

    // Simpan log chat AI jika user login
    try {
      const { AiChatLog } = require('../config/database');
      if (req.user && req.user.id) {
        await AiChatLog.create({
          user_id: req.user.id,
          message: JSON.stringify(history),
          response: aiReply
        });
      }
    } catch (logErr) {
      console.error('Failed to log AI chat:', logErr);
    }

    res.json({
      status: 'success',
      ai_reply: aiReply,
      events: events.map(e => ({
        id: e.id,
        title: e.title,
        category: e.category,
        location: e.location,
        time: e.time,
        duration: e.duration
      }))
    });
  } catch (error) {
    console.error('AI Chat Recommendation error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
