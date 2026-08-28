import { useState } from 'react'
import { createRide, joinRide, leaveRide, type Participant, type Ride } from '../api/rides'

type RideSessionState = {
  ride?: Ride
  participant?: Participant
  error?: string
  isCreating: boolean
  isJoining: boolean
  isLeaving: boolean
}

const initialState: RideSessionState = {
  isCreating: false,
  isJoining: false,
  isLeaving: false,
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

  async function leave() {
    if (!state.participant) return false

    setState((current) => ({ ...current, error: undefined, isLeaving: true }))

    try {
      await leaveRide(state.participant.ride_id, state.participant.id)
      setState((current) => ({ ...current, participant: undefined, isLeaving: false }))
      return true
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Unable to leave the ride.',
        isLeaving: false,
      }))
      return false
    }
  }

  return { ...state, create, join, leave }
}
