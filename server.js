const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Configuration Supabase - REMPLACEZ AVEC VOS VRAIES CLÉS
const supabaseUrl = 'https://votre-project.supabase.co';
const supabaseKey = 'votre-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Route pour vérifier la disponibilité
app.get('/api/availability', async (req, res) => {
    try {
        const { date, time, guests } = req.query;
        
        if (!date || !time || !guests) {
            return res.status(400).json({ error: 'Paramètres manquants' });
        }

        // Récupérer les réservations pour cette date et heure
        const { data: reservations, error } = await supabase
            .from('reservations')
            .select('guests_count')
            .eq('reservation_date', date)
            .eq('reservation_time', time)
            .eq('status', 'confirmée');

        if (error) throw error;

        const MAX_CAPACITY = 50;
        const totalGuests = reservations.reduce((sum, res) => sum + res.guests_count, 0);
        const available = (totalGuests + parseInt(guests)) <= MAX_CAPACITY;

        res.json({
            available,
            totalGuests,
            remainingCapacity: MAX_CAPACITY - totalGuests
        });

    } catch (error) {
        console.error('Erreur disponibilité:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour créer une réservation
app.post('/api/reservations', async (req, res) => {
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

        // Vérifier d'abord la disponibilité
        const availabilityResponse = await fetch(`http://localhost:${PORT}/api/availability?date=${date}&time=${time}&guests=${guests}`);
        const availability = await availabilityResponse.json();

        if (!availability.available) {
            return res.status(400).json({ 
                message: 'Désolé, plus de places disponibles pour cette date et heure.' 
            });
        }

        // Insérer la réservation dans Supabase
        const { data, error } = await supabase
            .from('reservations')
            .insert([
                {
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    phone: phone,
                    reservation_date: date,
                    reservation_time: time,
                    guests_count: parseInt(guests),
                    occasion: occasion,
                    special_requests: specialRequests,
                    status: 'confirmée'
                }
            ])
            .select();

        if (error) throw error;

        res.json({ 
            success: true, 
            reservationId: data[0].id,
            message: 'Réservation confirmée avec succès' 
        });

    } catch (error) {
        console.error('Erreur réservation:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la réservation' 
        });
    }
});

// Route pour récupérer toutes les réservations (admin)
app.get('/api/reservations', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reservations')
            .select('*')
            .order('reservation_date', { ascending: false })
            .order('reservation_time', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Erreur récupération:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});