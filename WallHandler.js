function WallHandler(pts){
	this.pts = pts;
	this.gridDim=20;
	this.wallUVs = [];
	this.wallGrids = [];
	this.xSpan = Math.floor(myCanvas.width/this.gridDim);
	this.ySpan = Math.floor(myCanvas.height/this.gridDim);
};
WallHandler.prototype = {
	setup: function(){
		this.closeWalls();
		for (var wallIdx=0; wallIdx<walls.pts.length; wallIdx++){
			this.setupWall(wallIdx);
		}
		
	},
	setupWall: function(wallIdx){
		this.wallUVs[wallIdx] = this.getWallUV(wallIdx);
		this.wallGrids[wallIdx] = this.getSubwallGrid(wallIdx);
	},
	closeWalls: function(){
		for (var wallIdx=0; wallIdx<this.pts.length; wallIdx++){
			var wall = this.pts[wallIdx];
			this.closeWall(wall);
			
		}
	},
	closeWall: function(wall){
		wall.push(P(wall[0].x, wall[0].y))
	},
	getWallUV: function(wallIdx){
		var wall = walls.pts[wallIdx];
		var wallUVs = [];
		for (var ptIdx=0; ptIdx<wall.length-1; ptIdx++){
			var ptA = wall[ptIdx];
			var ptB = wall[ptIdx+1];
			wallUVs.push(V(ptB.x-ptA.x, ptB.y-ptA.y).UV())
		}
		return wallUVs;
	},
	getSubwallGrid: function(wallIdx){
		var subwallGrid = [];
		for (var x=0; x<Math.ceil(myCanvas.width/this.gridDim); x++){ //HEY - you changed this from .floor +1
			var column = []
			for (var y=0; y<Math.ceil(myCanvas.height/this.gridDim); y++){
				column.push(this.getSubwallsInGrid(wallIdx, x, y));
			}
			subwallGrid.push(column);
		}
		return subwallGrid;
		
		
	},
	getSubwallsInGrid: function(wallIdx, x, y){
		var subwallsInGrid = [];
		var wall = walls.pts[wallIdx];
		for (var ptIdx=0; ptIdx<wall.length-1; ptIdx++){
			if (this.isInBox(x, y, [wallIdx, ptIdx])){
				subwallsInGrid.push(ptIdx);
			}
		}
		return subwallsInGrid;
	},
	isInBox: function(x, y, pt){
		if (this.crossesLine(x, y, x+1, y, pt, "min") || this.crossesLine(x+1, y, x+1, y+1, pt, "max") || this.crossesLine(x+1, y+1, x, y+1, pt, "max") || this.crossesLine(x, y+1, x, y, pt, "min")){
			return true;
		};
		return false;
	},
	crossesLine: function(x1, y1, x2, y2, pt, type){
		x1*=this.gridDim;
		x2*=this.gridDim;
		y1*=this.gridDim;
		y2*=this.gridDim;
		pt1 = walls.pts[pt[0]][pt[1]];
		pt2 = walls.pts[pt[0]][pt[1]+1];
		var angleLine = this.getAngle(pt1.x, pt1.y, pt2.x, pt2.y);
		var anglePt1 = this.getAngle(pt1.x, pt1.y, x1, y1);
		var anglePt2 = this.getAngle(pt1.x, pt1.y, x2, y2);
		if (this.getBetweenAngle(angleLine, anglePt1, anglePt2)){
			if(x1==x2){
				return this.getBetweenPoint(x1, pt1.x, pt2.x, type);
			} else if (y1==y2){
				return this.getBetweenPoint(y1, pt1.y, pt2.y, type);
			}
		}
		return false;
	},
	getAngle: function(x1, y1, x2, y2){
		var angle = Math.atan2((y2-y1),(x2-x1))
		if(angle<0){
			angle+=2*Math.PI;
		}
		return angle;
	},
	getBetweenAngle: function(line, pt1, pt2){
		var big = Math.max(pt1, pt2);
		var small = Math.min(pt1, pt2);
		if (big >= line && line >= small){
			return true;
		} else if (big-small > Math.PI){
			if (line >= big || line <= small){
				return true;
			}
		}
		return false;
	},
	getBetweenPoint: function(gridPt, wallPt1, wallPt2, type){
		if (Math.min(wallPt1, wallPt2) <= gridPt && gridPt <= Math.max(wallPt1, wallPt2)){
			return true;
		} else if (type=="min"){
			if (gridPt + this.gridDim >= wallPt1 && wallPt1 >= gridPt && gridPt + this.gridDim >= wallPt1 && wallPt1 >= gridPt){
				return true;
			}
		} else if (type=="max"){
			if(gridPt - this.gridDim >= wallPt1 && wallPt1 >= gridPt && gridPt - this.gridDim >= wallPt1 && wallPt1 >= gridPt){
				return true;
			}
		}
		return false;
	},
	check: function(){
		for (var spcIdx=0; spcIdx<spcs.length; spcIdx++){
			var spc = spcs[spcIdx];
			for (var dotIdx=0; dotIdx<spc.dots.length; dotIdx++){
				var dot = spc.dots[dotIdx];
				var checkedWalls = [];
				var gridX = Math.floor(dot.x/this.gridDim);
				var gridY = Math.floor(dot.y/this.gridDim);
				if(gridX>this.xSpan || gridX<0 || gridY>this.ySpan || gridY<0){
					returnEscapist(dot);
					console.log("ball out of bounds");				
				}
				else{
					for (var x=Math.max(gridX-1, 0); x<=Math.min(gridX+1, this.xSpan); x++){
						for (var y=Math.max(gridY-1, 0); y<=Math.min(gridY+1, this.ySpan); y++){
							
							for (var subwallIdx=0; subwallIdx<walls.wallGrids.length; subwallIdx++){
								for (var lineIdx=0; lineIdx<this.wallGrids[subwallIdx][x][y].length; lineIdx++){
									var line = this.wallGrids[subwallIdx][x][y][lineIdx];
									if (!this.haveChecked([subwallIdx, line], checkedWalls)){
										this.checkWallHit(dot, [subwallIdx, line]);
										checkedWalls.push([subwallIdx, line]);
									}
								}
							}
		
								
						}
					}
				}
			}
		}
	},
	checkWallHit: function(dot, line){
		var wallPt = walls.pts[line[0]][line[1]];
		var dotVec = V(dot.x - wallPt.x, dot.y - wallPt.y);
		var wallUV = this.wallUVs[line[0]][line[1]]
		var dotAB = dotVec.dotProd(wallUV);
		var hypSqrd = dotVec.dx*dotVec.dx + dotVec.dy*dotVec.dy;
		var dist = Math.sqrt(hypSqrd - dotAB*dotAB);
		var perpVec = V(wallUV.dy, -wallUV.dx);
		var perpV = perpVec.dotProd(dot.v);
		if (perpV+dot.r>dist && this.inRange(dot, line, dot.r, dotAB)){
			curLevel.onWallImpact(dot, line, wallUV, perpV);
		}
	},
	inRange: function(dot, line, r, dotDirectionOne){
		var wallUV = this.wallUVs[line[0]][line[1]];
		var wallPt = walls.pts[line[0]][line[1]+1];
		var otherDir = V(-wallUV.dx, -wallUV.dy);
		var dotVec = V(dot.x-wallPt.x, dot.y-wallPt.y);
		return (dotDirectionOne>=0 && dotVec.dotProd(otherDir)>=0)
	},
	impactStd: function(dot, wallUV, perpV){
		dot.v.dx -= 2*wallUV.dy*perpV;
		dot.v.dy += 2*wallUV.dx*perpV;
		dot.x -= wallUV.dy
		dot.y += wallUV.dx
	},
	haveChecked: function(wall, list){
		for (var listIdx=0; listIdx<list.length; listIdx++){
			if(list[listIdx][0]==wall[0] && list[listIdx][1]==wall[1]){
				return true;
			}
		}
		return false;
	},
	area: function(wallIdx){
		var wall = walls.pts[wallIdx];
		var area = 0;
		var originPt = wall[0];
		for (var ptIdx=2; ptIdx<wall.length-1; ptIdx++){
			pt1 = wall[ptIdx-1];
			pt2 = wall[ptIdx];
			area += originPt.area(pt1, pt2);
		}
		return area;
	},
	surfArea: function(){
		var SA=0;
		for (var wallIdx=0; wallIdx<walls.pts.length; wallIdx++){
			var wall = walls.pts[wallIdx];
			for (ptIdx=0; ptIdx<wall.length-1; ptIdx++){
				var pt = wall[ptIdx];
				var ptNext = wall[ptIdx+1];
				SA+=pt.distTo(ptNext);
			}
		}
		return SA;
	},
}