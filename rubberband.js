/* Copyright 2012 Dorival de Moraes Pedroso. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file. */

/* rubberbands */
var rb_div      = [];
var rb_canvas   = [];
var rb_context  = [];
var rb_prevPos  = [];
var rb_rectang  = [];
var rb_dragging = false;

function tm_drawLines(context, x, y) {
    context.strokeStyle = 'rgba(0,0,230,0.8)';
    context.lineWidth = 0.5;
    drawVerticalLine(context, x);
    drawHorizontalLine(context, y);
}

function tm_drawLinesBg(context, x, y) {
    context.strokeStyle = 'rgba(230,0,0,0.8)';
    context.lineWidth = 0.5;
    drawVerticalLine(context, x);
    drawHorizontalLine(context, y);
}

$(document).ready(function() {

    $('canvas.rubberband').each(function(i, canvas) {
        /* console.log(document.getElementById('canvas-1Div').style); */
        /* var res = $('#canvas-1Div'); */
        /* console.log(res.style); */
        /* rb_div.push($('#' + canvas.id + 'Div')); */
        rb_div.push(document.getElementById(canvas.id + 'Div'));
        rb_canvas.push(canvas);
        rb_context.push(canvas.getContext('2d'));
        rb_prevPos.push({x:0, y:0});
        rb_rectang.push({l:0, t:0, w:0, h:0});
        rb_dragging = false;
        canvas.onmousedown = function(e) {
            var x = e.clientX;
            var y = e.clientY;
            e.preventDefault();
            rubberbandStart(i, x, y);
        };
        window.onmousemove = function(e) {
            var x = e.clientX;
            var y = e.clientY;
            e.preventDefault();
            if (rb_dragging) {
                rubberbandStretch(i, x, y);
            }
        };
        window.onmouseup = function(e) {
            e.preventDefault();
            rubberbandEnd(i);
        };
    });
});

function rubberbandStart(idx, x, y) {
    rb_rectang[idx].l = x;
    rb_rectang[idx].t = y;
    moveRubberbandDiv(idx);
    showRubberbandDiv(idx);
    rb_prevPos[idx].x = x;
    rb_prevPos[idx].y = y;
    rb_dragging = true;
}

function rubberbandStretch(idx, x, y) {
    rb_rectang[idx].l = x < rb_prevPos[idx].x ? x : rb_prevPos[idx].x;
    rb_rectang[idx].t = y < rb_prevPos[idx].y ? y : rb_prevPos[idx].y;
    rb_rectang[idx].w = Math.abs(x - rb_prevPos[idx].x);
    rb_rectang[idx].h = Math.abs(y - rb_prevPos[idx].y);
    moveRubberbandDiv(idx);
    resizeRubberbandDiv(idx);
}

function rubberbandEnd(idx) {
    var bbox = rb_canvas[idx].getBoundingClientRect();
    try {
        rb_context[idx].drawImage(rb_context[idx].canvas,
            rb_rectang[idx].l - bbox.left,
            rb_rectang[idx].t - bbox.top,
            rb_rectang[idx].w,
            rb_rectang[idx].h,
            0, 0, rb_canvas.width[dix], rb_canvas[dix].height
        );
    } catch (e) {
        console.log('error ' + e);
        /* Suppress error message when mouse is released */
        /* outside the canvas */
    }
    resetRubberbandRectangle(idx);
    rb_div[idx].style.width  = 0;
    rb_div[idx].style.height = 0;
    hideRubberbandDiv(idx);
    rb_dragging = false;
}

function moveRubberbandDiv(idx) {
    rb_div[idx].style.top  = rb_rectang[idx].t + 'px';
    rb_div[idx].style.left = rb_rectang[idx].l + 'px';
}

function resizeRubberbandDiv(idx) {
    rb_div[idx].style.width  = rb_rectang[idx].width  + 'px';
    rb_div[idx].style.height = rb_rectang[idx].height + 'px';
}

function showRubberbandDiv(idx) {
    rb_div[idx].style.display = 'inline';
}

function hideRubberbandDiv(idx) {
    rb_div[idx].style.display = 'none';
}

function resetRubberbandRectangle(idx) {
    rb_rectang[idx] = { t:0, l:0, w:0, h:0 };
}
