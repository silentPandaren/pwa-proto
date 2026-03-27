// ── SERVICE WORKER REGISTRATION ───────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered, scope:', registration.scope);
    } catch (err) {
      console.error('SW registration failed:', err);
    }
  });
}

// ── INSTALL PROMPT ────────────────────────────────────────────────────────────
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  const installBtn = document.getElementById('install-btn');
  if (installBtn) installBtn.hidden = false;
});

document.getElementById('install-btn')?.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  console.log('Install prompt outcome:', outcome);
  deferredInstallPrompt = null;
  document.getElementById('install-btn').hidden = true;
});

window.addEventListener('appinstalled', () => {
  console.log('App installed');
  deferredInstallPrompt = null;
});

// ── PUSH BUTTON WIRING ────────────────────────────────────────────────────────
const subscribeBtn = document.getElementById('subscribe-btn');
const unsubscribeBtn = document.getElementById('unsubscribe-btn');

async function initPushButtons() {
  if (!subscribeBtn && !unsubscribeBtn) return;

  try {
    await loadVapidKey();
  } catch (err) {
    console.warn('Could not load VAPID key:', err);
    return;
  }

  const existingSub = await getExistingSubscription();
  if (existingSub) {
    subscribeBtn.hidden = true;
    unsubscribeBtn.hidden = false;
  }

  subscribeBtn?.addEventListener('click', async () => {
    subscribeBtn.disabled = true;
    subscribeBtn.textContent = 'Subscribing…';
    const sub = await subscribeToPush();
    if (sub) {
      subscribeBtn.hidden = true;
      unsubscribeBtn.hidden = false;
      showToast('Notifications enabled');
    } else {
      subscribeBtn.disabled = false;
      subscribeBtn.textContent = '🔔 Enable Notifications';
    }
  });

  unsubscribeBtn?.addEventListener('click', async () => {
    await unsubscribeFromPush();
    unsubscribeBtn.hidden = true;
    subscribeBtn.hidden = false;
    subscribeBtn.disabled = false;
    subscribeBtn.textContent = '🔔 Enable Notifications';
    showToast('Notifications disabled');
  });
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(() => initPushButtons());
}
