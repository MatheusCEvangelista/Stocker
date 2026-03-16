const express = require("express")
const router = express.Router()
const userController = require("../controllers/UserController")

router.post("/", userController.createUser)
router.get("/",userController.getUser)

module.exports = router