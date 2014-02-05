// Author: Dmitrii Cucleschin
// Email: dmitrii.cucleschin@gmail.com
// File: Drawer.js
// 
// This code is distributed under GPL v2 license.

function Drawer () {
    this.cellSize = 32;
    this.mapWidth = 0;
    this.mapHeight = 0;
    this.locked = false;

    this.cacheCanvas = null;

    this.tileset = new Image;
    this.tileset.src = "res/tileset.png";

    this.car = new Image;
    this.car.src = "res/car.png";

    this.tileMap = {
        '_': {y:0, x:0},
        'C': {y:0, x:0},
        '#': {y:0, x:1},
        '=': {y:1, x:0},
        'r': {y:1, x:1},
        'w': {y:2, x:0},
        '+': {y:2, x:1},
        '-': {y:3, x:0},
        'v': {y:3, x:1},
        'h': {y:4, x:0},
        's': {y:4, x:1},
        'n': {y:5, x:0},
        'p': {y:5, x:1},
        'x': {y:6, x:0}
    };

    trackTransforms(c);

    var lastX = canvas.width/2;
    var lastY = canvas.height/2;
    var dragStart;
    var dragged;

    canvas.addEventListener('mousedown',function(e){
        document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
        lastX = e.offsetX || (e.pageX - canvas.offsetLeft);
        lastY = e.offsetY || (e.pageY - canvas.offsetTop);
        dragStart = c.transformedPoint(lastX,lastY);
        dragged = false;
    },false);

    canvas.addEventListener('mousemove',function(e){
        lastX = e.offsetX || (e.pageX - canvas.offsetLeft);
        lastY = e.offsetY || (e.pageY - canvas.offsetTop);
        dragged = true;

        if (dragStart && !drawer.locked){
            var pt = c.transformedPoint(lastX,lastY);

            // TODO: Prevent going out of borders.
            if (true) {
                c.translate(pt.x-dragStart.x,pt.y-dragStart.y);
                drawer.redraw();
            }
        }
    },false);

    canvas.addEventListener('mouseup',function(e){
        dragStart = null;
        if (!dragged) zoom(e.shiftKey ? -1 : 1 );
    },false);

    var scaleFactor = 1.1;
    var zoom = function(clicks){
        if (drawer.locked) return;

        var pt = c.transformedPoint(lastX,lastY);
        c.translate(pt.x,pt.y);
        var factor = Math.pow(scaleFactor,clicks);
        c.scale(factor,factor);
        c.translate(-pt.x,-pt.y);
        drawer.redraw();
    }

    var handleScroll = function(e){
        var delta = e.wheelDelta ? e.wheelDelta/40 : e.detail ? -e.detail : 0;
        if (delta) zoom(delta);
        return e.preventDefault() && false;
    };
    canvas.addEventListener('DOMMouseScroll',handleScroll,false);
    canvas.addEventListener('mousewheel',handleScroll,false);
}

Drawer.prototype.clear = function() {
    var p1 = c.transformedPoint(0,0);
    var p2 = c.transformedPoint(canvas.width, canvas.height);
    c.clearRect(p1.x,p1.y,p2.x-p1.x,p2.y-p1.y);
}

Drawer.prototype.drawCache = function() {
    this.cacheCanvas = document.getElementById("cache_canvas");
    this.cacheCanvas.width = this.mapWidth * this.cellSize;
    this.cacheCanvas.height = this.mapHeight * this.cellSize;
    var ctx = this.cacheCanvas.getContext("2d");

    for (var row = 0; row < this.mapHeight; row++) {
        for (var column = 0; column < this.mapWidth; column++) {
            var x = column * this.cellSize; // - 5;
            var y = row * this.cellSize; // - 5;

            var cur = state.map[row][column];
            var tile = this.tileMap[cur];

            if (!tile) tile = {y:6, x:1}

            ctx.drawImage(this.tileset, 
                tile.x * this.cellSize * 2,
                tile.y * this.cellSize * 2,
                this.cellSize * 2, this.cellSize * 2,
                x, y, this.cellSize, this.cellSize);
        }
    }

    c.drawImage(this.cacheCanvas,0,0);
}

Drawer.prototype.redraw = function() {
    this.clear();

    var carPosition = {x:0, y:0};
    carPosition.x = (state.x * this.cellSize);
    carPosition.y = (state.y * this.cellSize);

    if (this.locked) {
        c.setTransform(1,0,0,1,0,0);
        var center = c.transformedPoint(canvas.width/2, canvas.height/2);
        c.translate(center.x - carPosition.x, center.y - carPosition.y);
    }

    if (!this.cacheCanvas) {
        this.drawCache();
    }
    else {
        c.drawImage(this.cacheCanvas,0,0);
    }

    // TODO: Add nice rotation
    c.drawImage(this.car,carPosition.x,carPosition.y,this.cellSize, this.cellSize);
}

Drawer.prototype.update = function() {
    this.updateStats();
    this.redraw();
}

Drawer.prototype.updateStats = function() {

    var min = Math.floor((state.time / 1000) / 60);
    var sec = Math.floor((state.time / 1000) % 60);

    if (min < 10) { min = '0' + min; }
    if (sec < 10) { sec = '0' + sec; }

    $("#stats_hp").html(state.hp);
    $("#stats_speed").html(state.speed);
    //$("#stats_acceleration").html(state.acceleration);
    $("#stats_angle").html(state.angle+"°");
    $("#stats_time").html(min+":"+sec);

    if (state.drunk) {
        $("#stats_drunk").removeClass("text-success");
        $("#stats_drunk").addClass("text-danger");
    } else {
        $("#stats_drunk").removeClass("text-danger");
        $("#stats_drunk").addClass("text-success");
    }

    if (state.broken) {
        $("#stats_broken").removeClass("text-success");
        $("#stats_broken").addClass("text-danger");
    } else {
        $("#stats_broken").removeClass("text-danger");
        $("#stats_broken").addClass("text-success");
    }
}

// Adds ctx.getTransform() - returns an SVGMatrix
// Adds ctx.transformedPoint(x,y) - returns an SVGPoint
// Source: http://phrogz.net/tmp/canvas_zoom_to_cursor.html
function trackTransforms(ctx){
    var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
    var xform = svg.createSVGMatrix();
    ctx.getTransform = function(){ return xform; };
    
    var savedTransforms = [];
    var save = ctx.save;
    ctx.save = function(){
        savedTransforms.push(xform.translate(0,0));
        return save.call(ctx);
    };
    var restore = ctx.restore;
    ctx.restore = function(){
        xform = savedTransforms.pop();
        return restore.call(ctx);
    };

    var scale = ctx.scale;
    ctx.scale = function(sx,sy){
        xform = xform.scaleNonUniform(sx,sy);
        return scale.call(ctx,sx,sy);
    };
    var rotate = ctx.rotate;
    ctx.rotate = function(radians){
        xform = xform.rotate(radians*180/Math.PI);
        return rotate.call(ctx,radians);
    };
    var translate = ctx.translate;
    ctx.translate = function(dx,dy){
        xform = xform.translate(dx,dy);
        return translate.call(ctx,dx,dy);
    };
    var transform = ctx.transform;
    ctx.transform = function(a,b,c,d,e,f){
        var m2 = svg.createSVGMatrix();
        m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
        xform = xform.multiply(m2);
        return transform.call(ctx,a,b,c,d,e,f);
    };
    var setTransform = ctx.setTransform;
    ctx.setTransform = function(a,b,c,d,e,f){
        xform.a = a;
        xform.b = b;
        xform.c = c;
        xform.d = d;
        xform.e = e;
        xform.f = f;
        return setTransform.call(ctx,a,b,c,d,e,f);
    };
    var pt  = svg.createSVGPoint();
    ctx.transformedPoint = function(x,y){
        pt.x=x; pt.y=y;
        return pt.matrixTransform(xform.inverse());
    }
}