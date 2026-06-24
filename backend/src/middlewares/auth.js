const jwt = require("jsonwebtoken")
const User = require("../models/Users")

module.exports = async function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token não fornecido." })
  }

  const token = header.split(" ")[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    // Busca o usuário para garantir que ainda existe e continua aprovado
    const user = await User.findById(payload.id)
    if (!user)       return res.status(401).json({ message: "Usuário não encontrado." })
    if (!user.approved) return res.status(403).json({ message: "Conta aguardando aprovação." })

    req.userId = user._id   // disponível em todos os controllers
    next()
  } catch (err) {
    return res.status(401).json({ message: "Token inválido ou expirado." })
  }
}
