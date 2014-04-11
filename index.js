// var _ = {
// 		each: require('lodash.each'),
// 		defaults: require('lodash.defaults'),
// 		extend: require('lodash.extend'),
// 		clone: require('lodash.clone'),
// 		range: require('lodash.range')
// 	},
var _ = require('lodash');
var handlebars = require('handlebars');   // parens will prevent browserify from packaging.
var defaultViewResolver = !process.browser ? require('./viewresolver') : null;

var bwHandlebars = function() { };

/**
* Attaches and initializes the plugin.
* @params options.helpers {Object} key/value dictionary of handlerbar helpers.  key is the name and val is the function.
* @params options.optimize {Boolean} Compresses and removes whitespace from markup.
* @params options.development {Boolean} If true, then templates are fetched and compiled every time they are rendered.
* @params options.viewResolver {Object} if absent, then a file system view resolver is used to get the markup from the file system.
**/
bwHandlebars.prototype.attach = function (options) {

	// support the factory if exists - https://github.com/tommydudebreaux/handlebars.js
	// otherwise, use the default singleton approach here.
	var Handlebars = handlebars.create ? handlebars.create() : handlebars;

	_.defaults(options, {
		helpers: {},
		optimize: false,
		development: true,
		view: {
			base: process.cwd(),
			ext: "html"
		}
	});

	var viewResolver = options.viewResolver || new defaultViewResolver(options.view),
		templateCache = {};


	// Override the default version of each.
	Handlebars.registerHelper('each', function(context, options) {
		var buffer = [],
			that = this;

		_.each(context, function(v, k) {
			try {
				buffer.push(options.fn(_.extend(_.clone(that), { key: k, value: v })));
			}
			catch (e) {
				buffer.push(e);
			}
		});

		return buffer.join('');
	});

	// Create a range function that will iterate numbers from 0 -> max
	// This is mirrors the underscore _.range function.
	// http://documentcloud.github.com/underscore/#range
	Handlebars.registerHelper('range', function(expression, options) {
		var buffer = [],
			stop = 0,
			that = this;

		if (typeof(expression) == 'string') {
			with(this) {
				stop = eval(expression);
			}
		}
		else {
			stop = expression;
		}

		_.each(_.range((options.hash.start || 0), stop, (options.hash.step || 1)), function(v, k) {
			try {
				buffer.push(options.fn( _.extend(_.clone(that), { key: k, value: v })));
			}
			catch (e) {
				buffer.push(e);
			}
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

    try {
      with(this) {
        val = eval(expression);
      }
    }
    catch (e) {
    	val = expression;
    }

    return val ? val : def;
  });

	// Allowing dynamic loading of partials based on value of variable in context
	// Call is made like {{{partial "partial.root" partial_name ctx}}} or {{{partial full_partial_string ctx}}}
	Handlebars.registerHelper('partial', function(root, name, ctx, hash) {
		var ps = Handlebars.partials, path;
		if (typeof name === 'object') {
			var tmp = name;
			name = '';
			hash = ctx;
			ctx = tmp;
		} else if (typeof name === 'undefined') {
			name = '';
		};
		path = root + ((name !== '') ? ('.' + name) : name);

		if(typeof ps[path] != 'function')
		  ps[path] = Handlebars.compile(ps[path]);
		return ps[path](ctx, hash);
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

	// expose the instance of hb so that helpers or other things can be attached async.
	this.render.instance = Handlebars;

	var _compile = function(view, markup) {

		// remove whitespace if html compression is on.
		if (markup && options.optimize) {
			markup = markup.replace(/\s+/gi, ' ');
		}

		templateCache[view] = markup ? Handlebars.compile(markup) : function() { throw new Error("View Not Found - " + view); };

		return templateCache[view];
	};

	var _render = function(view, data, callback) {
		var template = templateCache[view],
			html = null,
			err = null;

		// render
		try {
			html = template(data);
		}
		catch (e) {
			err = e;
		}

		return typeof(callback) === 'function' ? callback(err, html) : null;
	};

	this.templates = function(callback) {
		viewResolver.all(callback);
	};

};

module.exports = bwHandlebars;

