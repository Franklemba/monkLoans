// transactionUtils.js

const fetch = require('node-fetch');

const verifyTransaction = async (merchantReference, token) => {
  const apiUrl = `https://live.broadpay.io/gateway/api/v1/transaction/query?merchantReference=${merchantReference}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'token': token,
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.log('Transaction_Verification_Error: ' + error.message);
    throw error;
    
  }
};

module.exports = { verifyTransaction };
