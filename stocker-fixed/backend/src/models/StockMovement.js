const mongoose = require("mongoose")

const stockMovementSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true},
        quantity: {type: Number, required: true},
        type: {type: String, enum: ['Entrada', 'Saída', 'Ajuste', 'Estorno'], required:true},
        date:{type: Date, default: Date.now}
    }, )

    module.exports = mongoose.model("StockMovement", stockMovementSchema)
