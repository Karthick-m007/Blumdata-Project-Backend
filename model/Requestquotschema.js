// models/RequestQuote.js
const mongoose = require('mongoose');

const requestQuoteSchema = mongoose.Schema({
    requestQuote_id: {
        type: Number,
        required: true,
        unique: true
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phonenumber: { type: String, required: true },
    product: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1']
    },
    message: { type: String, default: '' },
    delivery: { type: Date },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Approved', 'Rejected']
    },
    register_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    trackingStatus: {
        type: String,
        enum: ['Ordered', 'In Production', 'Testing', 'Ready for Delivery', 'Completed'],
        default: 'Ordered'  // Default tracking status
    },
    total:{
        type:Number,
        required:true
    },
    stages: {  // Added stages field
        type: [String],  // Array of stages
        default: ['Ordered', 'In Production', 'Testing', 'Ready for Delivery', 'Completed']
    },
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Pending', 'Failed', 'Refunded'],
        default: 'Pending'
    }
}, { timestamps: true });

const RequestQuote = mongoose.model('RequestQuote', requestQuoteSchema);
module.exports = RequestQuote;
