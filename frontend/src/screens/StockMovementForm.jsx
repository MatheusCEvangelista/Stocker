import { useEffect, useState } from "react"
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, RotateCcw, SlidersHorizontal, Search, Package, X, Check } from "lucide-react"
import api from "../services/api"
import { BarcodeSearchInput } from "../components/BarcodeScanner"

const TIPO_CONFIG = {
  Entrada:  { cor: "bg-emerald-100 text-emerald-700", icone: ArrowDownCircle, sinal: "+" },
  Saída:    { cor: "bg-red-100 text-red-600",         icone: ArrowUpCircle,   sinal: "-" },
  Estorno:  { cor: "bg-amber-100 text-amber-700",     icone: RotateCcw,       sinal: "+" },
  Ajuste:   { cor: "bg-blue-100 text-blue-700",       icone: SlidersHorizontal, sinal: "±" },
}

function nomeProduto(mov) {
  if (mov.productId?.groupname) return `${mov.productId.groupname} - ${mov.productId.flavor}`
  return "Produto removido"
}

export default function StockMovementForm({ onNavigate, produtos }) {
  const [movements, setMovements]   = useState([])
  const [productId, setProductId]   = useState("")
  const [quantity, setQuantity]     = useState("")
  const [type, setType]             = useState("Entrada")
  const [currentStock, setCurrentStock] = useState(0)
  const [erro, setErro]             = useState("")
  const [carregando, setCarregando] = useState(true)

  // Card de produto escaneado
  const [produtoScaneado, setProdutoScaneado] = useState(null)
  const [naoEncontrado, setNaoEncontrado]     = useState(false)

  // Filtros do histórico
  const [filtroProduto, setFiltroProduto] = useState("")
  const [filtroTipo, setFiltroTipo]       = useState("")
  const [buscaHistorico, setBuscaHistorico] = useState("")

  useEffect(() => { loadMovements() }, [])

  async function loadMovements() {
    setCarregando(true)
    try {
      const response = await api.get("/stock")
      setMovements(response.data)
    } catch (error) {
      console.error("Erro ao carregar movimentações:", error)
    } finally {
      setCarregando(false)
    }
  }

  function calcStock(id, movs = movements) {
    return movs
      .filter((m) => {
        const mid = m.productId?._id ? String(m.productId._id) : String(m.productId)
        return mid === String(id)
      })
      .reduce((acc, m) => acc + m.quantity, 0)
  }

  // Chamado quando o campo de busca recebe código (câmera ou leitor físico ou Enter)
  function handleBuscaCodigo(term) {
    setNaoEncontrado(false)
    setProdutoScaneado(null)

    // Busca por código EAN exato primeiro, depois por nome parcial
    const porCodigo = produtos.find((p) =>
      p.codigo?.toLowerCase() === term.toLowerCase()
    )
    const porNome = produtos.find((p) =>
      p.nome?.toLowerCase().includes(term.toLowerCase())
    )
    const encontrado = porCodigo || porNome

    if (encontrado) {
      const estoque = calcStock(encontrado.id)
      setProdutoScaneado({ ...encontrado, estoqueAtual: estoque })
      setProductId(encontrado.id)
      setCurrentStock(estoque)
    } else {
      setNaoEncontrado(true)
    }
  }

  function handleDescartarCard() {
    setProdutoScaneado(null)
    setNaoEncontrado(false)
    setProductId("")
    setQuantity("")
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro("")

    const qty = Number(quantity)
    if (!productId || !qty || qty <= 0) { setErro("Preencha os campos corretamente."); return }
    if ((type === "Saída" || type === "Estorno") && qty > currentStock) {
      setErro("Estoque insuficiente para esta operação."); return
    }

    try {
      await api.post("/stock", {
        productId,
        quantity: type === "Entrada" || type === "Ajuste" ? qty : -qty,
        type,
      })

      setQuantity("")
      setProdutoScaneado(null)
      setProductId("")

      const response = await api.get("/stock")
      setMovements(response.data)
      if (productId) setCurrentStock(calcStock(productId, response.data))
    } catch (error) {
      setErro(error.response?.data?.message || "Erro ao salvar movimentação.")
    }
  }

  const historico = movements.filter((mov) => {
    const nome = nomeProduto(mov).toLowerCase()
    const matchBusca = !buscaHistorico || nome.includes(buscaHistorico.toLowerCase())
    const matchTipo  = !filtroTipo || mov.type === filtroTipo
    const matchProd  = !filtroProduto || (
      mov.productId?._id ? String(mov.productId._id) : String(mov.productId)
    ) === filtroProduto
    return matchBusca && matchTipo && matchProd
  })

  const totalEntradas = historico.filter((m) => m.quantity > 0).reduce((acc, m) => acc + m.quantity, 0)
  const totalSaidas   = historico.filter((m) => m.quantity < 0).reduce((acc, m) => acc + Math.abs(m.quantity), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => onNavigate("produtos")}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label="Voltar">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Estoque</h1>
          <p className="text-slate-500 text-sm mt-0.5">Movimentações e histórico</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">

        {/* ── Formulário ── */}
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-slate-800">Nova movimentação</h2>

          {/* Campo de busca com câmera */}
          <BarcodeSearchInput
            placeholder="Buscar produto por nome, código ou EAN…"
            onCode={handleBuscaCodigo}
          />

          {/* Card do produto escaneado */}
          {naoEncontrado && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-sm text-red-600">Produto não encontrado. Verifique o código ou cadastre-o primeiro.</p>
              <button onClick={handleDescartarCard} className="text-red-400 hover:text-red-600 cursor-pointer shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {produtoScaneado && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{produtoScaneado.nome}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cód: {produtoScaneado.codigo} · Estoque atual: <strong>{produtoScaneado.estoqueAtual}</strong>
                    </p>
                  </div>
                </div>
                <button onClick={handleDescartarCard} className="text-slate-400 hover:text-slate-600 cursor-pointer shrink-0 mt-0.5">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tipo */}
              <div className="grid grid-cols-2 gap-2">
                {["Entrada", "Saída", "Ajuste", "Estorno"].map((t) => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`h-9 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                      type === t
                        ? t === "Entrada" ? "bg-emerald-600 border-emerald-600 text-white"
                        : t === "Saída"   ? "bg-red-600 border-red-600 text-white"
                        : t === "Ajuste"  ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-amber-500 border-amber-500 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>

              {/* Quantidade */}
              <div className="flex gap-2">
                <input
                  type="number" min="1" value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Quantidade"
                  className="flex-1 h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:border-blue-500 transition-colors"
                  autoFocus
                />
                <button onClick={handleSubmit}
                  className="h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer">
                  <Check className="w-4 h-4" />
                  Confirmar
                </button>
              </div>

              {erro && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>
              )}
            </div>
          )}

          {/* Formulário manual (select) quando não há produto escaneado */}
          {!produtoScaneado && !naoEncontrado && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {erro && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">{erro}</div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-600">Produto</label>
                  <select value={productId}
                    onChange={(e) => {
                      setProductId(e.target.value)
                      setCurrentStock(calcStock(e.target.value))
                    }}
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm focus:border-blue-600 transition-colors">
                    <option value="">Selecione ou use o campo acima…</option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>

                {productId && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700">
                    Estoque atual: <strong className="text-slate-900">{currentStock}</strong>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-600">Tipo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Entrada", "Saída", "Ajuste", "Estorno"].map((t) => (
                      <button key={t} type="button" onClick={() => setType(t)}
                        className={`h-10 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                          type === t
                            ? t === "Entrada" ? "bg-emerald-600 border-emerald-600 text-white"
                            : t === "Saída"   ? "bg-red-600 border-red-600 text-white"
                            : t === "Ajuste"  ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-amber-500 border-amber-500 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-600">Quantidade</label>
                  <input type="number" min="1" value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm focus:border-blue-600 transition-colors" />
                </div>

                <button type="submit"
                  className="h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors cursor-pointer">
                  Salvar Movimentação
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ── Histórico ── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base font-semibold text-slate-800">Histórico</h2>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-emerald-600 font-semibold">+{totalEntradas} entrada{totalEntradas !== 1 ? "s" : ""}</span>
              <span className="text-slate-300">·</span>
              <span className="text-red-500 font-semibold">−{totalSaidas} saída{totalSaidas !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input placeholder="Buscar produto…" value={buscaHistorico}
                onChange={(e) => setBuscaHistorico(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:border-blue-500 transition-colors" />
            </div>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:border-blue-500 transition-colors">
              <option value="">Todos os tipos</option>
              <option value="Entrada">Entrada</option>
              <option value="Saída">Saída</option>
              <option value="Ajuste">Ajuste</option>
              <option value="Estorno">Estorno</option>
            </select>
            <select value={filtroProduto} onChange={(e) => setFiltroProduto(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:border-blue-500 transition-colors">
              <option value="">Todos os produtos</option>
              {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>

          {carregando ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">Carregando histórico…</div>
          ) : historico.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              {movements.length === 0 ? "Nenhuma movimentação registrada ainda." : "Nenhum resultado para os filtros aplicados."}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="hidden sm:grid sm:grid-cols-[1fr_120px_90px_100px] px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide gap-4">
                <span>Produto</span><span>Tipo</span><span className="text-right">Qtd</span><span className="text-right">Data</span>
              </div>
              <div className="divide-y divide-slate-100">
                {historico.map((mov) => {
                  const cfg  = TIPO_CONFIG[mov.type] || TIPO_CONFIG["Ajuste"]
                  const Icone = cfg.icone
                  const data = new Date(mov.date).toLocaleDateString("pt-BR")
                  const hora = new Date(mov.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                  const qtdAbs = Math.abs(mov.quantity)
                  return (
                    <div key={mov._id} className="px-4 py-3">
                      <div className="sm:hidden flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.cor}`}>
                          <Icone className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{nomeProduto(mov)}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{data} às {hora}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.cor}`}>{mov.type}</span>
                          <p className={`font-bold mt-1 ${mov.quantity > 0 ? "text-emerald-600" : "text-red-500"}`}>{cfg.sinal}{qtdAbs}</p>
                        </div>
                      </div>
                      <div className="hidden sm:grid sm:grid-cols-[1fr_120px_90px_100px] items-center gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.cor}`}>
                            <Icone className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{nomeProduto(mov)}</p>
                            <p className="text-xs text-slate-400">{hora}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${cfg.cor}`}>{mov.type}</span>
                        <p className={`font-bold text-right ${mov.quantity > 0 ? "text-emerald-600" : "text-red-500"}`}>{cfg.sinal}{qtdAbs}</p>
                        <p className="text-sm text-slate-500 text-right">{data}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
