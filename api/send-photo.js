export default async function handler(request, response) {
  // Seulement les requêtes POST
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const { chatId } = request.body;

  if (!BOT_TOKEN) {
    return response.status(500).json({ error: 'Token not configured' });
  }

  try {
    // Récupérer la photo depuis FormData
    const photo = request.files?.photo || request.body.photo;
    const caption = request.body.caption;

    if (!photo) {
      return response.status(400).json({ error: 'Photo required' });
    }

    // Créer un nouveau FormData pour l'API Telegram
    const telegramFormData = new FormData();
    telegramFormData.append('chat_id', chatId);
    telegramFormData.append('photo', photo, 'code.png');
    telegramFormData.append('caption', caption);

    // Appeler l'API Telegram (le token est sécurisé côté serveur)
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
      {
        method: 'POST',
        body: telegramFormData
      }
    );

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok) {
      throw new Error(telegramData.description || 'Telegram API error');
    }

    return response.status(200).json({ 
      success: true, 
      message: 'Photo sent to Telegram' 
    });

  } catch (error) {
    console.error('Error sending to Telegram:', error);
    return response.status(500).json({ 
      error: error.message || 'Failed to send photo' 
    });
  }
}