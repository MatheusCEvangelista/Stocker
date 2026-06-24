import { useEffect, useState } from 'react'
import { Package, ShoppingCart, DollarSign, TrendingUp, ArrowRight, Warehouse, Clock, AlertTriangle } from 'lucide-react'
import api from '../services/api'

const CORES = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#f97316', '#84cc16',
  '#ec4899', '#6366f1',
]

// ─── Gráfico de rosca ────────────────────────────────────────────────────────
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

  const raio = 80, raioCentro = 52, cx = 110, cy = 110
  let anguloAtual = -90

  function polarParaXY(angulo, r) {
    const rad = (angulo * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function criarArco(proporcao) {
    const anguloFim = anguloAtual + proporcao * 360
    const largeArc  = proporcao > 0.5 ? 1 : 0
    const p1Ext = polarParaXY(anguloAtual, raio),  p2Ext = polarParaXY(anguloFim, raio)
    const p1Int = polarParaXY(anguloFim, raioCentro), p2Int = polarParaXY(anguloAtual, raioCentro)
    const d = [
      `M ${p1Ext.x} ${p1Ext.y}`, `A ${raio} ${raio} 0 ${largeArc} 1 ${p2Ext.x} ${p2Ext.y}`,
      `L ${p1Int.x} ${p1Int.y}`, `A ${raioCentro} ${raioCentro} 0 ${largeArc} 0 ${p2Int.x} ${p2Int.y}`, 'Z',
    ].join(' ')
    anguloAtual = anguloFim
    return d
  }

  const arcos = dados.map((item) => {
    const proporcao = item.valor / total
    return { ...item, proporcao, d: criarArco(proporcao) }
  })

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="shrink-0">
        <svg width="220" height="220" viewBox="0 0 220 220">
          {arcos.map((arco, i) => (
            <path key={arco.categoria} d={arco.d} fill={CORES[i % CORES.length]} opacity="0.9" />
          ))}
          <text x={cx} y={cy - 6} textAnchor="middle" fill="#64748b" fontSize="11">Total</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="700">
            R$ {total.toFixed(0)}
          </text>
        </svg>
      </div>
      <div className="flex flex-col gap-2 w-full">
        {arcos.map((arco, i) => (
          <div key={arco.categoria} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CORES[i % CORES.length] }} />
              <span className="text-sm text-slate-700 truncate">{arco.categoria}</span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-semibold text-slate-900">R$ {arco.valor.toFixed(2)}</span>
              <span className="text-xs text-slate-400 ml-1.5">{(arco.proporcao * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Card de métrica destacado ────────────────────────────────────────────────
function CardMetrica({ label, valor, sub, icon: Icon, cor, destaque }) {
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${destaque ? cor : 'bg-white border-slate-200'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${destaque ? 'bg-white/20' : cor}`}>
        <Icon className={`w-5 h-5 ${destaque ? 'text-white' : 'text-white'}`} />
      </div>
      <div>
        <p className={`text-xs font-medium ${destaque ? 'text-white/70' : 'text-slate-500'}`}>{label}</p>
        <p className={`text-xl font-bold mt-0.5 ${destaque ? 'text-white' : 'text-slate-900'}`}>{valor}</p>
        {sub && <p className={`text-xs mt-0.5 ${destaque ? 'text-white/60' : 'text-slate-400'}`}>{sub}</p>}
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard({ onNavigate, produtos, vendas }) {
  const [estoqueMap, setEstoqueMap] = useState({}) // { productId: qtd }
  const [carregando, setCarregando] = useState(true)

  // Carrega movimentações para calcular estoque atual de cada produto
  useEffect(() => {
    async function loadStock() {
      try {
        const response = await api.get('/stock')
        const totais = {}
        for (const mov of response.data) {
          const id = String(mov.productId?._id ?? mov.productId)
          totais[id] = (totais[id] || 0) + mov.quantity
        }
        setEstoqueMap(totais)
      } catch (e) {
        console.error('Erro ao carregar estoque:', e)
      } finally {
        setCarregando(false)
      }
    }
    loadStock()
  }, [])

  // ── Métricas gerais ──
  const totalReceita = vendas.reduce((acc, v) => acc + (v.total || 0), 0)
  const ticketMedio  = vendas.length > 0 ? totalReceita / vendas.length : 0

  // ── Patrimônio em estoque (custo × quantidade atual) ──
  const patrimonioEstoque = produtos.reduce((acc, p) => {
    const qtd = estoqueMap[String(p.id)] || 0
    return acc + (p.custo || 0) * qtd
  }, 0)

  const totalItensEstoque = produtos.reduce((acc, p) => {
    return acc + (estoqueMap[String(p.id)] || 0)
  }, 0)

  // ── Métricas de inadimplência ──
  const aReceber = vendas
    .filter((v) => v.status === 'PENDENTE')
    .reduce((acc, v) => acc + (v.total || 0), 0)

  const emAtraso = vendas
    .filter((v) => v.status === 'ATRASO')
    .reduce((acc, v) => acc + (v.total || 0), 0)

  const qtdAReceber = vendas.filter((v) => v.status === 'PENDENTE').length
  const qtdAtraso   = vendas.filter((v) => v.status === 'ATRASO').length

  // ── Gráfico ──
  const receitaPorCategoria = vendas.reduce((acc, venda) => {
    const categoria = venda.itens?.[0]?.nome?.split(' - ')[0] || 'Outros'
    acc[categoria] = (acc[categoria] || 0) + (venda.total || 0)
    return acc
  }, {})

  const dadosGrafico = Object.entries(receitaPorCategoria)
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Visão geral do seu negócio</p>
      </div>

      {/* ── Linha 1: métricas gerais (2×2 mobile, 4 desktop) ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <CardMetrica label="Produtos"     valor={produtos.length}              icon={Package}      cor="bg-blue-600" />
        <CardMetrica label="Vendas"       valor={vendas.length}                icon={ShoppingCart} cor="bg-emerald-600" />
        <CardMetrica label="Receita Total" valor={`R$ ${totalReceita.toFixed(2)}`} icon={DollarSign}   cor="bg-amber-500" />
        <CardMetrica label="Ticket Médio" valor={`R$ ${ticketMedio.toFixed(2)}`}   icon={TrendingUp}   cor="bg-violet-600" />
      </div>

      {/* ── Linha 2: patrimônio + inadimplência ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
        {/* Patrimônio em estoque — destaque total */}
        <div className="sm:col-span-1 bg-slate-900 rounded-2xl p-5 flex flex-col gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-white/60">Valor em Estoque</p>
            {carregando ? (
              <p className="text-xl font-bold text-white/40 mt-0.5">Calculando…</p>
            ) : (
              <p className="text-2xl font-bold text-white mt-0.5">
                R$ {patrimonioEstoque.toFixed(2)}
              </p>
            )}
            <p className="text-xs text-white/50 mt-1">
              {totalItensEstoque} {totalItensEstoque === 1 ? 'unidade' : 'unidades'} · preço de custo
            </p>
          </div>
        </div>

        {/* A Receber */}
        <div className={`rounded-2xl border p-5 flex flex-col gap-3 ${
          aReceber > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            aReceber > 0 ? 'bg-amber-100' : 'bg-slate-100'
          }`}>
            <Clock className={`w-5 h-5 ${aReceber > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <p className={`text-xs font-medium ${aReceber > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
              A Receber (Pendente)
            </p>
            <p className={`text-2xl font-bold mt-0.5 ${aReceber > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
              R$ {aReceber.toFixed(2)}
            </p>
            <p className={`text-xs mt-1 ${aReceber > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
              {qtdAReceber} {qtdAReceber === 1 ? 'venda pendente' : 'vendas pendentes'}
            </p>
          </div>
        </div>

        {/* Em Atraso */}
        <div className={`rounded-2xl border p-5 flex flex-col gap-3 ${
          emAtraso > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            emAtraso > 0 ? 'bg-red-100' : 'bg-slate-100'
          }`}>
            <AlertTriangle className={`w-5 h-5 ${emAtraso > 0 ? 'text-red-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <p className={`text-xs font-medium ${emAtraso > 0 ? 'text-red-700' : 'text-slate-500'}`}>
              Valores em Atraso
            </p>
            <p className={`text-2xl font-bold mt-0.5 ${emAtraso > 0 ? 'text-red-700' : 'text-slate-400'}`}>
              R$ {emAtraso.toFixed(2)}
            </p>
            <p className={`text-xs mt-1 ${emAtraso > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {qtdAtraso} {qtdAtraso === 1 ? 'venda em atraso' : 'vendas em atraso'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Gráfico de rosca ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Receita por Categoria</h2>
        <GraficoRosca dados={dadosGrafico} />
      </div>

      {/* ── Acesso rápido ── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Acesso Rápido</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button onClick={() => onNavigate('produtos')}
            className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all text-left cursor-pointer group">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Gerenciar Produtos</p>
              <p className="text-sm text-slate-500">Adicionar, editar ou remover</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </button>

          <button onClick={() => onNavigate('vendas')}
            className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 hover:border-emerald-300 hover:shadow-sm transition-all text-left cursor-pointer group">
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

      {/* ── Últimas vendas ── */}
      {vendas.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Últimas Vendas</h2>
          <div className="flex flex-col gap-2">
            {vendas.slice(-3).reverse().map((venda) => (
              <div key={venda.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{venda.itens?.[0]?.nome || `Venda #${venda.id}`}</p>
                  <p className="text-sm text-slate-500">
                    {venda.data} · {venda.itens?.[0]?.quantidade} un.
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
