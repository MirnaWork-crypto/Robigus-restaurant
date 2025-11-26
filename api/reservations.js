import { createClient } from '@supabase/supabase-js'

// Initialiser Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

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

  // GET - Récupérer toutes les réservations
  if (req.method === 'GET') {
    try {
      // Récupérer les réservations depuis Supabase avec les bons noms de colonnes
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('reservation_date', { ascending: true })
        .order('reservation_time', { ascending: true });

      if (error) throw error;

      // Formater les données pour correspondre aux noms de colonnes de votre base
      const formattedData = data.map(reservation => ({
        id: reservation.id,
        firstName: reservation.first_name,
        lastName: reservation.last_name,
        email: reservation.email,
        phone: reservation.phone,
        date: reservation.reservation_date,  // Changé ici
        time: reservation.reservation_time,  // Changé ici
        guests: reservation.guests_count,    // Changé ici
        occasion: reservation.occasion,
        specialRequests: reservation.special_requests,
        status: reservation.status || 'confirmée',  // Votre valeur par défaut
        createdAt: reservation.created_at
      }));

      res.status(200).json(formattedData);
    } catch (error) {
      console.error('Erreur récupération réservations:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des réservations',
        error: error.message 
      });
    }
    return;
  }

  // POST - Créer une nouvelle réservation
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

      // Insérer dans Supabase avec les bons noms de colonnes
      const { data, error } = await supabase
        .from('reservations')
        .insert([
          {
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            reservation_date: date,        // Changé ici
            reservation_time: time,        // Changé ici
            guests_count: parseInt(guests), // Changé ici
            occasion: occasion || null,
            special_requests: specialRequests || null,
            status: 'confirmée'            // Votre valeur par défaut
          }
        ])
        .select();

      if (error) throw error;

      const reservationId = data[0].id;

      res.status(200).json({ 
        success: true, 
        reservationId: reservationId,
        message: 'Réservation confirmée avec succès' 
      });

    } catch (error) {
      console.error('Erreur réservation:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la réservation',
        error: error.message 
      });
    }
    return;
  }

  // PUT - Modifier une réservation
  if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const {
        firstName,
        lastName,
        email,
        phone,
        date,
        time,
        guests,
        occasion,
        specialRequests,
        status
      } = req.body;

      // Mettre à jour dans Supabase avec les bons noms de colonnes
      const { data, error } = await supabase
        .from('reservations')
        .update({
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          reservation_date: date,          // Changé ici
          reservation_time: time,          // Changé ici
          guests_count: parseInt(guests),   // Changé ici
          occasion: occasion,
          special_requests: specialRequests,
          status: status
        })
        .eq('id', id)
        .select();

      if (error) throw error;

      res.status(200).json({ 
        success: true, 
        message: 'Réservation modifiée avec succès',
        reservation: data[0]
      });

    } catch (error) {
      console.error('Erreur modification réservation:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la modification de la réservation',
        error: error.message 
      });
    }
    return;
  }

  // DELETE - Supprimer une réservation
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      // Supprimer la réservation dans Supabase
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.status(200).json({ 
        success: true,
        message: 'Réservation supprimée avec succès' 
      });
    } catch (error) {
      console.error('Erreur suppression réservation:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la suppression de la réservation',
        error: error.message 
      });
    }
    return;
  }

  // Méthode non autorisée
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
