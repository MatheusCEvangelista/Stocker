const StockMovement = require("../models/StockMovement")

exports.createMovement = async (req, res) => {
  try {
    const { productId, quantity, type } = req.body
    if (!productId || !quantity || !type)
      return res.status(400).json({ message: "Dados obrigatórios faltando" })

    const movement = await StockMovement.create({ owner: req.userId, productId, quantity, type })
    res.status(201).json(movement)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getMovements = async (req, res) => {
  try {
    const movements = await StockMovement.find({ owner: req.userId })
      .populate("productId", "groupname flavor code")
      .sort({ date: -1 })
    res.json(movements)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
