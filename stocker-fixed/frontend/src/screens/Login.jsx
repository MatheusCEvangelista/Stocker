import {useState} from 'react'
import { Eye, EyeOff, LogIn} from 'lucide-react'

export default function Login({onNavigate}) {
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [mostrarsenha, setMostrarSenha] = useState(false)
    const [erro, setErro] = useState('')

    function handleSubmit(e){
        e.preventDefault()
        if (!email || !senha){
            setErro('Preencha todos os campos')
            return
        }
        setErro('')
        onNavigate('dashboard')
    }
    return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4">
            <LogIn className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Stocker</h1>
          <p className="text-slate-500 text-sm mt-1">Faca login na sua conta</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
          {erro && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
              {erro}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="senha" className="text-sm font-medium text-slate-700">Senha</label>
            <div className="relative">
              <input
                id="senha"
                type={mostrarsenha ? 'text' : 'password'}
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full h-12 px-4 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarsenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label={mostrarsenha ? 'Esconder senha' : 'Mostrar senha'}
              >
                {mostrarsenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-base transition-colors mt-2 cursor-pointer"
          >
            Entrar
          </button>

          <p className="text-center text-sm text-slate-500 mt-1">
            Nao tem conta?{' '}
            <button
              type="button"
              onClick={() => onNavigate('cadastro')}
              className="text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              Cadastre-se
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