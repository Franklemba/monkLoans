const mongoose = require("mongoose");
if(mongoose.connection.models['Creditor']){
  delete mongoose.connection.models['Creditor']
}

const creditSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
  },
  loanAmount: {
    type: Number,
    required: true,
  },
  loanTerm: {
    type: Number,
    required: true,
  },
  serviceFee: {
    type: Number,
    required: true,
  },
  amountReceived: {
    type: Number,
    required: true,
  },
  repaymentAmount: {
    type: Number,
    required: true,
  },
  nextPaymentDate: {
    type: String,
    required: false,
  },
  location:{
    type: String,
    required: true
  },
  roomMatePhoneNumber:{
    type: String,
    required: true
  },
  itemDescription:{
    type: String,
    required: true
  },
  otherPhoneNumber:{
    type: String,
    required: false
  },
  penaltyFee:{
    type: Number,
    required: false,
    default: 0
  },
  isPaid:{
    type: Boolean,
    required: true,
    default: false
  },
  loanRepayIds: {
    type: [String], // This specifies that it's an array of strings
    required: false, // Change to true if you want to make it required
    default: [], // Default value is an empty array
  },
  isApproved: {
     type: Boolean,
     required: true,
     default: false,
  },
  createdAt:{
     type: Date,
     required: true,
     default: Date.now
  }
});


module.exports = mongoose.model("Creditor", creditSchema);