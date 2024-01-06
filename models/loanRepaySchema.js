const mongoose = require("mongoose");
if(mongoose.connection.models['LoanRepay']){
  delete mongoose.connection.models['LoanRepay']
}

const loanRepaySchema = new mongoose.Schema({
  userKey: {
    type: String,
    required: true,
  },
  loanKey: {
    type: String,
    required: true
  },
  transactionReference: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  isTxnSuccessful: {
    type: Boolean,
    required: true,
    default: false
  },
  createdAt:{
     type: Date,
     required: true,
     default: Date.now
  }
});


module.exports = mongoose.model("LoanRepay", loanRepaySchema);