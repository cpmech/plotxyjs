/* Copyright 2012 Dorival de Moraes Pedroso. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file. */

var Class = function(methods) {
    var klass = function() {
        this.init.apply(this, arguments);
    };
    for (var property in methods) {
       klass.prototype[property] = methods[property];
    }
    if (!klass.prototype.init) klass.prototype.init = function(){};
    return klass;
};

function float2int (value) {
    return value | 0;
}

function myLog10(x) {
    /* this works in mozilla: return Math.log10(x); */
    return Math.log(x) / Math.LN10;
}

function prettyNum(x) {
    var txt = '' + x;
    if (txt.length > 10) {
        txt = '' + x.toFixed(3);
    }
    return txt;
}

function makeAJAXcall(method, url, data, handler) {
    var xhr = new XMLHttpRequest();
    var url = url;
    if (method == 'GET') {
        url += '?' + encodeURIComponent(JSON.stringify(data));
    }
    if ("withCredentials" in xhr) {
        xhr.open(method, url, true); // XHR has 'withCredentials' property only if it supports CORS
    } else if (typeof XDomainRequest != "undefined") { // if IE, use XDR
        xhr = new XDomainRequest();
        xhr.open(method, url);
        console.log('myutl.js: makeAJAXcall: using XDomainRequest');
    } else {
        console.log('myutl.js: makeAJAXcall: xhr allocation failed (null)');
    }
    if (xhr) {
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function(e) {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    //console.log('myutl.js: xhr.response = ' + xhr.response);
                    var response = JSON.parse(xhr.response);
                    //console.log('myutl.js: response = ' + response);
                    handler(response);
                } else {
                    console.log('myutl.js: makeAJAXcall: xhr.onreadystatechange failed with status == ', xhr.status);
                }
            } else {
                // other states => OK
            }
        };
        xhr.send(JSON.stringify(data));
    }
}
