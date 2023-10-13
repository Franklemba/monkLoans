const mongoose = require("mongoose");
if(mongoose.connection.models['Creditor']){
  delete mongoose.connection.models['Creditor']
}

const creditSchema = new mongoose.Schema({
  creditorEmail: {
    type: String,
    required: true,
  },
  creditorStudentNumber: {
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
  cardNumber: {
    type: String,
    required: false,
  },
  creditStatus:{
    type: Boolean,
    required: true,
  },
  createdAt:{
     type: Date,
     required: true,
     default: Date.now
  }
});


module.exports = mongoose.model("Creditor", creditSchema);