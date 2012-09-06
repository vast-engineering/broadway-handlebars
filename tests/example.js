var http = require('http'),
	bwHandlebars = require('../index.js'),
	broadway = require('broadway');

var app = new broadway.App();
app.use(new bwHandlebars(), { 
	view: {
		base: ["./tests/overrides", "./tests/default"]
	}
});

var tests = ['render', 'templates'];

app.render('index', { 
	languages: {
		spanish: {
			hello: 'Hola' 
		},
		french: {
			hello: "Bonjour"
		},
		english: {
			hello: 'Hello'
		}
	}
}, function(err, content) {
	console.log(err || '');
	console.log(content);
	tests.splice(0,1);
});

app.templates(function(err, dict) {
	console.log(dict);
	tests.splice(1,1);
});


var checkExit = function() {
	if (tests.length == 0) {
		process.exit();
	} else {
		process.nextTick(checkExit);
	}
};

process.nextTick(checkExit);
