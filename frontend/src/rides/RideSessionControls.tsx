import { type FormEvent, useState } from 'react'
import type { LocationSharingStatus } from '../hooks/useRideLocationSharing'
import type { useRideSession } from '../hooks/useRideSession'
import { ShareRideButton } from './ShareRideButton'

type RideSessionControlsProps = {
  locationSharing: { error?: string; status: LocationSharingStatus }
  session: ReturnType<typeof useRideSession>
}

function getLocationSharingMessage(status: LocationSharingStatus): string {
  if (status === 'connected') return 'Live location sharing is active.'
  if (status === 'connecting') return 'Connecting live location sharing…'
  if (status === 'reconnecting') return 'Reconnecting live location sharing…'
  return 'Live location sharing is inactive.'
}

export function RideSessionControls({ locationSharing, session }: RideSessionControlsProps) {
  const [rideName, setRideName] = useState('')
  const [rideId, setRideId] = useState(() => {
    return new URLSearchParams(window.location.search).get('rideId') ?? ''
  })
  const [displayName, setDisplayName] = useState('')
  const { ride, participant, error, isCreating, isJoining, isLeaving, create, join, leave } = session

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const createdRide = await create(rideName.trim())

    if (createdRide) {
      setRideId(createdRide.id)
      setRideName('')
    }
  }

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const joinedParticipant = await join(rideId.trim(), displayName.trim())

    if (joinedParticipant) {
      setDisplayName('')
    }
  }

  async function handleLeave() {
    await leave()
  }

  return (
    <aside className="ride-controls" aria-label="Ride session controls">
      <h1 className="ride-controls__title">RideSync</h1>
      <form className="ride-controls__form" onSubmit={handleCreate}>
        <label htmlFor="ride-name">Create a ride</label>
        <input
          id="ride-name"
          maxLength={100}
          minLength={1}
          onChange={(event) => setRideName(event.target.value)}
          placeholder="Saturday morning ride"
          required
          value={rideName}
        />
        <button disabled={isCreating} type="submit">
          {isCreating ? 'Creating…' : 'Create ride'}
        </button>
      </form>

      {ride && (
        <div className="ride-controls__created" role="status">
          <p className="ride-controls__success">
            Created <strong>{ride.name}</strong>. Ride ID: <code>{ride.id}</code>
          </p>
          <ShareRideButton rideId={ride.id} />
        </div>
      )}

      <form className="ride-controls__form" onSubmit={handleJoin}>
        <label htmlFor="ride-id">Join a ride</label>
        <input
          id="ride-id"
          onChange={(event) => setRideId(event.target.value)}
          placeholder="Ride ID"
          required
          value={rideId}
        />
        <input
          id="display-name"
          maxLength={50}
          minLength={1}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Your display name"
          required
          value={displayName}
        />
        <p className="ride-controls__privacy-note">
          Joining shares your live location with the other riders in this session.
        </p>
        <button disabled={isJoining} type="submit">
          {isJoining ? 'Joining…' : 'Join ride'}
        </button>
      </form>

      {participant && (
        <div className="ride-controls__membership">
          <p className="ride-controls__success">
            Joined as <strong>{participant.display_name}</strong>.
          </p>
          <div className="ride-controls__actions">
            <ShareRideButton rideId={participant.ride_id} />
            <button disabled={isLeaving} onClick={handleLeave} type="button">
              {isLeaving ? 'Leaving…' : 'Leave ride'}
            </button>
          </div>
          <p className="ride-controls__location-status" role="status">
            {getLocationSharingMessage(locationSharing.status)}
          </p>
          {locationSharing.error && (
            <p className="ride-controls__error" role="alert">{locationSharing.error}</p>
          )}
        </div>
      )}
      {error && <p className="ride-controls__error" role="alert">{error}</p>}
    </aside>
  )
}
