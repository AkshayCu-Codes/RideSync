import { type FormEvent, useState } from 'react'
import { useRideSession } from '../hooks/useRideSession'

export function RideSessionControls() {
  const [rideName, setRideName] = useState('')
  const [rideId, setRideId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const { ride, participant, error, isCreating, isJoining, isLeaving, create, join, leave } =
    useRideSession()

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
        <p className="ride-controls__success" role="status">
          Created <strong>{ride.name}</strong>. Ride ID: <code>{ride.id}</code>
        </p>
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
        <button disabled={isJoining} type="submit">
          {isJoining ? 'Joining…' : 'Join ride'}
        </button>
      </form>

      {participant && (
        <div className="ride-controls__membership" role="status">
          <p className="ride-controls__success">
            Joined as <strong>{participant.display_name}</strong>.
          </p>
          <button disabled={isLeaving} onClick={handleLeave} type="button">
            {isLeaving ? 'Leaving…' : 'Leave ride'}
          </button>
        </div>
      )}
      {error && <p className="ride-controls__error" role="alert">{error}</p>}
    </aside>
  )
}
