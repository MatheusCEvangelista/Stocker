import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Save, TrendingUp, Barcode, Sparkles, ScanLine, Camera, X } from 'lucide-react'
import api from '../services/api'

// ─── Modal de câmera para leitura de código de barras ────────────────────────
function BarcodeScannerModal({ onScanned, onClose }) {
  const videoRef    = useRef(null)
  const streamRef   = useRef(null)
  const readerRef   = useRef(null)
  const [erro, setErro] = useState('')
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
        // Importação dinâmica para não aumentar o bundle quando não usado
        const { BrowserMultiFormatReader, NotFoundException } = await import('@zxing/browser')

        if (cancelado) return

        const reader = new BrowserMultiFormatReader()
        readerRef.current = reader

        // Solicita câmera traseira no mobile, qualquer câmera no desktop
        const constraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        if (cancelado) { stream.getTracks().forEach((t) => t.stop()); return }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        setIniciando(false)

        // Leitura contínua a cada frame
        reader.decodeFromStream(stream, videoRef.current, (result, err) => {
          if (result) {
            parar()
            onScanned(result.getText())
          }
          // NotFoundException é esperado enquanto não lê nada — ignora
          if (err && !(err instanceof NotFoundException)) {
            console.warn('Scan error:', err)
          }
        })
      } catch (e) {
        if (!cancelado) {
          if (e.name === 'NotAllowedError') {
            setErro('Permissão de câmera negada. Habilite nas configurações do navegador.')
          } else if (e.name === 'NotFoundError') {
            setErro('Nenhuma câmera encontrada neste dispositivo.')
          } else {
            setErro(`Erro ao abrir câmera: ${e.message}`)
          }
          setIniciando(false)
        }
      }
    }

    iniciar()

    return () => {
      cancelado = true
      parar()
    }
  }, [onScanned, parar])

  function handleClose() {
    parar()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={handleClose} />

      <div className="relative z-10 w-full sm:max-w-sm bg-black sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/60 absolute top-0 left-0 right-0 z-10">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-white" />
            <span className="text-white font-semibold text-sm">Ler código de barras</span>
          </div>
          <button onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Vídeo */}
        <div className="relative aspect-[4/3] bg-slate-900 flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Guia de mira */}
          {!erro && !iniciando && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-32 border-2 border-blue-400 rounded-lg relative">
                {/* Cantos animados */}
                <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl" />
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr" />
                <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl" />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br" />
                {/* Linha de scan animada */}
                <div className="absolute left-2 right-2 h-0.5 bg-blue-400 opacity-80 animate-bounce top-1/2" />
              </div>
            </div>
          )}

          {/* Estado: iniciando */}
          {iniciando && !erro && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/80">
              <Camera className="w-10 h-10 text-slate-400 animate-pulse" />
              <p className="text-slate-300 text-sm">Abrindo câmera…</p>
            </div>
          )}

          {/* Estado: erro */}
          {erro && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 px-6 text-center">
              <X className="w-10 h-10 text-red-400" />
              <p className="text-red-300 text-sm">{erro}</p>
              <button onClick={handleClose}
                className="mt-2 px-4 h-9 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors cursor-pointer">
                Fechar
              </button>
            </div>
          )}
        </div>

        {/* Rodapé */}
        {!erro && (
          <div className="px-4 py-3 bg-slate-900 text-center">
            <p className="text-slate-400 text-xs">
              Aponte a câmera para o código de barras da embalagem
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Formulário principal ─────────────────────────────────────────────────────
export default function ProdutoForm({ onNavigate, onSalvar, produtoEditando }) {
  const [code, setCode]           = useState(produtoEditando?.codigo || '')
  const [groupname, setGroupname] = useState(produtoEditando?.categoria || '')
  const [flavor, setFlavor]       = useState(produtoEditando?.sabor || '')
  const [costPrice, setCostPrice] = useState(produtoEditando?.custo?.toString() || '')
  const [sellprice, setSellPrice] = useState(produtoEditando?.preco?.toString() || '')
  const [minstock, setMinstock]   = useState(produtoEditando?.minstock?.toString() || '0')
  const [erro, setErro]           = useState('')
  const [scannerAberto, setScannerAberto] = useState(false)

  const [codeSource, setCodeSource] = useState(produtoEditando ? 'manual' : 'auto')
  const [nextCode, setNextCode]     = useState('')
  const codeInputRef                = useRef(null)
  const barcodeBufferRef            = useRef('')
  const barcodeTimerRef             = useRef(null)

  const custo     = Number(costPrice) || 0
  const venda     = Number(sellprice) || 0
  const margem    = custo > 0 && venda > 0 ? ((venda - custo) / custo) * 100 : null
  const lucroUnit = custo > 0 && venda > 0 ? venda - custo : null

  useEffect(() => {
    if (produtoEditando) return
    api.get('/products/next-code')
      .then((res) => { setNextCode(res.data.code); setCode(res.data.code) })
      .catch(() => { setNextCode('#0001'); setCode('#0001') })
  }, [produtoEditando])

  // Callback quando câmera lê o código
  const handleScanned = useCallback((ean) => {
    setCode(ean)
    setCodeSource('barcode')
    setScannerAberto(false)
    // Foca no próximo campo após leitura
    setTimeout(() => document.getElementById('campo-categoria')?.focus(), 100)
  }, [])

  // Detecção de leitor físico (USB/Bluetooth) via buffer de velocidade
  function handleCodeKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const buf = barcodeBufferRef.current.trim()
      if (buf.length >= 4) {
        setCode(buf)
        setCodeSource('barcode')
      }
      barcodeBufferRef.current = ''
      clearTimeout(barcodeTimerRef.current)
      return
    }
    if (e.key.length === 1) barcodeBufferRef.current += e.key
    clearTimeout(barcodeTimerRef.current)
    barcodeTimerRef.current = setTimeout(() => {
      barcodeBufferRef.current = ''
    }, 80)
  }

  function handleCodeChange(e) {
    setCode(e.target.value)
    if (e.target.value === nextCode) setCodeSource('auto')
    else if (codeSource === 'auto') setCodeSource('manual')
  }

  function handleResetCode() {
    setCode(nextCode)
    setCodeSource('auto')
    codeInputRef.current?.focus()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const codigoFinal = code.trim() || nextCode
    if (!codigoFinal || !groupname || !flavor || !costPrice || !sellprice) {
      setErro('Preencha todos os campos.'); return
    }
    if (isNaN(custo) || custo < 0) { setErro('Informe um preço de custo válido.'); return }
    if (isNaN(venda) || venda <= 0) { setErro('Informe um preço de venda válido.'); return }

    const payload = {
      code: codigoFinal, groupname, flavor,
      costPrice: custo, sellprice: venda,
      minstock: Math.max(0, Number(minstock) || 0),
    }

    try {
      let produtoSalvo
      if (produtoEditando) {
        const response = await api.put(`/products/${produtoEditando.id}`, payload)
        produtoSalvo = response.data
      } else {
        const response = await api.post('/products', payload)
        produtoSalvo = response.data
      }
      onSalvar({
        id: produtoSalvo._id,
        nome: `${produtoSalvo.groupname} - ${produtoSalvo.flavor}`,
        codigo: produtoSalvo.code,
        preco: produtoSalvo.sellprice,
        custo: produtoSalvo.costPrice,
        categoria: produtoSalvo.groupname,
        sabor: produtoSalvo.flavor,
        minstock: produtoSalvo.minstock ?? 0,
      })
    } catch (error) {
      setErro(error.response?.data?.message || 'Erro ao salvar produto.')
    }
  }

  // Badge de origem do código
  function CodeBadge() {
    if (produtoEditando) return null
    if (codeSource === 'barcode') return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
        <Barcode className="w-3 h-3" /> Código de barras
      </span>
    )
    if (codeSource === 'auto') return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
        <Sparkles className="w-3 h-3" /> Auto-gerado
      </span>
    )
    return (
      <button type="button" onClick={handleResetCode}
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full transition-colors cursor-pointer">
        <Sparkles className="w-3 h-3" /> Usar {nextCode}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => onNavigate('produtos')}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label="Voltar">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {produtoEditando ? 'Editar Produto' : 'Novo Produto'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {produtoEditando ? 'Altere os dados do produto' : 'Preencha os dados do produto'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <form onSubmit={handleSubmit} className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4">
          {erro && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">{erro}</div>
          )}

          {/* Campo código com câmera + leitor físico */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-slate-700">Código</label>
              <CodeBadge />
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={codeInputRef}
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  onKeyDown={handleCodeKeyDown}
                  placeholder="Auto, leitor físico ou câmera"
                  className={`w-full h-12 pl-10 pr-4 rounded-xl border bg-slate-50 text-slate-900 placeholder-slate-400 focus:ring-2 transition-all ${
                    codeSource === 'barcode'
                      ? 'border-violet-400 focus:border-violet-500 focus:ring-violet-500/20'
                      : codeSource === 'auto'
                      ? 'border-blue-300 focus:border-blue-500 focus:ring-blue-500/20'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
              </div>

              {/* Botão câmera — destaque no mobile */}
              <button
                type="button"
                onClick={() => setScannerAberto(true)}
                className="w-12 h-12 rounded-xl bg-violet-600 hover:bg-violet-700 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
                title="Ler código de barras com a câmera"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            {!produtoEditando && (
              <p className="text-xs text-slate-400">
                Use a câmera 📷 para ler o código EAN da embalagem, passe o leitor físico, ou deixe o código automático <strong>{nextCode || '…'}</strong>.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Categoria (Grupo)</label>
            <input id="campo-categoria" type="text" value={groupname}
              onChange={(e) => setGroupname(e.target.value)}
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Sabor / Variação</label>
            <input type="text" value={flavor} onChange={(e) => setFlavor(e.target.value)}
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Preço de Custo</label>
              <input type="number" step="0.01" min="0" value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Preço de Venda</label>
              <input type="number" step="0.01" min="0.01" value={sellprice}
                onChange={(e) => setSellPrice(e.target.value)}
                className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Estoque Mínimo (Alerta)
              <span className="ml-1.5 text-xs font-normal text-slate-400">— avisa quando disponível ≤ esse valor</span>
            </label>
            <input type="number" min="0" step="1" value={minstock}
              onChange={(e) => setMinstock(e.target.value)}
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>

          <button type="submit"
            className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors mt-2 cursor-pointer">
            <Save className="w-5 h-5" />
            {produtoEditando ? 'Salvar Alterações' : 'Cadastrar Produto'}
          </button>
        </form>

        {/* Card de margem */}
        {margem !== null && (
          <div className="lg:w-64 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-600" />
              <h2 className="font-semibold text-slate-900">Análise de Margem</h2>
            </div>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Preço de custo</span>
                <span className="font-medium text-slate-700">R$ {custo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Preço de venda</span>
                <span className="font-semibold text-slate-900">R$ {venda.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Lucro por unidade</span>
                  <span className={`font-semibold ${lucroUnit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    R$ {lucroUnit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Margem</span>
                  <span className={`text-lg font-bold ${
                    margem >= 20 ? 'text-emerald-600' : margem >= 0 ? 'text-amber-600' : 'text-red-600'
                  }`}>{margem.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className={`h-2 rounded-full transition-all ${
                    margem >= 20 ? 'bg-emerald-500' : margem >= 0 ? 'bg-amber-500' : 'bg-red-500'
                  }`} style={{ width: `${Math.min(Math.max(margem, 0), 100)}%` }} />
                </div>
                <p className={`text-xs font-medium ${
                  margem >= 20 ? 'text-emerald-600' : margem >= 0 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {margem >= 20 ? '✓ Margem saudável' : margem >= 0 ? '⚠ Margem baixa' : '✗ Venda abaixo do custo'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de scanner */}
      {scannerAberto && (
        <BarcodeScannerModal
          onScanned={handleScanned}
          onClose={() => setScannerAberto(false)}
        />
      )}
    </div>
  )
}
