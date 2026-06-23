const bcrypt = require("bcryptjs")
const jwt    = require("jsonwebtoken")
const User   = require("../models/Users")

// POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, senha } = req.body
  if (!name || !email || !senha)
    return res.status(400).json({ message: "Preencha todos os campos." })
  if (senha.length < 6)
    return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres." })

  try {
    const existe = await User.findOne({ email })
    if (existe) return res.status(409).json({ message: "E-mail já cadastrado." })

    const hash = await bcrypt.hash(senha, 10)
    await User.create({ name, email, senha: hash, approved: false })

    // Não retorna token — conta precisa de aprovação manual
    res.status(201).json({ message: "Cadastro realizado! Aguarde a aprovação." })
  } catch (err) {
    res.status(500).json({ message: "Erro ao criar conta.", error: err.message })
  }
}

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, senha } = req.body
  if (!email || !senha)
    return res.status(400).json({ message: "Preencha todos os campos." })

  try {
    const user = await User.findOne({ email }).select("+senha")
    if (!user) return res.status(401).json({ message: "E-mail ou senha incorretos." })

    const senhaOk = await bcrypt.compare(senha, user.senha)
    if (!senhaOk) return res.status(401).json({ message: "E-mail ou senha incorretos." })

    if (!user.approved)
      return res.status(403).json({ message: "Sua conta ainda está em análise. Entraremos em contato em breve." })

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    })
  } catch (err) {
    res.status(500).json({ message: "Erro ao fazer login.", error: err.message })
  }
}
