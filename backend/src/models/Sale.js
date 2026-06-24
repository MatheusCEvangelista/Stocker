const mongoose = require("mongoose")

const saleSchema = new mongoose.Schema(
  {
    owner:     { type: mongoose.Schema.Types.ObjectId, ref: "Usuários", required: true },
    code:      { type: String, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
    quantity:  { type: Number, required: true, min: 1 },
    subtotal:  Number,
    adjustmentType:  { type: String, enum: ["DESCONTO", "JUROS", "NENHUM"], default: "NENHUM" },
    adjustmentValue: { type: Number, default: 0 },
    totalFinal: Number,
    paymentType: { type: String, enum: ["VISTA", "PRAZO"], required: true },
    dailyInterest: { type: Number, default: 0 },
    dueDate: Date,
    status: { type: String, enum: ["PAGO", "PENDENTE", "ATRASO", "CANCELADO"], default: "PAGO" },
    saleDate: { type: Date, default: Date.now },
    // NOVO: controla se o produto foi fisicamente retirado/entregue
    // Vista → true imediato | Prazo → false até confirmar retirada
    delivered: { type: Boolean, default: false },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Sale", saleSchema)
