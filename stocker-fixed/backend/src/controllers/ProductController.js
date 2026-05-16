const Product = require("../models/Products")

exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body)
    res.status(201).json(product)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ active: true })
    res.json(products)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getProductByCode = async (req, res) => {
  try {
    const product = await Product.findOne({ code: req.params.code })
    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado" })
    }
    res.json(product)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// CORRIGIDO: variável era "Products" (undefined) e retornava "updated" (undefined)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )

    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado" })
    }

    res.json(product)
  } catch (error) {
    res.status(400).json({ message: "Erro ao atualizar produto", error: error.message })
  }
}

// CORRIGIDO: findOneAndUpdate precisava de { _id: id } como filtro, não o id direto
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    )

    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado" })
    }

    res.json({ message: "Produto desativado" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
