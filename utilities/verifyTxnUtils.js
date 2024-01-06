const { verifyTransaction } = require('../utilities/verifyTransactionUtils'); 
const Investor = require('../models/investSchema');
const Creditor = require('../models/creditSchema');
const LoanRepay = require('../models/loanRepaySchema');

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
        console.log('Pending_Investment_Update_error: ' + error.message);
    }
}

const updatePendingCreditsRepaymentTxn = async (key) =>{      

    console.log('updating creditRepayTransactions function called');
    
    const loan = await Creditor.findOne({
        key : key,
        isPaid: false,
        isApproved: true,
      }) 

      const creditRepayTransactions = await LoanRepay.find({ loanKey: loan._id })
      const totalAmount = loan.repaymentAmount + loan.penaltyFee;

      creditRepayTransactions.forEach( async (transaction) =>{
        let verifyData = await verifyTransaction(transaction.transactionReference, transaction.token);
        let duration = calculateHoursPast(new Date(transaction.createdAt));

        console.log('Duration: ' +duration )

          if (verifyData.status === 'TXN_AUTH_SUCCESSFUL') {

                  console.log(verifyData);
              //------------------ update credit in database
              if(totalAmount > transaction.amount && !loan.loanRepayIds.includes(transaction._id)){

                const newLoanAmount = totalAmount - transaction.amount;
                console.log('new loan Amount: '+newLoanAmount);

                
                await Creditor.findOneAndUpdate(
                    { key: key, isPaid: false },
                    {
                      $set: {
                        repaymentAmount: newLoanAmount,
                        penaltyFee: 0,
                      },
                      $push: {
                        loanRepayIds: transaction._id,
                      },
                    }
                  );

                  
                }else if( totalAmount <= transaction.amount && !loan.loanRepayIds.includes(transaction._id)){
                    await Creditor.findOneAndUpdate(
                        { key: key, isPaid: false },
                        { 
                            $set: { isPaid: true },
                            $push: {
                                loanRepayIds: transaction._id,
                              },
                        }
                        );
                        
                }

                    await LoanRepay.findOneAndUpdate(
                      { transactionReference: transaction.transactionReference, isTxnSuccessful: false },
                      { $set: { isTxnSuccessful: true }}
                    );
                
          }else{
                if(duration > 2){
                    try{
                        await LoanRepay.findOneAndDelete({ transactionReference: transaction.transactionReference, isTXNsuccessful: false });
                        // Do something after deletion
                        console.log('Status: '+verifyData.status+ ' Duration:' +duration )
                        console.log('Deleted Transaction with TransactionReference: '+transaction.transactionReference);
                    }catch(err){
                        console.log('Error deleting loan repay transaction: '+err)
                    }
                }
          }

          
      })

}


function calculateHoursPast(pastDate) {
    const currentDate = new Date();
    const timeDifference = currentDate - pastDate;
    const hoursPast = Math.floor(timeDifference / (1000 * 60 * 60));
    return hoursPast;
}


module.exports = { updatePendingInvestmentsTXN, updatePendingCreditsRepaymentTxn };