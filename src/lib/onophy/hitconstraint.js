import OnoPhy from "./onophy.js"
import Constraint from "./constraint.js"
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"

export default class HitConstraint extends Constraint{
	//物体の接触拘束
	constructor(){
		super();

		this.pos1ex = new Vec3(); //接触相対位置1
		this.pos2ex = new Vec3(); //接触相対位置2

		this.impulseR=new Vec3(); //回転摩擦関係
		this.rM=new Mat33();

		this.fricCoe = 0; //2物体間の摩擦係数

	}

	calcPre(){
		var obj1=this.obj1;
		var obj2=this.obj2;
		var dv=Vec3.alloc();
		var nM=Mat33.alloc();

		if(!obj1.fix){
			obj1.impFlg=1;
		}
		if(!obj2.fix){
			obj2.impFlg=1;
		}

		//法線方向と従法線方向
		//Vec3.sub(this.axis[0],this.pos2,this.pos1);
		Vec3.norm(this.axis[0]);
		this.axis[1][0] = this.axis[0][2];
		this.axis[1][1] = this.axis[0][0];
		this.axis[1][2] = -this.axis[0][1];
		this.axis[2][0] = -this.axis[0][1];
		this.axis[2][1] = this.axis[0][2];
		this.axis[2][2] = this.axis[0][0];


		Mat33.add(this.rM,obj1.getInvInertiaTensor(),obj2.getInvInertiaTensor());
		Mat33.getInv(this.rM,this.rM);

		//位置補正
		Vec3.sub(this.offset,this.pos2,this.pos1);
		Vec3.normalize(dv,this.offset);
		Vec3.madd(this.offset,this.offset,dv,-0.001); //少しだけめりこみを残す
		Vec3.mul(this.offset,this.offset,OnoPhy.ERP); //めり込み補正係数
		
		//2物体間の摩擦係数
		this.fricCoe = obj1.getFriction() * obj2.getFriction(); 

		//反発力
		this.calcDiffVelocity(dv);//速度差
		var rest = obj1.getRestitution()*obj2.getRestitution();
		if(Vec3.scalar2(dv)<0.05){
			rest=0;
		}
		Vec3.madd(this.offset,this.offset,this.axis[0]
		, Vec3.dot(dv, this.axis[0])*rest);

		//加速に必要な力を求めるための行列
		this.calcEfficM(nM);
		//垂直方向
		var coeff = Vec3.alloc();
		var coeff2 = Vec3.alloc();
		Constraint.calcEffic(coeff,nM,this.axis[0]);
		for(var i=0;i<3;i++){
			this.coeffM[i*3] =coeff[i];
		}
		//水平方向
		Constraint.calcEffic2(coeff,coeff2,nM,this.axis[1],this.axis[2]);
		for(var i=0;i<3;i++){
			this.coeffM[i*3+1] =coeff[i];
			this.coeffM[i*3+2] =coeff2[i];
		}
		Vec3.free(2);

		//次のフレームでの持続判定に使うための相対位置
		obj1.getExPos(this.pos1ex,this.pos1);
		obj2.getExPos(this.pos2ex,this.pos2);

		this.counter++;

		Vec3.free(1);
		Mat33.free(1);
	}
	calcConstraintPre(){
		//前処理
		this.calcPre();

		var impulse = Vec3.alloc();
		Vec3.setValue(impulse,0,0,0);
		Mat33.dotVec3(impulse,this.axisM,this.impulse);
		this.addImpulse(impulse);
		this.addImpulseR(this.impulseR);

		Vec3.free(1);
	}

	calcConstraint(){
		var dv = Vec3.alloc();
		var old_impulse = new Vec3();
		var add_impulse = Vec3.alloc();

		Mat33.copy(old_impulse,this.impulse);

		this.calcDiffVelocity(dv); //衝突点の速度差
		Vec3.add(dv,dv,this.offset);//反発+位置補正分
		Mat33.dotVec3(add_impulse,this.coeffM,dv); //目標に必要な撃力
		Vec3.add(this.impulse,this.impulse,add_impulse);

		//法線方向の補正
		this.impulse[0]= Math.max(this.impulse[0],0); //撃力が逆になった場合は無しにする
		this.impulse[0]*=OnoPhy.CFM; //やわらか拘束補正

		//従法線方向の補正
		var max =this.impulse[0] * this.fricCoe; //法線撃力から摩擦最大量を算出
		var maxr = max * 0.01; //法線撃力から最大転がり抵抗を算出
		if(dv[0]*dv[0]+dv[1]*dv[1]+dv[2]*dv[2]>0.0001){
			max*=0.9; //静止していない場合はちょっと減らす
		}
		
		var l =this.impulse[1]*this.impulse[1]+this.impulse[2]*this.impulse[2];
		if (l > max*max) { //摩擦力が最大量を上回る場合は最大量でセーブ
			l = max/Math.sqrt(l);
			this.impulse[1]*=l;
			this.impulse[2]*=l;
		}
		
		Vec3.sub(add_impulse,this.impulse,old_impulse);
		Mat33.dotVec3(add_impulse,this.axisM,add_impulse);

		this.addImpulse(add_impulse); //差分摩擦力を速度に反映

		//転がり抵抗
		var old = Vec3.alloc();
		Vec3.copy(old,this.impulseR);
		Vec3.sub(dv,this.obj2.rotV,this.obj1.rotV);
		Vec3.madd(dv,dv,this.axis[0],-Vec3.dot(dv,this.axis[0])); //摩擦方向の力
		Mat33.dotVec3(add_impulse,this.rM,dv);
		Vec3.add(this.impulseR,this.impulseR,add_impulse);
		Vec3.copy(add_impulse,this.impulseR);
		var l =Vec3.scalar2(add_impulse);
		if (l > maxr*maxr) { //摩擦力が最大量を上回る場合は最大量でセーブ
			Vec3.madd(this.impulseR,this.impulseR,add_impulse,maxr/Math.sqrt(l) - 1);
		}
		Vec3.mul(this.impulseR,this.impulseR,OnoPhy.CFM);
		Vec3.sub(add_impulse,this.impulseR,old);
		this.addImpulseR(add_impulse);
		
		Vec3.free(3);
	}

};
