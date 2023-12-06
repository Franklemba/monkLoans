const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/userSchema');
const bcrypt = require('bcrypt');


module.exports = function (passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
          return done(null, false, { message: 'The email your entered is not registered' });
        }
        // Match password
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          // Successfully logged in
          return done(null, user);
        } else {
          return done(null, false, { message: 'Password incorrect' });
        }
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser(async (user, done) => {
    try {
     // const user = await User.findById(id);
      return done(null, user, false);
    } catch (err) {
      done(err, null);
    }
  });
};
