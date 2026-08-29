import { useGeolocation } from './hooks/useGeolocation'
import { useRideLocationSharing } from './hooks/useRideLocationSharing'
import { useRideSession } from './hooks/useRideSession'
import { GoogleMap } from './maps/GoogleMap'
import { RideSessionControls } from './rides/RideSessionControls'

function App() {
  const location = useGeolocation()
  const rideSession = useRideSession()
  const locationSharing = useRideLocationSharing(rideSession.participant)

  return (
    <main className="app-shell">
      <GoogleMap
        currentLocation={
          locationSharing.currentLocation ??
          (location.status === 'ready' ? location.coordinates : undefined)
        }
        participantLocations={locationSharing.locations}
      />
      <RideSessionControls locationSharing={locationSharing} session={rideSession} />
      {location.status === 'loading' && <p className="status-card">Finding your location…</p>}
      {location.status === 'error' && <p className="status-card" role="alert">{location.message}</p>}
    </main>
  )
}

export default App
