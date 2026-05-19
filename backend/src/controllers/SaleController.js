const Sale = require("../models/Sale")
const Product = require("../models/Products")
const StockMovement = require("../models/StockMovement")

exports.createSale = async (req, res) => {
  try {
    const {
      productId,
      quantity,
      adjustmentType,
      adjustmentValue,
      paymentType,
      dailyInterest,
      dueDate,
    } = req.body

    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ message: "Produto não encontrado" })

    const subtotal = product.sellprice * quantity
    let totalFinal = subtotal
    // CORRIGIDO: respeita o status enviado pelo frontend; antes sempre forçava PENDENTE para PRAZO
    let status = req.body.status || "PAGO"

    if (paymentType === "VISTA") {
      if (adjustmentType === "DESCONTO") totalFinal = subtotal - (adjustmentValue || 0)
      status = "PAGO"
    }

    if (paymentType === "PRAZO") {
      totalFinal = subtotal + (adjustmentValue || 0)
      // mantém o status enviado (PAGO / PENDENTE / ATRASO)
    }

    const movements = await StockMovement.find({ productId })
    const currentStock = movements.reduce((acc, mov) => acc + mov.quantity, 0)
    if (currentStock < quantity) {
      return res.status(400).json({ message: "Estoque insuficiente" })
    }

    const sale = await Sale.create({
      code: `V-${Date.now()}`,
      productId,
      quantity,
      subtotal,
      adjustmentType,
      adjustmentValue,
      totalFinal,
      paymentType,
      dailyInterest,
      dueDate,
      status,
    })

    await StockMovement.create({ productId, quantity: -quantity, type: "Saída" })

    res.status(201).json(sale)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getSales = async (req, res) => {
  try {
    const sales = await Sale.find().populate("productId")
    res.json(sales)
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar vendas" })
  }
}

// Permite editar status, dueDate, adjustmentValue, paymentType
exports.updateSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("productId")
    if (!sale) return res.status(404).json({ message: "Venda não encontrada" })
    res.json(sale)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
    if (!sale) return res.status(404).json({ message: "Venda não encontrada" })

    // Estorna o estoque ao excluir uma venda
    await StockMovement.create({
      productId: sale.productId,
      quantity: sale.quantity,
      type: "Estorno",
    })

    await Sale.findByIdAndDelete(req.params.id)
    res.json({ message: "Venda removida" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
