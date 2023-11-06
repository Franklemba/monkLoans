const express = require("express");
const router = express.Router();
const app = express();
const session = require('express-session');
const MmService = require('../models/mmServiceSchema');
const Investor = require('../models/investSchema');
const Creditor = require('../models/creditSchema');

const { use } = require("./auth");
const { ensureAuthenticated} = require('../config/auth');

app.use(session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: false    
  }));
  
//   landing page route
router.get("/", (req,res) => {
    
    res.render("main/home",{
        user: req.user
    })
})

// profile page route
router.get("/profile", ensureAuthenticated, async (req,res) => {
    const user = req.user;
    const creditor = await Creditor.find({ creditorEmail: user.email});
    const investor = await Investor.find({ investorEmail: user.email});
    res.render("main/profile",{
        user,
        creditor,
        investor
    })
})

  //___________  <MOBILE MONEY>
router.get("/mmoney", ensureAuthenticated, (req,res) => {
    const user = req.user;
    res.render("main/mmoney",{
        user,
    })
})


router.post("/mmoney", ensureAuthenticated, async (req,res) => {
    const user = req.user;
    const {location,agentService,serviceType}  = req.body;
    const mmService = new MmService({ 
        email: user.email, 
        studentNumber: user.studentNumber,
        location,
        agentService,
        serviceType
      });
     
     await mmService.save();

        res.render("main/mmoney",{
            user,
            message: `
            <h3>Agent order set</h3>
            <hr>
            <h3>${agentService} agent will attend to you shortly</h3>
            <hr>
            <h3>thank for using our service 🤝</h3>
            `,
            url: "/mmoney",
            buttonText:"exit"
        })
})



  //___________<MOBILE MONEY/>


//   services information routes
router.get('/invest_info', (req,res)=>{
    const user = req.user;

    res.render('main/invest_info',{
        user,
    })

})

router.get('/loan_info', (req,res)=>{
    const user = req.user;

    res.render('main/loan_info',{
        user,
    })

})

router.get('/mmoney_info', (req,res)=>{
    const user = req.user;

    res.render('main/mmoney_info',{
        user,
    })

})



module.exports = router;
