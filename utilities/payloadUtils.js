
const jwt = require("jsonwebtoken");

const debitPayloadMomo = (amount, email, firstName, lastName, walletNumber) =>{
  
  let uuid = require('crypto').randomBytes(16).toString('hex');

    payload = {
        amount: `${amount}`,
        currency: "ZMW",
        customerEmail: `${email}`,
        customerFirstName: `${firstName}`,
        customerLastName: `${lastName}`,
        customerPhone: `${walletNumber}`,
        merchantPublicKey: process.env.PUB_KEY,
        transactionName: "Tayantpay Limited",
        transactionReference: uuid,
        wallet: `${walletNumber}`,
        returnUrl: `http://localhost:3000?ref=${uuid}`,
        // autoReturn: varValue,
        chargeMe: true,
        };

        const encoded_payload = jwt.sign(payload, process.env.SEC_KEY);
    
        console.log(encoded_payload);
        
        var data = JSON.stringify({
          "payload": `${encoded_payload}`
        });

      var config = {
        method: 'post',
        maxBodyLength: Infinity,
          url: 'https://live.broadpay.io/gateway/api/v1/momo/debit',
          headers: { 
            'X-PUB-KEY': process.env.PUB_KEY, 
            'Content-Type': 'application/json'
          },
          data : data
        };

        return { config, encoded_payload };
}




const debitPayloadBank = (amount, firstName, lastName, email, phoneNumber ) =>{

  let uuid = require('crypto').randomBytes(16).toString('hex');
   
    var data = JSON.stringify({
        "transactionName": "Tayantpay Limited",
        "amount": amount,
        "currency": "ZMW",
        "transactionReference": uuid,
        "customerFirstName": `${firstName}`,
        "customerLastName": `${lastName}`,
        "customerEmail": `${email}`,
        "customerPhone": `${phoneNumber}`,
        "merchantPublicKey": process.env.PUB_KEY
      });

      const encoded_payload = jwt.sign(data, process.env.SEC_KEY);
      
      var config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://checkout.broadpay.io/gateway/api/v1/checkout',
        headers: { 
          'Content-Type': 'application/json'
        },
        data : data
      };

      return { config, encoded_payload, uuid };
      
}



module.exports = { debitPayloadMomo, debitPayloadBank };