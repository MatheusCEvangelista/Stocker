const mongoose = require("mongoose")

const productSchema = new mongoose.Schema(
    {
        code: {type: String, unique: true, required: true},
        groupname: {type: String, required: true},
        flavor: {type: String, required:true},
        costPrice:{type: Number, required: true},
        sellprice:{type: Number, required: true},
        minstock: {type: Number, default: 0},
        active: {type: Boolean, default: true}
    }, {timestamps: true})

    module.exports = mongoose.model("Products", productSchema)
