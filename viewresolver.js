var _ = require('lodash'),
    Handlebars = require('handlebars'),
    findit = require('findit'),
    path = require('path'),
    async = require('async'),
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

    // walk the contents of the base path
    var finder = findit.find(basePath),
        paths = [];

    // for each file...
    finder.on('file', function(file, stat) {
        // ...if this is a file of the expected extension...
        if (that.regexExt.test(file)) {
            // ... then hold onto the path
            paths.push(file);
        }
    });

    finder.on('err', function(file, stat) {
        callback(err);
    });

    finder.on('end', function() {
        // we got all the templates. load their contents asynchronously
        async.forEach(
            // arr
            paths,
            // iterator
            function(path, callback) {
                fs.readFile(path, 'utf-8', function(err, data) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        // simplify the key to be relative to base path and omit file extension
                        var key = path.replace(basePath + '/', '').replace(that.regexExt, '');
                        dict[key] = data;
                        callback();
                    }
                })
            },
            // callback
            function(err) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, dict);
                }
            }

        );
    });
};

module.exports = ViewResolver;
