export default async function handler(req, res) {
  // Configurer CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        date,
        time,
        guests,
        occasion,
        specialRequests
      } = req.body;

      // SIMULATION - En production, remplacez par Supabase
      const reservationId = 'RSV' + Date.now();
      
      // Stockage temporaire (à remplacer par Supabase)
      console.log('Nouvelle réservation:', {
        reservationId,
        firstName,
        lastName,
        email,
        phone,
        date,
        time,
        guests,
        occasion,
        specialRequests
      });

      res.status(200).json({ 
        success: true, 
        reservationId: reservationId,
        message: 'Réservation confirmée avec succès' 
      });

    } catch (error) {
      console.error('Erreur réservation:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la réservation' 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}