import { useState } from 'react'
import { createRide, joinRide, type Participant, type Ride } from '../api/rides'

type RideSessionState = {
  ride?: Ride
  participant?: Participant
  error?: string
  isCreating: boolean
  isJoining: boolean
}

const initialState: RideSessionState = {
  isCreating: false,
  isJoining: false,
}

export function useRideSession() {
  const [state, setState] = useState<RideSessionState>(initialState)

  async function create(name: string) {
    setState((current) => ({ ...current, error: undefined, isCreating: true }))

    try {
      const ride = await createRide(name)
      setState((current) => ({ ...current, ride, isCreating: false }))
      return ride
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Unable to create the ride.',
        isCreating: false,
      }))
      return undefined
    }
  }

  async function join(rideId: string, displayName: string) {
    setState((current) => ({ ...current, error: undefined, isJoining: true }))

    try {
      const participant = await joinRide(rideId, displayName)
      setState((current) => ({ ...current, participant, isJoining: false }))
      return participant
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Unable to join the ride.',
        isJoining: false,
      }))
      return undefined
    }
  }

  return { ...state, create, join }
}
