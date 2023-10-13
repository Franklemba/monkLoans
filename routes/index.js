const express = require("express");
const router = express.Router();
const app = express();
const session = require('express-session');


const { use } = require("./auth");
const { ensureAuthenticated} = require('../config/auth');
const Creditor = require('../models/creditSchema');

app.use(session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: false    
  }));
  
router.get("/", (req,res) => {

    res.render("main/home",{
        user: req.user
    })
})

//-------------------<CREDITOR SECTION>

router.get("/credit", ensureAuthenticated, (req,res) => {
    const user = req.user;
    res.render("main/credit",{
        user
    })
})

router.post("/credit/page", ensureAuthenticated, async (req,res) => {
    const user = req.user;
    const credit = await Creditor.find({creditorEmail:user.email, creditStatus: true });

    if(credit.length > 0){
        res.render("main/credit",{
            user,        
            message: `
                <h3>You're ineligible to get a loan</h3>
            <h3>repay balance of K ${credit[0].repaymentAmount} first</h3>
            `,
            url: "/credit/dashboard",
            buttonText:"repay"
        })
    }else{
        const {loanAmount,loanTerm} = req.body;
    const interestRates = {
        1: 0.05, // 5% for a 1-week term
        2: 0.1, // 6% for a 2-week term
        3: 0.15, // 7% for a 3-week term
        4: 0.2, // 8% for a 4-week term
      };
      if (!isNaN(loanAmount) && !isNaN(loanTerm)) {
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

       await res.render("main/creditPage",{
            user:req.user,
            repaymentDate,
            totalRepayment,
            amountReceived,
            loanTerm
        })
      }
    }
   
})

router.get("/credit/card", ensureAuthenticated, (req, res) => {
     
        res.render("main/creditCard", {
            user: req.user
        });
   
});

router.post("/credit/card", ensureAuthenticated, async (req, res) => {
    // Retrieve the calculated data from the session
    
    
    try {
        const {cardholderName,cardNumber,expirationDate,cvv}  = req.body;
        const calculatedData = req.session.calculatedData;
        const user = req.user;
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
                loanAmount, 
                loanTerm ,
                serviceFee,
                amountReceived,
                repaymentAmount:totalRepayment,
                nextPaymentDate:repaymentDate, 
                cardNumber,
                creditStatus: true
              });
             
             await creditor.save();
    
    
            // render page to inform user that account has been successfuly approved
    
            res.render("main/credit",{   
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
            res.render("main/credit",{   
                user,        
                message: `
                    <h3>🎉 Account Approval was unsuccesful</h3>
                <h3>make sure, your bank card is issed by Zanaco and you're on bursary</h3>
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

});


router.get('/credit/dashboard', ensureAuthenticated, async (req,res) => {
     const user = req.user;
     const credit = await Creditor.find({creditorEmail:user.email, creditStatus: true });

     res.render("main/creditDashboard", {
        user,
        credit
     })
})

//-------------------</CREDITOR SECTION>

///-------------------<INVESTOR SECTION>


router.get("/invest", ensureAuthenticated, (req,res) => {
    const user = req.user;
    res.render("main/invest",{
        user
    })
})

router.post("/invest/page", ensureAuthenticated, (req,res) => {
    const user = req.user;
    const {investmentAmount, investmentTerm}  = req.body;
    const interestRates = {
        1: 0.03, // 5% for a 1-week term
        2: 0.08, // 6% for a 2-week term
        3: 0.12, // 7% for a 3-week term
        4: 0.18, // 8% for a 4-week term
      };
   
    if (!isNaN(investmentAmount) && !isNaN(investmentTerm)) {
        // Calculate interest based on selected investment term
        const interestRate = interestRates[investmentTerm];
        
        // Calculate service fee (assuming a fixed fee of K3.00)
        const serviceFee = 3;
        
        // Calculate expected returns
        const expectedReturns = investmentAmount * interestRate;
        
        // Calculate total returns
        const totalReturns = parseFloat(investmentAmount) + expectedReturns - serviceFee;
        
        // Calculate and display next payment date (assuming 7 days per week)
        const today = new Date();
        const nextPaymentDate = new Date(today.getTime() + investmentTerm * 7 * 24 * 60 * 60 * 1000);
        const maturityDate = nextPaymentDate.toISOString().substr(0, 10);
        
        res.render("main/investPage",{
            user,
            serviceFee,
            maturityDate,
            totalReturns,
            expectedReturns,
            investmentTerm,
            investmentAmount
        })
        
      }
    
})

router.get('/invest/dashboard', ensureAuthenticated, (req,res) => {
    const user = req.user;  
    res.render("main/investDashboard", {
       user,
    })
})


//-------------------   </INVESTOR SECTION>




router.get("/profile", ensureAuthenticated, (req,res) => {
    const user = req.user;
    res.render("main/profile",{
        user
    })
})



module.exports = router;
