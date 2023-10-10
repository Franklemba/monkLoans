const express = require("express");
const router = express.Router();


router.get("/", (req,res) => {
    res.render("auth/signUp")
})

router.get("/login", (req, res) => {
    res.render("auth/login");
})



module.exports = router;

// const express = require('express');
// const bcrypt = require('bcrypt');
// const passport = require('passport');
// const router = express.Router();
// const User = require('../models/UserSchema');

// // User.deleteMany({})
// //   .then(() => console.log('All items deleted'))
// //   .catch(err => console.error(err));

// router.get('/', (req, res) =>{
//     res.render('auth/login');
// });

// router.get('/login',(req, res) =>{
//     res.render('auth/login');
// });

// router.get('/register',(req, res) =>{
//   res.render('auth/signup');
// });

// router.post('/register',async (req, res, next) =>{

//   const {firstName, lastName, email, phoneNumber, password, gender, DOB} = req.body;
//   try {
//     // Register the user and save to the database
//     const user = await registerUser(firstName, lastName, email, phoneNumber, password, gender, DOB);

//   req.login(user,async (err) => {
//     if (err) {
//       console.error(`Error logging in after registration: ${err.message}`);
//       return next(err);
//     }
//     console.log(`Username: ${firstName}, Password: ${password}`);
//     return res.render('auth/login',{
  
//       message: `<h3>🎉 Thank you for choosing Tayant Pay! 🎉</h3>
//       🚀 <h3>Your journey to secure and lightning-fast transactions begins now.</h3>
//       💼 <h3>You've just unlocked a world of financial possibilities. </h3>
//       <h3>We're here to make your transactions safe🔒, seamless🤝, and swift.<h3/>
//      `,
//       url: "/",
//       buttonText:"Proceed",
//       user
  
//     });
//   });
//   }
//   catch (error) {
//     console.error(`Error registering user: ${error.message}`);
//     // Handle registration error (e.g., display an error message)
//     res.render('auth/signup', {
//       errorMessage: 'Registration failed. Please try again.',
//       // Other template variables as needed
//     });
//   }
// });

// router.post('/login', (req, res, next)=>{

//     passport.authenticate('local', {
//       successRedirect: '/',
//       failureRedirect: '/auth/login',
//       failureFlash: true
//     })(req, res, next);

// });

// async function registerUser(firstName,lastName,email,phoneNumber, password, gender, DOB) {
//   try {
//     // Generate a salt to use for hashing the password
//     const salt = await bcrypt.genSalt(10);

//     // Hash the password using the salt
//     const hashedPassword = await bcrypt.hash(password, salt);
    
//     const existingUser = await User.findOne({ email });

//     if (existingUser) {
//       // If a user with the same email exists, throw an error
//       throw new Error('Email already exists');
//     }
//     // Create a new user document with the hashed password
//     const user = new User({
//       firstName,
//       lastName,
//       email,
//       phoneNumber,
//       password:hashedPassword,
//       gender,
//       DOB
//     });

//     // Save the user document to the database
//     await user.save();
//     return user;
//     console.log(`User ${firstName} registered successfully`);
//   } catch (error) {
//     console.error(`Error registering user: ${error.message}`);
//   }
// }



// function generateUserEmail(userName) {
//     const emailHtml = `
//       <div style="background-color: yellow; padding: 20px; text-align: center;">
//         <h1 style="color: lightgreen;">Hello ${userName},</h1>
//         <p style="color: lightgreen;">Thank you for signing up with tayant pay.</p>
//       </div>
//     `;
//     return emailHtml;
//   }

//   function sendAccountCreateEmail(emailAddress, userName){
//     apiInstance.sendTransacEmail({
//         "sender":{ "email":`${emailAddress}`, "name":userName},
//         "subject":"Tayant Pay Transaction",
//         "htmlContent":
//         `<html>
//         <head></head>
//         <body></body>
//         </html>
//         `,
//         "messageVersions":[
//           //Definition for Message Version 1 
//           {
//               "to":[
//                  {
//                     "email":emailAddress,
//                     "name":name,
//                  }
//               ],
//               "htmlContent": generateUserEmail(userName)
//               ,
//               "subject":"Account Created! ~ Tayant Pay"
//             },
//             {
//               "to":[
//                  {
//                      //"email":`sublilosichembe180@gmail.com`,
//                     "email":`chisalecharles23@gmail.com`,
//                     "name":userName,
//                  }
//               ],
//               "htmlContent": generateAdminEmail()
//               ,
//               "subject":"New User! ~ Tayant Pay"
//             },
//           ]
//         }).then(function(data) {
//      //console.log(data);
//     }, function(error) {
//      console.error(error);
//     });
// }

// router.get('/logout', (req, res) => {
//   // Destroy the user session to log them out
//   req.session.destroy((err) => {
//     if (err) {
//       console.error('Error destroying session:', err);
//       // Handle error as needed
//       res.status(500).send('Internal Server Error');
//     } else {
//       // Redirect the user to the login or home page
//       res.redirect('/'); // You can replace '/' with the desired destination
//     }
//   });
// });


// module.exports = router