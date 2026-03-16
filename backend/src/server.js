require("dotenv").config()

const app = require("./app")
const ConnectDB = require("./configs/db")

ConnectDB()

const PORT = process.env.PORT || 3000

app.listen(PORT, () =>{
    console.log("Servidor no ar")
})