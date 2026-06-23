import { useState } from "react"
import { Eye, EyeOff, UserPlus, Clock } from "lucide-react"
import api from "../services/api"

export default function Cadastro({ onNavigate }) {
  const [nome, setNome]                 = useState("")
  const [email, setEmail]               = useState("")
  const [senha, setSenha]               = useState("")
  const [confirmar, setConfirmar]       = useState("")
  const [mostrar, setMostrar]           = useState(false)
  const [erro, setErro]                 = useState("")
  const [carregando, setCarregando]     = useState(false)
  const [cadastrado, setCadastrado]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nome || !email || !senha || !confirmar) { setErro("Preencha todos os campos."); return }
    if (senha.length < 6) { setErro("A senha deve ter pelo menos 6 caracteres."); return }
    if (senha !== confirmar) { setErro("As senhas não coincidem."); return }

    setErro("")
    setCarregando(true)
    try {
      await api.post("/auth/register", { name: nome, email, senha })
      setCadastrado(true)
    } catch (err) {
      setErro(err.response?.data?.message || "Erro ao criar conta.")
    } finally {
      setCarregando(false)
    }
  }

  // ── Tela de confirmação pós-cadastro ──
  if (cadastrado) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-2xl mb-6">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Cadastro recebido!</h1>
          <p className="text-slate-500 mt-3 leading-relaxed">
            Obrigado pelo cadastro, <strong className="text-slate-700">{nome}</strong>!
            Sua conta está em análise. Entraremos em contato via e-mail em até 24h para liberar seu acesso.
          </p>
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            Enquanto isso, fique de olho no seu e-mail: <strong>{email}</strong>
          </div>
          <button onClick={() => onNavigate("login")}
            className="mt-6 w-full h-12 bg-slate-900 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors cursor-pointer">
            Voltar para o login
          </button>
        </div>
      </div>
    )
  }

  // ── Formulário de cadastro ──
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Criar Conta</h1>
          <p className="text-slate-500 text-sm mt-1">Preencha seus dados para solicitar acesso</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
          {erro && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">{erro}</div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Nome completo</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com" autoComplete="email"
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Senha</label>
            <div className="relative">
              <input type={mostrar ? "text" : "password"} value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres" autoComplete="new-password"
                className="w-full h-12 px-4 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
              <button type="button" onClick={() => setMostrar(!mostrar)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                {mostrar ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Confirmar senha</label>
            <input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repita a senha" autoComplete="new-password"
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>

          <button type="submit" disabled={carregando}
            className="h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-base transition-colors mt-1 cursor-pointer">
            {carregando ? "Enviando…" : "Solicitar Acesso"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Já tem conta?{" "}
            <button type="button" onClick={() => onNavigate("login")}
              className="text-blue-600 font-semibold hover:underline cursor-pointer">
              Faça login
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
