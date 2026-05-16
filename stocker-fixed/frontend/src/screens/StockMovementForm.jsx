import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import api from "../services/api"

export default function StockMovementForm({ onNavigate, produtos }) {
  const [movements, setMovements] = useState([])
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [type, setType] = useState("Entrada")
  const [currentStock, setCurrentStock] = useState(0)
  const [erro, setErro] = useState("")

  useEffect(() => {
    loadMovements()
  }, [])

  async function loadMovements() {
    try {
      const response = await api.get("/stock")
      setMovements(response.data)
    } catch (error) {
      console.error("Erro ao carregar movimentações:", error)
    }
  }

  // CORRIGIDO: mov.productId é um ObjectId (objeto), comparação precisa usar
  // mov.productId?._id ou mov.productId?.toString() para funcionar corretamente.
  // Como a rota /stock não usa populate, productId chega como string do ObjectId.
  function calculateStock(id, movs = movements) {
    const total = movs
      .filter((mov) => String(mov.productId) === String(id))
      .reduce((acc, mov) => acc + mov.quantity, 0)

    setCurrentStock(total)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro("")

    const qty = Number(quantity)

    if (!productId || !qty || qty <= 0) {
      setErro("Preencha os campos corretamente.")
      return
    }

    if ((type === "Saída" || type === "Estorno") && qty > currentStock) {
      setErro("Estoque insuficiente para esta operação.")
      return
    }

    try {
      await api.post("/stock", {
        productId,
        quantity: type === "Entrada" || type === "Ajuste" ? qty : -qty,
        type,
      })

      setQuantity("")

      // Recarrega movimentos e recalcula estoque após salvar
      const response = await api.get("/stock")
      setMovements(response.data)
      calculateStock(productId, response.data)
    } catch (error) {
      setErro(error.response?.data?.message || "Erro ao salvar movimentação.")
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate("produtos")}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Movimentação de Estoque</h1>
          <p className="text-slate-500 text-sm mt-1">Registre entradas, saídas e ajustes</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {erro && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
              {erro}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600">Produto</label>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value)
                calculateStock(e.target.value)
              }}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm focus:border-blue-600 transition-colors"
            >
              <option value="">Selecione...</option>
              {produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700">
            Estoque atual: <strong>{currentStock}</strong>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm focus:border-blue-600 transition-colors"
            >
              <option value="Entrada">Entrada</option>
              <option value="Saída">Saída</option>
              <option value="Ajuste">Ajuste</option>
              <option value="Estorno">Estorno</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600">Quantidade</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm focus:border-blue-600 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Salvar Movimentação
          </button>
        </form>
      </div>
    </div>
  )
}
