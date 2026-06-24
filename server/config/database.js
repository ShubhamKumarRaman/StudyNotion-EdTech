const mongoose = require('mongoose');
require('dotenv').config();

exports.connect = async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB connected successfully.");
    }catch(error){
        console.error(error);
        process.exit(1);
    }
}