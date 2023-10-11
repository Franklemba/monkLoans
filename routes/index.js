const express = require("express");
const router = express.Router();


const { use } = require("./auth");
const { ensureAuthenticated} = require('../config/auth');

router.get("/", (req,res) => {
    const user = req.user;
    res.render("main/home",{
        user
    })
})

router.get("/credit", ensureAuthenticated, (req,res) => {
    const user = req.user;
    res.render("main/credit",{
        user
    })
})

router.post("/credit/page", ensureAuthenticated, (req,res) => {
    const user = req.user;
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
    
        res.render("main/creditPage",{
            user,
            repaymentDate,
            totalRepayment,
            amountReceived
        })
      }
   
})


router.get("/invest", ensureAuthenticated, (req,res) => {
    const user = req.user;
    res.render("main/invest",{
        user
    })
})

router.get("/profile", ensureAuthenticated, (req,res) => {
    const user = req.user;
    res.render("main/profile",{
        user
    })
})


router.get("/dashboard", ensureAuthenticated, (req,res) => {
    const user = req.user;
    res.render("main/dashboard",{
        user
    })
})


module.exports = router;
