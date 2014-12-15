/*------------------------------------------------------------------------------
Jemplate - Template Toolkit for JavaScript

DESCRIPTION - This module provides the runtime JavaScript support for
compiled Jemplate templates.

AUTHOR - Ingy döt Net <ingy@cpan.org>

Copyright 2006,2008 Ingy döt Net.

This module is free software; you can redistribute it and/or
modify it under the same terms as Perl itself.
------------------------------------------------------------------------------*/

//------------------------------------------------------------------------------
// Main Jemplate class
//------------------------------------------------------------------------------

if (typeof Jemplate == 'undefined') {
    var Jemplate = function() {
        this.init.apply(this, arguments);
    };
}

Jemplate.VERSION = '0.22';

Jemplate.process = function() {
    var jemplate = new Jemplate(Jemplate.prototype.config);
    return jemplate.process.apply(jemplate, arguments);
}

;(function(){

if (! Jemplate.templateMap)
    Jemplate.templateMap = {};

var proto = Jemplate.prototype = {};

proto.config = {
    AUTO_RESET: true,
    BLOCKS: {},
    CONTEXT: null,
    DEBUG_UNDEF: false,
    DEFAULT: null,
    ERROR: null,
    EVAL_JAVASCRIPT: false,
    GLOBAL : true,
	SCOPE : this,
    FILTERS: {},
    INCLUDE_PATH: [''],
    INTERPOLATE: false,
    OUTPUT: null,
    PLUGINS: {},
    POST_PROCESS: [],
    PRE_PROCESS: [],
    PROCESS: null,
    RECURSION: false,
    STASH: null,
    TOLERANT: null,
    VARIABLES: {},
    WRAPPER: []
};

proto.defaults = {
    AUTO_RESET: true,
    BLOCKS: {},
    CONTEXT: null,
    DEBUG_UNDEF: false,
    DEFAULT: null,
    ERROR: null,
    EVAL_JAVASCRIPT: false,
    GLOBAL : true,
	SCOPE : this,
    INCLUDE_PATH: [''],
    INTERPOLATE: false,
    OUTPUT: null,
    PLUGINS: {},
    POST_PROCESS: [],
    PRE_PROCESS: [],
    PROCESS: null,
    RECURSION: false,
    STASH: null,
    TOLERANT: null,
    VARIABLES: {},
    WRAPPER: []
};


Jemplate.init = function(config) {
 
    Jemplate.prototype.config = config || {};
    
    for (var i in Jemplate.prototype.defaults) {
        if(typeof Jemplate.prototype.config[i] == "undefined") {
            Jemplate.prototype.config[i] = Jemplate.prototype.defaults[i];
        }
    }
}

proto.init = function(config) {
    
    this.config = config || {};
    
    for (var i in Jemplate.prototype.defaults) {
        if(typeof this.config[i] == "undefined") {
            this.config[i] = Jemplate.prototype.defaults[i];
        }
    }
}

proto.process = function(template, data, output) {
    var context = this.config.CONTEXT || new Jemplate.Context();
    context.config = this.config;

    context.stash = new Jemplate.Stash(this.config.STASH, this.config);

    context.__filter__ = new Jemplate.Filter();
    context.__filter__.config = this.config;

    context.__plugin__ = new Jemplate.Plugin();
    context.__plugin__.config = this.config;

    var result;

    var proc = function(input) {
        try {
            if (typeof context.config.PRE_PROCESS == 'string') context.config.PRE_PROCESS = [context.config.PRE_PROCESS];                
            for (var i = 0; i < context.config.PRE_PROCESS.length; i++) {
                context.process(context.config.PRE_PROCESS[i]);
            }
            
            result = context.process(template, input);
            
            if (typeof context.config.POST_PROCESS == 'string') context.config.PRE_PROCESS = [context.config.POST_PROCESS];
            for (i = 0; i < context.config.POST_PROCESS.length; i++) {
                context.process(context.config.POST_PROCESS[i]);
            }
        }
        catch(e) {
            if (! String(e).match(/Jemplate\.STOP\n/))
                throw(e);
            result = e.toString().replace(/Jemplate\.STOP\n/, '');
        }

        if (typeof output == 'undefined')
            return result;
        if (typeof output == 'function') {
            output(result);
            return null;
        }
        if (typeof(output) == 'string' || output instanceof String) {
            if (output.match(/^#[\w\-]+$/)) {
                var id = output.replace(/^#/, '');
                var element = document.getElementById(id);
                if (typeof element == 'undefined')
                    throw('No element found with id="' + id + '"');
                element.innerHTML = result;
                return null;
            }
        }
        else {
            output.innerHTML = result;
            return null;
        }

        throw("Invalid arguments in call to Jemplate.process");

        return 1;
    }

    if (typeof data == 'function')
        data = data();
    else if (typeof data == 'string') {
//        Jemplate.Ajax.get(data, function(r) { proc(Jemplate.JSON.parse(r)) });
        var url = data;
        Jemplate.Ajax.processGet(url, function(data) { proc(data) });
        return null;
    }

    return proc(data);
}

//------------------------------------------------------------------------------
// Jemplate.Context class
//------------------------------------------------------------------------------
if (typeof Jemplate.Context == 'undefined')
    Jemplate.Context = function() {};

proto = Jemplate.Context.prototype;

proto.include = function(template, args) {
    return this.process(template, args, true);
}

proto.process = function(template, args, localise) {
    if (localise)
        this.stash.clone(args);
    else
        this.stash.update(args);
    var func = Jemplate.templateMap[template];
    if (typeof func == 'undefined')
        throw('No Jemplate template named "' + template + '" available');
    var output = func(this);
    if (localise)
        this.stash.declone();
    return output;
}

proto.set_error = function(error, output) {
    this._error = [error, output];
    return error;
}

proto.plugin = function(name, args) {
    if (typeof name == 'undefined')
        throw "Unknown plugin name ':" + name + "'";

    // The Context object (this) is passed as the first argument to the plugin.
	var func = eval(name);
    return new func(this, args);
}

proto.filter = function(text, name, args) {
    if (name == 'null')
        name = "null_filter";
    if (typeof this.__filter__.filters[name] == "function")
        return this.__filter__.filters[name](text, args, this);
    else
        throw "Unknown filter name ':" + name + "'";
}

//------------------------------------------------------------------------------
// Jemplate.Plugin class
//------------------------------------------------------------------------------
if (typeof Jemplate.Plugin == 'undefined') {
    Jemplate.Plugin = function() { };
}

proto = Jemplate.Plugin.prototype;

proto.plugins = {};

//------------------------------------------------------------------------------
// Jemplate.Filter class
//------------------------------------------------------------------------------
if (typeof Jemplate.Filter == 'undefined') {
    Jemplate.Filter = function() { };
}

proto = Jemplate.Filter.prototype;

proto.filters = {};

proto.filters.null_filter = function(text) {
    return '';
}

proto.filters.upper = function(text) {
    return text.toUpperCase();
}

proto.filters.lower = function(text) {
    return text.toLowerCase();
}

proto.filters.ucfirst = function(text) {
    var first = text.charAt(0);
    var rest = text.substr(1);
    return first.toUpperCase() + rest;
}

proto.filters.lcfirst = function(text) {
    var first = text.charAt(0);
    var rest = text.substr(1);
    return first.toLowerCase() + rest;
}

proto.filters.trim = function(text) {
    return text.replace( /^\s+/g, "" ).replace( /\s+$/g, "" );
}

proto.filters.collapse = function(text) {
    return text.replace( /^\s+/g, "" ).replace( /\s+$/g, "" ).replace(/\s+/, " ");
}

proto.filters.html = function(text) {
    text = text.replace(/&/g, '&amp;');
    text = text.replace(/</g, '&lt;');
    text = text.replace(/>/g, '&gt;');
    text = text.replace(/"/g, '&quot;'); // " end quote for emacs
    return text;
}

proto.filters.html_para = function(text) {
    var lines = text.split(/(?:\r?\n){2,}/);
    return "<p>\n" + lines.join("\n</p>\n\n<p>\n") + "</p>\n";
}

proto.filters.html_break = function(text) {
    return text.replace(/(\r?\n){2,}/g, "$1<br />$1<br />$1");
}

proto.filters.html_line_break = function(text) {
    return text.replace(/(\r?\n)/g, "$1<br />$1");
}

proto.filters.uri = function(text) {
     return encodeURIComponent(text);
}
 
proto.filters.url = function(text) {
    return encodeURI(text);
}

proto.filters.indent = function(text, args) {
    var pad = args[0];
    if (! text) return null;
    if (typeof pad == 'undefined')
        pad = 4;

    var finalpad = '';
    if (typeof pad == 'number' || String(pad).match(/^\d$/)) {
        for (var i = 0; i < pad; i++) {
            finalpad += ' ';
        }
    } else {
        finalpad = pad;
    }
    var output = text.replace(/^/gm, finalpad);
    return output;
}

proto.filters.truncate = function(text, args) {
    var len = args[0];
    if (! text) return null;
    if (! len)
        len = 32;
    // This should probably be <=, but TT just uses <
    if (text.length < len)
        return text;
    var newlen = len - 3;
    return text.substr(0,newlen) + '...';
}

proto.filters.repeat = function(text, iter) {
    if (! text) return null;
    if (! iter || iter == 0)
        iter = 1;
    if (iter == 1) return text

    var output = text;
    for (var i = 1; i < iter; i++) {
        output += text;
    }
    return output;
}

proto.filters.replace = function(text, args) {
    if (! text) return null;
    var re_search = args[0];
    var text_replace = args[1];
    if (! re_search)
        re_search = '';
    if (! text_replace)
        text_replace = '';
    var re = new RegExp(re_search, 'g');
    return text.replace(re, text_replace);
}

//------------------------------------------------------------------------------
// Jemplate.Stash class
//------------------------------------------------------------------------------
if (typeof Jemplate.Stash == 'undefined') {
    Jemplate.Stash = function(stash, config) {
        this.__config__ = config;
		
		this.data = {
			GLOBAL : this.__config__.SCOPE			
		};
		this.LOCAL_ANCHOR = {};
		this.data.LOCAL = this.LOCAL_ANCHOR;
		
		this.update(stash);
    };
}

proto = Jemplate.Stash.prototype;

proto.clone = function(args) {
    var data = this.data;
    this.data = {
		GLOBAL : this.__config__.SCOPE
	};
	this.data.LOCAL = this.LOCAL_ANCHOR;
    this.update(data);
    this.update(args);
    this.data._PARENT = data;
}

proto.declone = function(args) {
    this.data = this.data._PARENT || this.data;
}

proto.update = function(args) {
    if (typeof args == 'undefined') return;
    for (var key in args) {
        if (key != 'GLOBAL' && key != 'LOCAL') {
	        this.set(key, args[key]);
		}
    }
}

proto.get = function(ident, args) {
    var root = this.data;
    
    var value;
    
    if ( (ident instanceof Array) || (typeof ident == 'string' && /\./.test(ident) ) ) {
        
        if (typeof ident == 'string') {
            ident = ident.split('.');
            var newIdent = [];
            for (var i = 0; i < ident.length; i++) {
                newIdent.push(ident.replace(/\(.*$/,''));
                newIdent.push(0);
            }
            ident = newIdent;
        }
        
        for (var i = 0; i < ident.length; i += 2) {
            var dotopArgs = ident.slice(i, i+2);
            dotopArgs.unshift(root);
            value = this._dotop.apply(this, dotopArgs);
            if (typeof value == 'undefined')
                break;
            root = value;
        }
    }
    else {
        value = this._dotop(root, ident, args);
    }

    if (typeof value == 'undefined' || value == null) {
        if (this.__config__.DEBUG_UNDEF)
            throw("undefined value found while using DEBUG_UNDEF");
        value = '';
    }

    return value;
}



proto.set = function(ident, value, set_default) {
    
    var root, result, error;
    
    root = this.data;
    
    while (true) {
        if ( (ident instanceof Array) || (typeof ident == 'string' && /\./.test(ident) ) ) {
            
            if (typeof ident == 'string') {
                ident = ident.split('.');
                var newIdent = [];
                for (var i = 0; i < ident.length; i++) {
                    newIdent.push(ident.replace(/\(.*$/,''));
                    newIdent.push(0);
                }
                ident = newIdent;
            }
            
            for (var i = 0; i < ident.length - 2; i += 2) {
                var dotopArgs = ident.slice(i, i+2);
                dotopArgs.unshift(root);
                dotopArgs.push(1);
                result = this._dotop.apply(this, dotopArgs);
                if (typeof value == 'undefined')
                    break;
                root = result;
            }
            
            var assignArgs = ident.slice(ident.length-2, ident.length);
            assignArgs.unshift(root);
            assignArgs.push(value);
            assignArgs.push(set_default);
            
            
            result = this._assign.apply(this, assignArgs);
        } else {
            result = this._assign(root, ident, 0, value, set_default);
        }
        break;
    }
    
    return (typeof result != 'undefined') ? result : '';
}



proto._dotop = function(root, item, args, lvalue) {    
    if (root == this.LOCAL_ANCHOR) root = this.data;
	var atroot = root == this.data;
    
    var value,result = undefined;
    
   	var is_function_call = args instanceof Array;
   	
   	args = args || [];
    
    if (typeof root == 'undefined' || typeof item == 'undefined' || typeof item == 'string' && item.match(/^[\._]/)) {
        return undefined;
    }


    //root is complex object, not scalar
    if (atroot || (root instanceof Object && !(root instanceof Array)) || root == this.data.GLOBAL) {
        
		if (typeof root[item] != 'undefined' && root[item] != null && (!is_function_call || !this.hash_functions[item])) { //consider undefined == null
            if (typeof root[item] == 'function') {
                result = root[item].apply(root,args);
            } else {
                return root[item];
            }
        } else if (lvalue) {
            return root[item] = {};
        } else if (this.hash_functions[item] && !atroot || item == 'import') {
            args.unshift(root);
            result = this.hash_functions[item].apply(this,args);
        } else if (item instanceof Array) {
            result = {};
            
            for (var i = 0; i < item.length; i++) result[item[i]] = root[item[i]];
            return result;
        }
    } else if (root instanceof Array) {
        if (this.list_functions[item]) {
            args.unshift(root);
            result = this.list_functions[item].apply(this,args);
        } else if (typeof item == 'string' && /^-?\d+$/.test(item) || typeof item == 'number' ) {
            if (typeof root[item] != 'function') return root[item];
            result = root[item].apply(this, args);
        } else if (item instanceof Array) {
            for (var i = 0; i < item.length; i++) result.push(root[item[i]]);
            return result;
        }
    } else if (this.string_functions[item] && !lvalue) {
        args.unshift(root);
        result = this.string_functions[item].apply(this, args);
    } else if (this.list_functions[item] && !lvalue) {
        args.unshift([root]);
        result = this.list_functions[item].apply(this,args);
    } else {
        result = undefined;
    }
    
    
    if (result instanceof Array) {
		if (typeof result[0] == 'undefined' && typeof result[1] != 'undefined') {
	        throw result[1];
	    }
	}
    
    return result;

}


proto._assign = function(root, item, args, value, set_default) {
    var atroot = root == this.data;
    var result;
    
    args = args || [];
    
    if (typeof root == 'undefined' || typeof item == 'undefined' || typeof item == 'string' && item.match(/^[\._]/)) {
        return undefined;
    }
    
    if (atroot || root.constructor == Object || root == this.data.GLOBAL) {
		
		if (root == this.LOCAL_ANCHOR) root = this.data;
			 
		if (!(set_default && typeof root[item] != 'undefined')) {
            if (atroot && item == 'GLOBAL') throw "Attempt to modify GLOBAL access modifier"
			if (atroot && item == 'LOCAL') throw "Attempt to modify LOCAL access modifier"
			
			return root[item] = value;
        } 
    } else if ((root instanceof Array) && (typeof item == 'string' && /^-?\d+$/.test(item) || typeof item == 'number' )) {
        if (!(set_default && typeof root[item] != 'undefined')) {
            return root[item] = value;
        }
    } else if ( (root.constructor != Object) && (root instanceof Object) ) {
        try {
            result = root[item].apply(root,args);
        } catch (e) {
        }
    } else {
        throw 'dont know how to assign to [' + root + '.' + item +']';
    }
    
    return undefined;
}


proto.string_functions = {};

// typeof
proto.string_functions['typeof'] = function(value) {
    return typeof value;
}

// chunk(size)     negative size chunks from end
proto.string_functions.chunk = function(string, size) {
    //var size = args;
    var list = new Array();
    if (! size)
        size = 1;
    if (size < 0) {
        size = 0 - size;
        for (var i = string.length - size; i >= 0; i = i - size)
            list.unshift(string.substr(i, size));
        if (string.length % size)
            list.unshift(string.substr(0, string.length % size));
    }
    else
        for (i = 0; i < string.length; i = i + size)
            list.push(string.substr(i, size));
    return list;
}

// defined         is value defined?
proto.string_functions.defined = function(string) {
    return 1;
}

// hash            treat as single-element hash with key value
proto.string_functions.hash = function(string) {
    return { 'value': string };
}

// length          length of string representation
proto.string_functions.length = function(string) {
    return string.length;
}

// list            treat as single-item list
proto.string_functions.list = function(string) {
    return [ string ];
}

// match(re)       get list of matches
proto.string_functions.match = function(string, re, modifiers) {
    var regexp = new RegExp(re, modifiers == undefined ? 'g' : modifiers);
    var list = string.match(regexp);
    return list;
}

// repeat(n)       repeated n times
proto.string_functions.repeat = function(string, args) {
    var n = args || 1;
    var output = '';
    for (var i = 0; i < n; i++) {
        output += string;
    }
    return output;
}

// replace(re, sub, global)    replace instances of re with sub
proto.string_functions.replace = function(string, re, sub, modifiers) {
    var regexp = new RegExp(re, modifiers == undefined ? 'g' : modifiers);    
    if (! sub) sub  = '';

    return string.replace(regexp, sub);
}

// search(re)      true if value matches re
proto.string_functions.search = function(string, re) {
    var regexp = new RegExp(re);
    return (string.search(regexp) >= 0) ? 1 : 0;
}

// size            returns 1, as if a single-item list
proto.string_functions.size = function(string) {
    return 1;
}

// split(re)       split string on re
proto.string_functions.split = function(string, re) {
    var regexp = new RegExp(re);
    var list = string.split(regexp);
    return list;
}



proto.list_functions = {};

// typeof
proto.list_functions['typeof'] = function(list) {
    return 'array';
};


proto.list_functions.list = function(list) {
    return list;
};

proto.list_functions.join = function(list, str) {
    return list.join(str);
};

proto.list_functions.sort = function(list,key) {
    if( typeof(key) != 'undefined' && key != "" ) {
        // we probably have a list of hashes
        // and need to sort based on hash key
        return list.sort(
            function(a,b) {
                if( a[key] == b[key] ) {
                    return 0;
                }
                else if( a[key] > b[key] ) {
                    return 1;
                }
                else {
                    return -1;
                }
            }
        );
    }
    return list.sort();
}

proto.list_functions.nsort = function(list) {
    return list.sort(function(a, b) { return (a-b) });
}

proto.list_functions.grep = function(list, re) {
    var regexp = new RegExp(re);
    var result = [];
    for (var i = 0; i < list.length; i++) {
        if (list[i].match(regexp))
            result.push(list[i]);
    }
    return result;
}

proto.list_functions.unique = function(list) {
    var result = [];
    var seen = {};
    for (var i = 0; i < list.length; i++) {
        var elem = list[i];
        if (! seen[elem])
            result.push(elem);
        seen[elem] = true;
    }
    return result;
}

proto.list_functions.reverse = function(list) {
    var result = [];
    for (var i = list.length - 1; i >= 0; i--) {
        result.push(list[i]);
    }
    return result;
}

proto.list_functions.merge = function(list /*, ... args */) {
    var result = [];
    var push_all = function(elem) {
        if (elem instanceof Array) {
            for (var j = 0; j < elem.length; j++) {
                result.push(elem[j]);
            }
        }
        else {
            result.push(elem);
        }
    }
    push_all(list);
    for (var i = 1; i < arguments.length; i++) {
        push_all(arguments[i]);
    }
    return result;
}

proto.list_functions.slice = function(list, start, end) {
    // To make it like slice in TT
    // See rt53453
    if ( end == -1 ) {
        return list.slice( start );
    }
    return list.slice( start, end + 1 );
}

proto.list_functions.splice = function(list /*, ... args */ ) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();
    
    return list.splice.apply(list,args);
}

proto.list_functions.push = function(list, value) {
    list.push(value);
    return list;
}

proto.list_functions.pop = function(list) {
    return list.pop();
}

proto.list_functions.unshift = function(list, value) {
    list.unshift(value);
    return list;
}

proto.list_functions.shift = function(list) {
    return list.shift();
}

proto.list_functions.first = function(list) {
    return list[0];
}

proto.list_functions.size = function(list) {
    return list.length;
}

proto.list_functions.max = function(list) {
    return list.length - 1;
}

proto.list_functions.last = function(list) {
    return list.slice(-1);
}

proto.hash_functions = {};

// typeof
proto.hash_functions['typeof'] = function(hash) {
    return 'object';
};


// each            list of alternating keys/values
proto.hash_functions.each = function(hash) {
    var list = new Array();
    for ( var key in hash )
        list.push(key, hash[key]);
    return list;
}

// exists(key)     does key exist?
proto.hash_functions.exists = function(hash, key) {
    return ( typeof( hash[key] ) == "undefined" ) ? 0 : 1;
}

// import(hash2)   import contents of hash2
// import          import into current namespace hash
proto.hash_functions['import'] = function(hash, hash2) {    
    for ( var key in hash2 )
        hash[key] = hash2[key];
    return '';
}

// keys            list of keys
proto.hash_functions.keys = function(hash) {
    var list = new Array();
    for ( var key in hash )
        list.push(key);
    return list;
}

// list            returns alternating key, value
proto.hash_functions.list = function(hash, what) {
    //var what = '';
    //if ( args )
        //what = args[0];

    var list = new Array();
    var key;
    if (what == 'keys')
        for ( key in hash )
            list.push(key);
    else if (what == 'values')
        for ( key in hash )
            list.push(hash[key]);
    else if (what == 'each')
        for ( key in hash )
            list.push(key, hash[key]);
    else
        for ( key in hash )
            list.push({ 'key': key, 'value': hash[key] });

    return list;
}

// nsort           keys sorted numerically
proto.hash_functions.nsort = function(hash) {
    var list = new Array();
    for (var key in hash)
        list.push(key);
    return list.sort(function(a, b) { return (a-b) });
}

// item           return a value by key
proto.hash_functions.item = function(hash, key) {
    return hash[key];
}

// size            number of pairs
proto.hash_functions.size = function(hash) {
    var size = 0;
    for (var key in hash)
        size++;
    return size;
}


// sort            keys sorted alphabetically
proto.hash_functions.sort = function(hash) {
    var list = new Array();
    for (var key in hash)
        list.push(key);
    return list.sort();
}

// values          list of values
proto.hash_functions.values = function(hash) {
    var list = new Array();
    for ( var key in hash )
        list.push(hash[key]);
    return list;
}

proto.hash_functions.pairs = function(hash) {
    var list = new Array();
    var keys = new Array();
    for ( var key in hash ) {
        keys.push( key );
    }
    keys.sort();
    for ( var key in keys ) {
        key = keys[key]
        list.push( { 'key': key, 'value': hash[key] } );
    }
    return list;
}

//  delete
proto.hash_functions.remove = function(hash, key) {
    return delete hash[key];
}
proto.hash_functions['delete'] = proto.hash_functions.remove;

//------------------------------------------------------------------------------
// Jemplate.Iterator class
//------------------------------------------------------------------------------
if (typeof Jemplate.Iterator == 'undefined') {
    Jemplate.Iterator = function(object) {
        if( object instanceof Array ) {
            this.object = object;
            this.size = object.length;
            this.max  = this.size -1;
        }
        else if ( object instanceof Object ) {
            this.object = object;
            var object_keys = new Array;
            for( var key in object ) {
                object_keys[object_keys.length] = key;
            }
            this.object_keys = object_keys.sort();
            this.size = object_keys.length;
            this.max  = this.size -1;
        } else if (typeof object == 'undefined' || object == null || object == '') {
            this.object = null;
            this.max  = -1;
        }
    }
}

proto = Jemplate.Iterator.prototype;

proto.get_first = function() {
    this.index = 0;
    this.first = 1;
    this.last  = 0;
    this.count = 1;
    return this.get_next(1);
}

proto.get_next = function(should_init) {
    var object = this.object;
    var index;
    if( typeof(should_init) != 'undefined' && should_init ) {
        index = this.index;
    } else {
        index = ++this.index;
        this.first = 0;
        this.count = this.index + 1;
        if( this.index == this.size -1 ) {
            this.last = 1;
        }
    }
    if (typeof object == 'undefined')
        throw('No object to iterate');
    if( this.object_keys ) {
        if (index < this.object_keys.length) {
            this.prev = index > 0 ? this.object_keys[index - 1] : "";
            this.next = index < this.max ? this.object_keys[index + 1] : "";
            return [this.object_keys[index], false];
        }
    } else {
        if (index <= this.max) {
            this.prev = index > 0 ? object[index - 1] : "";
            this.next = index < this.max ? object[index +1] : "";
            return [object[index], false];
        }
    }
    return [null, true];
}

var stubExplanation = "stub that doesn't do anything. Try including the jQuery, YUI, or XHR option when building the runtime";

Jemplate.Ajax = {

    get: function(url, callback) {
        throw("This is a Jemplate.Ajax.get " + stubExplanation);
    },

    processGet: function(url, callback) {
        throw("This is a Jemplate.Ajax.processGet " + stubExplanation);
    },

    post: function(url, callback) {
        throw("This is a Jemplate.Ajax.post " + stubExplanation);
    }

};

Jemplate.JSON = {

    parse: function(decodeValue) {
        throw("This is a Jemplate.JSON.parse " + stubExplanation);
    },

    stringify: function(encodeValue) {
        throw("This is a Jemplate.JSON.stringify " + stubExplanation);
    }

};

}());

;/*
    http://www.JSON.org/json2.js
    2009-04-16

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html

    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the object holding the key.

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*jslint evil: true */

/*global JSON */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/

// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.JSON) {
    this.JSON = {};
}
(function () {

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z';
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }

        return '';
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/.
test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

;;(function(){

Jemplate.Ajax = {

    get: function(url, callback) {
        var request = new XMLHttpRequest();
        request.open('GET', url, Boolean(callback));
        request.setRequestHeader('Accept', 'text/json; text/x-json; application/json');
        return this.request(request, null, callback);
    },

    processGet: function(url, processor) {
        this.get(url, function(responseText){
            processor(Jemplate.JSON.parse(responseText));
        });
    },

    post: function(url, data, callback) {
        var request = new XMLHttpRequest();
        request.open('POST', url, Boolean(callback));
        request.setRequestHeader('Accept', 'text/json; text/x-json; application/json');
        request.setRequestHeader(
            'Content-Type', 'application/x-www-form-urlencoded'
        );
        return this.request(request, data, callback);
    },

    request: function(request, data, callback) {
        if (callback) {
            request.onreadystatechange = function() {
                if (request.readyState == 4) {
                    if(request.status == 200)
                        callback(request.responseText);
                }
            };
        }
        request.send(data);
        if (!callback) {
            if (request.status != 200)
                throw('Request for "' + url +
                      '" failed with status: ' + request.status);
            return request.responseText;
        }
        return null;
    }
};

}());

;;(function(){

Jemplate.JSON = {

    parse: function(encoded) {
        return JSON.parse(encoded);
    },

    stringify: function(decoded) {
        return JSON.stringify(decoded);
    }

};

}());

;// Copyright 2007 Sergey Ilinsky (http://www.ilinsky.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

(function () {

	// Save reference to earlier defined object implementation (if any)
	var oXMLHttpRequest	= window.XMLHttpRequest;

	// Define on browser type
	var bGecko	= !!window.controllers,
		bIE		= window.document.all && !window.opera;

	// Constructor
	function cXMLHttpRequest() {
		this._object	= oXMLHttpRequest ? new oXMLHttpRequest : new window.ActiveXObject('Microsoft.XMLHTTP');
	};

	// BUGFIX: Firefox with Firebug installed would break pages if not executed
	if (bGecko && oXMLHttpRequest.wrapped)
		cXMLHttpRequest.wrapped	= oXMLHttpRequest.wrapped;

	// Constants
	cXMLHttpRequest.UNSENT				= 0;
	cXMLHttpRequest.OPENED				= 1;
	cXMLHttpRequest.HEADERS_RECEIVED	= 2;
	cXMLHttpRequest.LOADING				= 3;
	cXMLHttpRequest.DONE				= 4;

	// Public Properties
	cXMLHttpRequest.prototype.readyState	= cXMLHttpRequest.UNSENT;
	cXMLHttpRequest.prototype.responseText	= "";
	cXMLHttpRequest.prototype.responseXML	= null;
	cXMLHttpRequest.prototype.status		= 0;
	cXMLHttpRequest.prototype.statusText	= "";

	// Instance-level Events Handlers
	cXMLHttpRequest.prototype.onreadystatechange	= null;

	// Class-level Events Handlers
	cXMLHttpRequest.onreadystatechange	= null;
	cXMLHttpRequest.onopen				= null;
	cXMLHttpRequest.onsend				= null;
	cXMLHttpRequest.onabort				= null;

	// Public Methods
	cXMLHttpRequest.prototype.open	= function(sMethod, sUrl, bAsync, sUser, sPassword) {

		// Save async parameter for fixing Gecko bug with missing readystatechange in synchronous requests
		this._async		= bAsync;

		// Set the onreadystatechange handler
		var oRequest	= this,
			nState		= this.readyState;

		// BUGFIX: IE - memory leak on page unload (inter-page leak)
		if (bIE) {
			var fOnUnload	= function() {
				if (oRequest._object.readyState != cXMLHttpRequest.DONE)
					fCleanTransport(oRequest);
			};
			if (bAsync)
				window.attachEvent("onunload", fOnUnload);
		}

		this._object.onreadystatechange	= function() {
			if (bGecko && !bAsync)
				return;

			// Synchronize state
			oRequest.readyState		= oRequest._object.readyState;

			//
			fSynchronizeValues(oRequest);

			// BUGFIX: Firefox fires unneccesary DONE when aborting
			if (oRequest._aborted) {
				// Reset readyState to UNSENT
				oRequest.readyState	= cXMLHttpRequest.UNSENT;

				// Return now
				return;
			}

			if (oRequest.readyState == cXMLHttpRequest.DONE) {
				//
				fCleanTransport(oRequest);
// Uncomment this block if you need a fix for IE cache
/*
				// BUGFIX: IE - cache issue
				if (!oRequest._object.getResponseHeader("Date")) {
					// Save object to cache
					oRequest._cached	= oRequest._object;

					// Instantiate a new transport object
					cXMLHttpRequest.call(oRequest);

					// Re-send request
					oRequest._object.open(sMethod, sUrl, bAsync, sUser, sPassword);
					oRequest._object.setRequestHeader("If-Modified-Since", oRequest._cached.getResponseHeader("Last-Modified") || new window.Date(0));
					// Copy headers set
					if (oRequest._headers)
						for (var sHeader in oRequest._headers)
							if (typeof oRequest._headers[sHeader] == "string")	// Some frameworks prototype objects with functions
								oRequest._object.setRequestHeader(sHeader, oRequest._headers[sHeader]);

					oRequest._object.onreadystatechange	= function() {
						// Synchronize state
						oRequest.readyState		= oRequest._object.readyState;

						if (oRequest._aborted) {
							//
							oRequest.readyState	= cXMLHttpRequest.UNSENT;

							// Return
							return;
						}

						if (oRequest.readyState == cXMLHttpRequest.DONE) {
							// Clean Object
							fCleanTransport(oRequest);

							// get cached request
							if (oRequest.status == 304)
								oRequest._object	= oRequest._cached;

							//
							delete oRequest._cached;

							//
							fSynchronizeValues(oRequest);

							//
							fReadyStateChange(oRequest);

							// BUGFIX: IE - memory leak in interrupted
							if (bIE && bAsync)
								window.detachEvent("onunload", fOnUnload);
						}
					};
					oRequest._object.send(null);

					// Return now - wait untill re-sent request is finished
					return;
				};
*/
				// BUGFIX: IE - memory leak in interrupted
				if (bIE && bAsync)
					window.detachEvent("onunload", fOnUnload);
			}

			// BUGFIX: Some browsers (Internet Explorer, Gecko) fire OPEN readystate twice
			if (nState != oRequest.readyState)
				fReadyStateChange(oRequest);

			nState	= oRequest.readyState;
		};
		// Add method sniffer
		if (cXMLHttpRequest.onopen)
			cXMLHttpRequest.onopen.apply(this, arguments);

		this._object.open(sMethod, sUrl, bAsync, sUser, sPassword);

		// BUGFIX: Gecko - missing readystatechange calls in synchronous requests
		if (!bAsync && bGecko) {
			this.readyState	= cXMLHttpRequest.OPENED;

			fReadyStateChange(this);
		}
	};
	cXMLHttpRequest.prototype.send	= function(vData) {
		// Add method sniffer
		if (cXMLHttpRequest.onsend)
			cXMLHttpRequest.onsend.apply(this, arguments);

		// BUGFIX: Safari - fails sending documents created/modified dynamically, so an explicit serialization required
		// BUGFIX: IE - rewrites any custom mime-type to "text/xml" in case an XMLNode is sent
		// BUGFIX: Gecko - fails sending Element (this is up to the implementation either to standard)
		if (vData && vData.nodeType) {
			vData	= window.XMLSerializer ? new window.XMLSerializer().serializeToString(vData) : vData.xml;
			if (!this._headers["Content-Type"])
				this._object.setRequestHeader("Content-Type", "application/xml");
		}

		this._object.send(vData);

		// BUGFIX: Gecko - missing readystatechange calls in synchronous requests
		if (bGecko && !this._async) {
			this.readyState	= cXMLHttpRequest.OPENED;

			// Synchronize state
			fSynchronizeValues(this);

			// Simulate missing states
			while (this.readyState < cXMLHttpRequest.DONE) {
				this.readyState++;
				fReadyStateChange(this);
				// Check if we are aborted
				if (this._aborted)
					return;
			}
		}
	};
	cXMLHttpRequest.prototype.abort	= function() {
		// Add method sniffer
		if (cXMLHttpRequest.onabort)
			cXMLHttpRequest.onabort.apply(this, arguments);

		// BUGFIX: Gecko - unneccesary DONE when aborting
		if (this.readyState > cXMLHttpRequest.UNSENT)
			this._aborted	= true;

		this._object.abort();

		// BUGFIX: IE - memory leak
		fCleanTransport(this);
	};
	cXMLHttpRequest.prototype.getAllResponseHeaders	= function() {
		return this._object.getAllResponseHeaders();
	};
	cXMLHttpRequest.prototype.getResponseHeader	= function(sName) {
		return this._object.getResponseHeader(sName);
	};
	cXMLHttpRequest.prototype.setRequestHeader	= function(sName, sValue) {
		// BUGFIX: IE - cache issue
		if (!this._headers)
			this._headers	= {};
		this._headers[sName]	= sValue;

		return this._object.setRequestHeader(sName, sValue);
	};
	cXMLHttpRequest.prototype.toString	= function() {
		return '[' + "object" + ' ' + "XMLHttpRequest" + ']';
	};
	cXMLHttpRequest.toString	= function() {
		return '[' + "XMLHttpRequest" + ']';
	};

	// Helper function
	function fReadyStateChange(oRequest) {
		// Execute onreadystatechange
		if (oRequest.onreadystatechange)
			oRequest.onreadystatechange.apply(oRequest);

		// Sniffing code
		if (cXMLHttpRequest.onreadystatechange)
			cXMLHttpRequest.onreadystatechange.apply(oRequest);
	};

	function fGetDocument(oRequest) {
		var oDocument	= oRequest.responseXML;
		// Try parsing responseText
		if (bIE && oDocument && !oDocument.documentElement && oRequest.getResponseHeader("Content-Type").match(/[^\/]+\/[^\+]+\+xml/)) {
			oDocument	= new ActiveXObject('Microsoft.XMLDOM');
			oDocument.loadXML(oRequest.responseText);
		}
		// Check if there is no error in document
		if (oDocument)
			if ((bIE && oDocument.parseError != 0) || (oDocument.documentElement && oDocument.documentElement.tagName == "parsererror"))
				return null;
		return oDocument;
	};

	function fSynchronizeValues(oRequest) {
		try {	oRequest.responseText	= oRequest._object.responseText;	} catch (e) {}
		try {	oRequest.responseXML	= fGetDocument(oRequest._object);	} catch (e) {}
		try {	oRequest.status			= oRequest._object.status;			} catch (e) {}
		try {	oRequest.statusText		= oRequest._object.statusText;		} catch (e) {}
	};

	function fCleanTransport(oRequest) {
		// BUGFIX: IE - memory leak (on-page leak)
		oRequest._object.onreadystatechange	= new window.Function;

		// Delete private properties
		delete oRequest._headers;
	};

	// Internet Explorer 5.0 (missing apply)
	if (!window.Function.prototype.apply) {
		window.Function.prototype.apply	= function(oRequest, oArguments) {
			if (!oArguments)
				oArguments	= [];
			oRequest.__func	= this;
			oRequest.__func(oArguments[0], oArguments[1], oArguments[2], oArguments[3], oArguments[4]);
			delete oRequest.__func;
		};
	};

	// Register new object with window
	window.XMLHttpRequest	= cXMLHttpRequest;
})();


/*
   This JavaScript code was generated by Jemplate, the JavaScript
   Template Toolkit. Any changes made to this file will be lost the next
   time the templates are compiled.

   Copyright 2006-2008 - Ingy döt Net - All rights reserved.
*/

var Jemplate;
if (typeof(exports) == 'object') {
    Jemplate = require("jemplate").Jemplate;
}

if (typeof(Jemplate) == 'undefined')
    throw('Jemplate.js must be loaded before any Jemplate template files');

Jemplate.templateMap['cc8p.html'] = function(context) {
    if (! context) throw('Jemplate function called without context\n');
    var stash = context.stash;
    var output = '';

    try {
output += '<p>Name: Inline Grant Weekly Report #5 Type: post Date: November 22, 2014</p>\n\n<p><strong>Refinement</strong> and <strong>Releases</strong>. Those are the two words I (David) would use to describe what went on this week in the Inline Grant Project.</p>\n\n<h2>Thanks!</h2>\n\n<p>First, we would like to thank those members of the Perl Community who contributed their suggestions, work, and code to the Inline Grant Project. <strong>leont++</strong> presented a strong case (in the form of a cohesive code example) of how to clean up our <code>Makefile.PL</code> by moving work out of a <code>FixupMakefile</code> function, and into a <code>postamble</code> action. Whereas previously the <code>Makefile.PL</code> might have looked like this:</p>\n\n<pre><code>WriteMakefile(\n  …\n);\n\nFixupMakefile(\n  …\n);\n</code></pre>\n\n<p>Now they look like this:</p>\n\n<pre><code>WriteMakefile(\n  …\n  postamble =&gt; &#123;\n    inline =&gt; &#123; … &#125;,\n  &#125;,\n);\n</code></pre>\n\n<p>which is a lot cleaner because it works within &quot;the Perl toolchain system&quot; instead of layering an additional step into it. This is documented in <a href="https://metacpan.org/pod/Inline::Module::Tutorial">Inline::Module::Tutorial</a>.</p>\n\n<p>We also are receiving help from <strong>ether++</strong> on updating our <a href="https://metacpan.org/pod/Dist::Zilla::Plugin::InlineModule">Dist::Zilla::Plugin::InlineModule</a> plugin to work within this cleaner framework.</p>\n\n<p>Additionally, we released <a href="https://metacpan.org/pod/Module::Install::InlineModule">Module::Install::InlineModule</a>; a plugin to bring <a href="https://metacpan.org/pod/Inline">Inline</a> support to <a href="https://metacpan.org/pod/Module::Install">Module::Install</a> based distributions. So for those keeping score, we now support <a href="https://metacpan.org/pod/ExtUtils::MakeMaker">ExtUtils::MakeMaker</a>, <a href="https://metacpan.org/pod/Dist::Zilla">Dist::Zilla</a>, <a href="https://metacpan.org/pod/Zilla::Dist">Zilla::Dist</a>, and <a href="https://metacpan.org/pod/Module::Install">Module::Install</a> based distributions for <a href="https://metacpan.org/pod/Inline">Inline</a>.</p>\n\n<h2>Modules, Modules, Modules</h2>\n\n<p>We have also released the amazing <a href="https://metacpan.org/pod/Alt::Acme::Math::XS::EUMM">Alt::Acme::Math::XS::EUMM</a> in a new <a href="https://metacpan.org/pod/Module::Install">Module::Install</a> based version. Once again for the benefit of those keeping score, the Inline Grant Project has, to date, spawned eight new modules; some plugins, some proofs of concept, and of course <a href="https://metacpan.org/pod/Inline::Module">Inline::Module</a> itself. Additionally, it has directly contributed to new releases of <a href="https://metacpan.org/pod/Inline">Inline</a>, <a href="https://metacpan.org/pod/Inline::CPP">Inline::CPP</a>, <a href="https://metacpan.org/pod/Inline::C">Inline::C</a>, and many other support modules.</p>\n\n<p>This next week we intend to finish revamping the <a href="https://metacpan.org/pod/Dist::Zilla">Dist::Zilla</a> plugin, tackle <a href="https://metacpan.org/pod/Module::Build">Module::Build</a> support, add more tests, and finally convert a couple of pre-existing CPAN modules to Inline-based modules.</p>\n\n<p>It&#39;s gratifying to see the level of enthusiastic support this project has attracted from the Perl Community. We&#39;re seeing more familiar faces in <code>irc.perl.org#inline</code>, receiving more suggestions, and benefiting more from code contributions than ever before.</p>\n\n<p>As we move across the inchstones leading to the wrapping up of the Inline grant project, we are encouraged by the support that we&#39;ve seen, which demonstrates to us that the end of the grant will only be the beginning of the growth and revitalization of the Inline project.</p>\n';
    }
    catch(e) {
        var error = context.set_error(e, output);
        throw(error);
    }

    return output;
}

Jemplate.templateMap['dgq3.html'] = function(context) {
    if (! context) throw('Jemplate function called without context\n');
    var stash = context.stash;
    var output = '';

    try {
output += '<p>Name: Inline Grant Weekly Report #7 Type: post Date: December 6, 2014</p>\n\n<p>This week made great strides for Inline::Module. Last week, we talked about <strong>auto-stubbing</strong>. That&#39;s the automatic generation of little &quot;stub&quot; modules that proxy invocations of <a href="https://metacpan.org/pod/Inline">Inline</a>, so we can write simple code like this:</p>\n\n<pre><code>package My::Module;\nuse My::Module::Inline C =&gt; &#39;... C code here ...&#39;;\n</code></pre>\n\n<p>and have it do all the right things at the right times for <code>My::Module</code>. This obviously means that <code>My::Module::Inline</code> needs to exist somewhere, even though it is just a couple of lines of simple code.</p>\n\n<p>This week auto-stubbing is a reality and it works well! In fact, it turns out that the &quot;stub&quot; module never even needs to exist on disk. Read on!</p>\n\n<h2>Latest Developments</h2>\n\n<p>We got rid of the <code>bin</code> script: <code>perl-inline-module</code> that was used to generate stubs, like this:</p>\n\n<pre><code>perl-inline-module generate Acme::Math::XS::Inline\n</code></pre>\n\n<p>We replaced it with a simple one-liner:</p>\n\n<pre><code>perl -MInline::Module=makestub,Acme::Math::XS::Inline\n</code></pre>\n\n<p>That will generate the file: <code>lib/Acme/Math/XS/Inline.pm</code>. You can generate it under the <code>blib</code> directory like this:</p>\n\n<pre><code>perl -MInline::Module=makestub,Acme::Math::XS::Inline,blib\n</code></pre>\n\n<h2>Auto-Stubbing</h2>\n\n<p>I&#39;d call that <em>Explicit Stubbing</em>. <strong>DON&#39;T DO THAT!</strong></p>\n\n<p>Well you can if you want but the cool new way to use Inline::Module is with <strong>Auto</strong> Stubbing. Here&#39;s how you do it:</p>\n\n<pre><code>export PERL5OPT=-MInline::Module=autostub,Acme::Math::XS::Inline\n</code></pre>\n\n<p>Now whenever <code>Acme::Math::XS::Inline</code> is needed in development, it is provided/loaded as a Perl in-memory file object!</p>\n\n<p>You can also auto-stub to disk if you want:</p>\n\n<pre><code>export PERL5OPT=-MInline::Module=autostub,Acme::Math::XS::Inline,blib\n</code></pre>\n\n<p>but why would you want to? With the in-memory stubs, you don&#39;t need to worry about an extra file laying around.</p>\n\n<h2><code>blib/Inline/</code></h2>\n\n<p>This is a small change but now all the Inline build time stuff happens under the <code>blib/Inline/</code> directory. We had it building directly under <code>blib/</code> but since that is a well defined concept, it made things confusing.</p>\n\n<p>In general with this project, we are trying to extend Perl coding best-practices in ways that make XS module authoring as simple as possible, while not diverging very far from normal authoring styles.</p>\n\n<h2>Testing</h2>\n\n<p>We started writing tests that can verify all the processes we are imagining. Most of these tests so far are of the <code>xt</code> form. Since almost anything goes in <code>xt</code> I decided to write these tests in Bash instead of Perl. Since these tests are generally of the form: &quot;run this command, in this environment and see if these files exist, etc&quot;, Bash tests make sense.</p>\n\n<p>Some time ago I ported <a href="https://github.com/ingydotnet/test-more-bash">Test::More to Bash</a>. You can run them with <code>prove</code> justlike Perl tests. The <code>prove</code> command just looks at the <em>hashbang</em> line of the <code>.t</code> files and sees that it is Bash, and runs Bash instead. Here&#39;s an <a href="https://github.com/ingydotnet/inline-module-pm/blob/master/test/devel/generate-stub.t">example test file</a>. As you can see it is very simple and easy to understand. If you squint your eyes, it almost looks like Perl!</p>\n\n<h2>Next Steps</h2>\n\n<p>We should be wrapping this Grant project up soon. We still need to:</p>\n\n<ul>\n<li>Add Module::Build support</li>\n<li>Update all the pluins</li>\n<li>Update the docs</li>\n<li>Migrate a few real XS modules to Inline::Module</li>\n</ul>\n\n<p>Stay tuned. Inline Modules are becoming a reality!</p>\n';
    }
    catch(e) {
        var error = context.set_error(e, output);
        throw(error);
    }

    return output;
}

Jemplate.templateMap['ecf6.html'] = function(context) {
    if (! context) throw('Jemplate function called without context\n');
    var stash = context.stash;
    var output = '';

    try {
output += '<p>Name: Inline Grant Weekly Report #2 Type: post Date: November 2, 2014</p>\n\n<p>This week was a little bit slower but we made progress. We released new versions of <code>Acme::Math::XS</code> and created/released <code>Acme::Math::XS::XS</code>. The two modules are the same except the former uses <code>Inline::Module</code> and the latter uses plain old XS. The idea is to get them both working identically so that there is something concrete to compare.</p>\n\n<p>We did a bit of yak shaving early in the week. We wrote our own blog site software that we are growing up organically. We also patched and released <code>Swim.pm</code>, the markup formatter that all our writings are written in. We are trying to balance staying focused on finishing the grant on time, and also spawning as much cool stuff as we can along the way.</p>\n\n<p>Speaking of cool, we do all our work in a shared dev environment called PairUp™. It works wonderfully, but we wanted others to be able to watch along too (televised pair programming). The way to do this is with termcasting which shows the tmux session in a webpage, so anyone can watch along. Combine this with IRC, and it gets awesome. Unfortunately our termcasting setup was failing us. Fortunately we found <code>doy++</code> on IRC, brought him into our pairup, had him fix things (he&#39;s the master of termcasting) and then we got it working. Come by #inline sometime and watch for yourself.</p>\n\n<p>We further honed the Inline::Module dance. I&#39;ll try to explain it. When you create a module like <code>Foo::XS</code>, the <code>lib/Foo/XS.pm</code> module has a line like this:</p>\n\n<pre><code>use Foo::XS::Inline C =&gt; &quot;…&quot;;\n</code></pre>\n\n<p>That means you need a <code>lib/Foo/XS/Inline.pm</code>, and you get that with:</p>\n\n<pre><code>&gt; perl-inline-module create Foo::XS::Inline\n</code></pre>\n\n<p>The new, generated module looks (more or less) like this:</p>\n\n<pre><code>package Foo::XS::Inline;\nuse base &#39;Inline&#39;;\nuse Inline::Module &#39;v1&#39; =&gt; &#39;0.02&#39;;\n</code></pre>\n\n<p>When you run tests, this module uses <code>Inline::C</code> to build the <code>C</code> under <code>blib/</code> like normal XS.</p>\n\n<p>Now, here&#39;s the trick (and we haven&#39;t actually gotten it working yet)… when it&#39;s time build the dist we rearrange things:</p>\n\n<ol>\n<li>The version of <code>::Inline</code> above goes into the <code>inc/</code> directory</li>\n<li>The <code>::Inline</code> under lib becomes a small Dynaloader invoking module\n<ul>\n<li>This is what gets installed user side</li>\n</ul>\n\n</li>\n<li>The Makefile system is tweaked to build the Inline code at <code>make</code> time</li>\n</ol>\n\n<p>We should get this working in the next couple days. Note that the whole point here is to make something that:</p>\n\n<ul>\n<li>Works as good or better than hand-XS</li>\n<li>Is easy to distribute using any popular setup</li>\n<li>Installs stuff identically to XS</li>\n<li>Has <strong>no</strong> user dependencies (including no dep on anything Inline)</li>\n</ul>\n\n<p>In other news, David released <code>Inline::CPP</code> five times and got his cpantester&#39;s PASS rate up to an all-time high of 99.4%.</p>\n';
    }
    catch(e) {
        var error = context.set_error(e, output);
        throw(error);
    }

    return output;
}

Jemplate.templateMap['m6z3.html'] = function(context) {
    if (! context) throw('Jemplate function called without context\n');
    var stash = context.stash;
    var output = '';

    try {
output += '<p>Name: Inline Grant Weekly Report #3 Type: post Date: November 9, 2014</p>\n\n<p>David and Ingy try to get the weekly report out by Saturday night each week, in order to make the Perl Weekly cut. Last week and this week, Saturday drifted into Sunday. Last week was due to unexpected visitors and this week Ingy was wiped out after his Pittsburgh Perl Workshop talk:</p>\n\n<p><a href="https://www.youtube.com/watch?v=vDRLIjojlhg">https://www.youtube.com/watch?v=vDRLIjojlhg</a></p>\n\n<p>We had several great days of hacking this week. The goal was to get a fully working <code>Acme::Math::XS</code>, with these properties:</p>\n\n<ul>\n<li>Implemented with the new <code>Inline::Module</code></li>\n<li>Plain old <code>Makefile.PL</code></li>\n<li>Perl module with C code &quot;Inline&quot;</li>\n<li><code>perl Makefile.PL &amp;&amp; make test</code> works author side</li>\n<li><code>prove -lv t/</code> works (the same) author side</li>\n<li><code>make dist</code> builds a dist that:\n<ul>\n<li>Includes Inline::Module build support code (in <code>inc/</code>)</li>\n<li>Can build something to install user side, that:\n<ul>\n<li>Looks just like a normal XS install</li>\n<li>Doesn&#39;t need to install Inline</li>\n</ul>\n\n</li>\n</ul>\n\n</li>\n</ul>\n\n<p>This is consistent with what we said we&#39;d do in last week&#39;s report. We got this 90% done, and released a new <code>Acme::Math::XS</code>.</p>\n\n<p>The next steps are:</p>\n\n<ul>\n<li>Finish up <code>Inline::Module</code> good enough for a perfect <code>Acme::Math::XS</code></li>\n<li>Write tests for the various concerns and expectations</li>\n<li>Write up an Inline::Module tutorial</li>\n<li>Port different kinds of existing XS modules to Inline::Module</li>\n<li>Inline::Module support for common dist frameworks:\n<ul>\n<li>Dizt::Zilla</li>\n<li>Module::Build</li>\n<li>etc</li>\n</ul>\n\n</li>\n<li>Start filing bugs and nits as <a href="https://github.com/ingydotnet/inline-module-pm/issues">GitHub issues on Inline::Module</a></li>\n</ul>\n\n<p>After that, the grant goals will be mostly satisfied, and we will finish this one up!</p>\n';
    }
    catch(e) {
        var error = context.set_error(e, output);
        throw(error);
    }

    return output;
}

Jemplate.templateMap['mh4x.html'] = function(context) {
    if (! context) throw('Jemplate function called without context\n');
    var stash = context.stash;
    var output = '';

    try {
output += '<p>Name: Inline Grant Weekly Report #4 Type: post Date: November 15, 2014</p>\n\n<p>The major events of this week were:</p>\n\n<ul>\n<li>Wrote <a href="https://metacpan.org/pod/Inline::Module::Tutorial">Inline::Module::Tutorial</a></li>\n<li>Added Dist::Zilla support for <a href="https://metacpan.org/pod/Inline::Module">Inline::Module</a></li>\n<li>Added Zilla::Dist support for <a href="https://metacpan.org/pod/Inline::Module">Inline::Module</a></li>\n<li>Released 2 new example modules based on the above:\n<ul>\n<li><a href="https://metacpan.org/pod/Alt::Acme::Math::XS::DistZilla">Alt::Acme::Math::XS::DistZilla</a></li>\n<li><a href="https://metacpan.org/pod/Alt::Acme::Math::XS::ZillaDist">Alt::Acme::Math::XS::ZillaDist</a></li>\n</ul>\n\n</li>\n</ul>\n\n<h2>Inline::Module::Tutorial</h2>\n\n<p>This is a work in progress. It explains how to make an XS module using Inline in very basic, specific terms. It only details what we have implemented so far, although there are stub sections for upcoming things. Please give it a read and let us know what you think (in the form of Issues and/or Pull Requests on <a href="https://github.com/ingydotnet/inline-module-pm">https://github.com/ingydotnet/inline-module-pm</a>).</p>\n\n<h2>Dist::Zilla Support</h2>\n\n<p>This is a fun story.</p>\n\n<p>I(ingy) thought I knew how the Dist::Zilla stuff was going to work… I&#39;d simply add these lines to a <code>dist.ini</code>:</p>\n\n<pre><code>[InlineModule]\nmodule = Acme::Math::XS\ninline = Acme::Math::XS::Inline\nilsm = Inline::C\n</code></pre>\n\n<p>then write a <a href="https://metacpan.org/pod/Dist::Zilla::Plugin::InlineModule">Dist::Zilla::Plugin::InlineModule</a> and make it all work. In the end that&#39;s exactly what happened, although the path was bumpier than expected.</p>\n\n<p>I started by strolling over to #distzilla on IRC and asking ether++ a few dzil related questions. Then leont++ jumped in and wanted to know what was going on. I told him a bit and he thought I was getting some things wrong… So I invited him to start coding with me (PairUp style)!</p>\n\n<p>It took us a few minutes to get on the same page, but eventually we did. We got some basics into the plugin but then had to break for other stuff. When I came back, I got ether to PairUp for a while. Pretty soon we had a new module, just barely working well enough to release and then release the Acme module based off of it.</p>\n\n<p>TeamProgramming++! Thanks ether++ and leont++!</p>\n\n<h2>Zilla::Dist Support</h2>\n\n<p>Once we got DZ supported, supporting ZD was trivial. The only difference is where the data goes. In this case it goes in the <code>Meta</code> file (where all the meta data does):</p>\n\n<pre><code>=zild:\n  inline:\n    module: Acme::Math::XS\n    inline: Acme::Math::XS::Inline\n    ilsm: Inline::C\n</code></pre>\n\n<p>Of course, Zilla::Dist uses that info to generate the same <code>dist.ini</code> section above at <code>make release</code> time.</p>\n\n<h2>Talking About My Generation</h2>\n\n<p>It&#39;s a good time to pause, and realize that the whole of programming is pretty much just the <strong>generation</strong> of one thing from another. Programmers might not think about it that way all the time, but I(ngy) tend to <em>only</em> think about it that way.</p>\n\n<p>When I get frustrated by the ways that I need to manage text to make the computer understand my idea, I often step back and think &quot;What is the world I want to be in right now? How would I rather be doing this?&quot;. If I come up with a killer answer that works wonderfully on almost all levels, I make it so.</p>\n\n<p>I&#39;m not sure what drives other folks to make new modules and languages and tools, but that&#39;s a big part of my MO. Inline is like that and Inline::Module is too. What is the minimal info I need to tell the Perl toolchain to Make It So?</p>\n\n<p><code>&lt;/opinion&gt;</code></p>\n\n<h2>The Acme Example Modules</h2>\n\n<p>We&#39;ve rearranged the Acme::Math::XS git repo a bit. See this for details: <a href="https://github.com/ingydotnet/acme-math-xs-pm/blob/master/About.pod">https://github.com/ingydotnet/acme-math-xs-pm/blob/master/About.pod</a></p>\n\n<p>We&#39;ve made Acme::Math::XS::XS become Acme::Math::XS (and deprecated the former). This is the pure (no Inline) version. It s on the <code>xs</code> branch of the repo. All the Inline::Module versions will be released to CPAN using the <code>Alt</code> names listed in the link above.</p>\n\n<p>It is important to release this code as different modules, even though the code is exactly the same. We want to have proof that the modifications to the various build systems actually work in the wild.</p>\n\n<h2>Next Week</h2>\n\n<p>The next big step is definitely writing tests. Doing this type of work Test First would have caused too much churn early on. We needed to experiment and invent a non-trivial process that didn&#39;t exist. Now that we see it clearly, writing tests (and TDD) is the right choice.</p>\n\n<p>We now have real, usable, open source software on GitHub, so the roadmap and problems will start being expressed as Issues: <a href="https://github.com/ingydotnet/inline-module-pm/issues">https://github.com/ingydotnet/inline-module-pm/issues</a></p>\n\n<p>Finally, we need to convert some real XS modules like:</p>\n\n<ul>\n<li>Ingy&#39;s <a href="https://metacpan.org/pod/YAML::XS">YAML::XS</a></li>\n<li>David&#39;s <a href="https://metacpan.org/pod/Math::Prime::FastSieve">Math::Prime::FastSieve</a></li>\n</ul>\n\n<p>to use Inline::Module. This will happen first under the Alt namespace, then once they pass all tests same as the originals, we can make the real ones use Inline::Module.</p>\n\n<p>I encourage interested people to do the same (but maybe wait until next week to start :).</p>\n';
    }
    catch(e) {
        var error = context.set_error(e, output);
        throw(error);
    }

    return output;
}

Jemplate.templateMap['n6sv.html'] = function(context) {
    if (! context) throw('Jemplate function called without context\n');
    var stash = context.stash;
    var output = '';

    try {
output += '<p>Name: Inline Grant Weekly Report #6 Type: post Date: December 1, 2014</p>\n\n<p><strong>Happy belated Thanksgiving!!!</strong></p>\n\n<p>Last week was a bit slow on the Inline front. Not much code got done but one important idea came along that (potentially) simplifies the whole Inline::Module dance. We call it <em>auto-stubbing</em>.</p>\n\n<h2>Auto-Stubbing</h2>\n\n<p>When a module has Inline C (or C++) code in it, it needs a <strong>stub</strong> module to invoke Inline and/or dynaload a shared library. This stub is <em>generated code</em>. We had a command for the module auhor to generate it:</p>\n\n<pre><code>perl-inline-module generate Acme::Math::XS::Inline\n</code></pre>\n\n<p>and we assumed authors would commit this code, and regenerate it from time to time as Inline::Module required it to change.</p>\n\n<p>(<strong>NOTE:</strong> <em>This is all about author side experience. The user side installation process and result remains the same.</em>)</p>\n\n<p>Last week we called <strong>BS</strong> on that:</p>\n\n<ul>\n<li>Generated code should be automagic</li>\n<li>Generated code should not get committed if possible</li>\n</ul>\n\n<p>We think we figured out how to make this work in a few styles that will fit in with various module author development styles. One of our goals is that when you use Inline::Module, you can test using the pure Perl mantra:</p>\n\n<pre><code>prove -lv t/\n</code></pre>\n\n<p>But at this point it is too late to autostub. We need something to happen just before that. One idea is to do this:</p>\n\n<pre><code>PERL5OPT=&#39;-MInline::Module=autostub&#39; prove -lv t/\n</code></pre>\n\n<p>or:</p>\n\n<pre><code>export PERL5OPT=&#39;-MInline::Module=autostub&#39;\n... later on ...\nprove -lv t/\n</code></pre>\n\n<p>This adds a CODE ref to <code>@INC</code> to do the autostubbing, just in time.</p>\n\n<p>We&#39;ll have a few ways to do it, so that if you are someone who likes to do everything explicitly, you can still just:</p>\n\n<pre><code>perl-inline-module generate Acme::Math::XS::Inline\n</code></pre>\n\n<p>This autostubbing should be done in the next couple days. We&#39;ll let you know how it turned out in the next review.</p>\n';
    }
    catch(e) {
        var error = context.set_error(e, output);
        throw(error);
    }

    return output;
}

Jemplate.templateMap['se9g.html'] = function(context) {
    if (! context) throw('Jemplate function called without context\n');
    var stash = context.stash;
    var output = '';

    try {
output += '<p>Name: Inline Grant Weekly Report #1 Type: post Date: October 25, 2014</p>\n\n<p>We (David and Ingy) had a productive week bootstrapping the <strong>Inline-for-XS-Modules</strong> project. Our primary optimization flags are:</p>\n\n<pre><code>-Opublic\n-Oagile\n-Ocreative\n-Ofun\n</code></pre>\n\n<p>Here are some highlights:</p>\n\n<ul>\n<li>All work being done publicly:\n<ul>\n<li>David and Ingy code in remote <strong>PairUp™</strong> session (tmux)</li>\n<li>All realtime communication in <strong>IRC</strong> (irc.perl.org#inline)</li>\n<li>Tmux to be <strong>termcast</strong>ed soon (live terminal in a browser)</li>\n<li>If you are interested, come join us!</li>\n</ul>\n\n</li>\n<li>Figured out a decent <strong>Inline Module API</strong> strategy\n<ul>\n<li>Authors do 3 simple new things to ship Inline code to CPAN</li>\n<li><strong>No end-user dependency</strong> on Inline for these modules</li>\n<li>End result is essentially same as hand written XS</li>\n</ul>\n\n</li>\n<li>Plans to support:\n<ul>\n<li>5-6 build systems: ie <code>Dist::Zilla</code>, <code>Module::Build</code>, etc</li>\n<li>Many Inline languages (other than C/C++ <em>might</em> work)</li>\n<li>Different extension module use cases: inline/external/libraries</li>\n</ul>\n\n</li>\n<li>Created specification document: <a href="http://inline.ouistreet.com/node/v3e7.html">http://inline.ouistreet.com/node/v3e7.html</a></li>\n<li>Released two new CPAN modules:\n<ul>\n<li><strong>Inline::Module</strong> (The majority of the grant coding)</li>\n<li><strong>Acme::Math::XS</strong> (first test module using Inline::C)</li>\n</ul>\n\n</li>\n<li>Created a <strong>new blog site</strong> to document the Inline Grant Project\n<ul>\n<li><a href="http://inline.ouistreet.com/">http://inline.ouistreet.com/</a></li>\n<li>A new site using some of our other loved technologies: Cog, Coffee, make, Swim, Jemplate, gh-pages, BootStrap</li>\n</ul>\n\n</li>\n</ul>\n\n<p>It is our hope to finish out most of the work in the next 2 weeks, and then work on bug reports after that. We plan to keep putting out blog posts/reports for at least a couple months after the grant is complete. We believe this work will make Extension Module Authoring a lot more accessible, and we want to keep the energy flowing.</p>\n\n<p>Here&#39;s a tiny example of how to make an Inline Extension Module. Take this one-liner:</p>\n\n<pre><code>perl -E &#39;use Inline C=&gt;&quot;int add(int a, int b)&#123;return a+b;&#125;&quot;;say add(2,2)&#39;\n</code></pre>\n\n<p>Turn it into this module:</p>\n\n<pre><code>package Acme::Math::XS;\nour $VERSION = &#39;0.0.1&#39;;\nuse Acme::Math::XS::Inline C =&gt; &quot;int add(int a, int b) &#123;return a + b;&#125;&quot;;\n</code></pre>\n\n<p>Install Inline::Module:</p>\n\n<pre><code>cpanm Inline::Module\n</code></pre>\n\n<p>Run this command line:</p>\n\n<pre><code>&gt; perl-inline-module create Acme::Math::XS::Inline\n</code></pre>\n\n<p>Add this line to your <code>dist.ini</code>:</p>\n\n<pre><code>[InlineModule]\n</code></pre>\n\n<p>Ship it:</p>\n\n<pre><code>dzil release\n</code></pre>\n\n<p>One advantage we&#39;ve seen so far is that simple developer testing, just works:</p>\n\n<pre><code>prove -l t/\n</code></pre>\n\n<p>There&#39;s no need to run <code>make</code> to build the C/C++/XS in <code>blib</code> and then add <code>-b</code> to the <code>prove</code> flags, because this is <strong>Inline</strong>!</p>\n';
    }
    catch(e) {
        var error = context.set_error(e, output);
        throw(error);
    }

    return output;
}

Jemplate.templateMap['v3e7.html'] = function(context) {
    if (! context) throw('Jemplate function called without context\n');
    var stash = context.stash;
    var output = '';

    try {
output += '<p>Name: Inline Module Spec</p>\n\n<p>How Inline Can be used in place of XS for CPAN</p>\n\n<h1>Overview</h1>\n\n<p>This is a specification of how Inline.pm will be made to be the easy (and hopefully preferred) method of writing &quot;extension&quot; (&quot;XS&quot;) modules for Perl 5.</p>\n\n<p>People who extend Perl 5 code with <code>Inline</code>, <code>Inline::C</code> and <code>Inline::CPP</code>, should be able to use the same techniques to ship code as modules for CPAN, with as little extra effort as possible.</p>\n\n<p>In October 2014, The Perl Foundation (TPF) accepted a grant from CPAN authors Ingy döt Net and David Oswald, to do just that.</p>\n\n<h1>Basics</h1>\n\n<p>Here is a trivial Perl program/script that uses Inline:</p>\n\n<pre><code>use Inline C =&gt; &quot;int add(int a, int b) &#123;return a + b;&#125;\nprint &quot;2 + 2 = &quot;, add(2, 2), &quot;\\n&quot;;\n</code></pre>\n\n<p>It should be possible to turn that into an <em>extension</em> module that looks like this:</p>\n\n<pre><code>package Acme::Math::XS;\nuse strict;\nuse warnings;\nour $VERSION = &#39;0.0.1&#39;;\nuse Exporter &#39;import&#39;;\nour @EXPORT = qw( add );\nuse Inline C =&gt; &quot;int add(int a, int b) &#123;return a + b;&#125;\n1;\n</code></pre>\n\n<p>Usage:</p>\n\n<pre><code>use Acme::Math::XS;\nprint &quot;2 + 2 = &quot;, add(2, 2), &quot;\\n&quot;;\n</code></pre>\n\n<p>We a CPAN user installs this, the result should be very close to the same as if they had used XS.</p>\n\n<p>Currently this doesn&#39;t work well, because the Inline builds (compiles) things on the first runtime, and it doesn&#39;t save the compilation units into the standard (CPAN install) places. We want to let Inline know that it is building for permanent installation, and also we want to trigger it during the normal <code>make</code> phase.</p>\n\n<h1>Environmental Concerns</h1>\n\n<p>Inline-style modules have a few concerns that must be addressed by this project. In Perl, TMTOWTDI! Inline modules must work under different module distribution frameworks, various extension coding styles, must support multiple extension languages, and must DTRT in several different runtime scenarios.</p>\n\n<h2>Module Building Environments</h2>\n\n<p>Inline modules will be made to work easily under these popular setups:</p>\n\n<dl>\n<dt><code>ExtUtils::MakeMaker</code></dt>\n<dd><br/>\n<p>ie the old style <code>Makefile.PL</code> setup.</p>\n\n<dd>\n<dt><code>Module::Build</code></dt>\n<dd><br/>\n<p>The pure Perl way to distribute modules.</p>\n\n<dd>\n<dt><code>Module::Install</code></dt>\n<dd><br/>\n<p>This style is somewhat dated, but possibly the easiest to support.</p>\n\n<dd>\n<dt><code>Dist::Zilla</code></dt>\n<dd><br/>\n<p>The popular new way.</p>\n\n<dd>\n<dt><code>Zilla::Dist</code></dt>\n<dd><br/>\n<p>Ingy&#39;s new abstraction over <code>Dist::Zilla</code>.</p>\n\n<dd>\n<dt><code>Distar</code></dt>\n<dd><br/>\n<p>mst&#39;s distribution style.</p>\n\n<dd>\n</dl>\n\n<h2>Extension Styles</h2>\n\n<p>When people write XS module, there are a few different common use cases.</p>\n\n<dl>\n<dt>True <em>inline</em> functional</dt>\n<dd><br/>\n<p>This is when you just want some hot subroutines to be written in a faster language for performance gains. The C code can stay inside the (mostly) Perl module.</p>\n\n<dd>\n<dt>All (or mostly) C code</dt>\n<dd><br/>\n<p>Some XS modules are almost entirely C or C++ code made to work in Perl. In this case the code almost certainly lives in external files (not Inline). <code>Inline.pm</code> can still be used to make life easier.</p>\n\n<dd>\n<dt>Library binding modules</dt>\n<dd><br/>\n<p>Often XS is used to bind a popular C library to Perl. Like <code>YAML::XS</code> binding <code>libyaml</code> to Perl.</p>\n\n<dd>\n<dt>Mix and match</dt>\n<dd><br/>\n<p>The above styles can be used in any combination.</p>\n\n<dd>\n</dl>\n\n<h2>Extension Languages</h2>\n\n<p>The grant calls calls for support of C and C++, and certainly those are the most common ways to do this kind of thing. However, the Inline framework will be setup in such a way that it will be (at least theoretically) possible to use and Inline language support module (ILSM), given that the author adds the new API parts.</p>\n\n<h2>Runtime Scenarios</h2>\n\n<p>When developing Perl modules (and running their tests) there are several distinct runtime scenarios, and Inline modules must Do The Right Things at the right times.</p>\n\n<dl>\n<dt><code>prove -lbv t</code></dt>\n<dd><br/>\n<p>ie basic development testing. C/C++ code must compile when changed and prior to being run. This should not require the developer to think about it.</p>\n<p>Note: this should be a clear win over XS, where <code>perl Makefile.PL &amp;&amp; make</code> must be done after every XS change.</p>\n\n<dd>\n<dt>Distribution testing</dt>\n<dd><br/>\n<p>The final tests run in a simulated install environment before creating a distribution tarball to CPAN. ie <code>dzil test</code>.</p>\n\n<dd>\n<dt>Pre-dist-build</dt>\n<dd><br/>\n<p>Certain things must happen to the code to prepare it for distribution.</p>\n\n<dd>\n<dt>User side build</dt>\n<dd><br/>\n<p>When the user who is installing the distribution, executes the <em>build</em> phase, the correct things must happen so that the proper things get into blib after being compiled to work on that particular machine/environment.</p>\n\n<dd>\n<dt>User side testing</dt>\n<dd><br/>\n<p>Before installation, the code is tested and must behave correctly.</p>\n\n<dd>\n<dt>Final end-user runtime</dt>\n<dd><br/>\n<p>aka Production. The code must run indistinguishable from an XS module.</p>\n\n<dd>\n</dl>\n\n<p>This might seems like a lot of scenarios with some of them being duplicates, but we really think that each of them are slightly different. They should all at least be considered and tested.</p>\n\n<h1>Inline::Module Implementation</h1>\n\n<p>The rest of the spec talks about what Inline must do to accomplish these tasks. This is very speculative at this point, and is expected to change during early development.</p>\n\n<h2>Author-side Responsibilities</h2>\n\n<p>A person who has used Inline::C and now wants to ship it to CPAN as an <em>XS</em> module has to change a few things. Let&#39;s continue with the <code>Acme::Math::XS</code> example.</p>\n\n<p>The first thing to do is change <code>use Inline</code> to <code>use Acme::Math::XS::Inline</code>. In other words, they change this:</p>\n\n<pre><code>use Inline C =&gt; …\n</code></pre>\n\n<p>to this:</p>\n\n<pre><code>use Acme::Math::XS::Inline C =&gt; …\n</code></pre>\n\n<p>The author will ship <code>Acme::Math::XS::Inline</code> as part of the distribution, but this module will not be hand-written by them. This is how the magic happens.</p>\n\n<p>The author needs to run this command one time:</p>\n\n<pre><code>perl-inline-module\n</code></pre>\n\n<p>This will create a file: <code>lib/Acme/Math/XS/Inline.pm</code>. This module is smart enough to keep everything during the development phase up to date.</p>\n\n<p>The author must also add one or two lines to the dist framework control file (ie <code>Makefile.PL</code>, <code>Build.pl</code>, <code>dist.ini</code>, <code>Meta</code>, etc) that tells the build system that special things must happen at special times. This line will differ per dist system, but effectively will look like:</p>\n\n<pre><code>perl-inline-module\n</code></pre>\n\n<p>After that, everything should just work. The author can code, change and ship C or C++ code in the same manner as a pure Perl module.</p>\n\n<h2>How it Works</h2>\n\n<p>The basic (strawman) idea is this: the special module called <code>Acme::Math::XS::Inline</code> has 3 completely different forms at three different points in time:</p>\n\n<dl>\n<dt>Development Form (<code>lib/Foo/Inline.pm</code>)</dt>\n<dd><br/>\n<p>When you run <code>perl-inline-module</code>, it loads all the modules under lib, and intercepts the <code>use Foo::Inline</code> statements, and generates the <code>lib/Foo/Inline.pm</code> modules. This ends up being a proxy module to <code>Inline.pm</code> but with some module configuration changes. ie Stuff gets built automatically into <code>blib</code> (and rebuilt when C code changes).</p>\n\n<dd>\n<dt>User Build Form (<code>inc/Foo/Inline.pm</code>)</dt>\n<dd><br/>\n<p>This is a special &quot;build&quot; time module that runs during installation, and <em>shadows</em> the real (to be installed) module. It builds the extension libary into blib.</p>\n\n<dd>\n<dt>Production/Installed Form (<code>Foo-0.0.1/lib/Foo/Inline.pm</code>)</dt>\n<dd><br/>\n<p>This little shim is what gets installed during a <code>make install</code>. It is just a little wrapper around <code>DynaLoader</code>. It never builds code; just loads installed code.</p>\n\n<dd>\n</dl>\n\n<h1>Inline::Module Development Strategy</h1>\n\n<p>Our first task is to prototype this setup using a new toy module: <code>Acme::Math::XS</code>. Then we adjust the spec based on our findings.</p>\n\n<h2>Implementation Notes</h2>\n\n<ul>\n<li>Extension modules made with Inline.pm do NOT have a dependency on Inline.\n<p>In fact, they have no additional dependencies introduced by Inline.</p>\n\n</li>\n<li>At least to start, all the new code will be distributed under <code>Inline::Module</code>.\n<p>Later the code will likely be merged into Inline.</p>\n\n</li>\n</ul>\n';
    }
    catch(e) {
        var error = context.set_error(e, output);
        throw(error);
    }

    return output;
}

Jemplate.templateMap['y5yq.html'] = function(context) {
    if (! context) throw('Jemplate function called without context\n');
    var stash = context.stash;
    var output = '';

    try {
output += '<p>Name: Inline Grant Accepted Type: post Date: October 20, 2014</p>\n\n<p>(or <strong>How I Learned to Stop Worrying and Love The Perl</strong>)</p>\n\n<p>Last week I returned from 3 weeks of adventure in Berlin and Netherland. Funny story… the night I arrived at Liz and Wendy&#39;s place, I was made aware of 2 things:</p>\n\n<ul>\n<li>Liz is on the TPF grant board</li>\n<li>She had a surprise for me, but couldn&#39;t tell me until midnight :)</li>\n</ul>\n\n<p>Spoiler: <a href="http://news.perlfoundation.org/2014/09/grant-proposal-inlinecpp-modul.html">The Inline Grant</a> was approved!</p>\n\n<p>The following evening, I attended the amsterdamx.pm (expats) at Booking.com++ HQ, and upon entering the meeting room, was asked by SawyerX if I could give a talk since ribasushi was stuck in traffic. Huh? WTF? Definitely! :) In the kind of coincidence that only happens regularly in the world of Perl, Karen Pauley happened to be there as well, not to mention Stevan, Jarrko and Dan Kogai! I rambled on about a dozen things that were currently loaded into ingy-RAM, but held off on talking about the grant as it hadn&#39;t been made public just yet.</p>\n\n<p>7 days to the minute later I gave a talk at amsterdam.pm and the main subject was the Inline grant. Instead of a talk, I gave a &quot;listen&quot;! I asked everyone there how they would go about actually implementing the grant solution. I got a lot of ideas, and since then I think I&#39;ve figured it out. Stay tuned…</p>\n\n<h2>Welcome to the Inline Grant blog!</h2>\n\n<p>I think this is the first TPF grant to be given to a pair of pair programmers! David and I want to make things as open as we can, so we plan to give weekly updates in addition to the TPF monthly status updates.</p>\n\n<p>Today (October 20th) marks the start of work in earnest on the grant. The delay is due to my unexpected but most fruitful trip to Europe. I&#39;m dejetlagged and ready to hack! David has also just finished a lovely family vacation (to Zion and Bryce National Parks (YAPC::15 attendees with wheels should take note!)).</p>\n\n<p>We really want to thank the community for this opportunity to make Perl better!</p>\n';
    }
    catch(e) {
        var error = context.set_error(e, output);
        throw(error);
    }

    return output;
}

Jemplate.templateMap['y6ut.html'] = function(context) {
    if (! context) throw('Jemplate function called without context\n');
    var stash = context.stash;
    var output = '';

    try {
output += '<p>Name: Ingy and David Bio</p>\n\n<h2>Ingy döt Net</h2>\n\n<p>Ingy is the original creator of <code>Inline</code> and <code>Inline::C</code>. His primary focus in Perl is to bring the &quot;hard&quot; things into the hands of beginners.</p>\n\n<ul>\n<li>Ingy döt Net &lt;ingy@ingy.net&gt;</li>\n<li><a href="http://ingy.net">http://ingy.net</a></li>\n<li><a href="https://github.com/ingydotnet">https://github.com/ingydotnet</a></li>\n<li><a href="https://twitter.com/ingydotnet">https://twitter.com/ingydotnet</a></li>\n</ul>\n\n<h2>David Oswald</h2>\n\n<p>David has been maintaining <code>Inline::CPP</code> for four years, and is the only person to have made releases on <code>Inline::CPP</code> since 2003.</p>\n\n<ul>\n<li>David Oswald &lt;daoswald@gmail.com&gt;</li>\n<li><a href="https://github.com/daoswald">https://github.com/daoswald</a></li>\n<li><a href="https://twitter.com/doswaldcal">https://twitter.com/doswaldcal</a></li>\n</ul>\n\n<hr/>\n\n<p>Ingy and David work well together and have decided to collaborate on a number of big projects that benefit Perl and Software Development. Inline was the obvious first choice.</p>\n';
    }
    catch(e) {
        var error = context.set_error(e, output);
        throw(error);
    }

    return output;
}

Jemplate.templateMap['zfp7.html'] = function(context) {
    if (! context) throw('Jemplate function called without context\n');
    var stash = context.stash;
    var output = '';

    try {
output += '<p>Name: Inline Grant Weekly Report #8 Type: post Date: December 14, 2014</p>\n\n<p>This was another big week for Inline::Module and friends. This is the week that modules using Inline::Module start getting out to CPAN. This even includes the first one written by someone, not working directly on the project! Read on.</p>\n\n<h2>So Many Modules!</h2>\n\n<p>This report will be organized by the modules created and updated this week.</p>\n\n<h2><code>R.pm</code></h2>\n\n<p>The hacker known as <code>sivoais</code> on IRC #inline, started a project to embed the &quot;R&quot; language in Perl. It uses <a href="https://metacpan.org/pod/PDL">PDL</a> and <a href="https://metacpan.org/pod/Inline::C">Inline::C</a>. This week he got the whole thing to work using <a href="https://metacpan.org/pod/Inline::Module">Inline::Module</a> and <a href="https://metacpan.org/pod/Dist::Zilla::Plugin::InlineModule">Dist::Zilla::Plugin::InlineModule</a>. It&#39;s not yet shipped to CPAN, but the repo is <a href="https://github.com/zmughal/embedding-r-in-perl-experiment">here</a>.</p>\n\n<p>I suspect it will be on CPAN soon. The <code>dzil build</code> command produces a working dist that has Inline::Module and Inline::C support to do all the XS work easily. That&#39;s what this grant is all about. Thanks sivoais! (aka ZMUGHAL on CPAN)</p>\n\n<h2><code>Alt::Math::Prime::FastSieve::Inline</code></h2>\n\n<p>David wrote <a href="https://metacpan.org/pod/Math::Prime::FastSieve">Math::Prime::FastSieve</a> a few years ago, to show off using <a href="https://metacpan.org/pod/Inline::CPP">Inline::CPP</a> for a CPAN module. He was able to do it, but it had an <a href="https://metacpan.org/pod/Inline">Inline</a> requirement. (Ditching that requirement is a primary goal of this project).</p>\n\n<p>This week we released it as <a href="https://metacpan.org/pod/Alt::Math::Prime::FastSieve::Inline">Alt::Math::Prime::FastSieve::Inline</a> using the latest <a href="https://metacpan.org/pod/Inline::Module">Inline::Module</a>. This required some refactoring of <a href="https://metacpan.org/pod/Inline::CPP">Inline::CPP</a>. See below.</p>\n\n<h2><code>Inline::CPP</code></h2>\n\n<p>We needed to bring <a href="https://metacpan.org/pod/Inline::CPP">Inline::CPP</a> into closer parity with <a href="https://metacpan.org/pod/Inline::C">Inline::C</a> (in the parser department). Basically we moved <a href="https://metacpan.org/pod/Inline::CPP::Grammar">Inline::CPP::Grammar</a> to <a href="https://metacpan.org/pod/Inline::CPP::Parser::RecDescent">Inline::CPP::Parser::RecDescent</a>. This also makes Inline::CPP work with Inline&#39;s <code>using</code> directive.</p>\n\n<p>This let us do the right thing from <a href="https://metacpan.org/pod/Inline::Module">Inline::Module</a> and after that <code>C++</code> Just Worked™. Note that even though Inline::CPP uses both Inline and Inline::C, no changes were required to those two modules. (No change, is good change).</p>\n\n<h2><code>Dist::Zilla::Plugin::InlineModule</code></h2>\n\n<p>In order for <code>sivoais</code> to use Inline::Module, we needed to update the <a href="https://metacpan.org/pod/Dist::Zilla">Dist::Zilla</a> plugin to work with the latest code. Ironically, sivoais himself did most of the work. Ingy pulled him into a realtime PairUp™ session and soon it was done. Dist::Zilla superstar <code>ether++</code> helped us find a couple of the deep magic requirements that were needed to make it all work.</p>\n\n<p>The <a href="https://metacpan.org/pod/Dist::Zilla::Plugin::InlineModule">Dist::Zilla::Plugin::InlineModule</a> module ends up being extremely simple though. It just glues <a href="https://metacpan.org/pod/Inline::Module">Inline::Module</a> and <a href="https://metacpan.org/pod/Dist::Zilla">Dist::Zilla</a> together with no real special casing for either. The same code that does the right things to an EUMM (or other) dist, does it for Dist::Zilla. This should lead to maintenance happiness down the road.</p>\n\n<h2>Alt::Acme::Math::XS::*</h2>\n\n<p>Our test module <a href="https://metacpan.org/pod/Acme::Math::XS">Acme::Math::XS</a> got released in it&#39;s various forms:</p>\n\n<ul>\n<li><a href="https://metacpan.org/pod/Alt::Acme::Math::XS::EUMM">Alt::Acme::Math::XS::EUMM</a></li>\n<li><a href="https://metacpan.org/pod/Alt::Acme::Math::XS::DistZilla">Alt::Acme::Math::XS::DistZilla</a></li>\n<li><a href="https://metacpan.org/pod/Alt::Acme::Math::XS::ZillaDist">Alt::Acme::Math::XS::ZillaDist</a></li>\n<li><a href="https://metacpan.org/pod/Alt::Acme::Math::XS::ModuleInstall">Alt::Acme::Math::XS::ModuleInstall</a></li>\n</ul>\n\n<h2>Next Steps</h2>\n\n<p>Our estimate for the grant work was 2 months. Next week will complete 2 full months since we started. We are very close to done, and will try to wrap things up if possible. The things that come to mind are:</p>\n\n<ul>\n<li>Module::Build support module for Inline::Module</li>\n<li>More tests</li>\n<li>More Alt modules</li>\n</ul>\n\n<p>Stay tuned!</p>\n';
    }
    catch(e) {
        var error = context.set_error(e, output);
        throw(error);
    }

    return output;
}

