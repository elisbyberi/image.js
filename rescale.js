"use strict";
/*
* 2016/11/13- yoya@awm.jp . All Rights Reserved.
*/

main();

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndRescale(srcImage, srcCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "filterType":null,
		  "scaleRange":"scaleText",
		  "cubicBRange":"cubicBText",
		  "cubicCRange":"cubicCText",
		  "lobeRange":"lobeText"},
		 function() {
		     drawSrcImageAndRescale(srcImage, srcCanvas, dstCanvas);
		 } );
}

function drawSrcImageAndRescale(srcImage, srcCanvas, dstCancas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var params = {
	filterType: document.getElementById("filterType").value,
	scale: parseFloat(document.getElementById("scaleRange").value),
	cubicB:parseFloat(document.getElementById("cubicBRange").value),
	cubicC:parseFloat(document.getElementById("cubicCRange").value),
	lobe:  parseFloat(document.getElementById("lobeRange").value)
    };
    drawGraph(params)
    var srcWidth  = srcCanvas.width;
    var srcHeight = srcCanvas.height;
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = drawRescale(srcImageData, params);
    var dstWidth  = dstImageData.width;
    var dstHeight = dstImageData.height;
    dstCanvas.width = dstWidth;
    dstCanvas.height = dstHeight;
    dstCtx.putImageData(dstImageData, 0, 0);
}

function drawRescale(srcImageData, params) {
    // console.debug("drawRescale", srcImageData, params);
    var scale = params.scale;
    var filterType = params.filterType;
    var srcWidth  = srcImageData.width;
    var srcHeight = srcImageData.height;
    var dstWidth  = Math.round(scale * srcWidth);
    var dstHeight = Math.round(scale * srcHeight);
    var dstImageData = new ImageData(dstWidth, dstHeight);
    var dstData = dstImageData.data;
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
	for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var dstOffset = 4 * (dstX + dstY * dstWidth);
	    var srcX = dstX / scale;
	    var srcY = dstY / scale;
	    var [r,g,b,a] = rescalePixel(srcX, srcY, srcImageData, filterType);
	    setRGBA(dstImageData, dstX, dstY, [r,g,b,a]);
	}
    }
    return dstImageData;
}

function getRGBA_NN(imageData, x, y) {
    return getRGBA(imageData, Math.floor(x), Math.floor(y));
}

function linearRatio([a, b], p) {
    if (a === b) {
	return [0.5, 0.5];
    }
    var aRatio = (b - p) / (b - a);
    return [aRatio, 1 - aRatio];
}

function getRGBA_BiLinear(imageData, x, y) {
    var data = imageData.data;
    var width  = imageData.width;
    var height = imageData.height;
    var x1 = Math.floor(x), x2 = Math.ceil(x);
    var y1 = Math.floor(y), y2 = Math.ceil(y);
    if (x1 < 0) {
	x1 = 0;
    } else if (width <= x2) {
	x2 = width - 1;
    }
    if (y1 < 0) {
	y1 = 0;
    } else if (height <= y2) {
	y2 = height - 1;
    }
    var rgba = [0, 0, 0, 0];
    var [rx1, rx2] = linearRatio([x1, x2], x);
    var [ry1, ry2] = linearRatio([y1, y2], y);
    var r11 = rx1 * ry1;
    var r12 = rx1 * ry2;
    var r21 = rx2 * ry1;
    var r22 = rx2 * ry2;
    var rgba11 = getRGBA(imageData, x1, y1);
    var rgba12 = getRGBA(imageData, x1, y2);
    var rgba21 = getRGBA(imageData, x2, y1);
    var rgba22 = getRGBA(imageData, x2, y2);
    for (var i = 0 ; i < 4 ; i++) {
	rgba[i] = r11 * rgba11[i] +  r12 * rgba12[i] + r21 * rgba21[i] + r22 * rgba22[i];
    }
    return rgba;
}

function rescalePixel(srcX, srcY, srcImageData, filterType) {
    var rgba = null;
    switch (filterType) {
    case "NN":
	rgba = getRGBA_NN(srcImageData, srcX, srcY);
	break;
    case "BiLinear":
	rgba = getRGBA_BiLinear(srcImageData, srcX, srcY);
	break;
    default:
	rgba = [255, 0, 0, 255];
	break;
    }
    return rgba;
}
