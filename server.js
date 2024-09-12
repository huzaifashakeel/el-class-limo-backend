const express = require('express');
const axios = require('axios');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Add your Stripe Secret Key
require('dotenv').config();


const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors());

// Function 1: Get LatLng from Place ID
app.get('/get-latlng-from-place-id', async (req, res) => {
  const { placeId } = req.query;

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${process.env.GOOGLE_API_KEY}`
    );
    
    if (response.status === 200) {
      const location = response.data.result.geometry.location;
      res.json({
        lat: location.lat,
        lng: location.lng
      });
    } else {
      res.status(400).json({ error: 'Failed to fetch location' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Function 2: Get Address from LatLng
app.get('/get-address-from-latlng', async (req, res) => {
  const { latitude, longitude } = req.query;

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_API_KEY}`
    );
    
    if (response.status === 200) {
      const address = response.data.results[0].formatted_address;
      res.json({ address });
    } else {
      res.status(400).json({ error: 'Failed to fetch address' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Function 3: Get Place Predictions (Autocomplete)
app.get('/get-place-suggestions', async (req, res) => {
  const { input } = req.query;
  const latitude = 34.0522;
  const longitude = -118.2437;
  const radius = 50000;

  if (!input) {
    return res.status(400).json({ error: 'Input is required' });
  }

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&location=${latitude},${longitude}&radius=${radius}&key=${process.env.GOOGLE_API_KEY}`
    );

    if (response.status === 200) {
      const predictions = response.data.predictions;
      res.json(predictions);
    } else {
      res.status(400).json({ error: 'Failed to fetch predictions' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Function 4: Create Payment Intent (Stripe)
app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd'
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
