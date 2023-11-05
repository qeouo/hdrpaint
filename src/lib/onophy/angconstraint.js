import OnoPhy from "./onophy.js"
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import LinConstraint from "./linconstraint.js"
var vec=new Vec3();
var m = new Mat33();
var impulse = new Vec3();
export default class AngConstraint  extends LinConstraint{
	//回転速度拘束
	constructor(){
		super();
	}

	calcPre(){
		Mat33.add(m,this.obj1.inv_inertiaTensor,this.obj2.inv_inertiaTensor);

		this.calcCoeffM(m);
		return;
	};

	calcConstraintPre(){
		this.calcPre();

		var impulse = Vec3.alloc();
		Mat33.dotVec3(impulse,this.axisM,this.impulse);
		this.addImpulseR(impulse);
		Vec3.free(1);
	}
	calcConstraint(){
		var old = Vec3.alloc();
		var imp= Vec3.alloc();
		Vec3.copy(old,this.impulse);
		Vec3.sub(imp,this.obj2.rotV,this.obj1.rotV); //回転速度差
		Vec3.add(imp,imp,this.offset); //補正
		Mat33.dotVec3(imp,this.coeffM,imp);
		Vec3.add(this.impulse,this.impulse,imp);
		Vec3.mul(this.impulse,this.impulse,OnoPhy.CFM);

		for(var i=0;i<OnoPhy.DIMENSION;i++){
			//与える力の制限
			var a =this.impulse[i];
			if(this.motorMax!==0 && i===0){
				//モーター最大力積を超えないようにする
				if(a > this.motorMax){
					this.impulse[i]=this.motorMax;
				}
				if(a < -this.motorMax){
					this.impulse[i]=-this.motorMax;
				}
			}else{
				//逆方向の力は加えない
				if(a< 0){
					this.impulse[i]=0;
				}
			}
			
		}
		Vec3.sub(imp,this.impulse,old);
		Mat33.dotVec3(imp,this.axisM,imp);
		this.addImpulseR(imp);
		
		Vec3.free(2);
	}
};
