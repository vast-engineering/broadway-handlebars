var _ = require('lodash'),
    findit = require('findit'),
    path = require('path'),
    async = require('async'),
    fs = require('fs');

/**
 * A ViewResolver resolves template names to template contents. This default implementation treats template names as
 * relative paths and reads files at those locations as template contents.
 *
 * @param options.ext  {String}          file extension. defaults to "html".
 * @param options.base {String}, {Array} base path or paths. will attempt to resolve template names relative to these
 *                                       paths in order
 **/
var ViewResolver = function(options) {
    this.options = _.defaults(options, {
        base: process.cwd(),
        ext: "html"
    });

    if (!(this.options.base instanceof Array)) {
        this.options.base = [this.options.base];
    }
};

var getAll = function(base, ext, callback) {
    var regexExt = new RegExp("\\." + ext + "$"),
        dict = {},
        basePath = path.normalize(base);

    // walk the contents of the base path
    var finder = findit.find(basePath),
        paths = [];

    // for each file...
    finder.on('file', function(file, stat) {
        // ...if this is a file of the expected extension...
        if (regexExt.test(file)) {
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
                        var key = path.replace(basePath + '/', '').replace(regexExt, '');
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



/**
* Retrieves the markup for all views in a given folder.  
* Return will be in format of 
*    key: path relative to the base
*    val: the contents of the file
**/
ViewResolver.prototype.all = function(callback) {
    var that = this,
        ops = _.map(this.options.base, function(base) {
            return function(cb) {
                getAll(base, that.options.ext, cb);
            };
        });

    async.parallel(ops.reverse(), function(err, results) {
        var dict = results.splice(0, 1)[0];
        _.each(results, function(r) {
            _.extend(dict, r);
        });
        callback(null, dict);
    });
};

module.exports = ViewResolver;
