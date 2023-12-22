const { verifyTransaction } = require('../utilities/verifyTransactionUtils'); 
const Investor = require('../models/investSchema');
const Creditor = require('../models/creditSchema');

const updatePendingInvestmentsTXN = async (key) =>{


    const updateInvestments = await Investor.find({
        key : key,
        isTXNsuccessful: false,
      }) 

  
    try{

        updateInvestments.forEach( async (investment) =>{

            let verifyData = await verifyTransaction(investment.transactionReference, investment.token);
            let duration = calculateHoursPast(new Date(investment.createdAt));
            if (verifyData.status === 'TXN_AUTH_SUCCESSFUL') {
                console.log(verifyData.status);
                console.log(verifyData);
                try{

                    await Investor.findOneAndUpdate(
                        { transactionReference: investment.transactionReference, isTXNsuccessful: false },
                        { $set: { isTXNsuccessful: true } }
                      );
                }catch(error){
                    console.log(error.message);
                    throw new Error(error)
                }
                
            } else{

                if(duration > 2){     // deletes pending transaction if it's lasted for more than 2 hours 
                           try{

                               await Investor.findOneAndDelete({transactionReference: investment.transactionReference}); 
                           }catch(error){
                               console.log(error.message);
                               throw new Error(error);
                           }
                }
            }
                
         })
    }catch(error){
        console.log('Pending_Investment_Update_error: ' +error.message);
    }

}

const updatePendingCreditsRepaymentTxn = async (key) =>{      //am still working on this, a proper plan iss not yet set in place...... so here is the plan .. when a repayment transaction is recived, it is stored in an array


    const updateCredits = await Creditor.find({
        key : key,
        isTXNsuccessful: false,
        isPaid: false,
        isApproved: true,
      }) 

      updateCredits.forEach( async (credit) =>{
        let verifyData = await verifyTransaction(credit.transactionReference, credit.token);
        // let duration = calculateHoursPast(new Date(credit.createdAt));

          if (verifyData.status === 'TXN_AUTH_SUCCESSFUL') {

                  console.log(verifyData.status + ': ' + verifyData.status);
                  console.log(verifyData);
              //------------------ update credit in database
              await Creditor.findOneAndUpdate(
                { transactionReference: credit.transactionReference, isTXNsuccessful: false, isPaid: false  },
                { $set: { isTXNsuccessful: true, isPaid: true  } }
              );
                
              
            } 
          
      })

}


function calculateHoursPast(pastDate) {
    const currentDate = new Date();
    const timeDifference = currentDate - pastDate;
    const hoursPast = Math.floor(timeDifference / (1000 * 60 * 60));
    return hoursPast;
  }


module.exports = { updatePendingInvestmentsTXN, updatePendingCreditsRepaymentTxn};