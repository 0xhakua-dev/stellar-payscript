import { useState, useEffect, useCallback } from 'react'
import { albedoConnect, albedoSignTransaction } from '../lib/albedo'

export type WalletState = 'idle' | 'connecting' | 'connected' | 'error' | 'not_installed'
export type WalletProvider = 'freighter' | 'albedo'

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>('idle')
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [provider, setProvider] = useState<WalletProvider | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Auto-reconnect Freighter only (Albedo has no persistent session)
  useEffect(() => {
    const check = async () => {
      try {
        const f = await import('@stellar/freighter-api')
        const connected = await f.isConnected()
        if (connected) {
          const info = await f.getUserInfo()
          if (info && info.publicKey) {
            setPublicKey(info.publicKey)
            setProvider('freighter')
            setWalletState('connected')
          }
        }
      } catch { /* not connected */ }
    }
    check()
  }, [])

  const connectFreighter = useCallback(async () => {
    setWalletState('connecting')
    setError(null)
    try {
      const f = await import('@stellar/freighter-api')
      const connected = await f.isConnected()
      if (!connected) {
        setWalletState('not_installed')
        setError('Freighter not found — install it at freighter.app')
        return
      }
      await f.requestAccess()
      const info = await f.getUserInfo()
      if (!info || !info.publicKey) throw new Error('Could not retrieve wallet address')
      const networkDetails = await f.getNetworkDetails()
      if (!networkDetails.networkPassphrase.includes('Test')) {
        throw new Error('Switch Freighter to Testnet to use PayScript')
      }
      setPublicKey(info.publicKey)
      setProvider('freighter')
      setWalletState('connected')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
      setWalletState('error')
    }
  }, [])

  const connectAlbedo = useCallback(async () => {
    setWalletState('connecting')
    setError(null)
    try {
      const pubkey = await albedoConnect()
      setPublicKey(pubkey)
      setProvider('albedo')
      setWalletState('connected')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Albedo connection failed')
      setWalletState('error')
    }
  }, [])

  const disconnect = useCallback(() => {
    setPublicKey(null)
    setProvider(null)
    setWalletState('idle')
    setError(null)
  }, [])

  // Unified signing — routes to whichever wallet is active
  const signTransaction = useCallback(
    async (xdr: string, networkPassphrase: string): Promise<string> => {
      if (provider === 'albedo') {
        return albedoSignTransaction(xdr, networkPassphrase)
      }
      // Default: Freighter
      const f = await import('@stellar/freighter-api')
      const signed = await f.signTransaction(xdr, {
        network: 'TESTNET',
        networkPassphrase,
      })
      if (!signed) throw new Error('Transaction signing cancelled')
      return signed as unknown as string
    },
    [provider]
  )

  return {
    walletState,
    publicKey,
    provider,
    error,
    connectFreighter,
    connectAlbedo,
    disconnect,
    signTransaction,
    isConnected: walletState === 'connected' && !!publicKey,
  }
}