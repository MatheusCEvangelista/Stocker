const express = require("express")
const router = express.Router()
const controller = require("../controllers/SaleController")
console.log(controller)

router.post("/", controller.createSale)
router.get("/", controller.getSales)
router.put("/:id", controller.updateSale)
router.delete("/:id", controller.deleteSale)

module.exports = router