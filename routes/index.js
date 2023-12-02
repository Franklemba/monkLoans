const express = require("express");
const router = express.Router();
const app = express();
const session = require('express-session');
const MmService = require('../models/mmServiceSchema');
const MomoService = require('../models/mmobileSchema');
const Investor = require('../models/investSchema');
const Creditor = require('../models/creditSchema');
const User = require('../models/userSchema');

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
router.get("/profile",  ensureAuthenticated, async (req,res) => {
    const user = req.user;
    const creditor = await Creditor.find({ key: user._id});
    const investor = await Investor.find({ key: user._id});
    res.render("main/profile",{
        user,
        creditor,
        investor
    })
})

router.post('/profile/update', async (req, res) =>{
    const user =  req.user;
    const {firstName, lastName, email, studentNumber, phoneNumber} = req.body;

    await User.findOneAndUpdate(
        { _id: user._id}, // Query for the document to update
        { $set: { 
            firstName: firstName,
            lastName: lastName,
            email: email,
            studentNumber: studentNumber,
            phoneNumber: phoneNumber
         }}, 
        { new: true } // Options to return the updated document
      );

      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
          // Handle error as needed
          res.status(500).send('Internal Server Error');
        } else {
          // Redirect the user to the login or home page
          res.redirect('/'); // You can replace '/' with the desired destination
        }
      });
      

})

  //___________  <MOBILE MONEY>
router.get("/mmoney", ensureAuthenticated, async (req,res) => {
    const user = req.user;
    const momoService = await MomoService.findOne({ agentName: 'Jacob Mwanza'});

    res.render("main/mmoney",{
        user,
        momoService
    })
})


router.post("/mmoney", ensureAuthenticated, async (req,res) => {
    const user = req.user;

    if(user.isVerified == true){

    const {amount,location,agentService,serviceType}  = req.body;
    const momoService = await MomoService.findOne({ agentName: 'Jacob Mwanza'});
    const mmService = new MmService({ 
        email: user.email, 
        name: user.firstName +' '+user.lastName,
        agentService,
        serviceType,
        amount,
        location,
      });
     
    await mmService.save();

    res.render("main/mmoney",{
        user,
        momoService,
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

    }else{
        res.render("main/verificationPage",{   
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


router.get('/verify', ensureAuthenticated, (req,res)=>{
    const user = req.user;
    res.render('main/verificationPage',{
        user
    })
})


  //___________<MOBILE MONEY/>


//   services information routes
router.get('/invest_info', ensureAuthenticated, (req,res)=>{
    const user = req.user;

    res.render('main/invest_info',{
        user,
    })

})

router.get('/loan_info', ensureAuthenticated, (req,res)=>{
    const user = req.user;

    res.render('main/loan_info',{
        user,
    })

})

router.get('/mmoney_info', ensureAuthenticated, (req,res)=>{
    const user = req.user;

    res.render('main/mmoney_info',{
        user,
    })

})



module.exports = router;
