const express = require("express");
const router = express.Router();
const app = express();
const session = require('express-session');


const { use } = require("./auth");
const { ensureAuthenticated} = require('../config/auth');
const Investor = require('../models/investSchema');

app.use(session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: false    
  }));
  

router.get("/", ensureAuthenticated,  (req,res) => {
    const user = req.user;
    res.render("main/investor/invest",{
        user
    })
})



router.post("/page", ensureAuthenticated, async (req,res) => {
    const user = req.user;
    const {investmentAmount,investmentType}  = req.body;
    

    if (!isNaN(investmentAmount)) {
        // Calculate interest based on selected investment term
        const interestRate = 0.15;
        // Calculate service fee (assuming a fixed fee of K3.00)
        const serviceFee = 3;
        // Calculate expected returns
        const expectedReturns = investmentAmount * interestRate;
        
        // Calculate total returns
        const totalReturns = parseFloat(investmentAmount) + expectedReturns - serviceFee;
        
        // Calculate and display next payment date (assuming 7 days per week)
        const today = new Date();
        const nextPaymentDate = new Date(today.getTime() +  30 * 24 * 60 * 60 * 1000);
        const maturityDate = nextPaymentDate.toISOString().substr(0, 10);

        req.session.calculatedInvestedData = {
            maturityDate,
            totalReturns,
            expectedReturns,
            investmentAmount: parseFloat(investmentAmount),
            serviceFee,
            investmentType
        };
        await res.render("main/investor/investPage",{
            user,
            serviceFee,
            maturityDate,
            totalReturns,
            expectedReturns,
            investmentAmount,
            investmentType
        })
        
      }else{
        redirect("/invest/page")
      }    



})


router.post('/deposit_fund', ensureAuthenticated, async (req,res) => {
    
    
    try {
        const user = req.user;  
        const calculatedInvestedData = req.session.calculatedInvestedData;
        const {newMMnumber} = req.body;
        const profile = await Profile.findOne({ userEmail: user.email});


        if(calculatedInvestedData){

            const maturityDate = calculatedInvestedData.maturityDate;
            const totalReturns = calculatedInvestedData.totalReturns;
            const expectedReturns = calculatedInvestedData.expectedReturns;
            const investmentAmount = calculatedInvestedData.investmentAmount;
            const serviceFee = calculatedInvestedData.serviceFee;
            const investmentType = calculatedInvestedData.investmentType;

            // ___________SAVING INVESTOR'S DETAILS __________//

            const investor = new Investor({
                investorEmail: user.email,
                investorStudentNumber: user.studentNumber,
                investmentAmount,
                serviceFee,
                expectedReturns,
                totalReturns,
                maturityDate,
                investmentType,
                investmentStatus: true
            });

            await investor.save();
            await Profile.findOneAndUpdate(
                { userEmail: user.email}, // Query for the document to update
                { $set: { 
                    totalInvestedAmount: profile.totalInvestedAmount += investor.investmentAmount,
                    total_No_Of_Investments: profile.total_No_Of_Investments ++,
                 } }, 
                { new: true } // Options to return the updated document
              );
            
            // render page once investment has been approved
            res.render("main/investor/invest",{   
                user,        
                message: `
                    <h3>🎉Investment successfully done 🎉</h3>
                    <hr>
                
                <h3>thank for using our service 🤝</h3>
                `,
                url: "/invest/dashboard",
                buttonText:"exit"
                }); //

        }else{
            res.render("main/investor/invest",{   
                user,        
                message: `
                    <h3>🎉 investment was unsuccesful</h3>
                <h3>make sure, to enter the correct credentials</h3>
                <h3>hard luck!</h3>
                `,
                url: "/invest",
                buttonText:"exit"
                }); 
        }


        
    } catch (error) {
        console.error('error saving user details', error);
        res.redirect('/invest');
    }
})


router.get('/dashboard', ensureAuthenticated, async (req,res) => {
    const user = req.user;  
    const invest = await Investor.find({investorEmail:user.email, investmentStatus: true });
    const maturedInvestment = await Investor.find({investorEmail:user.email, investmentStatus: false });
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];

    console.log(formattedDate); // Output: "2023-10-23"
    console.log(maturedInvestment)
    //  function to update all investments  

    updateInvestors(user, formattedDate);

    res.render("main/investor/investDashboard", {
       user,
       invest,
       maturedInvestment
    })
})


const updateInvestors = async (user, formattedDate ) => {

    const investors = await Investor.find({
        investorEmail: user.email,
        investmentStatus: true,
        maturityDate: { $eq: formattedDate }
    });

    if (investors.length > 0) {
        const updatePromises = investors.map(investor => {
            return Investor.findOneAndUpdate(
                { _id: investor._id },
                {
                    investmentStatus: false,
                },
                { new: true }
            );
        });

        const updatedInvestors = await Promise.all(updatePromises);
        console.log(`${updatedInvestors.length} investors updated successfully.`);
        console.log(updatePromises)
    } else {
        console.log('No investors found for the specified date.');
    }
};





module.exports = router;