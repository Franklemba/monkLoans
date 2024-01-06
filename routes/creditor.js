require("dotenv").config()
const express = require("express");
const router = express.Router();
const app = express();
const session = require('express-session');

const { use } = require("./auth");
const { ensureAuthenticated} = require('../config/auth');
const Creditor = require('../models/creditSchema');
const Investor = require('../models/investSchema');
const LoanRepay = require('../models/loanRepaySchema');
const { debitPayloadMomo } = require('../utilities/payloadUtils');
const { updatePendingInvestmentsTXN, updatePendingCreditsRepaymentTxn } = require('../utilities/verifyTxnUtils')

const axios = require('axios');

app.use(session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: false    
}));

router.get("/" , async (req,res) => {
        const user = req.user;
        
        const message = req.query.message;

        if(typeof user !== 'undefined' && user !== null){
            
            const totalPendingTransactions = await Investor.countDocuments({key: user._id ,isTXNsuccessful: false, isInvestmentPaidOff: false })
    
            if(totalPendingTransactions > 0 ){
               updatePendingInvestmentsTXN(user._id);
            }
            
            const creditor = await Creditor.findOne({
                key: user._id,
                isApproved: true,
                isPaid : false
            })

            if( creditor ){   //check if user has a pending loan
                try {
                    const totalPendingRepayTxn = await LoanRepay.find({
                        loanKey: creditor._id,
                        isTXNsuccessful: false
                    });
                    // Your code to handle totalPendingTransactions goes here
                    

                    if (totalPendingRepayTxn){   //if any pending payment transactions, update them

                        totalPendingRepayTxn.forEach(async (repaymentAttempt)=>{
                            if(!creditor.loanRepayIds.includes(repaymentAttempt._id)){
                                await updatePendingCreditsRepaymentTxn(user._id);     // update pending transactions
                            }
                        })

                      }
                        // ___________________ checks for clients that haven't paid their due credits on time

                        const pastDate = calculateDaysPast(new Date(creditor.nextPaymentDate))
                        if(pastDate > 0){

                            console.log('past days: '+pastDate)
                            const penaltyFee = ((creditor.loanAmount * 0.01) * pastDate).toFixed(2);

                                    await Creditor.findOneAndUpdate(
                                        { _id: creditor._id },
                                        { $set: { 
                                           penaltyFee: penaltyFee
                                        }},
                                        { new: true } // Returns the updated document
                                    );
                        }

                } catch (error) {
                    console.error("Error while counting pending transactions:", error);
                    // Handle the error or throw it again if necessary
                    throw error;
                }

            }
      }
      
    res.render("main/creditor/credit",{
        user,
        message: message !=  undefined
        ? `${base64Decode(message)}`
        : null ,
        url:  message !=  undefined
          ? '/credit/dashboard': null ,
        buttonText:"Done"
    })
});

router.post("/page", ensureAuthenticated, async (req,res) => {
    const user = req.user;
    const credit = await Creditor.find({key:user._id, isPaid: false ,isApproved: true});
    const unapprovedCredit = await Creditor.find({ key: user._id, isPaid: false, isApproved: false });
    let message;

    if(credit.length > 0){

        message = `
                <h3>You're ineligible to get a loan 😒</h3>
                <h3>repay balance of K ${credit[0].repaymentAmount} first</h3>
        `;
    
    }else if(unapprovedCredit.length > 0){
        message = `
                <h3>you have unapproved loan of K ${unapprovedCredit[0].repaymentAmount}</h3>
                <h3>wait for approval 🙂</h3>
        `;
 
    }else{

        const { loanAmount,loanTerm, campusLocation, bhLocation, roomMatePhoneNumber, collateralItem, otherPhoneNumber} = req.body;
        const interestRates = {
            1: 0.1, // 5% for a 1-week term
            2: 0.2, // 6% for a 2-week term
            3: 0.3, // 7% for a 3-week term
            4: 0.35, // 8% for a 4-week term
        };

      if (!isNaN(loanAmount) && !isNaN(loanTerm) && loanAmount > 0 && loanAmount < 500) {
        // Calculate interest based on selected loan term
        const interestRate = interestRates[loanTerm];

        // Calculate service fee (assuming a fixed fee of K5.00)
        const serviceFee = 5;
        
        // Calculate total repayment amount
        const interestAmount = loanAmount * interestRate;
        const totalRepayment = parseFloat(loanAmount) + interestAmount + serviceFee;

        const today = new Date();
        const nextPaymentDate = new Date(today.getTime() + loanTerm * 7 * 24 * 60 * 60 * 1000);
        const repaymentDate = nextPaymentDate.toISOString().substr(0, 10);
        const amountReceived = (loanAmount - serviceFee).toFixed(2);
    

        if(user.isVerified == true){

            try {
                // ___________SAVING CREDITORS DETAILS __________//
            
                    const creditor = new Creditor({ 
                        key: user._id,
                        loanAmount, 
                        loanTerm ,
                        serviceFee,
                        amountReceived,
                        repaymentAmount:totalRepayment,
                        nextPaymentDate:repaymentDate,
                        location: campusLocation +''+bhLocation,
                        roomMatePhoneNumber,
                        itemDescription : collateralItem,
                        otherPhoneNumber
                      });
                     
                     await creditor.save();
                    // render page to inform user that account has been successfuly approved
                    message = `
                        <h3> Loan Approval is pending </h3>
                        <hr>
                        <h3>an agent will attend to you shortly🙂</h3>
                        <hr>
                        <h3>thank for using our service 🤝</h3>
                    `
                    
            } catch (error) {
                console.error('error verifying credit card', error);
                res.redirect('/credit');
            }
    
        }else{
            message = `
                <h3>Account is not verified,</h3>
                <hr>
                <h3>please complete registration proceess </h3>
                <hr>
                <p>if registration already complete, please wait patiently for account to be verified </p>
                <p>if verifcation process delays, please feel free to contact- 0976958373🙂</p>
            `;
            
        }
      }
    }

    res.redirect(`/credit?message=${encodeURIComponent(base64Encode(message))}`);
});


router.get('/dashboard', ensureAuthenticated, async (req,res) => {
     const user = req.user;
     const credit = await Creditor.findOne({key: user._id, isPaid: false, isApproved: true});
     let creditRepayTransactions;
     if(credit){
         creditRepayTransactions = await LoanRepay.find({ loanKey: credit._id})
         console.log(creditRepayTransactions);
         const totalPendingRepayTxn = await LoanRepay.find({
            loanKey: credit._id,
            isTXNsuccessful: false
        });
        // Your code to handle totalPendingTransactions goes here
        

        if (totalPendingRepayTxn){   //if any pending payment transactions, update them

            totalPendingRepayTxn.forEach(async (repaymentAttempt) => {
                if (!credit.loanRepayIds.includes(repaymentAttempt._id)) {
                  await updatePendingCreditsRepaymentTxn(user._id);
                }
              });              

          }
     }
     const repayedLoan = await Creditor.find({ key: user._id, isPaid: true, isApproved: true })
     .sort({ createdAt: -1 });
     const allCreditRepayTransactions = await LoanRepay.find({ userKey: user._id})


     res.render("main/creditor/creditDashboard", {
        user,
        credit,
        repayedLoan,
        creditRepayTransactions,
        allCreditRepayTransactions
     })
})

router.post('/repayment', ensureAuthenticated, async (req,res) => {
    
    const user = req.user;
    const { newMMnumber, repayLoan } = req.body;

    const credit = await Creditor.findOne({key: user._id, isPaid: false })
    let message;

  const { config, encoded_payload } =  debitPayloadMomo( repayLoan, user.email, user.firstName, user.lastName, newMMnumber);
          axios(config)
          .then(async function (response) {

            const responseData = response.data;
            console.log(response.data);

            switch (responseData.status) {
                case "TXN_AUTH_PENDING":

                const creditRepay = new LoanRepay({
                    userKey: user._id,
                    loanKey: credit._id,
                    transactionReference: responseData.transactionReference,
                    token: encoded_payload,
                    amount: repayLoan
                  });
                  
                  creditRepay.save()
                    .then(() => {
                        console.log("loan repayment transaction saved successfully");
                    })
                    .catch((err) => {
                        console.error(err);
                    });
                    message = `
                            <h3>${responseData.message}</h3>
                            <i>please be patient..🙂, </i>
                            <hr>
                    `;

                break;
              case "TXN_FAILED":
                message = `
                        <h3>TXN FAILED: <i> ${responseData.message}</i></h3>
                        <hr>
                `;
               
                break;
        
              default:
                message = `
                    <h3> An error ocurred: <i>${responseData.message}</i></h3> 
                `;
                
            }

            res.redirect(`/credit?message=${encodeURIComponent(base64Encode(message))}`);

          })
          .catch(function (error) {
            console.log(error.message);
            message = `
                <h3><i>${error.message}</i></h3>
                <hr>
                <p>
                    Error connecting to payment gateway
                </p>
            `;
            
            res.redirect(`/credit?message=${encodeURIComponent(base64Encode(message))}`);

          });
   
})


function calculateDaysPast(pastDate) {

    const currentDate = new Date();
    const timeDifference = currentDate - pastDate;
    const daysPast = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    return daysPast;

  }
  
module.exports = router;


const base64Decode = (data) => {
    return Buffer.from(data, 'base64').toString('utf-8');
  };
  
  const base64Encode = (data) => {
    return Buffer.from(data).toString('base64');
  };