"use strict";
/*
 * 2017/04/07- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    var colorMatrixTable = document.getElementById("colorMatrixTable");
    var categorySelect = document.getElementById("categorySelect");
    var colorSelect    = document.getElementById("colorSelect");
    var category = categorySelect.value;
    var color    = colorSelect.value;
    var colorMatrix = color2Matrix[color];
    var colorWindow = 4;
    var colorSelectOptions = [];
    // saving all color select option elems
    for (var i = 0, n = colorSelect.options.length ; i < n ; i++) {
        colorSelectOptions.push(colorSelect.options[i]);
    }
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCanvas, colorMatrix);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "linearCheckbox":null},
		 function() {
		     drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCanvas, colorMatrix);
		 } );
    bindFunction({"categorySelect":null},
		 function() {
                     category = categorySelect.value;
                     console.log("category:"+category);
                     while (colorSelect.options.length > 0) {
                         colorSelect.remove(0);
                     }
                     for (var i = 0, n = colorSelectOptions.length ; i < n ; i++) {
                         var option = colorSelectOptions[i];
                         if (category === "all") {
                             colorSelect.add(option);
                         } else {
                             if (option.dataset && option.dataset.category) {
                                 if (category === option.dataset.category) {
                                     colorSelect.add(option);
                                 }
                             } else {
                                 if (category === "etc") {
                                     colorSelect.add(option);
                                 }
                             }
                         }
                     }
		 } );
    bindFunction({"colorSelect":null},
		 function() {
		     color = colorSelect.value;
		     colorMatrix = color2Matrix[color];
		     console.log(colorMatrix);
		     drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCanvas, colorMatrix);
		     setTableValues("colorMatrixTable", colorMatrix);
		 } );
    //
    bindTableFunction("colorMatrixTable", function(table, values, width) {
	colorMatrix = values;
	drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCanvas, colorMatrix);
    }, colorMatrix, colorWindow);
    console.log(colorMatrixTable);
}

var color2Matrix = {
    // colorName:[
    // colorMatrix],
    "ident":[
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1, 0],
    "red-add":[
	1, 0, 0, 0.5,
	0, 1, 0, 0,
	0, 0, 1, 0],
    "green-add":[
	1, 0, 0, 0,
	0, 1, 0, 0.5,
	0, 0, 1, 0],
    "blue-add":[
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1, 0.5],
    "red-mul":[
	1.5, 0, 0, 0,
  	0  , 1, 0, 0,
	0  , 0, 1, 0],
    "green-mul":[
	1, 0  , 0, 0,
	0, 1.5, 0, 0,
	0, 0  , 1, 0],
    "blue-mul":[
	1, 0, 0  , 0,
	0, 1, 0  , 0,
	0, 0, 1.5, 0],
    "rgb2gbr":[
	0, 1, 0, 0,
	0, 0, 1, 0,
	1, 0, 0, 0],
    "rgb2brg":[
	0, 0, 1, 0,
	1, 0, 0, 0,
	0, 1, 0, 0],
    "rgb2bgr":[
	0, 0, 1, 0,
	0, 1, 0, 0,
	1, 0, 0, 0],
    "rgb2grb":[
	0, 1, 0, 0,
	1, 0, 0, 0,
	0, 0, 1, 0],
    "rgb2rbg":[
	1, 0, 0, 0,
	0, 0, 1, 0,
	0, 1, 0, 0],
    "negate":[
	-1, 0, 0, 1,
	0, -1, 0, 1,
	0, 0, -1, 1],
    "grayBT601":[
        0.299, 0.587, 0.114, 0,
        0.299, 0.587, 0.114, 0,
	0.299, 0.587, 0.114, 0],
    "grayBT709":[
        0.2126, 0.7152, 0.0722, 0,
        0.2126, 0.7152, 0.0722, 0,
        0.2126, 0.7152, 0.0722, 0],
    /*
    "sepia":[
	107/255*((255-64)/107), 64/255, 64/255, 0,
	64/255, 74/255*((255-64)/107), 64/255, 0,
	64/255, 64/255, 43/255*((255-64)/107), 0],
    */
    "sepia":[
	0.75, 0.25, 0.25, 0,
	0.25, 0.50, 0.25, 0,
	0.25, 0.25, 0.30, 0],
    "sepia2":[
	0.75, 0.20, 0.20, 0,
	0.20, 0.60, 0.20, 0,
	0.20, 0.20, 0.45, 0],
};

function drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCancas, colorMatrix) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var linear = document.getElementById("linearCheckbox").checked;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawColorTransform(srcCanvas, dstCanvas, colorMatrix, linear);
}

function colorTransform(imageData, x, y, mat, linear) {
    var [r, g, b, a] = getRGBA(imageData, x, y);
    if (linear) {
	[r, g, b] = sRGB2linearRGB([r, g, b]);
	r *= 255; g *= 255; b *= 255;
    }
    var r2 = r*mat[0] + g*mat[1] + b*mat[2]  + 255*mat[3];
    var g2 = r*mat[4] + g*mat[5] + b*mat[6]  + 255*mat[7];
    var b2 = r*mat[8] + g*mat[9] + b*mat[10] + 255*mat[11];
    if (linear) {
	r2 /= 255; g2 /= 255; b2 /= 255;
	[r2, g2, b2] = linearRGB2sRGB([r2, g2, b2]);
    }
    return [r2, g2, b2, a];
}

function drawColorTransform(srcCanvas, dstCanvas, colorMatrix, linear) {
    // console.debug("drawColorTransform");
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
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX, srcY = dstY;
	    var rgba = colorTransform(srcImageData, srcX, srcY, colorMatrix, linear);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
