const mongoose = require("mongoose");
if(mongoose.connection.models['MmService']){
  delete mongoose.connection.models['MmService']
}

const mmServiceSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true
  },
  agentService: {
    type: String,
    required: true,
  },
  serviceType: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  isProcessed:{
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


module.exports = mongoose.model("MmService", mmServiceSchema);