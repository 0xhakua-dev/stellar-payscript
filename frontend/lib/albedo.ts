// lib/albedo.ts — minimal Albedo wallet integration
// Albedo is web-based, no browser extension required
// Docs: https://albedo.link/docs

const ALBEDO_INTENT_URL = 'https://albedo.link/intent'

interface AlbedoPublicKeyResult {
  pubkey: string
  signed_message?: string
}

interface AlbedoTxResult {
  signed_envelope_xdr: string
}

// Opens Albedo popup and requests the user's public key
export async function albedoConnect(): Promise<string> {
  return new Promise((resolve, reject) => {
    const width = 450
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const params = new URLSearchParams({
      intent: 'public_key',
      callback: window.location.origin + '/albedo-callback',
    })

    const popup = window.open(
      `${ALBEDO_INTENT_URL}/public_key?${params.toString()}`,
      'albedo-connect',
      `width=${width},height=${height},left=${left},top=${top}`
    )

    if (!popup) {
      reject(new Error('Popup blocked — allow popups for this site'))
      return
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://albedo.link') return
      if (event.data?.pubkey) {
        window.removeEventListener('message', handleMessage)
        popup.close()
        resolve(event.data.pubkey)
      } else if (event.data?.error) {
        window.removeEventListener('message', handleMessage)
        popup.close()
        reject(new Error(event.data.error))
      }
    }

    window.addEventListener('message', handleMessage)

    // Timeout after 60s if user never responds
    setTimeout(() => {
      window.removeEventListener('message', handleMessage)
      if (!popup.closed) popup.close()
      reject(new Error('Albedo connection timed out'))
    }, 60000)
  })
}

// Signs a transaction XDR using Albedo
export async function albedoSignTransaction(
  xdr: string,
  networkPassphrase: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const width = 450
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const params = new URLSearchParams({
      intent: 'tx',
      xdr,
      network: networkPassphrase.includes('Test') ? 'testnet' : 'public',
      callback: window.location.origin + '/albedo-callback',
    })

    const popup = window.open(
      `${ALBEDO_INTENT_URL}/tx?${params.toString()}`,
      'albedo-sign',
      `width=${width},height=${height},left=${left},top=${top}`
    )

    if (!popup) {
      reject(new Error('Popup blocked — allow popups for this site'))
      return
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://albedo.link') return
      if (event.data?.signed_envelope_xdr) {
        window.removeEventListener('message', handleMessage)
        popup.close()
        resolve(event.data.signed_envelope_xdr)
      } else if (event.data?.error) {
        window.removeEventListener('message', handleMessage)
        popup.close()
        reject(new Error(event.data.error))
      }
    }

    window.addEventListener('message', handleMessage)

    setTimeout(() => {
      window.removeEventListener('message', handleMessage)
      if (!popup.closed) popup.close()
      reject(new Error('Albedo signing timed out'))
    }, 60000)
  })
}