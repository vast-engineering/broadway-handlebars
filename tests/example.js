var http = require('http'),
	bwHandlebars = require('../index.js'),
	broadway = require('broadway'),
	tap = require('tap'),
	test = tap.test;

var app = new broadway.App();
app.use(new bwHandlebars(), { 
	view: {
		base: ["./tests/overrides", "./tests/default"]
	}
});

var gold = require('fs').readFileSync(require.resolve('./gold.html'), 'utf-8');

test("Test render", function(t) {

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

		t.notOk(err, 'Should not be error');
		t.equal(content, gold, 'Content should match gold');
		t.end();
		// console.log(content);
	});
});



test("Test templates and view resolver", function(t) {

	app.templates(function(err, dict) {
		
		t.notOk(err, 'Should not be error');
		t.ok(dict.index, 'View "index" should exist');
		t.ok(dict.hello, 'View "hello" should exist');
		t.ok(/Variation #2/.test(dict.hello), 'View "hello" should be variation 2');
		t.end();
	});
});

