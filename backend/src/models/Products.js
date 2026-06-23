const mongoose = require("mongoose")

const productSchema = new mongoose.Schema(
  {
    owner:     { type: mongoose.Schema.Types.ObjectId, ref: "Usuários", required: true },
    code:      { type: String, required: true },
    groupname: { type: String, required: true },
    flavor:    { type: String, required: true },
    costPrice: { type: Number, required: true },
    sellprice: { type: Number, required: true },
    minstock:  { type: Number, default: 0 },
    active:    { type: Boolean, default: true },
  },
  { timestamps: true }
)

// código único POR usuário (não global)
productSchema.index({ owner: 1, code: 1 }, { unique: true })

module.exports = mongoose.model("Products", productSchema)
