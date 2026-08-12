import { Loader } from '@googlemaps/js-api-loader'
import { useEffect, useRef, useState } from 'react'
import { environment } from '../config/environment'
import type { Coordinates } from '../hooks/useGeolocation'

const initialCenter = { lat: 20, lng: 0 }

type GoogleMapProps = {
  currentLocation?: Coordinates
}

export function GoogleMap({ currentLocation }: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map>()
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement>()
  const [error, setError] = useState<string>()
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function initialiseMap() {
      if (
        !environment.googleMapsApiKey ||
        !environment.googleMapsMapId ||
        environment.googleMapsApiKey.startsWith('your_') ||
        environment.googleMapsMapId.startsWith('your_')
      ) {
        setError('Google Maps is not configured. Add its API key and Map ID to .env.')
        return
      }

      try {
        const loader = new Loader({
          apiKey: environment.googleMapsApiKey,
          version: 'weekly',
        })
        const { Map } = (await loader.importLibrary('maps')) as google.maps.MapsLibrary

        if (cancelled || !containerRef.current) return

        mapRef.current = new Map(containerRef.current, {
          center: initialCenter,
          zoom: 2,
          mapId: environment.googleMapsMapId,
          disableDefaultUI: true,
          zoomControl: true,
        })
        setMapReady(true)
      } catch {
        if (!cancelled) {
          setError('Google Maps could not be loaded. Check your network and API configuration.')
        }
      }
    }

    void initialiseMap()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    async function showCurrentLocation() {
      if (!currentLocation || !mapRef.current) return

      const position = { lat: currentLocation.latitude, lng: currentLocation.longitude }
      mapRef.current.setCenter(position)
      mapRef.current.setZoom(16)

      const { AdvancedMarkerElement } = (await google.maps.importLibrary(
        'marker',
      )) as google.maps.MarkerLibrary

      markerRef.current?.remove()
      markerRef.current = new AdvancedMarkerElement({
        map: mapRef.current,
        position,
        title: 'Your current location',
      })
    }

    void showCurrentLocation()
  }, [currentLocation, mapReady])

  return (
    <section className="map" aria-label="RideSync map">
      <div ref={containerRef} className="map__canvas" />
      {error && <p className="map__error" role="alert">{error}</p>}
    </section>
  )
}
