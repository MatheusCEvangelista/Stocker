import { useState } from "react"
import { Plus, Search, Pencil, Trash2, X, Check, AlertTriangle } from "lucide-react"
import api from "../services/api"

const STATUS_OPTS = ["PAGO", "PENDENTE", "ATRASO"]
const PAYMENT_OPTS = ["VISTA", "PRAZO"]

function calcDias(vencimento) {
  if (!vencimento) return 0
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const venc = new Date(vencimento + "T00:00:00")
  return Math.max(0, Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24)))
}

function badgeStatus(status) {
  const map = {
    PAGO: "bg-emerald-100 text-emerald-700",
    PENDENTE: "bg-amber-100 text-amber-700",
    ATRASO: "bg-red-100 text-red-700",
  }
  return map[status] || "bg-slate-100 text-slate-600"
}

function badgePayment(type) {
  return type === "VISTA"
    ? "bg-blue-100 text-blue-700"
    : "bg-violet-100 text-violet-700"
}

// ─── Modal de edição ─────────────────────────────────────────────────────────
function ModalEdicao({ venda, onClose, onSalvo }) {
  const jurosDiaInicial =
    venda.paymentType === "PRAZO" && venda.dias > 0
      ? ((venda.jurosTotal || 0) / venda.dias).toFixed(2)
      : "0"

  const [paymentType, setPaymentType] = useState(venda.paymentType || "VISTA")
  const [status, setStatus] = useState(venda.status || "PAGO")
  const [desconto, setDesconto] = useState(
    venda.paymentType === "VISTA" ? String(venda.adjustmentValue || 0) : "0"
  )
  const [jurosDia, setJurosDia] = useState(jurosDiaInicial)
  const [vencimento, setVencimento] = useState(
    venda.dueDate ? venda.dueDate.slice(0, 10) : ""
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")

  const subtotalBruto = venda.subtotal || 0
  const dias = calcDias(vencimento)
  const jurosTotal = paymentType === "PRAZO" ? (Number(jurosDia) || 0) * dias : 0
  const totalFinal =
    paymentType === "VISTA"
      ? Math.max(0, subtotalBruto - (Number(desconto) || 0))
      : subtotalBruto + jurosTotal

  async function handleSalvar() {
    setSalvando(true)
    setErro("")
    try {
      const adjustmentValue =
        paymentType === "VISTA" ? Number(desconto) : jurosTotal

      const response = await api.put(`/sales/${venda.id}`, {
        paymentType,
        status: paymentType === "VISTA" ? "PAGO" : status,
        adjustmentType: paymentType === "VISTA" ? "DESCONTO" : "JUROS",
        adjustmentValue,
        dailyInterest: Number(jurosDia),
        dueDate: vencimento || null,
        totalFinal,
      })

      onSalvo(response.data)
    } catch (e) {
      setErro(e.response?.data?.message || "Erro ao salvar venda.")
    } finally {
      setSalvando(false)
    }
  }

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Fundo escuro */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Painel */}
      <div className="relative z-10 w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Editar Venda</h2>
            <p className="text-sm text-slate-500 truncate mt-0.5">
              {venda.nome} · {venda.quantidade} un.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {erro && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
            {erro}
          </div>
        )}

        {/* Subtotal fixo (não editável) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
          <span className="text-slate-500">Subtotal original</span>
          <span className="float-right font-semibold text-slate-800">
            R$ {subtotalBruto.toFixed(2)}
          </span>
        </div>

        {/* Tipo de pagamento */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Tipo de pagamento</label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_OPTS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setPaymentType(opt)}
                className={`h-10 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                  paymentType === opt
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                }`}
              >
                {opt === "VISTA" ? "À vista" : "A prazo"}
              </button>
            ))}
          </div>
        </div>

        {paymentType === "VISTA" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Desconto (R$)</label>
            <input
              type="number" min="0" step="0.01" value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
              className="h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-blue-500 transition-colors"
            />
          </div>
        )}

        {paymentType === "PRAZO" && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Juros por dia (R$)</label>
              <input
                type="number" min="0" step="0.01" value={jurosDia}
                onChange={(e) => setJurosDia(e.target.value)}
                className="h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-blue-500 transition-colors"
                placeholder="ex: 0,50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Data de vencimento</label>
              <input
                type="date" value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                className="h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`h-10 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      status === s
                        ? s === "PAGO"
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : s === "PENDENTE"
                          ? "bg-amber-500 border-amber-500 text-white"
                          : "bg-red-600 border-red-600 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Preview do total */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-col gap-1 text-sm">
          {paymentType === "VISTA" && Number(desconto) > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">Desconto</span>
              <span className="text-red-500 font-medium">− R$ {Number(desconto).toFixed(2)}</span>
            </div>
          )}
          {paymentType === "PRAZO" && Number(jurosDia) > 0 && dias > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">Juros</span>
              <span className="text-amber-600 font-medium">
                R$ {Number(jurosDia).toFixed(2)} × {dias}d = R$ {jurosTotal.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-slate-200 mt-1">
            <span className="font-semibold text-slate-700">Total final</span>
            <span className="font-bold text-slate-900 text-base">R$ {totalFinal.toFixed(2)}</span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal de confirmação de exclusão ────────────────────────────────────────
function ModalExcluir({ venda, onClose, onConfirmar }) {
  const [excluindo, setExcluindo] = useState(false)

  async function handleConfirmar() {
    setExcluindo(true)
    await onConfirmar(venda.id)
    setExcluindo(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Excluir venda?</h2>
            <p className="text-sm text-slate-500 mt-0.5">Esta ação não pode ser desfeita.</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
          <p className="font-medium text-slate-800">{venda.nome}</p>
          <p className="text-slate-500 mt-0.5">
            {venda.quantidade} un. · R$ {venda.total?.toFixed(2)} · {venda.status}
          </p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
            O estoque será estornado automaticamente.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={excluindo}
            className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" />
            {excluindo ? "Excluindo…" : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Lista principal ──────────────────────────────────────────────────────────
export default function VendaLista({ onNavigate, vendas, onExcluir, onEditar }) {
  const [busca, setBusca] = useState("")
  const [vendaEditando, setVendaEditando] = useState(null)
  const [vendaExcluindo, setVendaExcluindo] = useState(null)

  const filtradas = vendas.filter((v) =>
    v.itens?.[0]?.nome?.toLowerCase().includes(busca.toLowerCase())
  )

  function handleSalvo(dadosAtualizados) {
    onEditar(dadosAtualizados)
    setVendaEditando(null)
  }

  async function handleExcluir(id) {
    await onExcluir(id)
    setVendaExcluindo(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendas</h1>
          <p className="text-slate-500 text-sm">{vendas.length} {vendas.length === 1 ? "venda" : "vendas"} registradas</p>
        </div>
        <button
          onClick={() => onNavigate("venda-form")}
          className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Venda
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          placeholder="Buscar produto…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full h-11 border border-slate-200 rounded-xl pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
        />
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
          {busca ? "Nenhuma venda encontrada para essa busca." : "Nenhuma venda registrada ainda."}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtradas.map((venda) => (
            <div
              key={venda.id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">
                  {venda.itens?.[0]?.nome}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {venda.data} · {venda.itens?.[0]?.quantidade} un.
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeStatus(venda.status)}`}>
                    {venda.status}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgePayment(venda.paymentType)}`}>
                    {venda.paymentType === "VISTA" ? "À vista" : "A prazo"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <p className="font-bold text-slate-900 mr-2 text-right">
                  R$ {venda.total?.toFixed(2)}
                </p>
                <button
                  onClick={() => setVendaEditando(venda)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Editar venda"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setVendaExcluindo(venda)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Excluir venda"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modais */}
      {vendaEditando && (
        <ModalEdicao
          venda={{
            ...vendaEditando,
            nome: vendaEditando.itens?.[0]?.nome,
            quantidade: vendaEditando.itens?.[0]?.quantidade,
            subtotal: (vendaEditando.itens?.[0]?.preco || 0) * (vendaEditando.itens?.[0]?.quantidade || 1),
            jurosTotal: vendaEditando.paymentType === "PRAZO"
              ? (vendaEditando.total || 0) - ((vendaEditando.itens?.[0]?.preco || 0) * (vendaEditando.itens?.[0]?.quantidade || 1))
              : 0,
          }}
          onClose={() => setVendaEditando(null)}
          onSalvo={handleSalvo}
        />
      )}

      {vendaExcluindo && (
        <ModalExcluir
          venda={{
            ...vendaExcluindo,
            nome: vendaExcluindo.itens?.[0]?.nome,
            quantidade: vendaExcluindo.itens?.[0]?.quantidade,
          }}
          onClose={() => setVendaExcluindo(null)}
          onConfirmar={handleExcluir}
        />
      )}
    </div>
  )
}
