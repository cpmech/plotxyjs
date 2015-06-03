/* Copyright 2012 Dorival de Moraes Pedroso. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file. */

/* HashPt returns a unique id of a point */
function hashPt(x, y) {
    return float2int(x + y*10001);
}

var Bins = Class({

    init : function(x0, y0, w, h, binLength) {
        this.x0   = x0;
        this.y0   = y0;
        this.w    = w;
        this.h    = h;
        this.xf   = x0 + w;
        this.yf   = y0 + h;
        this.nx   = float2int(this.w / binLength);
        this.ny   = float2int(this.h / binLength);
        this.lx   = this.w / this.nx;
        this.ly   = this.h / this.ny;
        this.bins = [];
        this.h2p  = {}; /* hash => point */
        for (var i=0; i<this.nx * this.ny; i++) {
            this.bins[i] = [];
        }
        /* debug */
        if (false) {
            console.log('x0=%d, y0=%d, w=%d, h=%d, nx=%d, ny=%d, lx=%d, ly=%d',
                        this.x0, this.y0, this.w, this.h, this.nx, this.ny, this.lx, this.ly);
        }
    },

    calcn : function(x, y) {
        var i = float2int((x - this.x0) / this.lx);
        var j = float2int((y - this.y0) / this.ly);
        if (i == this.nx) {
            i = this.nx - 1;
        }
        if (j == this.ny) {
            j = this.ny - 1;
        }
        return i + j * this.nx;
    },

    clear : function() {
        for (var i=0; i<this.nx * this.ny; i++) {
            this.bins[i] = [];
        }
        this.h2p = {};
    },

    push : function(x, y, data) {
        if (x < this.x0 || x > this.xf || y < this.y0 || y > this.yf) {
            return; /* out of range */
        }
        var h = hashPt(x, y);
        var n = this.calcn(x, y);
        var k = this.bins[n].indexOf(h);
        if (k < 0) { /* not found */
            this.bins[n].push(h);
            this.h2p[h] = {x:x, y:y, data:data};
        }
    },

    find : function(x, y) {
        if ((x<this.x0) || (x>this.xf) || (y<this.y0) || (y>this.yf)) {
            return null;
        }
        var n        = this.calcn(x, y);
        var dclosest = this.w * this.h * 2;
        var hclosest = -1;
        for (var i=0; i<this.bins[n].length; i++) {
            var h  = this.bins[n][i];
            var xp = this.h2p[h].x;
            var yp = this.h2p[h].y;
            var d  = Math.sqrt((x-xp)*(x-xp) + (y-yp)*(y-yp));
            if (d < dclosest) {
                dclosest = d;
                hclosest = h;
            }
        }
        if (hclosest < 0) {
            return null;
        }
        var res = this.h2p[hclosest];
        res.d = dclosest;
        return res;
    },

    drawBins : function(dc) {
        penGreyB.activate(dc);
        for (var i=0; i<this.ny+1; i++) {
            var yi = this.y0 + i * this.ly;
            drawLine(dc, this.x0, yi, this.x0 + this.w, yi);
        }
        for (var i=0; i<this.nx+1; i++) {
            var xi = this.x0 + i * this.lx;
            drawLine(dc, xi, this.y0, xi, this.y0 + this.h);
        }
        dc.restore();
    },

    drawBin : function(dc, x, y) {
        var i  = float2int((x - this.x0) / this.lx);
        var j  = float2int((y - this.y0) / this.ly);
        var n  = i + j * this.nx;
        var xa = this.x0 + i * this.lx;
        var ya = this.y0 + j * this.ly;
        var xc = xa + this.lx / 2;
        var yc = ya + this.ly / 2;
        penRed.activate(dc);
        drawRect(dc, xa, ya, this.lx, this.ly, false);
        drawText(dc, 'i='+i+', j='+j+', n='+n, xc, yc, 'center', 10);
        dc.restore();
    },

});
