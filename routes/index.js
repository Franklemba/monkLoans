const express = require("express");
const router = express.Router();
const app = express();
const session = require('express-session');


const { use } = require("./auth");
const { ensureAuthenticated} = require('../config/auth');
// const Profile = require('../models/profileSchema');

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

router.get("/withdraw", ensureAuthenticated, (req,res) => {
    const user = req.user;
    res.render("main/mmoney",{
        user
    })
})



module.exports = router;
