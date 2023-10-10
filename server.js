const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const homeRouter = require('./routes/index')
const authRouter = require('./routes/auth')


require('./config/passport')(passport);

const { ensureAuthenticated} = require('./config/auth');



const PORT = process.env.PORT || 3001;



mongoose.connect("mongodb://127.0.0.1:27017/moakloans").then(() => {
  console.log('database is connected')
}).catch((err) => console.log('error connecting to database ', err))


app.set('view engine', 'ejs')
app.set('views', __dirname + '/views/')
app.set('layout','layouts/layout')
app.use(expressLayouts)
app.use(express.static(__dirname + '/public/'))
app.use(bodyParser.urlencoded({limit: '10mb', extended: false}));
app.use(express.urlencoded({ extended: false }))

app.use(methodOverride('_method'));


app.use(session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: false    
  }));
  
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());
  
  


app.use('/',homeRouter );
app.use('/auth',authRouter);



app.listen(PORT,()=> console.log('Server is Running at port '+ PORT))
