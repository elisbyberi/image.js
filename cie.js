"use strict";
/*
 * 2017/06/10- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    console.debug("cie main()");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var cieSelect = document.getElementById("cieSelect").value;
    var cieArr = null;
    var cie31Arr = null, cie64Arr = null;
    var hist = null;
    var loadCIEXYZdata = function() {
	var cieList = [31, 64];
	for (var i in cieList) {
	    var cie = cieList[i];
	    var file = (cie === 31)?"data/ciexyz31.json":"data/ciexyz64.json";
	    var xhr = new XMLHttpRequest();
	    xhr.onreadystatechange = function() {
		if (this.readyState === 4) {
		    var cie = this.cie;
		    var arr = JSON.parse(this.responseText);
		    var arr = arr.filter(function(e) {
			var lw =  e[0]; // length of wave
			return (370 < lw) && (lw < 720);
		    });
		    if (cie === 31) { // cieSelect as default
			cie31Arr = arr;
			cieArr = cie31Arr;
			drawGraph(graphCanvas, cieArr, cie31Arr);
			drawDiagram(dstCanvas, cieArr, hist);
		    } else {
			cie64Arr = arr;
		    }
		}
	    };
	    xhr.cie = cie;
	    xhr.open("GET", file, true); // async:true
	    xhr.send(null);
	    xhr = null;
	}
    }
    bindFunction({"cieSelect":null},
		 function() {
		     console.debug("cieSelect event");
		     cieSelect = document.getElementById("cieSelect").value;
		     if (cieSelect === "ciexyz31") {
			 cieArr = cie31Arr;
		     } else {
			 cieArr = cie64Arr;
		     }
		     drawGraph(graphCanvas, cieArr, cie31Arr);
		     drawDiagram(dstCanvas, cieArr, hist);
		 } );
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     hist = getColorHistogram(srcCanvas);
		     drawDiagram(dstCanvas, cieArr, hist);
		 } );
    bindFunction({"colorspaceSelect":null,
		  "tristimulusCheckbox":null,
		  "guideCheckbox":null},
		 function() {
		     drawGraph(graphCanvas, cieArr, cie31Arr);
		     drawDiagram(dstCanvas, cieArr, hist);
		 } );
    //
    dropFunction(document, function(dataURL) {
	console.debug("file drop");
	srcImage = new Image();
	srcImage.onload = function() {
	    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    hist = getColorHistogram(srcCanvas);
	    drawDiagram(dstCanvas, cieArr, hist);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    loadCIEXYZdata();
}

var worker = null;

function drawDiagram(dstCanvas, cieArr, hist) {
    var colorspace = document.getElementById("colorspaceSelect").value;
    var tristimulus = document.getElementById("tristimulusCheckbox").checked;
    var guide = document.getElementById("guideCheckbox").checked;
    var dstWidth = dstCanvas.width, dstHeight = dstCanvas.height;
    //
    dstCanvas.width  = dstWidth ; // clear
    drawDiagramBase(dstCanvas, cieArr, colorspace, tristimulus, guide);
    if (hist !== null) {
	var dstCtx = dstCanvas.getContext("2d");
	var dstImageData = dstCtx.getImageData(0, 0, dstWidth, dstHeight)
	if (worker) {
            worker.terminate();
	}
	var div = loadingStart();
	worker = new Worker("worker/cie.js");
	worker.onmessage = function(e) {
            var [imageData] = [e.data.image];
	    dstCtx.putImageData(imageData, 0, 0, 0, 0, dstWidth, dstHeight);
	    loadingEnd(div);
	}
	worker.postMessage({image:dstImageData, hist:hist, colorspace:colorspace}, [dstImageData.data.buffer]);
    }
}

function drawGraph(canvas, cieArr, cie31Arr) {
    var colorspace = document.getElementById("colorspaceSelect").value;
    var guide = document.getElementById("guideCheckbox").checked;
    canvas.width  = canvas.width ; // clear
    drawGraphBase(canvas, cieArr, cie31Arr, guide);
}


function graphTrans(xy, width, height) {
    var [x, y] = xy;
    return [x * width, (1 - y) * height];
}

function graphTransRev(xy, width, height) {
    var [x, y] = xy;
    return [x / width, 1 - (y / height)];
}

function drawDiagramBase(dstCanvas, cieArr, colorspace, tristimulus, guide) {
    var xyArr = [], rgbArr = [];
    for (var i = 0, n = cieArr.length ; i < n; i++) {
	var data = cieArr[i];
	var [wl, lx, ly, lz] = data;
	lxyz = [lx, ly, lz];
	var xy =  XYZ2xy(lxyz);
	var rgb = XYZ2sRGB(lxyz);
	if (colorspace === "ciexy") {
	    xyArr.push(xy);
	} else {
	    var uava = xy2uava(xy);
	    xyArr.push(uava);
	}
	rgbArr.push(rgb);
    }
    // drawing
    var width = dstCanvas.width, height = dstCanvas.height;
    var ctx = dstCanvas.getContext("2d");
    ctx.save();

    if (guide) { // draw axis
	for (var x = 0 ; x <= 10 ; x++) {
	    var [x1, y1] = graphTrans([x/10, 0], width, height);
	    var [x2, y2] = graphTrans([x/10, 1], width, height);
	    ctx.beginPath();
	    if (x%5 === 0){
		ctx.strokeStyle= "gray";
	    } else {
		ctx.strokeStyle= "lightgray";
	    }
	    ctx.moveTo(x1, y1);
	    ctx.lineTo(x2, y2);
	    ctx.stroke();
	}
	for (var y = 0 ; y <= 10 ; y++) {
	    var [x1, y1] = graphTrans([0, y/10], width, height);
	    var [x2, y2] = graphTrans([1, y/10], width, height);
	    ctx.beginPath();
	    if (y%5 === 0){
		ctx.strokeStyle= "gray";
	    } else {
		ctx.strokeStyle= "lightgray";
	    }
	    ctx.moveTo(x1, y1);
	    ctx.lineTo(x2, y2);
	ctx.stroke();
	}
    }
    // geometry mapping
    var gxyArr = [];
    for (var i in xyArr) {
	gxyArr.push(graphTrans(xyArr[i], width, height));
    }
    var cxyArr = xyArr2CntlArr(gxyArr);

    // clip definition
    ctx.beginPath();
    for (var i = 0, n = gxyArr.length ; i < n; i++) {
	var [gx, gy] = gxyArr[i];
	var [cx, cy] = cxyArr[i];
	var [r, g, b] = rgbArr[i];
	ctx.strokeStyle= "rgb("+r+","+g+","+b+")";
	if (i >= gxyArr.length - 1) {
	    ctx.lineTo(gx, gy);
	}else {
	    ctx.quadraticCurveTo(cx, cy, gx, gy);
	}
	// console.debug(cx, cy, gx, gy);
    }
    ctx.closePath();
    ctx.clip();
    //
    var offCanvas = document.createElement("canvas");
    var offCtx = offCanvas.getContext("2d");
    offCanvas.width = width ; offCanvas.height = height;
    var imageData = offCtx.createImageData(width, height);
    var data = imageData.data;
    var offset = 0;
    for (var y = 0 ; y < height ; y++) {
	for (var x = 0 ; x < width ; x++) {
	    var xy = graphTransRev([x, y], width, height);
	    if (colorspace === "ciexy") {
		var lxyz = xy2XYZ(xy)
	    } else {
		xy = uava2xy(xy);
		var lxyz = xy2XYZ(xy);
	    }
	    var [r, g, b] = XYZ2sRGB(lxyz);
	    data[offset++] = r;
	    data[offset++] = g;
	    data[offset++] = b;
	    data[offset++] = 255;
	}
    }
    offCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(offCanvas, 0, 0, width, height);
    if (tristimulus) {
	// ctx.globalCompositeOperation = "lighter";
	ctx.beginPath();
	ctx.strokeStyle = "rgba(100, 100, 100, 0.2)";
	ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
	var tristimulus_sRGB = [[0.6400, 0.3300	],
				[0.3000, 0.6000],
				[0.1500, 0.0600]];
	for (var i in tristimulus_sRGB) {
	    var xy = tristimulus_sRGB[i];
	    if (colorspace !== "ciexy") {
		xy = xy2uava(xy);
	    }
	    var [gx, gy] = graphTrans(xy, width, height);
	    if (i === 0) {
		ctx.moveTo(gx, gy);
	    } else {
		ctx.lineTo(gx, gy);
	    }
	}
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
    }
    ctx.restore();
}

function drawGraphBase(canvas, cieArr, cie31Arr, guide) {
    // console.debug("drawGraphBase", canvas, cieArr);
    canvas.style.backgroundColor = "black";
    var width = canvas.width;
    var height = canvas.height;
    var ctx = canvas.getContext("2d");
    var arrLen = cieArr.length;
    var lxArr = new Float32Array(arrLen);
    var lyArr = new Float32Array(arrLen);
    var lzArr = new Float32Array(arrLen);
    var xyRatioTable = [];
    var maxValue = 0;
    var grad = ctx.createLinearGradient(0, 0, width, 0);
    // spectrum gradient
    for (var i in cie31Arr) {
	var [wl, lx, ly, lz] = cie31Arr[i];
	if (wl <= 445) {
	    // wl: 445
	    var [x, y, z] = [0.348060000000,0.029800000000,1.782600000000];
	    var a = lz / 1.782600000000;
	} else if (wl < 605) {
	    var [x, y, z] = [lx, ly, lz];
	    var a = 1.0;
	} else {
	    // wl: 605
	    var [x, y, z] = [1.045600000000,0.566800000000,0.000600000000];
	    var a = lx / 1.045600000000;
	}
	var lrgb = XYZ2RGB([x, y, z]);
	var [r, g, b] = linearRGB2sRGB(lrgb);
	var color = "rgba("+r+","+g+","+b+","+a+")";
	grad.addColorStop(i / arrLen, color);
    }
    ctx.fillStyle = grad;
    ctx.rect(0, 0, width, height);
    ctx.fill();
    if (guide) { // axis
	for (var i in cieArr) {
	    var [wl, lx, ly, lz] = cieArr[i];
	    var x = width * i / arrLen;
	    if ((wl % 50) === 0) {
		ctx.beginPath();
		if ((wl % 100) === 0) {
		    ctx.strokeStyle= "rgb(127,127,127)";
		} else {
		    ctx.strokeStyle= "rgba(127,127,127, 0.3)";
		}
		ctx.moveTo(x, 0);
		ctx.lineTo(x, height);
		ctx.stroke();
	    }
	}
    }
    // color matching function
    for (var i in cieArr) {
	var [wl, lx, ly, lz] = cieArr[i];
	lxArr[i] = lx;
	lyArr[i] = ly;
	lzArr[i] = lz;
    }
    var lxMax = Math.max.apply(null, lxArr);
    var lyMax = Math.max.apply(null, lyArr);
    var lzMax = Math.max.apply(null, lzArr);
    var lMax = Math.max.apply(null, [lxMax, lyMax, lzMax]);
    var graphLines = [["#F88", lxArr], ["#AFA", lyArr], ["#88F", lzArr]];
    // ctx.globalCompositeOperation = "lighter";
    for (var i in graphLines) {
	var [color, arr] = graphLines[i];
	ctx.strokeStyle = color;
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.moveTo(0, height);
	for (var j = 1, n = arr.length ; j < n ; j++) {
	    var x = width * j / n;
	    var y = height * (1 - arr[j] / lMax);
	    ctx.lineTo(x, y);
	}
	ctx.stroke();
    }
}
