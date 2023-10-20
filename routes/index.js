const express = require("express");
const router = express.Router();
const app = express();
const session = require('express-session');
const MmService = require('../models/mmServiceSchema');

const { use } = require("./auth");
const { ensureAuthenticated} = require('../config/auth');

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


router.get("/profile", ensureAuthenticated, (req,res) => {
    const user = req.user;
    res.render("main/profile",{
        user
    })
})

  //___________  <MOBILE MONEY>
router.get("/mmoney", ensureAuthenticated, (req,res) => {
    const user = req.user;
    res.render("main/mmoney",{
        user
    })
})


router.post("/withdraw", ensureAuthenticated, async (req,res) => {
    const user = req.user;
    const {recipientName,recipientPnumber,location,agentService,amount,txnID}  = req.body;
    const mmService = new MmService({ 
        email: user.email, 
        studentNumber: user.studentNumber,
        recipientName, 
        recipientNumber:recipientPnumber ,
        location,
        agentService,
        transactionAmount: amount,
        serviceType: 'withdraw',
        txnID
      });
     
     await mmService.save();

        res.render("main/mmoney",{
            user,
            message: `
            <h3>withdraw transaction message approved</h3>
            <hr>
            <h3>will attend to you shortly</h3>
            <hr>
            <h3>thank for using our service 🤝</h3>
            `,
            url: "/mmoney",
            buttonText:"exit"
        })
})

router.post("/deposit", ensureAuthenticated, async (req,res) => {
    const user = req.user;
    const {recipientName,recipientPnumber,location,agentService,amount}  = req.body;

    const mmService = new MmService({ 
        email: user.email, 
        studentNumber: user.studentNumber,
        recipientName, 
        recipientNumber: recipientPnumber ,
        location,
        agentService,
        transactionAmount: amount,
        serviceType: 'deposit',
        txnID: 'null'
      });
     
     await mmService.save();

        res.render("main/mmoney",{
            user,
            message: `
            <h3>deposit transaction message received</h3>
            <hr>
            <h3>will attend to you shortly</h3>
            <hr>
            <h3>thank for using our service 🤝</h3>
            `,
            url: "/mmoney",
            buttonText:"exit"
        })
})


  //___________<MOBILE MONEY/>



module.exports = router;
