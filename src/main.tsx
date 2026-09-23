import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'react-toastify'
import { registerSW } from 'virtual:pwa-register'
import './lib/authFetchInterceptor'
import './index.css'
import './design-system.css'
import App from './App.tsx'

const updateToastId = 'pwa-update-available'
const offlineToastId = 'network-offline'

const updateSW = registerSW({
  onNeedRefresh() {
    toast.info(
      <div className="space-y-3">
        <p>Une nouvelle version de l'application est disponible.</p>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={() => {
            toast.dismiss(updateToastId)
            void updateSW(true)
          }}
        >
          Mettre à jour
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
  toast.warning('Mode hors ligne — certaines données peuvent être indisponibles.', {
    toastId: offlineToastId,
    autoClose: 4500,
  })
}

window.addEventListener('offline', showOfflineToast)

window.addEventListener('online', () => {
  toast.dismiss(offlineToastId)
  toast.success('Connexion rétablie')
})

if (!navigator.onLine) {
  showOfflineToast()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
