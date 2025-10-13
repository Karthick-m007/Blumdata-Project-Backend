const mongoose = require('mongoose')

const Manageproductschemaadmin = mongoose.Schema({
    manageProduct_id: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    product_image: { // Change this to an object instead of an array
        filename: {
            type: String,
            required: true
        },
        filepath: {
            type: String,
            required: true
        }
    }
});

const ManageProductAdminModel = mongoose.model('blumdata_manageproduct_admin', Manageproductschemaadmin);

module.exports = ManageProductAdminModel