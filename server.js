require('dotenv').config();
const express = require('express');
const webPush = require('web-push');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

webPush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// In-memory subscription store (prototype only)
const subscriptions = new Map(); // endpoint → subscription object

// Expose public key to frontend
app.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Save a push subscription
app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  if (!subscription?.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }
  subscriptions.set(subscription.endpoint, subscription);
  console.log(`[push] Subscription saved. Total: ${subscriptions.size}`);
  res.status(201).json({ message: 'Subscribed' });
});

// Trigger a push to all subscribers
app.post('/send-push', async (req, res) => {
  if (subscriptions.size === 0) {
    return res.status(400).json({ error: 'No subscribers' });
  }

  const payload = JSON.stringify({
    title: req.body.title || 'Webshop Update',
    body: req.body.body || 'Check out what\'s new in the shop!',
    url: req.body.url || '/',
    icon: '/icons/icon-192.png'
  });

  const results = [];
  for (const [endpoint, subscription] of subscriptions) {
    try {
      await webPush.sendNotification(subscription, payload);
      results.push({ endpoint: endpoint.slice(-20), status: 'sent' });
    } catch (err) {
      if (err.statusCode === 410) {
        // Subscription expired or revoked — remove it
        subscriptions.delete(endpoint);
        results.push({ endpoint: endpoint.slice(-20), status: 'removed (expired)' });
      } else {
        results.push({ endpoint: endpoint.slice(-20), status: 'error', error: err.message });
      }
    }
  }

  console.log(`[push] Sent to ${results.length} subscriber(s)`);
  res.json({ sent: results.length, results });
});

// Current subscriber count (useful for the demo UI)
app.get('/subscribers', (req, res) => {
  res.json({ count: subscriptions.size });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Subscribers in memory: ${subscriptions.size}`);
});
