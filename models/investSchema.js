const mongoose = require("mongoose");
if(mongoose.connection.models['Investor']){
  delete mongoose.connection.models['Investor']
}

const investSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
  },
  investmentAmount: {
    type: Number,
    required: true,
  },
  investmentType:{
    type: String,
    required: true,
  },        // newly include, will compromise of the type of investment user has chosen
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
  isTXNsuccessful:{
    type: Boolean,
    required: true,
    default: false
  },
  isInvestmentPaidOff:{
      type: Boolean,
      required: false,
      default: false
  },
  transactionReference:{
    type: String,
    required: false,
  },
  token:{
    type:String,
    required: false
  },
  createdAt:{
     type: Date,
     required: true,
     default: Date.now
  }
});


module.exports = mongoose.model("Investor", investSchema);