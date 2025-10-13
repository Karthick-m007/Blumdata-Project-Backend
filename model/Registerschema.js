const mongoose =require('mongoose')

const registerschema= mongoose.Schema({
    register_id:{
        type:Number,
        required:true,
        unique:true
    },
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    }, 
    createdAt: {
        type: Date,
        default: Date.now,
    }
})

const registermodel=mongoose.model('bulmdata-register',registerschema)

module.exports=registermodel