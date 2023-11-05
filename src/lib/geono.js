"use strict"
import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "./vector.js"

export default class Geono{

	static getOuterCenter(ans,p0,p1,p2){
		//外接円の中心
		var a = Vec2.len2(p2,p1);
		var b = Vec2.len2(p2,p0);
		var c = Vec2.len2(p0,p1);
		
		var A=a*(b+c-a);
		var B=b*(c+a-b);
		var C=c*(a+b-c);
		
		Vec2.mul(ans,p0,A);
		Vec2.madd(ans,ans,p1,B);
		Vec2.madd(ans,ans,p2,C);
		Vec2.mul(ans,ans,1/(A+B+C));
	}
	static getOuterCenter3_sub(ans,p0,p1,p2){
		var a = Vec3.len2(p2,p1);
		var b = Vec3.len2(p2,p0);
		var c = Vec3.len2(p0,p1);
		
		var A=a*(b+c-a);
		var B=b*(c+a-b);
		var C=c*(a+b-c);
		
		Vec3.mul(ans,p0,A);
		Vec3.madd(ans,ans,p1,B);
		Vec3.madd(ans,ans,p2,C);
		Vec3.mul(ans,ans,1/(A+B+C));
	}


	static getOuterCenter3(ans,p0,p1,p2,p3){
		//外接球の中心
		var a = Vec3.len2(p2,p1);
		var b = Vec3.len2(p2,p0);
		var c = Vec3.len2(p0,p1);
		var d = Vec3.len2(p0,p3);
		var e = Vec3.len2(p1,p3);
		var f = Vec3.len2(p2,p3);
		
		var K=a*d*(e+f-a) + b*e*(f+a-e) + c*f*(a+e-f) - 2*a*e*f;
		var L=a*d*(b+f-d) + b*e*(f+d-b) + c*f*(d+b-f) - 2*d*b*f;
		var M=a*d*(e+c-d) + b*e*(c+d-e) + c*f*(d+e-c) - 2*d*e*c;
		var N=a*d*(b+c-a) + b*e*(c+a-b) + c*f*(a+b-c) - 2*a*b*c;

		
		if(Math.abs(K+L+M+N)>0.00001){
			var det = 1/(K+L+M+N);
			Vec3.mul(ans,p0,K*det);
			Vec3.madd(ans,ans,p1,L*det);
			Vec3.madd(ans,ans,p2,M*det);
			Vec3.madd(ans,ans,p3,N*det);
		}else{
			ans[0]=NaN;
			
			//Geono.getOuterCenter3_sub(ans,p0,p1,p2);
		}

		//Vec3.mul(ans,ans,1/(K+L+M+N));
	}

	static LINE_POINT(ans,l1,l2,p1){
		//線分と点の最近点
		var dir =Vec3.alloc();
		var dpos = Vec3.alloc();
		Vec3.sub(dir,l2,l1); //線分の向き
		Vec3.sub(dpos,p1,l1); //線分と点の差
		var r = Vec3.dot(dir,dpos);
		if(r <= 0){
			Vec3.copy(ans,l1);
		}else{
			var r2 = dir[0]*dir[0]+dir[1]*dir[1]+dir[2]*dir[2];

			if( r > r2){
				Vec3.copy(ans,l2);
			}else{
				Vec3.madd(ans,l1,dir, r/r2);
			}
		}

		Vec3.free(2);

		return Vec3.len2(ans,p1);
	}

	static LINE_LINE=function(a1,a2,p1,p2,p3,p4){
		//線分と線分の最近点
		var dir1 = Vec3.alloc();
		var dir2 = Vec3.alloc();
		var cross = Vec3.alloc();
		var dpos = Vec3.alloc();

		var l;
		Vec3.sub(dir1,p2,p1); //線分1の向き
		if(!(dir1[0] || dir1[1] || dir1[2])){
			Vec3.copy(a1,p1);
			this.LINE_POINT(a2,p3,p4,a1);

			Vec3.free(4);
			return;
		}
		Vec3.sub(dir2,p4,p3);// 線分2の向き
		if(!(dir2[0] || dir2[1] || dir2[2])){
			Vec3.copy(a2,p3);
			this.LINE_POINT(a1,p1,p2,a2);

			Vec3.free(4);
			return;
		}

		Vec3.cross(cross,dir1,dir2); //垂直ベクトル
		if(Vec3.scalar(cross)){
			//2直線に垂直な方向から見たときの交点
			Vec3.cross(cross,dir2,cross); //線分2に垂直かつ線分1に並行?なベクトル
			var l1 = Vec3.dot(cross,dir1); 
			Vec3.sub(dpos,p3,p1); 
			var r1 = Vec3.dot(cross,dpos); //線分1の交差比率
			if(r1*l1>=0 && r1*r1<=l1*l1){

				Vec3.cross(cross,dir1,dir2); //垂直ベクトル
				Vec3.cross(cross,dir1,cross); //線分1に垂直かつ線分2に並行?なベクトル
				var l2 = Vec3.dot(cross,dir2); 
				var r2 = -Vec3.dot(cross,dpos); //線分2の交差比率

				if(r2*l2>=0 && r2*r2<=l2*l2){
					Vec3.madd(a1,p1,dir1,r1/l1);
					Vec3.madd(a2,p3,dir2,r2/l2);
					Vec3.free(4);
					return;
				}
			}
		}

		var min=this.LINE_POINT(dpos,p1,p2,p3);
		Vec3.copy(a1,dpos);
		Vec3.copy(a2,p3);

		var l=this.LINE_POINT(dpos,p1,p2,p4);
		if(l<min){
			min=l;
			Vec3.copy(a1,dpos);
			Vec3.copy(a2,p4);
		}
		l=this.LINE_POINT(dpos,p3,p4,p1);
		if(l<min){
			min=l;
			Vec3.copy(a1,p1);
			Vec3.copy(a2,dpos);
		}
		l=this.LINE_POINT(dpos,p3,p4,p2);
		if(l<min){
			min=l;
			Vec3.copy(a1,p2);
			Vec3.copy(a2,dpos);
		}

		Vec3.free(4);

	}

	static TRIANGLE_POINT=function(ans,t1,t2,t3,p1){
		//三角と点の最近点
		var dir = Vec3.alloc(); 
		var cross = Vec3.alloc();
		var cross2 = Vec3.alloc();
		var dpos = Vec3.alloc();

		cross[0]=t2[1]*t3[2] - t2[2]*t3[1] + t1[2]*(-t2[1]+t3[1]) + t1[1]*(t2[2]-t3[2]);
		cross[1]=t2[2]*t3[0] - t2[0]*t3[2] + t1[0]*(-t2[2]+t3[2]) + t1[2]*(t2[0]-t3[0]);
		cross[2]=t2[0]*t3[1] - t2[1]*t3[0] + t1[1]*(-t2[0]+t3[0]) + t1[0]*(t2[1]-t3[1]);

		var ts=[t1,t2,t3,t1,t2];

		for(var i=0;i<3;i++){
			var v1 = ts[i];
			var v2 = ts[i+1];
			var v3 = ts[i+2];
			Vec3.sub(dpos,p1,v1);
			Vec3.sub(dir,v2,v1); //線分の向き
			Vec3.cross(cross2,cross,dir); //法線と線分に垂直なベクトル
			
			if(Vec3.dot(cross2,dpos)<=0){
				var l=Vec3.dot(dpos,dir);
				var _l=Vec3.dot(dir,dir);
				if(l<0){
					this.LINE_POINT(ans,v1,v3,p1);
				}else  if(l>_l){
					this.LINE_POINT(ans,v2,v3,p1);
				}else{
					Vec3.madd(ans,v1,dir,l/_l);
				}
				Vec3.free(4);
				return;
			}
		}

		Vec3.madd(ans,p1,cross
			,-Vec3.dot(cross,dpos)/(cross[0]*cross[0]+cross[1]*cross[1]+cross[2]*cross[2]));
		Vec3.free(4);
	}
static triangleCheck(t1,t2,t3){
	//三角形上に原点があるか
	//ある/0   ない/2,4,6
	var cross = Vec3.alloc();
	var cross2 = Vec3.alloc();

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
	Vec3.free(2);
	return ret;

}
static triangle_zero(ans,t1,t2,t3){
	//三角と原点の最近点を求める
	var dir = Vec3.alloc(); 
	var cross = Vec3.alloc();
	Vec3.cross2(cross,t1,t2,t3);

	var ts=[t1,t2,t3,t1,t2];

	var res =this.triangleCheck(t1,t2,t3);
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
	Vec3.free(2);
	return res;

}

	static TRIANGLE_LINE=function(t1,t2,t3,l1,l2){
		//三角と線分の最近点
		var dpos = Vec3.alloc();
		var cross=Vec3.alloc();
		var pos2= Vec3.alloc();
		var cross2= Vec3.alloc();

		Vec3.cross2(cross,t1,t2,t3);
		Vec3.sub(dpos,t1,l1); //線開始点とポリゴンの距離
		Vec3.sub(pos2,l2,l1); //線開始点とポリゴンの距離

		var l2 = Vec3.dot(cross,pos2);
		if(l2===0){
			Vec3.free(4);
			return 99999;
		}
		var l = Vec3.dot(cross,dpos)/l2;
		Vec3.madd(pos2,l1,pos2,l); //面と線の交点

		var ts=[t1,t2,t3,t1];
		for(var j=0;j<3;j++){
			var v1 = ts[j];
			var v2 = ts[j+1];
			Vec3.sub(dpos,v2,v1); //線分の向き
			Vec3.cross(cross2,cross,dpos); //法線と線分に垂直なベクトル
			Vec3.sub(dpos,pos2,v1);
			
			if(Vec3.dot(cross2,dpos)<=0){
				//辺の外の場合はずれ
				Vec3.free(4);
				return 99999;
			}
		}

		Vec3.free(4);
		return l;

	}

	static calcSquarePos(ans,A,B,C,D,P){
		//四角ABCD内の点Pを(0~1,0~1)座標に変換
		var BA =Vec3.alloc();
		var CD =Vec3.alloc();
		var AP = Vec3.alloc();
		var DP= Vec3.alloc();
		var n = Vec3.alloc();
		Vec3.cross3(n,A,C,B,D); //四角の法線
		Vec3.sub(BA,B,A);
		Vec3.sub(CD,C,D);
		Vec3.sub(AP,A,P);
		Vec3.sub(DP,D,P);

		var a=0;
		var b=0;
		var c=0;
		for(var i=0;i<3;i++){
			var i1=(i+1)%3;
			var i2=(i+2)%3;
			a += (BA[i1]*CD[i2] - BA[i2]*CD[i1])*n[i];
			b += (BA[i1]*DP[i2] + AP[i1]*CD[i2] - (BA[i2]*DP[i1] + AP[i2]*CD[i1]))*n[i];
			c += (AP[i1]*DP[i2] - AP[i2]*DP[i1])*n[i];
		}
		var t;
		if(!a){
			t = -c/b;
		}else{
			if(b*b-4*a*c<0){
				t =(-b ) / (2*a);
			}else{
				t =(-b + Math.sqrt(b*b-4*a*c)) / (2*a);
			}
			var AD = Vec3.alloc();
			Vec3.sub(AD,A,D);
			Vec3.cross(AD,AD,n);
			var BC= Vec3.alloc();
			Vec3.sub(BC,B,C);
			Vec3.cross(BC,n,BC);
			var BP = Vec3.alloc();
			Vec3.sub(BP,B,P);
			if((t<0 && Vec3.dot(AD,AP)>0)
			|| (t>1 && Vec3.dot(BC,BP)>0)){
				t =(-b - Math.sqrt(b*b-4*a*c)) / (2*a);
			}
			Vec3.free(3);
		}

		ans[0]=t;
		var FE = Vec3.alloc();
		var PE = Vec3.alloc();
		Vec3.madd(FE,D,CD,t);
		Vec3.madd(FE,FE,BA,-t);
		Vec3.sub(FE,FE,A);
		Vec3.mul(PE,BA,t);
		Vec3.add(PE,PE,A);
		Vec3.sub(PE,P,PE);

		ans[1]= Vec3.dot(PE,FE)/Vec3.dot(FE,FE);

		Vec3.free(7);
		return t;
	}

	static TETRA_POINT(ans,p,v){
		var vbuf = Vec3.alloc();
		var flg = true;
		for(var i=0;i<4;i++){
			//4つの面それぞれから対象までの距離を求める
			var t1=v[(i+1)&3];
			var t2=v[(i+2)&3];
			var t3=v[(i+3)&3];
			var t4=v[i];
			Vec3.cross2(vbuf,t1,t2,t3);
			//Vec3.sub(d,p,t1);
			var l0=Vec3.dot(t1,vbuf); //面までの距離
			var l1=Vec3.dot(p,vbuf) - l0; //点までの距離
			var l2=Vec3.dot(t4,vbuf) - l0; //もうひとつの頂点までの距離

			if(l2*l2<=0.0000000001
			|| l1*l2<0){
				//四面体に内包されない
				flg=false;
				break;
			}
			if(ans){
				ans[i]=l1/l2;
			}
		}
		Vec3.free(1);
		return flg;
	}
	static lineWeight=function(ans,p0,t0,t1){
		//p0がt1t2各頂点にどれくらい近いか

		var axis= new Vec3();
		Vec3.sub(axis,t0,t1);

		if(axis[0] ===0 && axis[1] === 0){
			ans[0]=1;
			ans[1]=0;
			return;
		}

		var a  = Vec3.dot(axis,t0);
		var b  = Vec3.dot(axis,p0);
		var c  = Vec3.dot(axis,t1);

		ans[0]= (b-a)/(c-a);
		ans[1]= 1-ans[0];
		
	}
	static triangleWeight=function(ans,p0,t0,t1,t2){
		//p0がt1t2t3各頂点にどれくらい近いか
		var t=[t0,t1,t2,t0,t1];
		var axis= new Vec3();
		var axis2= new Vec3();
		Vec3.setValue(ans,1,0,0);
		for(var i=0;i<3;i++){
			Vec3.sub(axis,t[i+1],t[i+2]);
			if(axis[0] === 0 && axis[1] ===0 && axis[2]===0){
				//ゼロベクトルの場合
				Vec3.sub(axis,t[i],t[i+1]);
			}else{
				Vec3.cross2(axis2,t[i],t[i+1],t[i+2]);
				Vec3.cross(axis,axis,axis2);
			}

			var a  = Vec3.dot(axis,t[i+1]);
			var b  = Vec3.dot(axis,p0);
			var c  = Vec3.dot(axis,t[i]);

			if(c-a!==0){
				ans[i]= (b-a)/(c-a);
			}
		}

	}
};
var line_zero_vec3 =new Vec3();
var line_zero = function(ans,l1,l2){
	//線分と原点との最近点を求める
	var ret;
	var dir =line_zero_vec3;
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
	return ret;
}
