'use strict';
require('dotenv').config({silent: true});
/*
* All the required node packages
*/
const express 	= require('express'),
	app 		= express(),
	path 		= require('path'),
	bodyParser 	= require('body-parser'),
	morgan 		= require('morgan'),
	mongoose 	= require('mongoose'),
	helmet 		= require('helmet'),
	compress 	= require('compression'),
	routes 		= require(path.resolve('./config/routes')),
	config 		= require(path.resolve(`./config/env/${process.env.NODE_ENV}`)),
	adminCtrl 	= require(path.resolve('./controllers/Admin/adminCtrl')),
	http 		= require('http').Server(app);

mongoose.Promise = require('bluebird');
mongoose.set('debug', config.db.DEBUG);
mongoose.connect(config.db.URL, {autoReconnect: true});

/* Node.js compression middleware
* The middleware will attempt to compress response bodies for all request that traverse through the middleware
* Should be placed before express.static
*/
app.use(compress({
    filter: function (req, res) {
      return (/json|text|javascript|css|font|svg/).test(res.getHeader('Content-Type'));
    },
    level: 9
}));

/*
* Serving static files in Express using express static middleware
* these files will be access publicly
*/
app.use(express.static(path.resolve('./public')));
app.set('views', path.join(__dirname, '/public'));
app.set('view engine', 'ejs');

/*
* uncomment the following when the favicon is available
* Initialize favicon middleware
*/
// app.use(favicon(`${__dirname}/public/images/favicon.ico`));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(morgan('dev'));

/**
* Configure Helmet headers configuration
* Use helmet to secure Express headers
*/
app.use(helmet());

/* Register all your routes */
app.use('/api', routes.router);
app.use('/admin', routes.admin);
app.get(/^((?!\/(api)).)*$/, function (req, res) {
	res.render('index');
});

// Global Error Handler
app.use((err, req, res, next) => {
	if(err){
		res.status(err.status || 500).json({
			errors: {
				source: err.errors || err,
				code: err.code,
				message: err.message || 'Some error occurred, try after sometime!!',
				success: false
			}	
		});
	}
	next();
});

/*
* Start the node server using node 'http' package
*/
http.listen(config.server.PORT, () => {
	adminCtrl.register();
    console.log(`Listening on server port:${config.server.PORT}`);
});


// Todos
// Enable CSRF protection

/*
* we need app package for tests so we are exporting this for our tests
*/
module.exports = app;