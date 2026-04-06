const express = require("express")
const router = express.Router()
const productController = require("../controllers/ProductController")

router.post("/", productController.createProduct)
router.get("/",productController.getProducts)
router.get("/:code", productController.getProductByCode)
router.put("/:code", productController.updateProduct)
router.delete("/:id", productController.deleteProduct)

module.exports = router