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
      dueDate
    } = req.body

    const product = await Product.findById(productId)

    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado" })
    }

    const subtotal = product.sellprice * quantity

    let totalFinal = subtotal
    let status = req.body.status || "PAGO"

    if (paymentType === "VISTA") {

      if (adjustmentType === "DESCONTO") {
        totalFinal = subtotal - adjustmentValue
      }

      status = "PAGO"
    }

    if (paymentType === "PRAZO") {
      status = "PENDENTE"
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
      status
    })

    await StockMovement.create({
      productId,
      quantity: -quantity,
      type: "Saída"
    })

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

exports.updateSale = async (req,res)=>{
 try{

  const sale = await Sale.findByIdAndUpdate(
   req.params.id,
   req.body,
   {new:true}
  )

  res.json(sale)

 }catch(error){
  res.status(400).json({error:error.message})
 }
}

exports.deleteSale = async (req,res)=>{
 try{

  await Sale.findByIdAndDelete(req.params.id)

  res.json({message:"Venda removida"})

 }catch(error){
  res.status(400).json({error:error.message})
 }
}