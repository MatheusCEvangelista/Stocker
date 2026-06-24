const express = require("express")
const router = express.Router()
const controller = require("../controllers/stockController")

router.post("/", controller.createMovement)
router.get("/", controller.getMovements)

module.exports = router