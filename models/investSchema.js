const mongoose = require("mongoose");
if(mongoose.connection.models['Investor']){
  delete mongoose.connection.models['Investor']
}

const investSchema = new mongoose.Schema({
  investorEmail: {
    type: String,
    required: true,
  },
  investorStudentNumber: {
    type: String,
    required: true,
  },
  investmentAmount: {
    type: Number,
    required: true,
  },
  investmentTerm: {
    type: Number,
    required: true,
  },
  serviceFee: {
    type: Number,
    required: true,
  },
  expectedReturns: {
    type: Number,
    required: true,
  },
  totalReturns: {
    type: Number,
    required: true,
  },
  maturityDate: {
    type: String,
    required: true,
  },
  bankAccount: {
    type: String,
    required: false,
  },
  createdAt:{
     type: Date,
     required: true,
     default: Date.now
  }
});


module.exports = mongoose.model("Investor", investSchema);