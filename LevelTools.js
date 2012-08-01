
LevelTools = {

	changeWallSetPt: function(wallInfo, dest, compType, speed){
		var wallIdx = walls.idxByInfo(wallInfo);
		var wall = walls[wallIdx]
		var wallMoveMethod;
		if(compType=='isothermal'){
			var wallMoveMethod = 'cVIsothermal';
		} else if (compType=='adiabatic'){
			var wallMoveMethod = 'cVAdiabatic';
		}
		removeListener(curLevel, 'update', 'moveWall');
		var setY = function(curY){
			wall[0].y = curY;
			wall[1].y = curY;
			wall[wall.length-1].y = curY;
		}
		var y = wall[0].y
		var dist = dest-y;
		if(dist!=0){
			var sign = getSign(dist);
			var speed = defaultTo(this.wallSpeed, speed);
			wall.v = speed*sign;
			walls.setSubWallHandler(wallIdx, 0, wallMoveMethod);
			addListener(curLevel, 'update', 'moveWall'+wallInfo,
				function(){
					var y = wall[0].y
					setY(boundedStep(y, dest, wall.v))
					walls.setupWall(wallIdx);
					if(round(y,2)==round(dest,2)){
						removeListener(curLevel, 'update', 'moveWall' + wallInfo);
						walls.setSubWallHandler(wallIdx, 0, 'staticAdiabatic');
						wall.v = 0;
					}
				},
			this);
		}
	},
	checkDotHits: function(){
		collide.check();
	},
	checkWallHits: function(){
		walls.check();
	},
	cutSceneStart: function(text, mode){
		this.pause();
		$('#dashRun').hide();
		if(!mode){
			$('#dashCutScene').show();
		}else if(mode=='intro'){
			$('#dashIntro').show();
			$('#base').hide();
		}else if(mode=='outro'){
			$('#dashOutro').show();
			$('#base').hide();
		}
		$('#canvasDiv').hide();
		$('#display').show();
		if(text){
			$('#intText').html(text);
		}
		$('#intText').show();
		
	},
	cutSceneText: function(text){
		$('#intText').html(text);
	},
	cutSceneEnd: function(){
		this.resume();
		$('#intText').html('');
		$('#dashRun').show();
		$('#dashOutro').hide();
		$('#dashIntro').hide();
		$('#dashCutScene').hide();
		$('#base').show();
		$('#canvasDiv').show();
		$('#display').hide();
		$('#intText').hide();	
	},
	pause: function(){
		saveListener(this, 'update');
		saveListener(this, 'data');
		emptyListener(this, "update");
		emptyListener(this, "data");
	},//COULD ALSO DO LIKE 'SAVE/LOAD BY TYPE' FOR ANIM TEXT, ARROW
	resume: function(){
		loadListener(this, 'update');
		loadListener(this, 'data');
	},
	hideDash: function(){
		$('#dashIntro').hide();
		$('#dashRun').hide();
		$('#dashOutro').hide();
		$('#dashCutScene').hide();
	},
	borderStd: function(info){
		info = defaultTo({}, info);
		var wall = defaultTo('container', info.wallInfo);
		
		walls[wall].border([1,2,3,4], 5, this.wallCol.copy().adjust(-100,-100,-100), [{y:info.min}, {}, {}, {y:info.min}]);
	},

	update: function(){
		this.numUpdates++;
		turn++;
		for (var updateListener in this.updateListeners.listeners){
			var listener = this.updateListeners.listeners[updateListener]
			listener.func.apply(listener.obj);
		}
	},
	addData: function(){
		for (var dataListener in this.dataListeners.listeners){
			var listener = this.dataListeners.listeners[dataListener];
			listener.func.apply(listener.obj);
		}
		this.numUpdates = 0;
	},
	updateRun: function(){
		move();
		this.checkDotHits(); 
		this.checkWallHits();
		this.drawRun();
	},
	drawRun: function(){
		draw.clear(this.bgCol);
		draw.dots();
		draw.walls(walls, this.wallCol);
	},
	clearGraphs: function(){
		for (var graphName in this.graphs){
			this.graphs[graphName].clear();
		}
	},
	removeGraph: function(graphName){
		this.graphs[graphName].remove();
		this.graphs[graphName] = undefined;
	},
	removeAllGraphs: function(){
		for (var graphName in this.graphs){
			this.removeGraph(graphName);
			delete this.graphs[graphName];
		}	
	},
	trackVolumeStart: function(decPlaces){
		if(decPlaces===undefined){
			decPlaces = 1;
		}
		this.readout.addEntry('vol', 'Volume:', 'L', dataHandler.volume(), undefined, decPlaces);
		addListener(curLevel, 'update', 'trackVolume',
			function(){
				this.readout.hardUpdate(dataHandler.volume(), 'vol');
			},
		this);
	},
	trackVolumeStop: function(){
		this.readout.removeEntry('vol');
		removeListener(curLevel, 'update', 'trackVolume');
	},
	trackIntPressureStart: function(handle){
		this.data['pInt'+handle] = [];
		var dataList = this.data['pInt'+handle]
		var wall = walls[handle];
		wall.forceInternal = 0;
		wall.pLastRecord = turn;
		addListener(curLevel, 'data', 'trackIntPressure'+handle,
			function(){
				dataList.push(wall.pInt());
			},
		'');
		
	},
	trackIntPressureStop: function(handle){
		removeListener(curLevel, 'data', 'trackIntPressure'+handle);
	},
	trackTempStart: function(decPlaces, handle, label, dataSet){
		if(decPlaces===undefined){
			decPlaces = 0;
		}
		dataSet = defaultTo('t', dataSet);
		label = defaultTo('Temp:', label);
		handle = defaultTo('temp', handle);
		this.readout.addEntry(handle, label, 'K', this.data[dataSet][this.data[dataSet].length-1], undefined, decPlaces);
		addListener(curLevel, 'data', 'trackTemp' + handle,
			function(){
				this.readout.tick(this.data[dataSet][this.data[dataSet].length-1], 'temp');
			},
		this);	
	},
	trackTempStop: function(handle){
		handle = defaultTo('temp', handle)
		this.readout.removeEntry(handle);
		removeListener(curLevel, 'data', 'trackTemp' + handle);
	},
	makeListeners: function(){
		this.updateListeners = {listeners:{}, save:{}};
		this.dataListeners = {listeners:{}, save:{}};
		this.mousedownListeners = {listeners:{}, save:{}};
		this.mouseupListeners = {listeners:{}, save:{}};
		this.mousemoveListeners = {listeners:{}, save:{}};
		this.resetListeners = {listeners:{}, save:{}};
		this.initListeners = {listeners:{}, save:{}};		
	},
}