import { useState } from "react"
import { Plus, ShoppingCart, Search } from "lucide-react"

export default function VendaLista({ onNavigate, vendas }) {

  const [busca, setBusca] = useState("")

  const filtradas = vendas.filter((v) =>
    v.itens?.[0]?.nome?.toLowerCase().includes(busca.toLowerCase())
  )

  return (

    <div className="flex flex-col gap-4">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendas</h1>
          <p className="text-slate-500 text-sm">{vendas.length} vendas</p>
        </div>

        <button
          onClick={() => onNavigate("venda-form")}
          className="h-10 px-4 bg-blue-600 text-white rounded-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Venda
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />

        <input
          placeholder="Buscar produto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full border rounded-xl p-3 pl-10"
        />
      </div>

      <div className="flex flex-col gap-2">

        {filtradas.map((venda) => (

          <div
            key={venda.id}
            className="bg-white border rounded-xl p-4 flex items-center justify-between"
          >

            <div>

              <p className="font-semibold">
                {venda.itens?.[0]?.nome}
              </p>

              <p className="text-sm text-slate-500">
                Quantidade: {venda.itens?.[0]?.quantidade}
              </p>

              <p className="text-sm text-slate-500">
                {venda.paymentType}
              </p>

            </div>

            <div className="text-right">

              <p className="font-bold">
                R$ {venda.total?.toFixed(2)}
              </p>

              <span
                className={`text-xs font-semibold px-2 py-1 rounded ${
                  venda.status === "PAGO"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {venda.status}
              </span>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}