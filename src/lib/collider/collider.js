"use strict"
import AABB from "../aabb.js"
import AABBTree from "../aabbtree.js"
import Sort from "../sort.js"
import Geono from "../geono.js"
import Collision from "./collision.js"
import Sphere from "./sphere.js";
import Cone from "./cone.js";
import Cylinder from "./cylinder.js";
import Capsule from "./capsule.js";
import Cuboid from "./cuboid.js";
import ConvexHull from "./convexhull.js";
import Mesh from "./mesh.js"
import Triangle from "./triangle.js"
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import gjkepa from "./gjk.js"
import convexCast from "./convexcast.js"

var calcClosestPrimitive = gjkepa;


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

var Collider = (function(){


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
	ret.prototype.convexCastAll = function(col,v,min,max){
		if(min===max){
			min=0;
			max=99999;
		}
		var lineaabb = new AABB();
		var aabb = new AABB();
		Vec3.madd(lineaabb.min,col.aabb.min,v,min);
		Vec3.madd(lineaabb.max,col.aabb.max,v,min);
		Vec3.madd(aabb.min,col.aabb.min,v,max);
		Vec3.madd(aabb.max,col.aabb.max,v,max);
		AABB.add(lineaabb,lineaabb,aabb);

		this.hitListIndex = 0;
		var ans1 = Vec3.alloc();
		var ans2 = Vec3.alloc();

		this.aabbSorts[0].forEach((col2)=>{

			if(!(col.groups & col2.groups)
			  || (col.notgroups & col2.notgroups)){
				//衝突グループに一致しない場合は無視
				//not衝突グループに一致する場合は無視
				return;
			}

			if(!AABB.hitCheck(lineaabb,col2.aabb)){
				return;
			}

			if(!AABB.aabbCast(v,col.aabb,col2.aabb)){
				return;
			}
			var a=convexCast(v,col,col2,ans1,ans2);

			if(a !== INVALID && a>=min && a<=max){
				//ヒットした場合はヒット一覧に追加
				var elem = this.hitList[this.hitListIndex];
				Vec3.copy(elem.pos1,ans1);
				Vec3.copy(elem.pos2,ans2);
				elem.col1=col;
				elem.col2=col2;
				elem.len=a;
				this.hitListIndex++;
			}
		});

		Vec3.free(2);

		//一番近い接触情報を探す
		if(this.hitListIndex===0){
			return null;
		}
		var closest_hit = this.hitList[0];
		for(var i=1;i<this.hitListIndex;i++){
			var hit = this.hitList[i];
			if(hit.len < closest_hit.len){
				closest_hit = hit;
			}
		}

		return closest_hit;
	}

	//コリジョンリストのレイキャスト
	ret.prototype.rayCastAll = function(p,v,groups,min,max){
		if(min===max){
			min=0;
			max=99999;
		}
		var AABBSort = this.aabbSorts[0];
		this.hitListIndex = 0;
		var ans1 = Vec3.alloc();
		var p2= Vec3.alloc();
		if(!groups){
			groups=(1<<30)-1;
		}

		Vec3.add(p2,p,v);
		for(var j=0;j<AABBSort.length;j++){
			var obj = AABBSort[j];
			if(!(obj.groups & groups)){
				continue;
			}
			var res = AABB.hitCheckLine(obj.aabb,p,p2);
			if(AABB.result <0){
				continue;
			}
			var a=AABBSort[j].rayCast(p,p2,ans1);
			if(a !== INVALID && a>=0){
				var elem = this.hitList[this.hitListIndex];
				Vec3.madd(elem.pos1,p,v,a);
				Vec3.copy(elem.pos2,ans1);
				elem.col2=AABBSort[j];
				elem.len=a;
				this.hitListIndex++;
			}
		}
		Vec3.free(2);

		//一番近い接触情報を探す
		if(this.hitListIndex===0){
			return null;
		}
		var closest_hit = this.hitList[0];
		for(var i=1;i<this.hitListIndex;i++){
			var hit = this.hitList[i];
			if(hit.len < closest_hit.len){
				closest_hit = hit;
			}
		}
		return closest_hit;
	}

	//コリジョンリストと引数のコリジョンの距離判定
	ret.prototype.checkClosestAll= function(col){
		var AABBSort = this.aabbSorts[0];
		this.hitListIndex = 0;
		var ans1 = Vec3.alloc();
		var ans2 = Vec3.alloc();
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
		Vec3.free(2);
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

		var n = Vec3.alloc();
		Vec3.sub(n,ans2,ans1);
		if(!flg){
			//接触していない場合はベクトルを逆にする
			Vec3.mul(n,n,-1);
		}
		//接触位置を太さ分ずらす
		Vec3.norm(n);
		Vec3.madd(ans1,ans1,n,col1.bold);
		Vec3.madd(ans2,ans2,n,-col2.bold);

		Vec3.free(1);
		return l;
	}

	//最小距離もしくは最大めり込み距離を求める(太さ未考慮）
	var calcClosestWithoutBold = function(ans1,ans2,col1,col2){
		var l = 9999;
		if(col1.type===MESH){
			//col1がメッシュの場合
			l = col1.hitCheck(ans1,ans2,col2);
		}else if(col2.type===MESH){
			//col2がメッシュの場合
			l = col2.hitCheck(ans2,ans1,col1);
		}else{
			var func=hantei[col1.type*8+col2.type];
			if(func){
				//専用の関数のある組み合わせの場合
				if(!ans1 || !ans2){
					ans1 = Vec3.alloc();
					ans2 = Vec3.alloc();
					l=func(ans1,ans2,col1,col2);
					Vec3.free(2);
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
	ret.calcClosestWithoutBold = calcClosestWithoutBold;




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
		Vec3.setValue(ans1,col1.matrix[9],col1.matrix[10],col1.matrix[11]);
		Vec3.setValue(ans2,col2.matrix[9],col2.matrix[10],col2.matrix[11]);
		return Vec3.len(ans1,ans2);
	});

	setHantei(CAPSULE, SPHERE, function(ans1,ans2,col1,col2){
		var m = col1.matrix;
		var bV0 = Vec3.alloc();
		var bV1 = Vec3.alloc();
		Vec3.setValue(bV0,m[9]+m[3],m[10]+m[4],m[11]+m[5]);
		Vec3.setValue(bV1,m[9]-m[3],m[10]-m[4],m[11]-m[5]);
		Vec3.setValue(ans2,col2.matrix[9],col2.matrix[10],col2.matrix[11]);
		Geono.LINE_POINT(ans1,bV0,bV1,ans2);
		Vec3.free(2);
		return Vec3.len(ans1,ans2);
	});
	setHantei(TRIANGLE, SPHERE, function(ans1,ans2,col1,col2){
		Vec3.setValue(ans2,col2.matrix[9],col2.matrix[10],col2.matrix[11]);
		Geono.TRIANGLE_POINT(ans1,col1.v[0],col1.v[1],col1.v[2],ans2);
		return Vec3.len(ans1,ans2);
	});

	setHantei(CUBOID,SPHERE,function(ans1,ans2,cuboid,sphere){
		var axis= Vec3.alloc();
		var dVec = Vec3.alloc();
		var len = Vec3.alloc();

		//中心差分
		dVec[0]=sphere.matrix[9] - cuboid.matrix[9];
		dVec[1]=sphere.matrix[10] - cuboid.matrix[10];
		dVec[2]=sphere.matrix[11] - cuboid.matrix[11];

		var insideFlg=1; //内包フラグ

		Vec3.setValue(ans1,sphere.matrix[9],sphere.matrix[10],sphere.matrix[11]); 
		Vec3.setValue(ans2,sphere.matrix[9],sphere.matrix[10],sphere.matrix[11]); //球は中心固定
		
		for(var i=0;i<DIMENSION;i++){
			Vec3.setValue(axis,cuboid.matrix[i*3+0],cuboid.matrix[i*3+1],cuboid.matrix[i*3+2]); //軸
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
			Vec3.setValue(axis,cuboid.matrix[min*3+0],cuboid.matrix[min*3+1],cuboid.matrix[min*3+2]); //軸
			Vec3.madd(ans1,ans2,axis,len[min]/Vec3.scalar(axis));

			Vec3.free(3);
			return -Vec3.len(ans1,ans2);
		}else{ //外側の場合
			Vec3.free(3);
			return Vec3.len(ans1,ans2);
		}
	});

	ret.prototype.All = function(disableList,disableListSize){
		//総当り
		var ans1 = Vec3.alloc();
		var ans2 = Vec3.alloc();
		var n = Vec3.alloc();

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

		Vec3.free(3);
	}

	




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
	ret.Triangle = Triangle;
	return ret;
})();
export default Collider;
