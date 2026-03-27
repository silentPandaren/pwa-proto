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

// ── INSTALL BANNER ────────────────────────────────────────────────────────────
let deferredInstallPrompt = null;
const installBanner = document.getElementById('install-banner');
const installBtn    = document.getElementById('install-btn');
const installClose  = document.getElementById('install-close');

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.navigator.standalone === true
  || window.matchMedia('(display-mode: standalone)').matches;

// iOS: show banner immediately (no beforeinstallprompt on iOS)
if (isIOS && !isStandalone) {
  if (installBanner) installBanner.hidden = false;
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (!isStandalone && installBanner) installBanner.hidden = false;
});

installBtn?.addEventListener('click', async () => {
  if (isIOS) {
    // Show manual instructions for iOS
    const modal = document.getElementById('ios-install-modal');
    if (modal) modal.hidden = false;
    return;
  }
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  console.log('Install prompt outcome:', outcome);
  deferredInstallPrompt = null;
  if (installBanner) installBanner.hidden = true;
});

installClose?.addEventListener('click', () => {
  if (installBanner) installBanner.hidden = true;
});

// iOS modal close
document.getElementById('ios-modal-close')?.addEventListener('click', () => {
  const modal = document.getElementById('ios-install-modal');
  if (modal) modal.hidden = true;
});
document.getElementById('ios-modal-backdrop')?.addEventListener('click', () => {
  const modal = document.getElementById('ios-install-modal');
  if (modal) modal.hidden = true;
});

window.addEventListener('appinstalled', () => {
  console.log('App installed');
  deferredInstallPrompt = null;
  if (installBanner) installBanner.hidden = true;
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
