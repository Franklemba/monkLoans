const mongoose = require("mongoose");
if(mongoose.connection.models['Mmoney']){
  delete mongoose.connection.models['Mmoney']
}

const mmoneySchema = new mongoose.Schema({
  mtnCashAvailable: {
    type: Number,
    required: true,
  },
  airtelCashAvailable: {
    type: Number,
    required: true,
  },
  agentName: {
    type: String,
    required: true,
  },
  mtnAgentNumber: {
    type: Number,
    required: true,
  },
  airtelAgentNumber: {
    type: Number,
    required: true,
  },
  createdAt:{
     type: Date,
     required: true,
     default: Date.now
  }
});


module.exports = mongoose.model("Mmoney", mmoneySchema);