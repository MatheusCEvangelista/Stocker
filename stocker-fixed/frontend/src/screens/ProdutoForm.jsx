import { useState } from 'react'
import { ArrowLeft, Save, TrendingUp } from 'lucide-react'
import api from '../services/api'

export default function ProdutoForm({ onNavigate, onSalvar, produtoEditando }) {
  const [code, setCode] = useState(produtoEditando?.codigo || '')
  const [groupname, setGroupname] = useState(produtoEditando?.categoria || '')
  const [flavor, setFlavor] = useState(produtoEditando?.sabor || '')
  const [costPrice, setCostPrice] = useState(produtoEditando?.custo?.toString() || '')
  const [sellprice, setSellPrice] = useState(produtoEditando?.preco?.toString() || '')
  const [erro, setErro] = useState('')

  const custo = Number(costPrice) || 0
  const venda = Number(sellprice) || 0
  const margem = custo > 0 && venda > 0 ? ((venda - custo) / custo) * 100 : null
  const lucroUnit = custo > 0 && venda > 0 ? venda - custo : null

  async function handleSubmit(e) {
    e.preventDefault()

    if (!code || !groupname || !flavor || !costPrice || !sellprice) {
      setErro('Preencha todos os campos.')
      return
    }
    if (isNaN(custo) || custo < 0) {
      setErro('Informe um preço de custo válido.')
      return
    }
    if (isNaN(venda) || venda <= 0) {
      setErro('Informe um preço de venda válido.')
      return
    }

    const payload = { code, groupname, flavor, costPrice: custo, sellprice: venda }

    try {
      let produtoSalvo
      if (produtoEditando) {
        const response = await api.put(`/products/${produtoEditando.id}`, payload)
        produtoSalvo = response.data
      } else {
        const response = await api.post('/products', payload)
        produtoSalvo = response.data
      }

      onSalvar({
        id: produtoSalvo._id,
        nome: `${produtoSalvo.groupname} - ${produtoSalvo.flavor}`,
        codigo: produtoSalvo.code,
        preco: produtoSalvo.sellprice,
        custo: produtoSalvo.costPrice,
        categoria: produtoSalvo.groupname,
        sabor: produtoSalvo.flavor,
      })
    } catch (error) {
      console.error('Erro ao salvar produto:', error.response?.data)
      setErro(error.response?.data?.message || 'Erro ao salvar produto.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('produtos')}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {produtoEditando ? 'Editar Produto' : 'Novo Produto'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {produtoEditando ? 'Altere os dados do produto' : 'Preencha os dados do produto'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Formulário principal */}
        <form onSubmit={handleSubmit} className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4">
          {erro && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
              {erro}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Código</label>
            <input
              type="text" value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Categoria (Grupo)</label>
            <input
              type="text" value={groupname}
              onChange={(e) => setGroupname(e.target.value)}
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Sabor</label>
            <input
              type="text" value={flavor}
              onChange={(e) => setFlavor(e.target.value)}
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Preços lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Preço de Custo</label>
              <input
                type="number" step="0.01" min="0" value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Preço de Venda</label>
              <input
                type="number" step="0.01" min="0.01" value={sellprice}
                onChange={(e) => setSellPrice(e.target.value)}
                className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors mt-2 cursor-pointer"
          >
            <Save className="w-5 h-5" />
            {produtoEditando ? 'Salvar Alterações' : 'Cadastrar Produto'}
          </button>
        </form>

        {/* Card de margem — aparece quando há dados suficientes */}
        {margem !== null && (
          <div className="lg:w-64 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-600" />
              <h2 className="font-semibold text-slate-900">Análise de Margem</h2>
            </div>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Preço de custo</span>
                <span className="font-medium text-slate-700">R$ {custo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Preço de venda</span>
                <span className="font-semibold text-slate-900">R$ {venda.toFixed(2)}</span>
              </div>

              <div className="border-t border-slate-100 pt-3 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Lucro por unidade</span>
                  <span className={`font-semibold ${lucroUnit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    R$ {lucroUnit.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Margem</span>
                  <span className={`text-lg font-bold ${
                    margem >= 20 ? 'text-emerald-600' :
                    margem >= 0 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {margem.toFixed(1)}%
                  </span>
                </div>

                {/* Barra visual */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      margem >= 20 ? 'bg-emerald-500' :
                      margem >= 0 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(Math.max(margem, 0), 100)}%` }}
                  />
                </div>

                <p className={`text-xs font-medium ${
                  margem >= 20 ? 'text-emerald-600' :
                  margem >= 0 ? 'text-amber-600' :
                  'text-red-600'
                }`}>
                  {margem >= 20 ? '✓ Margem saudável' :
                   margem >= 0 ? '⚠ Margem baixa' :
                   '✗ Venda abaixo do custo'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
