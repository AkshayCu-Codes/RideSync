import { useEffect, useRef, useState } from 'react'

export type Coordinates = {
  latitude: number
  longitude: number
}

type GeolocationState =
  | { status: 'loading' }
  | { status: 'ready'; coordinates: Coordinates }
  | { status: 'error'; message: string }

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location permission was denied. Enable it in your browser to show your position.'
    case error.POSITION_UNAVAILABLE:
      return 'Your current location is unavailable. Please try again later.'
    case error.TIMEOUT:
      return 'Location request timed out. Please try again later.'
    default:
      return 'Your current location could not be determined.'
  }
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({ status: 'loading' })
  const hasRequestedLocation = useRef(false)

  useEffect(() => {
    if (hasRequestedLocation.current) return
    hasRequestedLocation.current = true

    if (!navigator.geolocation) {
      setState({
        status: 'error',
        message: 'Your browser does not support location services.',
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setState({
          status: 'ready',
          coordinates: { latitude: coords.latitude, longitude: coords.longitude },
        })
      },
      (error) => setState({ status: 'error', message: getGeolocationErrorMessage(error) }),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    )
  }, [])

  return state
}
