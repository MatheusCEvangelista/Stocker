import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function ProdutoLista({ onNavigate, produtos, onExcluir }) {
  return (
    <div className="flex flex-col gap-6">
      
      <div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold text-slate-900">Produtos</h1>
    <p className="text-slate-500 text-sm mt-1">
      Gerencie os produtos cadastrados
    </p>
  </div>

  <div className="flex gap-3">
    <button
      onClick={() => onNavigate('estoque')}
      className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
    >
      Movimentar Estoque
    </button>

    <button
      onClick={() => onNavigate('produto-form')}
      className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
    >
      <Plus className="w-5 h-5" />
      Novo Produto
    </button>
  </div>
</div>

      {produtos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500">
          Nenhum produto cadastrado.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {produtos.map((produto) => (
            <div
              key={produto.id}
              className="p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {produto.nome}
                </p>
                <p className="text-sm text-slate-500">
                  Código: {produto.codigo} • Categoria: {produto.categoria}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <p className="font-bold text-slate-900">
                  R$ {(produto.preco || 0).toFixed(2)}
                </p>

                <button
                  onClick={() => onNavigate('produto-form', produto.id)}
                  className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <Pencil className="w-5 h-5" />
                </button>

                <button
                  onClick={() => onExcluir(produto.id)}
                  className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}