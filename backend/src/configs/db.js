const mongoose = require("mongoose")

const ConnectDB = async () => {
    try{
        await mongoose.connect(process.env.Mongo_URL)
        console.log("Conectado")
    }catch (error){
        console.error(error)
        process.exit(1)
    }
}

module.exports = ConnectDB