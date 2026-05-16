import { Plus, Pencil, Trash2, TrendingUp } from 'lucide-react'

function calcMargem(custo, preco) {
  if (!custo || custo <= 0 || !preco) return null
  return ((preco - custo) / custo) * 100
}

export default function ProdutoLista({ onNavigate, produtos, onExcluir }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Produtos</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie os produtos cadastrados</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => onNavigate('estoque')}
            className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-sm"
          >
            Movimentar Estoque
          </button>
          <button
            onClick={() => onNavigate('produto-form')}
            className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>
      </div>

      {produtos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500">
          Nenhum produto cadastrado.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Cabeçalho da tabela — só desktop */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] items-center px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide gap-4">
            <span>Produto</span>
            <span className="text-right">Custo</span>
            <span className="text-right">Venda</span>
            <span className="text-right">Margem</span>
            <span></span>
          </div>

          <div className="divide-y divide-slate-100">
            {produtos.map((produto) => {
              const margem = calcMargem(produto.custo, produto.preco)
              const margemBoa = margem !== null && margem >= 20
              const margemMedia = margem !== null && margem >= 0 && margem < 20
              const margemNegativa = margem !== null && margem < 0

              return (
                <div key={produto.id} className="p-4">
                  {/* Layout mobile: empilhado */}
                  <div className="sm:hidden flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{produto.nome}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Cód: {produto.codigo} · {produto.categoria}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigate('produto-form', produto.id)}
                          className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onExcluir(produto.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm flex-wrap">
                      <span className="text-slate-500">
                        Custo: <span className="font-medium text-slate-700">R$ {(produto.custo || 0).toFixed(2)}</span>
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500">
                        Venda: <span className="font-semibold text-slate-900">R$ {(produto.preco || 0).toFixed(2)}</span>
                      </span>
                      {margem !== null && (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          margemBoa ? 'bg-emerald-100 text-emerald-700' :
                          margemMedia ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          <TrendingUp className="w-3 h-3" />
                          {margem.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Layout desktop: grid */}
                  <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{produto.nome}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cód: {produto.codigo} · {produto.categoria}
                      </p>
                    </div>

                    <p className="text-sm text-slate-600 text-right whitespace-nowrap">
                      R$ {(produto.custo || 0).toFixed(2)}
                    </p>

                    <p className="font-semibold text-slate-900 text-right whitespace-nowrap">
                      R$ {(produto.preco || 0).toFixed(2)}
                    </p>

                    <div className="flex justify-end">
                      {margem !== null ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                          margemBoa ? 'bg-emerald-100 text-emerald-700' :
                          margemMedia ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          <TrendingUp className="w-3 h-3" />
                          {margem.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                      <button
                        onClick={() => onNavigate('produto-form', produto.id)}
                        className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onExcluir(produto.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
