const mongoose = require("mongoose");
if(mongoose.connection.models['Profile']){
  delete mongoose.connection.models['Profile']
}

const profileSchema = new mongoose.Schema({

  key: {
    type: String,
    required: true,
  },
  totalInvestedAmount: {
    type: Number,
    required: false,
  },
  totalCreditedAmount: {
    type: Number,
    required: false,
  },
  totalMaturedInvestments: {
    type: Number,
    required: false,
  },
  total_No_Of_Investments: {
    type: Number,
    required: false,
  },
  total_No_Of_Credits: {
    type: Number,
    required: false,
  },
  total_No_Of_CreditsPayed: {
    type: Number,
    required: false,
  },
  total_No_Of_CreditsUnPayed: {
    type: Number,
    required: false,
  },
  totalRevenue:{
    type: Number,
    required: false,
    default: 0
  },
  createdAt:{
     type: Date,
     required: false,
     default: Date.now
  }
  
});


module.exports = mongoose.model("Profile", profileSchema);