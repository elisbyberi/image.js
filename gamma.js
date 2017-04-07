"use strict";
/*
 * 2017/04/02- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var gammaCanvas = document.getElementById("gammaCanvas");
    srcCanvas.style.border = "thick solid red";
    dstCanvas.style.border = "thick solid green";
    gammaCanvas.style.border = "thick solid blue";
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndGamma(srcImage, srcCanvas, dstCanvas, gammaCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "gammaRange":"gammaText"},
		 function() {
		     drawSrcImageAndGamma(srcImage, srcCanvas, dstCanvas, gammaCanvas);
		 } );
}
function drawSrcImageAndGamma(srcImage, srcCanvas, dstCancas, gammaCanvas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var gamma = parseFloat(document.getElementById("gammaRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawGammaGraph(gammaCanvas, gamma);
    drawGammaImage(srcCanvas, dstCanvas, gamma);
}


function drawGammaGraph(gammaCanvas, gamma) {
    var ctx = gammaCanvas.getContext("2d");
    ctx.fillStyle="black";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle="white";
    ctx.beginPath();
    ctx.moveTo(256, 0)
    ctx.lineTo(256, 256);
    ctx.lineTo(0, 256);
    for (var x = 0 ; x < 256 ; x++) {
	var v1 = x / 255;
    	var v2 = Math.pow(v1, gamma);
	var y = (1 - v2) * 255;
	ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
}

function drawGammaImage(srcCanvas, dstCanvas, gamma) {
    // console.debug("drawCopy");
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
    var srcData = srcImageData.data;
    var dstData = dstImageData.data;
    //
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX;
	    var srcY = dstY;
	    var [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
	    r = Math.pow(r/255, gamma) * 255;
	    g = Math.pow(g/255, gamma) * 255;
	    b = Math.pow(b/255, gamma) * 255;
	    a = Math.pow(a/255, gamma) * 255;
	    setRGBA(dstImageData, dstX, dstY, [r, g, b, a]);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
