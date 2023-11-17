const mongoose = require("mongoose");
if(mongoose.connection.models['Mmoney']){
  delete mongoose.connection.models['Mmoney']
}

const mmoneySchema = new mongoose.Schema({
  mtnCash:{
    type: Number,
    required: true,
    default: 0
  },
  airtelCash:{
    type: Number,
    required: true,
    default: 0
  },
  zamtelCash:{
    type: Number,
    required: true,
    default: 0
  },
  mtnAgentNumber:{
    type: String,
    required: true,
    default: '0761111111'
  },
  airtelAgentNumber:{
    type: String,
    required: true,
    default: '0771111111'
  },
  zamtelAgentNumber:{
    type: String,
    required: true,
    default: '0751111111'
  },
  agentName:{
    type: String,
    required: true,
    default: 'Jacob Mwanza'
  }
});


module.exports = mongoose.model("Mmoney", mmoneySchema);