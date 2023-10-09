const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
// const session = require('session');
// const flash = require('flash');
// const passport = require('passport');
const homeRouter = require('./routes/index')
// const adminRouter = require('./routes/admin')



// mongoose.connect().then(()=>{
//     console.log('database is connected');
// }).catch((err)=> console.log('error connecting to database', err));


const PORT = process.env.PORT || 3001;

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views/')
app.set('layout','layouts/layout')
app.use(expressLayouts)
app.use(express.static(__dirname + '/public/'))
app.use(bodyParser.urlencoded({limit: '10mb', extended: false}));
app.use(express.urlencoded({ extended: false }))

app.use(methodOverride('_method'));

app.use('/',homeRouter );
// app.use('/auth',authRouter);
// app.use('/admin', ensureAuthenticated,adminRouter);


app.listen(PORT,()=> console.log('Server is Running at port '+ PORT))
