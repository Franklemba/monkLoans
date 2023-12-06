const express = require("express");
const bcrypt = require('bcrypt');
const passport = require('passport');
const router = express.Router();
const User = require('../models/userSchema');
const Profile = require('../models/profileSchema');

router.get("/", (req,res) => {
    res.render("auth/login", {
      incorrectCreditials: true,
      errorMessage: ' ',
    })
})

router.get("/login", (req, res) => {
    res.render("auth/login", {
      incorrectCreditials: true,
      errorMessage: ' ',
    });
})

router.get("/incorrect_credentials", (req, res)=>{
  res.render("auth/login", {
    incorrectCreditials: true,
    errorMessage: req.flash("error")[0],
  });
})

router.get("/signUp", (req, res) => {
    res.render("auth/signUp");
})

router.post("/signUp", async (req,res)=>{
    const {firstName, lastName, email, nrc ,school,studentNumber,phoneNumber, password} = req.body;
  try {
    // Register the user and save to the database
    const user = await registerUser(firstName, lastName, email, nrc ,school,studentNumber,phoneNumber, password);

  req.login(user,async (err) => {
    if (err) {
      console.error(`Error logging in after registration: ${err.message}`);
      return res.render('auth/signUp',{
  
        message: `
                   <h3>account already exists</h3>
                 `,
        url: "/auth/signUp",
        buttonText:"Proceed",    
      });
    }else{
      console.log(`Username: ${firstName}, Password: ${password}`);
      return res.render('auth/login',{
        incorrectCreditials: true,
        errorMessage: ' ',
        message: `
              <h3>🎉 Welcome to MoakLoans! 🎉</h3>
          <h3>Your journey with us to explore financial opportunities begins now. 🚀</h3>
          <h3>Whether you're looking to secure a loan or make smart investments, you've come to the right place. 💼</h3>
          `,
        url: "/",
        buttonText:"Proceed",
        user
    
      });
    }
  });
  }
  catch (error) {
    console.error(`Error registering user: ${error.message}`);
    // Handle registration error (e.g., display an error message)
    res.render('auth/signup', {
      errorMessage: 'Registration failed. Please try again.',
      // Other template variables as needed
    });
  }
})



router.post('/login', (req, res, next)=>{

    passport.authenticate('local', {
      successRedirect: '/credit',
      failureRedirect: '/auth/incorrect_credentials',
      failureFlash: true
    })(req, res, next);

});

router.get('/forgot_password', (req,res) =>{
    res.render("auth/forgot_password");
})



async function registerUser(firstName, lastName, email, nrc ,school,studentNumber,phoneNumber, password) {
    try {
      // Generate a salt to use for hashing the password
      const salt = await bcrypt.genSalt(10);
  
      // Hash the password using the salt
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const existingUser = await User.findOne({ email });
  
      if (existingUser) {
        // If a user with the same email exists, throw an error
        throw new Error('Email already exists');
      }
      // Create a new user document with the hashed password
      password = hashedPassword;
      const user = new User({
        firstName, lastName, email, nrc ,school,studentNumber,phoneNumber, password
      });
  
      // Save the user document to the database
      await user.save();

      const profile = new Profile({ 
        key: user._id, 
        userStudentNumber: user.studentNumber,
        totalInvestedAmount: 0,
        totalCreditedAmount: 0,
        totalMaturedInvestments: 0,
        total_No_Of_Investments: 0,
        total_No_Of_Credits: 0,
        total_No_Of_CreditsPayed: 0,
        total_No_Of_CreditsUnPayed: 0
      });
     
      await profile.save();
      return user;
      
      console.log(`User ${firstName} registered successfully`);

    } catch (error) {
      console.error(`Error registering user: ${error.message}`);
    }
}
  


  router.get('/logout', (req, res) => {
    // Destroy the user session to log them out
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
  });
  


  
module.exports = router;