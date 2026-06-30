import { useState, useEffect, useMemo } from 'react'
import { FileText, FileSpreadsheet, Download, Calendar, Filter, TrendingUp, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react'
import api from '../services/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtMoeda(v) { return `R$ ${Number(v || 0).toFixed(2)}` }
function fmtData(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('pt-BR')
}

function badgeStatus(status) {
  const map = { PAGO: 'bg-emerald-100 text-emerald-700', PENDENTE: 'bg-amber-100 text-amber-700', ATRASO: 'bg-red-100 text-red-700' }
  return map[status] || 'bg-slate-100 text-slate-600'
}

// Calcula datas de início/fim de períodos predefinidos
function periodoParaDatas(periodo) {
  const hoje = new Date()
  hoje.setHours(23, 59, 59, 999)
  const inicio = new Date()
  inicio.setHours(0, 0, 0, 0)

  if (periodo === '7d')  { inicio.setDate(hoje.getDate() - 6) }
  if (periodo === '30d') { inicio.setDate(hoje.getDate() - 29) }
  if (periodo === 'mes') { inicio.setDate(1) }
  if (periodo === 'mesant') {
    inicio.setMonth(inicio.getMonth() - 1)
    inicio.setDate(1)
    hoje.setDate(0) // último dia do mês anterior
    hoje.setMonth(new Date().getMonth() - 1)
  }
  if (periodo === '90d') { inicio.setDate(hoje.getDate() - 89) }
  if (periodo === 'ano') { inicio.setMonth(0); inicio.setDate(1) }

  return {
    de: inicio.toISOString().slice(0, 10),
    ate: hoje.toISOString().slice(0, 10),
  }
}

// ─── Exportar PDF ─────────────────────────────────────────────────────────────
async function exportarPDF(vendas, filtros, resumo, usuario) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape' })
  const now  = new Date().toLocaleDateString('pt-BR')

  // Cabeçalho
  doc.setFontSize(18)
  doc.setTextColor(15, 23, 42)
  doc.text('Stocker — Relatório de Vendas', 14, 18)

  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Período: ${filtros.de} a ${filtros.ate}`, 14, 26)
  doc.text(`Gerado em: ${now} · Loja: ${usuario?.name || ''}`, 14, 31)

  // Resumo
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text(`Total de vendas: ${resumo.qtd}   ·   Receita: ${fmtMoeda(resumo.receita)}   ·   A receber: ${fmtMoeda(resumo.aReceber)}   ·   Em atraso: ${fmtMoeda(resumo.emAtraso)}`, 14, 40)

  // Tabela
  autoTable(doc, {
    startY: 46,
    head: [['Data', 'Produto', 'Qtd', 'Subtotal', 'Ajuste', 'Total', 'Pagamento', 'Status', 'Vencimento']],
    body: vendas.map((v) => [
      fmtData(v.saleDate),
      `${v.productId?.groupname ?? '?'} - ${v.productId?.flavor ?? ''}`,
      v.quantity,
      fmtMoeda(v.subtotal),
      v.adjustmentType === 'DESCONTO'
        ? `- ${fmtMoeda(v.adjustmentValue)}`
        : v.adjustmentType === 'JUROS'
        ? `+ ${fmtMoeda(v.adjustmentValue)}`
        : '—',
      fmtMoeda(v.totalFinal),
      v.paymentType === 'VISTA' ? 'À vista' : 'A prazo',
      v.status,
      fmtData(v.dueDate),
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 22 }, 1: { cellWidth: 55 }, 2: { cellWidth: 12 },
      3: { cellWidth: 24 }, 4: { cellWidth: 24 }, 5: { cellWidth: 24 },
      6: { cellWidth: 22 }, 7: { cellWidth: 20 }, 8: { cellWidth: 22 },
    },
  })

  doc.save(`stocker-vendas-${filtros.de}-${filtros.ate}.pdf`)
}

// ─── Exportar Excel ───────────────────────────────────────────────────────────
async function exportarExcel(vendas, filtros, resumo) {
  const XLSX = await import('xlsx')

  // Aba de vendas
  const linhas = vendas.map((v) => ({
    'Data':        fmtData(v.saleDate),
    'Produto':     `${v.productId?.groupname ?? '?'} - ${v.productId?.flavor ?? ''}`,
    'Quantidade':  v.quantity,
    'Subtotal':    v.subtotal ?? 0,
    'Tipo Ajuste': v.adjustmentType,
    'Ajuste (R$)': v.adjustmentType === 'DESCONTO' ? -(v.adjustmentValue || 0) : (v.adjustmentValue || 0),
    'Total Final': v.totalFinal ?? 0,
    'Pagamento':   v.paymentType === 'VISTA' ? 'À vista' : 'A prazo',
    'Status':      v.status,
    'Vencimento':  fmtData(v.dueDate),
  }))

  // Aba de resumo
  const linhasResumo = [
    { 'Métrica': 'Período',          'Valor': `${filtros.de} a ${filtros.ate}` },
    { 'Métrica': 'Total de vendas',  'Valor': resumo.qtd },
    { 'Métrica': 'Receita total',    'Valor': resumo.receita },
    { 'Métrica': 'Ticket médio',     'Valor': resumo.qtd > 0 ? resumo.receita / resumo.qtd : 0 },
    { 'Métrica': 'À vista',          'Valor': resumo.receitaVista },
    { 'Métrica': 'A prazo',          'Valor': resumo.receitaPrazo },
    { 'Métrica': 'A receber',        'Valor': resumo.aReceber },
    { 'Métrica': 'Em atraso',        'Valor': resumo.emAtraso },
  ]

  const wb  = XLSX.utils.book_new()
  const ws1 = XLSX.utils.json_to_sheet(linhas)
  const ws2 = XLSX.utils.json_to_sheet(linhasResumo)

  // Larguras das colunas
  ws1['!cols'] = [{ wch: 12 }, { wch: 36 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 }]
  ws2['!cols'] = [{ wch: 20 }, { wch: 20 }]

  XLSX.utils.book_append_sheet(wb, ws1, 'Vendas')
  XLSX.utils.book_append_sheet(wb, ws2, 'Resumo')
  XLSX.writeFile(wb, `stocker-vendas-${filtros.de}-${filtros.ate}.xlsx`)
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Relatorios({ usuario }) {
  const [vendas, setVendas]         = useState([])
  const [carregando, setCarregando] = useState(false)
  const [exportando, setExportando] = useState(null) // 'pdf' | 'excel' | null

  // Filtros
  const [periodo, setPeriodo]         = useState('30d')
  const [de, setDe]                   = useState(() => periodoParaDatas('30d').de)
  const [ate, setAte]                 = useState(() => periodoParaDatas('30d').ate)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroPagamento, setFiltroPagamento] = useState('')

  // Sincroniza datas quando muda período predefinido
  function handlePeriodo(p) {
    setPeriodo(p)
    if (p !== 'custom') {
      const { de: d, ate: a } = periodoParaDatas(p)
      setDe(d)
      setAte(a)
    }
  }

  useEffect(() => {
    buscarVendas()
  }, [de, ate])

  async function buscarVendas() {
    setCarregando(true)
    try {
      const response = await api.get('/sales')
      setVendas(response.data)
    } catch (e) {
      console.error('Erro ao buscar vendas:', e)
    } finally {
      setCarregando(false)
    }
  }

  // Filtra por período e filtros adicionais
  const vendasFiltradas = useMemo(() => {
    const inicio = new Date(de + 'T00:00:00')
    const fim    = new Date(ate + 'T23:59:59')
    return vendas.filter((v) => {
      const data = new Date(v.saleDate)
      if (data < inicio || data > fim) return false
      if (filtroStatus && v.status !== filtroStatus) return false
      if (filtroPagamento && v.paymentType !== filtroPagamento) return false
      return true
    })
  }, [vendas, de, ate, filtroStatus, filtroPagamento])

  // Resumo calculado
  const resumo = useMemo(() => {
    const receita      = vendasFiltradas.reduce((a, v) => a + (v.totalFinal || 0), 0)
    const receitaVista = vendasFiltradas.filter((v) => v.paymentType === 'VISTA').reduce((a, v) => a + (v.totalFinal || 0), 0)
    const receitaPrazo = vendasFiltradas.filter((v) => v.paymentType === 'PRAZO').reduce((a, v) => a + (v.totalFinal || 0), 0)
    const aReceber     = vendasFiltradas.filter((v) => v.status === 'PENDENTE').reduce((a, v) => a + (v.totalFinal || 0), 0)
    const emAtraso     = vendasFiltradas.filter((v) => v.status === 'ATRASO').reduce((a, v) => a + (v.totalFinal || 0), 0)
    return { qtd: vendasFiltradas.length, receita, receitaVista, receitaPrazo, aReceber, emAtraso }
  }, [vendasFiltradas])

  async function handleExportar(tipo) {
    setExportando(tipo)
    try {
      const filtros = { de, ate }
      if (tipo === 'pdf')   await exportarPDF(vendasFiltradas, filtros, resumo, usuario)
      if (tipo === 'excel') await exportarExcel(vendasFiltradas, filtros, resumo)
    } catch (e) {
      console.error('Erro ao exportar:', e)
    } finally {
      setExportando(null)
    }
  }

  const periodos = [
    { id: '7d',     label: '7 dias' },
    { id: '30d',    label: '30 dias' },
    { id: 'mes',    label: 'Este mês' },
    { id: 'mesant', label: 'Mês anterior' },
    { id: '90d',    label: '90 dias' },
    { id: 'ano',    label: 'Este ano' },
    { id: 'custom', label: 'Personalizado' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
          <p className="text-slate-500 text-sm mt-1">Selecione o período e exporte os dados</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExportar('excel')}
            disabled={exportando !== null || vendasFiltradas.length === 0}
            className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer">
            {exportando === 'excel' ? <span className="animate-spin">⏳</span> : <FileSpreadsheet className="w-4 h-4" />}
            Excel
          </button>
          <button
            onClick={() => handleExportar('pdf')}
            disabled={exportando !== null || vendasFiltradas.length === 0}
            className="h-10 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer">
            {exportando === 'pdf' ? <span className="animate-spin">⏳</span> : <FileText className="w-4 h-4" />}
            PDF
          </button>
        </div>
      </div>

      {/* Seletor de período */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Período</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {periodos.map((p) => (
            <button key={p.id} onClick={() => handlePeriodo(p.id)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                periodo === p.id
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Datas personalizadas */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">De</label>
            <input type="date" value={de}
              onChange={(e) => { setDe(e.target.value); setPeriodo('custom') }}
              className="h-9 px-3 rounded-xl border border-slate-200 text-sm focus:border-blue-500 transition-colors" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Até</label>
            <input type="date" value={ate}
              onChange={(e) => { setAte(e.target.value); setPeriodo('custom') }}
              className="h-9 px-3 rounded-xl border border-slate-200 text-sm focus:border-blue-500 transition-colors" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Status</label>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 text-sm focus:border-blue-500 transition-colors">
              <option value="">Todos</option>
              <option value="PAGO">Pago</option>
              <option value="PENDENTE">Pendente</option>
              <option value="ATRASO">Atraso</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Pagamento</label>
            <select value={filtroPagamento} onChange={(e) => setFiltroPagamento(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 text-sm focus:border-blue-500 transition-colors">
              <option value="">Todos</option>
              <option value="VISTA">À vista</option>
              <option value="PRAZO">A prazo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xs text-slate-500 font-medium">Vendas</p>
          <p className="text-2xl font-bold text-slate-900 mt-0.5">{resumo.qtd}</p>
          <p className="text-xs text-slate-400 mt-1">no período</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xs text-slate-500 font-medium">Receita Total</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{fmtMoeda(resumo.receita)}</p>
          <p className="text-xs text-slate-400 mt-1">
            Vista: {fmtMoeda(resumo.receitaVista)} · Prazo: {fmtMoeda(resumo.receitaPrazo)}
          </p>
        </div>

        <div className={`rounded-2xl border p-4 ${resumo.aReceber > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${resumo.aReceber > 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
            <TrendingUp className={`w-4 h-4 ${resumo.aReceber > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <p className={`text-xs font-medium ${resumo.aReceber > 0 ? 'text-amber-700' : 'text-slate-500'}`}>A Receber</p>
          <p className={`text-xl font-bold mt-0.5 ${resumo.aReceber > 0 ? 'text-amber-700' : 'text-slate-400'}`}>{fmtMoeda(resumo.aReceber)}</p>
          <p className={`text-xs mt-1 ${resumo.aReceber > 0 ? 'text-amber-500' : 'text-slate-400'}`}>pendentes</p>
        </div>

        <div className={`rounded-2xl border p-4 ${resumo.emAtraso > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${resumo.emAtraso > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
            <AlertTriangle className={`w-4 h-4 ${resumo.emAtraso > 0 ? 'text-red-600' : 'text-slate-400'}`} />
          </div>
          <p className={`text-xs font-medium ${resumo.emAtraso > 0 ? 'text-red-700' : 'text-slate-500'}`}>Em Atraso</p>
          <p className={`text-xl font-bold mt-0.5 ${resumo.emAtraso > 0 ? 'text-red-700' : 'text-slate-400'}`}>{fmtMoeda(resumo.emAtraso)}</p>
          <p className={`text-xs mt-1 ${resumo.emAtraso > 0 ? 'text-red-400' : 'text-slate-400'}`}>em atraso</p>
        </div>
      </div>

      {/* Preview da tabela */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">
            Preview — {vendasFiltradas.length} {vendasFiltradas.length === 1 ? 'venda' : 'vendas'}
          </h2>
          {vendasFiltradas.length > 0 && (
            <div className="flex gap-2">
              <button onClick={() => handleExportar('excel')} disabled={exportando !== null}
                className="h-8 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50">
                <Download className="w-3.5 h-3.5" /> Excel
              </button>
              <button onClick={() => handleExportar('pdf')} disabled={exportando !== null}
                className="h-8 px-3 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          )}
        </div>

        {carregando ? (
          <div className="p-8 text-center text-slate-400 text-sm">Carregando…</div>
        ) : vendasFiltradas.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Nenhuma venda encontrada para o período selecionado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  {['Data', 'Produto', 'Qtd', 'Subtotal', 'Ajuste', 'Total', 'Pagamento', 'Status', 'Vencimento'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendasFiltradas.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtData(v.saleDate)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-[180px] truncate">
                      {v.productId?.groupname ?? '?'} - {v.productId?.flavor ?? ''}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{v.quantity}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtMoeda(v.subtotal)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {v.adjustmentType === 'DESCONTO' && v.adjustmentValue > 0
                        ? <span className="text-red-500">- {fmtMoeda(v.adjustmentValue)}</span>
                        : v.adjustmentType === 'JUROS' && v.adjustmentValue > 0
                        ? <span className="text-amber-600">+ {fmtMoeda(v.adjustmentValue)}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{fmtMoeda(v.totalFinal)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v.paymentType === 'VISTA' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                        {v.paymentType === 'VISTA' ? 'À vista' : 'A prazo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeStatus(v.status)}`}>{v.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtData(v.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total do período</td>
                  <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">{fmtMoeda(resumo.receita)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
