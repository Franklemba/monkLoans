const mongoose = require("mongoose");
if(mongoose.connection.models['Deposit']){
  delete mongoose.connection.models['Deposit']
}

const depositSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  studentNumber: {
    type: String,
    required: true,
  },
  recipientName: {
    type: String,
    required: true,
  },
  recipientNumber: {
    type: String,
    required: true,
  },
  agentService:{
    type: String,
    required: true,
 },
  location: {
    type: String,
    required: true,
  },
  depositAmount: {
    type: Number,
    required: true,
  },
  createdAt:{
     type: Date,
     required: true,
     default: Date.now
  }
});


module.exports = mongoose.model("Withdraw", depositSchema);