"use strict"

import pooling from "./pool.js"
import _Mat43 from "./mat43.js"
import _Mat22 from "./mat22.js"
import _Vec3 from "./vec3.js"
var Mat43 = _Mat43;
var Vec3 = _Vec3;
var Mat22= _Mat22 ;

var Vec2=(function(){
	var Vec2=function(){
		var vec2 = new Float32Array(2);
		vec2[0]=0.0
		vec2[1]=0.0
		return vec2;
	}
	var ret=Vec2;

	ret.copy=function(a,b){
		a[0]=b[0];
		a[1]=b[1];
	}

	ret.scalar=function(a){
		return Math.sqrt(a[0]*a[0] + a[1]*a[1]);
	}
	ret.scalar2=function(a){
		return a[0]*a[0] + a[1]*a[1];
	}
	ret.setValues=function(a,x,y){
		a[0]=x
		a[1]=y
	}
	ret.add=function(a,b,c){
		a[0] = b[0] + c[0]
		a[1] = b[1] + c[1]
	}
	ret.sub=function(a,b,c){
		a[0] = b[0] - c[0]
		a[1] = b[1] - c[1]
	}
	ret.mul=function(a,b,c){
		a[0]=b[0]*c
		a[1]=b[1]*c
	}
	ret.mad=function(a,b,c,d){
		a[0]=b[0]+c[0]*d;
		a[1]=b[1]+c[1]*d;
	}
	ret.len = function(a,b){
		return Math.sqrt((a[0]-b[0])*(a[0]-b[0]) + (a[1]-b[1])*(a[1]-b[1]));
	}
	ret.len2 = function(a,b){
		return (a[0]-b[0])*(a[0]-b[0]) + (a[1]-b[1])*(a[1]-b[1]);
	}
	ret.normalize=function(a,b){
		var l = Math.sqrt(b[0]*b[0] + b[1]*b[1])
		
		l= 1/l
		if(!isFinite(l))return
		
		a[0] *=l
		a[1] *=l
	}
	ret.norm=function(a){
		var l = Math.sqrt(a[0]*a[0] + a[1]*a[1])
		
		l= 1/l
		if(!isFinite(l))return
		
		a[0] *=l
		a[1] *=l
	}
	ret.dot=function(a,b){
		return a[0]*b[0] + a[1]*b[1]
	}
	ret.cross=function(a,b){
		return a[0]*b[1] - a[1]*b[0]
	}
	return ret
})()


var Vec4=(function(){
	var buf0,buf1,buf2,buf3
	var x2,y2,z2,xy,yz,zx,xw,yw,zw
	var qr,ss,flag,sp,ph,pt,t1,t0
	var Vec4 = function(){
		var o = new Float32Array(4);
		o[0]=0;
		o[1]=0;
		o[2]=0;
		o[3]=0;
		return o;
		//this[0]=0.0
		//this[1]=0.0
		//this[2]=0.0
		//this[3]=1.0
	}
	var ret=Vec4;

	ret.setValues=function(a,x,y,z,w){
		a[0]=x;
		a[1]=y;
		a[2]=z;
		a[3]=w;
	}
	ret.copy = function(a,b){
		a[0]=b[0];
		a[1]=b[1];
		a[2]=b[2];
		a[3]=b[3];
	}
	ret.add=function(a,b,c){
		a[0] = b[0] + c[0]
		a[1] = b[1] + c[1]
		a[2] = b[2] + c[2]
		a[3] = b[3] + c[3]
	}

	ret.sub=function(a,b,c){
		a[0] = b[0] - c[0]
		a[1] = b[1] - c[1]
		a[2] = b[2] - c[2]
		a[3] = b[3] - c[3]
	}
	ret.mul=function(a,b,c){
		a[0]*=c
		a[1]*=c
		a[2]*=c
		a[3]*=c
		}
	ret.qdot=function(a,b,c){
		buf0 = b[0]*c[0] - b[1]*c[1] - b[2]*c[2] - b[3]*c[3];
		buf1 = b[0]*c[1] + c[0]*b[1] + b[2]*c[3] - b[3]*c[2];
		buf2 = b[0]*c[2] + c[0]*b[2] + b[3]*c[1] - b[1]*c[3];
		buf3 = b[0]*c[3] + c[0]*b[3] + b[1]*c[2] - b[2]*c[1];
		a[0] = buf0;
		a[1] = buf1;
		a[2] = buf2;
		a[3] = buf3;
	}
	ret.qmul=function(a,b,c){
		if(b[0]==1){
			a[0]=b[0];
			a[1]=b[1];
			a[2]=b[2];
			a[3]=b[3];
			return;
		}
		var theta=Math.acos(b[0]);
		var r = Math.sin(theta*c)/Math.sin(theta);
		a[0]=Math.cos(theta*c);
		a[1]=b[1]*r;
		a[2]=b[2]*r;
		a[3]=b[3]*r;
	}
	ret.qmdot=function(a,b,c){
		buf0 = b[0]*c[0] + b[1]*c[1] + b[2]*c[2] + b[3]* c[3];
		buf1 = -b[0]*c[1] + c[0]*b[1]  -b[2]*c[3] + b[3]*c[2];
		buf2 = -b[0]*c[2] + c[0]*b[2]  -b[3]*c[1] + b[1]*c[3];
		buf3 = -b[0]*c[3] + c[0]*b[3]  -b[1]*c[2] + b[2]*c[1];
		a[0] = Math.min(1,Math.max(-1,buf0));
		a[1] = buf1;
		a[2] = buf2;
		a[3] = buf3;
	}
	ret.fromRotVector = function(v,w,x,y,z){
		var SIN = Math.sin(w*0.5);
		v[0]=Math.cos(w*0.5);;
		v[1]=SIN*x;
		v[2]=SIN*y;
		v[3]=SIN*z;
	}
	ret.toTorque= function(v,q){
		var w = Math.acos(q[0])*2;
		if(w!==0){
			w = w/Math.sin(w*0.5);
		}else{
			w = 0;
		}
		v[0]=q[1]*w;
		v[1]=q[2]*w;
		v[2]=q[3]*w;

	}
	ret.rotVec3 = function(a,b,c){
		//c = (0,x,y,z)
		buf0 =  - b[1]*c[0] - b[2]*c[1] - b[3]* c[2];
		buf1 = b[0]*c[0] + b[2]*c[2] - b[3]*c[1];
		buf2 = b[0]*c[1] + b[3]*c[0] - b[1]*c[2];
		buf3 = b[0]*c[2] + b[1]*c[1] - b[2]*c[0];

		a[0]= buf0*-b[1] + b[0]*buf1 + buf2*-b[3] - buf3*-b[2];
		a[1]= buf0*-b[2] + b[0]*buf2 + buf3*-b[1] - buf1*-b[3];
		a[2]= buf0*-b[3] + b[0]*buf3 + buf1*-b[2] - buf2*-b[1];
	}
	ret.toMat33=function(a,b){
		x2 = b[1] * b[1] * 2.0
		y2 = b[2] * b[2] * 2.0
		z2 = b[3] * b[3] * 2.0
		xy = b[1] * b[2] * 2.0
		yz = b[2] * b[3] * 2.0
		zx = b[3] * b[1] * 2.0
		xw = b[1] * b[0] * 2.0
		yw = b[2] * b[0] * 2.0
		zw = b[3] * b[0] * 2.0

		a[0] = 1.0 - y2 - z2
		a[1] = xy + zw
		a[2] = zx - yw
		a[3] = xy - zw
		a[4] = 1.0 - z2 - x2
		a[5] = yz + xw
		a[6] = zx + yw
		a[7] = yz - xw
		a[8] = 1.0 - x2 - y2
	}

	ret.toMat43 = ret.qTOm=function(a,b){
		x2 = b[1] * b[1] * 2.0;
		y2 = b[2] * b[2] * 2.0;
		z2 = b[3] * b[3] * 2.0;
		xy = b[1] * b[2] * 2.0;
		yz = b[2] * b[3] * 2.0;
		zx = b[3] * b[1] * 2.0;
		xw = b[1] * b[0] * 2.0;
		yw = b[2] * b[0] * 2.0;
		zw = b[3] * b[0] * 2.0;

		a[0] = 1.0 - y2 - z2;
		a[1] = xy + zw;
		a[2] = zx - yw;
		a[3] = xy - zw;
		a[4] = 1.0 - z2 - x2;
		a[5] = yz + xw;
		a[6] = zx + yw;
		a[7] = yz - xw;
		a[8] = 1.0 - x2 - y2;
		a[9] = a[10] = a[11] = 0.0;
	}
	//
	ret.slerp=function(a,b,c,t){
		qr = b[0]*c[0] + b[1]*c[1] + b[2]*c[2] + b[3]*c[3];
		ss = 1.0 - qr*qr;
		flag=0
		if(qr<0){
			flag=1
			qr*=-1
		}
		if (ss <= 0.0) {
			a[0] = b[0]
			a[1] = b[1]
			a[2] = b[2]
			a[3] = b[3]
		}
		else {
			sp = Math.sqrt(ss)
			ph = Math.acos(qr)
			pt = ph * t
			t1 = Math.sin(pt) / sp
			t0 = Math.sin(ph - pt) / sp
			if(flag)t1*=-1
			a[0] = b[0] * t0 + c[0] * t1
			a[1] = b[1] * t0 + c[1] * t1
			a[2] = b[2] * t0 + c[2] * t1
			a[3] = b[3] * t0 + c[3] * t1
		}
	}
	ret.fromMat44 = function(v,m){
		var m33=Mat33.alloc();
		m33[0]=m[0];
		m33[1]=m[1];
		m33[2]=m[2];
		m33[3]=m[4];
		m33[4]=m[5];
		m33[5]=m[6];
		m33[6]=m[8];
		m33[7]=m[9];
		m33[8]=m[10];
		//this.fromMat33(v,m33);
		Mat33.rotToQuat(v,m33);
		Mat33.free(1);

	}
	ret.fromMat33 = function(v,m){
		var invx = 1/Math.sqrt(m[0]*m[0]+m[1]*m[1]+m[2]*m[2]);
		var invy = 1/Math.sqrt(m[3]*m[3]+m[4]*m[4]+m[5]*m[5]);
		var invz = 1/Math.sqrt(m[6]*m[6]+m[7]*m[7]+m[8]*m[8]);

		var m33= Mat33.alloc();
		m33[0]=m[0]*invx;
		m33[1]=m[1]*invx;
		m33[2]=m[2]*invx;
		m33[3]=m[3]*invy;
		m33[4]=m[4]*invy;
		m33[5]=m[5]*invy;
		m33[6]=m[6]*invz;
		m33[7]=m[7]*invz;
		m33[8]=m[8]*invz;
		Mat33.getRotVec(v,m33);
		var r = Vec3.scalar(v);
		if(r!==0){
			Vec3.mul(v,v,1/r);
			Vec4.fromRotVector(v,r,v[0],v[1],v[2]);
		}else{
			Vec4.setValue(v,0,0,0,1);
		}

		Mat33.free(1);

	}
	return ret
})()
export class Mat33{
	constructor(){
		var o = new Float32Array(9);
		Mat33.setInit(o);
		return o;
	}
	
	
	static setInit(m){
		m[0]=1;
		m[1]=0;
		m[2]=0;
		m[3]=0;
		m[4]=1;
		m[5]=0;
		m[6]=0;
		m[7]=0;
		m[8]=1;
	}

	static #ZERO=new Mat33();
	static #buffer=new Mat33();
	static #bufferVec3=new Vec3();
	static init(){
		Mat33.#ZERO[0]=0;
		Mat33.#ZERO[4]=0;
		Mat33.#ZERO[8]=0;
	}

	static setValue(obj,a0,a1,a2,a3,a4,a5,a6,a7,a8){
		obj[0] = a0;
		obj[1] = a1;
		obj[2] = a2;
		obj[3] = a3;
		obj[4] = a4;
		obj[5] = a5;
		obj[6] = a6;
		obj[7] = a7;
		obj[8] = a8;
	};
	static copy(m,a){
		m[0]=a[0];
		m[1]=a[1];
		m[2]=a[2];
		m[3]=a[3];
		m[4]=a[4];
		m[5]=a[5];
		m[6]=a[6];
		m[7]=a[7];
		m[8]=a[8];
	}
	static add(a,b,c){
		a[0] = b[0] + c[0];
		a[1] = b[1] + c[1];
		a[2] = b[2] + c[2];
		a[3] = b[3] + c[3];
		a[4] = b[4] + c[4];
		a[5] = b[5] + c[5];
		a[6] = b[6] + c[6];
		a[7] = b[7] + c[7];
		a[8] = b[8] + c[8];
	}
	static madd(a,b,c,d){
		a[0] = b[0] + c[0]*d;
		a[1] = b[1] + c[1]*d;
		a[2] = b[2] + c[2]*d;
		a[3] = b[3] + c[3]*d;
		a[4] = b[4] + c[4]*d;
		a[5] = b[5] + c[5]*d;
		a[6] = b[6] + c[6]*d;
		a[7] = b[7] + c[7]*d;
		a[8] = b[8] + c[8]*d;
	}
	static sub(a,b,c){
		a[0] = b[0] - c[0];
		a[1] = b[1] - c[1];
		a[2] = b[2] - c[2];
		a[3] = b[3] - c[3];
		a[4] = b[4] - c[4];
		a[5] = b[5] - c[5];
		a[6] = b[6] - c[6];
		a[7] = b[7] - c[7];
		a[8] = b[8] - c[8];
	}
	static mul(a,b,c){
		a[0] = b[0] * c;
		a[1] = b[1] * c;
		a[2] = b[2] * c;
		a[3] = b[3] * c;
		a[4] = b[4] * c;
		a[5] = b[5] * c;
		a[6] = b[6] * c;
		a[7] = b[7] * c;
		a[8] = b[8] * c;
	}
	static dotVec3(ret,m,v){
		var v0=v[0];
		var v1=v[1];
		var v2=v[2];
		ret[0] = m[0]*v0 + m[3]*v1 + m[6]*v2;
		ret[1] = m[1]*v0 + m[4]*v1 + m[7]*v2;
		ret[2] = m[2]*v0 + m[5]*v1 + m[8]*v2;
		//ret.set(bufferVec3);
	}
	static dot(ret,ma,mb){
		var buffer = Mat33.#buffer;
		buffer[0] = ma[0]*mb[0] + ma[3]*mb[1] + ma[6]*mb[2];
		buffer[1] = ma[1]*mb[0] + ma[4]*mb[1] + ma[7]*mb[2];
		buffer[2] = ma[2]*mb[0] + ma[5]*mb[1] + ma[8]*mb[2];
		buffer[3] = ma[0]*mb[3] + ma[3]*mb[4] + ma[6]*mb[5];
		buffer[4] = ma[1]*mb[3] + ma[4]*mb[4] + ma[7]*mb[5];
		buffer[5] = ma[2]*mb[3] + ma[5]*mb[4] + ma[8]*mb[5];
		buffer[6] = ma[0]*mb[6] + ma[3]*mb[7] + ma[6]*mb[8];
		buffer[7] = ma[1]*mb[6] + ma[4]*mb[7] + ma[7]*mb[8];
		buffer[8] = ma[2]*mb[6] + ma[5]*mb[7] + ma[8]*mb[8];
		ret.set(buffer);
	}
	static fromRotVector(ret,r,x,y,z){
		var SIN=Math.sin(r)
		var COS=Math.cos(r)
		ret[0]=x*x*(1-COS)+COS;ret[3]=x*y*(1-COS)-z*SIN;ret[6]=z*x*(1-COS)+y*SIN;
		ret[1]=x*y*(1-COS)+z*SIN;ret[4]=y*y*(1-COS)+COS;ret[7]=y*z*(1-COS)-x*SIN;
		ret[2]=z*x*(1-COS)-y*SIN;ret[5]=y*z*(1-COS)+x*SIN;ret[8]=z*z*(1-COS)+COS;
	}

	static fromQuat(a,b){
		var x2 = b[1] * b[1] * 2.0;
		var y2 = b[2] * b[2] * 2.0;
		var z2 = b[3] * b[3] * 2.0;
		var xy = b[1] * b[2] * 2.0;
		var yz = b[2] * b[3] * 2.0;
		var zx = b[3] * b[1] * 2.0;
		var xw = b[1] * b[0] * 2.0;
		var yw = b[2] * b[0] * 2.0;
		var zw = b[3] * b[0] * 2.0;

		a[0] = 1.0 - y2 - z2;
		a[1] = xy + zw;
		a[2] = zx - yw;
		a[3] = xy - zw;
		a[4] = 1.0 - z2 - x2;
		a[5] = yz + xw;
		a[6] = zx + yw;
		a[7] = yz - xw;
		a[8] = 1.0 - x2 - y2;
	}

	static getRotVec(ret,m){
		//回転行列から回転ベクトル作成
		var COS = (m[0] + m[4] + m[8]-1)*0.5;
		if(COS*COS>=1){
			Vec3.setValue(ret,0,0,0);
			return ;
		}
		var r = Math.acos(COS);
		var SIN= Math.sin(r);
		ret[0] =(m[5]-m[7]);
		ret[1] =(m[6]-m[2]);
		ret[2] =(m[1]-m[3]);

		Vec3.mul(ret,ret,r/(SIN*2.0));
	}
	static rotToQuat(r,m){
		//回転行列からクォータニオンに変換
		r[1]=m[0]-m[4]-m[8]+1;
		r[2]=-m[0]+m[4]-m[8]+1;
		r[3]=-m[0]-m[4]+m[8]+1;
		r[0]=m[0]+m[4]+m[8]+1;
		var bigest=0;
		for(var i=1;i<4;i++){
			if(r[i]> r[bigest]){
				bigest=i;
			}
		}
		if(r[bigest]<0){
			return;
		}
		var v = Math.sqrt(r[bigest])*0.5;
		r[bigest]=v;
		var mult = 0.25/v;

		switch(bigest){
		case 1:
			r[2]= (m[1]+m[3])*mult;
			r[3]= (m[2]+m[6])*mult;
			r[0]= (m[5]-m[7])*mult;
			break;
		case 2:
			r[1]= (m[1]+m[3])*mult;
			r[3]= (m[7]+m[5])*mult;
			r[0]= (m[6]-m[2])*mult;
			break;
		case 3:
			r[1]= (m[7]+m[5])*mult;
			r[2]= (m[2]+m[6])*mult;
			r[0]= (m[1]-m[3])*mult;
			break;
		case 0:
			r[1]= (m[5]-m[7])*mult;
			r[2]= (m[6]-m[2])*mult;
			r[3]= (m[1]-m[3])*mult;
			break;
		}
		return;

	}
	static getRotQuat(ret,m){
		return Mat33.rotToQuat(ret,m);
		Mat33.getRotVec(ret,m);
		var r = Vec3.scalar(ret);
		if(!r){
			Vec4.setValue(ret,1,0,0,0);
			return;
		}
		Vec3.mul(ret,ret,1/r);

		Vec4.fromRotVector(ret,r,ret[0],ret[1],ret[2]);
	}
	static getEulerXYZ(vec,m){
		//回転行列をオイラー角に変換
		vec[1]=Math.asin(m[2]);
		if(m[2]==1 || m[2]==-1){
			vec[0]=0;
			vec[2]=Math.atan2(-m[3],[4]);
		}else{
			vec[0]=Math.atan2(m[5],m[8]);
			vec[2]=Math.atan2(m[1],m[0]);
		}
	}
	static getEuler(vec,m){
		//回転行列をオイラー角に変換 たぶんxzy
		vec[2]=Math.asin(m[1]);
		if(m[1]==1 || m[1]==-1){
			vec[0]=0;
			vec[1]=Math.atan2(m[8],[6]);
		}else{
			vec[0]=Math.atan2(-m[7],m[4]);
			vec[1]=Math.atan2(-m[2],m[0]);
		}
	}
	static getInv(ret,m){
		var d =( m[0]*m[4]*m[8] + m[3]*m[7]*m[2] + m[6]*m[1]*m[5]
			 - m[6]*m[4]*m[2] - m[3]*m[1]*m[8] - m[0]*m[7]*m[5]);
		if(!d){
			this.mul(m,m,0);
			return;
		}
		d =1.0/d;
		var m0 = (m[4]*m[8] - m[7]*m[5])*d;
		var m1 = (m[7]*m[2] - m[1]*m[8])*d;
		var m2 = (m[1]*m[5] - m[4]*m[2])*d;
		var m3 = (m[6]*m[5] - m[3]*m[8])*d;
		var m4 = (m[0]*m[8] - m[6]*m[2])*d;
		var m5 = (m[3]*m[2] - m[0]*m[5])*d;
		var m6 = (m[3]*m[7] - m[6]*m[4])*d;
		var m7 = (m[6]*m[1] - m[0]*m[7])*d;
		var m8 = (m[0]*m[4] - m[3]*m[1])*d;
		ret[0]=m0;
		ret[1]=m1;
		ret[2]=m2;
		ret[3]=m3;
		ret[4]=m4;
		ret[5]=m5;
		ret[6]=m6;
		ret[7]=m7;
		ret[8]=m8;
	}
	static calcTranspose(ret,m){
		//転置
		var buf;
		buf=m[1];
		ret[1]=m[3];
		ret[3]=buf;

		buf=m[2];
		ret[2]=m[6];
		ret[6]=buf;

		buf=m[5];
		ret[5]=m[7];
		ret[7]=buf;
	}

	static scale(mat33,x,y,z){
		mat33[0]=x;
		mat33[1]=0;
		mat33[2]=0;
		mat33[3]=0;
		mat33[4]=y;
		mat33[5]=0;
		mat33[6]=0;
		mat33[7]=0;
		mat33[8]=z;
	}
	static rotate(mat33,r,x,y,z){
		//xyz軸にr回転する行列作成
		var SIN=Math.sin(r)
		var COS=Math.cos(r)
		mat33[0]=x*x*(1-COS)+COS;mat33[3]=x*y*(1-COS)-z*SIN;mat33[6]=z*x*(1-COS)+y*SIN;
		mat33[1]=x*y*(1-COS)+z*SIN;mat33[4]=y*y*(1-COS)+COS;mat33[7]=y*z*(1-COS)-x*SIN;
		mat33[2]=z*x*(1-COS)-y*SIN;mat33[5]=y*z*(1-COS)+x*SIN;mat33[8]=z*z*(1-COS)+COS;
	}
};
Mat33.init();


var buf0,buf1,buf2,buf3,buf4,buf5,buf6,buf7,buf8
	,buf9,buf10,buf11,buf12,buf13,buf14,buf15;
var bM = new Float32Array(16);

var mat43 = new Mat43();
export class Mat44{
	constructor(){
		var m = new Float32Array(16);
		m[0]=1.0
		m[1]=0.0
		m[2]=0.0
		m[3]=0.0
		m[4]=0.0
		m[5]=1.0
		m[6]=0.0
		m[7]=0.0
		m[8]=0.0
		m[9]=0.0
		m[10]=1.0
		m[11]=0.0
		m[12]=0.0
		m[13]=0.0
		m[14]=0.0
		m[15]=1.0
		return m;
	}

	static setInit(mat){
		mat[0]=1.0
		mat[1]=0.0
		mat[2]=0.0
		mat[3]=0.0
		mat[4]=0.0
		mat[5]=1.0
		mat[6]=0.0
		mat[7]=0.0
		mat[8]=0.0
		mat[9]=0.0
		mat[10]=1.0
		mat[11]=0.0
		mat[12]=0.0
		mat[13]=0.0
		mat[14]=0.0
		mat[15]=1.0
	}

	static setValue(obj,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15){
		obj[0]=a0
		obj[1]=a1
		obj[2]=a2
		obj[3]=a3
		obj[4]=a4
		obj[5]=a5
		obj[6]=a6
		obj[7]=a7
		obj[8]=a8
		obj[9]=a9
		obj[10]=a10
		obj[11]=a11
		obj[12]=a12
		obj[13]=a13
		obj[14]=a14
		obj[15]=a15
	}
	static copy(a,b){
		a[0]=b[0]
		a[1]=b[1]
		a[2]=b[2]
		a[3]=b[3]
		a[4]=b[4]
		a[5]=b[5]
		a[6]=b[6]
		a[7]=b[7]
		a[8]=b[8]
		a[9]=b[9]
		a[10]=b[10]
		a[11]=b[11]
		a[12]=b[12]
		a[13]=b[13]
		a[14]=b[14]
		a[15]=b[15]
	}
	static copyMat43(a,b){
		a[0]=b[0]
		a[1]=b[1]
		a[2]=b[2]
		a[3]=0;
		a[4]=b[3]
		a[5]=b[4]
		a[6]=b[5]
		a[7]=0;
		a[8]=b[6]
		a[9]=b[7]
		a[10]=b[8]
		a[11]=0;
		a[12]=b[9]
		a[13]=b[10]
		a[14]=b[11]
		a[15]=1;
	}
	static mul(a,b,c){
		a[0]=b[0]*c;
		a[1]=b[1]*c;
		a[2]=b[2]*c;
		a[3]=b[3]*c;
		a[4]=b[4]*c;
		a[5]=b[5]*c;
		a[6]=b[6]*c;
		a[7]=b[7]*c;
		a[8]=b[8]*c;
		a[9]=b[9]*c;
		a[10]=b[10]*c;
		a[11]=b[11]*c;
		a[12]=b[12]*c;
		a[13]=b[13]*c;
		a[14]=b[14]*c;
		a[15]=b[15]*c;
	}

	static dotVec3(a,b,c){
		buf0 = c[0]
		buf1 = c[1]
		buf2 = c[2]
		a[0] = b[0]*buf0 + b[4]*buf1 + b[8]*buf2 +b[12];
		a[1] = b[1]*buf0 + b[5]*buf1 + b[9]*buf2 +b[13];
		a[2] = b[2]*buf0 + b[6]*buf1 + b[10]*buf2 +b[14];
	}
	static dotMat33Vec3(a,b,c){
		buf0 = c[0]
		buf1 = c[1]
		buf2 = c[2]
		a[0] = b[0]*buf0 + b[4]*buf1 + b[8]*buf2;
		a[1] = b[1]*buf0 + b[5]*buf1 + b[9]*buf2;
		a[2] = b[2]*buf0 + b[6]*buf1 + b[10]*buf2;
	}
	static dotVec4(a,b,c){
		buf0 = c[0]
		buf1 = c[1]
		buf2 = c[2]
		buf3 = c[3]
		a[0] = b[0]*buf0 + b[4]*buf1 + b[8]*buf2 +b[12]*buf3
		a[1] = b[1]*buf0 + b[5]*buf1 + b[9]*buf2 +b[13]*buf3
		a[2] = b[2]*buf0 + b[6]*buf1 + b[10]*buf2 +b[14]*buf3
		a[3] = b[3]*buf0 + b[7]*buf1 + b[11]*buf2 +b[15]*buf3
	}
	static dot(a,b,c){
			if(a == b){
				buf0 = b[0]
				buf1 = b[1]
				buf2 = b[2]
				buf3 = b[3]
				buf4 = b[4]
				buf5 = b[5]
				buf6 = b[6]
				buf7 = b[7]
				buf8 = b[8]
				buf9 = b[9]
				buf10 = b[10]
				buf11 = b[11]
				buf12 = b[12]
				buf13 = b[13]
				buf14 = b[14]
				buf15 = b[15]

				a[0]=buf0*c[0] + buf4*c[1] + buf8*c[2] + buf12*c[3]
				a[1]=buf1*c[0] + buf5*c[1] + buf9*c[2] + buf13*c[3]
				a[2]=buf2*c[0] + buf6*c[1] + buf10*c[2] + buf14*c[3]
				a[3]=buf3*c[0] + buf7*c[1] + buf11*c[2] + buf15*c[3]

				a[4]=buf0*c[4] + buf4*c[5] + buf8*c[6] + buf12*c[7]
				a[5]=buf1*c[4] + buf5*c[5] + buf9*c[6] + buf13*c[7]
				a[6]=buf2*c[4] + buf6*c[5] + buf10*c[6] + buf14*c[7]
				a[7]=buf3*c[4] + buf7*c[5] + buf11*c[6] + buf15*c[7]

				a[8]=buf0*c[8] + buf4*c[9] + buf8*c[10] + buf12*c[11]
				a[9]=buf1*c[8] + buf5*c[9] + buf9*c[10] + buf13*c[11]
				a[10]=buf2*c[8] + buf6*c[9] + buf10*c[10] + buf14*c[11]
				a[11]=buf3*c[8] + buf7*c[9] + buf11*c[10] + buf15*c[11]

				a[12]=buf0*c[12] + buf4*c[13] + buf8*c[14] + buf12*c[15]
				a[13]=buf1*c[12] + buf5*c[13] + buf9*c[14] + buf13*c[15]
				a[14]=buf2*c[12] + buf6*c[13] + buf10*c[14] + buf14*c[15]
				a[15]=buf3*c[12] + buf7*c[13] + buf11*c[14] + buf15*c[15]
			}else{
				buf0 = c[0]
				buf1 = c[1]
				buf2 = c[2]
				buf3 = c[3]
				buf4 = c[4]
				buf5 = c[5]
				buf6 = c[6]
				buf7 = c[7]
				buf8 = c[8]
				buf9 = c[9]
				buf10 = c[10]
				buf11 = c[11]
				buf12 = c[12]
				buf13 = c[13]
				buf14 = c[14]
				buf15 = c[15]

				a[0]=b[0]*buf0+ b[4]*buf1+ b[8]*buf2+ b[12]*buf3
				a[1]=b[1]*buf0+ b[5]*buf1+ b[9]*buf2+ b[13]*buf3
				a[2]=b[2]*buf0+ b[6]*buf1+ b[10]*buf2+ b[14]*buf3
				a[3]=b[3]*buf0+ b[7]*buf1+ b[11]*buf2+ b[15]*buf3

				a[4]=b[0]*buf4+ b[4]*buf5+ b[8]*buf6+ b[12]*buf7
				a[5]=b[1]*buf4+ b[5]*buf5+ b[9]*buf6+ b[13]*buf7
				a[6]=b[2]*buf4+ b[6]*buf5+ b[10]*buf6+ b[14]*buf7
				a[7]=b[3]*buf4+ b[7]*buf5+ b[11]*buf6+ b[15]*buf7

				a[8]=b[0]*buf8+ b[4]*buf9+ b[8]*buf10+ b[12]*buf11
				a[9]=b[1]*buf8+ b[5]*buf9+ b[9]*buf10+ b[13]*buf11
				a[10]=b[2]*buf8+ b[6]*buf9+ b[10]*buf10+ b[14]*buf11
				a[11]=b[3]*buf8+ b[7]*buf9+ b[11]*buf10+ b[15]*buf11

				a[12]=b[0]*buf12+ b[4]*buf13+ b[8]*buf14+ b[12]*buf15
				a[13]=b[1]*buf12+ b[5]*buf13+ b[9]*buf14+ b[13]*buf15
				a[14]=b[2]*buf12+ b[6]*buf13+ b[10]*buf14+ b[14]*buf15
				a[15]=b[3]*buf12+ b[7]*buf13+ b[11]*buf14+ b[15]*buf15
			}
	}
	static dotMat43(a,b,c){
		buf0=b[0]*c[0]+ b[4]*c[1]+ b[8]*c[2];
		buf1=b[1]*c[0]+ b[5]*c[1]+ b[9]*c[2];
		buf2=b[2]*c[0]+ b[6]*c[1]+ b[10]*c[2];
		buf3=b[3]*c[0]+ b[7]*c[1]+ b[11]*c[2];

		buf4=b[0]*c[3]+ b[4]*c[4]+ b[8]*c[5];
		buf5=b[1]*c[3]+ b[5]*c[4]+ b[9]*c[5];
		buf6=b[2]*c[3]+ b[6]*c[4]+ b[10]*c[5];
		buf7=b[3]*c[3]+ b[7]*c[4]+ b[11]*c[5];

		buf8=b[0]*c[6]+ b[4]*c[7]+ b[8]*c[8];
		buf9=b[1]*c[6]+ b[5]*c[7]+ b[9]*c[8];
		buf10=b[2]*c[6]+ b[6]*c[7]+ b[10]*c[8];
		buf11=b[3]*c[6]+ b[7]*c[7]+ b[11]*c[8];

		buf12=b[0]*c[9]+ b[4]*c[10]+ b[8]*c[11]+ b[12];
		buf13=b[1]*c[9]+ b[5]*c[10]+ b[9]*c[11]+ b[13];
		buf14=b[2]*c[9]+ b[6]*c[10]+ b[10]*c[11]+ b[14];
		buf15=b[3]*c[9]+ b[7]*c[10]+ b[11]*c[11]+ b[15];
		
		a[0]=buf0;
		a[1]=buf1;
		a[2]=buf2;
		a[3]=buf3;
		a[4]=buf4;
		a[5]=buf5;
		a[6]=buf6;
		a[7]=buf7;
		a[8]=buf8;
		a[9]=buf9;
		a[10]=buf10;
		a[11]=buf11;
		a[12]=buf12;
		a[13]=buf13;
		a[14]=buf14;
		a[15]=buf15;
	}
	//location,scale,eulerAnlge から行列を作る
	static fromLSE(m,l,s,e){
		Mat43.fromLSE(mat43,l,s,e);
		Mat44.setValue(m,mat43[0],mat43[1],mat43[2],0
			,mat43[3],mat43[4],mat43[5],0
			,mat43[6],mat43[7],mat43[8],0
			,mat43[9],mat43[10],mat43[11],1
			);
	}

	static fromLSR(m,l,s,r){
		Mat43.fromLSR(mat43,l,s,r);
		Mat44.setValue(m,mat43[0],mat43[1],mat43[2],0
			,mat43[3],mat43[4],mat43[5],0
			,mat43[6],mat43[7],mat43[8],0
			,mat43[9],mat43[10],mat43[11],1
			);
	}
	static fromRotVector = function(ret,r,x,y,z){
		var SIN=Math.sin(r)
		var COS=Math.cos(r)
		ret[0]=x*x*(1-COS)+COS;ret[4]=x*y*(1-COS)-z*SIN;ret[8]=z*x*(1-COS)+y*SIN;
		ret[1]=x*y*(1-COS)+z*SIN;ret[5]=y*y*(1-COS)+COS;ret[9]=y*z*(1-COS)-x*SIN;
		ret[2]=z*x*(1-COS)-y*SIN;ret[6]=y*z*(1-COS)+x*SIN;ret[10]=z*z*(1-COS)+COS;
		ret[3]=ret[7]=ret[11]=ret[12]=ret[13]=ret[14]=0;
		ret[15]=1;
	}
	static getRotVector(target,angle){
		Mat43.getRotVector.call(this,target,angle);
	}

	static determinant = function(a){
		return b[0]*b[5]*b[10]*b[15]+b[0]*b[9]*b[14]*b[7]+b[0]*b[13]*b[6]*b[11]
			+b[4]*b[1]*b[14]*b[11]+b[4]*b[9]*b[2]*b[15]+b[4]*b[13]*b[10]*b[3]
			+b[8]*b[1]*b[6]*b[15]+b[8]*b[5]*b[14]*b[3]+b[8]*b[13]*b[2]*b[7]
			+b[12]*b[1]*b[10]*b[7]+b[12]*b[5]*b[2]*b[11]+b[12]*b[9]*b[6]*b[3]
			-b[0]*b[5]*b[14]*b[11]-b[0]*b[9]*b[6]*b[15]-b[0]*b[13]*b[10]*b[7]
			-b[4]*b[1]*b[10]*b[15]-b[4]*b[9]*b[14]*b[3]-b[4]*b[13]*b[2]*b[11]
			-b[8]*b[1]*b[14]*b[7]-b[8]*b[5]*b[2]*b[15]-b[8]*b[13]*b[6]*b[3]
			-b[12]*b[1]*b[6]*b[11]-b[12]*b[5]*b[10]*b[3]-b[12]*b[9]*b[2]*b[7];
	}
	static getInv(a,b){
		var det =
			 b[0]*b[5]*b[10]*b[15]+b[0]*b[9]*b[14]*b[7]+b[0]*b[13]*b[6]*b[11]
			+b[4]*b[1]*b[14]*b[11]+b[4]*b[9]*b[2]*b[15]+b[4]*b[13]*b[10]*b[3]
			+b[8]*b[1]*b[6]*b[15]+b[8]*b[5]*b[14]*b[3]+b[8]*b[13]*b[2]*b[7]
			+b[12]*b[1]*b[10]*b[7]+b[12]*b[5]*b[2]*b[11]+b[12]*b[9]*b[6]*b[3]
			-b[0]*b[5]*b[14]*b[11]-b[0]*b[9]*b[6]*b[15]-b[0]*b[13]*b[10]*b[7]
			-b[4]*b[1]*b[10]*b[15]-b[4]*b[9]*b[14]*b[3]-b[4]*b[13]*b[2]*b[11]
			-b[8]*b[1]*b[14]*b[7]-b[8]*b[5]*b[2]*b[15]-b[8]*b[13]*b[6]*b[3]
			-b[12]*b[1]*b[6]*b[11]-b[12]*b[5]*b[10]*b[3]-b[12]*b[9]*b[2]*b[7]

		if(Math.abs(det) < 0.000000000001){
			return
		}
		det = 1/det;

		buf0=b[0];
		buf1=b[1];
		buf2=b[2];
		buf3=b[3];
		buf4=b[4];
		buf5=b[5];
		buf6=b[6];
		buf7=b[7];
		buf8=b[8];
		buf9=b[9];
		buf10=b[10];
		buf11=b[11];
		buf12=b[12];
		buf13=b[13];
		buf14=b[14];
		buf15=b[15];

		a[0]=(buf5*buf10*buf15+buf9*buf14*buf7+buf13*buf6*buf11-buf5*buf14*buf11-buf9*buf6*buf15-buf13*buf10*buf7)*det;
		a[4]=(buf4*buf14*buf11+buf8*buf6*buf15+buf12*buf10*buf7-buf4*buf10*buf15-buf8*buf14*buf7-buf12*buf6*buf11)*det;
		a[8]=(buf4*buf9*buf15+buf8*buf13*buf7+buf12*buf5*buf11-buf4*buf13*buf11-buf8*buf5*buf15-buf12*buf9*buf7)*det;
		a[12]=(buf4*buf13*buf10+buf8*buf5*buf14+buf12*buf9*buf6-buf4*buf9*buf14-buf8*buf13*buf6-buf12*buf5*buf10)*det;
		a[1]=(buf1*buf14*buf11+buf9*buf2*buf15+buf13*buf10*buf3-buf1*buf10*buf15-buf9*buf14*buf3-buf13*buf2*buf11)*det;
		a[5]=(buf0*buf10*buf15+buf8*buf14*buf3+buf12*buf2*buf11-buf0*buf14*buf11-buf8*buf2*buf15-buf12*buf10*buf3)*det;
		a[9]=(buf0*buf13*buf11+buf8*buf1*buf15+buf12*buf9*buf3-buf0*buf9*buf15-buf8*buf13*buf3-buf12*buf1*buf11)*det;
		a[13]=(buf0*buf9*buf14+buf8*buf13*buf2+buf12*buf1*buf10-buf0*buf13*buf10-buf8*buf1*buf14-buf12*buf9*buf2)*det;
		a[2]=(buf1*buf6*buf15+buf5*buf14*buf3+buf13*buf2*buf7-buf1*buf14*buf7-buf5*buf2*buf15-buf13*buf6*buf3)*det;
		a[6]=(buf0*buf14*buf7+buf4*buf2*buf15+buf12*buf6*buf3-buf0*buf6*buf15-buf4*buf14*buf3-buf12*buf2*buf7)*det;
		a[10]=(buf0*buf5*buf15+buf4*buf13*buf3+buf12*buf1*buf7-buf0*buf13*buf7-buf4*buf1*buf15-buf12*buf5*buf3)*det;
		a[14]=(buf0*buf13*buf6+buf4*buf1*buf14+buf12*buf5*buf2-buf0*buf5*buf14-buf4*buf13*buf2-buf12*buf1*buf6)*det;
		a[3]=(buf1*buf10*buf7+buf5*buf2*buf11+buf9*buf6*buf3-buf1*buf6*buf11-buf5*buf10*buf3-buf9*buf2*buf7)*det;
		a[7]=(buf0*buf6*buf11+buf4*buf10*buf3+buf8*buf2*buf7-buf0*buf10*buf7-buf4*buf2*buf11-buf8*buf6*buf3)*det;
		a[11]=(buf0*buf9*buf7+buf4*buf1*buf11+buf8*buf5*buf3-buf0*buf5*buf11-buf4*buf9*buf3-buf8*buf1*buf7)*det;
		a[15]=(buf0*buf5*buf10+buf4*buf9*buf2+buf8*buf1*buf6-buf0*buf9*buf6-buf4*buf1*buf10-buf8*buf5*buf2)*det;

	} 

};

(function(){
	//プール
	var classes=[Vec2,Vec3,Vec4,Mat33,Mat43,Mat44];

	for(var i=0;i<classes.length;i++){
		var ret = classes[i];
		pooling(ret);
	}
})();

export var Vec2,Vec3,Vec4,Mat43,Mat22;
