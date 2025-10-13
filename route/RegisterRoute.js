const mongoose = require('mongoose')

const registermodel = require('../model/Registerschema')
const express = require('express')
const auth = require('../middleware/Auth')

const registerroute = express.Router()


registerroute.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body
        if (!name || !email || !password || !role) {
            return res.json({ success: false, message: "all the fields are required" })
        }

        const emailexist = await registermodel.findOne({ email })
        if (emailexist) {
            return res.json({ success: false, message: "Register Email is Already Exist" })
        }

        const lastid = await registermodel.findOne().sort({ register_id: -1 })
        const last = lastid ? lastid.register_id + 1 : 1

        const newid = new registermodel({
            register_id: last,
            name,
            email,
            password,
            role: role
        })

        const save = await newid.save()

        if (!save) {
            return res.json({ success: false, message: "not saved to db" })
        }
        return res.json({ success: true, message: "successfully save to db" })
    }

    catch (err) {
        console.log("error in the backend register field", err)
    }
})

registerroute.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.json({ success: false, message: "All fields are required" });
        }

        const checkemail = await registermodel.findOne({ email });
        if (!checkemail) {
            return res.json({ success: false, message: "Email does not exist" });
        }

        if (checkemail.password !== password) {
            return res.json({ success: false, message: "Email or Password mismatch" });
        }

        // Check if the user is an admin
        if (role === 'admin') {
            if (checkemail.role !== 'admin' || email !== 'admin123@gmail.com') {
                return res.json({ success: false, message: "Unauthorized admin login attempt" });
            }
        } else if (role === 'user') {
            if (checkemail.role !== 'user' || email === 'admin123@gmail.com') {
                return res.json({ success: false, message: "Unauthorized user login attempt" });
            }
        } else {
            return res.json({ success: false, message: "Invalid role" });
        }

        // Set session for the logged-in user
        req.session.user = {
            register_id: checkemail._id,
            email: checkemail.email,
            role: checkemail.role
        };
        console.log("registerid:",req.session.user.register_id)

        // Log session for debugging
        console.log("Session after login: ", req.session.user);

        return res.json({ success: true, message: "Login successful", logindata: req.session.user });
    } catch (err) {
        console.error("Error in backend login", err);
        return res.json({ success: false, message: "Something went wrong" });
    }
});




registerroute.delete('/logout', auth, async (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.json({ success: false, message: "Not Logged Out" })
        }
        return res.json({ success: true, message: "logout success" })
    })
})

module.exports = registerroute