const Product = require("../models/Products")

exports.createProduct = async (req, res)=>{
    try{
        const product = await Product.create(req.body)
        res.status(201).json(product)
    }catch (error){
        res.status(400).json({error: error.message})
    }
}

exports.getProducts = async (req, res) => {
    try{
        const products = await Product.find({active: true})
        res.json(products)
    }catch (error){
        res.status(500).json({error: error.message})
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

exports.updateProduct = async (req, res) => {
  try {
    const product = await Products.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true}
    )

    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado" })
    }

    res.json(updated)

  } catch (error) {
    res.status(400).json({ message: "Erro ao atualizar produto", error })
  }
}

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
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