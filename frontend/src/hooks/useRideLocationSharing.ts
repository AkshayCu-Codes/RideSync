import { useEffect, useState } from 'react'
import type { Participant } from '../api/rides'
import { environment } from '../config/environment'
import type { ParticipantLocation } from '../location/types'
import type { Coordinates } from './useGeolocation'

export type LocationSharingStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting'

type LocationSharingState = {
  currentLocation?: Coordinates
  error?: string
  locations: ParticipantLocation[]
  status: LocationSharingStatus
}

type ParticipantLocationPayload = {
  participant_id: string
  latitude: number
  longitude: number
  accuracy?: number | null
  updated_at: string
}

type ServerMessage =
  | { type: 'ride.location.snapshot'; locations: ParticipantLocationPayload[] }
  | ({ type: 'participant.location' } & ParticipantLocationPayload)
  | { type: 'participant.left'; participant_id: string }
  | { type: 'error'; detail: string }

const LOCATION_UPDATE_INTERVAL_MS = 2_000
const MAX_RECONNECT_DELAY_MS = 30_000

function toParticipantLocation(message: ParticipantLocationPayload): ParticipantLocation {
  return {
    participantId: message.participant_id,
    latitude: message.latitude,
    longitude: message.longitude,
    accuracy: message.accuracy ?? undefined,
    updatedAt: message.updated_at,
  }
}

function getLocationErrorMessage(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return 'Location sharing is off because browser permission was denied.'
  }

  return 'Your live location is currently unavailable.'
}

export function useRideLocationSharing(participant?: Participant): LocationSharingState {
  const [state, setState] = useState<LocationSharingState>({
    locations: [],
    status: 'idle',
  })

  useEffect(() => {
    if (!participant) {
      setState({ locations: [], status: 'idle' })
      return
    }
    const activeParticipant = participant

    let active = true
    let reconnectAttempt = 0
    let reconnectTimer: number | undefined
    let socket: WebSocket | undefined
    let watchId: number | undefined
    let lastLocationSentAt = 0

    function stopWatchingLocation() {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId)
        watchId = undefined
      }
    }

    function startWatchingLocation() {
      if (!navigator.geolocation) {
        setState((current) => ({
          ...current,
          error: 'Your browser does not support location sharing.',
        }))
        return
      }

      watchId = navigator.geolocation.watchPosition(
        ({ coords }) => {
          const currentLocation = { latitude: coords.latitude, longitude: coords.longitude }
          setState((current) => ({ ...current, currentLocation, error: undefined }))

          if (
            socket?.readyState === WebSocket.OPEN &&
            Date.now() - lastLocationSentAt >= LOCATION_UPDATE_INTERVAL_MS
          ) {
            socket.send(
              JSON.stringify({
                type: 'location.update',
                latitude: coords.latitude,
                longitude: coords.longitude,
                accuracy: coords.accuracy,
              }),
            )
            lastLocationSentAt = Date.now()
          }
        },
        (error) => setState((current) => ({ ...current, error: getLocationErrorMessage(error) })),
        { enableHighAccuracy: true, maximumAge: 5_000, timeout: 10_000 },
      )
    }

    function scheduleReconnect() {
      reconnectAttempt += 1
      const delay = Math.min(1_000 * 2 ** (reconnectAttempt - 1), MAX_RECONNECT_DELAY_MS)
      setState((current) => ({ ...current, status: 'reconnecting' }))
      reconnectTimer = window.setTimeout(connect, delay)
    }

    function connect() {
      if (!active) return

      setState((current) => ({
        ...current,
        error: undefined,
        status: reconnectAttempt === 0 ? 'connecting' : 'reconnecting',
      }))
      const websocketUrl = new URL(environment.websocketBaseUrl)
      websocketUrl.pathname = `/api/v1/rides/${activeParticipant.ride_id}/participants/${activeParticipant.id}/location`
      socket = new WebSocket(websocketUrl)

      socket.onopen = () => {
        reconnectAttempt = 0
        setState((current) => ({ ...current, status: 'connected' }))
        startWatchingLocation()
      }

      socket.onmessage = (event) => {
        let message: ServerMessage
        try {
          message = JSON.parse(event.data) as ServerMessage
        } catch {
          return
        }

        if (message.type === 'ride.location.snapshot') {
          setState((current) => ({
            ...current,
            locations: message.locations.map(toParticipantLocation),
          }))
        }

        if (message.type === 'participant.location') {
          const location = toParticipantLocation(message)
          setState((current) => ({
            ...current,
            locations: [
              ...current.locations.filter(
                (existingLocation) => existingLocation.participantId !== location.participantId,
              ),
              location,
            ],
          }))
        }

        if (message.type === 'participant.left') {
          setState((current) => ({
            ...current,
            locations: current.locations.filter(
              (location) => location.participantId !== message.participant_id,
            ),
          }))
        }

        if (message.type === 'error') {
          setState((current) => ({ ...current, error: message.detail }))
        }
      }

      socket.onerror = () => {
        setState((current) => ({
          ...current,
          error: 'Live location connection lost. Reconnecting…',
        }))
      }

      socket.onclose = () => {
        stopWatchingLocation()
        if (active) scheduleReconnect()
      }
    }

    connect()

    return () => {
      active = false
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer)
      stopWatchingLocation()
      socket?.close()
    }
  }, [participant?.id, participant?.ride_id])

  return state
}
