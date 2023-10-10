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
    res.render("main/creditPage",{
        user
    })
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

// router.get('*', (req, res) => {
//     // Redirect to the main page or any desired page
//     res.redirect('/'); // You can replace '/' with the URL of your main page
//   });


module.exports = router;
