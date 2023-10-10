const mongoose = require("mongoose");
if(mongoose.connection.models['User']){
  delete mongoose.connection.models['User']
}

const UserSchema = new mongoose.Schema({
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
  nrc: {
    type: String,
    required: true,
  },
  school: {
    type: String,
    required: true,
  },
  student_number: {
    type: number,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  registration_link: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt:{
     type: Date,
     required: true,
     default: Date.now
  }
});


module.exports = mongoose.model("User", UserSchema);