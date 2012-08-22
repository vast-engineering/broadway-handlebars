var _ = require('lodash'),
	Handlebars = require('handlebars'),
	fs = require('fs');

var ViewResolver = function(options) {
	var defaults = {
		base: process.cwd() + '/'
	};
	this.options = _.extend(defaults, options);
};

/**
* Retrieves the markup for a given view.
*
**/
ViewResolver.prototype.get = function(name, callback) {
	fs.readFile(this.options.base + name, 'utf-8', callback);
};

module.exports = ViewResolver;
