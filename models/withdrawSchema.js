const mongoose = require("mongoose");
if(mongoose.connection.models['Withdraw']){
  delete mongoose.connection.models['Withdraw']
}

const withdrawSchema = new mongoose.Schema({
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
  amountWithdrawn: {
    type: Number,
    required: true,
  },
  txnID: {
    type: String,
    required: true,
  },
  createdAt:{
     type: Date,
     required: true,
     default: Date.now
  }
});


module.exports = mongoose.model("Withdraw", withdrawSchema);