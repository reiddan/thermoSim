LevelTools = {
	setStds: function(){
		this.addEqs();
		this.setDefaultPromptVals()
		this.graphs = {};
		this.makePromptCleanUpHolders(0);
		this.eUnits = 'kJ';
		this.bgCol = Col(5, 17, 26);
		this.wallCol = Col(255,255,255);
		this.numUpdates = 0;
		this.wallSpeed = defaultTo(1, this.wallSpeed);
		this.makeListenerHolders();
		dataHandler = new DataHandler();
		this.dataHandler = dataHandler;
		this.attracting = false;
		this.gravitying = false;
		this.setUpdateRunListener()
		addListener(this, 'data', 'run', this.dataRun, this);
		
		this.spcs = spcs;
	},
	addEqs: function(){
		for (var sectionIdxLocal=0; sectionIdxLocal<this.sections.length; sectionIdxLocal++) {
			var section = this.sections[sectionIdxLocal];
			for (var promptIdxLocal=0; promptIdxLocal<section.prompts.length; promptIdxLocal++) {
				var prompt = section.prompts[promptIdxLocal];
				var title = prompt.title;
				var text = prompt.text;
				var quiz = prompt.quiz;
				if(title){prompt.title = addEqs(title);}
				if(text){prompt.text = addEqs(text);}
				if (quiz) {
					for (var questionIdx=0; questionIdx<quiz.length; questionIdx++) {
						var question = quiz[questionIdx];
						if (question.options){
							for (optionIdx=0; optionIdx<question.options.length; optionIdx++) {
								var option = question.options[optionIdx];
								for (optionElement in option) {
									var element = option[optionElement];
									if (typeof(element)=='string') {
										option[optionElement] = addEqs(element);
									}						
								}
							}
						}
					}
				}
			}
		}
	},

	move: function(){
		var spcLocal = this.spcs;
		for (var spcName in spcLocal){
			var dots = spcLocal[spcName].dots;
			for (var dotIdx = 0; dotIdx<dots.length; dotIdx++){
				dots[dotIdx].x += dots[dotIdx].v.dx;
				dots[dotIdx].y += dots[dotIdx].v.dy;
			}
		}
	},
	cutSceneStart: function(text, mode, quiz) {
		addListener(window['curLevel'], 'prompt' + promptIdx + 'CleanUp', 'endCutScene',
			function() {
				this.cutSceneEnd()
			},
		this);
		
		this.inCutScene = true;
		$('#intText').html('');
		text = defaultTo('',text);
		
		this.pause();
		$('#dashRun').hide();
		if (mode===true && !quiz) {
			$('#dashCutScene').show();
			this.cutSceneText(text);
			$('#prompt').html('');
		} else if (mode=='intro') {
			$('#dashIntro').show();
			$('#base').hide();
			this.cutSceneText(text);
		} else if (mode=='outro') {
			$('#dashOutro').show();
			$('#base').hide();
			this.cutSceneText(text);
		} else if (quiz) {
			$('#dashCutScene').show();
			$('#base').hide();
			this.cutSceneText(text);
			this.appendQuiz(quiz, 'intText');
		}
		$('#canvasDiv').hide();
		$('#display').show();

		this.cutSceneDivShow();
		
	},
	appendQuiz: function(quiz, appendTo) {
		var makeSubmitButton = false;
		this.quiz = new Array(quiz.length);
		this.quiz.allAnswered = function() {
			for (var qIdx=0; qIdx<this.length; qIdx++) {
				if (!this[qIdx].isAnswered) {
					return 0;
				}
			}
			return 1;
		}
		for (var questionIdx=0; questionIdx<quiz.length; questionIdx++) {
			var question = quiz[questionIdx];
			if (question.type == 'text' || question.type == 'textSmall') {
				makeSubmitButton = true;
			}
			this.appendQuestion(question, appendTo, questionIdx);
		}
		//Okay, this quiz structure needs work
		if (makeSubmitButton) {
			this.makeSubmitButton(appendTo);
		}
	},
	makeSubmitButton: function(appendTo) {
		var self = this;
		var onclickSubmit = function() {
			for (var questionIdx=0; questionIdx<self.quiz.length; questionIdx++) {
				var question = self.quiz[questionIdx];
				if (question.type=='text' || question.type=='textSmall') {
					var id = self.getTextAreaId(questionIdx);
					var submitted = $('#'+id).val();
					if (submitted.killWhiteSpace()!='') {
						store('userAnswerS'+sectionIdx+'P'+promptIdx+'Q'+questionIdx, submitted);
						question.answerText(submitted);
						question.isAnswered = true;
						if (question.answer) {
							if (fracDiff(parseFloat(question.answer), parseFloat(submitted))<.05){
								question.correct = true;
							} else {
								question.correct = false;
							}
						} else {
							question.correct = true;
						}
					} else {
						question.correct = false;
						question.isAnswered = false
					}
				}
			
			}
			//Hey - am not finished making it so you can cleany mix type of questions yet
			nextPrompt();
		}
		var idButton = 'textAreaSubmit';
		var submitHTML = templater.div({style: {width: '65%', display: 'inline-block'}}) + templater.button({attrs:{id: [idButton]}, style: {display: 'inline-block'}, innerHTML:'Submit'});
		$('#'+appendTo).append(submitHTML);
		buttonBind(idButton, onclickSubmit);
		addJQueryElems($('#' + idButton), 'button');
	},
	appendQuestion: function(question, appendTo, questionIdx){
		question.answered = false;
		question.correct = false;
		if (question.type == 'buttons') {
			this.appendButtons(question, appendTo, questionIdx);
		} else if (question.type == 'multChoice') {
			this.appendMultChoice(question, appendTo, questionIdx);
		} else if (question.type == 'text') {
			this.appendTextBox(question, appendTo, 3, 60, question.units, questionIdx);
		} else if (question.type == 'textSmall') {
			this.appendTextBox(question, appendTo, 1, 6, question.units, questionIdx);
		}
		this.quiz[questionIdx] = question;
	},
	cutSceneDivShow: function() {
		$('#intText').show();
	},
	cutSceneText: function(text){
		$('#intText').html(text);
	},
	cutSceneEnd: function(){
		this.inCutScene = false;
		this.resume();
		$('#intText').html('');
		$('#dashRun').show();
		$('#dashOutro').hide();
		$('#dashIntro').hide();
		$('#dashCutScene').hide();
		$('#nextPrevDiv').show();
		$('#base').show();
		$('#canvasDiv').show();
		$('#display').hide();
		$('#intText').hide();	
	},
	pause: function(){
		saveListener(this, 'update');
		saveListener(this, 'data');
		saveListener(this, 'wallMove');
		saveListener(this, 'mousedown');
		saveListener(this, 'mouseup');
		saveListener(this, 'mousemove');
		emptyListener(this, "update");
		emptyListener(this, "data");
		emptyListener(this, 'wallMove');
		emptyListener(this, 'mousedown');
		emptyListener(this, 'mouseup');
		emptyListener(this, 'mousemove');
	},//COULD ALSO DO LIKE 'SAVE/LOAD BY TYPE' FOR ANIM TEXT, ARROW
	resume: function(){
		loadListener(this, 'update');
		loadListener(this, 'data');
		loadListener(this, 'wallMove');
		loadListener(this, 'mousedown');
		loadListener(this, 'mouseup');
		loadListener(this, 'mousemove');
		emptySave(this, 'update');
		emptySave(this, 'data');
		emptySave(this, 'wallMove');
		emptySave(this, 'mousedown');
		emptySave(this, 'mouseup');
		emptySave(this, 'mousemove');
	},
	questionIsCorrect: function() {
		return this.correct;
	},
	/*
	type: 'buttons'
	options:list of buttons with: 	buttonId, text, isCorrect
			can have: 				func, message
	*/
	appendButtons: function(question, appendTo, questionIdx){
		var buttonHTML = '';
		//Hey - you are setting attrs of the question object.  This will alter the thing the sections declaration.  I think that is okay, just letting you know
		question.isAnswered = false;
		question.isCorrect = this.questionIsCorrect;//function() {
			//return question.correct;
		//}
		var buttons = question.options;
		buttonHTML += "<br><center><table border='0'><tr>";
		var ids = new Array(buttons.length);
		for (var buttonIdx=0; buttonIdx<buttons.length; buttonIdx++){
			var button = buttons[buttonIdx];
			ids[buttonIdx] = defaultTo('question' + questionIdx + 'option' + buttonIdx, button.buttonId);
			buttonHTML += "<td>" + templater.button({attrs:{id: [ids[buttonIdx]]}, innerHTML:button.text}) + "</td>";
		}
		buttonHTML += "</tr></table></center>";
		$('#'+appendTo).append(buttonHTML);
		this.bindButtonListeners(question, buttons, ids);
	},
	bindButtonListeners: function(question, buttons, ids){
		for (var buttonIdx=0; buttonIdx<buttons.length; buttonIdx++){
			var button = buttons[buttonIdx];
			this.bindButtonListener(question, button, ids[buttonIdx]);

		}		
	},
	bindButtonListener: function(question, button, id){
		var onclickFunc = function() {
			if (button.message) {
				alert(button.message);
			}
			if (button.response) {
				store('B'+sectionIdx+'P'+promptIdx + 'Response', button.response);
			}
			if (button.func) {
				button.func();
			}
			question.isAnswered = true;
			question.correct = button.isCorrect;
			nextPrompt();		
		}

		buttonBind(id, onclickFunc);		
	},
	/*
	type: 'multChoice'
	list of options with:	 text, isCorrect
	each option can have:	 message
	*/
	appendMultChoice: function(question, appendTo, questionIdx){
		question.answerIs = false;
		question.isCorrect = this.questionIsCorrect;//function() {
			//return question.correct;
		//}		
		var options = question.options
		var multChoiceHTML = "";
		multChoiceHTML += "<br><table width=100%<tr><td width=10%></td><td>";
		var ids = new Array(options.length);
		for (var optionIdx=0; optionIdx<options.length; optionIdx++){
			var option = options[optionIdx];
			var divId = optionIdx;
			ids[optionIdx] = 'question' + questionIdx + 'option' + optionIdx;
			multChoiceHTML += templater.div({attrs: {id: [ids[optionIdx]], class: ['multChoiceBlock']}, innerHTML: option.text})
		}
		$('#'+appendTo).append(multChoiceHTML);
		this.bindMultChoiceFuncs(question, options, ids);
	},
	bindMultChoiceFuncs: function(question, options, ids){
		for (var optionIdx=0; optionIdx<options.length; optionIdx++) {
			this.bindMultChoiceFunc(question, options[optionIdx], ids[optionIdx]);
		}
	},
	bindMultChoiceFunc: function(question, option, id){
		var onclickFunc = function() {
			if (option.message) {
				alert(option.message);
			}
			if (option.response) {
				store('B'+sectionIdx+'P'+promptIdx + 'Response', option.response);
			}
			if (option.func) {
				option.func();
			}
			question.correct = option.isCorrect;
			question.isAnswered = true;
			//do something to accomidate multiple questions at some point.  Not likely to have multiple now
			nextPrompt();
		}
		$('#'+id).click(onclickFunc);
		$('#'+id).hover(
			function(){$(this).css('background-color', hoverCol.hex)}, 
			function(){$(this).css('background-color', 'transparent')}
		);
	},
	/*
	type: 'text'
	can have:			text, messageRight, messageWrong, answer, units
	*/
	appendTextBox: function(question, appendTo, rows, cols, units, questionIdx){
		var textBoxHTML = '';
		question.answerIs = false;
		question.answerText = function(text) {
			question.answerTextSubmitted = text;
		}
		question.isCorrect = this.questionIsCorrect;
		question.label = defaultTo('', question.label);
		var idText = this.getTextAreaId(questionIdx);
		var boxText = defaultTo('Type your answer here.', question.text);
		textBoxHTML += '<br>';
		textBoxHTML += question.label;
		if (cols>20) {
			textBoxHTML += '<br>';
		}
		textBoxHTML += templater.textarea({attrs: {id: [idText], rows: [rows], cols: [cols], placeholder: [boxText]}})
		if (question.units) {
			textBoxHTML += question.units;
		}
		$('#' + appendTo).append(textBoxHTML);
	},
	getTextAreaId: function(idx) {
		return 'textArea' + idx;
	},
	hideDash: function(){
		$('#dashIntro').hide();
		$('#dashRun').hide();
		$('#dashOutro').hide();
		$('#dashCutScene').hide();
	},
	borderStd: function(info){
		info = defaultTo({}, info);
		var wall = defaultTo(0, info.wallInfo);
		
		walls[wall].border([1,2,3,4], 5, this.wallCol.copy().adjust(-100,-100,-100), [{y:info.min}, {}, {}, {y:info.min}]);
	},

	update: function(){
		this.numUpdates++;
		turn++;
		for (var updateListener in this.updateListeners.listeners){
			var listener = this.updateListeners.listeners[updateListener];
			listener.func.apply(listener.obj);
		}
		for (var wallMoveListener in this.wallMoveListeners.listeners){
			var listener = this.wallMoveListeners.listeners[wallMoveListener];
			listener.func.apply(listener.obj);
		}
	},
	updateData: function(){

		for (var dataListener in this.dataListeners.listeners){
			var listener = this.dataListeners.listeners[dataListener];
			listener.func.apply(listener.obj);
		}

		this.numUpdates = 0;
	},
	delayGraphs: function() {
		addListener(window['curLevel'], 'data', 'run', function() {
			this.dataRunNoGraphs();
			addListener(window['curLevel'], 'data', 'run', this.dataRun, this);
		},
		this);
	},
	dataRunNoGraphs: function() {
		for (var datum in this.recordListeners.listeners){
			var recordInfo = this.recordListeners.listeners[datum];
			recordInfo.func.apply(recordInfo.obj);
			//this.data[datum].pushNumber(recordInfo.func.apply(recordInfo.obj));
		}			
	},
	dataRun: function(){
		for (var datum in this.recordListeners.listeners){
			var recordInfo = this.recordListeners.listeners[datum];
			recordInfo.func.apply(recordInfo.obj);
			//this.data[datum].pushNumber(recordInfo.func.apply(recordInfo.obj));
		}	
		for (var graphName in this.graphs) {
			if (this.graphs[graphName].active) {
				this.graphs[graphName].addLast();
			}
		}
	},
	setUpdateRunListener: function() {
		if (this.attracting && this.gravitying) {
			addListener(this, 'update', 'run', this.updateRunAttractAndGravity, this);
		} else if (this.attracting) {
			addListener(this, 'update', 'run', this.updateRunAttract, this);
		} else if (this.gravitying) {
			addListener(this, 'update', 'run', this.updateRunGravity, this);
		} else { 
			addListener(this, 'update', 'run', this.updateRunBasic, this);
		}
	},
	gravity: function(attrs) {
	
		this.gravitying = true;
		cleanUpWith = defaultTo('section', attrs.cleanUpWith);
		//YO YO - MAKE IT CLEAN UP
		//Problem with hitting wall, slowly loses energy.  Would need to do something similar to wall hitting its bounds
		for (var wallIdx=0; wallIdx<walls.length; wallIdx++) {
			walls[wallIdx].setHitMode('Gravity');
		}
		this.setUpdateRunListener();

		addListener(window['curLevel'], cleanUpWith + 'CleanUp', 'gravityStop', this.gravityStop, this);
	},
	gravityStop: function() {
		this.gravitying = false;
		this.setUpdateRunListener();


	},
	doGravity: function() {
		for (var spcName in spcs) {
			var dots = spcs[spcName].dots;
			for (var dotIdx=0; dotIdx<dots.length; dotIdx++) {
				dots[dotIdx].v.dy+=gInternal;
				dots[dotIdx].y+=.5*gInternal;
			}
		}
	},
	attract: function(attrs) {
		this.attracting = true;
		cleanUpWith = defaultTo('section', attrs.cleanUpWith);
		attractor.assignELastAll();
		this.setUpdateRunListener();
		addListener(window['curLevel'], cleanUpWith + 'CleanUp', 'attractStop', this.attractStop, this);
	},
	attractStop: function() {
		this.attracting = false;
		attractor.zeroAllEnergies();
		this.setUpdateRunListener();
	},
	updateRunBasic: function() {
		this.move();
		collide.check();
		walls.check();
		this.drawRun();
	},
	updateRunGravity: function() {
		this.move();
		collide.check();
		this.doGravity();
		walls.check();
		this.drawRun();	
	},
	updateRunAttract: function() {
		this.move();
		collide.check();
		attractor.attract();
		walls.check();
		this.drawRun();
	},
	updateRunAttractAndGravity: function() {
		this.move();
		collide.check();
		attractor.attract();
		this.doGravity();
		walls.check();
		this.drawRun();		
	},
	drawRun: function(){
		draw.clear(this.bgCol);
		draw.dots();
		draw.walls(walls);
	},
	resetGraphs: function(){
		for (var graphName in this.graphs){
			this.graphs[graphName].reset();
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
	saveAllGraphs: function(){
		//OOH - made load graphs by section/prompt idx
		for (var graphName in this.graphs) {
			var saveName = graphName + 'section' + sectionIdx + 'prompt' + promptIdx;
			this.graphs[graphName].save(saveName);
		}
	},
	freezeAllGraphs: function(){
		for(var graphName in this.graphs){
			this.graphs[graphName].freeze();
		}
	},

/*
CONVERT THIS STUFF TO RECORD/DISPLAY
	track: function(handle, label, data, decPlaces, units){
		decPlaces = defaultTo(1, decPlaces);
		if(typeof(data)=='Array'){
			this.readout.addEntry(handle, label, units, data[data.length-1], undefined, decPlaces);
			addListener(window['curLevel'], 'data', 'track'+handle,
				function(){
					this.readout.tick(handle, data[data.length-1]);
				},
			this);
		}else if (typeof(data)=='function'){
			this.readout.addEntry(handle, label, units, data(), undefined, decPlaces);
			addListener(window['curLevel'], 'data', 'track'+handle,
				function(){
					this.readout.tick(handle, data());
				},
			this);		
		}
	},
	trackStop: function(handle){
		removeListener(window['curLevel'], 'data', 'track' + handle);
	},
	trackExtentRxnStart: function(handle, rxnInfo){
		var spcsLocal = spcs;
		var NLOCAL = N;
		var initVals = new Array(rxnInfo.length);
		this.data['extent' + handle] = [];
		for (var compIdx=0; compIdx<rxnInfo.length; compIdx++){
			var compInfo = rxnInfo[compIdx];
			var initCount = spcsLocal[compInfo.spc].length;
			compInfo.init = initCount;

		}
		addListener(window['curLevel'], 'data', 'trackExtentRxn' + handle,
			function(){
				var extent = Number.MAX_VALUE;
				for (var compIdx=0; compIdx<rxnInfo.length; compIdx++){
					var compInfo = rxnInfo[compIdx];
					var init = compInfo.init;
					var cur = spcsLocal[compInfo.spc].length;
					var coeff = compInfo.coeff;
					//HEY - coeff MUST BE NEGATIVE IF THING IS BEING CONSUMED
					extent = Math.min(extent, (cur-init)/(coeff*NLOCAL));
				}
				this.data['extent' + handle].push(extent);
			},
		this);
	},
	trackExtentRxnStop: function(handle){
		removeListener(window['curLevel'], 'data', 'trackExtentRxn' + handle);
	},
	*/
	makeListenerHolders: function(){
		this.makeListenerHolder('update');
		this.makeListenerHolder('wallMove');
		this.makeListenerHolder('data');
		this.makeListenerHolder('mousedown');
		this.makeListenerHolder('mouseup');
		this.makeListenerHolder('mousemove');
		this.makeListenerHolder('init');
		this.makeListenerHolder('record');
		this.makeListenerHolder('sectionCondition');
		this.makeListenerHolder('promptCondition');
		this.makeListenerHolder('sectionCleanUp');
	},
	makeListenerHolder: function(name) {
		this[name + 'Listeners'] = {listeners:{}, save:{}};
		return this[name + 'Listeners'];
	},
	makePromptCleanUpHolders: function(newSectionIdx){
		var section = this.sections[newSectionIdx];
		this.promptCleanUpHolders = new Array(section.prompts.length);
		for (var promptIdx=0; promptIdx<section.prompts.length; promptIdx++) {
			this.promptCleanUpHolders[promptIdx] = this.makeListenerHolder('prompt' + promptIdx + 'CleanUp');
		}
	},
	reset: function(){
		showPrompt(sectionIdx, promptIdx, true);		
	},
	setDefaultPromptVals: function(){
		for (var sectionIdxLocal=0; sectionIdxLocal<this.sections.length; sectionIdxLocal++) {
			var section = this.sections[sectionIdxLocal];
			for (var promptIdxLocal=0; promptIdxLocal<section.prompts.length; promptIdxLocal++) {
				var prompt = section.prompts[promptIdxLocal];
				prompt.finished = false;
				prompt.title = defaultTo('', prompt.title);
				prompt.text = defaultTo('', prompt.text);	
			}
		}
	},

	sectionConditions: function(){
		//ALERT NOT BUBBLING UP CORRECTLY.  IT GETS TO THIS FUNCTION FROM STATE LISTENERS BUT IS NOT RETURNED
		var didWin = 1;
		var alerts = {1:undefined, 0:undefined};
		var priorities = {1:0, 0:0};
		var conditions = this.sectionConditionListeners.listeners
		for (var conditionName in conditions) {
			var condition = conditions[conditionName]
			winResults = condition.func.apply(condition.obj); //returns didWin, alert, priority (high takes precidence);
			didWin = Math.min(didWin, winResults.didWin);
			if (winResults.alert) {
				var priority = defaultTo(0, winResults.priority);
				if (priority>=priorities[Number(winResults.didWin)]) {
					alerts[Number(winResults.didWin)] = winResults.alert;
				}
			}	
		}	
		return {didWin:didWin, alert:alerts[didWin]};
	},
	promptConditions: function(idx){
		var didWin = 1;
		var alerts = {1:undefined, 0:undefined};
		var priorities = {1:0, 0:0};
		var conditions = this.promptConditionListeners.listeners;
		for (var conditionName in conditions) {
			var condition = conditions[conditionName]
			winResults = condition.func.apply(condition.obj); //returns didWin, alert, priority (high takes precidence);
			didWin = Math.min(didWin, winResults.didWin);
			if (winResults.alert) {
				var priority = defaultTo(0, winResults.priority);
				if (priority>=priorities[Number(winResults.didWin)]) {
					alerts[Number(winResults.didWin)] = winResults.alert;
				}
			}	
		}	
		return {didWin:didWin, alert:alerts[didWin]};
	},
	sectionCleanUp: function(){
		var listeners = this.sectionCleanUpListeners.listeners;
		for (var listenerName in listeners) {
			var listener = listeners[listenerName];
			listener.func.apply(listener.obj);
		}
	},
	promptCleanUp: function(idx){
		var listeners = this['prompt' + idx + 'CleanUpListeners'].listeners;
		for (var listenerName in listeners) {
			var listener = listeners[listenerName];
			listener.func.apply(listener.obj);
		}
	},
}