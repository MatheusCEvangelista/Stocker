import { useState, useEffect } from "react"
import { ArrowLeft, Minus, Plus, Check, AlertTriangle } from "lucide-react"
import api from "../services/api"

const ESTOQUE_BAIXO = 2

export default function VendaForm({ onNavigate, produtos }) {
  const [carrinho, setCarrinho] = useState({})
  const [paymentType, setPaymentType] = useState("VISTA")
  const [desconto, setDesconto] = useState(0)
  const [jurosDia, setJurosDia] = useState(0)
  const [vencimento, setVencimento] = useState("")
  const [status, setStatus] = useState("PAGO")
  const [erro, setErro] = useState("")
  const [estoques, setEstoques] = useState({})

  useEffect(() => {
    async function loadStock() {
      try {
        const response = await api.get("/stock")
        const movs = response.data
        const totais = {}
        for (const mov of movs) {
          const id = String(mov.productId)
          totais[id] = (totais[id] || 0) + mov.quantity
        }
        setEstoques(totais)
      } catch (e) {
        console.error("Erro ao carregar estoque:", e)
      }
    }
    loadStock()
  }, [])

  const subtotalBruto = Object.entries(carrinho).reduce((acc, [id, qtd]) => {
    const produto = produtos.find((p) => p.id === id)
    return produto ? acc + (produto.preco || 0) * qtd : acc
  }, 0)

  const totalFinal = paymentType === "VISTA"
    ? Math.max(0, subtotalBruto - (desconto || 0))
    : subtotalBruto

  const itensNoCarrinho = Object.values(carrinho).reduce((acc, qtd) => acc + qtd, 0)

  function estoqueDisponivel(id) {
    return estoques[String(id)] ?? 0
  }

  function alterarQuantidade(id, delta) {
    const estoque = estoqueDisponivel(id)
    setCarrinho((prev) => {
      const atual = prev[id] || 0
      const novo = atual + delta
      if (delta > 0 && novo > estoque) return prev
      if (novo <= 0) {
        const copia = { ...prev }
        delete copia[id]
        return copia
      }
      return { ...prev, [id]: novo }
    })
  }

  async function handleFinalizar() {
    if (itensNoCarrinho === 0) return
    setErro("")

    try {
      for (const [id, quantidade] of Object.entries(carrinho)) {
        const produto = produtos.find((p) => p.id === id)
        await api.post("/sales", {
          productId: produto.id,
          quantity: quantidade,
          paymentType,
          status: paymentType === "VISTA" ? "PAGO" : status,
          adjustmentType: paymentType === "VISTA" ? "DESCONTO" : "JUROS",
          adjustmentValue: paymentType === "VISTA" ? desconto : jurosDia,
          dailyInterest: jurosDia,
          dueDate: vencimento || null,
        })
      }
      setCarrinho({})
      onNavigate("vendas")
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || "Erro ao finalizar venda."
      setErro(msg)
      console.error(error.response?.data || error)
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-40">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate("vendas")}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nova Venda</h1>
          <p className="text-slate-500 text-sm">Selecione os produtos</p>
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {produtos.map((produto) => {
          const qtd = carrinho[produto.id] || 0
          const estoque = estoqueDisponivel(produto.id)
          const semEstoque = estoque <= 0
          const estoqueBaixo = estoque > 0 && estoque <= ESTOQUE_BAIXO
          const subtotalProduto = (produto.preco || 0) * qtd

          return (
            <div
              key={produto.id}
              className={`bg-white rounded-xl border p-4 flex flex-col gap-3 transition-all ${
                semEstoque
                  ? "border-slate-100 opacity-60"
                  : qtd > 0
                  ? "border-blue-300 shadow-sm"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{produto.nome}</p>
                  <p className="text-sm text-slate-500">{produto.categoria}</p>
                  <p className="text-blue-600 font-bold mt-0.5">
                    R$ {(produto.preco || 0).toFixed(2)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  {semEstoque ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      Sem estoque
                    </span>
                  ) : estoqueBaixo ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      Restam {estoque}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Estoque: {estoque}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  {qtd > 0 ? (
                    <span className="font-semibold text-emerald-700">
                      Subtotal: R$ {subtotalProduto.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {qtd > 0 && (
                    <button
                      onClick={() => alterarQuantidade(produto.id, -1)}
                      className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                  {qtd > 0 && (
                    <span className="w-7 text-center font-bold text-slate-900 text-sm">{qtd}</span>
                  )}
                  <button
                    onClick={() => alterarQuantidade(produto.id, 1)}
                    disabled={semEstoque || qtd >= estoque}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      semEstoque || qtd >= estoque
                        ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {itensNoCarrinho > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
            <label className="text-sm font-semibold text-slate-700">Tipo de pagamento</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm focus:border-blue-500 transition-colors"
            >
              <option value="VISTA">À vista</option>
              <option value="PRAZO">A prazo</option>
            </select>
          </div>

          {paymentType === "VISTA" && (
            <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
              <label className="text-sm font-semibold text-slate-700">Desconto (R$)</label>
              <input
                type="number" min="0" step="0.01"
                value={desconto}
                onChange={(e) => setDesconto(Number(e.target.value))}
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm focus:border-blue-500 transition-colors"
              />
            </div>
          )}

          {paymentType === "PRAZO" && (
            <>
              <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                <label className="text-sm font-semibold text-slate-700">Juros por dia (%)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={jurosDia}
                  onChange={(e) => setJurosDia(Number(e.target.value))}
                  className="h-11 rounded-xl border border-slate-200 px-3 text-sm focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                <label className="text-sm font-semibold text-slate-700">Data de vencimento</label>
                <input
                  type="date" value={vencimento}
                  onChange={(e) => setVencimento(e.target.value)}
                  className="h-11 rounded-xl border border-slate-200 px-3 text-sm focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                <label className="text-sm font-semibold text-slate-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-11 rounded-xl border border-slate-200 px-3 text-sm focus:border-blue-500 transition-colors"
                >
                  <option value="PAGO">Pago</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="ATRASO">Atraso</option>
                </select>
              </div>
            </>
          )}
        </div>
      )}

      {/* Rodapé fixo com breakdown */}
      {itensNoCarrinho > 0 && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-slate-200 z-30 lg:bottom-0 lg:left-56">
          <div className="px-4 pt-3 pb-4 flex items-end justify-between gap-4">
            <div className="flex flex-col gap-0.5 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 w-20">Subtotal</span>
                <span className="font-medium text-slate-700">R$ {subtotalBruto.toFixed(2)}</span>
              </div>

              {paymentType === "VISTA" && desconto > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 w-20">Desconto</span>
                  <span className="font-medium text-red-500">- R$ {Number(desconto).toFixed(2)}</span>
                </div>
              )}

              {paymentType === "PRAZO" && jurosDia > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 w-20">Juros/dia</span>
                  <span className="font-medium text-amber-600">{jurosDia}%</span>
                </div>
              )}

              <div className="flex items-center gap-3 mt-1 pt-1 border-t border-slate-100">
                <span className="text-slate-700 font-semibold w-20">Total</span>
                <span className="text-xl font-bold text-slate-900">R$ {totalFinal.toFixed(2)}</span>
              </div>

              <p className="text-xs text-slate-400 mt-0.5">
                {itensNoCarrinho} {itensNoCarrinho === 1 ? "item" : "itens"}
              </p>
            </div>

            <button
              onClick={handleFinalizar}
              className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <Check className="w-5 h-5" />
              Finalizar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
