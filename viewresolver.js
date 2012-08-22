var _ = require('lodash'),
	Handlebars = require('handlebars'),
	walk = require('walk'),
	path = require('path'),
	fs = require('fs');

var ViewResolver = function(options) {
	var defaults = {
		base: process.cwd(),
		ext: "html"
	};
	this.options = _.extend(defaults, options);
	this.regexExt = new RegExp("\\." + this.options.ext + "$");
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
	var that = this,
		dict = {},
		basePath = path.normalize(this.options.base);

	// walk the folder and return an object with all
	var walker = walk.walk(basePath, {followLinks: false});

	walker.on('file', function(root, stats, next) {
		if (stats.error) {
			callback(stats.error);
		}
		else if (that.regexExt.test(stats.name)) {
			var file = root + '/' + stats.name;
			fs.readFile(file, 'utf-8', function(err, data) {
				var key = file.replace(basePath + '/', '').replace(that.regexExt, '');
				dict[key] = data;
				next();
			});
		}
		else {
			next();
		}
	});

	walker.on('end', function() {
		callback(null, dict);
	});
};

module.exports = ViewResolver;
