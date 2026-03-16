import { useEffect, useState } from "react"
import api from "../services/api"

export default function StockMovementForm({ produtos }) {
  const [movements, setMovements] = useState([])
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [type, setType] = useState("Entrada")
  const [currentStock, setCurrentStock] = useState(0)

  useEffect(() => {
    loadMovements()
  }, [])

  async function loadMovements() {
    const response = await api.get("/stock")
    setMovements(response.data)
  }

  function calculateStock(id) {
    const total = movements
      .filter(mov => mov.productId === id)
      .reduce((acc, mov) => acc + mov.quantity, 0)

    setCurrentStock(total)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const qty = Number(quantity)

    if (!productId || qty <= 0) {
      alert("Preencha os campos corretamente")
      return
    }

    if ((type === "Saída" || type === "Estorno") && qty > currentStock) {
      alert("Estoque insuficiente")
      return
    }

    await api.post("/stock", {
      productId,
      quantity: type === "Entrada" || type === "Ajuste" ? qty : -qty,
      type
    })

    setQuantity("")
    loadMovements()
    calculateStock(productId)
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Movimentação de Estoque
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Registre entradas, saídas e ajustes
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600">
              Produto
            </label>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value)
                calculateStock(e.target.value)
              }}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm focus:border-blue-600 transition-colors"
            >
              <option value="">Selecione...</option>
              {produtos.map(produto => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700">
            Estoque Atual: <strong>{currentStock}</strong>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600">
              Tipo
            </label>
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
            <label className="text-sm font-medium text-slate-600">
              Quantidade
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm focus:border-blue-600 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Salvar Movimentação
          </button>

        </form>
      </div>

    </div>
  )
}