const express = require("express")
const router = express.Router()
const productController = require("../controllers/ProductController")

router.post("/", productController.createProduct)
router.get("/", productController.getProducts)
router.get("/:code", productController.getProductByCode)
// CORRIGIDO: era /:code mas o controller usa findByIdAndUpdate, então deve ser /:id
router.put("/:id", productController.updateProduct)
router.delete("/:id", productController.deleteProduct)

module.exports = router
