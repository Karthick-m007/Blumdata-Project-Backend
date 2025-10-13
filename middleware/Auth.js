const registermodel = require('../model/Registerschema');

const auth = async (req, res, next) => {
    try {
        console.log('Session user:', req.session.user);  // Debugging log
        if (!req.session.user) {
            return res.json({ success: false, message: "Please log in to continue" });
        }
        const regauth = await registermodel.findOne({ email: req.session.user.email });
        if (!regauth) {
            return res.json({ success: false, message: "User not found" });
        }
        next();
    } catch (err) {
        console.log("Error in auth middleware:", err);
        return res.json({ success: false, message: "Server error during authorization" });
    }
};


module.exports = auth;
