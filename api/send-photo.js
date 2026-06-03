export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    const { chatId, photoBase64, caption } = req.body;

    if (!chatId || !photoBase64) {
      return res.status(400).json({ error: 'Missing chatId or photoBase64' });
    }

    // Convertir base64 en Buffer
    const photoBuffer = Buffer.from(photoBase64, 'base64');

    // Créer FormData pour Telegram
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('caption', caption || '');
    form.append('photo', new Blob([photoBuffer], { type: 'image/png' }), 'code.png');

    // Envoyer à Telegram
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      body: form,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Telegram error:', data);
      return res.status(response.status).json({
        error: data.description || 'Telegram API error',
      });
    }

    console.log('✅ Photo sent to Telegram');
    return res.status(200).json({
      success: true,
      message: 'Photo sent to Telegram',
      messageId: data.result?.message_id,
    });

  } catch (error) {
    console.error('❌ API error:', error.message);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}
