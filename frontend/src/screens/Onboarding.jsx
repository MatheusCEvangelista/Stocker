import { useState } from 'react'
import { Package, Warehouse, ShoppingCart, X, ArrowRight, CheckCircle } from 'lucide-react'

const PASSOS = [
  {
    id: 1,
    icone: Package,
    cor: 'bg-blue-600',
    corLight: 'bg-blue-50',
    corTexto: 'text-blue-600',
    corBorda: 'border-blue-200',
    titulo: 'Cadastre seu primeiro produto',
    descricao: 'Comece adicionando os produtos que você vende — nome, categoria, preço de custo e preço de venda. O sistema calcula a margem de lucro automaticamente.',
    acao: 'Cadastrar Produto',
    destino: 'produto-form',
    dica: '💡 Use o leitor de código de barras para preencher o código EAN direto da embalagem.',
  },
  {
    id: 2,
    icone: Warehouse,
    cor: 'bg-emerald-600',
    corLight: 'bg-emerald-50',
    corTexto: 'text-emerald-600',
    corBorda: 'border-emerald-200',
    titulo: 'Registre o estoque inicial',
    descricao: 'Informe quantas unidades você tem em mãos agora. Isso permite que o sistema controle entradas, saídas e te avise quando o estoque estiver baixo.',
    acao: 'Ir para Estoque',
    destino: 'estoque',
    dica: '💡 Configure o "Estoque Mínimo" de cada produto para receber alertas antes de ficar sem.',
  },
  {
    id: 3,
    icone: ShoppingCart,
    cor: 'bg-violet-600',
    corLight: 'bg-violet-50',
    corTexto: 'text-violet-600',
    corBorda: 'border-violet-200',
    titulo: 'Registre sua primeira venda',
    descricao: 'Com produto e estoque cadastrados, você já pode registrar vendas à vista ou a prazo, aplicar descontos ou juros e acompanhar o que está pendente.',
    acao: 'Fazer Venda',
    destino: 'venda-form',
    dica: '💡 Vendas a prazo ficam como "Pendente" e aparecem no relatório de inadimplência.',
  },
]

export default function Onboarding({ onNavigate, onConcluir }) {
  const [passo, setPasso] = useState(0) // índice do passo atual
  const [concluidos, setConcluidos] = useState(new Set())

  const atual = PASSOS[passo]
  const Icone = atual.icone
  const isUltimo = passo === PASSOS.length - 1

  function handleAcao() {
    // Marca passo como concluído e navega
    setConcluidos((prev) => new Set([...prev, atual.id]))
    onNavigate(atual.destino)
    // Avança para o próximo passo (o overlay reaparece quando voltar)
    if (!isUltimo) setPasso(passo + 1)
  }

  function handlePular() {
    if (isUltimo) {
      handleConcluir()
    } else {
      setPasso(passo + 1)
    }
  }

  function handleConcluir() {
    localStorage.setItem('stocker_onboarding_done', '1')
    onConcluir()
  }

  function handleIrParaPasso(i) {
    setPasso(i)
  }

  return (
    // Overlay semi-transparente
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

      {/* Painel */}
      <div className="relative z-10 w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">

        {/* Barra de progresso */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-1 bg-blue-600 transition-all duration-500"
            style={{ width: `${((passo + 1) / PASSOS.length) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Passo {passo + 1} de {PASSOS.length}
          </span>
          <button
            onClick={handleConcluir}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Fechar e não mostrar mais"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo do passo */}
        <div className="px-6 pt-5 pb-6 flex flex-col gap-5">
          {/* Ícone + título */}
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 ${atual.cor} rounded-2xl flex items-center justify-center shrink-0`}>
              <Icone className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">{atual.titulo}</h2>
              <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">{atual.descricao}</p>
            </div>
          </div>

          {/* Dica */}
          <div className={`${atual.corLight} border ${atual.corBorda} rounded-xl px-4 py-3 text-sm ${atual.corTexto}`}>
            {atual.dica}
          </div>

          {/* Indicadores de passo */}
          <div className="flex items-center justify-center gap-2">
            {PASSOS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => handleIrParaPasso(i)}
                className={`rounded-full transition-all cursor-pointer ${
                  i === passo
                    ? 'w-6 h-2 bg-blue-600'
                    : concluidos.has(p.id)
                    ? 'w-2 h-2 bg-emerald-500'
                    : 'w-2 h-2 bg-slate-200 hover:bg-slate-300'
                }`}
                title={`Passo ${i + 1}: ${p.titulo}`}
              />
            ))}
          </div>

          {/* Ações */}
          <div className="flex gap-3">
            <button
              onClick={handlePular}
              className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {isUltimo ? 'Fechar' : 'Pular este passo'}
            </button>
            <button
              onClick={handleAcao}
              className={`flex-1 h-11 rounded-xl ${atual.cor} hover:opacity-90 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-opacity cursor-pointer`}
            >
              {atual.acao}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Resumo dos passos concluídos */}
          {concluidos.size > 0 && (
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-1.5">
              {PASSOS.filter((p) => concluidos.has(p.id)).map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{p.titulo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
