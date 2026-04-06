import { useState } from "react"
import { ArrowLeft, Minus, Plus, ShoppingCart, Check } from "lucide-react"
import api from "../services/api"

export default function VendaForm({ onNavigate, produtos }) {
  const [carrinho, setCarrinho] = useState({})
  const [paymentType, setPaymentType] = useState("VISTA")
  const [desconto, setDesconto] = useState(0)
  const [jurosDia, setJurosDia] = useState(0)
  const [vencimento, setVencimento] = useState("")
  const [status,setStatus] = useState("PAGO")
  const total = Object.entries(carrinho).reduce((acc, [id, qtd]) => {
    const produto = produtos.find((p) => p.id === id)
    return produto ? acc + (produto.preco || 0) * qtd : acc
  }, 0)

  const itensNoCarrinho = Object.values(carrinho).reduce(
    (acc, qtd) => acc + qtd,
    0
  )

  function alterarQuantidade(id, delta) {
    setCarrinho((prev) => {
      const atual = prev[id] || 0
      const novo = atual + delta

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

  try {
    for (const [id, quantidade] of Object.entries(carrinho)) {
      const produto = produtos.find((p) => p.id === id)

      await api.post("/sales", {
        productId: produto.id,
        quantity: quantidade,
        paymentType ,
        status,
        adjustmentType: paymentType === "VISTA"? "DESCONTO": "JUROS",
        adjustmentValue: desconto,
        dailyInterest: jurosDia,
        dueDate: vencimento || null
      })
    }

    setCarrinho({})
    onNavigate('vendas')

  } catch (error) {
    console.error(error.response?.data || error)
  }
}

  return (
    <div className="flex flex-col gap-4 pb-32">

      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate("vendas")}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-2xl font-bold">Nova Venda</h1>
          <p className="text-slate-500 text-sm">Selecione os produtos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {produtos.map((produto) => {
          const qtd = carrinho[produto.id] || 0

          return (
            <div
              key={produto.id}
              className={`bg-white rounded-xl border p-4 flex items-center gap-3 ${
                qtd > 0 ? "border-blue-300" : "border-slate-200"
              }`}
            >
              <div className="flex-1">
                <p className="font-semibold">{produto.nome}</p>
                <p className="text-sm text-slate-500">{produto.categoria}</p>
                <p className="text-blue-600 font-bold">
                  R$ {(produto.preco || 0).toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-2">

                {qtd > 0 && (
                  <button
                    onClick={() => alterarQuantidade(produto.id, -1)}
                    className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}

                {qtd > 0 && (
                  <span className="w-8 text-center font-bold">{qtd}</span>
                )}

                <button
                  onClick={() => alterarQuantidade(produto.id, 1)}
                  className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>

              </div>
            </div>
          )
        })}
      </div>

      {itensNoCarrinho > 0 && (

        <div className="bg-white border rounded-xl p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <label className="text-sm font-semibold">Tipo de pagamento</label>

            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full border rounded-lg p-2 mt-1"
            >
              <option value="VISTA">À vista</option>
              <option value="PRAZO">A prazo</option>
            </select>
          </div>

          {paymentType === "VISTA" && (
            <div>
              <label className="text-sm font-semibold">Desconto</label>
              <input
                type="number"
                value={desconto}
                onChange={(e) => setDesconto(Number(e.target.value))}
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
          )}

          {paymentType === "PRAZO" && (
            <>
              <div>
                <label className="text-sm font-semibold">Juros por dia</label>
                <input
                  type="number"
                  value={jurosDia}
                  onChange={(e) => setJurosDia(Number(e.target.value))}
                  className="w-full border rounded-lg p-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Data de vencimento</label>
                <input
                  type="date"
                  value={vencimento}
                  onChange={(e) => setVencimento(e.target.value)}
                  className="w-full border rounded-lg p-2 mt-1"
                />
              </div>
              <div>
              <label className="text-sm font-semibold">Status</label>

              <select
              value={status}
              onChange={(e)=>setStatus(e.target.value)}
              className="w-full border rounded-lg p-2 mt-1"
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
      {itensNoCarrinho > 0 && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 flex items-center justify-between lg:bottom-0">

          <div>
            <p className="text-sm text-slate-500">
              {itensNoCarrinho} itens
            </p>

            <p className="text-xl font-bold">
              R$ {total.toFixed(2)}
            </p>
          </div>

          <button
            onClick={handleFinalizar}
            className="h-12 px-6 bg-emerald-600 text-white font-semibold rounded-xl flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            Finalizar
          </button>

        </div>
      )}

    </div>
  )
}