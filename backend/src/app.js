const express        = require("express")
const cors           = require("cors")
const auth           = require("./middlewares/auth")
const userRoutes     = require("./routes/userRoutes")
const productRoutes  = require("./routes/productRoutes")
const saleRoutes     = require("./routes/saleRoutes")
const stockRoutes    = require("./routes/stockRoutes")

const app = express()

app.use(cors())
app.use(express.json())

// Rotas públicas (não precisam de token)
app.use("/api/auth", userRoutes)

// Rotas protegidas (precisam de token + conta aprovada)
app.use("/api/products", auth, productRoutes)
app.use("/api/sales",    auth, saleRoutes)
app.use("/api/stock",    auth, stockRoutes)

module.exports = app
