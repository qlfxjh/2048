
/* 通用横向滚动类代码 */
//参数strId:wrapper div's ID; nTime:autoPlayer Interval Time; displayNum: how many Item in one screen;
//引用格式如：var slider01 = new JW_Slider("slider_02",235,4000,4);
function JW_Slider(strId,itemWidth, nTime, nDisplayNum){
	//var SLOWINOUT = [0,0.024,0.093,0.205,0.343,0.5,0.657,0.795,0.907,0.976,1];
	var SLOWINOUT = [0,0.006,0.018,0.036,0.06,0.09,0.126,0.168,0.216,0.27,0.33,0.396,0.468,0.54,0.612,0.678,0.738,0.792,0.84,0.882,0.918,0.948,0.972,0.99,1];
	var nInterTime = nTime||5000;
	var displayNum = nDisplayNum||1;
	var Index=0;
	var Wrapper = $('#'+strId);
	var WrapperInner = Wrapper.find('.slider_scroll');
	var Items = WrapperInner.find('li');
	var ItemsLength = Items.length;
	var maxIndex = ItemsLength - displayNum;
	var SliderCtrl = Wrapper.find('.slider_ctrl');
	var SliderCtrlCon = SliderCtrl.find('.slider_ctrl_con');
	var SliderCtrlPrev = SliderCtrl.find('.slider_ctrl_prev');
	var SliderCtrlNext = SliderCtrl.find('.slider_ctrl_next');
	var picWidth= itemWidth;
	var handleTime;
	var handleInter;
	var finalLeft = 0;
	var oldLeft = 0;
	var stepMax = SLOWINOUT.length-1;
	var step = 0;
	var ifUnderMoving = false;
	var clientWidth;
	function init(){
		
		clientWidth = document.documentElement.clientWidth;
		if(itemWidth=="fullScreen"){
			picWidth = clientWidth;
		}
		
		Wrapper[0].onmouseover = function(){
			if(handleInter!=null){
				clearInterval(handleInter);
				handleInter = null;
			}
		}
		Wrapper[0].onmouseout = function(){
			if(handleInter!=null){
				clearInterval(handleInter);
				handleInter = null;
			}
			handleInter = setInterval(AutoRun,nInterTime);
			
		}
		WrapperInner.css("width",picWidth+"px");
		WrapperInner.find('ul').css('width',ItemsLength*(picWidth+1)+"px");
		WrapperInner.find('li').css('width',picWidth+"px");
		
		//梆定切换触发事件,可根据情况自定义
		SliderCtrlCon.bind('click',ctrlConClick);
		SliderCtrlPrev.bind('click',go_left);
		SliderCtrlNext.bind('click',go_right);
		
		WrapperInner[0].scrollLeft = 0;
		
		var hammerTime = Hammer(Wrapper[0],{swipeVelocityX: 0.1}).on("swipe",onSwipe);
	}
	function onSwipe(event){
		var newTop, newLeft;
		var dir = event.gesture.direction;
		if(dir==Hammer.DIRECTION_LEFT){
			//alert("left");
			go_right();
		}else if(dir==Hammer.DIRECTION_RIGHT){
			//alert("right");
			go_left();
		}
	}
	
	function ctrlConClick(){
		if(ifUnderMoving){
			//播放器正在移动中，不能再操作。
			return;
		}
		for(var i=0; i<ItemsLength; i++){
			if(SliderCtrlCon[i]==this){
				go_to(displayNum*i);
			}
		}
		if(handleInter!=null){
			clearInterval(handleInter);
			handleInter = null;
		}
		handleInter = setInterval(AutoRun,nInterTime);
	}
	function AutoRun(){
		go_right();
	}
	function slideTo(){
		step++;
		var dis = finalLeft - oldLeft;
		if(step<stepMax){
			WrapperInner[0].scrollLeft = oldLeft + parseInt((finalLeft - oldLeft)*SLOWINOUT[step]);
			console.debug(oldLeft + parseInt((finalLeft - oldLeft)*SLOWINOUT[step]));
			handleTime=setTimeout(slideTo,25);
		}
		else{
			WrapperInner[0].scrollLeft = finalLeft;
			ifUnderMoving = false;
		}
	}
	function Shift(){
		ifUnderMoving = true;
		step = 0;
		oldLeft = parseInt(WrapperInner[0].scrollLeft);
		finalLeft = Index*picWidth;
		SliderCtrlCon.removeClass('current');
		SliderCtrlCon.eq(Math.ceil(Index/displayNum)).addClass('current');
		slideTo();
	}
	function go_right(){
		if(ifUnderMoving){
			//播放器正在移动中，不能再操作。
			return;
		}
		//已在最后一屏了，需要回到最左边
		if(Index==maxIndex){
			//Index=0;
			//Shift();
			return;
		}
		
		//未到最后一屏的话，就往后一屏，如果往右一屏不足，则滚到最大值
		Index += displayNum;
		if(Index > maxIndex){
			Index = maxIndex;
		}
		Shift();
	}
	this.goRight = go_right;
	function go_left(){
		if(ifUnderMoving){
			//播放器正在移动中，不能再操作。
			return;
		}
		if(Index==maxIndex&&ItemsLength%displayNum!=0){
			Index = parseInt(maxIndex/displayNum)*displayNum;
		}else{
			Index = Index - displayNum;
		}
		
		if(Index<0){
			//Index = maxIndex;
			return;
		}
		
		Shift();
	}
	this.goLeft = go_left;
	
	function go_to(idx){
		if(idx<0){
			Index = 0;
		}else if(idx < maxIndex){
			Index = idx;
		}else{
			Index = maxIndex;
		}
		
		Shift();
	}
	this.goTo = go_to;
	this.getIndex = function(){
		return Index;
	}
	init();
	handleInter = setInterval(AutoRun,nInterTime);
}
