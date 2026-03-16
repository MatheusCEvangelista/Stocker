import { useState } from 'react'
import { ArrowLeft, Save, Upload } from 'lucide-react'
import api from '../services/api'

export default function ProdutoForm({ onNavigate, onSalvar, produtoEditando }) {

const [code, setCode] = useState(produtoEditando?.codigo || '')
const [groupname, setGroupname] = useState(produtoEditando?.categoria || '')
const [flavor, setFlavor] = useState(produtoEditando?.sabor || '')
const [costPrice, setCostPrice] = useState(produtoEditando?.custo?.toString() || '')
const [sellprice, setSellPrice] = useState(produtoEditando?.preco?.toString() || '')

  const [erro, setErro] = useState('')
  const [dragAtivo, setDragAtivo] = useState(false)

 async function handleSubmit(e) {
  e.preventDefault()

  if (!code || !groupname || !flavor || !costPrice || !sellprice) {
    setErro('Preencha todos os campos.')
    return
  }

  if (isNaN(Number(sellprice)) || Number(sellprice) <= 0) {
    setErro('Informe um preco de venda valido.')
    return
  }

  try {
    const response = await api.post("/products", {
      code,
      groupname,
      flavor,
      costPrice: Number(costPrice),
      sellprice: Number(sellprice)
    })

    const produtoSalvo = response.data

    onSalvar({
      id: produtoSalvo._id,
      nome: `${produtoSalvo.groupname} - ${produtoSalvo.flavor}`,
      codigo: produtoSalvo.code,
      preco: produtoSalvo.sellprice,
      custo: produtoSalvo.costPrice,
      categoria: produtoSalvo.groupname,
      sabor: produtoSalvo.flavor
    })

    onNavigate('produtos')

  } catch (error) {
    console.error("ERRO COMPLETO:", error.response?.data)
  setErro(error.response?.data?.message || "Erro ao salvar produto.")
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

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4">
        {erro && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
            {erro}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Codigo</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Categoria (Grupo)</label>
          <input
            type="text"
            value={groupname}
            onChange={(e) => setGroupname(e.target.value)}
            className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Sabor</label>
          <input
            type="text"
            value={flavor}
            onChange={(e) => setFlavor(e.target.value)}
            className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Preco de Custo</label>
          <input
            type="number"
            step="0.01"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Preco de Venda</label>
          <input
            type="number"
            step="0.01"
            value={sellprice}
            onChange={(e) => setSellPrice(e.target.value)}
            className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50"
          />
        </div>

        <button
          type="submit"
          className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors mt-2 cursor-pointer"
        >
          <Save className="w-5 h-5" />
          {produtoEditando ? 'Salvar Alteracoes' : 'Cadastrar Produto'}
        </button>
      </form>
    </div>
  )
}