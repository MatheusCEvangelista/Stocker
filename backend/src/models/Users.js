const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
  {
    name:  { type: String, trim: true, required: [true, "O nome é obrigatório"] },
    email: { type: String, required: [true, "O e-mail é obrigatório"], unique: true, lowercase: true, trim: true },
    senha: { type: String, required: [true, "A senha é obrigatória"], select: false },
    // approved: false = aguardando aprovação manual no banco; true = pode logar
    approved: { type: Boolean, default: false },
    // role: "user" | "admin"  (admin pode ser setado manualmente no banco)
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Usuários", userSchema)
