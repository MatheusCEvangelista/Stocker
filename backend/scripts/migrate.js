// scripts/migrate.js
require("dotenv").config()
const mongoose = require("mongoose")

const OWNER_ID = "COLE_AQUI_O_SEU_USER_ID" // pegar no banco após criar a conta

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI)

  await mongoose.connection.collection("products").updateMany(
    { owner: { $exists: false } },
    { $set: { owner: new mongoose.Types.ObjectId(OWNER_ID) } }
  )
  await mongoose.connection.collection("sales").updateMany(
    { owner: { $exists: false } },
    { $set: { owner: new mongoose.Types.ObjectId(OWNER_ID) } }
  )
  await mongoose.connection.collection("stockmovements").updateMany(
    { owner: { $exists: false } },
    { $set: { owner: new mongoose.Types.ObjectId(OWNER_ID) } }
  )

  console.log("Migração concluída!")
  await mongoose.disconnect()
}

migrate()