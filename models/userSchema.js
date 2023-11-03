const mongoose = require("mongoose");
if(mongoose.connection.models['User']){
  delete mongoose.connection.models['User']
}

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  image:{
   type: String,
   required: false,
  },
  school: {
    type: String,
    required: false,
  },
  studentNumber: {
    type: Number,
    required: false,
  },
  phoneNumber: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: false,
  },
  createdAt:{
     type: Date,
     required: true,
     default: Date.now
  }
});


module.exports = mongoose.model("User", userSchema);