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

const updateToastId = 'pwa-update-available'
const offlineToastId = 'network-offline'

const updateSW = registerSW({
  onNeedRefresh() {
    toast.info(
      <div className="space-y-3">
        <p>{t('system.updateAvailable')}</p>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
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

window.addEventListener('offline', showOfflineToast)

window.addEventListener('online', () => {
  toast.dismiss(offlineToastId)
  toast.success(t('system.backOnline'))
})

if (!navigator.onLine) {
  showOfflineToast()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
