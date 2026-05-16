import { Package, ShoppingCart, DollarSign, TrendingUp, ArrowRight } from 'lucide-react'

// Cores para fatias do gráfico de rosca
const CORES = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#f97316', '#84cc16',
  '#ec4899', '#6366f1',
]

function GraficoRosca({ dados }) {
  if (!dados || dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        Nenhuma venda registrada ainda
      </div>
    )
  }

  const total = dados.reduce((acc, d) => acc + d.valor, 0)
  if (total === 0) return null

  // Calcula os arcos SVG
  const raio = 80
  const raioCentro = 52 // espessura da rosca
  const cx = 110
  const cy = 110
  let anguloAtual = -90 // começa do topo

  function polarParaXY(angulo, r) {
    const rad = (angulo * Math.PI) / 180
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    }
  }

  function criarArco(angulo, proporcao) {
    const anguloFim = anguloAtual + proporcao * 360
    const largeArc = proporcao > 0.5 ? 1 : 0

    const p1Ext = polarParaXY(anguloAtual, raio)
    const p2Ext = polarParaXY(anguloFim, raio)
    const p1Int = polarParaXY(anguloFim, raioCentro)
    const p2Int = polarParaXY(anguloAtual, raioCentro)

    const d = [
      `M ${p1Ext.x} ${p1Ext.y}`,
      `A ${raio} ${raio} 0 ${largeArc} 1 ${p2Ext.x} ${p2Ext.y}`,
      `L ${p1Int.x} ${p1Int.y}`,
      `A ${raioCentro} ${raioCentro} 0 ${largeArc} 0 ${p2Int.x} ${p2Int.y}`,
      'Z',
    ].join(' ')

    anguloAtual = anguloFim
    return d
  }

  const arcos = dados.map((item) => {
    const proporcao = item.valor / total
    const d = criarArco(anguloAtual, proporcao)
    return { ...item, proporcao, d }
  })

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* SVG rosca */}
      <div className="shrink-0">
        <svg width="220" height="220" viewBox="0 0 220 220">
          {arcos.map((arco, i) => (
            <path
              key={arco.categoria}
              d={arco.d}
              fill={CORES[i % CORES.length]}
              opacity="0.9"
            />
          ))}
          {/* Texto central */}
          <text x={cx} y={cy - 6} textAnchor="middle" className="text-xs" fill="#64748b" fontSize="11">
            Total
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="700">
            R$ {total.toFixed(0)}
          </text>
        </svg>
      </div>

      {/* Legenda */}
      <div className="flex flex-col gap-2 w-full">
        {arcos.map((arco, i) => (
          <div key={arco.categoria} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: CORES[i % CORES.length] }}
              />
              <span className="text-sm text-slate-700 truncate">{arco.categoria}</span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-semibold text-slate-900">
                R$ {arco.valor.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">
                {(arco.proporcao * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard({ onNavigate, produtos, vendas }) {
  const totalReceita = vendas.reduce((acc, v) => acc + v.total, 0)
  const ticketMedio = vendas.length > 0 ? totalReceita / vendas.length : 0

  // Agrupa receita por categoria
  const receitaPorCategoria = vendas.reduce((acc, venda) => {
    const categoria = venda.itens?.[0]?.nome?.split(' - ')[0] || 'Outros'
    acc[categoria] = (acc[categoria] || 0) + (venda.total || 0)
    return acc
  }, {})

  const dadosGrafico = Object.entries(receitaPorCategoria)
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor)

  const cards = [
    { label: 'Produtos', valor: produtos.length, icon: Package, cor: 'bg-blue-600' },
    { label: 'Vendas', valor: vendas.length, icon: ShoppingCart, cor: 'bg-emerald-600' },
    { label: 'Receita Total', valor: `R$ ${totalReceita.toFixed(2)}`, icon: DollarSign, cor: 'bg-amber-500' },
    { label: 'Ticket Médio', valor: `R$ ${ticketMedio.toFixed(2)}`, icon: TrendingUp, cor: 'bg-violet-600' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Visão geral do seu negócio</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3">
            <div className={`w-10 h-10 ${card.cor} rounded-xl flex items-center justify-center`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{card.label}</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{card.valor}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de rosca */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Receita por Categoria</h2>
        <GraficoRosca dados={dadosGrafico} />
      </div>

      {/* Acesso Rápido */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Acesso Rápido</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => onNavigate('produtos')}
            className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all text-left cursor-pointer group"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Gerenciar Produtos</p>
              <p className="text-sm text-slate-500">Adicionar, editar ou remover</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </button>

          <button
            onClick={() => onNavigate('vendas')}
            className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 hover:border-emerald-300 hover:shadow-sm transition-all text-left cursor-pointer group"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Gerenciar Vendas</p>
              <p className="text-sm text-slate-500">Histórico e nova venda</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </button>
        </div>
      </div>

      {/* Últimas vendas */}
      {vendas.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Últimas Vendas</h2>
          <div className="flex flex-col gap-2">
            {vendas.slice(-3).reverse().map((venda) => (
              <div
                key={venda.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">{venda.itens?.[0]?.nome || `Venda #${venda.id}`}</p>
                  <p className="text-sm text-slate-500">
                    {venda.data} · {venda.itens?.[0]?.quantidade} {venda.itens?.[0]?.quantidade === 1 ? 'un.' : 'un.'}
                  </p>
                </div>
                <p className="font-bold text-slate-900">R$ {venda.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
