const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const environment = {
  apiBaseUrl,
  websocketBaseUrl:
    import.meta.env.VITE_WEBSOCKET_BASE_URL ?? apiBaseUrl.replace(/^http/, 'ws'),
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  googleMapsMapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
}
