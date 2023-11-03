module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) {
            console.log(req.isAuthenticated)
            return next();
        }else {
            res.redirect('/auth/login')
        }
    },


    ensureGuest: function (req, res, next) {
        if (!req.isAuthenticated()) {
          return next();
        } else {
          res.redirect('/');
        }
      },

}