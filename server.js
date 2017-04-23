
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); 
var config = require('./config'); 
var User   = require('./models/user'); 

var port = process.env.PORT || 8080; 
mongoose.connect(config.database); 
app.set('key', config.secret);

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


var apiRoutes = express.Router();

apiRoutes.get('/', function(req, res) {
  res.json({ message: 'APIs up and running!' });
});

apiRoutes.get('/users',function(req,res){
	User.find({},function(err,users){
		res.json(users);
	})

});

apiRoutes.post('/register',function(req,res){
	User.findOne ({name: req.body.email },function(err,user){
		if(!user){
 				var newUser = new User({ 
    				name: req.body.email, 
   					password: req.body.password,
   					admin: true 
  				});
        console.log(req.body.email);
        console.log(req.body.password);
		 		newUser.save(function(err) {
    				if (err) throw err;

    			res.json({ success: true ,message:"User account created successfully!"});
  			});		
  		}
  		else if(user){
    			res.json({ success: false ,message:"User account already exists!"});
  		}
	} );
});

apiRoutes.post('/authenticate', function(req, res) {
  User.findOne({
    name: req.body.name
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {

      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

        var token = jwt.sign(user, app.get('key'), {
          expiresIn: 1440 // expires in 24 hours
        });

        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }   
    }
  });
});

apiRoutes.post('/sendmail',function(req,res){
    var data = req.body;
    var emailList = data['email']
    const nodemailer = require('nodemailer');

    var smtpTransport = require('nodemailer-smtp-transport');

    var transport = nodemailer.createTransport(smtpTransport({
        service: 'gmail',
        auth: {
            user: 'amehla@cs.stonybrook.edu', // my mail
            pass: '******'
        }
    }));
    let mailOptions = {
        from: 'amehla@cs.stonybrook.edu', 
        to: emailList,
        subject: 'Hello', 
        text: 'Hello world ?', 
    };
    transport.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        res.json({ success: false ,message:"Email sent successfully!"});
    });
});

app.use(morgan('dev'));

app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

app.use('/api', apiRoutes);


app.listen(port);
