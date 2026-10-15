import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'react-toastify'
import { registerSW } from 'virtual:pwa-register'
import { t } from './i18n'
import './lib/authFetchInterceptor'
import './index.css'
import './design-system.css'
import App from './App.tsx'
import { reloadForNewVersion } from './lib/chunkRecovery'
import { subscribeConnectivity } from './offline/connectivity'

const updateToastId = 'pwa-update-available'
const offlineToastId = 'network-offline'

const updateSW = registerSW({
  onNeedRefresh() {
    toast.info(
      <div className="space-y-3">
        <p>{t('system.updateAvailable')}</p>
        <button
          type="button"
          className="ui-button ui-button--primary ui-button--sm"
          onClick={() => {
            toast.dismiss(updateToastId)
            void updateSW(true)
          }}
        >
          {t('system.update')}
        </button>
      </div>,
      {
        toastId: updateToastId,
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      },
    )
  },
  onRegisterError(error) {
    console.error('Service worker registration failed:', error)
  },
})

const showOfflineToast = () => {
  toast.warning(t('system.offline'), {
    toastId: offlineToastId,
    autoClose: 4500,
  })
}

// Vite reports a failed chunk preload (typically an outdated tab after a
// deployment). Reload once to fetch the new build; if the guard refuses,
// the error propagates to the route error boundary instead of looping.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewVersion()) event.preventDefault()
})

// Queued sales live in IndexedDB. Ask the browser to keep this storage even
// when the disk fills up, so it is never evicted before the sales reach the
// server. Best effort: some browsers decide on their own.
try {
  void navigator.storage?.persist?.().catch(() => undefined)
} catch {
  // Storage API unavailable: nothing to request.
}

let previousConnectivity: string | null = null
subscribeConnectivity((state) => {
  if (state === 'offline') showOfflineToast()
  if (state === 'online') {
    toast.dismiss(offlineToastId)
    if (previousConnectivity === 'offline') toast.success(t('system.backOnline'))
  }
  previousConnectivity = state
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
