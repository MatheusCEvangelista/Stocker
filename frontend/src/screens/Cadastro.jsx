import { useState} from 'react'
import {Eye, EyeOff, UserPlus} from 'lucide-react'

export default function Cadastro({onNavigate}){
    const[nome, setNome] = useState('')
    const[email, setEmail] = useState('')
    const[senha, setSenha] = useState('')
    const[confirmarsenha, setConfirmSenha] = useState('')
    const[mostrarsenha, setMostreSenha] = useState(false)
    const[erro, setErro] = useState('')

    function handleSubmit(e){
        e.preventDefault()
        if (!nome || !email || !senha || !confirmarsenha){
            setErro('Preencha todos os campos!')
        }
        if (senha !== confirmarsenha){
            setErro('Senhas não são iguais')
        }
        if (senha.length < 6){
            setErro('Tamanho da senha menor que 6 caracteres')
            return
        }
        setErro('')
        onNavigate('login')
    }

    return(
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Criar Conta</h1>
          <p className="text-slate-500 text-sm mt-1">Preencha seus dados para começar</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
          {erro && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
              {erro}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nome" className="text-sm font-medium text-slate-700">Nome completo</label>
            <input
              id="nome"
              type="text"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email-cad" className="text-sm font-medium text-slate-700">E-mail</label>
            <input
              id="email-cad"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="senha-cad" className="text-sm font-medium text-slate-700">Senha</label>
            <div className="relative">
              <input
                id="senha-cad"
                type={mostrarsenha ? 'text' : 'password'}
                placeholder="Minimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full h-12 px-4 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setMostreSenha(!mostrarsenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label={mostrarsenha ? 'Esconder senha' : 'Mostrar senha'}>
                {mostrarsenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmar" className="text-sm font-medium text-slate-700">Confirmar senha</label>
            <input
              id="confirmar"
              type="password"
              placeholder="Repita a senha"
              value={confirmarsenha}
              onChange={(e) => setConfirmSenha(e.target.value)}
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <button
            type="submit"
            className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-base transition-colors mt-2 cursor-pointer"
          >
            Criar Conta
          </button>
          <p className="text-center text-sm text-slate-500 mt-1">
            Ja tem conta?{' '}
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              Faça login
            </button>
          </p>
        </form>
      </div>
      <p className="text-xs text-slate-400 mt-8">
        Desenvolvido por Matheus de Castro Evangelista
      </p>
    </div>
  )

}
