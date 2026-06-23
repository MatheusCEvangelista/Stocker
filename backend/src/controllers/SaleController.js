const Sale          = require("../models/Sale")
const Product       = require("../models/Products")
const StockMovement = require("../models/StockMovement")

exports.createSale = async (req, res) => {
  try {
    const { productId, quantity, adjustmentType, adjustmentValue, paymentType, dailyInterest, dueDate } = req.body

    // Garante que o produto pertence ao usuário logado
    const product = await Product.findOne({ _id: productId, owner: req.userId })
    if (!product) return res.status(404).json({ message: "Produto não encontrado" })

    const subtotal   = product.sellprice * quantity
    let   totalFinal = subtotal
    let   status     = req.body.status || "PAGO"

    if (paymentType === "VISTA") {
      if (adjustmentType === "DESCONTO") totalFinal = subtotal - (adjustmentValue || 0)
      status = "PAGO"
    }
    if (paymentType === "PRAZO") {
      totalFinal = subtotal + (adjustmentValue || 0)
    }

    const movements    = await StockMovement.find({ productId, owner: req.userId })
    const currentStock = movements.reduce((acc, m) => acc + m.quantity, 0)
    if (currentStock < quantity) return res.status(400).json({ message: "Estoque insuficiente" })

    const sale = await Sale.create({
      owner: req.userId,
      code: `V-${Date.now()}`,
      productId, quantity, subtotal,
      adjustmentType, adjustmentValue, totalFinal,
      paymentType, dailyInterest, dueDate, status,
    })

    await StockMovement.create({ owner: req.userId, productId, quantity: -quantity, type: "Saída" })

    res.status(201).json(sale)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getSales = async (req, res) => {
  try {
    const sales = await Sale.find({ owner: req.userId }).populate("productId")
    res.json(sales)
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar vendas" })
  }
}

exports.updateSale = async (req, res) => {
  try {
    const sale = await Sale.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      req.body,
      { new: true }
    ).populate("productId")
    if (!sale) return res.status(404).json({ message: "Venda não encontrada" })
    res.json(sale)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, owner: req.userId })
    if (!sale) return res.status(404).json({ message: "Venda não encontrada" })

    await StockMovement.create({ owner: req.userId, productId: sale.productId, quantity: sale.quantity, type: "Estorno" })
    await Sale.findByIdAndDelete(req.params.id)
    res.json({ message: "Venda removida" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
