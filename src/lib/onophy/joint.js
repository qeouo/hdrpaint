import OnoPhy from "./onophy.js"
import LinConstraint from "./linconstraint.js"
import AngConstraint from "./angconstraint.js"

import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
export default class Joint{
	constructor(){
		this.use_breaking=0;
		this.breaking_threshold=0.0; //これ以上力が加わるとジョイントがなくなる(未実装)
		this.disable_collisions=false; //ジョイントされたオブジェクト同士の衝突可否
		this.enabled= false; //有効無効
		this.object1=null; //被ジョイントオブジェクト
		this.object2=null;
		this.matrix = new Mat43(); //ジョイントとオブジェクトとのオフセット行列
		this.matrix2 = new Mat43();

		//位置制限
		this.use_limit_lin=new Vec3();
		this.limit_lin_lower=new Vec3(); 
		this.limit_lin_upper=new Vec3();
		this.use_spring=new Vec3();
		this.spring_damping=new Vec3(); //バネダンパ
		this.spring_stiffness=new Vec3(); //バネ力
		this.use_motor_lin=0;
		this.motor_lin_max_impulse=1; //直線モーター力上限
		this.motor_lin_target_velocity=1; //モーター速度
		//角度制限
		this.use_limit_ang=new Vec3();
		this.limit_ang_lower=new Vec3(); //角度制限
		this.limit_ang_upper=new Vec3();
		this.use_spring_ang=new Vec3();
		this.spring_damping_ang=new Vec3();//角度バネダンパ
		this.spring_stiffness_ang=new Vec3();　
		this.use_motor_ang=0;
		this.motor_ang_max_impulse=1; //角度モーター力上限
		this.motor_ang_target_velocity=1; //モーター角速度

		//拘束オブジェクト
		this.linConstraint = new LinConstraint();
		this.angConstraint = new AngConstraint();
	}

	setConstraint(){

		var vec= Vec3.alloc();
		var dp = Vec3.alloc();
		var dv = Vec3.alloc();
		var trueq= Vec4.alloc();
		var quat = Vec4.alloc();
		var rotmat= Mat33.alloc();
		var bM = Mat43.alloc();
		var bM2 = Mat43.alloc();

		var axis;
		var object1= this.object1;
		var object2= this.object2;

		//ジョイント位置
		Mat43.dot(bM,this.object1.matrix,this.matrix);
		Mat43.dot(bM2,this.object2.matrix,this.matrix2);

		Vec3.setValue(this.linConstraint.pos1,bM[9],bM[10],bM[11]);
		Vec3.setValue(this.linConstraint.pos2,bM2[9],bM2[10],bM2[11]);

		//ジョイント角度
		for(var i=0;i<3;i++){
			var j=i*3;
			var l = 1/Math.sqrt(bM[j]*bM[j]+bM[j+1]*bM[j+1]+bM[j+2]*bM[j+2]);
			bM[i*3]=bM[j]*l;
			bM[i*3+1]=bM[j+1]*l;
			bM[i*3+2]=bM[j+2]*l;
			l = 1/Math.sqrt(bM2[j]*bM2[j]+bM2[j+1]*bM2[j+1]+bM2[j+2]*bM2[j+2]);
			bM2[i*3]=bM2[j]*l;
			bM2[i*3+1]=bM2[j+1]*l;
			bM2[i*3+2]=bM2[j+2]*l;
		}
		if(this.parent===this.object1){
			//Mat33.copy(rotmat,bM);
			//Mat33.copy(bM,bM2);
			//Mat33.copy(bM2,rotmat);
		}else{
			Vec4.toMat33(obj1m,bM2);
			Mat33.copy(obj2m,bM);
		}

		this.linConstraint.obj1=object1;
		this.linConstraint.obj2=object2;
		this.angConstraint.obj1=object1;
		this.angConstraint.obj2=object2;

		//差
		Vec3.sub(dp,this.linConstraint.pos2,this.linConstraint.pos1); //位置差
		this.linConstraint.calcDiffVelocity(dv);//速度差

		//位置制限
		Vec3.setValue(this.linConstraint.offset,0,0,0);
		for(var i=0;i<OnoPhy.DIMENSION;i++){
			//軸
			axis = this.linConstraint.axis[i];
			Vec3.setValue(axis,bM[i*3]
				,bM[i*3+1]
				,bM[i*3+2]);
			//ばね
			if(this.use_spring[i]){
				Vec3.mul(vec,axis,DT*Vec3.dot(axis,dp)*this.spring_stiffness[i]);
				Vec3.madd(vec,vec,axis,DT*Vec3.dot(axis,dv)*this.spring_damping[i]);
				this.linConstraint.addImpulse2(vec);
			}

			if(this.use_limit_lin[i]){
				//位置差
				var l = Vec3.dot(axis,dp);
				//制限範囲を超えている場合
				if(l< this.limit_lin_lower[i]){
					l= this.limit_lin_lower[i] - l;
					Vec3.mul(axis,axis,-1);
				}else if(l> this.limit_lin_upper[i]){
					l= l - this.limit_lin_upper[i];
				}else{
					Vec3.mul(axis,axis,0);
				}
				if(this.limit_lin_lower[i]==this.limit_lin_upper[i]){
					//両制限の場合フラグを立てる
					this.linConstraint.lim[i]=1;
				}else{
					this.linConstraint.lim[i]=0;
				}
				Vec3.madd(this.linConstraint.offset
					,this.linConstraint.offset,axis,l);//本来の位置
			}else{
				Vec3.mul(axis,axis,0);
			}
			if(this.use_motor_lin && i===0){
				this.linConstraint.motorMax=this.motor_lin_max_impulse;
			}
		}

		Vec3.mul(this.linConstraint.offset,this.linConstraint.offset,OnoPhy.ERP);
		if(this.use_motor_lin){
			Vec3.madd(this.linConstraint.offset,
				this.linConstraint.offset
				,this.linConstraint.axis[0],this.motor_lin_target_velocity); //モータ影響
		}


		//角度制限
		Mat33.getInv(rotmat,bM);
		Mat33.dot(rotmat,rotmat,bM2); //差分回転行列
		Mat33.getEuler(dp,rotmat); //オイラー角に変換

		Vec3.sub(dv,this.object2.rotV,this.object1.rotV);//回転速度差
		Vec4.setValue(trueq,1,0,0,0);
		Vec3.setValue(this.angConstraint.bane,0,0,0);
		for(var ii=0;ii<OnoPhy.DIMENSION;ii++){
			var i=ii;
			//if(ii==1)i=2;
			//if(ii==2)i=1;

			axis = this.angConstraint.axis[i];
			//軸の向き
			if(i===0){
				Vec3.setValue(axis,bM2[0],bM2[1],bM2[2]);
			}else if(i===2){
				Vec3.setValue(axis,bM[3],bM[4],bM[5]);
				Vec3.setValue(vec,bM2[0],bM2[1],bM2[2]);
				Vec3.cross(axis,vec,axis);
			}else if(i===1){
				Vec3.setValue(axis,bM[3],bM[4],bM[5]);
				//Vec3.setValue(vec,bM2[0],bM2[1],bM2[2]);
				//Vec3.cross(axis,vec,axis);
				//Vec3.cross(axis,axis,vec);
			}
			Vec3.norm(axis);
			//Vec3.mul(axis,axis,-1);

			//角度
			var d = dp[i];
			if(this.use_spring_ang[i]){
				//ばね
				var vv=this.angConstraint.bane;
				Vec3.madd(vv,vv,axis,d*this.spring_stiffness_ang[i]*DT);//角度差
				Vec3.madd(vv,vv,axis,Vec3.dot(dv,axis)*this.spring_damping_ang[i]*DT);
				//this.angConstraint.addImpulseR(vec);
			}

			if(this.use_limit_ang[i]){
				//制限範囲を超えている場合
				if(d< this.limit_ang_lower[i]){
					d=  this.limit_ang_lower[i] - d ;
					Vec3.mul(axis,axis,-1);
				}else if(d > this.limit_ang_upper[i]){
					d= d - this.limit_ang_upper[i];
				}else{
					Vec3.mul(axis,axis,0);
				}
				Vec4.fromRotVector(quat,d,axis[0],axis[1],axis[2]);
				Vec4.qdot(trueq,trueq,quat);
			}else{
				Vec3.mul(axis,axis,0);
			}
			if(this.use_motor_ang && i===0){
				//回転モーター
				this.angConstraint.motorMax=this.motor_ang_max_impulse;
			}
		}

		Vec4.toTorque(this.angConstraint.offset,trueq); //クォータニオンから回転ベクトルを求める
		Vec3.mul(this.angConstraint.offset,this.angConstraint.offset,OnoPhy.ERP);

		if(this.use_motor_ang){
			Vec3.madd(this.angConstraint.offset,
			this.angConstraint.offset
			,this.angConstraint.axis[0],this.motor_ang_target_velocity); //モータ影響
		}

		if(!object1.fix){
			object1.impFlg=true;
		}
		if(!object2.fix){
			object2.impFlg=true;
		}

		Vec3.free(3);
		Vec4.free(2);
		Mat33.free(1);
		Mat43.free(2);
	}
	calcConstraintPre(){
		this.linConstraint.calcConstraintPre();
		this.angConstraint.calcConstraintPre();
	}
	calcConstraint(){
		this.linConstraint.calcConstraint();
		this.angConstraint.calcConstraint();
	}
	bane(){
		this.angConstraint.addImpulseR(this.angConstraint.bane);
	}
};
