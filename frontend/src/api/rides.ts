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

export type LeaveRideResult = {
  participant_id: string
  ride_id: string
  status: 'left'
}

type ApiErrorResponse = {
  detail?: string
}

async function request<T>(path: string, method: 'POST' | 'DELETE', body?: object): Promise<T> {
  const response = await fetch(`${environment.apiBaseUrl}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiErrorResponse
    throw new Error(error.detail ?? 'RideSync could not complete that request.')
  }

  return (await response.json()) as T
}

export function createRide(name: string): Promise<Ride> {
  return request<Ride>('/api/v1/rides', 'POST', { name })
}

export function joinRide(rideId: string, displayName: string): Promise<Participant> {
  return request<Participant>(`/api/v1/rides/${rideId}/participants`, 'POST', {
    display_name: displayName,
  })
}

export function leaveRide(rideId: string, participantId: string): Promise<LeaveRideResult> {
  return request<LeaveRideResult>(
    `/api/v1/rides/${rideId}/participants/${participantId}`,
    'DELETE',
  )
}
