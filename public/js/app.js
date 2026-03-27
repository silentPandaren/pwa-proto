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
  || window.matchMedia('(display-mode: standalone)').matches
  || new URLSearchParams(window.location.search).get('source') === 'pwa';

function maybeShowInstallBanner() {
  if (isStandalone) return;
  if (isIOS) {
    if (installBanner) installBanner.hidden = false;
  } else if (deferredInstallPrompt) {
    if (installBanner) installBanner.hidden = false;
  }
}

// iOS: no beforeinstallprompt — banner shown via maybeShowInstallBanner after push flow
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  // Only show immediately if push banner is not showing
  if (pushBanner?.hidden !== false) maybeShowInstallBanner();
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

// ── PUSH BANNER ───────────────────────────────────────────────────────────────
const pushBanner    = document.getElementById('push-banner');
const pushAllowBtn  = document.getElementById('push-allow-btn');
const pushLaterBtn  = document.getElementById('push-later-btn');

function shouldShowPushBanner() {
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'default') return false;
  if (sessionStorage.getItem('push_later')) return false;
  return true;
}

function hidePushBanner() {
  if (pushBanner) pushBanner.hidden = true;
  // Show install banner now if it's waiting
  maybeShowInstallBanner();
}

pushAllowBtn?.addEventListener('click', async () => {
  pushAllowBtn.disabled = true;
  pushAllowBtn.textContent = 'Connecting…';
  try {
    await loadVapidKey();
    const sub = await subscribeToPush();
    if (sub) showToast('Notifications enabled');
  } catch {
    showToast('Could not enable notifications');
  }
  hidePushBanner();
});

pushLaterBtn?.addEventListener('click', () => {
  sessionStorage.setItem('push_later', '1');
  hidePushBanner();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(() => {
    if (shouldShowPushBanner()) {
      setTimeout(() => {
        if (pushBanner) pushBanner.hidden = false;
      }, 1500);
    } else {
      maybeShowInstallBanner();
    }
  });
}
