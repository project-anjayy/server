const express = require('express');
const { Event } = require('../config/database');
const { Op } = require('sequelize');
const authenticateToken = require('../middleware/auth');
const OpenAI = require('openai');

const router = express.Router();

// Sport category mapping untuk menterjemahkan input user
const sportMapping = {
  'bola': 'Soccer',
  'sepakbola': 'Soccer',
  'sepak bola': 'Soccer',
  'football': 'Soccer',
  'futsal': 'Soccer',
  'soccer': 'Soccer',
  
  'basket': 'Basketball',
  'basketball': 'Basketball',
  'bola basket': 'Basketball',
  
  'tenis': 'Tennis',
  'tennis': 'Tennis',
  
  'voli': 'Volleyball',
  'volleyball': 'Volleyball',
  'bola voli': 'Volleyball',
  
  'badminton': 'Badminton',
  'bulutangkis': 'Badminton',
  'bulu tangkis': 'Badminton',
  
  'renang': 'Swimming',
  'swimming': 'Swimming',
  'berenang': 'Swimming',
  
  'lari': 'Running',
  'running': 'Running',
  'jogging': 'Running',
  'marathon': 'Running',
  
  'sepeda': 'Cycling',
  'cycling': 'Cycling',
  'bersepeda': 'Cycling',
  
  'tinju': 'Boxing',
  'boxing': 'Boxing',
  
  'gym': 'Gym/Fitness',
  'fitness': 'Gym/Fitness',
  'fitnes': 'Gym/Fitness',
  'nge-gym': 'Gym/Fitness',
  
  'yoga': 'Yoga',
  
  'dance': 'Dance',
  'dansa': 'Dance',
  'menari': 'Dance'
};

// Function to extract sport category from user input
function extractSportCategory(text) {
  const lowerText = text.toLowerCase();
  
  for (const [key, value] of Object.entries(sportMapping)) {
    if (lowerText.includes(key)) {
      return value;
    }
  }
  return null;
}

// Function to extract location from user input
function extractLocation(text) {
  const lowerText = text.toLowerCase();
  const locations = [
    'jakarta', 'jakut', 'jakbar', 'jaksel', 'jaktim', 'jakpus',
    'jakarta utara', 'jakarta barat', 'jakarta selatan', 'jakarta timur', 'jakarta pusat',
    'bandung', 'surabaya', 'yogyakarta', 'jogja', 'semarang', 
    'medan', 'makassar', 'denpasar', 'bali', 'malang', 
    'solo', 'palembang', 'pontianak', 'balikpapan', 'manado'
  ];
  
  for (const location of locations) {
    if (lowerText.includes(location)) {
      // Normalize Jakarta areas
      if (location.includes('jak') || location.includes('jakarta')) {
        return 'jakarta';
      }
      return location;
    }
  }
  return null;
}

// POST /api/ai-chat/chat
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { history } = req.body;
    if (!Array.isArray(history) || history.length === 0) {
      return res.status(400).json({ status: 'error', message: 'History array is required' });
    }

    // Analisis conversation state dari history
    let detectedSport = null;
    let detectedLocation = null;
    let conversationState = 'initial'; // initial, sport_detected, location_detected, complete
    
    // Scan semua user messages untuk mencari sport dan location
    const userMessages = history.filter(msg => msg.role === 'user');
    
    // Deteksi perubahan preference dari pesan terakhir
    const lastMessage = userMessages[userMessages.length - 1]?.content || '';
    const lastSport = extractSportCategory(lastMessage);
    const lastLocation = extractLocation(lastMessage);
    
    // PERBAIKAN: Prioritaskan input terbaru (scan dari belakang ke depan)
    // Ini memungkinkan user untuk mengganti sport dan lokasi
    for (let i = userMessages.length - 1; i >= 0; i--) {
      const message = userMessages[i];
      
      // Ambil sport dari pesan terbaru yang memiliki sport
      if (!detectedSport) {
        detectedSport = extractSportCategory(message.content);
      }
      
      // Ambil location dari pesan terbaru yang memiliki location
      if (!detectedLocation) {
        detectedLocation = extractLocation(message.content);
      }
      
      // Jika sudah dapat keduanya, break
      if (detectedSport && detectedLocation) {
        break;
      }
    }
    
    // Deteksi jika ada perubahan preference
    let preferenceChanged = false;
    let changeMessage = '';
    
    if (userMessages.length > 1) {
      // Cek sport/location sebelumnya dari history
      let previousSport = null;
      let previousLocation = null;
      
      for (let i = userMessages.length - 2; i >= 0; i--) {
        const message = userMessages[i];
        if (!previousSport) {
          previousSport = extractSportCategory(message.content);
        }
        if (!previousLocation) {
          previousLocation = extractLocation(message.content);
        }
        if (previousSport && previousLocation) break;
      }
      
      // Deteksi perubahan
      if (lastSport && previousSport && lastSport !== previousSport) {
        preferenceChanged = true;
        changeMessage = `Oke, saya update preferensi Anda dari ${previousSport} ke ${lastSport}! ✅\n\n`;
      }
      
      if (lastLocation && previousLocation && lastLocation !== previousLocation) {
        preferenceChanged = true;
        changeMessage += `Lokasi diupdate dari ${previousLocation} ke ${lastLocation}! 📍\n\n`;
      }
    }

    // Tentukan conversation state
    if (detectedSport && detectedLocation) {
      conversationState = 'complete';
    } else if (detectedSport) {
      conversationState = 'sport_detected';
    } else {
      conversationState = 'initial';
    }

    console.log('AI Chat Analysis:', {
      detectedSport,
      detectedLocation,
      conversationState,
      userMessages: userMessages.map(m => m.content)
    });

    let aiReply = '';
    let events = [];
    
    // Handle berdasarkan conversation state
    if (conversationState === 'initial') {
      // Belum ada sport yang terdeteksi, tanya sport
      const lastMessage = userMessages[userMessages.length - 1]?.content || '';
      
      if (userMessages.length === 1) {
        // First interaction
        aiReply = `Halo! 👋 Saya siap membantu Anda menemukan event olahraga yang cocok!\n\nApa jenis olahraga yang ingin Anda ikuti? Misalnya:\n• "Saya mau main bola"\n• "Pengen basket"\n• "Cari event lari"\n• "Mau coba yoga"\n\nAtau tulis olahraga apapun yang Anda minati! 🏃‍♂️⚽🏀`;
      } else {
        aiReply = `Hmm, saya belum bisa mengenali jenis olahraga dari "${lastMessage}" 🤔\n\nBisa sebutkan olahraga yang lebih spesifik? Contoh:\n• Sepakbola/futsal\n• Basket\n• Tenis\n• Badminton\n• Renang\n• Lari/jogging\n• Dan lainnya!\n\nApa olahraga yang Anda inginkan?`;
      }
      
      return res.json({
        status: 'ask',
        ai_reply: aiReply,
        events: [],
        conversation_state: 'asking_sport'
      });
    }
    
    if (conversationState === 'sport_detected' && !detectedLocation) {
      // Sport sudah terdeteksi, tanya lokasi
      aiReply = changeMessage + `Oke, saya mengerti Anda ingin bermain ${detectedSport}! ⚽\n\nSekarang, di daerah mana Anda ingin bermain? Sebutkan kota atau area Anda, misalnya:\n• "Jakarta"\n• "Bandung" \n• "Surabaya"\n• "Jogja"\n• Atau kota lainnya\n\nDi mana lokasi yang Anda inginkan? 📍`;
      
      return res.json({
        status: 'ask',
        ai_reply: aiReply,
        events: [],
        conversation_state: 'asking_location',
        detected_sport: detectedSport
      });
    }
    
    if (conversationState === 'complete') {
      // Sudah ada sport dan location, cari events
      const now = new Date();
      let where = { 
        time: { [Op.gte]: now },
        category: detectedSport
      };
      
      if (detectedLocation) {
        where.location = { [Op.iLike]: `%${detectedLocation}%` };
      }
      
      console.log('🔍 Query Debug:', {
        detectedSport,
        detectedLocation,
        where,
        now: now.toISOString()
      });
      
      // Debug: Check all events first
      const allEvents = await Event.findAll({
        attributes: ['id', 'title', 'category', 'location', 'time'],
        order: [['time', 'ASC']],
        limit: 5
      });
      console.log('📊 Sample events in DB:', allEvents.map(e => ({
        title: e.title,
        category: e.category,
        location: e.location,
        time: e.time
      })));
      
      events = await Event.findAll({ 
        where, 
        order: [['time', 'ASC']],
        limit: 10,
        include: []
      });
      
      console.log(`🎯 Found ${events.length} events matching query`);
      if (events.length > 0) {
        console.log('Matching events:', events.map(e => ({
          title: e.title,
          category: e.category,
          location: e.location
        })));
      }

      if (events.length === 0) {
        aiReply = changeMessage + `Maaf, saat ini belum ada event ${detectedSport} di ${detectedLocation} 😔\n\nTapi jangan khawatir! Anda bisa:\n• Coba cari di kota lain\n• Buat event sendiri untuk ${detectedSport}\n• Cek lagi nanti karena event baru sering ditambahkan\n\nMau coba olahraga lain atau lokasi berbeda? 🔄`;
      } else {
        // Generate AI response dengan OpenAI
        const eventList = events.map(e => 
          `• ${e.title}\n  📍 ${e.location}\n  📅 ${new Date(e.time).toLocaleDateString('id-ID', { 
            weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' 
          })}\n  👥 ${e.available_slots}/${e.total_slots} slot tersedia`
        ).join('\n\n');
        
        const systemPrompt = `Kamu adalah asisten rekomendasi event olahraga yang ramah dan antusias. User mencari event ${detectedSport} di ${detectedLocation}.

${changeMessage ? 'User baru saja mengubah preferensi mereka. ' : ''}Event yang ditemukan:
${eventList}

Tugas kamu:
1. Sambut dengan antusias bahwa kamu menemukan event yang cocok
2. Jelaskan secara singkat setiap event (maksimal 2-3 kalimat per event)  
3. Beri tips memilih event yang sesuai
4. Dorong user untuk bergabung
5. Tawarkan bantuan lanjutan

Gunakan bahasa Indonesia yang casual, ramah, dan emoji yang sesuai. Jangan terlalu panjang.`;

        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Saya mencari event ${detectedSport} di ${detectedLocation}` }
        ];
        
        try {
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages,
            max_tokens: 400,
            temperature: 0.7
          });
          aiReply = changeMessage + completion.choices[0].message.content;
        } catch (openaiError) {
          console.error('OpenAI Error:', openaiError);
          aiReply = changeMessage + `Great! 🎉 Saya menemukan ${events.length} event ${detectedSport} di ${detectedLocation}!\n\n${eventList}\n\nSemua event di atas masih terbuka untuk pendaftaran. Pilih yang paling sesuai dengan jadwal Anda dan langsung join! 💪\n\nAda yang ingin ditanyakan tentang event ini?`;
        }
      }
    }

    // Log chat untuk tracking
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
      status: events.length > 0 ? 'success' : 'ask',
      ai_reply: aiReply,
      events: events.map(e => ({
        id: e.id,
        title: e.title,
        category: e.category,
        location: e.location,
        time: e.time,
        duration: e.duration,
        available_slots: e.available_slots,
        total_slots: e.total_slots
      })),
      conversation_state: conversationState,
      detected_sport: detectedSport,
      detected_location: detectedLocation
    });
    
  } catch (error) {
    console.error('AI Chat Recommendation error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

module.exports = router;
