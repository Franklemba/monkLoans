module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) {
            console.log(req.isAuthenticated)
            return next();
        }
        res.redirect('/auth/login')
    },

}