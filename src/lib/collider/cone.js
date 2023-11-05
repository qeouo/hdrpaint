
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import {AABB,AABBTree} from "../aabb.js"
import Collision from "./collision.js"
var DIMENSION = 3; //次元数
var m_sqrt5 = -1/Math.sqrt(5);
export default class Cone extends Collision{
	//円錐
	constructor(){
		super();
		this.type=Collision.CONE;
	};
	calcSupport(ans,v){
		Mat43.dotMat33Vec3(ans,this.inv_matrix,v);
		Vec3.norm(ans);
		if(ans[1]<m_sqrt5){
			//頂点
			Vec3.set(ans,0,1,0);
		}else{
			//底面
			ans[1]=0;
			Vec3.nrm(ans,ans);
			ans[1]=1;
			Vec3.mul(ans,ans,-1);
		}
		Mat43.dotVec3(ans,this.matrix,ans);
	};

	rayCast(p0,p1,normal) {
		//コーンと直線
		var min=-99999;
		var max=99999;
		var flg =false;

		var d = Vec3.alloc();
		var p = Vec3.alloc();
		Mat43.dotVec3(p,this.inv_matrix,p0);
		Mat43.dotVec3(d,this.inv_matrix,p1);
		Vec3.sub(d,d,p);

		var pn = p[1]; //距離
		if(d[1]===0){
			//レイが水平な場合
			if(pn*pn>1){
				//高さが+-1より大きい場合は接触しない
				min=99999;
			}else{
				var r=(1-p)*0.5; //レイのある高さの半径

				var A = d[0]*d[0] + d[2]*d[2];
				var B = p[0]*d[0] + p[2]*d[2];
				var C = p[0]*p[0] + p[2]*p[2] - r*r;
				if(A===0){
					//レイが0ベクトルの場合
					if(p[0]*p[0]+p[2]*p[2]>r*r){
						//半径より外なら接触していない
						min = 999999;
					}
				}else{
					var l = B*B-A*C;
					if(l<0){
						//判別式負の場合接触しない
						min=999999;
					}else{
						min=Math.max(min,(-B - Math.sqrt(l))/A);
					}
				}
			}
		}else{

			//コーンの側面
			p[2]-=1;
			var A = (4/5)*(d[0]*d[0] + d[1]*d[1]  +d[2]*d[2]) - d[1]*d[1];
			var B = (4/5)*(p[0]*d[0] + p[1]*d[1] + p[2]*d[2]) - p[1]*d[1];
			var C = (4/5)*(p[0]*p[0] + p[1]*p[1] + p[2]*p[2]) - p[1]*p[1];

			var l = B*B-A*C;
			if(l<0){
				//判別式が負の場合接触しない
				min=99999;
			}else{

				if(A>0){
					min=(-B - Math.sqrt(l))/A;
					max=(-B + Math.sqrt(l))/A;
				}else if(A<0){
					if(d[2]>0){
						//max = Math.min(max,(-B-Math.sqrt(l))/A);
						max = (-B+Math.sqrt(l))/A;
					}else{
						//min= Math.max(min,(-B+Math.sqrt(l))/A);
						min= (-B-Math.sqrt(l))/A;
					}
				}else{
					if(B<0){
						min=-C/(2*B);
					}else{
						max=-C/(2*B);
					}
				}

				//高さ接触範囲 +-1
				var invz=1/d[1];
				if(invz>0){
					max = Math.min(max,(1-pn)*invz);
					var min2 = (-1-pn)*invz;
					if(min2>min){
						min = min2;
						flg=true;
					}
				}else{
					max = Math.min(max,(-1-pn)*invz);
					min = Math.max(min,(1-pn)*invz);
				}
			}
		}

		if(min>max){
			//範囲逆転の場合接触していない
			min=Collision.INVALID;
			if(normal){
				Vec3.set(normal,0,0,0);
			}
		}else{
			if(normal){
				Vec3.madd(p,p,d,min);
				if(flg){
					Vec3.set(normal,0,-1,0);
				}else{
					var l = this.matrix[9]*this.matrix[9]+this.matrix[10]*this.matrix[10]+this.matrix[11]*this.matrix[11];
					Vec3.set(normal,p[0],0.5/l,p[2]);
				}
				Mat33.dotVec3(normal,this.matrix,normal);
				Vec3.norm(normal);
			}
		}

		Vec3.free(2);
		return min;
	}
};
