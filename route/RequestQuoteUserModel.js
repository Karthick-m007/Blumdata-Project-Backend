const express = require('express');
const mongoose = require('mongoose');
const requestQuotemodel = require('../model/Requestquotschema');
const auth = require('../middleware/Auth');
const router = express.Router();
const managaproductmodel = require('../model/ManageProductsschema')
const nodemailer = require('nodemailer')

const fetchAvailableProducts = async () => {
    const products = await managaproductmodel.find();
    return products.map(product => product.name.trim().toLowerCase());
};

router.post('/requestquote', auth, async (req, res) => {
    try {
        const { name, email, phonenumber, product, quantity, delivery, message } = req.body;

        const deliveryDate = new Date(delivery);
        if (isNaN(deliveryDate.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid delivery date" });
        }

        const availableProducts = await fetchAvailableProducts();

        if (!availableProducts.includes(product.trim().toLowerCase())) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const productavail = await managaproductmodel.findOne({ name: product });
        if (!productavail) {
            return res.status(404).json({ success: false, message: "Product not found in the database" });
        }

        const productPrice = parseFloat(productavail.price.replace(/,/g, ''));

        const total = productPrice * quantity;

        const lastid = await requestQuotemodel.findOne().sort({ requestQuote_id: -1 });
        const id = lastid ? lastid.requestQuote_id + 1 : 1;

        const register_id = req.session.user.register_id;

        const newRequest = new requestQuotemodel({
            requestQuote_id: id,
            name,
            email,
            phonenumber,
            product,
            quantity,
            delivery: deliveryDate, 
            message,
            total, 
            register_id 
        });

        const save = await newRequest.save();
        if (!save) {
            return res.status(500).json({ success: false, message: "Request not saved to database" });
        }

        return res.status(201).json({ success: true, message: "Request saved to database" });
    } catch (err) {
        console.log("Error in the backend request quote:", err);
        return res.status(500).json({ success: false, message: "Server error, please try again later" });
    }
});


router.get('/getproductsdropdown', async (req, res) => {
    try {
        const getproduct = await managaproductmodel.find().select('name');

        if (!getproduct || getproduct.length === 0) {
            return res.json({ success: false, message: "No products found" });
        }

        return res.json({ success: true, message: "get success", getproduct });
    } catch (err) {
        console.log("Error in the backend get product:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});







router.get('/requestquote-getitems', auth, async (req, res) => {
    const userId = req.session.user ? req.session.user.register_id : null;
    const isAdmin = req.session.user && req.session.user.role === 'admin';

    if (!userId) return res.status(400).json({ success: false, message: "User is not logged in" });

    try {
        let quotes;
        if (isAdmin) {
            quotes = await requestQuotemodel.find();
        } else {
            quotes = await requestQuotemodel.find({ register_id: userId });
        }

        if (!quotes.length) return res.status(404).json({ success: false, message: "No quotes found" });

        return res.status(200).json({
            success: true,
            message: "Quotes retrieved successfully",
            product: quotes
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error fetching quotes" });
    }
});

router.get('/requestquote-getitems/:id', auth, async (req, res) => {
    const userId = req.session.user ? req.session.user.register_id : null;
    const userRole = req.session.user ? req.session.user.role : null;
    const { id } = req.params;

    if (!(id)) {
        return res.status(400).json({ success: false, message: "Invalid quote ID" });
    }

    if (!userId) return res.status(400).json({ success: false, message: "User is not logged in" });

    try {
        let quote;
        if (userRole === 'admin') {
            quote = await requestQuotemodel.findById(id);
        } else {
            quote = await requestQuotemodel.findOne({ _id: id, register_id: userId });
        }

        if (!quote) return res.status(404).json({ success: false, message: "Quote not found" });

        return res.status(200).json({
            success: true,
            message: "Quote retrieved successfully",
            product: quote
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error fetching quote" });
    }
});

router.put('/update-tracking-status/:id', auth, async (req, res) => {
    const { status } = req.body;

    const validStatuses = ['Ordered', 'In Production', 'Testing', 'Ready for Delivery', 'Completed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const isAdmin = req.session.user && req.session.user.role === 'admin';
    if (!isAdmin) {
        return res.status(403).json({ success: false, message: "Permission denied" });
    }

    try {
        const updatedQuote = await requestQuotemodel.findByIdAndUpdate(
            req.params.id,
            { trackingStatus: status },
            { new: true }
        );

        if (!updatedQuote) {
            return res.status(404).json({ success: false, message: "Quote not found" });
        }


        return res.status(200).json({
            success: true,
            message: "Tracking status updated",
            trackingStatus: updatedQuote.trackingStatus
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error updating tracking status" });
    }
});

router.put('/update-quote-status/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const quote = await requestQuotemodel.findByIdAndUpdate(id, { status }, { new: true });

        if (!quote) {
            return res.status(404).json({ message: 'Quote not found' });
        }

        res.json({ success: true, quote });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// const productPrices = {
//     '3D Printer': 500,  // Example price for 3D Printer
//     'CNC Machine': 1000, // Example price for CNC Machine
//     'Laser Cutter': 800 // Example price for Laser Cutter
// };

// In your router, when fetching the quotes:
router.get('/quotations', auth, async (req, res) => {
    try {
        const products = await managaproductmodel.find();
        console.log("Products fetched from DB:", products);

        const productPrices = {};
        products.forEach(product => {
            const normalizedProductName = product.name.trim().toLowerCase();
            productPrices[normalizedProductName] = product.price;
        });
        console.log("Product Prices:", productPrices);

        const userId = req.session.user.register_id;
        const userRole = req.session.user.role;

        let quotations;

        if (userRole === 'admin') {
            quotations = await requestQuotemodel.find().sort({ createdAt: -1 });
        } else {
            quotations = await requestQuotemodel.find({ register_id: userId }).sort({ createdAt: -1 });
        }

        if (!quotations.length) {
            return res.status(404).json({ success: false, message: 'No quotations found' });
        }

        console.log("Fetched Quotations:", quotations);

        quotations = quotations.map(quote => {
            const normalizedQuoteProduct = quote.product.trim().toLowerCase();
            console.log("Normalized Quote Product:", normalizedQuoteProduct);
            console.log("Available Product Prices:", productPrices);

            const productPrice = productPrices[normalizedQuoteProduct] || 0;
            console.log("Product Price for", normalizedQuoteProduct, ":", productPrice);

            const total = productPrice * quote.quantity;
            console.log("Total Price Calculation:", total);

            return { ...quote.toObject(), total };
        });

        return res.status(200).json({ success: true, quotations });
    } catch (error) {
        console.error("Error fetching quotations:", error);
        return res.status(500).json({ success: false, message: 'Error fetching quotations' });
    }
});



const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change the email provider if needed
    auth: {
        user: "madhanbgmi8@gmail.com", // Use your email here
        pass: "lten guhi icmc bhsh", // Use your email password or an app password
    },
});

// Send email after payment success
const sendPaymentSuccessEmail = (email, orderId, amount) => {
    const mailOptions = {
        from: "your-email@gmail.com",  // Use your email here
        to: email,
        subject: 'Payment Success Notification',
        text: `Dear Customer,\n\nYour payment for order ${orderId} has been successfully processed. Amount: ${amount}\n\nThank you for your purchase!`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};



router.put('/update-payment-status/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const validPaymentStatuses = ['Paid', 'Pending', 'Failed', 'Refunded'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
        console.error('Received invalid payment status:', paymentStatus); // Log invalid status
        return res.status(400).json({ success: false, message: "Invalid payment status" });
    }

    try {
        // Find and update the quote payment status
        const updatedQuote = await requestQuotemodel.findByIdAndUpdate(
            id,
            { paymentStatus },
            { new: true }
        );

        if (!updatedQuote) {
            return res.status(404).json({ success: false, message: "Quote not found" });
        }

        // If payment was successful, send the email
        if (paymentStatus === 'Paid') {
            sendPaymentSuccessEmail(updatedQuote.email, updatedQuote.requestQuote_id, updatedQuote.total);
        }

        return res.status(200).json({
            success: true,
            message: "Payment status updated",
            paymentStatus: updatedQuote.paymentStatus,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error updating payment status" });
    }
});











module.exports = router;

// router.put('/update-quote-status /:id', auth, async (req, res) => {
// const { id } = req.params;
// const { status } = req.body;  // Expected body: { status: 'Approved' } or { status: 'Rejected' }

// try {
//     // Validate the status (only allow 'Approved' or 'Rejected')
//     if (!['Approved', 'Rejected'].includes(status)) {
//         return res.status(400).json({ message: 'Invalid status' });
//     }

//     // Find the quote and update its status
//     const quote = await requestQuotemodel.findByIdAndUpdate(id, { status }, { new: true });

//     if (!quote) {
//         return res.status(404).json({ message: 'Quote not found' });
//     }

//     // Return success response
//     res.json({ success: true, quote });
// } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server Error' });
// }
// });
