import {Vec2,Vec3,Vec4} from "./vector.js"
import pooling from "./pool.js"

//AABB -----------------

var DIMENSION=3
	,MIN = Math.min
	,MAX = Math.max;
export default class AABB {
	static result;
	constructor(){
		this.min=new Vec3();
		this.max=new Vec3();
	}

	static add(a,b,c){
		//2つのAABBを内包するAABBを作成
		for(var i=0;i<DIMENSION;i++){
			if(b.min[i]<c.min[i]){
				a.min[i]=b.min[i];
			}else{
				a.min[i]=c.min[i];
			}
			if(b.max[i]>c.max[i]){
				a.max[i]=b.max[i];
			}else{
				a.max[i]=c.max[i];
			}
		}
	}

	calcSupport(result,ang){
		//サポート
		for(var i=0; i<DIMENSION; i++){
			if(ang[i]<0){
				result[i] = this.min[i]
			}else{
				result[i] = this.max[i]
			}
		}
		return ;
	}

	static hitCheck(a,b){
		//2つのAABBが重なっているか
		for(var i=0; i<DIMENSION; i++){
			if(a.min[i]>b.max[i]
			|| a.max[i]<b.min[i]){
				return false;
			}
		}
		return true;
	}



	static hitCheckLine(a,p0,p1){
		//AABBと線分p0p1が接触しているか
		//接触していない場合は-1
		//接触している場合は位置(比率)を返す

		var min=-99999;
		var max=99999;
		var t = Vec3.alloc();
		Vec3.sub(t,p1,p0); //線の傾き

		for(var i=0;i<DIMENSION;i++){
			var n = t[i];
			if(n>0){
				var n3 = (a.min[i]-p0[i])/n;
				if(n3 > min){
					min=n3;
				}
				n3 = (a.max[i]-p0[i])/n;
				if(n3 < max){
					max=n3;
				}
			}else if(n<0){
				var n3 = (a.max[i]-p0[i])/n;
				if(n3 > min){
					min=n3;
				}
				n3 = (a.min[i]-p0[i])/n;
				if(n3 < max){
					max=n3;
				}
			}else{
				//平行な場合
				if(a.min[i]>p0[i] ||  a.max[i]<p0[i]){
					Vec3.free(1);
					this.result = -1;
					return -1;
				}
			}
		}
		Vec3.free(1);
		this.result = 0;
		if(min>max){
			this.result = -1;
		}
		return min;
	}
	static createFromPoints(aabb,points){
		//すべての頂点を内包するAABBを求める
		for(var i=0;i<DIMENSION;i++){
			aabb.min[i]=points[0][i];
			aabb.max[i]=points[0][i];
		}
		points.forEach((point)=>{
			for(var i=0;i<DIMENSION;i++){
				aabb.min[i]=MIN(point[i]);
				aabb.max[i]=MAX(point[i]);
			}
		});
	}

	static createFromPolygon(aabb,v1,v2,v3,v4){
		//すべての頂点を内包するAABBを求める
		if(v4){
			for(var i=0;i<DIMENSION;i++){
				aabb.min[i]=MIN(MIN(MIN(v1[i],v2[i]),v3[i]),v4[i]);
				aabb.max[i]=MAX(MAX(MAX(v1[i],v2[i]),v3[i]),v4[i]);
			}
		}else{
			for(var i=0;i<DIMENSION;i++){
				aabb.min[i]=(MIN(MIN(v1[i],v2[i]),v3[i]));
				aabb.max[i]=(MAX(MAX(v1[i],v2[i]),v3[i]));
			}
		}
	}
	static addPoint(aabb,v){
		for(var i=0;i<DIMENSION;i++){
			aabb.min[i]=Math.min(aabb.min[i],v[i]);
			aabb.max[i]=Math.max(aabb.max[i],v[i]);
		}
	}

	static aabbCast(ang,aabb1,aabb2){
		Vec3.sub(aabbBuf.min,aabb1.min,aabb2.max);
		Vec3.sub(aabbBuf.max,aabb1.max,aabb2.min);
		
		return this.hitCheckLine(aabbBuf,Vec3.ZERO,ang);

	}
};

pooling(AABB);
var aabbBuf= new AABB();

