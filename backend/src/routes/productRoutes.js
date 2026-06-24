const express = require("express")
const router  = express.Router()
const productController = require("../controllers/ProductController")

router.post("/",            productController.createProduct)
router.get("/",             productController.getProducts)
// next-code ANTES de /:code para não ser capturado como parâmetro
router.get("/next-code",    productController.getNextCode)
router.get("/:code",        productController.getProductByCode)
router.put("/:id",          productController.updateProduct)
router.delete("/:id",       productController.deleteProduct)

module.exports = router
