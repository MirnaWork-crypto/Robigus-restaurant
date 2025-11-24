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

  if (req.method === 'GET') {
    try {
      const { date, time, guests } = req.query;
      
      if (!date || !time || !guests) {
        return res.status(400).json({ error: 'Paramètres manquants' });
      }

      // SIMULATION - Toujours disponible pour la démo
      // En production, connectez-vous à Supabase
      const available = true;
      const totalGuests = 25; // Simulation
      const remainingCapacity = 25;

      res.status(200).json({
        available,
        totalGuests,
        remainingCapacity
      });

    } catch (error) {
      console.error('Erreur disponibilité:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}