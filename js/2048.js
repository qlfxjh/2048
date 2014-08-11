

function Game2048(){
	var SLOWINOUT= [0,0.024,0.093,0.205,0.343,0.5,0.657,0.795,0.907,1];
	var SLOWIN = [0,0.113,0.219,0.319,0.411,0.50,0.577,0.65,0.75,0.774,0.826,0.871,0.9,0.941,0.966,0.984,0.995,1];
	var colorSet = {4:"level_1", 8:"level_2", 16:"level_3", 32:"level_4", 64:"level_5", 128:"level_6", 256:"level_7", 512:"level_8", 1024:"level_9", 2048:"level_10"};
	var wrap = $("#game_field");
	var txtBest = $("#txt_best");
	var txtScore = $("#txt_score");
	var score = 0;
	var bestScore = 0;
	var cells = new Array(16);
	var spots = [];
	var cellWidth = 94;
	var cellHeight = 94;
	var scene;	//保存当前一屏的状态
	var scenes = [];	//保存从开始每一屏的状态
	var moveStep;
	var ifUnderMoving = false;
	var btn_up = document.getElementById("btn_up");
	var btn_down = document.getElementById("btn_down");
	var btn_left = document.getElementById("btn_left");
	var btn_right = document.getElementById("btn_right");
	var btn_fallback = document.getElementById("btn_fallback");
	var btn_automove = document.getElementById("btn_automove");
	var btn_autopilot = document.getElementById("btn_autopilot");
	var steps = [];	//这个数据存放每一步移动的数据，每个数元素又是一个长度为16的数组，里面记录了每一个格子上的值。
	var ifWin = false;
	var ifAutoPilot = false;
	var handleAutoPilot = null;
	var dirPriority;
	
	function _init(){
		spots = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
		
		//读取最高分数
		var bestScore = localStorage.getItem("bestScore");
		txtBest.html(bestScore);
		
		
		//响应输入的事件绑定
		$(document.body).on("keydown",onKeyPress);
		btn_up.onclick = function(){move("up")};
		btn_down.onclick = function(){move("down")};
		btn_left.onclick = function(){move("left")};
		btn_right.onclick = function(){move("right")};
		btn_automove.onclick = autoMove;
		btn_fallback.onclick = fallback;
		btn_autopilot.onclick = autoPilot;
		
		//生成并插入二个基础块
		for(var i=0; i<2; i++){
			createBaseCell();
		}
		var step = spots.concat();
		steps.push(step);
		
	}
	
	function onKeyPress(){
		var keyCode = event.keyCode;
		switch(keyCode){
			case 40:
				move("down");
				bink(btn_down);
				break;
			case 38:
				move("up");
				bink(btn_up);
				break;
			case 37:
				move("left");
				bink(btn_left);
				break;
			case 39:
				move("right");
				bink(btn_right);
				break;
			case 32:
				autoMove();
				bink(btn_automove);
				break;
			case 8:
				fallback();
				bink(btn_fallback);
				break;
			default:
				
		}
		
	}
	
	//退一步
	function fallback(){
		if(steps.length>0){
			var step = steps.pop();
			setScene(step);
		}else{
			alert("for god sake, you can't fallback over the first step!");
		}
	}
	
	function autoPilot(){
		if(ifAutoPilot){
			//取消自动操作
			clearInterval(handleAutoPilot);
			btn_autopilot.innerHTML = "Auto Pilot<s>off</s>";
			ifAutoPilot = false;
		}else{
			//开启自动操作
			handleAutoPilot = setInterval(autoMove,400);
			btn_autopilot.innerHTML = "Auto Pilot<s>on</s>";
			ifAutoPilot = true;
		}
	}
	
	
	//自动走一步
	function autoMove(){
		//先判断四个方向上哪个方向的可合并情况，
		//规则是优先合并大数字，如果数字相同，则判断合并后的下一步的可合并情况。如果下一步可合并的情况更好，则按照这种方式移动一步。
		var dir;
		var aPredict = predictVanish(spots);
		scoringLeftRight = aPredict.leftright.nMax*aPredict.leftright.time;
		scoringUpDown = aPredict.updown.nMax*aPredict.updown.time;
		//console.debug("scoringLeftRight"+scoringLeftRight+"; scoringUpDown:"+scoringUpDown);
		
		
		var aPredictAfterLeft = predictVanish(simulateMove("left",spots));
		var aPredictAfterRight = predictVanish(simulateMove("right",spots));
		var aPredictAfterUp = predictVanish(simulateMove("up",spots));
		var aPredictAfterDown = predictVanish(simulateMove("down",spots));
		
		
		var allLeft;//如果假设是本次向左移动的合并值以后左移动后下一步的最大能合并值(下一步的上下/或左右中取较大的)
		var aPredictAfterLeftLeftRight = aPredictAfterLeft.leftright.nMax*aPredictAfterLeft.leftright.time;
		var aPredictAfterLeftUpDown = aPredictAfterLeft.updown.nMax*aPredictAfterLeft.updown.time;
		if(aPredictAfterLeftLeftRight>aPredictAfterLeftUpDown){
			allLeft = aPredict.leftright.nMax*aPredict.leftright.time + aPredictAfterLeftLeftRight;
		}else{
			allLeft = aPredict.leftright.nMax*aPredict.leftright.time + aPredictAfterLeftUpDown;
		}
		
		var allRight;//如果假设是本次向右移动的合并值以后左移动后下一步的最大能合并值(下一步的上下/或左右中取较大的)
		var aPredictAfterRightLeftRight = aPredictAfterRight.leftright.nMax*aPredictAfterRight.leftright.time;
		var aPredictAfterRightUpDown = aPredictAfterRight.updown.nMax*aPredictAfterRight.updown.time;
		if(aPredictAfterRightLeftRight>aPredictAfterRightUpDown){
			var allRight = aPredict.leftright.nMax*aPredict.leftright.time + aPredictAfterRightLeftRight;
		}else{
			var allRight = aPredict.leftright.nMax*aPredict.leftright.time + aPredictAfterRightUpDown;
		}
		
		var allUp;//如果假设是本次向上移动的合并值以后左移动后下一步的最大能合并值(下一步的上下/或左右中取较大的)
		var aPredictAfterUpLeftRight = aPredictAfterUp.leftright.nMax*aPredictAfterUp.leftright.time;
		var aPredictAfterUpUpDown = aPredictAfterUp.updown.nMax*aPredictAfterUp.updown.time;
		if(aPredictAfterUpLeftRight > aPredictAfterUpUpDown){
			var allUp = aPredict.leftright.nMax*aPredict.leftright.time + aPredictAfterUpLeftRight;
		}else{
			var allUp = aPredict.leftright.nMax*aPredict.leftright.time + aPredictAfterUpUpDown;
		}
		
		var allDown;//如果假设是本次向下移动的合并值以后左移动后下一步的最大能合并值(下一步的上下/或左右中取较大的)
		var aPredictAfterDownLeftRight = aPredictAfterDown.leftright.nMax*aPredictAfterDown.leftright.time;
		var aPredictAfterDownUpDown = aPredictAfterDown.updown.nMax*aPredictAfterDown.updown.time;
		if(aPredictAfterDownLeftRight>aPredictAfterDownUpDown){
			var allDown = aPredict.leftright.nMax*aPredict.leftright.time + aPredictAfterDownLeftRight;
		}else{
			var allDown = aPredict.leftright.nMax*aPredict.leftright.time + aPredictAfterDownUpDown;
		}
		//console.debug("allLeft:"+allLeft+"; AllRight:"+allRight+"; AllUp:"+allUp+"; allDown:"+allDown);		
		
		
		
		dirPriority = [{dir:"left", value:allLeft}, {dir:"right", value:allRight}, {dir:"up", value:allUp}, {dir:"down", value:allDown}];
		dirPriority.sort(function(a,b){
			if(a.value>b.value){
				return false;
			}else{
				return true;
			}
		});
		//console.debug(dirPriority[0].value+"_"+dirPriority[1].value+"_"+dirPriority[2].value+" "+dirPriority[3].value);
		
		for(var i=0; i<4; i++){
			if(dirPriority[i].dir == "left"||dirPriority[i].dir == "right"){
				if(scoringLeftRight!=0){
					dir = dirPriority[i].dir;
					break;
				}
			}else{
				if(scoringUpDown!=0){
					dir = dirPriority[i].dir;
					break;
				}
			}
			
		}
		
		
		
		//如果最后也没判断出方向那么就随机移吧
		if(!dir){
			var ranNum = createRandom(4);
			switch(ranNum){
				case 0:
					dir = "up";
					break;
				case 1:
					dir = "down";
					break;
				case 2:
					dir = "left";
					break;
				case 3:
					dir = "right";
					break;
				default:
					break;
			}
			//console.debug("random move "+dir);
		}
		
		move(dir);
		switch(dir){
			case "up":
				bink(btn_up);
				break;
			case 1:
				bink(btn_down);
				break;
			case 2:
				bink(btn_left);
				break;
			case 3:
				bink(btn_right);
				break;
			default:
				break;
		}
		
		
	}
	
	function simulateMove(dir, spots){
		var _step = spots.concat();
		var _nexts = new Array(16);
		if(dir=="left"){
			var curValue, nextIndex, freeSpare, tmpCol;
		
			//这里是判断向左的
			//找出每个元素的指定方向上的下一位的坐标，存入_nexts;
			
			for(var i=0; i<_step.length; i++){
				_nexts[i] = -1;	//因为下一位元素的坐标有可能是0, 当倒序的时候。所以要有-1来表示不存在下一位元素。
				if((i+1)%4==0||_step[i]==0){
					//本位元素为最后一列或是本位元素为0则直接跳过
				}else{
					for(var k = 1; k<4; k++){
						if(_step[i+k]==0){
							//预览的下一位为0,则再找下下位
						}else{
							_nexts[i]=i+k;
							break;
						}
						if((i+k+1)%4==0){
							//这一测试位已是最边上了，没有下一位了。跳出循环
							break;
						}
					}
					
				}
			}
			//console.debug("_nexts:"+_nexts);
			var counter=0;
			//与下一位合并
			for(var i=0; i<_step.length; i++){
				if(_step[i]==_step[_nexts[i]]){
					_step[i] = _step[i]*2;
					_step[_nexts[i]] = 0;
					i = _nexts[i];
				}
			}
			//console.debug("sept after merge:"+_step);
			//合并后，挤掉空位
			for(var i=0; i<_step.length; i++){
				if(i%4==0){
					freeSpare = 0;
				}
				if(_step[i]==0){
					freeSpare++;
				}else{
					if(freeSpare>0){
						_step[i-freeSpare] = _step[i];
						_step[i] = 0;
					}
				}
			}
			//console.debug("step after trim:"+_step);

		}
		
		if(dir=="right"){
			var curValue, nextIndex, freeSpare, tmpCol;
		
			//这里是判断向right的
			//找出每个元素的指定方向上的下一位的坐标，存入_nexts;
			
			for(var i=_step.length-1; i>=0; i--){
				_nexts[i] = -1;	//因为下一位元素的坐标有可能是0, 当倒序的时候。所以要有-1来表示不存在下一位元素。
				if((i)%4==0||_step[i]==0){
					//本位元素为最左一列或是本位元素为0则直接跳过
				}else{
					for(var k = 1; k<4; k++){
						if(_step[i-k]==0){
							//预览的下一位为0,则再找下下位
						}else{
							_nexts[i]=i-k;
							break;
						}
						if((i-k)%4==0){
							//这一测试位已是最边上了，没有下一位了。跳出循环
							break;
						}
					}
					
				}
			}
			//console.debug("_nexts:"+_nexts);
			var counter=0;
			//与下一位合并
			for(var i=_step.length-1; i>=0; i--){
				if(_step[i]==_step[_nexts[i]]){
					_step[i] = _step[i]*2;
					_step[_nexts[i]] = 0;
					i = _nexts[i];
				}
			}
			//console.debug("sept after merge:"+_step);
			//合并后，挤掉空位
			for(var i=_step.length-1; i>=0; i--){
				if((i+1)%4==0){
					freeSpare = 0;
				}
				if(_step[i]==0){
					freeSpare++;
				}else{
					if(freeSpare>0){
						_step[i+freeSpare] = _step[i];
						_step[i] = 0;
					}
				}
			}
			//console.debug("step after trim:"+_step);
		}
		
		if(dir=="up"){
			var curValue, nextIndex, freeSpare, tmpCol, curSpot;
		
			//这里是判断向上的
			//找出每个元素的指定方向上的下一位的坐标，存入_nexts;
			
			for(var i=0; i<_step.length; i++){
				_nexts[i] = -1;	//因为下一位元素的坐标有可能是0, 当倒序的时候。所以要有-1来表示不存在下一位元素。
				curSpot = (i%4)*4+Math.floor(i/4);
				//console.debug(curSpot+"_"+_step[curSpot]);
				if((i+1)%4==0||_step[curSpot]==0){
					//本位元素为最后一行或是本位元素为0则直接跳过
				}else{
					for(var k = 4; k<16; k+=4){
						if(_step[curSpot+k]==0){
							//预览的下一位为0,则再找下下位
						}else{
							_nexts[curSpot] = curSpot+k;
							break;
						}
						if((curSpot+k)>=12){
							//这一测试位已是最边上了，没有下一位了。跳出循环
							break;
						}
					}
					
				}
			}
			//console.debug("_nexts:"+_nexts);
			var counter=0;
			//与下一位合并
			for(var i=0; i<_step.length; i++){
				if(_step[i]==_step[_nexts[i]]){
					_step[i] = _step[i]*2;
					_step[_nexts[i]] = 0;
				}
			}
			//console.debug("sept after merge:"+_step);
			//合并后，挤掉空位
			for(var i=0; i<_step.length; i++){
				curSpot = (i%4)*4+Math.floor(i/4);
				if(i%4==0){
					freeSpare = 0;
				}
				if(_step[curSpot]==0){
					freeSpare+=4;
				}else{
					if(freeSpare>0){
						_step[curSpot-freeSpare] = _step[curSpot];
						_step[curSpot] = 0;
					}
				}
			}
			//console.debug("step after trim:"+_step);
		}
		
		if(dir=="down"){
			var curValue, nextIndex, freeSpare, tmpCol, curSpot;
		
			//这里是判断向上的
			//找出每个元素的指定方向上的下一位的坐标，存入_nexts;
			
			for(var i=_step.length-1; i>=0; i--){
				_nexts[i] = -1;	//因为下一位元素的坐标有可能是0, 当倒序的时候。所以要有-1来表示不存在下一位元素。
				curSpot = (i%4)*4+Math.floor(i/4);
				
				if(i%4==0||_step[curSpot]==0){
					//本位元素为第一行或是本位元素为0则直接跳过
				}else{
					for(var k = 4; k<16; k+=4){
						if((curSpot-k)<0||_step[curSpot-k]==0){
							//预览的下一位为0,则再找下下位
						}else{
							//console.debug(curSpot+"_"+_step[curSpot]+"next:"+(curSpot-k));
							_nexts[curSpot] = curSpot-k;
							break;
						}
						if((curSpot-k)<4){
							//这一测试位已是最边上了，没有下一位了。跳出循环
							break;
						}
					}
					
				}
			}
			//console.debug("_nexts:"+_nexts);
			var counter=0;
			//与下一位合并
			for(var i=_step.length-1; i>=0; i--){
				if(_step[i]==_step[_nexts[i]]){
					_step[i] = _step[i]*2;
					_step[_nexts[i]] = 0;
				}
			}
			//console.debug("sept after merge:"+_step);
			//合并后，挤掉空位
			for(var i=_step.length-1; i>=0; i--){
				curSpot = (i%4)*4+Math.floor(i/4);
				if(i%4==0){
					freeSpare = 0;
				}
				if(_step[curSpot]==0){
					freeSpare+=4;
				}else{
					if(freeSpare>0){
						_step[curSpot-freeSpare] = _step[curSpot];
						_step[curSpot] = 0;
					}
				}
			}
			//console.debug("step after trim:"+_step);
		}
		
		
		//console.debug("simulate_move_left:"+_step);
		return _step;
	}
	
	
	//插入一个基本块2/4到空位上去
	function createBaseCell(){
		var ranNum = createRandom(10);
		var val = 2;
		
		if(ranNum>8){
			val = 4;
		}
		
		//随机为方块的选择空位置
		var freeSpots = getSpareSpot();
		ranNum = createRandom(freeSpots.length);
		var post = freeSpots[ranNum];
		
		insertCell(val, post);
		return {value:val, post:post};
	}
	//返回空白格位置
	function getSpareSpot(){
		var freeSpots = [];
		for(var i=0; i<spots.length; i++){
			if(spots[i]==0){
				freeSpots.push(i);
			}
		}
		return freeSpots;
	}
	
	//制造随机数
	function createRandom(_limit){
		var ranNum = Math.floor(Math.random()*_limit);
		return ranNum;
	}
	
	//插入块到区域里去
	function insertCell(_val, _post){
		//生成cell
		var spanCell = document.createElement("SPAN");
		spanCell.className = "cell";
		spanCell.innerHTML = _val;
		if(_val==4){
			spanCell.className = "cell level_1";
		}
		var offset = transPostToPosition(_post);
		spanCell.style.left = offset.left+"px";
		spanCell.style.top = offset.top+"px";
		wrap.append(spanCell);
		
		
		spots[_post] = _val;
		var cell = {elem:spanCell, value:_val, post:_post, finalLeft:offset.left, finalTop:offset.top, state:"normal"};
		cells[_post] = cell;
	}
	//根据post计算位置的top, left;
	function transPostToPosition(_post){
		var leftSpace = _post%4;
		var topSpace = Math.floor(_post/4);
		var left = leftSpace*cellWidth;
		var top = topSpace*cellHeight;
		return {left:left, top:top};
	}
	
	//移动操作
	function move(dir){
		if(ifUnderMoving){
			return;
		}
		var spareCell, post, newPost, prevCell, spareCellAll = 0, spareLast;
		if(dir=="up"){
			for(var l = 0; l<4; l++){
				//分四个循环，分别处理四列
				spareCell = 0;
				prevCell = null;
				spareLast = 0;
				for(var i=0; i<4; i++){
					//一格一格判断
					post = i*4+l;
					if(spots[post]==0){
						spareCell++;	//如果这一格为空，则这一列的空格数加1; 
						spareCellAll++;//这是全局的spareCell而不是这一列的。
						spareLast++;
						continue;
					}else{
						if(!!prevCell&&prevCell.value==cells[post].value&&prevCell.state != "repeated"){
							//与上一个块相等，则spareCell++;
							spareCell++;
							spareCellAll++;//这是全局的spareCell而不是这一列的。
							cells[post].state = "repeated";
							prevCell.state = "double";
						}
						spareLast=0;
						prevCell = cells[post];
						newPost = (i-spareCell)*4+l;
						cells[post].post = newPost;
					}
				}
				spareCellAll -= spareLast;
			}
		}
		if(dir=="down"){
			for(var l = 0; l<4; l++){
				//分四个循环，分别处理四列
				spareCell = 0;
				prevCell = null;
				spareLast = 0;
				for(var i=3; i>=0; i--){
					//一格一格判断
					post = i*4+l;
					if(spots[post]==0){
						spareCell++;	//如果这一格为空，则这一列的空格数加1; 
						spareCellAll++;//这是全局的spareCell而不是这一列的。
						spareLast++;
						continue;
					}else{
						if(!!prevCell&&prevCell.value==cells[post].value&&prevCell.state != "repeated"){
							//与上一个块相等，则spareCell++;
							spareCell++;
							spareCellAll++;//这是全局的spareCell而不是这一列的。
							cells[post].state = "repeated";
							prevCell.state = "double";
						}
						spareLast=0;
						prevCell = cells[post];
						newPost = (i+spareCell)*4+l;
						cells[post].post = newPost;
					}
				}
				spareCellAll -= spareLast;
			}
		}
		if(dir=="left"){
			for(var l = 0; l<4; l++){
				//分四个循环，分别处理四列
				spareCell = 0;
				prevCell = null;
				spareLast = 0;
				for(var i=0; i<4; i++){
					//一格一格判断
					post = l*4+i;
					if(spots[post]==0){
						spareCell++;	//如果这一格为空，则这一列的空格数加1; 
						spareCellAll++;//这是全局的spareCell而不是这一列的。
						spareLast++;
						continue;
					}else{
						if(!!prevCell&&prevCell.value==cells[post].value&&prevCell.state != "repeated"){
							//与上一个块相等，则spareCell++;
							spareCell++;
							spareCellAll++;//这是全局的spareCell而不是这一列的。
							cells[post].state = "repeated";
							prevCell.state = "double";
						}
						spareLast=0;
						prevCell = cells[post];
						newPost = (i-spareCell)+l*4;
						cells[post].post = newPost;
					}
				}
				spareCellAll -= spareLast;
			}
		}
		if(dir=="right"){
			for(var l = 0; l<4; l++){
				//分四个循环，分别处理四列
				spareCell = 0;
				prevCell = null;
				spareLast = 0;
				for(var i=3; i>=0; i--){
					//一格一格判断
					post = l*4+i;
					if(spots[post]==0){
						spareCell++;	//如果这一格为空，则这一列的空格数加1; 
						spareCellAll++;//这是全局的spareCell而不是这一列的。
						spareLast++;
						continue;
					}else{
						if(!!prevCell&&prevCell.value==cells[post].value&&prevCell.state != "repeated"){
							//与上一个块相等，则spareCell++;
							spareCell++;
							spareCellAll++;	//这是全局的spareCell而不是这一列的。
							cells[post].state = "repeated";
							prevCell.state = "double";
						}
						spareLast=0;
						prevCell = cells[post];
						newPost = (i+spareCell)+l*4;
						cells[post].post = newPost;
					}
				}
				spareCellAll -= spareLast;
			}
		}
		
		if(spareCellAll==0){
			//console.debug("you can't move this way!");
			//没有可移动的空间，那么清除上面的操作痕迹
			for(var i=0; i<cells.length; i++){
				if(!!cells[i]){
					cells[i].state = "normal";
					cells[i].post = i;
				}
			}
			//判断是否有可消的方块，如果没有可消方块，且空格已为0则游戏结束
			var freeSpots = getSpareSpot();
			var ifCanVanish = false;
			if(freeSpots.length==0){
				//因为本操作就是无可消且无可移动的操作。所以这次的方向肯定是不用判断的。只判断另外三个方向是否可移动(可消)
				var canLeft = dir=="left"?false:predictVanish("left",cells).total;
				if(canLeft) return;
				var canRight = dir=="right"?false:predictVanish("right",cells).total;
				if(canRight) return;
				var canUp = dir=="up"?false:predictVanish("up",cells).total;
				if(canUp) return;
				var canDown = dir=="down"?false:predictVanish("down",cells).total;
				if(!canDown){
					saveScore()
					alert("game over!");
				}
			}
			return;
		}
		
		//计算每一个块的移动终点数据,为下一步移动做准备
		var newOffset;
		for(var i=0; i<cells.length; i++){
			if(!!cells[i]){
				newOffset = transPostToPosition(cells[i].post);
				cells[i].beginLeft = cells[i].finalLeft;
				cells[i].beginTop = cells[i].finalTop;
				cells[i].finalLeft = newOffset.left;
				cells[i].finalTop = newOffset.top;
			}
		}
		
		moveStep = 0;
		ifUnderMoving = true;
		slide();
		
	}
	
	//根据传入的数组，判断可直接合并的情况
	//只需判断按顺序判断每个格式与右边与下面的数字是否相同，如果相邻为空格则再跳过去一格直到找到该方向上的数字或是边界
	//查到可合并的情况，记下可合并块的值，和方向。保留最大合并值和方向。
	function predictVanish(step){
		var _step = step.concat();	//复制数组以防止修改原来数组
		var leftright = {nMax:0, time:0};
		var updown = {nMax:0, time:0};
		
		var curValue, nextIndex;
		
		//这里是判断横向的
		for(var i=0; i<_step.length; i++){
			//判断不是最后一列，才能与右侧的元素进行对比
			nextIndex = i+1;	//下一个要判断的序号
			if((i+1)%4!=0){
				for(var j=1; j<4; j++){
					//与右则地数进行对比，
					if(!!_step[i+j]){
						//此格不为空，则与现在的测试方块进行值对比,如果值匹配上了则i++,这样直接跳过与右侧元素的对比
						if(_step[i+j]==_step[i]){
							if(_step[i]>leftright.nMax){
								leftright.nMax = _step[i];
								leftright.time = 1;
							}else if(_step[i]==leftright.nMax){
								leftright.time++;
							}
							nextIndex++;
						}
						break;
						
					}else{
						//为空的情况
						nextIndex++;
					}
					
					//当前已经是最后一列了，就跳过下面的循环
					if((i+j+1)%4==0){
						break;
					}
				}
			}
			
			i = nextIndex-1;//因为for里面还要给i加1,所以这里要减1;
			
		}
		
		//与下面的元素进行对比。为能计算方遍，把整向的坐标走向改成竖向的走向，即原来的0,1,2,3,4,5...变成了0,4,8,12,1,5,....
		//坐标转换
		var newSpot;
		for(var i=0; i<_step.length; i++){
			newSpot = Math.floor(i/4)+(i%4)*4;
			_step[newSpot] = step[i];
		}
		
		//这里是判断竖向的
		for(var i=0; i<_step.length; i++){
			//判断不是最后一列，才能与右侧的元素进行对比
			nextIndex = i+1;	//下一个要判断的序号
			if((i+1)%4!=0){
				for(var j=1; j<4; j++){
					//与右则地数进行对比，
					if(!!_step[i+j]){
						//此格不为空，则与现在的测试方块进行值对比,如果值匹配上了则i++,这样直接跳过与右侧元素的对比
						if(_step[i+j]==_step[i]){
							if(_step[i]>updown.nMax){
								updown.nMax = _step[i];
								updown.time = 1;
							}else if(_step[i]==updown.nMax){
								updown.time++;
							}
							nextIndex++;
						}
						break;
						
					}else{
						//为空的情况
						nextIndex++;
					}
					
					//当前已经是最后一列了，就跳过下面的循环
					if((i+j+1)%4==0){
						break;
					}
				}
			}
			
			i = nextIndex-1;//因为for里面还要给i加1,所以这里要减1;
			
		}
		return {leftright:leftright,updown:updown, total:leftright+updown}
		
		
	}
	
	
	//重建场景
	function setScene(_step){
		score = 0;
		wrap.find(".cell").remove();	//移除旧的方块
		//根据记录加入方块
		var frag = document.createDocumentFragment(), txtClass, spanCell, offset;
		for(var i=0; i<_step.length; i++){
			if(!!_step[i]){
				spanCell = document.createElement("span");
				if(_step[i]>2){
					spanCell.className = "cell "+colorSet[_step[i]];
				}else{
					spanCell.className = "cell";
				}
				offset = transPostToPosition(i);
				spanCell.style.left = offset.left+"px";
				spanCell.style.top = offset.top+"px";
				spanCell.innerHTML = _step[i];
				frag.appendChild(spanCell);
				offset = transPostToPosition(i);
				cells[i] = {elem:spanCell, value:_step[i], post:i, finalLeft:offset.left, finalTop:offset.top, state:"normal"};
				spots[i] = _step[i];
				score+=_step[i];
			}else{
				cells[i] = null;
				spots[i] = 0;
			}
		}
		wrap.append(frag);
		txtScore.html(score);
		//console.debug("--fallback");
	}
	
	//重玩
	function rePlay(){
		//重置分数
		score = 0;
		txtScore.html(score);
		
		//清除方块
		wrap.find(".cell").remove();
		//重置其它状态相关变量
		cells = [];
		spots = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
		
	}
	
	//分步完成移动
	function slide(){
		var postsCell = new Array(16);
		moveStep++;
		var curCell, level, newValue, newPosts, post;
		
		if(moveStep >= SLOWINOUT.length-1){
			//完成最后一步移动，同时合并掉同位置的方块
			for(var i=0; i<cells.length; i++){
				spots[i] = 0//在这个循环里顺便把spots重置了，因为下面要给spots重新赋值
				curCell = cells[i];
				if(!!curCell){
					curCell.elem.style.left = curCell.finalLeft + "px";
					curCell.elem.style.top = curCell.finalTop + "px";
					if(curCell.state=="repeated"){
						$(curCell.elem).remove();
						curCell = null;
						cells[i] = null;
					}
					
					
				}
				
			}
			
			//更新位置标识，并计算得分
			var newCells = new Array(16);
			var _score = 0;
			for(var i=0; i<spots.length; i++){
				if(!!cells[i]){
					post = cells[i].post;
					cells[i].state = "normal";
					newCells[post] = cells[i];
					spots[post] = cells[i].value;
					_score+=cells[i].value;
				}
				
			}
			cells = newCells;
			score = _score;
			txtScore.html(score);	//刷新分数
			
			if(ifWin){
				alert("you win!");
				saveScore();
				return;
			}
			
			createBaseCell();
			var step = spots.concat();	//复制数组
			steps.push(step);	//保存此次操作后的状态
			ifUnderMoving = false;
			
		}else{
			var curLeft, curTop;
			for(var i=0; i<cells.length; i++){
				curCell = cells[i];
				if(!!curCell){
					curLeft = (curCell.finalLeft-curCell.beginLeft)*SLOWINOUT[moveStep]+curCell.beginLeft;
					curTop = (curCell.finalTop-curCell.beginTop)*SLOWINOUT[moveStep]+curCell.beginTop;
					curCell.elem.style.left = curLeft + "px";
					curCell.elem.style.top = curTop + "px";
					if(moveStep==SLOWINOUT.length-3){
						if(curCell.state=="double"){
							newValue = curCell.value*2;
							curCell.value = newValue;	//更新方块值
							curCell.elem.className = "cell "+colorSet[newValue];	//更新方块颜色
							curCell.elem.innerHTML = newValue;
							if(newValue==2048){
								ifWin = true;
							}
						}
					}
				}
			}
			
			
			
			
			setTimeout(slide,25);
		}
	}
	
	//计分
	function scoring(){
		
	}
	
	function saveScore(){
		if(score>bestScore){
			bestScore = score;
			txtBest.html(bestScore);
			localStorage.setItem("bestScore",bestScore);
		}
	}
	
	
	_init();
}


function bink(elem){
	$(elem).addClass("hover");
	setTimeout((function(){return function(){
		$(elem).removeClass("hover");
	}})(),200);
}



var game = new Game2048();



