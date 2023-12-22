require("dotenv").config()
const express = require("express");
const router = express.Router();
const app = express();
const session = require('express-session');
const fetch = require('node-fetch').default;
const { verifyTransaction } = require('../utilities/verifyTransactionUtils'); 

const { use } = require("./auth");
const jwt = require("jsonwebtoken");
const uuid = require('crypto').randomBytes(16).toString('hex');
const { ensureAuthenticated} = require('../config/auth');
const { debitPayloadMomo } = require('../utilities/payloadUtils');
const Investor = require('../models/investSchema');
const axios = require('axios');


app.use(session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: false    
  }));
  


router.get("/",  (req,res) => {
    const user = req.user;
    res.render("main/investor/invest",{
        user
    })
})


router.post('/deposit_fund', ensureAuthenticated, async (req,res) => {

    const user = req.user;  
    // const calculatedInvestedData = req.session.calculatedInvestedData;
    const {newMMnumber,investmentAmount,investmentType} = req.body;


    
    
    if(user.isVerified == true  &&  !isNaN(investmentAmount )){
      
      // Calculate interest based on selected investment term
      const interestRate = 0.15;
      // Calculate service fee (assuming a fixed fee of K3.00)
      const serviceFee = 3;
      // Calculate expected returns
      const expectedReturns = investmentAmount * interestRate;
      
      // Calculate total returns
      const totalReturns = parseFloat(investmentAmount) + expectedReturns - serviceFee;
      
      // Calculate and display next payment date (assuming 7 days per week)
      const today = new Date();
      const nextPaymentDate = new Date(today.getTime() +  30 * 24 * 60 * 60 * 1000);
      const maturityDate = nextPaymentDate.toISOString().substr(0, 10);


          try {
      
              

              const { config, encoded_payload } =  debitPayloadMomo(investmentAmount, user.email, user.firstName, user.lastName, newMMnumber, uuid);
      
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
                      
                        // let verifyData = await verifyTransaction(responseData.transactionReference, encoded_payload);
                        res.render("main/investor/invest",{   
                                  user,        
                                  message: `
                                      <h3>${responseData.message}</h3>
                                      <p>please be patient..🙂</p>
                                      <hr>
                                
                                  `,
                                  url: `/invest`,
                                  buttonText:"complete"
                          }); //
                    
      
                              const checkStatus = async () => {
                                if (verifyData.status === 'TXN_AUTH_UNSUCCESSFUL') {
                                  console.log(verifyData.status + ': ' + verifyData.status);
                                  console.log(verifyData);
                                  await Investor.findOneAndDelete({transactionReference: responseData.transactionReference});
                                } else if (verifyData.status === 'TXN_AUTH_SUCCESSFUL') {
                                  console.log(verifyData.status + ': ' + verifyData.status);
                                  console.log(verifyData);
                                  await Investor.findOneAndUpdate({ transactionReference: responseData.transactionReference, isTXNsuccessful: true  })
                                  
                                } else {
                                  verifyTransaction(responseData.transactionReference, encoded_payload).then((newVerifyData) => {
                                    verifyData = newVerifyData;
                                    checkStatus(); // Recursively call checkStatus
                                  });
                                
                                }
                                
                              };
      
                              checkStatus();
      
                        break;
                    case "TXN_FAILED":
                          res.render("main/investor/invest",{   
                            user,        
                            message: `
                                <h3>${responseData.message}</h3>
                                <hr>
                            
                            `,
                            url: `/invest`,
                            buttonText:"back"
                            }); //
                           break;
                    
                    // Add more cases as needed for other statuses
              
                      default:
                        res.render("main/investor/invest",{   
                          user,        
                          message: `
                              <h3>Transaction failed 😞</h3>
                              <hr>
                          
                          <p>${responseData.message}</p>
                          `,
                          url: `/invest`,
                          buttonText:"back"
                          }); //
                        
                      // Handle other cases or do nothing
                  }

                })
                .catch(function (error) {
                  console.log(error.message);
                  res.render("main/investor/invest",{   
                    user,        
                    message: `
                        <h3>Error accessing Payment gate 😞</h3>
                        <hr>
                        <p>Hostname is down, please try again later</p>
                        <i>${error.message}</i>
                    `,
                    url: "/invest",
                    buttonText:"exit"
                }); 
                });
              
          } catch (error) {
              console.error('error saving user details', error);
              res.redirect('/invest')
          }
          

    }else{
      res.render("main/investor/invest",{   
        user,        
        message: `
            <h3>Account is not verified,</h3>
            <hr>
        <h3>please complete registration proceess </h3>
        <hr>
        <p>if registration already complete, please wait patiently for account to be verified </p>
        <p>if verifcation process delays, please feel free to contact- 0976958373🙂</p>
        `,
        url: "/verify",
        buttonText:"exit"
    }); 
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