require("dotenv").config()
const express = require("express");
const router = express.Router();
const app = express();
const session = require('express-session');
const fetch = require('node-fetch').default;
const { verifyTransaction } = require('../utilities/verifyTransactionUtils'); 
const { updatePendingInvestmentsTXN, updatePendingCreditsRepaymentTxn } = require('../utilities/verifyTxnUtils')


const { ensureAuthenticated} = require('../config/auth');
const { debitPayloadMomo } = require('../utilities/payloadUtils');
const Investor = require('../models/investSchema');
const axios = require('axios');


app.use(session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: false    
  }));
  
router.get("/", async (req,res) => {
    const user = req.user;
    const message = req.query.message;
    const totalPendingTransactions = await Investor.countDocuments({key: user._id,isTXNsuccessful: false, isInvestmentPaidOff: false })
    if(totalPendingTransactions > 0 ){
      updatePendingInvestmentsTXN(user._id);
    }
    res.render("main/investor/invest",{
        user,
        message: message !=  undefined
        ? `<h3>${base64Decode(message)}</h3><hr>`
        : null ,
        url:  message !=  undefined
          ? '/invest/dashboard': null ,
        buttonText:"Complete"
    })
})


router.post('/deposit_fund', ensureAuthenticated, async (req,res) => {

    const user = req.user;  
    // const calculatedInvestedData = req.session.calculatedInvestedData;
    const {newMMnumber,investmentAmount,investmentType} = req.body;

    if(user.isVerified == true  &&  !isNaN(investmentAmount )){
      
      // Calculate interest based on selected investment term
      const interestRate = 0.10;
      // Calculate service fee (assuming a fixed fee of K3.00)
      const serviceFee = 5;
      // Calculate expected returns
      const expectedReturns = (investmentAmount - serviceFee ) * interestRate;
      
      // Calculate total returns
      const totalReturns = parseFloat(investmentAmount - serviceFee) + expectedReturns;
      
      // Calculate and display next payment date (assuming 7 days per week)
      const today = new Date();
      const nextPaymentDate = new Date(today.getTime() +  30 * 24 * 60 * 60 * 1000);
      const maturityDate = nextPaymentDate.toISOString().substr(0, 10);


          try {

              const { config, encoded_payload } =  debitPayloadMomo(investmentAmount, user.email, user.firstName, user.lastName, newMMnumber);
      
              axios(config)
                .then(async function (response) {
      
                  const responseData = response.data;
                  console.log(response.data);

                  switch (responseData.status) {
                      case "TXN_AUTH_PENDING":
                        // ___________SAVING INVESTOR'S DETAILS __________//
                        const investor = new Investor({
                          key: user._id,
                          investmentAmount,
                          serviceFee,
                          expectedReturns,
                          totalReturns,
                          maturityDate,
                          investmentType,
                          transactionReference: responseData.transactionReference,
                          transactionToken: encoded_payload
                      });
      
                          await investor.save();
                          res.redirect(`/invest?message=${encodeURIComponent(base64Encode(responseData.message))}`);
      
                        break;
              
                      default:
                        res.redirect(`/invest?message=${encodeURIComponent(base64Encode(responseData.message))}`);

                  }

                })
                .catch(function (error) {
                  console.log(error.message);
                  res.redirect(`/invest?message=${encodeURIComponent(base64Encode(error.message))}`);
                
                });
              
          } catch (error) {
              console.error('error saving user details', error);
              res.redirect('/invest')
          }
          

    }else{

      const responseMessage = `
            <h3>Account is not verified,</h3>
            <hr>
            <h3>please complete registration proceess </h3>
            <hr>
            <p>if registration already complete, please wait patiently for account to be verified </p>
            <p>if verifcation process delays, please feel free to contact- 0976958373🙂</p>
            `;
            res.redirect(`/invest?message=${encodeURIComponent(base64Encode(responseMessage))}`);
   
    }
    
})

// ---------------------------Debit dashboard route
router.get('/dashboard', ensureAuthenticated, async (req,res) => {
    const user = req.user;  
    const invest = await Investor.find({key: user._id, investmentStatus: true }).sort({ createdAt: -1 });
    const maturedInvestment = await Investor.find({key: user._id, investmentStatus: false });
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];

    console.log(formattedDate); // Output: "2023-10-23"
    console.log(maturedInvestment)
    //  function to update all investments  

    updateInvestors(user, formattedDate);

    res.render("main/investor/investDashboard", {
       user,
       invest,
       maturedInvestment
    })
})


// --------------------------Update investors function
const updateInvestors = async (user, formattedDate ) => {

    const investors = await Investor.find({
        key: user._id,
        investmentStatus: true,
        maturityDate: { $eq: formattedDate }
    });

    if (investors.length > 0) {
        const updatePromises = investors.map(investor => {
            return Investor.findOneAndUpdate(
                { _id: investor._id },
                {
                    investmentStatus: false,
                },
                { new: true }
            );
        });

        const updatedInvestors = await Promise.all(updatePromises);
        console.log(`${updatedInvestors.length} investors updated successfully.`);
        console.log(updatePromises)
    } else {
        console.log('No investors found for the specified date.');
    }
};



module.exports = router;



const base64Decode = (data) => {
  return Buffer.from(data, 'base64').toString('utf-8');
};

const base64Encode = (data) => {
  return Buffer.from(data).toString('base64');
};