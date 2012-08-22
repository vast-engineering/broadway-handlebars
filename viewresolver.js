var _ = require('lodash'),
	Handlebars = require('handlebars'),
	fs = require('fs');

var ViewResolver = function(options) {
	var defaults = {
		base: process.cwd() + '/',
		ext: "html"
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

/**
* Retrieves the markup for all views in a given folder.  
* Return will be in format of 
*    key: path relative to the base
*    val: the contents of the file
**/
ViewResolver.prototype.all = function(callback) {
	var dict = {};

	// walk the folder and return an object with all
	return dict;
};

module.exports = ViewResolver;
