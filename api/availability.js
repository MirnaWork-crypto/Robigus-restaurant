import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { date, time, guests } = req.query;
      
      if (!date || !time || !guests) {
        return res.status(400).json({ error: 'Paramètres manquants' });
      }

      console.log('🔍 Vérification disponibilité:', { date, time, guests });

      const { data: reservations, error } = await supabase
        .from('reservation')
        .select('guests_count')
        .eq('reservation_date', date)
        .eq('reservation_time', time)
        .eq('status', 'confirmée');

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        return res.status(500).json({ 
          error: 'Erreur base de données: ' + error.message 
        });
      }

      const MAX_CAPACITY = 50;
      const totalGuests = reservations ? reservations.reduce((sum, res) => sum + res.guests_count, 0) : 0;
      const available = (totalGuests + parseInt(guests)) <= MAX_CAPACITY;

      console.log('📊 Disponibilité:', {
        totalGuests,
        remainingCapacity: MAX_CAPACITY - totalGuests,
        available
      });

      res.status(200).json({
        available,
        totalGuests,
        remainingCapacity: MAX_CAPACITY - totalGuests
      });

    } catch (error) {
      console.error('❌ Erreur disponibilité:', error);
      res.status(500).json({ 
        error: 'Erreur serveur: ' + error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
