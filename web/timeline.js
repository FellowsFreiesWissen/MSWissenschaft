/*
    strawberry limes: create interactive OpenLayers maps with time-based POIs
    Copyright (C) 2013 Johannes Kroll

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var barY= 120;
var eventXScale= getConfig('timelineScaling', 2);
var timelineMin= getConfig('timelineMin', -50);
var timelineMax= getConfig('timelineMax', 565);
var timelineInitial= getConfig('timelineInitial', 125);
var timelineUnit= getConfig('timelineUnit', 'years');

var dragBegin= 0;
var dragBeginPoint= 0;
var dragging= false;

function timelineFormatTime(selectedTime) {
    if(timelineUnit=='days') {
        var options= {month: "numeric", day: "numeric", "year": "numeric"};
        var dateMS= new Date(beginDate + Math.round(selectedTime) * 1000*60*60*24);
        var fmt= new Date(Date.parse(dateMS)).toLocaleDateString('de-DE', options);
        return fmt;
    }
    else {
        return '' + Math.round(selectedTime);
    }
}

function timelineSetTime(selectedTime) {
	var outer= document.getElementById('timeline-outer'); 
	var outerClientRect= outer.getBoundingClientRect();
	document.getElementById('timeline-inner').style.left= ((outerClientRect.right-outerClientRect.left)*.5 - selectedTime*eventXScale) + "px";
	//~ document.getElementById('time-display').innerHTML= '' + Math.round(selectedTime);
	document.getElementById('time-display').innerHTML= timelineFormatTime(selectedTime);
}

function timelineGotoDate(date) {
    var time= Math.floor((date-beginDate) / (1000*60*60*24));
    timelineSetTime(time);
    setPOILayerTime(time);
}

function returnfalse() {
	return false;
}

function timelineClick(evt) {
	if(!evt) var evt= window.event;
	var inner= document.getElementById('timeline-inner'); 
	var innerClientRect= inner.getBoundingClientRect();
	var selectedTime= Math.round((evt.clientX-innerClientRect.left)/eventXScale);
	var y= evt.clientY-innerClientRect.top;
	if(y>=barY-10 && y<=barY+20)
	{
		timelineSetTime(selectedTime);
		setPOILayerTime(selectedTime);
	}
	return false;
}

var moveTimeoutHandle;
function moveTimeout(time) {
	timelineSetTime(time);
	setPOILayerTime(time);
	moveTimeoutHandle= false;
}
function timelineSetMoveTimeout(time) {
	if(moveTimeoutHandle) clearInterval(moveTimeoutHandle);
	moveTimeoutHandle= setTimeout(function() { moveTimeout(time) }, 250);
}

function timelineMousedown(evt) {
	if(!evt) var evt= window.event;
	var outer= document.getElementById('timeline-outer'); 
	var outerClientRect= outer.getBoundingClientRect();
	dragBegin= (evt.clientX-outerClientRect.left);
	var selectedTime= Math.round(((evt.clientX-outerClientRect.left))/eventXScale);
	var y= evt.clientY-outerClientRect.top;
	if(y>=barY-10 && y<=barY+20)
	{
		//timelineSetTime(selectedTime);
		dragging= true;
		dragBeginPoint= timerCurrTime;
		//if(outer.setCapture) outer.setCapture();
	}
	return false;
}


function timelineMousemove(evt) {
	if(!dragging) return false;
	if(!evt) var evt= window.event;
    if(timerID) timerStop();
	var outer= document.getElementById('timeline-outer'); 
	var outerClientRect= outer.getBoundingClientRect();
	var selectedTime= Math.round((dragBegin-(evt.clientX-outerClientRect.left))/eventXScale) + dragBeginPoint;
	selectedTime= Math.min( Math.max(selectedTime, timelineMin), timelineMax );
	timelineSetTime(selectedTime);
	//setPOILayerTime(selectedTime);
	timelineSetMoveTimeout(selectedTime);
	return false;
}

function timelineMouseup(evt) {
	var outer= document.getElementById('timeline-outer'); 
	//if(outer.releaseCapture) outer.releaseCapture();
	if(!dragging) return false;
	if(!evt) var evt= window.event;
	dragging= false;
	var outerClientRect= outer.getBoundingClientRect();
	var selectedTime= Math.round((dragBegin-(evt.clientX-outerClientRect.left))/eventXScale) + dragBeginPoint;
	selectedTime= Math.min( Math.max(selectedTime, timelineMin), timelineMax );
	timelineSetTime(selectedTime);
	setPOILayerTime(selectedTime);
	return false;
}
/*
function timelineMouseout(evt) {
	dragging= false;
	timelineSetTime(timerCurrTime);
}
*/

function createRotationCSS(angle, origin) {
	origin+= ';';
	var css= 'transform: rotate(' + angle + 'deg); ' + 
			'transform-origin: ' + origin +
			'-ms-transform: rotate(' + angle + 'deg); ' + 
			'-ms-transform-origin: ' + origin +
			'-moz-transform: rotate(' + angle + 'deg); ' +
			'-moz-transform-origin: ' + origin +
			'-webkit-transform: rotate(' + angle + 'deg); ' +
			'-webkit-transform-origin: ' + origin +
			'-o-transform: rotate(' + angle + 'deg); '+
			'-o-transform-origin: ' + origin;
	return css;
}

function createLabelText(text, xpos_int, angle, origin) {
	var xpos= xpos_int + "px";
	var label= document.createElement('div');
	label.style.cssText= 'float: left; ' + 
			'position: absolute; ' +
			'left: ' + xpos + '; ' +
			createRotationCSS(angle, origin);
	label.innerHTML= text;
	return label;
}

function createEventLabelText(elem, text, xpos) {
	var label= createLabelText(text, xpos, -22, "-25px 25px");
	var rect= elem.getBoundingClientRect();
	var height= rect.bottom-rect.top;
	var bottomDist= height - barY;
	label.style.cssText+= 
			'font-size: 12.5px; ' +
            'line-height: 12.5px; ' + 
			//~ 'text-decoration: underline; ' +
			'white-space: nowrap; ' +
			'text-align: left; ' +
			'bottom: ' + bottomDist + 'px; ' +
            'color: #fff;';
	return label;
}

function createLabelIndicator(xpos) {
	var indicator= document.createElement('div');
	indicator.style.cssText= 'float: left; ' + 
			'position: absolute; ' +
			'left: ' + xpos + 'px; ' +
			'top: ' + (barY-10) + 'px; ' +
			'width: 2px; ' +
			'height: 10px; ' +
			'background-color: #fff; ';
	return indicator;
}

function createTimelineIndicator(xpos) {
	var indicator= document.createElement('div');
	indicator.style.cssText= 'float: left; ' + 
			'position: absolute; ' +
			'left: ' + xpos + 'px; ' +
			'top: ' + barY + 'px; ' +
			'width: 2px; ' +
			'height: 10px; ' +
			'background-color: #fff; ';
	return indicator;
}

function createLabel(elem, text, xpos, onClick) {
    var lbltxt= createEventLabelText(elem, text, xpos*eventXScale)
    if(onClick) lbltxt.onclick= onClick;
	elem.appendChild(lbltxt);
	elem.appendChild(createLabelIndicator(xpos*eventXScale));
}

function timelineOnresize() {
	timelineSetTime(timerCurrTime);
}

function createTimelineMarker(elem, xpos) {
	elem.appendChild(createTimelineIndicator(xpos*eventXScale));
	var label= createLabelText(xpos+'', xpos*eventXScale-50, 0, "0px 0px");
	label.style.cssText+= 
		'width: 100px; ' +
		'text-align: center; ' +
		'font-size: 10.5px; ' +
		'top: ' + (barY+8) + 'px; ';
	elem.appendChild(label);
}

function timelineReset() {
    timelineGotoDate(Date.now()); // + 60 * (1000*60*60*24));    // XXXXXXXXXXXX change to Date.now() when finished
}

function createTimeline() {
	var events= getConfig('timelineEvents', []);
    var timelineMarkerBegin= getConfig('timelineMarkerBegin', -100);
    var timelineMarkerEnd= getConfig('timelineMarkerEnd', 600);
    var timelineMarkerStep= getConfig('timelineMarkerStep', 100);
	
	inner= document.getElementById('timeline-inner');
	outer= document.getElementById('timeline-outer');
	
	var grabr= document.createElement('div');
	grabr.style.cssText= 'position: absolute; ' + 
		'top: ' + (barY-6) + 'px; ' +
		'width: 100%; ' +
		'height: 28px; ' +
        'background:rgba(0, 32, 64, 1); ';
		//'background-color: #ddf; ';
	outer.appendChild(grabr);

	// and another one, transparent but with cursor:move and higher z-index...
	grabr= document.createElement('div');
	grabr.style.cssText= 'position: absolute; ' + 
		'top: ' + (barY-6) + 'px; ' +
		'width: 100%; ' +
		'height: 28px; ' +
		'cursor: move; ' +
		'z-index: 10; ' +
		'background-color: transparent; ';
	outer.appendChild(grabr);

	var len= events.length;
	for(var i= 0; i<len; i++)
    {
        function mktimesetter(time) { var mytime= time; return function() { timelineSetTime(mytime); setPOILayerTime(mytime); }; }
		createLabel(inner, events[i]['title'], events[i]['time'], mktimesetter(events[i]['time']));
    }
	
	var bar= document.createElement('div');
	bar.style.cssText= 'position: absolute; ' +
			'left: 0px; ' + 
			'top: ' + barY + 'px; ' +
			'width: 100%; ' +
			'height: 2px; ' +
			'background-color: #fff; ';
	inner.appendChild(bar);
	outer.appendChild(bar);
	
    if(timelineMarkerStep>0)
    {
        for(var i= timelineMarkerBegin; i<=timelineMarkerEnd; i+= timelineMarkerStep)
            createTimelineMarker(inner, i);
    }
	
	/*
	var img= document.createElement('img');
	img.src= 'gradient-w.png';
	img.style.cssText= 'position: absolute; ' +
		'right: 0px; ' + 
		'top: 0px; ' + 
		'width: 128px; ' +
		'z-index: 2; ' +
		'height: 500px;';
	outer.appendChild(img);
	
	var img2= document.createElement('img');
	img2.src= 'gradient-w.png';
	img2.style.cssText= 'position: absolute; ' +
		'left: 64px; ' + 
		'top: 0px; ' + 
		'width: 128px; ' +
		'z-index: 2; ' +
		'height: 500px; ' +
		createRotationCSS(180, '32px 128px');
	outer.appendChild(img2);
	*/
	
	//outer.onclick= timelineClick;
	grabr.onmousedown= timelineMousedown;
	grabr.onmousemove= timelineMousemove;
	grabr.onmouseup= timelineMouseup;
	//outer.onmouseout= timelineMouseout;
	grabr.ondoubleclick= returnfalse;
	
	// prevent browser from creating stupid selection 
	// might be better to somehow chain events to the map
	//~ outer.onmousemove= returnfalse;
	//~ outer.onmousedown= returnfalse;
	//~ outer.onmouseup= returnfalse;
	
	
	var body= document.getElementsByTagName('body')[0];
	body.onresize= timelineOnresize;
	body.onmousemove= timelineMousemove;
	body.onmouseup= timelineMouseup;
	
	//~ timelineSetTime(10); //timelineInitial);
    timelineReset();
}
