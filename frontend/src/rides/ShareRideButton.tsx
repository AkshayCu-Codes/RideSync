import { useState } from 'react'

type ShareRideButtonProps = {
  rideId: string
}

function getRideShareUrl(rideId: string): string {
  const url = new URL(window.location.href)
  url.searchParams.set('rideId', rideId)
  return url.toString()
}

export function ShareRideButton({ rideId }: ShareRideButtonProps) {
  const [message, setMessage] = useState<string>()

  async function shareRide() {
    const url = getRideShareUrl(rideId)
    const shareData = {
      title: 'Join my RideSync ride',
      text: 'Join my RideSync ride session.',
      url,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        setMessage('Ride link shared.')
        return
      }

      await navigator.clipboard.writeText(url)
      setMessage('Ride link copied to your clipboard.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setMessage('Unable to share the ride link. Please copy the Ride ID instead.')
    }
  }

  return (
    <div className="share-ride">
      <button onClick={shareRide} type="button">
        Share ride
      </button>
      {message && <p className="share-ride__message" role="status">{message}</p>}
    </div>
  )
}
