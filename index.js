const express = require('express')
require('dotenv').config()
const mongoose = require('mongoose')
const session = require("express-session")
const MongoDBStore = require("connect-mongodb-session")(session);
const cors = require('cors');
const registerroute = require('./route/RegisterRoute');
const requestQuoteUser = require('./route/RequestQuoteUserModel');
const manageproductadminRoute = require('./route/ManageProductAdmin');
const path = require('path');
const router = require('./route/RequestQuoteUserModel');
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(cors({
    origin: ["http://localhost:3001","blumdata.vercel.app", "http://localhost:3000", "blumdata-project.vercel.app", "https://blumdata-project.vercel.app"],
    credentials: true
}))

mongoose.connect(process.env.MongoDb)
    .then(() => console.log("mongodb is connected"))
    .catch(() => console.log("mongodb is not connected"))

const store = new MongoDBStore({
    uri: process.env.MongoDb,
    collection: "session-data"
});

app.set('trust proxy', 1);

app.use(session({
    secret: process.env.SecretKey,
    saveUninitialized: false,
    store: store,
    resave: false,
    cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    }
}))


app.use(registerroute)
app.use(router)
app.use(manageproductadminRoute)
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`server is runing in the ${PORT}`)
})