let VAPID_PUBLIC_KEY = '';

async function loadVapidKey() {
  const res = await fetch('/vapid-public-key');
  if (!res.ok) throw new Error('Failed to load VAPID key: ' + res.status);
  const data = await res.json();
  VAPID_PUBLIC_KEY = data.publicKey;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Diagnose push support — returns { supported, reason } for debugging
function diagnosePushSupport() {
  if (!('serviceWorker' in navigator)) return { supported: false, reason: 'No Service Worker support' };
  if (!('PushManager' in window)) return { supported: false, reason: 'No PushManager (browser does not support Web Push)' };
  if (!('Notification' in window)) return { supported: false, reason: 'No Notification API' };
  return { supported: true, reason: 'OK' };
}

async function subscribeToPush() {
  const diag = diagnosePushSupport();
  if (!diag.supported) {
    console.error('[push] Not supported:', diag.reason);
    showToast(diag.reason);
    return null;
  }

  // Step 1: Request permission
  console.log('[push] Requesting notification permission...');
  let permission;
  try {
    permission = await Notification.requestPermission();
  } catch (err) {
    console.error('[push] Permission request failed:', err);
    showToast('Permission request failed');
    return null;
  }

  if (permission !== 'granted') {
    console.warn('[push] Permission denied:', permission);
    showToast('Notifications blocked. Check browser/OS settings.');
    return null;
  }
  console.log('[push] Permission granted');

  // Step 2: Subscribe to push service
  let subscription;
  try {
    const registration = await navigator.serviceWorker.ready;
    console.log('[push] SW ready, subscribing to push service...');
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    console.log('[push] Subscription created:', subscription.endpoint.slice(0, 60) + '...');
  } catch (err) {
    console.error('[push] pushManager.subscribe() failed:', err);
    showToast('Push subscribe failed: ' + (err.message || err));
    return null;
  }

  // Step 3: Send subscription to server
  try {
    const res = await fetch('/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON())
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[push] Server rejected subscription:', res.status, text);
      showToast('Server error: ' + res.status);
      return null;
    }
    console.log('[push] Subscription saved on server');
  } catch (err) {
    console.error('[push] Failed to send subscription to server:', err);
    showToast('Network error saving subscription');
    return null;
  }

  return subscription;
}

async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }
}

async function getExistingSubscription() {
  if (!('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}
