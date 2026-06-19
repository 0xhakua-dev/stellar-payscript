import { useState } from 'react'
import { Wallet, Loader2, AlertCircle, X } from 'lucide-react'
import { formatAddress } from '../lib/stellar'
import type { WalletState, WalletProvider } from '../hooks/useWallet'

interface Props {
  walletState: WalletState
  publicKey: string | null
  provider: WalletProvider | null
  error: string | null
  connectFreighter: () => void
  connectAlbedo: () => void
  disconnect: () => void
}

export default function WalletConnect({
  walletState, publicKey, provider, error, connectFreighter, connectAlbedo, disconnect
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  const handleConnect = (fn: () => void) => {
    fn()
    setModalOpen(false)
  }

  return (
    <div className="border border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-3.5 h-3.5 text-white/30" />
        <span className="text-xs text-white/30 font-mono uppercase tracking-widest">Wallet</span>
      </div>

      {walletState === 'connected' && publicKey ? (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="font-mono text-sm">{formatAddress(publicKey)}</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded border border-emerald-400/20 text-emerald-400">
              {provider === 'albedo' ? 'Albedo' : 'Freighter'} · Testnet
            </span>
          </div>
          <button onClick={disconnect} className="text-xs text-white/30 hover:text-white/60 transition-colors font-mono">
            disconnect
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setModalOpen(true)}
            disabled={walletState === 'connecting'}
            className="w-full flex items-center justify-center gap-2 bg-white text-black text-sm font-medium py-3 rounded-lg hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {walletState === 'connecting'
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
              : <><Wallet className="w-4 h-4" /> Connect Wallet</>
            }
          </button>

          {walletState === 'not_installed' && (
            <p className="mt-3 flex items-center gap-2 text-xs text-amber-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Freighter not found.{' '}
              <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                Install it here →
              </a>
            </p>
          )}

          {walletState === 'error' && error && (
            <p className="mt-3 flex items-start gap-2 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {error}
            </p>
          )}
        </div>
      )}

      {/* Wallet picker modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-xl p-5 animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-medium">Connect a wallet</span>
              <button
                onClick={() => setModalOpen(false)}
                className="text-white/30 hover:text-white/60 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleConnect(connectFreighter)}
                className="w-full flex items-center justify-between gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">Freighter</div>
                    <div className="text-xs text-white/40">Browser extension</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleConnect(connectAlbedo)}
                className="w-full flex items-center justify-between gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">Albedo</div>
                    <div className="text-xs text-white/40">Web-based, no install</div>
                  </div>
                </div>
              </button>
            </div>

            <p className="text-xs text-white/20 mt-4 text-center font-mono">
              Stellar Testnet only
            </p>
          </div>
        </div>
      )}
    </div>
  )
}