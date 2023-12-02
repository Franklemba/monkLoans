require("dotenv").config()
const express = require("express");
const router = express.Router();
const app = express();
const session = require('express-session');
const fetch = require('node-fetch').default;
const { verifyTransaction } = require('../utilities/verifyTransactionUtils'); 

const { use } = require("./auth");
// const { = require('../config/auth');
const jwt = require("jsonwebtoken");
// const { uuid } = require("uuidv4");
const uuid = require('crypto').randomBytes(16).toString('hex');

const Investor = require('../models/investSchema');
const axios = require('axios');

const SEC_KEY = "477fea6108f74de3a08aac794416046a";
const PUB_KEY = "c8ef713758684420b3e33eedacb3c626";

// merchantPublicKey = "c8ef713758684420b3e33eedacb3c626";
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






router.post("/page", async (req,res) => {
    const user = req.user;
    const {investmentAmount,investmentType}  = req.body;
    

    if (!isNaN(investmentAmount)) {
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

        req.session.calculatedInvestedData = {
            maturityDate,
            totalReturns,
            expectedReturns,
            investmentAmount: parseFloat(investmentAmount),
            serviceFee,
            investmentType
        };
        await res.render("main/investor/investPage",{
            user,
            serviceFee,
            maturityDate,
            totalReturns,
            expectedReturns,
            investmentAmount,
            investmentType
        })
        
      }else{
        redirect("/invest/page")
      }    



})


router.post('/deposit_fund', async (req,res) => {

    const user = req.user;  
    const calculatedInvestedData = req.session.calculatedInvestedData;
    const {newMMnumber} = req.body;

    if(user.isVerified == true){

      try {
  
          // if(calculatedInvestedData){

          const maturityDate = calculatedInvestedData.maturityDate;
          const totalReturns = calculatedInvestedData.totalReturns;
          const expectedReturns = calculatedInvestedData.expectedReturns;
          const investmentAmount = calculatedInvestedData.investmentAmount;
          const serviceFee = calculatedInvestedData.serviceFee;
          const investmentType = calculatedInvestedData.investmentType;
  
        
          payload = {
              amount: `${investmentAmount}`,
              currency: "ZMW",
              customerEmail: `${user.email}`,
              customerFirstName: `${user.firstName}`,
              customerLastName: `${user.lastName}`,
              customerPhone: `${newMMnumber}`,
              merchantPublicKey: PUB_KEY,
              transactionName: "Monk Pay Investment",
              transactionReference: uuid,
              wallet: `${newMMnumber}`,
              returnUrl: `http://localhost:3001?ref=${uuid}`,
              // autoReturn: varValue,
              chargeMe: true,
              };
  
              const encoded_payload = jwt.sign(payload, SEC_KEY);
          
              console.log(encoded_payload);
              // res.send(encoded_payload);
              console.log(newMMnumber)
         
  
          
          var data = JSON.stringify({
            "payload": `${encoded_payload}`
          });
  
          var config = {
            method: 'post',
          maxBodyLength: Infinity,
            url: 'https://live.sparco.io/gateway/api/v1/momo/debit',
            headers: { 
              'X-PUB-KEY': PUB_KEY, 
              'Content-Type': 'application/json'
            },
            data : data
          };
  
  
          axios(config)
            .then(async function (response) {
  
              const responseData = response.data;
              console.log(JSON.stringify(response.data));
  
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
                          investmentStatus: true,
                          transactionReference: responseData.transactionReference,
                          transactionToken: encoded_payload
                      });
  
                      await investor.save();
                  
                    
                    
                    let verifyData = await verifyTransaction(responseData.transactionReference, encoded_payload);
                    res.render("main/investor/invest",{   
                              user,        
                              message: `
                                  <p>🎉transaction for debiting your mmoney account, will appear on your phone soon 🎉</p>
                                  <p>please be patient, </p>
                                  <hr>
                              
                              <h3>please wait for transaction</h3>
                              `,
                              url: `/invest/verify/${responseData.transactionReference}/${encoded_payload}`,
                              buttonText:"verify"
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
                        <h3>Transaction failed 😞</h3>
                        <hr>
                    
                    <p>please make sure the number you are using is valid</p>
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
                    
                    <p>please make sure the number you are using is valid</p>
                    `,
                    url: `/invest`,
                    buttonText:"back"
                    }); //
                    
                  // Handle other cases or do nothing
              }
  
            })
            .catch(function (error) {
              console.log(error);
              res.redirect('/invest')
              // console.log('')
            });
  
  
  
          
      } catch (error) {
          console.error('error saving user details', error);
          res.redirect('/invest');
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


// ---------------------------TXN verification route
router.get('/verify/:mechRef/:token', async (req, res) => {
  const token = req.params.token;
  const mechRef = req.params.mechRef;
  const user = req.user;

  
  
  let verifyData = await verifyTransaction(mechRef, token);
  
  const checkStatus = async () => {
    
    if (verifyData.status === 'TXN_AUTH_UNSUCCESSFUL') {
      console.log(verifyData.status + ': ' + verifyData.status);
      res.render("main/investor/invest",{   
        user,        
        message: `
        <h3>Transaction was unsuccessful 😞</h3>
        `,
        url: `/invest`,
        buttonText:"exit"
      });

      try {
        await Investor.findOneAndDelete({transactionReference: mechRef});
      } catch (error) {
        console.log('Error deleting record: ', error)
      }
      console.log(verifyData);


    } else if (verifyData.status === 'TXN_AUTH_SUCCESSFUL') {
      console.log(verifyData.status + ': ' + verifyData.status);
      res.render("main/investor/invest",{   
        user,        
        message: `
        <h3>Transaction was Successful 😀</h3>
        <br>
        <p>Thank for investing with us🎉</p>
        `,
        url: `/invest`,
        buttonText:"exit"
       });

       try {
        await Investor.findOneAndUpdate({ transactionReference: mechRef, isTXNsuccessful: true  })
      } catch (error) {
        console.log('Error updating record: ', error)
      }
      console.log(verifyData);


    } else {
      console.log(verifyData.status + ': ' + verifyData.status);
      verifyTransaction(mechRef, token).then((newVerifyData) => {
        verifyData = newVerifyData;
        checkStatus(); // Recursively call checkStatus
      });

    }
  };

     checkStatus(); // Initial call to checkStatus
});

// ---------------------------Debit dashboard route
router.get('/dashboard', async (req,res) => {
    const user = req.user;  
    const invest = await Investor.find({key: user._id, investmentStatus: true });
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