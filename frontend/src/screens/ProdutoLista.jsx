import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, TrendingUp, AlertTriangle, Filter } from 'lucide-react'
import api from '../services/api'

function calcMargem(custo, preco) {
  if (!custo || custo <= 0 || !preco) return null
  return ((preco - custo) / custo) * 100
}

export default function ProdutoLista({ onNavigate, produtos, onExcluir }) {
  const [estoqueMap, setEstoqueMap]     = useState({}) // { productId: qtdFisica }
  const [reservadoMap, setReservadoMap] = useState({}) // { productId: qtdReservada }
  const [carregando, setCarregando]     = useState(true)
  const [filtroEstoqueBaixo, setFiltroEstoqueBaixo] = useState(false)
  const [busca, setBusca]               = useState('')

  useEffect(() => {
    async function loadEstoqueEReservas() {
      try {
        // Estoque físico via movimentações
        const stockRes = await api.get('/stock')
        const fisico = {}
        for (const mov of stockRes.data) {
          const id = String(mov.productId?._id ?? mov.productId)
          fisico[id] = (fisico[id] || 0) + mov.quantity
        }
        setEstoqueMap(fisico)

        // Reservado = vendas PENDENTE ou ATRASO (quantidade por produto)
        const salesRes = await api.get('/sales')
        const reservado = {}
        for (const venda of salesRes.data) {
          if (venda.status === 'PENDENTE' || venda.status === 'ATRASO') {
            const id = String(venda.productId?._id ?? venda.productId)
            reservado[id] = (reservado[id] || 0) + venda.quantity
          }
        }
        setReservadoMap(reservado)
      } catch (e) {
        console.error('Erro ao carregar estoque:', e)
      } finally {
        setCarregando(false)
      }
    }
    loadEstoqueEReservas()
  }, [])

  const produtosFiltrados = produtos.filter((p) => {
    const fisico     = estoqueMap[String(p.id)] || 0
    const reservado  = reservadoMap[String(p.id)] || 0
    const disponivel = Math.max(0, fisico - reservado)
    const minstock   = p.minstock ?? 0

    if (filtroEstoqueBaixo && disponivel > minstock) return false
    if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase()) &&
        !p.codigo?.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  })

  const qtdEstoqueBaixo = produtos.filter((p) => {
    const fisico     = estoqueMap[String(p.id)] || 0
    const reservado  = reservadoMap[String(p.id)] || 0
    const disponivel = Math.max(0, fisico - reservado)
    return disponivel <= (p.minstock ?? 0)
  }).length

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Produtos</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie os produtos cadastrados</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => onNavigate('estoque')}
            className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-sm">
            Movimentar Estoque
          </button>
          <button onClick={() => onNavigate('produto-form')}
            className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-sm">
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Barra de busca + filtro */}
      <div className="flex gap-2 flex-wrap">
        <input
          placeholder="Buscar por nome ou código…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 min-w-[180px] h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:border-blue-500 transition-colors"
        />
        <button
          onClick={() => setFiltroEstoqueBaixo(!filtroEstoqueBaixo)}
          className={`h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-semibold border transition-colors cursor-pointer ${
            filtroEstoqueBaixo
              ? 'bg-amber-500 border-amber-500 text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-600'
          }`}
        >
          <Filter className="w-4 h-4" />
          Estoque Baixo
          {qtdEstoqueBaixo > 0 && !filtroEstoqueBaixo && (
            <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {qtdEstoqueBaixo}
            </span>
          )}
        </button>
      </div>

      {/* Lista */}
      {produtos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500">
          Nenhum produto cadastrado.
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
          Nenhum produto encontrado para os filtros aplicados.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Cabeçalho desktop */}
          <div className="hidden sm:grid items-center px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide gap-4"
            style={{ gridTemplateColumns: '1fr auto auto auto auto auto' }}>
            <span>Produto</span>
            <span className="text-right">Custo</span>
            <span className="text-right">Venda</span>
            <span className="text-right">Margem</span>
            <span className="text-center">Estoque</span>
            <span />
          </div>

          <div className="divide-y divide-slate-100">
            {produtosFiltrados.map((produto) => {
              const fisico     = carregando ? null : (estoqueMap[String(produto.id)] || 0)
              const reservado  = carregando ? null : (reservadoMap[String(produto.id)] || 0)
              const disponivel = fisico !== null ? Math.max(0, fisico - reservado) : null
              const minstock   = produto.minstock ?? 0
              const estoqueBaixo = disponivel !== null && disponivel <= minstock
              const margem     = calcMargem(produto.custo, produto.preco)

              const corMargem = margem === null ? '' :
                margem >= 20 ? 'bg-emerald-100 text-emerald-700' :
                margem >= 0  ? 'bg-amber-100 text-amber-700' :
                               'bg-red-100 text-red-700'

              return (
                <div key={produto.id} className={`p-4 ${estoqueBaixo ? 'bg-amber-50/40' : ''}`}>

                  {/* ── Mobile ── */}
                  <div className="sm:hidden flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{produto.nome}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Cód: {produto.codigo} · {produto.categoria}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => onNavigate('produto-form', produto.id)}
                          className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => onExcluir(produto.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer">
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
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${corMargem}`}>
                          <TrendingUp className="w-3 h-3" />
                          {margem.toFixed(1)}%
                        </span>
                      )}
                    </div>

                    {/* Estoque mobile */}
                    <div className="flex items-center gap-2">
                      {carregando ? (
                        <span className="text-xs text-slate-400">Carregando…</span>
                      ) : (
                        <>
                          <span className={`text-xs font-mono font-semibold px-2 py-1 rounded-lg ${
                            estoqueBaixo ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {disponivel} / {reservado} / {fisico}
                          </span>
                          <span className="text-xs text-slate-400">Disp / Res / Físico</span>
                          {estoqueBaixo && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                        </>
                      )}
                    </div>
                  </div>

                  {/* ── Desktop ── */}
                  <div className="hidden sm:grid items-center gap-4"
                    style={{ gridTemplateColumns: '1fr auto auto auto auto auto' }}>
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
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${corMargem}`}>
                          <TrendingUp className="w-3 h-3" />
                          {margem.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </div>

                    {/* Coluna Estoque: Disponível / Reservado / Físico */}
                    <div className="flex flex-col items-center gap-0.5">
                      {carregando ? (
                        <span className="text-xs text-slate-400">…</span>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm font-mono font-bold ${
                              estoqueBaixo ? 'text-amber-600' : 'text-slate-900'
                            }`}>
                              {disponivel}
                            </span>
                            <span className="text-slate-300 text-xs">/</span>
                            <span className="text-sm font-mono text-violet-600">{reservado}</span>
                            <span className="text-slate-300 text-xs">/</span>
                            <span className="text-sm font-mono text-slate-500">{fisico}</span>
                            {estoqueBaixo && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 ml-0.5" />}
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">Disp / Res / Físico</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                      <button onClick={() => onNavigate('produto-form', produto.id)}
                        className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => onExcluir(produto.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer">
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

      {/* Legenda */}
      {!carregando && produtos.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-slate-400 px-1">
          <span><span className="font-semibold text-slate-600">Disp</span> = disponível para venda</span>
          <span><span className="font-semibold text-violet-500">Res</span> = reservado (pendente/atraso)</span>
          <span><span className="font-semibold text-slate-500">Físico</span> = total em estoque</span>
        </div>
      )}
    </div>
  )
}
