import { createClient } from '@supabase/supabase-js';

// Debug: Vérifiez que les variables d'environnement sont chargées
console.log('🔧 Configuration Supabase:');
console.log('URL:', process.env.SUPABASE_URL ? '✓ Définie' : '✗ Manquante');
console.log('KEY:', process.env.SUPABASE_ANON_KEY ? '✓ Définie' : '✗ Manquante');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

      console.log('📥 DONNÉES REÇUES:', {
        firstName, lastName, email, phone, date, time, guests, occasion, specialRequests
      });

      // Validation des données
      if (!firstName || !lastName || !email || !phone || !date || !time || !guests) {
        return res.status(400).json({
          success: false,
          message: 'Tous les champs requis ne sont pas remplis'
        });
      }

      // VÉRIFICATION SUPABASE - Test de connexion
      console.log('🔍 Test de connexion à Supabase...');
      const { data: testData, error: testError } = await supabase
        .from('reservation')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('❌ ERREUR CONNEXION SUPABASE:', testError);
        return res.status(500).json({
          success: false,
          message: 'Erreur de connexion à la base de données: ' + testError.message
        });
      }

      console.log('✅ Connexion Supabase réussie');

      // Vérification de la disponibilité
      console.log('🔍 Vérification disponibilité pour:', date, time);
      const { data: existingReservations, error: availabilityError } = await supabase
        .from('reservation')
        .select('guests_count')
        .eq('reservation_date', date)
        .eq('reservation_time', time)
        .eq('status', 'confirmée');

      if (availabilityError) {
        console.error('❌ Erreur disponibilité:', availabilityError);
        return res.status(500).json({
          success: false,
          message: 'Erreur de vérification de disponibilité'
        });
      }

      const MAX_CAPACITY = 50;
      const totalGuests = existingReservations ? existingReservations.reduce((sum, res) => sum + res.guests_count, 0) : 0;
      const available = (totalGuests + parseInt(guests)) <= MAX_CAPACITY;

      console.log('📊 Statistiques:', {
        réservationsExistantes: existingReservations?.length || 0,
        totalGuests,
        nouveauxGuests: guests,
        disponible: available
      });

      if (!available) {
        return res.status(400).json({
          success: false,
          message: 'Désolé, plus de places disponibles pour cette date et heure.'
        });
      }

      // INSERTION DANS SUPABASE
      console.log('💾 Insertion dans Supabase...');
      const reservationData = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        reservation_date: date,
        reservation_time: time,
        guests_count: parseInt(guests),
        occasion: occasion || null,
        special_requests: specialRequests || null,
        status: 'confirmée'
      };

      console.log('📤 Données à insérer:', reservationData);

      const { data, error } = await supabase
        .from('reservation')
        .insert([reservationData])
        .select();

      if (error) {
        console.error('❌ ERREUR INSERTION SUPABASE:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la sauvegarde: ' + error.message
        });
      }

      if (!data || data.length === 0) {
        console.error('❌ Aucune donnée retournée après insertion');
        return res.status(500).json({
          success: false,
          message: 'Erreur: aucune donnée retournée après insertion'
        });
      }

      const reservationId = data[0].id;
      console.log('✅ RÉSERVATION RÉUSSIE! ID:', reservationId);

      // RÉPONSE DE SUCCÈS
      res.status(200).json({
        success: true,
        reservationId: reservationId, // VRAI ID DE LA BDD
        message: 'Réservation confirmée avec succès'
      });

    } catch (error) {
      console.error('❌ ERREUR GÉNÉRALE:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur: ' + error.message
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({
      success: false,
      message: `Méthode ${req.method} non autorisée`
    });
  }
}
