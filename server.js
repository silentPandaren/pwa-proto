require('dotenv').config();
const express = require('express');
const webPush = require('web-push');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

webPush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ── Persistent subscription store ────────────────────────────────────────────
// Saves to a JSON file so subscriptions survive server restarts.
// On Railway: survives restarts within the same deploy. To survive redeploys,
// attach a persistent volume mounted at /data and set DATA_DIR=/data.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const SUBS_FILE = path.join(DATA_DIR, 'subscriptions.json');

function loadSubscriptions() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(SUBS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SUBS_FILE, 'utf-8'));
      const map = new Map();
      for (const sub of data) {
        if (sub.endpoint) map.set(sub.endpoint, sub);
      }
      console.log(`[store] Loaded ${map.size} subscription(s) from disk`);
      return map;
    }
  } catch (err) {
    console.error('[store] Failed to load subscriptions:', err.message);
  }
  return new Map();
}

function saveSubscriptions() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SUBS_FILE, JSON.stringify([...subscriptions.values()], null, 2));
  } catch (err) {
    console.error('[store] Failed to save subscriptions:', err.message);
  }
}

const subscriptions = loadSubscriptions();

// ── Routes ───────────────────────────────────────────────────────────────────

app.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  if (!subscription?.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }
  subscriptions.set(subscription.endpoint, subscription);
  saveSubscriptions();
  console.log(`[push] Subscription saved. Total: ${subscriptions.size}`);
  res.status(201).json({ message: 'Subscribed' });
});

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
  let changed = false;
  for (const [endpoint, subscription] of subscriptions) {
    try {
      await webPush.sendNotification(subscription, payload);
      results.push({ endpoint: endpoint.slice(-20), status: 'sent' });
    } catch (err) {
      if (err.statusCode === 410) {
        subscriptions.delete(endpoint);
        changed = true;
        results.push({ endpoint: endpoint.slice(-20), status: 'removed (expired)' });
      } else {
        results.push({ endpoint: endpoint.slice(-20), status: 'error', error: err.message });
      }
    }
  }

  if (changed) saveSubscriptions();

  console.log(`[push] Sent to ${results.length} subscriber(s)`);
  res.json({ sent: results.length, results });
});

app.get('/subscribers', (req, res) => {
  res.json({ count: subscriptions.size });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Subscribers on disk: ${subscriptions.size}`);
});
