var http = require('http');
var bwHandlebars = require('../index.js');
var broadway = require('broadway');
var tap = require('tap');
var test = tap.test;
var fs = require('fs');

var app = new broadway.App();
app.use(new bwHandlebars(), { 
	view: {
		base: ["./tests/overrides", "./tests/default"]
	}
});

var gold = fs.readFileSync(require.resolve('./gold.html'), 'utf-8');

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

test('test missing template', function (t) {
	app.render('hoffa', {}, function (e, html) {
		t.ok(e, 'expecting error');
		t.ok(e instanceof Error, 'error should be an Error');
		t.end();
	})
});

test('test template with compile error', function (t) {
	app.render('bad', {}, function (e, html) {
		t.ok(e, 'expecting error');
		t.ok(e instanceof Error, 'error should be an Error');
		t.end();
	})
})