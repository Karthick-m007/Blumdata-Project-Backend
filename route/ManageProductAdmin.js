const express = require('express')
const auth = require('../middleware/Auth')

const manageproductadminRoute = express.Router()
const path = require('path')
const multer = require('multer')
const fs = require('fs')

const ManageProductAdminModel = require('../model/ManageProductsschema')


const uploads = "uploads"
if (!fs.existsSync(uploads)) {
    fs.mkdirSync(uploads)
}



const store = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        const name = Date.now() + "-" + path.extname(file.originalname)
        cb(null, name)
    }
})


const uploadimage = multer({
    storage: store
})



manageproductadminRoute.post('/addnewProduct', uploadimage.single('image'), async (req, res) => {
    try {
        const { name, price, description } = req.body;
        const product_image = req.file;

        if (!name || !price || !description || !product_image) {
            console.log(name, price, description);
            return res.status(400).json({ success: false, message: "All fields are required, including an image" });
        }

        const existingProduct = await ManageProductAdminModel.findOne({ name });
        if (existingProduct) {
            return res.status(400).json({ success: false, message: "Product with this name already exists" });
        }

        const lastProduct = await ManageProductAdminModel.findOne().sort({ manageProduct_id: -1 });
        const newProductId = lastProduct ? lastProduct.manageProduct_id + 1 : 1;

        const imagePath = product_image.path.replace(/\\/g, "/");
        const imagesfolder = {
            filename: product_image.filename,
            filepath: imagePath
        };

        const newManageProduct = new ManageProductAdminModel({
            manageProduct_id: newProductId,
            name,
            price,
            description,
            product_image: imagesfolder
        });

        // Save the product to the database
        const savedProduct = await newManageProduct.save();
        if (!savedProduct) {
            return res.status(500).json({ success: false, message: "Failed to save product to the database" });
        }

        return res.status(201).json({ success: true, message: "Product successfully saved to the database" });

    } catch (err) {
        console.error("Error in backend add new product:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});



manageproductadminRoute.get('/getproducts', async (req, res) => {
    try {

        const getitems = await ManageProductAdminModel.find()
        if (!getitems) {
            return res.json({ success: false, message: "Data Not found" })
        }
        return res.json({ success: true, message: "Data get successfully", product: getitems })
    }

    catch (err) {
        console.log("error in the backend get products", err)
    }
})


manageproductadminRoute.get('/getproducts/:id', async (req, res) => {
    try {
        const id = Number(req.params.id)
        const getitems = await ManageProductAdminModel.findOne({ manageProduct_id: id })
        console.log(id)
        if (!getitems) {
            return res.send({ success: false, message: "product id not found" })
        }

        return res.send({ success: true, message: "product get success", productbyid: getitems })
    }

    catch (err) {
        console.log("error in the backend get products by id", err)
    }
})


manageproductadminRoute.put('/updateproduct/:manageproduct_id', auth, uploadimage.single('image'), async (req, res) => {
    try {
        const productid = Number(req.params.manageproduct_id);
        const { name, price, description } = req.body;

        if (isNaN(productid)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        if (!name || !price || !description) {
            return res.json({ success: false, message: "All fields are required" });
        }

        const priceNumber = parseFloat(price);
        if (isNaN(priceNumber)) {
            return res.json({ success: false, message: "Price must be a valid number" });
        }

        const productexist = await ManageProductAdminModel.findOne({ manageProduct_id: productid });
        if (!productexist) {
            return res.json({ success: false, message: "Product not found" });
        }

        let product_image;
        if (req.file) {
            product_image = {
                filename: req.file.filename,
                filepath: req.file.path.replace(/\\/g, "/")
            };
        }

        const updateFields = { name, price: priceNumber, description };
        if (product_image) {
            updateFields.product_image = product_image;
        }

        const updateproduct = await ManageProductAdminModel.updateOne(
            { manageProduct_id: productid },
            { $set: updateFields }
        );

        if (updateproduct.matchedCount === 0) {
            return res.json({ success: false, message: "Product not found" });
        }

        if (updateproduct.modifiedCount === 0) {
            return res.json({ success: true, message: "No changes made to the product" });
        }

        return res.json({ success: true, message: "Product updated successfully" });

    } catch (err) {
        console.error("Error updating product:", err.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});




manageproductadminRoute.delete('/deleteproduct/:manageproduct_id', auth, async (req, res) => {
    try {
        const id = Number(req.params.manageproduct_id)

        const deleteid = await ManageProductAdminModel.findOne({ manageProduct_id: id })
        if (!deleteid) {
            return res.json({ success: false, message: "delete id not found" })
        }

        const deleteing = await ManageProductAdminModel.findOneAndDelete({ manageProduct_id: id })
        if (!deleteing) {
            return res.json({ success: false, message: "product not deleted" })
        }
        return res.json({ success: true, message: "product deleted" })
    }


    catch (err) {
        console.log("something error in delete", err)

    }
})
module.exports = manageproductadminRoute