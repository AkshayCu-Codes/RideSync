import { environment } from '../config/environment'

export type Ride = {
  id: string
  name: string
  created_at: string
}

export type Participant = {
  id: string
  ride_id: string
  display_name: string
  joined_at: string
}

type ApiErrorResponse = {
  detail?: string
}

async function request<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`${environment.apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiErrorResponse
    throw new Error(error.detail ?? 'RideSync could not complete that request.')
  }

  return (await response.json()) as T
}

export function createRide(name: string): Promise<Ride> {
  return request<Ride>('/api/v1/rides', { name })
}

export function joinRide(rideId: string, displayName: string): Promise<Participant> {
  return request<Participant>(`/api/v1/rides/${rideId}/participants`, {
    display_name: displayName,
  })
}
