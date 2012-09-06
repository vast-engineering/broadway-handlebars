var http = require('http'),
	bwHandlebars = require('../index.js'),
	broadway = require('broadway');

var app = new broadway.App();
app.use(new bwHandlebars(), { 
	view: {
		base: ["./tests/overrides", "./tests/default"]
	}
});

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
	process.exit();
});
