const mongoose = require("mongoose");
if(mongoose.connection.models['MmService']){
  delete mongoose.connection.models['MmService']
}

const mmServiceSchema = new mongoose.Schema({
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
  transactionAmount: {
    type: Number,
    required: true,
  },
  serviceType: {
    type: String,
    required: true,
  },
  txnID: {
    type: String,
    required: false,
  },
  createdAt:{
     type: Date,
     required: true,
     default: Date.now
  }
});


module.exports = mongoose.model("MmService", mmServiceSchema);