
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import AABB from "../aabb.js"
import convexCast from "./convexcast.js"
var DIMENSION = 3; //次元数
var INVALID = -9999999; //無効値

var reverse = new Vec3();

export default class Collision{
	constructor(){
		this.matrix = new Mat43();
		this.bold = 0;
		this.inv_matrix = new Mat43();
		this.aabb = new AABB();
		this.parent = null;
		this.callbackFunc = null;
		this.name = "";
		this.groups = 1;
		this.notgroups = 0;
	}

	calcSupport(ret,axis){
		//サポート写像
		ret[0]=this.matrix[9];
		ret[1]=this.matrix[10];
		ret[2]=this.matrix[11];
		return;
	}
	calcSupportReverse(ret,axis){
		//サポート写像逆
		Vec3.mul(reverse,axis,-1);
		this.calcSupport(ret,reverse);
		return;
	}
	calcSupportB(ret,axis){
		//太さを考慮したサポート写像
		this.calcSupport(ret,axis);
		Vec3.madd(ret,ret,axis,(this.bold/Vec3.scalar(axis)));
		return;
	}
	calcSupportReverseB(ret,axis){
		//太さを考慮したサポート写像逆
		this.calcSupportReverse(ret,axis);
		Vec3.madd(ret,ret,axis,-(this.bold/Vec3.scalar(axis)));
		return;
	}

	calcAABB(aabb){
		//aabbを求める
		if(!aabb){
			aabb=this.aabb;
		}
		//AABBを求める
		var axis = Vec3.alloc();
		var ret = Vec3.alloc();

		for(var i=0;i<DIMENSION;i++){
			Vec3.setValue(axis,0,0,0);
			axis[i]=1;
			this.calcSupport(ret,axis);
			aabb.max[i]=ret[i]+this.bold;
			axis[i]=-1;
			this.calcSupport(ret,axis);
			aabb.min[i]=ret[i]-this.bold;
		}
		Vec3.free(2);
	}
	
	refresh(){
		//衝突判定前処理
		Mat43.getInv(this.inv_matrix,this.matrix);
		this.calcAABB();
	};

	rayCast(p0,p1,normal){
		//線分p0p1との交点(p0に近いほう)を求める
		sphere.matrix[9]=p0[0];
		sphere.matrix[10]=p0[1];
		sphere.matrix[11]=p0[2];
		sphere.refresh();
		var ang=Vec3.alloc();
		Vec3.sub(ang,p1,p0);
		var l =convexCast(ang,sphere,this,normal);
		Vec3.free(1);

		return l;
	};
};
var i=0;
Collision.MESH = i++
Collision.CUBOID = i++
Collision.SPHERE = i++
Collision.CYLINDER= i++
Collision.CAPSULE = i++
Collision.CONE= i++
Collision.CONVEX_HULL= i++
Collision.TRIANGLE= i++
Collision.INVALID =INVALID;

Collision.SPHERE_LINE = function(p0,p1,p2,r,normal) {
	var p = Vec3.alloc();
	var d = Vec3.alloc();
	Vec3.sub(p,p0,p2);
	Vec3.sub(d,p1,p0);
	var A = Vec3.dot(d,d);
	var B = Vec3.dot(p,d);
	var C = Vec3.dot(p,p) - r*r;

	Vec3.free(2);
	if(A===0){
		return Collision.INVALID;
	}
	var l = B*B-A*C;
	if(l<0){
		return Collision.INVALID;
	}
	l=(-B - Math.sqrt(l))/A;
	if(normal){
		//交差点の法線
		Vec3.madd(normal,p0,d,l);
		Vec3.sub(normal,normal,p2);
		Vec3.norm(normal);
	}

	return l;

}


var sphere=new Collision();
Mat43.setValue(sphere.matrix,1,0,0,0,1,0,0,0,1,0,0,0);
sphere.bold=0;
