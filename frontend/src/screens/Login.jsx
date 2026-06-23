import { useState } from "react"
import { Eye, EyeOff, Package } from "lucide-react"
import api from "../services/api"

export default function Login({ onNavigate, onLogin }) {
  const [email, setEmail]         = useState("")
  const [senha, setSenha]         = useState("")
  const [mostrar, setMostrar]     = useState(false)
  const [erro, setErro]           = useState("")
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !senha) { setErro("Preencha todos os campos."); return }

    setErro("")
    setCarregando(true)
    try {
      const response = await api.post("/auth/login", { email, senha })
      const { token, user } = response.data

      localStorage.setItem("stocker_token", token)
      localStorage.setItem("stocker_user", JSON.stringify(user))

      onLogin(user)
    } catch (err) {
      setErro(err.response?.data?.message || "Erro ao fazer login.")
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Stocker</h1>
          <p className="text-slate-500 text-sm mt-1">Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
          {erro && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
              {erro}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">E-mail</label>
            <input
              type="email" value={email} autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Senha</label>
            <div className="relative">
              <input
                type={mostrar ? "text" : "password"} value={senha} autoComplete="current-password"
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
                className="w-full h-12 px-4 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <button type="button" onClick={() => setMostrar(!mostrar)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                {mostrar ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={carregando}
            className="h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-base transition-colors mt-1 cursor-pointer">
            {carregando ? "Entrando…" : "Entrar"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Não tem conta?{" "}
            <button type="button" onClick={() => onNavigate("cadastro")}
              className="text-blue-600 font-semibold hover:underline cursor-pointer">
              Cadastre-se
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
