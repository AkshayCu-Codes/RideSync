import { useGeolocation } from './hooks/useGeolocation'
import { GoogleMap } from './maps/GoogleMap'

function App() {
  const location = useGeolocation()

  return (
    <main className="app-shell">
      <GoogleMap
        currentLocation={location.status === 'ready' ? location.coordinates : undefined}
      />
      <header className="app-header">
        <span className="app-header__brand">RideSync</span>
      </header>
      {location.status === 'loading' && <p className="status-card">Finding your location…</p>}
      {location.status === 'error' && <p className="status-card" role="alert">{location.message}</p>}
    </main>
  )
}

export default App
