
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
export default class Constraint{
	//拘束クラス
	constructor(){
		this.obj1 = null; //接触物体1
		this.obj2 = null; //接触物体2
		this.pos1= new Vec3(); //接触位置1
		this.pos2 = new Vec3(); //接触位置2

		this.impulse=new Vec3(); //衝撃
		this.axisM = new Mat33();
		this.axis = []; //接触法線と従法線
		this.axis[0]=new Float32Array(this.axisM.buffer,0,3);
		this.axis[1]=new Float32Array(this.axisM.buffer,4*3,3);
		this.axis[2]=new Float32Array(this.axisM.buffer,4*6,3);

		this.coeffM=new Mat33(); // impulse = coeffM x a

		this.offset=new Vec3(); //めり込み位置補正用
	}

	calcConstraintPre(){}
	calcConstraint(){}

	calcDiffVelocity(dv){
		//二点間の速度差を求める
		var calcBuf = Vec3.alloc();
		this.obj1.calcVelocity(dv,this.pos1);
		this.obj2.calcVelocity(calcBuf,this.pos2);
		Vec3.sub(dv,calcBuf,dv);
		Vec3.free(1);
	}

	addImpulse(impulse){
		//二点に直線の力を加える
		var mem = Vec3.alloc();
		this.obj1.addImpulse(this.pos1,impulse);
		Vec3.mul(mem,impulse,-1);
		this.obj2.addImpulse(this.pos2,mem);
		Vec3.free(1);
	}
	addImpulse2(impulse){
		//二点に直線の力を加える
		var mem = Vec3.alloc();
		this.obj1.addImpulse2(this.pos1,impulse);
		Vec3.mul(mem,impulse,-1);
		this.obj2.addImpulse2(this.pos2,mem);
		Vec3.free(1);
	}
	addImpulseR(impulse){
		//二点に回転の力を加える
		var mem = Vec3.alloc();
		this.obj1.addImpulseR(impulse);
		Vec3.mul(mem,impulse,-1);
		this.obj2.addImpulseR(mem);
		Vec3.free(1);
	}

	static calcEffic(v,m,X){
		// 制限1軸の場合の係数行列を求める
		// F=(vX/((MX)X)X
		Mat33.dotVec3(v,m,X);
		Vec3.mul(v,X,1/Vec3.dot(v,X));
	}
		
	static calcEffic2(v1,v2,m,X,Y){
		// 制限2軸の場合の係数行列を求める
		//F = ((vX*MYY-vYMYX)X - (vxMXY-vYMXX)Y) / (MXX*MYY - MXY*MYX) 
		Mat33.dotVec3(v1,m,X);
		var mxx=Vec3.dot(v1,X);
		var mxy=Vec3.dot(v1,Y);
		Mat33.dotVec3(v1,m,Y);
		var myx=Vec3.dot(v1,X);
		var myy=Vec3.dot(v1,Y);

		var denom = 1/ (mxx*myy  - mxy*myx);
		v1[0]=(myy*X[0] - myx*Y[0])  *denom;
		v1[1]=(myy*X[1] - myx*Y[1])  *denom;
		v1[2]=(myy*X[2] - myx*Y[2])  *denom;
		v2[0]=(- mxy*X[0] + mxx*Y[0])  *denom;
		v2[1]=(- mxy*X[1] + mxx*Y[1])  *denom;
		v2[2]=(- mxy*X[2] + mxx*Y[2])  *denom;
	}
	static calcEffic3(v1,v2,v3,m,X,Y,Z){
		// 制限3軸の場合の係数行列を求める
		//F = M^-1 v
		Mat33.getInv(m,m);
		Mat33.calcTranspose(m,m);
		Mat33.dotVec3(v1,m,X);
		Mat33.dotVec3(v2,m,Y);
		Mat33.dotVec3(v3,m,Z);
	}
	calcEfficM(m){
		//接触点に力を加えたときどれだけ加速するかを計算するための行列を求める
		var mat1 = Mat33.alloc();
		this.obj1.calcEfficM(mat1,this.pos1);
		this.obj2.calcEfficM(m,this.pos2);
		Mat33.add(m,m,mat1);
		Mat33.free(1);
	}

}
