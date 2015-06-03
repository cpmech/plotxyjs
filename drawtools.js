/* Copyright 2012 Dorival de Moraes Pedroso. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file. */

var Pen = Class({

    init : function(color, ls, lw) {
        this.color   = color;
        this.ls      = ls;
        this.lw      = lw;
        this.rgba    = '';
        this.useRgba = false;
        this.alpha   = 1;
    },

    setColor : function(color) {
        this.color   = color;
        this.useRgba = false;
    },

    setRgba : function(r, g, b, a) {
        this.rgba    = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
        this.useRgba = true;
    },

    setAlpha : function(alpha) {
        this.alpha = alpha;
    },

    setLs : function(ls) {
        this.ls = ls;
    },

    setLw : function(lw) {
        this.lw = lw;
    },

    activate : function(ctx) {
        ctx.save();
        if (this.useRgba) {
            ctx.fillStyle   = this.rgba;
            ctx.strokeStyle = this.rgba;
        } else {
            ctx.fillStyle   = this.color;
            ctx.strokeStyle = this.color;
            ctx.globalAlpha = this.alpha;
        }
        ctx.lineWidth = this.lw;
        if (false) {
            switch (this.ls) {
            case 'dashed':
                ctx.setLineDash([5]);
                break;
            case 'dotted':
                ctx.setLineDash([2,3]);
                break;
            default: /* solid */
                ctx.setLineDash([1]);
            }
        }
    },
});

var CurveProps = Class({

    init : function(pen, withLin, withMrk, mrkType, mrkSize, mrkEvery) {
        this.pen      = pen;
        this.withLin  = withLin;
        this.withMrk  = withMrk;
        this.mrkType  = mrkType;
        this.mrkSize  = mrkSize;
        this.mrkEvery = mrkEvery;
    }
});

var penBlack06 = new Pen('black'   , 'solid' , 0.6);
var penBlack   = new Pen('black'   , 'solid' , 1);
var penRed     = new Pen('red'     , 'solid' , 1);
var penGreen   = new Pen('green'   , 'solid' , 1);
var penBlue    = new Pen('blue'    , 'solid' , 1);
var penMag     = new Pen('magenta' , 'solid' , 1);
var penCyan    = new Pen('cyan'    , 'solid' , 1);
var penYel     = new Pen('yellow'  , 'solid' , 1);
var penGold    = new Pen('gold'    , 'solid' , 1);
var penOran    = new Pen('orange'  , 'solid' , 1);
var penLgrey   = new Pen('#eaeaea' , 'solid' , 1);
var penGrey    = new Pen('#d5d5d5' , 'solid' , 1);
var penGreyB   = new Pen('#d5d5d5' , 'solid' , 4); /* bold */
var pensSet1   = [penBlue, penRed, penGreen, penMag, penCyan, penOran];

function getPen(idx, setNum) {
    if (setNum == 1) {
        var n = pensSet1.length;
        return pensSet1[idx % n];
    }
    return penBlack;
}

function drawLine(ctx, x0, y0, xf, yf) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(xf, yf);
    ctx.stroke();
}

function drawLines(ctx, X, Y) {
    ctx.beginPath();
    ctx.moveTo(X[0], Y[0]);
    for (var i=1; i<X.length; i++) {
        ctx.lineTo(X[i], Y[i]);
    }
    ctx.stroke();
}

function drawLinesC(ctx, X, Y, obj, converter) {
    ctx.beginPath();
    var p = converter(obj, X[0], Y[0]);
    ctx.moveTo(p.x, p.y);
    for (var i=1; i<X.length; i++) {
        p = converter(obj, X[i], Y[i]);
        ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
}

function drawCircle(ctx, xc, yc, r, filled) {
    ctx.beginPath();
    ctx.arc(xc, yc, r, 0.0, 2.0*Math.PI);
    if (filled) {
        ctx.fill();
    } else {
        ctx.stroke();
    }
}

function drawEllipse(ctx, xc, yc, rx, ry, alpMin, alpMax, antiClockwise, closed) {
    ctx.beginPath();
    ctx.ellipse(xc, yc, rx, ry, 0, Math.PI, antiClockwise);
    if (closed) {
        ctx.closePath();
    }
    ctx.stroke();
}

function drawSquare(ctx, x, y, l, filled) {
    if (filled) {
        ctx.fillRect(x-l/2, y-l/2, l, l);
    } else {
        ctx.strokeRect(x-l/2, y-l/2, l, l);
    }
}

function drawRect(ctx, x0, y0, wid, hei, filled) {
    if (filled) {
        ctx.fillRect(x0, y0, wid, hei);
    } else {
        ctx.strokeRect(x0, y0, wid, hei);
    }
}

function drawText(ctx, txt, x, y, ha, fsz) {
    ctx.font      = fsz + 'px Arial';
    ctx.textAlign = ha;
    ctx.fillText(txt, x, y);
}

function textDrawLen(ctx, txt) {
    return ctx.measureText(txt).width;
}

function windowToCanvas(canvas, xWin, yWin) {
    var bbox = canvas.getBoundingClientRect();
    return {x: xWin - bbox.left * (canvas.width  / bbox.width),
            y: yWin - bbox.top  * (canvas.height / bbox.height)};
}

function drawHline(ctx, y) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(ctx.canvas.width, y + 0.5);
    ctx.stroke();
}

function drawVline(ctx, x) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, ctx.canvas.height);
    ctx.stroke();
}

function drawCross(ctx, x, y) {
    drawHline(ctx, y);
    drawVline(ctx, x);
}
