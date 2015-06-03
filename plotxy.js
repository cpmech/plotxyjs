/* Copyright 2012 Dorival de Moraes Pedroso. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file. */

/* draw icon and text for selected point */
function drawSelected(obj, x, y) {
    /* exit if x,y is outside plot area */
    if ((x < obj.ax0()) || (x > obj.axf()) ||
        (y < obj.ay0()) || (y > obj.ayf())) {
        return;
    }
    /* find point */
    var res = obj.bins.find(x, y);
    if (res == null) {
        return;
    }
    if (res.d < obj.SnapRadius) {
        var yshift = 0;
        var ha     = 'center';
        if (res.y < obj.ay0() + 2 * obj.TicFsz) {
            yshift = 3 * obj.TicFsz;
        }
        if (res.x < obj.ax0() + obj.TicFsz) {
            ha = 'left';
        }
        if (res.x > obj.axf() - obj.TicFsz) {
            ha = 'right';
        }
        /* draw circle */
        obj.SelPen.activate(obj.dc);
        drawCircle(obj.dc, res.x, res.y, 7, false);
        obj.dc.restore();
        /* draw text */
        var xreal = res.data.xreal;
        var yreal = res.data.yreal;
        var txt   = prettyNum(xreal) + ', ' + prettyNum(yreal);
        penBlack06.activate(obj.dc);
        drawText(obj.dc, txt, res.x, res.y - obj.SnapShift + yshift, ha, obj.TicFsz);
        obj.dc.restore();
    }
}

var Plotxy = Class({

    /* static members */
    DBL_EPS : 2.220446049250313e-16,
    DBL_MIN : 2.225073858507201e-308,
    DBL_MAX : 1.797693134862316e+308,

    /* constructor */
    init : function(canvas, title, xlbl, ylbl) {

        /* configuration constants */
        this.EqSf       = false; /* Equal scale factors ? */
        this.Grid       = true;  /* With primary grid ? */
        this.RecSF      = true;  /* Recalculate scale factors during draw ? */
        this.WFrame     = true;  /* With frame? draw an all-around frame ? */
        this.BNumTck    = 10;    /* Bottom ruler number of ticks */
        this.LNumTck    = 10;    /* Left ruler number of ticks */
        this.TicFsz     = 10;    /* Ticks font size */
        this.LblFsz     = 12;    /* Labels font size */
        this.TitFsz     = 14;    /* Title font size */
        this.LegAtBot   = true;  /* Legend at bottom ? */
        this.CompactBR  = true;  /* Compact bottom ruler ? */
        this.DefPsz     = 8;     /* Default point size */
        this.LRth       = 40;    /* Left ruler tickness (screen coordinates) */
        this.RRth       = 5;     /* Right ruler tickness (screen coordinates) */
        this.BRth       = 20;    /* Bottom ruler tickness (screen coordinates) */
        this.TRth       = 18;    /* Top ruler tickness (screen coordinates) */
        this.DelHB      = 6;     /* Increment for horizontal borders (to the inside) (screen coordinates) */
        this.DelVB      = 6;     /* Increment for vertical borders (to the inside) (screen coordinates) */
        this.TicLen     = 8;     /* Length of tick line */
        this.LinDx      = 20;    /* Spacing between legend items */
        this.ShowLastY  = false; /* Show text with the last y value ? */
        this.LegHei     = 30;    /* Bottom legend height */
        this.LegWid     = 0;     /* Right legend width */
        this.LegHlen    = 40;    /* Line length in legend */
        this.LegNicon   = -1;    /* number of legend icons per row (-1 => all curves) */
        this.LegNrows   = 1;     /* number of legend rows */
        this.BinSize    = 60;    /* pixels */
        this.SnapRadius = 10;    /* snap radius */
        this.SnapShift  = 12;    /* shift text */
        this.MarkEvery  = 1;     /* marke every */

        /* pens */
        this.PLPen  = new Pen('white',   'solid', 1); /* plot pen */
        this.LEPen  = new Pen('#f8f8ff', 'solid', 1); /* legend pen */
        this.BRPen  = new Pen('#f8f8ff', 'solid', 1); /* bottom ruler pen */
        this.TRPen  = new Pen('#f8f8ff', 'solid', 1); /* top ruler pen */
        this.LRPen  = new Pen('#f8f8ff', 'solid', 1); /* left ruler pen */
        this.RRPen  = new Pen('#f8f8ff', 'solid', 1); /* right ruler pen */
        this.GrdPen = new Pen('#1e90ff', 'solid', 1); /* grid pen */
        this.GrdPen.setAlpha(0.4);
        this.SelPen = new Pen('#ff9c00', 'solid', 2); /* selection pen */

        /* essential data */
        this.sfx     = 1.0;   /* x scale factor */
        this.sfy     = 1.0;   /* y scale factor */
        this.xmin    = 0.0;   /* minimum x value (real coordinates) */
        this.ymin    = 0.0;   /* minimum y value (real coordinates) */
        this.xmax    = 1.0;   /* maximum x value (real coordinates) */
        this.ymax    = 1.0;   /* maximum y value (real coordinates) */
        this.xminFix = 0.0;   /* fixed minimum x value (real coordinates) */
        this.yminFix = 0.0;   /* fixed minimum y value (real coordinates) */
        this.xmaxFix = 0.0;   /* fixed maximum x value (real coordinates) */
        this.ymaxFix = 0.0;   /* fixed maximum y value (real coordinates) */
        this.xfixMin = false; /* is x fixed with xmin? */
        this.xfixMax = false; /* is x fixed with xmax? */
        this.yfixMin = false; /* is y fixed with ymin? */
        this.yfixMax = false; /* is y fixed with ymax? */
        this.X       = [];    /* curves x-data */
        this.Y       = [];    /* curves y-data */
        this.cnames  = [];    /* curves names */
        this.cprops  = [];    /* curves properties */
        this.blbl    = '';    /* Bottom ruler label */
        this.llbl    = '';    /* Left ruler label */

        /* input data */
        this.canvas     = canvas; /* drawing area */
        this.title      = title;  /* plot title */
        this.xlbl       = xlbl;   /* x-axis label */
        this.ylbl       = ylbl;   /* y-axis label */
        this.tracking   = false;  /* tracking points */
        this.specialFcn = [];     /* special drawing callback */
        this.specialDat = [];     /* special drawing data */

        /* drawing context */
        this.dc = canvas.getContext('2d');

        /* set canvas style */
        this.canvasId  = '#' + canvas.id;
        this.canvasDom = $(this.canvasId);
        this.canvasDom.fadeIn();
        this.canvasDom.css('cursor', 'crosshair');

        /* calculate additional constants */
        this.calcCtes();

        /* set mouse click */
        this.canvasDom.on('click', null, this, function(e) {
        });

        /* set mouse tracking */
        this.canvasDom.on('mousemove', null, this, function(e) {
            /* check limits */
            var p = windowToCanvas(e.data.canvas, e.clientX, e.clientY);
            if (true) {
                if ((p.x < e.data.ax0()) || (p.x > e.data.axf()) ||
                    (p.y < e.data.ay0()) || (p.y > e.data.ayf())) {
                    return;
                }
            }
            e.data.refresh();
            /* display coordinates @ top right corner */
            var x   = e.data.xReal(p.x);
            var y   = e.data.yReal(p.y);
            var xa  = e.data.x0() + e.data.w() - e.data.LRth * 2;
            var xb  = e.data.x0() + e.data.w();
            var txt = prettyNum(x) + ', ' + prettyNum(y);
            if (false) { /* screen coordinates (debugging) */
                txt = p.x + ', ' + p.y;
            }
            e.data.TRPen.activate(e.data.dc);
            drawRect(e.data.dc, xa, e.data.y0()+1, 2*e.data.LRth-1, e.data.TRth-2, true);
            e.data.dc.restore();
            penBlack06.activate(e.data.dc);
            drawText(e.data.dc, txt, (xa+xb)/2, e.data.y0()+10, 'center', e.data.TicFsz);
            e.data.dc.restore();
            /* snapping */
            if (e.data.tracking) {
                var p = windowToCanvas(e.data.canvas, e.clientX, e.clientY);
                drawSelected(e.data, p.x, p.y);
            }
        });
    },

    /* add curve */
    addCurve : function(name, X, Y) {
        if (X.length != Y.length) {
            console.log('ERROR: plotxy.addCurve: X and Y must have the same size');
            return;
        }
        var idx = this.cnames.length;
        this.X.push(X);
        this.Y.push(Y);
        this.cnames.push(name);
        this.cprops.push(new CurveProps(getPen(idx, 1), true, true, 'o', this.DefPsz, this.MarkEvery));
        this.binsOk = false;
    },

    /* change curve */
    changeCurve : function(name, X, Y) {
        var idx = this.cnames.indexOf(name);
        if (idx < 0) {
            console.log('ERROR: plotxy.changeCurve: cannot find curve named ' + name);
            return;
        }
        this.X[idx] = X;
        this.Y[idx] = Y;
        this.binsOk = false;
    },

    /* get curve properties */
    getCurveProps : function(name) {
        var idx = this.cnames.indexOf(name);
        return {
            'color'   : this.cprops[idx].pen.color,
            'alpha'   : this.cprops[idx].pen.alpha,
            'ls'      : this.cprops[idx].pen.ls,
            'lw'      : this.cprops[idx].pen.lw,
            'withLin' : this.cprops[idx].withLin,
            'withMrk' : this.cprops[idx].withMrk,
            'mrkType' : this.cprops[idx].mrkType,
            'mrkSize' : this.cprops[idx].mrkSize,
        };
    },

    /* set curve properties */
    setCurveProps : function(name, color, alpha, ls, lw, withLin, withMrk, mrkType, mrkSize, mrkEvery) {
        var idx = this.cnames.indexOf(name);
        if (idx < 0) {
            console.log('ERROR: Plotxy.setCurveProps: cannot find curve named ', name);
            return;
        }
        this.cprops[idx].pen.setColor(color);
        this.cprops[idx].pen.setAlpha(alpha);
        this.cprops[idx].pen.setLs(ls);
        this.cprops[idx].pen.setLw(lw);
        this.cprops[idx].withLin  = withLin;
        this.cprops[idx].withMrk  = withMrk;
        this.cprops[idx].mrkType  = mrkType;
        this.cprops[idx].mrkSize  = mrkSize;
        this.cprops[idx].mrkEvery = mrkEvery;
    },

    /* add special drawing */
    addSpecial : function(callback, data) {
        this.specialFcn.push(callback);
        this.specialDat.push(data);
    },

    /* fix/unfix axis values */
    fixAxis : function(vals) {
        if (vals.xmin != undefined) {
            this.xminFix = vals.xmin;
            this.xfixMin = vals.fix;
        }
        if (vals.xmax != undefined) {
            this.xmaxFix = vals.xmax;
            this.xfixMax = vals.fix;
        }
        if (vals.ymin != undefined) {
            this.yminFix = vals.ymin;
            this.yfixMin = vals.fix;
        }
        if (vals.ymax != undefined) {
            this.ymaxFix = vals.ymax;
            this.yfixMax = vals.fix;
        }
        this.binsOk = false;
    },

    /* dependent constants */
    calcCtes : function() {
        this.bhpad  = this.LRth + this.RRth + (this.LegAtBot ? 0 : this.LegWid);
        this.bvpad  = this.BRth + this.TRth + (this.LegAtBot ? this.LegHei : 0);
        this.pahpad = this.bhpad + 2 + 2 * this.DelHB;
        this.pavpad = this.bvpad + 2 + 2 * this.DelVB;
        this.bins   = new Bins(this.ax0(), this.ay0(), this.aw(), this.ah(), this.BinSize);
        this.binsOk = false;
    },

    /* position functions */
    x0 : function() { return 0; },
    y0 : function() { return 0; },
    w  : function() { return this.canvas.width; },
    h  : function() { return this.canvas.height; },

    /* plot area coordinates */
    ax0 : function() { return this.x0() + this.LRth; },
    axf : function() { return this.x0() + this.w() - this.RRth; },
    ay0 : function() { return this.y0() + this.TRth; },
    ayf : function() { return this.y0() + this.h() - this.BRth - this.LegHei; },
    aw  : function() { return this.w()  - this.bhpad; }, /* width of plot area */
    ah  : function() { return this.h()  - this.bvpad; }, /* height of plot area */

    /* convert to screen coordinates */
    xScr  : function(x) { return float2int((this.x0() + 1 + this.LRth + this.DelHB) + this.sfx * (x - this.xmin)); },
    yScr  : function(y) { return float2int((this.y0() + 1 + this.TRth + this.DelVB) + (this.h() - this.pavpad) - this.sfy * (y - this.ymin)); },
    lScr  : function(l) { return float2int((this.sfx > this.sfy ? this.sfy : this.sfx) * this.l); },
    toScr : function(obj, xreal, yreal) { return {x: obj.xScr(xreal), y: obj.yScr(yreal) }; },

    /* convert to real coordinates */
    xReal : function(xscr) { return this.xmin + (xscr - this.x0() - this.LRth - this.DelHB - 1) / this.sfx; },
    yReal : function(yscr) { return this.ymin + ((this.y0() + 1 + this.TRth + this.DelVB) + (this.h() - this.pavpad) - yscr) / this.sfy; },

    /* calculate scaling factor */
    calcSF : function() {

        /* find min/max */
        this.xmin = 0.0;
        this.ymin = 0.0;
        this.xmax = 1.0;
        this.ymax = 1.0;
        var found = false;
        for (var k=0; k<this.X.length; k++) {
            if (this.X[k].length < 2) {
                continue;
            }
            if (!found) {
                this.xmin = this.X[k][0];
                this.ymin = this.Y[k][0];
                this.xmax = this.X[k][1];
                this.ymax = this.Y[k][1];
                found = true;
            }
            for (var i=0; i<this.X[k].length; ++i) {
                if (this.X[k][i] < this.xmin) this.xmin = this.X[k][i];
                if (this.Y[k][i] < this.ymin) this.ymin = this.Y[k][i];
                if (this.X[k][i] > this.xmax) this.xmax = this.X[k][i];
                if (this.Y[k][i] > this.ymax) this.ymax = this.Y[k][i];
            }
        }

        var bnumtck = this.BNumTck;
        var lnumtck = this.LNumTck;

        /* pretty values */
        if (Math.abs(this.xmax - this.xmin) <= this.DBL_EPS) {
            /*
            var lim = this.pretty(this.xmin, this.xmax, 3);
            this.xmin = lim[0];
            this.xmax = lim[lim.length-1];
            */
            this.xmin = this.xmin - 1;
            this.xmax = this.xmax + 1;
            bnumtck = 3;
        }
        if (Math.abs(this.ymax - this.ymin) <= this.DBL_EPS) {
            /*
            var lim = this.pretty(this.ymin, this.ymax, 3);
            this.ymin = lim[0];
            this.ymax = lim[lim.length-1];
            */
            this.ymin = this.ymin - 1;
            this.ymax = this.ymax + 1;
            lnumtck = 3;
        }

        /* fixed values */
        if (this.xfixMin) { this.xmin = this.xminFix; }
        if (this.xfixMax) { this.xmax = this.xmaxFix; }
        if (this.yfixMin) { this.ymin = this.yminFix; }
        if (this.yfixMax) { this.ymax = this.ymaxFix; }

        /* scaling factors */
        this.sfx = (this.w() - this.pahpad) / (this.xmax - this.xmin);
        this.sfy = (this.h() - this.pavpad) / (this.ymax - this.ymin);
        if (this.EqSf) {
            var sf = (this.sfx > this.sfy ? this.sfy : this.sfx);
            this.sfx = sf;
            this.sfy = sf;
        }

        /* ticks */
        this.BTicks = this.pretty(this.xmin, this.xmax, bnumtck);
        this.LTicks = this.pretty(this.ymin, this.ymax, lnumtck);
    },

    /* redraw component */
    refresh : function() {

        /* essential parts */
        this.calcSF();
        this.drawRulers();
        this.drawLegend();
        this.drawCurves();

        /* draw inner border */
        penBlack06.activate(this.dc);
        drawRect(this.dc, this.ax0(), this.ay0(), this.aw(), this.ah(), false);

        /* draw outer border */
        drawRect(this.dc, this.x0(), this.y0(), this.w()-1, this.h()-1, false);
        this.dc.restore();

        /* buttons and labels */
        var xb = this.x0() + this.w();
        var xd = this.x0() + this.LRth;
        var xe = this.x0() + this.w() - this.LRth;
        var yb = this.y0() + this.h();
        if (false) {
            var xa = this.x0() + this.w() - 2*this.LRth;
            var xc = this.x0();
            var yc = this.y0() + this.TRth;
            var ya = this.y0() + this.h() - this.TRth;
            penRed.activate(this.dc);
            drawRect(this.dc, xc, this.y0(), xd, yc, true);
            drawRect(this.dc, xa, this.y0(), xb, yc, true);
            drawRect(this.dc, xe, ya, this.LRth, this.TRth, true);
            this.dc.restore();
        }
        /* labels*/
        penBlack06.activate(this.dc);
        drawText(this.dc, this.xlbl, (xe+xb)/2, yb-5, 'center', 'bold ' + this.LblFsz);
        drawText(this.dc, this.ylbl, (this.x0()+xd)/2, this.y0()+10, 'center', 'bold ' + this.LblFsz);
        this.dc.restore();

        /* bins */
        if (this.tracking && !this.binsOk) {
            this.bins.clear();
            for (var k=0; k<this.X.length; k++) {
                for (var i=0; i<this.X[k].length; i++) {
                    this.bins.push(this.xScr(this.X[k][i]), this.yScr(this.Y[k][i]), {xreal:this.X[k][i], yreal:this.Y[k][i]});
                }
            }
            this.binsOk = true;
        }
        if (false) {
            this.bins.drawBins(this.dc);
        }

        /* special */
        for (var i=0; i<this.specialFcn.length; i++) {
            this.specialFcn[i](this, this.specialDat[i]);
        }
    },

    /* clear background, draw grid and curves */
    drawCurves : function() {

        /* clear background */
        this.dc.save();
        if (false) {
            this.PLPen.activate(this.dc);
            this.dc.clearRect(this.ax0(), this.ay0(), this.axf(), this.ayf());

        /* gradient */
        } else {
            var grd = this.dc.createLinearGradient(0, this.y0(), 0, this.h());
            /* grd.addColorStop(1, 'white'); */
            /* grd.addColorStop(0, '#f0f0f9'); */
            grd.addColorStop(0, '#ffefd8');
            grd.addColorStop(1, 'white');
            this.dc.fillStyle = grd;
        }
        drawRect(this.dc, this.ax0(), this.ay0(), this.aw(), this.ah(), true);
        this.dc.restore();

        /* draw grid */
        if (this.Grid) {
            this.GrdPen.activate(this.dc);
            /* vertical */
            for (var i=0; i<this.BTicks.length; ++i) {
                var xi = this.xScr(this.BTicks[i]);
                if (xi >= this.ax0() && xi <= this.axf()) {
                    drawLine(this.dc, xi, this.ay0(), xi, this.ayf());
                }
            }
            /* horizontal */
            for (var i=0; i<this.LTicks.length; ++i) {
                var yi = this.yScr(this.LTicks[i]);
                if (yi >= this.ay0() && yi <= this.ayf()) {
                    drawLine(this.dc, this.ax0(), yi, this.axf(), yi);
                }
            }
            this.dc.restore();
        }

        /* draw curves */
        for (var k=0; k<this.X.length; ++k) {

            /* Draw points */
            this.cprops[k].pen.activate(this.dc);
            if (this.cprops[k].withMrk) {
                switch (this.cprops[k].mrkType) {
                /* open square */
                case 'S':
                    var idx_mark = 0;
                    for (var i=0; i<this.X[k].length; ++i) {
                        if (i >= idx_mark) {
                            drawSquare(this.dc, this.xScr(this.X[k][i]), this.yScr(this.Y[k][i]), this.cprops[k].mrkSize, false);
                            idx_mark += this.cprops[k].mrkEvery;
                        }
                    }
                    break;

                /* filled square */
                case 's':
                    var idx_mark = 0;
                    for (var i=0; i<this.X[k].length; ++i) {
                        if (i >= idx_mark) {
                            drawSquare(this.dc, this.xScr(this.X[k][i]), this.yScr(this.Y[k][i]), this.cprops[k].mrkSize, true);
                            idx_mark += this.cprops[k].mrkEvery;
                        }
                    }
                    break;

                /* open circle */
                case 'O':
                    var idx_mark = 0;
                    for (var i=0; i<this.X[k].length; ++i) {
                        if (i >= idx_mark) {
                            drawCircle(this.dc, this.xScr(this.X[k][i]), this.yScr(this.Y[k][i]), this.cprops[k].mrkSize/2, false);
                            idx_mark += this.cprops[k].mrkEvery;
                        }
                    }
                    break;

                /* filled circle */
                default:
                    var idx_mark = 0;
                    for (var i=0; i<this.X[k].length; ++i) {
                        if (i >= idx_mark) {
                            drawCircle(this.dc, this.xScr(this.X[k][i]), this.yScr(this.Y[k][i]), this.cprops[k].mrkSize/2, true);
                            idx_mark += this.cprops[k].mrkEvery;
                        }
                    }
                }
            }

            /* Draw lines */
            if ((this.cprops[k].withLin) && (this.X[k].length > 1)) {
                drawLinesC(this.dc, this.X[k], this.Y[k], this, this.toScr);
            }
            this.dc.restore();

            /* draw text @ end of curve */
            if (this.X[k].length > 1 && this.ShowLastY) {
                var n   = this.X[k].length;
                var txt = '' + this.Y[k][n-1];
                penBlack06.activate(this.dc);
                drawText(this.dc, txt, this.xScr(this.X[k][n-1]), this.yScr(this.Y[k][n-1]), 'right', this.TicFsz);
            }
        }
    },

    drawRulers : function() {

        /* bottom ruler */
        if (this.BRth > 0) {
            /* background */
            this.BRPen.activate(this.dc);
            drawRect(this.dc, this.x0(), this.ayf(), this.w()-1, this.BRth, true);
            this.dc.restore();

            /* ticks */
            penBlack06.activate(this.dc);
            for (var i=0; i<this.BTicks.length; ++i) {
                var xi = this.xScr(this.BTicks[i]);
                if ((xi >= this.ax0()) && (xi <= this.ax0()+this.aw())) {
                    txt = '' + this.BTicks[i];
                    if (txt.length > 10) {
                        txt = '' + this.BTicks[i].toFixed(3);
                    }
                    drawLine(this.dc, xi, this.ayf(), xi, this.ayf()+this.TicLen);
                    drawText(this.dc, txt, xi, this.ayf()+this.TicLen+this.TicFsz/2+3, 'center', this.TicFsz);
                }
            }

            /* label */
            if (!this.CompactBR) {
                drawText(this.dc, this.blbl, this.ax0()+this.aw()/2, this.ayf()+this.TicLen+3*this.TicFsz/2+1, 'center', this.TicFsz);
            }
            this.dc.restore();
        }

        /* left ruler */
        if (this.LRth > 0) {
            /* background */
            this.LRPen.activate(this.dc);
            drawRect(this.dc, this.x0(), this.ay0(), this.LRth, this.ah(), true);
            this.dc.restore();

            /* ticks */
            penBlack06.activate(this.dc);
            for (var i=0; i<this.LTicks.length; ++i) {
                var xi = this.ax0()-this.TicLen;
                var yi = this.yScr(this.LTicks[i]);
                if (yi>=this.ay0() && yi<=this.ay0()+this.ah()) {
                    txt = prettyNum(this.LTicks[i]);
                    drawLine(this.dc, xi, yi, xi+this.TicLen, yi);
                    drawText(this.dc, txt, this.ax0()-this.TicLen-2, yi, 'right', this.TicFsz);
                }
            }
            this.dc.restore();
        }

        /* top ruler */
        if (this.TRth > 0) {
            /* background */
            this.TRPen.activate(this.dc);
            drawRect(this.dc, this.x0(), this.y0(), this.w(), this.TRth, true);
            this.dc.restore();

            /* draw left label */
            penBlack06.activate(this.dc);
            drawText(this.dc, this.llbl, this.x0()+2, this.ay0()-6, 'left', this.TicFsz);

            /* left ruler label and title */
            drawText(this.dc, this.title, this.x0()+this.w()/2, this.ay0()-this.TitFsz/2+2, 'center', this.TitFsz);
            this.dc.restore();
        }

        /* right ruler */
        if (this.RRth > 0) {
            /* background */
            this.RRPen.activate(this.dc);
            drawRect(this.dc, this.x0()+this.w()-this.RRth-this.LegWid, this.ay0(), this.RRth, this.h()-this.TRth-this.BRth-this.LegHei, true);
            this.dc.restore();
        }
    },

    /* draw legend */
    drawLegend : function() {
        var hicon = this.LegHei / 2;
        var xi    = this.x0() + 5;
        var xf    = xi + 30;
        var yi    = this.y0() + this.h() - hicon * this.LegNrows;
        var ilen  = 5 + this.LegHlen + 2; /* icon length */
        /*
        console.log('leghei=%d', this.LegHei);
        console.log('y0=%d, h=%d, hicon=%d, legNrows=%d', this.y0(), this.h(),hicon, this.LegNrows);
        console.log('hicon=%d, xi=%d, yi=%d, ilen=%d, xf=%d', hicon, xi, yi, ilen, xf);
        */
        if (this.LegAtBot) {

            /* clear background */
            this.LEPen.activate(this.dc);
            drawRect(this.dc, this.x0(), this.y0()+this.h()-this.LegHei, this.w(), this.LegHei, true);
            this.dc.restore();

            /* Draw legend */
            var legcol = 0;
            for (var k=0; k<this.X.length; k++) {

                /* Draw points */
                this.cprops[k].pen.activate(this.dc);
                if (this.cprops[k].withMrk) {
                    switch (this.cprops[k].mrkType) {
                    /* open square */
                    case 'S':
                        drawSquare(this.dc, xi+this.LegHlen/2, yi, this.cprops[k].mrkSize, false);
                        break;

                    /* filled square */
                    case 's':
                        drawSquare(this.dc, xi+this.LegHlen/2, yi, this.cprops[k].mrkSize, true);
                        break;

                    /* open circle */
                    case 'O':
                        drawCircle(this.dc, xi+this.LegHlen/2, yi, this.cprops[k].mrkSize/2, false);
                        break;

                    /* filled circle */
                    default:
                        drawCircle(this.dc, xi+this.LegHlen/2, yi, this.cprops[k].mrkSize/2, true);
                    }
                }

                /* draw line */
                if (this.cprops[k].withLin) {
                    drawLine(this.dc, xi, yi, xf, yi);
                }
                this.dc.restore();

                /* draw names */
                txt = this.cnames[k];
                penBlack06.activate(this.dc);
                drawText(this.dc, txt, xf+2, yi, 'left', this.LblFsz);
                this.dc.restore();

                /* Next curve */
                xi += textDrawLen(this.dc, txt);
                xi  = xi+ilen+this.LinDx;
                xf  = xi+this.LegHlen;

                /* legend row position */
                if (this.nlegicon > 0) {
                    if (legcol == this.nlegicon-1) {
                        legcol = -1;
                        xi     = x()+5;
                        xf     = xi+this.LegHlen;
                        yi    += this.hlegicon;
                    }
                    legcol++;
                }
            }

            /* compact layout */
            if (this.CompactBR) {
                this.LEPen.activate(this.dc);
                drawText(this.dc, this.blbl, this.x0()+this.w()-3, this.y0()+this.h()-this.hlegicon*this.nlegrows, 'right', this.LblFsz);
                this.dc.restore();
            }
        }
        else
        {
            /* TODO */
        }
    },

    pretty : function(Lo, Hi, nDiv) {
        /* constants */
        var rounding_eps   = Math.sqrt(this.DBL_EPS);
        var eps_correction = 0.0;
        var shrink_sml     = 0.75;
        var h              = 1.5;
        var h5             = 0.5+1.5*h;

        /* local variables */
        var min_n = float2int(float2int(nDiv) / float2int(3));
        var lo    = Lo;
        var hi    = Hi;
        var dx    = hi-lo;
        var cell  = 1;    /* cell := "scale" here */
        var ub    = 0;    /* upper bound on cell/unit */
        var isml  = true; /* is small ? */

        /* check range */
        if (!(dx==0 && hi==0)) { /* hi=lo=0 */
            cell = (Math.abs(lo) > Math.abs(hi) ? Math.abs(lo) : Math.abs(hi));
            ub   = (1+(h5>=1.5*h+.5) ? 1/(1+h) : 1.5/(1+h5));
            isml = (dx<cell*ub*(nDiv>1 ? nDiv : 1)*this.DBL_EPS*3); /* added times 3, as several calculations here */
        }

        /* set cell */
        if (isml) {
            if (cell>10) cell = 9 + cell/10;
            cell *= shrink_sml;
            if (min_n>1) cell /= min_n;
        } else {
            cell = dx;
            if (nDiv>1) cell /= nDiv;
        }
        if      (cell<20*this.DBL_MIN) cell =  20*this.DBL_MIN; // very small range.. corrected
        else if (cell*10>this.DBL_MAX) cell = 0.1*this.DBL_MAX; // very large range.. corrected

        /* find base and unit */
        var base = Math.pow(10.0, Math.floor(myLog10(cell))); /* base <= cell < 10*base */
        var unit = base;
        if ((ub = 2*base)-cell <  h*(cell-unit)) { unit = ub;
        if ((ub = 5*base)-cell < h5*(cell-unit)) { unit = ub;
        if ((ub =10*base)-cell <  h*(cell-unit))   unit = ub; }}

        /* find number of */
        var ns = Math.floor(lo/unit+rounding_eps);
        var nu = Math.ceil (hi/unit-rounding_eps);
        if (eps_correction && (eps_correction>1 || !isml)) {
            if (lo) lo *= (1-this.DBL_EPS); else lo = -this.DBL_MIN;
            if (hi) hi *= (1+this.DBL_EPS); else hi = +this.DBL_MIN;
        }
        while (ns*unit>lo+rounding_eps*unit) ns--;
        while (nu*unit<hi-rounding_eps*unit) nu++;

        /* find number of divisions */
        var ndiv = float2int(0.5+nu-ns);
        if (ndiv<min_n) {
            var k = min_n-ndiv;
            if (ns>=0.0) {
                nu += k/2;
                ns -= k/2 + k%2;
            } else {
                ns -= k/2;
                nu += k/2 + k%2;
            }
            ndiv = min_n;
        }
        ndiv++;

        /* ensure that result covers original range */
        if (ns*unit<lo) lo = ns * unit;
        if (nu*unit>hi) hi = nu * unit;

        /* fill array */
        var MINZERO = rounding_eps; /* minimum value to be replaced to 0.0 in _pretty method */
        var Vals = [lo];
        for (var i=1; i<ndiv; ++i) {
            Vals[i] = Vals[i-1]+unit;
            if (Math.abs(Vals[i]) < MINZERO) Vals[i] = 0.0;
        }
        return Vals;
    },

});
