
import {Vec3} from "./vector.js"

//境界面
export default class BoundingPlane{
	constructor(){
		this.distance = 0;//平面と原点との距離
		this.normal =new Vec3();//平面の法線
	}

	calc(p1,p2,p3){
		//頂点p1,p2,p3から平面を求める
		Vec3.cross2(this.normal,p1,p2,p3);
		Vec3.norm(this.normal);
		this.distance = Vec3.dot(this.normal,p1);
	}

	checkFront(p){
		//pが境界面より法線側にある場合true、でなければfalse
		return this.distance <=Vec3.dot(p,this.normal);
	}
	hitCheck(p){
		//pが境界面より法線側にある場合true、でなければfalse
		return this.distance <=Vec3.dot(p,this.normal);
	}

	static intersection(p, plane0, plane1) { //辺の交点
	  var a = Vec3.dot(plane0.normal,plane1.normal);
	  var _a = 1 / (1 - a * a);
	  var A = (plane0.distance - a * plane1.distance) * _a;
	  var B = (plane1.distance - a * plane0.distance) * _a;
	  p[0] = A * plane0.normal[0] + B * plane1.normal[0];
	  p[1] = A * plane0.normal[1] + B * plane1.normal[1];
	  p[2] = A * plane0.normal[2] + B * plane1.normal[2];
	}
	static intersection3(p, plane0, plane1,plane2) { //面の交点
		var n = new Vec3();
		this.intersection(p,plane0,plane1);
		Vec3.cross(n,plane0.normal,plane1.normal);
		var a = Vec3.dot(n,plane2.normal);
		if(!a){
			return true;
		}
		var b = Vec3.dot(p,plane2.normal);
		var m = (-b + plane2.distance) / a;

		p[0] += n[0]*m;
		p[1] += n[1]*m;
		p[2] += n[2]*m;
	  }
}
