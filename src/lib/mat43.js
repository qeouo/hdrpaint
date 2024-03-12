import {Vec2,Vec3,Vec4,Mat33,Mat44} from "./vector.js"
var buf = new Float32Array(12);
export default class Mat43{
	//|0 3 6 9 |
	//|1 4 7 10|
	//|2 5 8 11|
	constructor(){
		var o = new Float32Array(12);
		Mat43.setInit(o);
		return o;
	}


	static setInit(mat){
		mat[0]=1.0;
		mat[1]=0.0;
		mat[2]=0.0;
		mat[3]=0.0;
		mat[4]=1.0;
		mat[5]=0.0;
		mat[6]=0.0;
		mat[7]=0.0;
		mat[8]=1.0;
		mat[9]=0.0;
		mat[10]=0.0;
		mat[11]=0.0;
	}

	static setValue(obj,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11){
		obj[0]=a0;
		obj[1]=a1;
		obj[2]=a2;
		obj[3]=a3;
		obj[4]=a4;
		obj[5]=a5;
		obj[6]=a6;
		obj[7]=a7;
		obj[8]=a8;
		obj[9]=a9;
		obj[10]=a10;
		obj[11]=a11;
	}
	static copy(a,b){
		a[0]=b[0];
		a[1]=b[1];
		a[2]=b[2];
		a[3]=b[3];
		a[4]=b[4];
		a[5]=b[5];
		a[6]=b[6];
		a[7]=b[7];
		a[8]=b[8];
		a[9]=b[9];
		a[10]=b[10];
		a[11]=b[11];
	}
	static copyMat44(a,b){
		a[0]=b[0];
		a[1]=b[1];
		a[2]=b[2];
		a[3]=b[4];
		a[4]=b[5];
		a[5]=b[6];
		a[6]=b[8];
		a[7]=b[9];
		a[8]=b[10];
		a[9]=b[12];
		a[10]=b[13];
		a[11]=b[14];
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
	}

	static dotVec3 = function(a,b,c){
		var buf0 = c[0];
		var buf1 = c[1];
		var buf2 = c[2];
		a[0] = b[0]*buf0 + b[3]*buf1 + b[6]*buf2 +b[9];
		a[1] = b[1]*buf0 + b[4]*buf1 + b[7]*buf2 +b[10];
		a[2] = b[2]*buf0 + b[5]*buf1 + b[8]*buf2 +b[11];
	}
	static dotMat33Vec3 = function(a,b,c){
		var buf0 = c[0];
		var buf1 = c[1];
		var buf2 = c[2];
		a[0] = b[0]*buf0 + b[3]*buf1 + b[6]*buf2;
		a[1] = b[1]*buf0 + b[4]*buf1 + b[7]*buf2;
		a[2] = b[2]*buf0 + b[5]*buf1 + b[8]*buf2;
	}
	static dotVec4(a,b,c){
		var buf0 = c[0];
		var buf1 = c[1];
		var buf2 = c[2];
		var buf3 = c[3];
		a[0] = b[0]*buf0 + b[3]*buf1 + b[6]*buf2 +b[9]*buf3;
		a[1] = b[1]*buf0 + b[4]*buf1 + b[7]*buf2 +b[10]*buf3;
		a[2] = b[2]*buf0 + b[5]*buf1 + b[8]*buf2 +b[11]*buf3;
		a[3] = buf3;
	}
	static dot(a,b,c){

		buf[0]=b[0]*c[0] + b[3]*c[1] + b[6]*c[2];
		buf[1]=b[1]*c[0] + b[4]*c[1] + b[7]*c[2];
		buf[2]=b[2]*c[0] + b[5]*c[1] + b[8]*c[2];

		buf[3]=b[0]*c[3] + b[3]*c[4] + b[6]*c[5];
		buf[4]=b[1]*c[3] + b[4]*c[4] + b[7]*c[5];
		buf[5]=b[2]*c[3] + b[5]*c[4] + b[8]*c[5];

		buf[6]=b[0]*c[6] + b[3]*c[7] + b[6]*c[8];
		buf[7]=b[1]*c[6] + b[4]*c[7] + b[7]*c[8];
		buf[8]=b[2]*c[6] + b[5]*c[7] + b[8]*c[8];

		buf[9]=b[0]*c[9] + b[3]*c[10] + b[6]*c[11] + b[9];
		buf[10]=b[1]*c[9] + b[4]*c[10] + b[7]*c[11] + b[10];
		buf[11]=b[2]*c[9] + b[5]*c[10] + b[8]*c[11] + b[11];
		
		a.set(buf);
		//if(a == b){
		//	var buf0 = b[0];
		//	var buf1 = b[1];
		//	var buf2 = b[2];
		//	var buf3 = b[3];
		//	var buf4 = b[4];
		//	var buf5 = b[5];
		//	var buf6 = b[6];
		//	var buf7 = b[7];
		//	var buf8 = b[8];
		//	var buf9 = b[9];
		//	var buf10 = b[10];
		//	var buf11 = b[11];

		//	a[0]=buf0*c[0] + buf3*c[1] + buf6*c[2];
		//	a[1]=buf1*c[0] + buf4*c[1] + buf7*c[2];
		//	a[2]=buf2*c[0] + buf5*c[1] + buf8*c[2];

		//	a[3]=buf0*c[3] + buf3*c[4] + buf6*c[5];
		//	a[4]=buf1*c[3] + buf4*c[4] + buf7*c[5];
		//	a[5]=buf2*c[3] + buf5*c[4] + buf8*c[5];

		//	a[6]=buf0*c[6] + buf3*c[7] + buf6*c[8];
		//	a[7]=buf1*c[6] + buf4*c[7] + buf7*c[8];
		//	a[8]=buf2*c[6] + buf5*c[7] + buf8*c[8];

		//	a[9]=buf0*c[9] + buf3*c[10] + buf6*c[11] + buf9;
		//	a[10]=buf1*c[9] + buf4*c[10] + buf7*c[11] + buf10;
		//	a[11]=buf2*c[9] + buf5*c[10] + buf8*c[11] + buf11;
		//}else{
		//	var buf0 = c[0];
		//	var buf1 = c[1];
		//	var buf2 = c[2];
		//	var buf3 = c[3];
		//	var buf4 = c[4];
		//	var buf5 = c[5];
		//	var buf6 = c[6];
		//	var buf7 = c[7];
		//	var buf8 = c[8];
		//	var buf9 = c[9];
		//	var buf10 = c[10];
		//	var buf11 = c[11];

		//	a[0]=b[0]*buf0 + b[3]*buf1 + b[6]*buf2;
		//	a[1]=b[1]*buf0 + b[4]*buf1 + b[7]*buf2;
		//	a[2]=b[2]*buf0 + b[5]*buf1 + b[8]*buf2;

		//	a[3]=b[0]*buf3 + b[3]*buf4 + b[6]*buf5;
		//	a[4]=b[1]*buf3 + b[4]*buf4 + b[7]*buf5;
		//	a[5]=b[2]*buf3 + b[5]*buf4 + b[8]*buf5;

		//	a[6]=b[0]*buf6 + b[3]*buf7 + b[6]*buf8;
		//	a[7]=b[1]*buf6 + b[4]*buf7 + b[7]*buf8;
		//	a[8]=b[2]*buf6 + b[5]*buf7 + b[8]*buf8;

		//	a[9]=b[0]*buf9 + b[3]*buf10 + b[6]*buf11 + b[9];
		//	a[10]=b[1]*buf9 + b[4]*buf10 + b[7]*buf11 + b[10];
		//	a[11]=b[2]*buf9 + b[5]*buf10 + b[8]*buf11 + b[11];
		//}
	}

	static dotMat44Mat43(a,b,c){
		var buf0=b[0]*c[0]+ b[4]*c[1]+ b[8]*c[2];
		var buf1=b[1]*c[0]+ b[5]*c[1]+ b[9]*c[2];
		var buf2=b[2]*c[0]+ b[6]*c[1]+ b[10]*c[2];

		var buf3=b[0]*c[3]+ b[4]*c[4]+ b[8]*c[5];
		var buf4=b[1]*c[3]+ b[5]*c[4]+ b[9]*c[5];
		var buf5=b[2]*c[3]+ b[6]*c[4]+ b[10]*c[5];

		var buf6=b[0]*c[6]+ b[4]*c[7]+ b[8]*c[8];
		var buf7=b[1]*c[6]+ b[5]*c[7]+ b[9]*c[8];
		var buf8=b[2]*c[6]+ b[6]*c[7]+ b[10]*c[8];

		var buf9=b[0]*c[9]+ b[4]*c[10]+ b[8]*c[11]+ b[12];
		var buf10=b[1]*c[9]+ b[5]*c[10]+ b[9]*c[11]+ b[13];
		var buf11=b[2]*c[9]+ b[6]*c[10]+ b[10]*c[11]+ b[14];
		
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
	}
	static fromRotVector(ret,r,x,y,z){
		var SIN=Math.sin(r)
		var COS=Math.cos(r)
		ret[0]=x*x*(1-COS)+COS;ret[3]=x*y*(1-COS)-z*SIN;ret[6]=z*x*(1-COS)+y*SIN;
		ret[1]=x*y*(1-COS)+z*SIN;ret[4]=y*y*(1-COS)+COS;ret[7]=y*z*(1-COS)-x*SIN;
		ret[2]=z*x*(1-COS)-y*SIN;ret[5]=y*z*(1-COS)+x*SIN;ret[8]=z*z*(1-COS)+COS;
		ret[9]=ret[10]=ret[11]=0.0;
	}
	static getRotVector(target,angle){
		var bM = this.alloc();
		var dx=angle[0];
		var dy=angle[1];
		var dz=angle[2];
		var ax=Math.atan2(dy,dz)+Math.PI;
		var ay=Math.atan2(dx,dz);
		var az=0;
		this.fromRotVector(target,-az,0,0,1);
		this.fromRotVector(bM,-ax,1,0,0);
		this.dot(target,target,bM);
		this.fromRotVector(bM,-ay,0,1,0);
		this.dot(target,target,bM);

		this.free(1);
	}

	static determinant(b){
		return b[0]*b[4]*b[8]
			+b[3]*b[7]*b[2]
			+b[6]*b[1]*b[5]
			-b[0]*b[7]*b[5]
			-b[3]*b[1]*b[8]
			-b[6]*b[4]*b[2];
	};
	static getInv(a,b){
		var det =
			 b[0]*b[4]*b[8]
			+b[3]*b[7]*b[2]
			+b[6]*b[1]*b[5]
			-b[0]*b[7]*b[5]
			-b[3]*b[1]*b[8]
			-b[6]*b[4]*b[2];

		if(Math.abs(det) === 0){
			return
		}
		det = 1/det;

		var buf0=b[0];
		var buf1=b[1];
		var buf2=b[2];
		var buf3=b[3];
		var buf4=b[4];
		var buf5=b[5];
		var buf6=b[6];
		var buf7=b[7];
		var buf8=b[8];
		var buf9=b[9];
		var buf10=b[10];
		var buf11=b[11];

		a[0]= (buf4*buf8 - buf7*buf5) * det;
		a[1]= (buf2*buf7 - buf1*buf8) * det;
		a[2]= (buf1*buf5 - buf4*buf2) * det;
		a[3]= (buf6*buf5 - buf3*buf8) * det;
		a[4]= (buf0*buf8 - buf6*buf2) * det;
		a[5]= (buf3*buf2 - buf0*buf5) * det;
		a[6]= (buf3*buf7 - buf4*buf6) * det;
		a[7]= (buf6*buf1 - buf0*buf7) * det;
		a[8]= (buf0*buf4 - buf3*buf1) * det;
		a[9]= (buf3*buf10*buf8 + buf6*buf4*buf11 + buf9*buf7*buf5 - buf3*buf7*buf11 - buf6*buf10*buf5 - buf9*buf4*buf8) * det;
		a[10]= (buf0*buf7*buf11 + buf6*buf10*buf2 + buf9*buf1*buf8 - buf0*buf10*buf8 - buf6*buf1*buf11 - buf9*buf7*buf2) * det;
		a[11]= (buf0*buf10*buf5 + buf3*buf1*buf11 + buf9*buf4*buf2 - buf0*buf4*buf11 - buf3*buf10*buf2 - buf9*buf1*buf5) * det;

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
		a[9] = a[10] = a[11] = 0.0;
	}

	//eulerAngleから行列を作る (XZY)
	static fromEuler(m,e){
		var buf = Mat43.alloc();
		this.fromRotVector(m,e[0],1,0,0);
		this.fromRotVector(buf,e[2],0,0,1);
		this.dot(m,buf,m);
		this.fromRotVector(buf,e[1],0,1,0);
		this.dot(m,buf,m);

		Mat43.free(1);

	}

	//location,scale,eulerAnlge から行列を作る
	static fromLSE(m,l,s,e){
		Mat43.fromEuler(m,e);
		m[0]*=s[0];
		m[1]*=s[0];
		m[2]*=s[0];
		m[3]*=s[1];
		m[4]*=s[1];
		m[5]*=s[1];
		m[6]*=s[2];
		m[7]*=s[2];
		m[8]*=s[2];
		m[9] =l[0];
		m[10]=l[1];
		m[11]=l[2];
	}

	//location,scale,quartanionから行列を作る
	static fromLSR(m,l,s,r){
		Mat43.fromQuat(m,r);
		m[0]*=s[0];
		m[1]*=s[0];
		m[2]*=s[0];
		m[3]*=s[1];
		m[4]*=s[1];
		m[5]*=s[1];
		m[6]*=s[2];
		m[7]*=s[2];
		m[8]*=s[2];
		m[9]=l[0];
		m[10]=l[1];
		m[11]=l[2];
	}
	//行列をlocation,scale,quartanionに分ける
	static toLSR(l,s,r,m){
		Vec3.setValue(l,m[9],m[10],m[11]);
		Vec3.setValue(s
				,Math.sqrt(m[0]*m[0]+m[1]*m[1]+m[2]*m[2])
				,Math.sqrt(m[3]*m[3]+m[4]*m[4]+m[5]*m[5])
				,Math.sqrt(m[6]*m[6]+m[7]*m[7]+m[8]*m[8]))
		var invx=1/s[0];
		var invy=1/s[1];
		var invz=1/s[2];

		var m33= new Mat33();
		m33[0]=m[0]*invx;
		m33[1]=m[1]*invx;
		m33[2]=m[2]*invx;
		m33[3]=m[3]*invy;
		m33[4]=m[4]*invy;
		m33[5]=m[5]*invy;
		m33[6]=m[6]*invz;
		m33[7]=m[7]*invz;
		m33[8]=m[8]*invz;
		Mat33.getRotQuat(r,m33);
	}
	static toLSE(l,s,e,m){
		Vec3.setValue(l,m[9],m[10],m[11]);
		Vec3.setValue(s
				,Math.sqrt(m[0]*m[0]+m[1]*m[1]+m[2]*m[2])
				,Math.sqrt(m[3]*m[3]+m[4]*m[4]+m[5]*m[5])
				,Math.sqrt(m[6]*m[6]+m[7]*m[7]+m[8]*m[8]))
		var invx=1/s[0];
		var invy=1/s[1];
		var invz=1/s[2];

		var m33= new Mat33();
		m33[0]=m[0]*invx;
		m33[1]=m[1]*invx;
		m33[2]=m[2]*invx;
		m33[3]=m[3]*invy;
		m33[4]=m[4]*invy;
		m33[5]=m[5]*invy;
		m33[6]=m[6]*invz;
		m33[7]=m[7]*invz;
		m33[8]=m[8]*invz;
		Mat33.getEuler(e,m33);
	}

	static toMat44csv(m){
		return m[0] + "," +  m[1] + "," +  m[2] + ",0"   
		+"," + m[3] + "," +  m[4] + "," +  m[5]  +",0"
		+"," + m[6] + "," +  m[7] + "," +  m[8]  +",0"
		+"," + m[9] + "," +  m[10] + "," +  m[11]  +",1";
	}
}
