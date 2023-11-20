const express = require("express");
const router = express.Router();
const app = express();
const session = require('express-session');


const { use } = require("./auth");
const { ensureAuthenticated} = require('../config/auth');
const Creditor = require('../models/creditSchema');
const Profile = require('../models/profileSchema');
const { verifyTransaction } = require('../utilities/verifyTransactionUtils'); 


const jwt = require("jsonwebtoken");
const uuid = require('crypto').randomBytes(16).toString('hex');
const axios = require('axios');

const SEC_KEY = "477fea6108f74de3a08aac794416046a";
const PUB_KEY = "c8ef713758684420b3e33eedacb3c626";

merchantPublicKey = "c8ef713758684420b3e33eedacb3c626";

app.use(session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: false    
  }));

  router.get("/", ensureAuthenticated, (req,res) => {
    const user = req.user;
    res.render("main/creditor/credit",{
        user
    })
})

router.post("/page", ensureAuthenticated, async (req,res) => {
    const user = req.user;
    const credit = await Creditor.find({creditorEmail:user.email, creditStatus: true });

    if(credit.length > 0){
        res.render("main/creditor/credit",{
            user,        
            message: `
                <h3>You're ineligible to get a loan</h3>
            <h3>repay balance of K ${credit[0].repaymentAmount} first</h3>
            `,
            url: "/credit/dashboard",
            buttonText:"repay"
        })
    }else{

            const { loanAmount,loanTerm } = req.body;

            const interestRates = {
                1: 0.1, // 5% for a 1-week term
                2: 0.15, // 6% for a 2-week term
                3: 0.2, // 7% for a 3-week term
                4: 0.25, // 8% for a 4-week term
              };

      if (!isNaN(loanAmount) && !isNaN(loanTerm) && loanAmount > 0 && loanAmount < 1000) {
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
    
        
        req.session.calculatedData = {
            repaymentDate,
            totalRepayment,
            amountReceived,
            loanTerm,
            loanAmount: parseFloat(loanAmount),
            serviceFee
        };

       await res.render("main/creditor/creditPage",{
            user:req.user,
            repaymentDate,
            totalRepayment,
            amountReceived,
            loanTerm
        })
      }
    }
   
})

router.get("/card", ensureAuthenticated, (req, res) => {
     
        res.render("main/creditor/creditCard", {
            user: req.user
        });
   
}); 
    //  save loan details to datatbase    
router.post("/card", ensureAuthenticated, async (req, res) => {
    // Retrieve the calculated data from the session
    
    
    try {
        const {campusLocation, bhLocation, roomMatePhoneNumber, collateralItem, otherPhoneNumber}  = req.body;
        const calculatedData = req.session.calculatedData;
        const user = req.user;
        const profile = await Profile.findOne({ userEmail: user.email});
        console.log(calculatedData)
        
        if (calculatedData) {     // when API is intergrated, this condition should also verify the bank details
    
            const repaymentDate = calculatedData.repaymentDate;
            const totalRepayment = calculatedData.totalRepayment;
            const amountReceived = calculatedData.amountReceived;
            const loanTerm = calculatedData.loanTerm;
            const loanAmount = calculatedData.loanAmount;
            const serviceFee = calculatedData.serviceFee;

    
        // ___________SAVING CREDITORS DETAILS __________//
    
            const creditor = new Creditor({ 
                creditorEmail: user.email, 
                creditorStudentNumber: user.studentNumber,
                creditorName: user.firstName +' '+ user.lastName,
                loanAmount, 
                loanTerm ,
                serviceFee,
                amountReceived,
                repaymentAmount:totalRepayment,
                nextPaymentDate:repaymentDate, 
                creditStatus: true,
                location: campusLocation +''+bhLocation,
                roomMatePhoneNumber,
                itemDescription : collateralItem,
                otherPhoneNumber
              });
             
             await creditor.save();
             await Profile.findOneAndUpdate(
                { userEmail: user.email}, // Query for the document to update
                { $set: { 
                    totalCreditedAmount: profile.totalCreditedAmount += creditor.loanAmount,
                    total_No_Of_Credits: profile.total_No_Of_Credits + 1,
                 } }, 
                { new: true } // Options to return the updated document
              );
             
    
            // render page to inform user that account has been successfuly approved
    
            res.render("main/creditor/credit",{   
            user,        
            message: `
                <h3>🎉 Account Approval was successful 🎉</h3>
                <hr>
            <h3>you'll receive your amount shortly</h3>
            <hr>
            <h3>thank for using our service 🤝</h3>
            `,
            url: "/credit/dashboard",
            buttonText:"exit"
            }); // You may want to redirect to the "/credit/page" route to calculate the data if it's not available
        }else{
            res.render("main/creditor/credit",{   
                user,        
                message: `
                    <h3>🎉 Account Approval was unsuccesful</h3>
                <h3>make sure, your bank card is issued by Zanaco and you're on bursary</h3>
                <h3>hard luck!</h3>
                `,
                url: "/credit",
                buttonText:"exit"
                }); 
        }
    } catch (error) {
        console.error('error verifying credit card', error);
        res.redirect('/credit');
    }

    res.send(req.body)

});

router.get('/dashboard', ensureAuthenticated, async (req,res) => {
     const user = req.user;
     const credit = await Creditor.find({creditorEmail:user.email, creditStatus: true });
     const repayedLoan = await Creditor.find({ creditorEmail: user.email, creditStatus: false })
     .sort({ createdAt: -1 });

     res.render("main/creditor/creditDashboard", {
        user,
        credit,
        repayedLoan
     })
})


router.post('/repayment', ensureAuthenticated, async (req,res) => {
    const user = req.user;
    const {newMMnumber} = req.body;

    const currentDate = new Date();
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const formattedDate = currentDate.toLocaleDateString('en-US', options);



    const repayedLoan = await Creditor.find({creditorEmail:user.email, creditStatus: true });
    const filter = { creditorEmail: user.email, creditStatus: true };
    const credit = await Creditor.find({creditorEmail:user.email, creditStatus: true });
    const update = { 
        creditStatus: false,
        nextPaymentDate: formattedDate
    };

    payload = {
        amount: `${credit[0].repaymentAmount}`,
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
                    let verifyData = await verifyTransaction(responseData.transactionReference, encoded_payload);
                    const checkStatus = async () => {
                        if (verifyData.status === 'TXN_AUTH_UNSUCCESSFUL') {
                        console.log(verifyData.status + ': ' + verifyData.status);
                        console.log(verifyData);
                            res.render("main/creditor/creditDashboard", {
                                user,
                                credit,
                                repayedLoan,
                                message: `
                                <h3>Loan balance clearance was unsuccesfull</h3>
                                <h3>please try again and repay</h3>
                                `,
                                url: "/credit/dashboard",
                                buttonText:"exit"
                            })
                        } else if (verifyData.status === 'TXN_AUTH_SUCCESSFUL') {

                            console.log(verifyData.status + ': ' + verifyData.status);
                            console.log(verifyData);
                         //------------------ update credit in database
                            await Creditor.findOneAndUpdate(filter, update, {
                                new: true, // Return the updated document
                            });

                            res.render("main/creditor/creditDashboard", {
                                user,
                                credit,
                                repayedLoan,
                                message: `
                                <h3>Loan balance cleared succesfully</h3>
                                <h3>thank for using our service 🤝</h3>
                                `,
                                url: "/credit/dashboard",
                                buttonText:"exit"
                            })
                        
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
                res.render("main/creditor/credit",{   
                  user,        
                  message: `
                      <h3>Transaction failed 😞</h3>
                      <hr>
                  
                  <p>please make sure the number you are using is valid</p>
                  `,
                  url: `/credit`,
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
                  
                  <p>
                       an error occured, try again later.. if problem persists contact
                       our customer service
                  </p>
                  `,
                  url: `/credit`,
                  buttonText:"back"
                  }); //
                  
                // Handle other cases or do nothing
            }

          })
          .catch(function (error) {
            console.log(error);
            res.redirect('/credit')
            // console.log('')
          });
   
})

// /

module.exports = router;