import { useEffect, useState, useCallback } from "react"
import api from "./services/api"
import { LayoutDashboard, Package, ShoppingCart, LogOut } from 'lucide-react'

import Login from "./screens/Login"
import Cadastro from "./screens/Cadastro"
import Dashboard from "./screens/Dashboard"
import ProdutoLista from "./screens/ProdutoLista"
import ProdutoForm from "./screens/ProdutoForm"
import VendaForm from "./screens/VendaForm"
import VendaLista from "./screens/VendaLista"
import StockMovementForm from "./screens/StockMovementForm"

function App() {
  // Inicializa usuário a partir do localStorage (persiste o login entre reloads)
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem("stocker_user")) } catch { return null }
  })
  const [tela, setTela] = useState("dashboard")
  const [products, setProducts] = useState([])
  const [vendas, setVendas] = useState([])
  const [produtoEditandoId, setProdutoEditandoId] = useState(null)

  const loadProducts = useCallback(async () => {
    try {
      const response = await api.get("/products")
      setProducts(response.data.map((p) => ({
        id: p._id,
        nome: p.groupname + " - " + p.flavor,
        codigo: p.code,
        preco: p.sellprice,
        custo: p.costPrice,
        categoria: p.groupname,
        sabor: p.flavor,
      })))
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
    }
  }, [])

  // Carrega dados assim que o usuário loga
  useEffect(() => {
    if (usuario) loadProducts()
  }, [usuario, loadProducts])

  useEffect(() => {
    if (!usuario || tela !== "vendas") return
    async function loadSales() {
      try {
        const response = await api.get("/sales")
        setVendas(response.data.map((v) => ({
          id: v._id,
          data: new Date(v.saleDate).toLocaleDateString("pt-BR"),
          total: v.totalFinal,
          status: v.status,
          paymentType: v.paymentType,
          adjustmentValue: v.adjustmentValue ?? 0,
          adjustmentType: v.adjustmentType ?? "DESCONTO",
          dailyInterest: v.dailyInterest ?? 0,
          dueDate: v.dueDate ?? null,
          subtotal: v.subtotal ?? 0,
          itens: [{
            nome: `${v.productId?.groupname ?? "?"} - ${v.productId?.flavor ?? ""}`,
            quantidade: v.quantity,
            preco: v.subtotal / v.quantity,
          }],
        })))
      } catch (error) {
        console.error("Erro ao carregar vendas:", error)
      }
    }
    loadSales()
  }, [tela, usuario])

  function handleLogin(user) {
    setUsuario(user)
    setTela("dashboard")
  }

  function handleLogout() {
    localStorage.removeItem("stocker_token")
    localStorage.removeItem("stocker_user")
    setUsuario(null)
    setProducts([])
    setVendas([])
    setTela("dashboard")
  }

  function navegar(destino, extra) {
    if (destino === "produto-form") setProdutoEditandoId(extra !== undefined ? extra : null)
    setTela(destino)
  }

  async function salvarProduto() {
    await loadProducts()
    navegar("produtos")
  }

  async function excluirProduto(id) {
    try {
      await api.delete(`/products/${id}`)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (error) {
      console.error("Erro ao excluir produto:", error)
    }
  }

  function salvarVenda(venda) { setVendas((prev) => [...prev, venda]) }

  function editarVenda(dadosAtualizados) {
    setVendas((prev) => prev.map((v) =>
      v.id !== dadosAtualizados._id ? v : {
        ...v,
        total: dadosAtualizados.totalFinal,
        status: dadosAtualizados.status,
        paymentType: dadosAtualizados.paymentType,
        adjustmentValue: dadosAtualizados.adjustmentValue,
        adjustmentType: dadosAtualizados.adjustmentType,
        dailyInterest: dadosAtualizados.dailyInterest,
        dueDate: dadosAtualizados.dueDate,
      }
    ))
  }

  async function excluirVenda(id) {
    try {
      await api.delete(`/sales/${id}`)
      setVendas((prev) => prev.filter((v) => v.id !== id))
    } catch (error) {
      console.error("Erro ao excluir venda:", error)
    }
  }

  const produtoEditando = produtoEditandoId !== null
    ? products.find((p) => p.id === produtoEditandoId) || null
    : null

  const menuItems = [
    { id: "dashboard", label: "Início",   icon: LayoutDashboard },
    { id: "produtos",  label: "Produtos", icon: Package },
    { id: "vendas",    label: "Vendas",   icon: ShoppingCart },
  ]

  function abaAtiva() {
    if (tela === "dashboard") return "dashboard"
    if (tela === "produtos" || tela === "produto-form") return "produtos"
    if (tela === "vendas"   || tela === "venda-form")  return "vendas"
    return "dashboard"
  }

  function renderTela() {
    switch (tela) {
      case "dashboard":   return <Dashboard onNavigate={navegar} produtos={products} vendas={vendas} />
      case "produtos":    return <ProdutoLista onNavigate={navegar} produtos={products} onExcluir={excluirProduto} />
      case "produto-form":return <ProdutoForm onNavigate={navegar} onSalvar={salvarProduto} produtoEditando={produtoEditando} />
      case "vendas":      return <VendaLista onNavigate={navegar} vendas={vendas} onExcluir={excluirVenda} onEditar={editarVenda} />
      case "venda-form":  return <VendaForm onNavigate={navegar} produtos={products} onSalvar={salvarVenda} />
      case "estoque":     return <StockMovementForm onNavigate={navegar} produtos={products} />
      default:            return <Dashboard onNavigate={navegar} produtos={products} vendas={vendas} />
    }
  }

  // ── Rotas públicas ──
  if (!usuario) {
    if (tela === "cadastro") return <Cadastro onNavigate={setTela} />
    return <Login onNavigate={setTela} onLogin={handleLogin} />
  }

  // ── App autenticado ──
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-56 bg-slate-900 flex-col z-40">
        <div className="p-5 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">Stocker</span>
        </div>

        <nav className="flex-1 px-3 mt-2 flex flex-col gap-1">
          {menuItems.map((item) => {
            const ativa = abaAtiva() === item.id
            return (
              <button key={item.id} onClick={() => navegar(item.id)}
                className={`w-full h-11 rounded-xl flex items-center gap-3 px-4 text-sm font-medium transition-colors cursor-pointer ${
                  ativa ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}>
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className="px-4 py-2 mb-1">
            <p className="text-xs text-slate-500 truncate">Logado como</p>
            <p className="text-sm text-slate-300 font-medium truncate">{usuario.name}</p>
          </div>
          <button onClick={handleLogout}
            className="w-full h-11 rounded-xl flex items-center gap-3 px-4 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">Stocker</span>
        </div>
        <button onClick={handleLogout}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label="Sair">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="lg:ml-56 p-4 pb-24 lg:p-6 lg:pb-6">
        {renderTela()}
      </main>

      {/* Bottom nav mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 flex items-center justify-around h-16">
        {menuItems.map((item) => {
          const ativa = abaAtiva() === item.id
          return (
            <button key={item.id} onClick={() => navegar(item.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 cursor-pointer transition-colors ${
                ativa ? "text-blue-600" : "text-slate-400"
              }`}>
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default App
