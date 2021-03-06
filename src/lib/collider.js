"use strict"
import {AABB,AABBTree} from "./aabb.js"
import Sort from "./sort.js"
import Geono from "./geono.js"
import Collision from "./collider/collision.js"
import Sphere from "./collider/sphere.js";
import Cone from "./collider/cone.js";
import Cylinder from "./collider/cylinder.js";
import Capsule from "./collider/capsule.js";
import Cuboid from "./collider/cuboid.js";
import ConvexHull from "./collider/convexhull.js";
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "./vector.js"

var Collider = (function(){

	var DIMENSION = 3; //次元数
	var MIN=Math.min
		,MAX=Math.max
	;
	var INVALID = -9999999; //無効値

	class HitListElem{
		//接触情報
		constructor(){
			this.pairId=-1; //重なったコリジョン組のID  id1+id2
			this.col1=null; //コリジョン1
			this.col2=null; //コリジョン2
		}
	}
	class HitListElemEx extends HitListElem{
		//接触情報(接触座標つき)
		constructor(){
			super();
			this.pos1=new Vec3(); //コリジョン1の接触点
			this.pos2=new Vec3(); //コリジョン2の接触点
		}
	};

	var ret = Collider = function(){
		this.collisions = []; //コリジョンリスト
		this.collisionIndexList=[]; //ID保管リスト
		for(var i=1023;i--;){
			this.collisionIndexList.push(i);
		}
		this.aabbSorts=[]; //AABBソートリスト
		this.aabbHitListMain=[]; //AABB接触リスト
		this.hitList=[]; //接触情報
		this.hitListIndex=0; //接触数
		for(var i=0;i<1024;i++){
			this.aabbHitListMain.push(new HitListElem);
			this.hitList.push(new HitListElemEx);
		}
		for(var i=0;i<DIMENSION;i++){
			this.aabbSorts.push([]);
		}
	}
	ret.INVALID = INVALID;
	
	var i=0;
	var MESH = ret.MESH = i++
		,CUBOID = ret.CUBOID = i++
		,SPHERE = ret.SPHERE = i++
		,CYLINDER= ret.CYLINDER= i++
		,CAPSULE = ret.CAPSULE = i++
		,CONE= ret.CONE= i++
		,CONVEX_HULL= ret.CONVEX_HULL= i++
		,TRIANGLE = ret.TRIANGLE= i++
	;
	var collisionIndexList;

	ret.prototype.addCollision= function(collision){
		//コリジョン登録
		collision.id=this.collisionIndexList.pop();
		this.collisions.push(collision)
		for(var i=0;i<DIMENSION;i++){
			this.aabbSorts[i].push(collision)
		}
		return;
	}

	ret.prototype.deleteCollision = function(obj){
		var collisions=this.collisions;
		for(var i=0;i<collisions.length;i++){
			if(collisions[i] === obj){
				this.collisionIndexList.push(collisions[i].id);
				collisions.splice(i,1);
				break;
			}
		}
		for(var j=0;j<3;j++){
			var aabbSort = this.aabbSorts[j];
			for(var i=0;i<aabbSort.length;i++){
				if(aabbSort[i] === obj){
					aabbSort.splice(i,1);
					break;
				}
			}
		}
	}


//ここから基本図形-----------------------------------------------------
	class Mesh extends ConvexHull{
		//メッシュ
		constructor(){
			//メッシュ
			super();
			this.type=MESH;
			this.triangles=[]; //三角ポリゴンセット
			this.aabbTreeRoot= null;
		};

		refresh(){
			this.calcAABB();

			//三角AABB
			var triangles = this.triangles;
			var nodes = [];
			for(var i=0;i<triangles.length;i++){
				var node = new AABBTree.Node();
				node.element=triangles[i];
				nodes.push(node);
				triangles[i].calcAABB(node.aabb);
				//triangles[i].calcAABB(AABB);
			}

			this.aabbTreeRoot=AABBTree.createAABBTree(nodes);
		}

		rayCast(p0,p1,normal) {
			var min=INVALID;

			var triangles = this.triangles;
			for(var i=0;i<triangles.length;i++){
				if(!AABB.hitCheckLine(triangles[i].aabb,p0,p1)){
					continue;
				}
				var l=triangles[i].rayCast(p0,p1);
				if(l>min && l<0){
					min=l;
				}
			}
			return min;
		}
	};

	ret.Triangle = class Triangle extends ConvexHull{
		constructor(){
			super();
			this.poses.push(new Vec3());
			this.poses.push(new Vec3());
			this.poses.push(new Vec3());
		}
	}
//----------------------------------------------------------------------------------------


	ret.prototype.sortList=function(){
		for(var i=0;i<DIMENSION;i++){
			//ソート
			this.aabbSorts[i].sort(function(a,b){return a.aabb.min[i] - b.aabb.min[i]});
		}
	}
	ret.prototype.calcAABBHitList=(function(){
		var aabbHitLists=new Array(DIMENSION);
		var aabbHitListsIdx=new Array(DIMENSION);
		for(var i=1;i<aabbHitLists.length;i++){
			aabbHitLists[i]=new Array(1024);
		}
		var calcAABBHitList= function(){
			var aabbHitListMain=this.aabbHitListMain;

			this.sortList();

			//AABBの重なりチェックx軸
			var aabbHitListMainIdx=0;
			var AABBSort = this.aabbSorts[0];
			for(var j=0;j<AABBSort.length;j++){
				var end=AABBSort[j].aabb.max[0];
				for(var k=j+1;k<AABBSort.length;k++){
					if(end<=AABBSort[k].aabb.min[0]){
						//AABBの先頭が判定元AABBの終端を超えていたら終了
						break;
					}

					if(!(AABBSort[j].groups & AABBSort[k].groups)
					  || (AABBSort[j].notgroups & AABBSort[k].notgroups)){
						//グループが一致しない場合は無視
						//notグループが一致する場合は無視
						continue;
					}

					//重なっているAABBを追加
					if(AABBSort[j].id<AABBSort[k].id){
						aabbHitListMain[aabbHitListMainIdx].col1=AABBSort[j];
						aabbHitListMain[aabbHitListMainIdx].col2=AABBSort[k];
					}else{
						aabbHitListMain[aabbHitListMainIdx].col1=AABBSort[k];
						aabbHitListMain[aabbHitListMainIdx].col2=AABBSort[j];
					}
					aabbHitListMain[aabbHitListMainIdx].pairId
						= Collider.getPairId(AABBSort[j].id, AABBSort[k].id);
					aabbHitListMainIdx++;
				}
			}
			Sort.kisu(aabbHitListMain,function(a){return a.pairId},0,aabbHitListMainIdx-1);

			for(var i=1;i<DIMENSION;i++){
				//y,z軸それぞれで計算
				var idx=0;
				var AABBSort = this.aabbSorts[i];
				var aabbHitList=aabbHitLists[i];

				//AABBの重なりチェック
				for(var j=0;j<AABBSort.length;j++){
					var end=AABBSort[j].aabb.max[i];
					for(var k=j+1;k<AABBSort.length;k++){
						if(end<=AABBSort[k].aabb.min[i]){
							//AABBの先頭が判定元AABBの終端を超えていたら終了
							break;
						}
						if(!(AABBSort[j].groups & AABBSort[k].groups)
						  || (AABBSort[j].notgroups & AABBSort[k].notgroups)){
							//グループが一致しない場合は無視
							//notグループが一致する場合は無視
							continue;
						}
						//重なっているAABBを追加
						aabbHitList[idx]
							= Collider.getPairId(AABBSort[j].id,AABBSort[k].id);
						idx++;
					}
				}

				aabbHitList[idx]=(2<<16)*(2<<16);//番兵
				Sort.kisu(aabbHitList,null,0,idx-1);
			}

			//3つの軸すべて重なっているものを抽出
			var idx=0;
			var idxy=0;
			var idxz=0;
			for(var i=0;i<aabbHitListMainIdx;i++){
				var pairId = aabbHitListMain[i].pairId;
				
				//x軸と同じペアIDがy,zにあるかチェック
				for(;aabbHitLists[1][idxy]<pairId;idxy++){}
				for(;aabbHitLists[2][idxz]<pairId;idxz++){}

				if(aabbHitLists[1][idxy] == pairId
				 && aabbHitLists[2][idxz] == pairId){
					//あった場合追加
					aabbHitListMain[idx].pairId=aabbHitListMain[i].pairId;
					aabbHitListMain[idx].col1=aabbHitListMain[i].col1;
					aabbHitListMain[idx].col2=aabbHitListMain[i].col2;
					idx++;
				}
			}
			aabbHitListMain[idx].pairId=-1;

			return aabbHitListMain;
		};
		return calcAABBHitList;
	})();

	//コリジョンリストと引数のコリジョンのレイキャスト
	ret.prototype.convexCastAll = function(col,v){
		var AABBSort = this.aabbSorts[0];
		this.hitListIndex = 0;
		var ans1 = Vec3.poolAlloc();
		var ans2 = Vec3.poolAlloc();
		for(var j=0;j<AABBSort.length;j++){
			if(!(col.groups & AABBSort[j].groups)
			  || (col.notgroups & AABBSort[j].notgroups)){
				//グループが一致しない場合は無視
				//notグループが一致する場合は無視
				continue;
			}
			if(!AABB.aabbCast(v,col.aabb,AABBSort[j].aabb)){
				continue;
			}
			var a=Collider.convexCast(v,col,AABBSort[j],ans1,ans2);
			if(a !== INVALID){
				var elem = this.hitList[this.hitListIndex];
				Vec3.copy(elem.pos1,ans1);
				Vec3.copy(elem.pos2,ans2);
				elem.col1=col;
				elem.col2=AABBSort[j];
				elem.len=a;
				this.hitListIndex++;
			}
		}
		Vec3.poolFree(2);
		return this.hitList;
	}
	//コリジョンリストのレイキャスト
	ret.prototype.rayCastAll = function(p,v){
		var AABBSort = this.aabbSorts[0];
		this.hitListIndex = 0;
		var ans1 = Vec3.poolAlloc();
		var p2= Vec3.poolAlloc();

		Vec3.add(p2,p,v);
		for(var j=0;j<AABBSort.length;j++){
			var a=AABBSort[j].rayCast(p,p2,ans1);
			if(a !== INVALID){
				var elem = this.hitList[this.hitListIndex];
				Vec3.madd(elem.pos1,p,v,a);
				Vec3.copy(elem.pos2,ans1);
				elem.col1=AABBSort[j];
				elem.len=a;
				this.hitListIndex++;
			}
		}
		Vec3.poolFree(2);
		return this.hitList;
	}

	//コリジョンリストと引数のコリジョンの距離判定
	ret.prototype.checkClosestAll= function(col){
		var AABBSort = this.aabbSorts[0];
		this.hitListIndex = 0;
		var ans1 = Vec3.poolAlloc();
		var ans2 = Vec3.poolAlloc();
		for(var j=0;j<AABBSort.length;j++){

			if(col.aabb.max[0]<AABBSort[j].aabb.min[0])break;
			if(col.aabb.min[0]>AABBSort[j].aabb.max[0])continue;

			if(!(col.groups & AABBSort[j].groups)
			  || (col.notgroups & AABBSort[j].notgroups)){
				//グループが一致しない場合は無視
				//notグループが一致する場合は無視
				continue;
			}

			if(Collider.calcClosest(ans1,ans2,col,AABBSort[j])<0){
				var elem = this.hitList[this.hitListIndex];
				Vec3.copy(elem.pos1,ans1);
				Vec3.copy(elem.pos2,ans2);
				elem.col1=col;
				elem.col2=AABBSort[j];
				this.hitListIndex++;
			}
		}
		Vec3.poolFree(2);
		return this.hitList;
	}

	//コリジョンリストと引数のコリジョンの接触判定
	ret.prototype.checkHitAll = function(col){
		var AABBSort = this.aabbSorts[0];
		this.hitListIndex = 0;
		for(var j=0;j<AABBSort.length;j++){
			if(col.aabb.max[0]<AABBSort[j].aabb.min[0])break;
			if(col.aabb.min[0]>AABBSort[j].aabb.max[0])continue;
			
			if(!(col.groups & AABBSort[j].groups)
			  || (col.notgroups & AABBSort[j].notgroups)){
				//グループが一致しない場合は無視
				//notグループが一致する場合は無視
				continue;
			}

			if(Collider.calcClosest(null,null,col,AABBSort[j],1)<0){
				var elem = this.hitList[this.hitListIndex];
				elem.col1=col;
				elem.col2=AABBSort[j];
				this.hitListIndex++;
			}
		}
		return this.hitList;

	}
	
	//col1とcol2の接触チェック
	ret.checkHit = function(col1,col2){
		return Collider.calcClosest(null,null,col1,col2);
	}

	//col1とcol2の最小距離もしくは最大めり込み距離を求める
	ret.calcClosest = function(ans1,ans2,col1,col2){
		var l = calcClosestWithoutBold(ans1,ans2,col1,col2);
		var flg=0;
		if(l>0){
			//接触していない
			flg=1;
		}
		//距離からそれぞれのオブジェクトの太さ分を考慮したものにする
		l -= (col1.bold + col2.bold);

		if(!ans1 || !ans2){
			//位置が不要な場合は終わり
			return l;
		}

		var n = Vec3.poolAlloc();
		Vec3.sub(n,ans2,ans1);
		if(!flg){
			//接触していない場合はベクトルを逆にする
			Vec3.mul(n,n,-1);
		}
		//接触位置を太さ分ずらす
		Vec3.norm(n);
		Vec3.madd(ans1,ans1,n,col1.bold);
		Vec3.madd(ans2,ans2,n,-col2.bold);

		Vec3.poolFree(1);
		return l;
	}

	//最小距離もしくは最大めり込み距離を求める(太さ未考慮）
	var calcClosestWithoutBold = (function(){
		return function(ans1,ans2,col1,col2){
			var l = 9999;
			if(col1.type===MESH){
				//col1がメッシュの場合
				l = MESH_ANY(ans1,ans2,col1,col2);
			}else if(col2.type===MESH){
				//col2がメッシュの場合
				l = MESH_ANY(ans2,ans1,col2,col1);
			}else{
				var func=hantei[col1.type*8+col2.type];
				if(func){
					//専用の関数のある組み合わせの場合
					if(!ans1 || !ans2){
						ans1 = Vec3.poolAlloc();
						ans2 = Vec3.poolAlloc();
						l=func(ans1,ans2,col1,col2);
						Vec3.poolFree(2);
					}else{
						l=func(ans1,ans2,col1,col2);
					}
				}else{
					//専用の関数がない場合は汎用関数(GJK-EPA)
					l=calcClosestPrimitive(ans1,ans2,col1,col2);
				}
			}
			return l;
		}
	})();

	//GJKとEPA
	var calcClosestPrimitive = (function(){

		var checkLINE_LINE_=function(a1,a2,b1,b2,axis){
			//線分交差点を求める。
			var cross= Vec3.poolAlloc();
			var cross2= Vec3.poolAlloc();
			var ret=-1;
			
			Vec3.sub(cross2,b2,b1);
			Vec3.cross(cross,cross2,axis);
			Vec3.sub(cross2,a1,b1);
			var l =Vec3.dot(cross,cross2);
			Vec3.sub(cross2,a2,b1);
			var l2 =Vec3.dot(cross,cross2);

			ret = l/(l-l2);
				
			Vec3.poolFree(2);
			return ret;
		}
		var checkLINE_LINE=function(a1,a2,b1,b2,axis){
			//線分交差点を求める。交差しない場合-1を返す
			var cross= Vec3.poolAlloc();
			var cross2= Vec3.poolAlloc();
			var ret=-1;
			Vec3.sub(cross2,a2,a1);
			Vec3.cross(cross,cross2,axis);
			Vec3.sub(cross2,b1,a1);
			var l =Vec3.dot(cross,cross2);
			Vec3.sub(cross2,b2,a1);
			var l2 =Vec3.dot(cross,cross2);
			
			if(l*l2<=0){
				Vec3.sub(cross2,b2,b1);
				Vec3.cross(cross,cross2,axis);
				Vec3.sub(cross2,a1,b1);
				l =Vec3.dot(cross,cross2);
				Vec3.sub(cross2,a2,b1);
				l2 =Vec3.dot(cross,cross2);
				if(l*l2<0){
					ret = l/(l-l2);
				}
			}
			
				
			Vec3.poolFree(2);
			return ret;
		}
		var TRIANGLE_TRIANGLE__=function(ans1,ans2,axis,A1,A2,A3,B1,B2,B3){
			//GJKorEPAの結果から得た三角形の組の最近点を求める

			if(Vec3.len2(A1,A2)<0.0001 &&  Vec3.len2(A1,A3)<0.0001){
				//A側が点の場合
				Vec3.copy(ans1,A1);
				Vec3.sub(ans2,ans1,axis);
				return;
			}else if(Vec3.len2(B1,B2)<0.0001 && Vec3.len2(B1,B3)<0.0001){
				//B側が点の場合
				Vec3.copy(ans2,B1);
				Vec3.add(ans1,ans2,axis);
				return;
			}

			var idxa=3;
			var idxb=3;
			if(Vec3.len2(A2,A3)<0.0001){
				idxa=1;
			}
			if(Vec3.len2(A1,A3)<0.0001){
				idxa=1;
			}
			if(Vec3.len2(A1,A2)<0.0001){
				Vec3.copy(A2,A3);
				idxa=1;
			}

			if(Vec3.len2(B2,B3)<0.0001){
				idxb=1;
			}
			if(Vec3.len2(B1,B3)<0.0001){
				idxb=1;
			}
			if(Vec3.len2(B1,B2)<0.0001){
				Vec3.copy(B1,B3);
				idxb=1;
			}

			var cross = Vec3.poolAlloc();
			var cross2 = Vec3.poolAlloc();

			if(idxa===1 && idxb===1){
				//どっちも線分の場合
				Vec3.sub(cross2,A2,A1);
				Vec3.madd(ans1,A1,cross2,checkLINE_LINE_(A1,A2,B1,B2,axis));
				Vec3.sub(ans2,ans1,axis);
				Vec3.poolFree(2);
				return;
			}

			var As=[A1,A2,A3,A1];
			var Bs=[B1,B2,B3,B1];

			if(idxb===3){
				Vec3.cross2(cross,B1,B2,B3);
				Vec3.norm(cross);
				//三角B1B2B3の上にA1A2A3のどれかがあるか
				for(var j=0;j<idxa;j++){
					var p = As[j];
					for(var i=0;i<3;i++){
						var v1 = Bs[i];
						var v2 = Bs[i+1];
						Vec3.sub(cross2,v2,v1);
						Vec3.cross(cross2,cross,cross2);
						if(Vec3.dot(cross2,v1)>Vec3.dot(cross2,p)){
							break;
						}
					}
					if(i===3){
						Vec3.copy(ans1,p);
						Vec3.sub(ans2,ans1,axis);
						Vec3.poolFree(2);
						return;
					}
				}

				
			}

			if(idxa===3){
				//三角A1A2A3の上にB1B2B3のどれかがあるか
				Vec3.cross2(cross,A1,A2,A3);

				Vec3.norm(cross);
				for(var j=0;j<idxb;j++){
					var p = Bs[j];
					for(var i=0;i<3;i++){
						var v1 = As[i];
						var v2 = As[i+1];
						Vec3.sub(cross2,v2,v1);
						Vec3.cross(cross2,cross,cross2);
						if(Vec3.dot(cross2,v1)>Vec3.dot(cross2,p)){
							break;
						}
					}
					if(i===3){
						Vec3.copy(ans2,p);
						Vec3.add(ans1,ans2,axis);
						Vec3.poolFree(2);
						return;
					}
				}
			}

			//線分同士が交差するか
			if(idxa===2)idxa===1;
			if(idxb===2)idxb===1;
			for(var j=0;j<idxa;j++){
				var a1=As[j];
				var a2=As[j+1];
				for(var i=0;i<idxb;i++){
					var b1=Bs[i];
					var b2=Bs[i+1];

					var l=checkLINE_LINE(a1,a2,b1,b2,axis);
					if(l>=0 && l<=1){
						Vec3.sub(cross2,a2,a1);
						Vec3.madd(ans1,a1,cross2,l);
						Vec3.sub(ans2,ans1,axis);
						Vec3.poolFree(2);
						return;
					}
					
				}
			}

			//普通はここに到達しない
			//精度か何かの問題があるとここまでくる
			Vec3.add(ans1,A1,A2);
			Vec3.add(ans1,ans1,A3);
			Vec3.mul(ans1,ans1,0.333333);
			Vec3.sub(ans2,ans1,axis);

			Vec3.poolFree(2);
			return 0;

		}

		var closestFace=function(){
			this.v=new Int32Array(3);
			this.cross = new Vec3();
			this.len = 0;
		}
		var vertices=[];
		var vertices1=[];
		var faces=[];
		var edges=[];
		var edgesIndex;
		var faceIndex;
		var idx;
		for(var i=0;i<256;i++){
			vertices.push(new Vec3());
			vertices1.push(new Vec3());
			faces.push(new closestFace());
			var edge=new Int32Array(2);//[-1,-1];
			edges.push(edge);
		}

		var line_zero = function(ans,l1,l2){
			var ret;
			var dir =Vec3.poolAlloc();
			Vec3.sub(dir,l2,l1); //線分の向き
			var r = -Vec3.dot(dir,l1);
			if(r <= 0){
				//始点未満
				Vec3.copy(ans,l1);
				ret=-1;
			}else{
				var r2 = Vec3.scalar2(dir);
				if( r > r2){
					//終点超え
					Vec3.copy(ans,l2);
					ret=1;
				}else{
					Vec3.madd(ans,l1,dir, r/r2);
					ret=0;
				}
			}
			Vec3.poolFree(1);
			return ret;
		}
		var triangleCheck=function(t1,t2,t3){
			//三角形上に原点があるか
			//ある…0   ない…2,4,6
			var cross = Vec3.poolAlloc();
			var cross2 = Vec3.poolAlloc();

			Vec3.cross2(cross,t1,t2,t3);

			var ts=[t1,t2,t3,t1];
			var ret=0;

			for(var i=0;i<3;i++){
				var v1 = ts[i];
				var v2 = ts[i+1];
				Vec3.sub(cross2,v2,v1);
				Vec3.cross(cross2,cross,cross2);
				if(Vec3.dot(cross2,v1)>0){
					ret=(i+1)<<1;
					break;
				}
			}
			Vec3.poolFree(2);
			return ret;

		}

		var triangle_zero=function(ans,t1,t2,t3){
			var dir = Vec3.poolAlloc(); 
			var cross = Vec3.poolAlloc();
			Vec3.cross2(cross,t1,t2,t3);

			var ts=[t1,t2,t3,t1,t2];

			var res =triangleCheck(t1,t2,t3);
			if(res===0){
				//面の上にいる場合
				Vec3.mul(ans,cross,Vec3.dot(cross,t1)/Vec3.scalar2(cross));
			}else{
				//辺の外側にいる場合
				var r = (res>>1) -1;

				var v1 = ts[r];
				var v2 = ts[r+1];
				var v3 = ts[r+2];
				Vec3.sub(dir,v2,v1); //線分の向き

				var l=-Vec3.dot(v1,dir);
				var _l=Vec3.dot(dir,dir);
				if(l<0){
					//辺の始点より外の場合
					res+=line_zero(ans,v1,v3);

				}else  if(l>_l){
					//辺の終点より外の場合
					res+=line_zero(ans,v3,v2);
				}else{
					Vec3.madd(ans,v1,dir,l/_l);
				}
				
			}
			Vec3.poolFree(2);
			return res;

		}
		var addFaceBuf=new Vec3();
		var addFace = function(v1,v2,v3,obj1,obj2){
			var vs = vertices;
			var face;
			var i;
			for(i=0;i<faceIndex;i++){
				if(faces[i].len<0){
					break;
				}
			}
			if(i===faceIndex){
				faceIndex++;
			}
			face=faces[i];

			//現状4つの距離を計算
			Vec3.set(face.v,v1,v2,v3);
			Vec3.cross2(face.cross,vs[v1],vs[v2],vs[v3]);
			Vec3.norm(face.cross);
			face.len = Vec3.dot(face.cross,vs[v1]);

			if(face.len<0){
				face.len*=-1;
			}else{
				Vec3.mul(face.cross,face.cross,-1);
			}

			return face;
		}
		for(var i=0;i<128;i++){
			var edge=[-1,-1];
			edges.push(edge);
		}
		var addEdge = function(v1,v2){
			for(var j=0;j< edgesIndex;j++){
				if((edges[j][0]===v1 && edges[j][1]===v2)
				|| (edges[j][0]===v2 && edges[j][1]===v1)){
					//既に同一エッジがある場合は追加せず既存のも無効化
					edges[j][0]=-1;
					return;
					
				}
			}
			//無効インデックスを探す
			for(var j=0;j< edgesIndex;j++){
				if(edges[j][0]<0){
					break;
				}
			}
			if(j>=edgesIndex){
				//エッジ増えたらインデックスを増やす
				edgesIndex++;
			}
			var edge=edges[j];
			edge[0]=v1;
			edge[1]=v2;
		}
	return function(ans1,ans2,obj1,obj2){
		var s= Vec3.poolAlloc();
		var s1= Vec3.poolAlloc();
		var vbuf= Vec3.poolAlloc();
		var axis= Vec3.poolAlloc();
		var v=vertices;
		var v1=vertices1;
		var distance=-1;

		//中心
		Vec3.add(axis,obj1.aabb.min,obj1.aabb.max);
		Vec3.sub(axis,axis,obj2.aabb.min);
		Vec3.sub(axis,axis,obj2.aabb.max);
		Vec3.mul(axis,axis,0.5);


		//1個目の頂点を取る
		obj1.calcSupport(v1[0],axis);
		Vec3.mul(axis,axis,-1);
		obj2.calcSupport(v[0],axis);
		Vec3.sub(v[0],v1[0],v[0]);
		Vec3.mul(axis,v[0],1);
		idx=1;

		var counter=0;
		var hitflg=false ;
		while(1){
			//axisの向きで一番近い点をとる

			obj1.calcSupport(s1,axis);
			Vec3.mul(axis,axis,-1);
			obj2.calcSupport(s,axis);
			Vec3.sub(s,s1,s);
			Vec3.mul(axis,axis,-1);

			//現状の最短を求める
			var min=Vec3.dot(v[0],axis);
			for(var i=1;i<idx;i++){
				var l =Vec3.dot(v[i],axis);
				if(l<min){
					min=l;
				}
			}
		
			if(Vec3.dot(s,axis)>min-0.0001){
				//取得した点が最短と同じなら外判定
				break;
			}


			//現在の取得点から目標点までの最短点を求める
			if(idx===1){
				Vec3.copy(v[idx],s);
				Vec3.copy(v1[idx],s1);
				line_zero(axis,v[0],v[1]);

				min=Vec3.scalar2(axis);
				if(min<0.00001){
					//接触している場合は適当に垂直な方向をとる
					axis[0]=-(v[0][1]-v[1][1]);
					axis[1]=v[0][2]-v[1][2];
					axis[2]=v[0][0]-v[1][0];

					if(Vec3.dot(axis,v[0])<0){
						Vec3.mul(axis,axis,-1);
					}
				}
				idx++;
			}else if(idx===2){
				Vec3.copy(v[idx],s);
				Vec3.copy(v1[idx],s1);

				triangle_zero(axis,v[0],v[1],v[2]);
				min=Vec3.scalar2(axis);
				if(min<0.00001){
					//接触している場合は適当に垂直な方向をとる
					Vec3.cross2(axis,v[0],v[1],v[2]);
					if(Vec3.dot(axis,v[0])<0){
						Vec3.mul(axis,axis,-1);
					}
				}
				idx++;
			}else{
				if(idx===3){
					Vec3.copy(v[idx],s);
					Vec3.copy(v1[idx],s1);
					idx++;
				}else{
					Vec3.copy(v[3],s);
					Vec3.copy(v1[3],s1);
				}
				var farIndex=-1;
				var min=-1;
				for(var i=0;i<4;i++){
					var t4=v[i];
					var t1=v[(i+1)&3];
					var t2=v[(i+2)&3];
					var t3=v[(i+3)&3];
					Vec3.cross2(vbuf,t1,t2,t3);
					var l1=Vec3.dot(t1,vbuf); //原点から面までの距離
					var l2=Vec3.dot(t4,vbuf)-l1; //面からもうひとつの頂点までの距離

					if( l1*l2>0){
						//四面体に内包されない
						var l=triangle_zero(vbuf,t1,t2,t3);
						var m=Vec3.scalar2(vbuf);
						if(farIndex<0 || m<min | l===0){
							min=m;
							farIndex=i;
							Vec3.copy(axis,vbuf);
						}
						if(l===0){
							break;
						}
					}
				}
				if(farIndex<0){
					//内包する場合
					hitflg=true;
					break;
				}
				Vec3.copy(v[farIndex],v[3]);
				Vec3.copy(v1[farIndex],v1[3]);

			}

			//無限ループ対策
			counter++;
			if(counter === 32){
				console.log("l!!");
			}
			if(counter>33){
				console.log("loooop!!");
				break;
			}

		}

		if(!hitflg){
			//内包してない場合の処理

			//ミンコフスキー差の一番近いとこを再計算する
			if(idx===1){
				Vec3.copy(axis,v[0]);
			}else if(idx===2){
				var ret= line_zero(axis,v[0],v[1]);
				if(ret===-1){
					idx=1;
				}else if(ret===1){
					idx=1;
					Vec3.copy(v[0],v[1]);
					Vec3.copy(v1[0],v1[1]);
				}
			}else{
				var ret=triangle_zero(axis,v[0],v[1],v[2]);
				if(ret&1){
					//最近が角の場合
					idx=1;
					ret = ret>>1;
					Vec3.copy(axis,v[ret]);
				}else if(ret){
					//最近が辺の場合
					idx=2;
					ret = (ret>>1)-1;
					Vec3.copy(v[0],v[ret]);
					Vec3.copy(v1[0],v1[ret]);
				}

			}
			if(!ans1 || !ans2){
				//接触判定のみの場合は距離だけ求める
			}else{
				//両オブジェクトの最近点算出
				var v2=[];
				for(var i=0;i<idx;i++){
					v2.push(new Vec3());
					Vec3.sub(v2[i],v1[i],v[i]);
				}
				if(idx===1){
					//頂点が1個の場合はそれぞれの頂点が最近点
					Vec3.copy(ans1,v1[0]);
					Vec3.copy(ans2,v2[0]);
				}else if(idx===2){
					//頂点が2個の場合はどっちかが点
					if(Vec3.len2(v1[0],v1[1])<Vec3.len2(v2[0],v2[1])){
						Vec3.copy(ans1,v1[0]);
						Vec3.sub(ans2,ans1,axis);
					}else{
						Vec3.copy(ans2,v2[0]);
						Vec3.add(ans1,axis,ans2);
					}
				}else{

					TRIANGLE_TRIANGLE__(ans1,ans2,axis,v1[0],v1[1],v1[2]
						,v2[0],v2[1],v2[2]);
				}
			}
			distance=Vec3.scalar(axis);
			
		}else if(ans1 || ans2){

			//内包する場合
			faceIndex=0;
			idx=4;
			counter=0;
			for(var i=0;i<idx;i++){ 
				//現状4つの面を追加
				addFace(i,(i+1)&3,(i+2)&3,obj1,obj2);
			}
			var face;
			var min;
			while(1){
				//最短面探索
				for(var i=0;i<faceIndex;i++){
					if(faces[i].len>=0){
						face=faces[i];
						min=face.len;
						break;
					}
				}
				for(;i<faceIndex;i++){
					if(faces[i].len<min && faces[i].len>=0){
						face=faces[i];
						min=face.len;
					}
				}

				//最短面の法線取得
				Vec3.copy(axis,face.cross);
				//サポ射
				obj1.calcSupport(s1,axis);
				Vec3.mul(axis,axis,-1);
				obj2.calcSupport(s,axis);
				Vec3.sub(s,s1,s);


				//終了チェック
				if(Vec3.dot(s,axis) < face.len + 0.00001){
					
					break;
				}

				//終了しなかった場合はその点を追加
				Vec3.copy(v[idx],s);
				Vec3.copy(v1[idx],s1);

				edgesIndex=0;
				for(var i=0;i<faceIndex;i++){
					//追加した頂点に関係する面を探す
					var face=faces[i];
					if(face.len<0){
						//無効面はスルー
						continue;
					}
					Vec3.sub(vbuf,s,v[face.v[0]]);
					if(Vec3.dot(vbuf,face.cross)<0){
						//面のエッジを追加
						addEdge(face.v[0],face.v[1]);
						addEdge(face.v[1],face.v[2]);
						addEdge(face.v[2],face.v[0]);
						//face削除
						face.len=-1;
					}
				}
				for(var i=0;i<edgesIndex;i++){
					if(edges[i][0]<0){
						continue;
					}
					//新たなfaceを追加、
					addFace(edges[i][0],edges[i][1],idx,obj1,obj2);
				}
				idx++;


				//無限ループ対策
				counter++;
				if(counter === 32){
					console.log("l!!");
				}
				if(counter>33){
					console.log("loooop!!");
					Vec3.poolFree(4);
					return 0;
				}
			}

			//最短faceを探す
			for(var i=0;i<faceIndex;i++){
				var f=faces[i];
				if(f.len<0){
					//無効面はスルー
					continue;
				}
				if(triangleCheck(v[f.v[0]],v[f.v[1]],v[f.v[2]])){
					continue;
				}
				min =f.len;
				face = f;
				break;
			}
			for(;i<faceIndex;i++){
				var f=faces[i];
				if(f.len<0){
					//無効面はスルー
					continue;
				}
				if(triangleCheck(v[f.v[0]],v[f.v[1]],v[f.v[2]])){
					continue;
				}
				if(min>f.len){
					min =f.len;
					face = f;
				}
			}
			//両三角のめり込み点を求める
			var V1=[v1[face.v[0]],v1[face.v[1]],v1[face.v[2]]];
			var V2=[];
			for(var i=0;i<3;i++){
				V2.push(new Vec3());
				Vec3.sub(V2[i],v1[face.v[i]],v[face.v[i]]);
			}
			Vec3.mul(axis,face.cross,-face.len);

			TRIANGLE_TRIANGLE__(ans1,ans2,axis
					,V1[0],V1[1],V1[2]
					,V2[0],V2[1],V2[2]);
			
			distance=-Vec3.len(ans1,ans2);
		}
		Vec3.poolFree(4);
		return distance;
	};
	})();

	var AABBNode_ANY =function(ans1,ans2,node,col2){
		//AABBツリーと何かの判定
		if(!AABB.hitCheck(node.aabb,col2.aabb)){
			return 9999999;
		}
		if(node.element){
			return calcClosestWithoutBold(ans1,ans2,node.element,col2);
		}else{
			var ans3 = Vec3.poolAlloc();
			var ans4 = Vec3.poolAlloc();
			var l = AABBNode_ANY(ans1,ans2,node.child1,col2);
			var l2 = AABBNode_ANY(ans3,ans4,node.child2,col2);

			if(l2<l){
				Vec3.copy(ans1,ans3);
				Vec3.copy(ans2,ans4);
				l =l2;
			}
			Vec3.poolFree(2);
			return l;
		}
	}
	var MESH_ANY=function(ans1,ans2,col1,col2){
		//メッシュと何かの判定
		return AABBNode_ANY(ans1,ans2,col1.aabbTreeRoot,col2);
	}


	//特定の組み合わせ用最近計算アルゴリズム
	var hantei=new Array(8*8);
	for(var i=0;i<8*8;i++){
		hantei[i]=null;
	}
	var setHantei = function(a,b,c){
		hantei[b*8+a]=function(ans1,ans2,col1,col2){
			return c(ans2,ans1,col2,col1);
		}
		hantei[a*8+b]=c;
	}
	
	setHantei(SPHERE, SPHERE, function(ans1,ans2,col1,col2){
		Vec3.set(ans1,col1.matrix[9],col1.matrix[10],col1.matrix[11]);
		Vec3.set(ans2,col2.matrix[9],col2.matrix[10],col2.matrix[11]);
		return Vec3.len(ans1,ans2);
	});

	setHantei(CAPSULE, SPHERE, function(ans1,ans2,col1,col2){
		var m = col1.matrix;
		var bV0 = Vec3.poolAlloc();
		var bV1 = Vec3.poolAlloc();
		Vec3.set(bV0,m[9]+m[3],m[10]+m[4],m[11]+m[5]);
		Vec3.set(bV1,m[9]-m[3],m[10]-m[4],m[11]-m[5]);
		Vec3.set(ans2,col2.matrix[9],col2.matrix[10],col2.matrix[11]);
		Geono.LINE_POINT(ans1,bV0,bV1,ans2);
		Vec3.poolFree(2);
		return Vec3.len(ans1,ans2);
	});
	setHantei(TRIANGLE, SPHERE, function(ans1,ans2,col1,col2){
		Vec3.set(ans2,col2.matrix[9],col2.matrix[10],col2.matrix[11]);
		Geono.TRIANGLE_POINT(ans1,col1.v[0],col1.v[1],col1.v[2],ans2);
		return Vec3.len(ans1,ans2);
	});

	setHantei(CUBOID,SPHERE,function(ans1,ans2,cuboid,sphere){
		var axis= Vec3.poolAlloc();
		var dVec = Vec3.poolAlloc();
		var len = Vec3.poolAlloc();

		//中心差分
		dVec[0]=sphere.matrix[9] - cuboid.matrix[9];
		dVec[1]=sphere.matrix[10] - cuboid.matrix[10];
		dVec[2]=sphere.matrix[11] - cuboid.matrix[11];

		var insideFlg=1; //内包フラグ

		Vec3.set(ans1,sphere.matrix[9],sphere.matrix[10],sphere.matrix[11]); 
		Vec3.set(ans2,sphere.matrix[9],sphere.matrix[10],sphere.matrix[11]); //球は中心固定
		
		for(var i=0;i<DIMENSION;i++){
			Vec3.set(axis,cuboid.matrix[i*3+0],cuboid.matrix[i*3+1],cuboid.matrix[i*3+2]); //軸
			var d = Vec3.dot(axis,dVec); //軸に対する差分
			var size = Vec3.dot(axis,axis); //軸の長さ^2
			if(d >  size){ //軸より外の場合(正)
				Vec3.madd(ans1,ans1,axis,1-d/size);
				insideFlg = 0;
			}else if( d< -size){//軸より外の場合(負)
				Vec3.madd(ans1,ans1,axis,-(1+d/size));
				insideFlg = 0;
			}else{ //内側の場合
				if(d>0){
					len[i] = (size - d)/Vec3.scalar(axis);
				}else{
					len[i] = (-size - d)/Vec3.scalar(axis);
				}
			}
		}
		if(insideFlg){ //内側の場合
			var min=0;
			for(var i=1;i<DIMENSION;i++){
				if(len[min]*len[min]>len[i]*len[i]){
					min=i;
				}
			}
			Vec3.set(axis,cuboid.matrix[min*3+0],cuboid.matrix[min*3+1],cuboid.matrix[min*3+2]); //軸
			Vec3.madd(ans1,ans2,axis,len[min]/Vec3.scalar(axis));

			Vec3.poolFree(3);
			return -Vec3.len(ans1,ans2);
		}else{ //外側の場合
			Vec3.poolFree(3);
			return Vec3.len(ans1,ans2);
		}
	});

	ret.prototype.All = function(disableList,disableListSize){
		//総当り
		var ans1 = Vec3.poolAlloc();
		var ans2 = Vec3.poolAlloc();
		var n = Vec3.poolAlloc();

		var collisions = this.aabbSorts[0];

		var start=Date.now();
		performance.mark("aabbStart");
		//AABBで重なっているペアを抽出
		var aabbHitList = this.calcAABBHitList();
		performance.mark("aabbEnd");

		var dIdx= 0;

		Sort.kisu(disableList,null,0,disableListSize-1);
		performance.mark("collisionStart");
		this.hitListIndex=0;
		for(var i=0;aabbHitList[i].pairId>0;i++){
			var aabbHit=aabbHitList[i];

			//コリジョン無効チェック
			var flg=false;
			for(;disableList[dIdx]>0;dIdx++){
				if(disableList[dIdx]===aabbHit.pairId){
					flg=true;
					break;
				}
				if(disableList[dIdx]>aabbHit.pairId){
					break;
				}
			}

			if(flg){
				continue;
			}
			var col1=aabbHit.col1;
			var col2=aabbHit.col2;

			var l = Collider.calcClosest(ans1,ans2,col1,col2);
			if(l<0){
				var elem = this.hitList[this.hitListIndex];
				Vec3.copy(elem.pos1,ans1);
				Vec3.copy(elem.pos2,ans2);
				elem.col1=col1;
				elem.col2=col2;
				elem.pairId = aabbHitList[i].pairId;
				this.hitListIndex++;

				if(col1.callbackFunc){
					col1.callbackFunc(col1,col2,elem.pos1,elem.pos2);
				}
				if(col2.callbackFunc){
					col2.callbackFunc(col2,col1,elem.pos2,elem.pos1);
				}
			}
		}
		this.hitList[this.hitListIndex].col1=null;

		this.collisionCount=i;
		performance.mark("collisionEnd");

		Vec3.poolFree(3);
	}

	

	var TRIANGLE_LINE=function(p1,t0,t1,t2){
		var cross=Vec3.poolAlloc();
		var dt=Vec3.poolAlloc();
		var ret=0;
		Vec3.sub(dt,t1,t0);

		var vs=[t0,t1,t2,t0,t1];
		for(var j=0;j<3;j++){
			Vec3.cross(cross,p1,dt); //線と辺に垂直なベクトル
			Vec3.sub(dt,vs[j+2],vs[j+1]);
			if(Vec3.dot(cross,vs[j])*Vec3.dot(cross,dt)>0){
				//辺の外の場合はずれ
				ret=j+1;
				break;
			}
		}
		Vec3.poolFree(2);
		return ret;
	}


	ret.convexCast= function(_t,o1,o2,ans1,ans2){
		var axis=Vec3.poolAlloc();
		var _axis=Vec3.poolAlloc();
		var v=[];
		var v1=[];
		var v2=[];
		var t=Vec3.poolAlloc();
		Vec3.mul(t,_t,-1);
		for(var i=0;i<DIMENSION+1;i++){
			v.push(Vec3.poolAlloc());
			v1.push(Vec3.poolAlloc());
			v2.push(Vec3.poolAlloc());
		}
		var vbuf=Vec3.poolAlloc();
		

		Vec3.copy(axis,t);


		var idx=1;
		var counter=0;
		var ret = INVALID;

		//最初の点を求める
		o1.calcSupportB(v1[0],axis);
		Vec3.mul(_axis,axis,-1);
		o2.calcSupportB(v2[0],_axis);
		
		Vec3.sub(v[0],v1[0],v2[0]);
		Vec3.cross(axis,v[0],t);
		Vec3.cross(axis,t,axis);
		if(Vec3.dot(axis,v[0])<0){
			Vec3.mul(axis,axis,-1);
		}

		var min=Vec3.dot(axis,v[0]);
		var vloop=[v[0],v[1],v[2],v[0],v[1],v[2]];
		while(1){
			//axisの向きで一番近い点をとる
			o1.calcSupportB(v1[idx],axis);
			Vec3.mul(_axis,axis,-1);
			o2.calcSupportB(v2[idx],_axis);

			Vec3.sub(v[idx],v1[idx],v2[idx]);
		
			min=Vec3.dot(axis,v[0]);
			for(var i=1;i<idx;i++){
				min=Math.min(min,Vec3.dot(axis,v[i]));
			}	
			//取得した点が現在の最短と一致するかチェック
			if(Vec3.dot(v[idx],axis)>min-0.001){
				break;
			}

			if(idx===1){
				Vec3.sub(vbuf,v[0],v[1]);
				Vec3.cross(axis,vbuf,t);
				if(Vec3.dot(v[0],axis)<0){
					Vec3.mul(axis,axis,-1);
				}
				idx++;
			}else if(idx===2){
				ret =TRIANGLE_LINE(t,v[0],v[1],v[2]);
				if(ret===0){
					Vec3.cross2(axis,v[0],v[1],v[2]);
					if(Vec3.dot(axis,t)<0){
						Vec3.mul(axis,axis,-1);
					}
					idx++;
				}else{
					Vec3.copy(vloop[ret+1],vloop[2]);
					Vec3.sub(vbuf,v[0],v[1]);
					Vec3.cross(axis,vbuf,t);
					if(Vec3.dot(v[0],axis)<0){
						Vec3.mul(axis,axis,-1);
					}

				}
			}else{
				
				//四面体の手前3つの面のどれを貫通しているか調べる
				var next=-1;
				var min;
				for (var i=0;i<3;i++){
					if(TRIANGLE_LINE(t,v[i],vloop[i+1],v[3])){
						continue;
					}
					Vec3.cross(vbuf,v[i],vloop[i+1],v[3]);
					var l=Vec3.dot(vbuf,v[3])/Vec3.dot(vbuf,t);
					if(next<0 || l<min){
						next=i;
						min=l;
					}
				}
				if(next>=0){
					Vec3.copy(vloop[next+2],v[3]);
					Vec3.cross2(axis,v[0],v[1],v[2]);
					if(Vec3.dot(t,axis)<0){
						Vec3.mul(axis,axis,-1);
					}
				}else{
					//console.log("B");
					Vec3.copy(axis,t);
					min=Vec3.dot(v[3],axis);
					break;
					
				}
			}

			//無限ループ対策
			counter++;
			if(counter===20){
				console.log("lo!!");
			}
			if(counter>21){
				console.log("loooop!!");
				break;
			}

		}

		//その時点が最短
		if(idx>2){
			var l=Vec3.dot(axis,t);
			if(l){
				min=min/l;
			}else{
				min=0;
			}

			if(ans1){
				Vec3.copy(ans1,axis);
				Vec3.set(ans2,0,0,0);
			}
		}else{
			min=INVALID;
		}
		Vec3.poolFree(16);
		return min;
	};

	//id1とid2のペアIDを求める
	ret.getPairId=function(id1,id2){
		if(id1<id2){
			return (id1<<16) | id2;
		}else{
			return (id2<<16) | id1;
		}
	}
	ret.Sphere = Sphere;
	ret.Cuboid= Cuboid;
	ret.Cylinder= Cylinder;
	ret.Cone= Cone;
	ret.Capsule= Capsule;
	ret.ConvexHull= ConvexHull;
	ret.Mesh= Mesh;
	return ret;
})();
export default Collider;
