const express = require("express");
const router = express.Router();
const app = express();
const session = require('express-session');


const { use } = require("./auth");
const { ensureAuthenticated} = require('../config/auth');
const Creditor = require('../models/creditSchema');
const Profile = require('../models/profileSchema');

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
        const {cardholderName,cardNumber,expirationDate,cvv}  = req.body;
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
                cardNumber,
                creditStatus: true
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

router.get('/repayment', ensureAuthenticated, async (req,res) => {
    const user = req.user;

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

   
})

router.post('/repayment', ensureAuthenticated, async (req,res) => {
    const user = req.user;
    const {newMMnumber} = req.body;
    console.log(newMMnumber);

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

   
})

// /

module.exports = router;