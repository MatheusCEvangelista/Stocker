import { Package, ShoppingCart, DollarSign, TrendingUp, ArrowRight} from 'lucide-react'

export default function Dashboard({onNavigate, produtos, vendas}){
    const totalReceita = vendas.reduce((acc, v)=> acc + v.total, 0)
    const ticketMedio = vendas.length > 0 ? totalReceita / vendas.length : 0

    const cards = [
        { label: 'Produtos', valor: produtos.length, icon: Package, cor: 'bg-blue-600' },
        { label: 'Vendas', valor: vendas.length, icon: ShoppingCart, cor: 'bg-emerald-600' },
        { label: 'Receita Total', valor: `R$ ${totalReceita.toFixed(2)}`, icon: DollarSign, cor: 'bg-amber-500' },
        { label: 'Ticket Medio', valor: `R$ ${ticketMedio.toFixed(2)}`, icon: TrendingUp, cor: 'bg-violet-600' },
    ]
     return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Visao geral do seu negocio</p>
      </div>
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
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Acesso Rapido</h2>
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
              <p className="text-sm text-slate-500">Historico e nova venda</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </button>
        </div>
      </div>
      {vendas.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Ultimas Vendas</h2>
          <div className="flex flex-col gap-2">
            {vendas.slice(-3).reverse().map((venda) => (
              <div key={venda.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Venda #{venda.id}</p>
                  <p className="text-sm text-slate-500">{venda.data} - {venda.itens.length} {venda.itens.length === 1 ? 'item' : 'itens'}</p>
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