const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load environment variables from a .env file

const app = express();
const port = process.env.PORT || 2000;

// Middleware
app.use(cors({
    origin: '*', // Allow all origins or specify the allowed domains
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Stripe Payment Intent Function
app.post('/create-payment-intent', async (req, res) => {
    const { amount } = req.body;
  
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
  
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY; // Ensure the secret key is correct
    if (!stripeSecretKey) {
      return res.status(500).json({ error: 'Stripe secret key not configured' });
    }
  
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${stripeSecretKey}`,
    };
  
    const data = new URLSearchParams({
      'amount': Math.round(parseFloat(amount) * 100).toString(), // Ensure amount is an integer (in cents)
      'currency': 'usd',
      'payment_method_types[]': 'card',  // Required field
    });
  
    try {
      const response = await axios.post(
        'https://api.stripe.com/v1/payment_intents',
        data,
        { headers }
      );
  
      // Log the response for debugging
  
      res.status(200).json({ clientSecret: response.data.client_secret });
    } catch (error) {
      console.error('Error creating payment intent:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Payment intent creation failed' });
    }
  });
  

// Get LatLng from Place ID
app.get('/get-lat-lng', async (req, res) => {
  const placeId = req.query.placeId;
  const googleApiKey = process.env.GOOGLE_API_KEY; // Using environment variable for Google API Key
  console.log(googleApiKey);
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${googleApiKey}`
    );
    const location = response.data.result.geometry.location;
    res.status(200).json(location);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get location' });
  }
});


// Get Suggestions for Places
// Get Suggestions for Places
app.get('/get-suggestions', async (req, res) => {
    console.log('Incoming request');
    
    const input = req.query.input; // Get 'input' from the query parameters
    const latitude = req.query.latitude; // Get 'latitude' from the query parameters
    const longitude = req.query.longitude; // Get 'longitude' from the query parameters
    const radius = req.query.radius || 50000; // Get 'radius' from the query parameters or set default value
    const googleApiKey = process.env.GOOGLE_API_KEY;

    console.log(`Google API Key: ${googleApiKey}, Input: ${input}, Latitude: ${latitude}, Longitude: ${longitude}, Radius: ${radius}`);

    if (!input || !latitude || !longitude) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&location=${latitude},${longitude}&radius=${radius}&key=${googleApiKey}`
        );

        const predictions = response.data.predictions.map(prediction => ({
            description: prediction.description,
            placeId: prediction.place_id,
        }));

        res.status(200).json(predictions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get suggestions' });
    }
});



// Get Address from LatLng
app.get('/get-address', async (req, res) => {
  const { latitude, longitude } = req.query;
  const googleApiKey = process.env.GOOGLE_API_KEY; // Using environment variable for Google API Key

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}`
    );
    if (response.data.status === 'OK') {
      const address = response.data.results[0].formatted_address;
      res.status(200).json({ address });
    } else {
      res.status(400).json({ error: 'No address found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get address' });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
