"use strict";
/*
 * 2017/04/23- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcHistCanvas = document.getElementById("srcHistCanvas");
    var dstHistCanvas = document.getElementById("dstHistCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndHistogram(srcImage, srcCanvas, dstCanvas, srcHistCanvas, dstHistCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "equalizeCheckbox":null},
		 function() {
		     drawSrcImageAndHistogram(srcImage, srcCanvas, dstCanvas, srcHistCanvas, dstHistCanvas);
		 } );
}

function drawSrcImageAndHistogram(srcImage, srcCanvas, dstCancas, srcHistCanvas, dstHistCanvas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var equalize = document.getElementById("equalizeCheckbox").checked;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawHistogram(srcCanvas, dstCanvas, srcHistCanvas, dstHistCanvas, equalize);
}

function drawHistgramGraph(histCanvas, redHist, greenHist, blueHist) {
    var height = histCanvas.height;
    histCanvas.style.backgroundColor = "black";
    histCanvas.height = height; // canvas clear
    var ctx = histCanvas.getContext("2d");
    ctx.globalCompositeOperation = "lighter";
    var processList = [["#F00", redHist],
		       ["#0F0", greenHist],
		       ["#00F", blueHist]];
    var max = 0;
    for (var i = 0; i < processList.length ; i++) {
	var [color, hist]  =  processList[i];
	for (var j = 0 ; j < 256 ; j++) {
	    var v = hist[j];
	    if (max < v) {
		max = v;
	    }
	}
    }
    for (var i = 0; i < processList.length ; i++) {
	var [color, hist]  =  processList[i];
	ctx.strokeStyle=color;
	for (var x = 0 ; x < 256 ; x++) {
	    var nColor = hist[x];
	    var y = height - (nColor * height/max) - 1;
	    ctx.beginPath();
	    ctx.moveTo(x+0.5, height);
	    ctx.lineTo(x+0.5, y+0.5);
	    ctx.stroke();
	}
    }
}

function equalizeMap(redHist, greenHist, blueHist) {
    var map = new Uint8Array(256);
    var nColors = redHist.reduce( function(prev, cur) { return prev + cur; });
    nColors += greenHist.reduce( function(prev, cur) { return prev + cur; });
    nColors += blueHist.reduce( function(prev, cur) { return prev + cur; });
    var count = 0;
    for (var i = 0; i < 256 ; i++) {
	var c = redHist[i] + greenHist[i] + blueHist[i];
	if (c > 0) {
	    count += c;
	    map[i] = 255;
	    for (var j = 0; j < 256 ; j++) {
		if (count <= (nColors / 256 * (j+1))) {
		    map[i] = j;
		    break;
		}
	    }
	}
    }
    return map;
}


function drawHistogram(srcCanvas, dstCanvas, srcHistCanvas, dstHistCanvas, equalize) {
    // console.debug("drawHistogram");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth  = srcWidth;
    var dstHeight = srcHeight;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    var redHist   = getColorHistogramList(srcCanvas, "red");
    var greenHist = getColorHistogramList(srcCanvas, "green");
    var blueHist  = getColorHistogramList(srcCanvas, "blue");
    drawHistgramGraph(srcHistCanvas, redHist, greenHist, blueHist);
    if (equalize) {
	var colorMap = equalizeMap(redHist, greenHist, blueHist);
    } else {
	var colorMap = new Uint8Array(256).map(function(n, i) { return i; });
    }
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX;
	    var srcY = dstY;
	    var [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
	    setRGBA(dstImageData, dstX, dstY, [colorMap[r], colorMap[g],
					       colorMap[b], a]);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
    //
    var redHist   = getColorHistogramList(dstCanvas, "red");
    var greenHist = getColorHistogramList(dstCanvas, "green");
    var blueHist  = getColorHistogramList(dstCanvas, "blue");
    drawHistgramGraph(dstHistCanvas, redHist, greenHist, blueHist);
}