import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
})

// Injeta o token em toda requisição automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("stocker_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Se o token expirar ou for inválido, redireciona para login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      // Só limpa se for erro de auth (não de conta em análise no login)
      if (err.config.url !== "/auth/login" && err.config.url !== "/auth/register") {
        localStorage.removeItem("stocker_token")
        localStorage.removeItem("stocker_user")
        window.location.href = "/"
      }
    }
    return Promise.reject(err)
  }
)

export default api
