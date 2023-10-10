const express = require("express");
const router = express.Router();


router.get("/", (req,res) => {
    res.render("main/home")
})

router.get("/credit", (req,res) => {
    res.render("main/credit")
})

router.post("/credit/page", (req,res) => {
    res.render("main/creditPage")
})


router.get("/invest", (req,res) => {
    res.render("main/invest")
})

router.get("/save", (req,res) => {
    res.render("main/save")
})

module.exports = router;