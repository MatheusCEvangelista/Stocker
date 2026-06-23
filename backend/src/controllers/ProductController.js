const Product = require("../models/Products")

exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, owner: req.userId })
    res.status(201).json(product)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ owner: req.userId, active: true })
    res.json(products)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getProductByCode = async (req, res) => {
  try {
    const product = await Product.findOne({ owner: req.userId, code: req.params.code })
    if (!product) return res.status(404).json({ message: "Produto não encontrado" })
    res.json(product)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      req.body,
      { new: true }
    )
    if (!product) return res.status(404).json({ message: "Produto não encontrado" })
    res.json(product)
  } catch (error) {
    res.status(400).json({ message: "Erro ao atualizar produto", error: error.message })
  }
}

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { active: false },
      { new: true }
    )
    if (!product) return res.status(404).json({ message: "Produto não encontrado" })
    res.json({ message: "Produto desativado" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
