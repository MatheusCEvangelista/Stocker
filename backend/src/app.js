const express = require("express")
const cors = require("cors")
const productRoutes = require("./routes/productRoutes")
const userRoutes = require("./routes/userRoutes")
const saleRoutes = require("./routes/saleRoutes")
const stockRoutes = require("./routes/stockRoutes")

const app = express()
app.use(cors())
app.use(express.json())
app.use("/api/products", productRoutes)
app.use("/api/users", userRoutes)
app.use("/api/sales", saleRoutes)
app.use("/api/stock", stockRoutes)

module.exports = app