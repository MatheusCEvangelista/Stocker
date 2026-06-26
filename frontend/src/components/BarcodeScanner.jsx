import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, X, Barcode } from 'lucide-react'

export function BarcodeScannerModal({ onScanned, onClose }) {
  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const readerRef = useRef(null)
  const [erro, setErro]           = useState('')
  const [iniciando, setIniciando] = useState(true)

  const parar = useCallback(() => {
    try { readerRef.current?.reset() } catch (_) {}
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    let cancelado = false
    async function iniciar() {
      try {
        const { BrowserMultiFormatReader, NotFoundException } = await import('@zxing/browser')
        if (cancelado) return
        const reader = new BrowserMultiFormatReader()
        readerRef.current = reader
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        })
        if (cancelado) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
        setIniciando(false)
        reader.decodeFromStream(stream, videoRef.current, (result, err) => {
          if (result) { parar(); onScanned(result.getText()) }
          if (err && !(err instanceof NotFoundException)) console.warn('Scan error:', err)
        })
      } catch (e) {
        if (!cancelado) {
          setErro(
            e.name === 'NotAllowedError' ? 'Permissão de câmera negada. Habilite nas configurações do navegador.' :
            e.name === 'NotFoundError'   ? 'Nenhuma câmera encontrada neste dispositivo.' :
            `Erro ao abrir câmera: ${e.message}`
          )
          setIniciando(false)
        }
      }
    }
    iniciar()
    return () => { cancelado = true; parar() }
  }, [onScanned, parar])

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={() => { parar(); onClose() }} />
      <div className="relative z-10 w-full sm:max-w-sm bg-black sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 bg-black/60 absolute top-0 left-0 right-0 z-10">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-white" />
            <span className="text-white font-semibold text-sm">Ler código de barras</span>
          </div>
          <button onClick={() => { parar(); onClose() }}
            className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative aspect-[4/3] bg-slate-900 flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          {!erro && !iniciando && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-32 border-2 border-blue-400 rounded-lg relative">
                <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl" />
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr" />
                <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl" />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br" />
                <div className="absolute left-2 right-2 h-0.5 bg-blue-400 opacity-80 animate-bounce top-1/2" />
              </div>
            </div>
          )}
          {iniciando && !erro && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/80">
              <Camera className="w-10 h-10 text-slate-400 animate-pulse" />
              <p className="text-slate-300 text-sm">Abrindo câmera…</p>
            </div>
          )}
          {erro && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 px-6 text-center">
              <X className="w-10 h-10 text-red-400" />
              <p className="text-red-300 text-sm">{erro}</p>
              <button onClick={() => { parar(); onClose() }}
                className="mt-2 px-4 h-9 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors cursor-pointer">
                Fechar
              </button>
            </div>
          )}
        </div>
        {!erro && (
          <div className="px-4 py-3 bg-slate-900 text-center">
            <p className="text-slate-400 text-xs">Aponte a câmera para o código de barras da embalagem</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Campo de busca que aceita câmera e leitor físico
export function BarcodeSearchInput({ placeholder, onCode, className = '' }) {
  const [scannerAberto, setScannerAberto] = useState(false)
  const [valor, setValor]                 = useState('')
  const inputRef  = useRef(null)
  const bufferRef = useRef('')
  const timerRef  = useRef(null)

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const buf = bufferRef.current.trim()
      const term = buf.length >= 4 ? buf : valor.trim()
      if (term.length >= 1) { onCode(term); setValor('') }
      bufferRef.current = ''
      clearTimeout(timerRef.current)
      return
    }
    if (e.key.length === 1) bufferRef.current += e.key
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { bufferRef.current = '' }, 80)
  }

  function handleScanned(code) {
    setScannerAberto(false)
    onCode(code)
    setValor('')
  }

  return (
    <>
      <div className={`flex gap-2 ${className}`}>
        <div className="relative flex-1">
          <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Buscar por nome, código ou EAN…'}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <button type="button" onClick={() => setScannerAberto(true)}
          className="w-11 h-11 rounded-xl bg-violet-600 hover:bg-violet-700 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
          title="Ler código de barras com a câmera">
          <Camera className="w-5 h-5" />
        </button>
      </div>
      {scannerAberto && (
        <BarcodeScannerModal onScanned={handleScanned} onClose={() => setScannerAberto(false)} />
      )}
    </>
  )
}
