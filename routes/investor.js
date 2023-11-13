require("dotenv").config()
const express = require("express");
const router = express.Router();
const app = express();
const session = require('express-session');
const fetch = require('node-fetch').default;


const { use } = require("./auth");
// const { = require('../config/auth');
const jwt = require("jsonwebtoken");
// const { uuid } = require("uuidv4");
const uuid = require('crypto').randomBytes(16).toString('hex');
const Investor = require('../models/investSchema');
const axios = require('axios');

const SEC_KEY = "477fea6108f74de3a08aac794416046a";
const PUB_KEY = "c8ef713758684420b3e33eedacb3c626";

merchantPublicKey = "c8ef713758684420b3e33eedacb3c626";
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
    try {


        // if(calculatedInvestedData){

            // const maturityDate = calculatedInvestedData.maturityDate;
            // const totalReturns = calculatedInvestedData.totalReturns;
            // const expectedReturns = calculatedInvestedData.expectedReturns;
            const investmentAmount = calculatedInvestedData.investmentAmount;
            // const serviceFee = calculatedInvestedData.serviceFee;
            // const investmentType = calculatedInvestedData.investmentType;

        //     // ___________SAVING INVESTOR'S DETAILS __________//

        //     const investor = new Investor({
        //         investorEmail: user.email,
        //         investorStudentNumber: user.studentNumber,
        //         investmentAmount,
        //         serviceFee,
        //         expectedReturns,
        //         totalReturns,
        //         maturityDate,
        //         investmentType,
        //         investmentStatus: true
        //     });

        //     await investor.save();
        
            
        //     // render page once investment has been approved
        //     res.render("main/investor/invest",{   
        //         user,        
        //         message: `
        //             <h3>🎉Investment successfully done 🎉</h3>
        //             <hr>
                
        //         <h3>thank for using our service 🤝</h3>
        //         `,
        //         url: "/invest/dashboard",
        //         buttonText:"exit"
        //         }); //

        // }else{
        //     res.render("main/investor/invest",{   
        //         user,        
        //         message: `
        //             <h3>🎉 investment was unsuccesful</h3>
        //         <h3>make sure, to enter the correct credentials</h3>
        //         <h3>hard luck!</h3>
        //         `,
        //         url: "/invest",
        //         buttonText:"exit"
        //         }); 
        // }

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
                  
                  
                  res.render("main/investor/invest",{   
                            user,        
                            message: `
                                <p>🎉transaction for debiting your mmoney account, will appear on your phone soon 🎉</p>
                                <hr>
                            
                            <h3>!!click verify  after comfirming transaction to save record!!</h3>
                            `,
                            url: `/invest/verify/${responseData.transactionReference}/${encoded_payload}`,
                            buttonText:"verify"
                    }); //
               

                break;
              case "TXN_FAILED":
                res.send('TXN_FAILED');
                break;
               
              // Add more cases as needed for other statuses
        
              default:
                res.redirect('/invest')
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
})


router.get('/verify/:mechRef/:token', async (req, res) =>{
  const token = req.params.token
  const mechRef = req.params.mechRef
  // const mechRef = '90a8c130f348fed5ad37cd07c0f1accb';
  const verifyData = await verifyTransaction(mechRef, token);
  setTimeout(() => {
    if (verifyData.status === 'TXN_AUTH_UNSUCCESSFUL') {
      res.send('<h2>Transaction was unsuccessful</h2>');
    } else if (verifyData.status === 'TXN_AUTH_SUCCESSFUL') {
      res.send('Transaction was successful');
    } else {
      res.send('<h2>you will receive transactions status via email shortly</h2>');
    }
    console.log(verifyData);
  }, 120000); 
})


router.get('/dashboard', async (req,res) => {
    const user = req.user;  
    const invest = await Investor.find({investorEmail:user.email, investmentStatus: true });
    const maturedInvestment = await Investor.find({investorEmail:user.email, investmentStatus: false });
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


const updateInvestors = async (user, formattedDate ) => {

    const investors = await Investor.find({
        investorEmail: user.email,
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



// sparco payments functions


// ---------------------------------------------------------------------------------------
  //  const requestPay = async (transactionName, amount, currency, customerFirstName, customerLastName, customerEmail, customerPhone,customerMobileWallet) => {
  //   // UUID ID generator
    

  //   const varValue = true;

  //   const apiUrl = 'https://checkout.sparco.io/gateway/api/v1/checkout';

  //   const requestBody = {
  //     transactionName,
  //     amount,
  //     currency,
  //     transactionReference: uuid,
  //     customerFirstName,
  //     customerLastName,
  //     customerEmail,
  //     customerPhone,
  //     customerMobileWallet: customerMobileWallet,
  //     returnUrl: `http://localhost:3001?ref=${uuid}`,
  //     autoReturn: varValue,
  //     merchantPublicKey: merchantPublicKey
  //   };

  //   const response = await fetch(apiUrl, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify(requestBody),
  //   });

  //   const result = await response.json();

  //   // Checkout link
  //   console.log(result);

  //   // Return checkout link or JSON data
  //   return [result, uuid];
  // }

  // ---------------------------------------------------------------------------------------

  const verifyTransaction = async (merchantReference, token) => {
    const apiUrl = `https://live.sparco.io/gateway/api/v1/transaction/query?merchantReference=${merchantReference}`;
    
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
      throw error;
    }
  };



module.exports = router;