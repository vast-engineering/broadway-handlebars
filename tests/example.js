var http = require('http'),
	bwHandlebars = require('../index.js'),
	broadway = require('broadway');


var app = new broadway.App();
app.use(new bwHandlebars(), { /* defaults are ok so empty being passed */ });

app.render('tests/hello.html', { 
	spanish: {
		hello: 'Hola' 
	},
	french: {
		hello: "Bonjour"
	},
	english: {
		hello: 'Hello'
	}
}, function(err, content) {
	console.log(content);
	process.exit();
});

