var _ = require('lodash'),
	Handlebars = require('handlebars'),
	defaultViewResolver = require('./viewresolver');

var bwHandlebars = function() { };

/**
* Attaches and initializes the plugin.
* @params options.helpers {Object} key/value dictionary of handlerbar helpers.  key is the name and val is the function.
* @params options.optimize {Boolean} Compresses and removes whitespace from markup.
* @params options.development {Boolean} If true, then templates are fetched and compiled every time they are rendered.
* @params options.viewResolver {Object} if absent, then a file system view resolver is used to get the markup from the file system.
**/
bwHandlebars.prototype.attach = function (options) {
	var defaults = {
		helpers: {},
		optimize: false,
		development: true
	};

	_.extend(defaults, options);

	var viewResolver = options.viewResolver || new defaultViewResolver(),
		templateCache = {};


	// Override the default version of each.
	Handlebars.registerHelper('each', function(context, options) {
		var buffer = [];

		_.each(context, function(v, k) {
			buffer.push(options.fn({ key: k, value: v }));
		});

		return buffer.join('');
	});

	// Create a range function that will iterate numbers from 0 -> max
	// This is mirrors the underscore _.range function.
	// http://documentcloud.github.com/underscore/#range
	Handlebars.registerHelper('range', function(stop, options) {
		var buffer = [],
			range = _.range((options.hash.start || 0), stop, (options.hash.step || 1));

		_.each(range, function(v, k) {
			buffer.push(options.fn({ key: k, value: v }));
		});

		return buffer.join('');
	});

	// if with evaluation.
	Handlebars.registerHelper('ifeval', function(expression, options) {
        var conditional = false;
        with(this) {
            conditional = eval(expression);
        }
        return conditional ? options.fn(this) : options.inverse(this);
    });

    // Similar to standard print {{value}}, but with an optional fallback value. 
    // Ex: {{def foo def="goo"}} will print the value of foo if exists, otherwise it will print "goo"
    // If def is omitted, then an empty string is printed.
	Handlebars.registerHelper('def', function(expression, options) {
        var val = null,
            def = options.hash.def || '';

        with(this) {
            val = eval(expression);
        }
        return val ? val : def;
    });

	// Inject external handlebar helpers.
	_.each(options.helpers, function(fn, name) {
		Handlebars.registerHelper(name, fn);
	});

	
	/**
	* Attaches to a Broadway app and exposes the render function
	* @params view {String} The name of the view to render.  This will be used by the view resolver to pull markup from file system (node.js) or other (client js)
	* @params data {Object} The view model to use when rendering.
	* @params callback {Function} Notifies when render is complete.  callback(err, data)
	**/
	this.render = function (view, data, callback) {
		var template = templateCache[view];

		// are we in debug or was it already compiled
		if (!options.development && template) {
			_render(view, data, callback);
		}
		else {

			// otherwise get and compile.
			viewResolver.all(function(err, dict) {

				if (err) {
					callback(err);
				}
				else {

					// register each partial in case it is needed by view.
					_.each(dict, function(markup, key) {
						Handlebars.registerPartial(key.replace(/\//g, '.'), markup);
					});

					// Compile and render the top level view.
					_compile(view, dict[view]);
					_render(view, data, callback);
				}

			});
		}
	};

	var _compile = function(view, markup) {

		// remove whitespace if html compression is on.
		if (markup && options.optimize) {
			markup = markup.replace(/\s+/gi, ' ');
		}

		templateCache[view] = Handlebars.compile(markup);
		return templateCache[view];
	};

	var _render = function(view, data, callback) {
		var template = templateCache[view];

		// render
		try {
			callback(null, template(data));
		}
		catch (e) {
			callback('Error in view - ' + view + ': ' + (e.stack || e));
		}
	};

};

module.exports = bwHandlebars;

