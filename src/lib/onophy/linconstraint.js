import OnoPhy from "./onophy.js"
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import Constraint from "./constraint.js"
var fv=[];
for(var i=0;i<3;i++){
	fv.push(new Vec3());
}
var a=new Array(3);
var b=new Array(3);
export default class LinConstraint extends Constraint{
	//並進速度拘束
	constructor(){
		super();

		this.lim=new Array(3);
		this.motorMax=0; //モーター最大力
		this.bane=new Vec3();
	}

	calcPre(){
		var m=Mat33.alloc();
		this.calcEfficM(m);

		this.calcCoeffM(m);
		
		Mat33.free(1);
		return;
	};

	calcConstraintPre(){
		this.calcPre();

		//ウォームスタート
		var impulse = Vec3.alloc();
		Mat33.dotVec3(impulse,this.axisM,this.impulse);
		this.addImpulse(impulse);
		Vec3.free(1);

	}

	calcConstraint(){
		var old = Vec3.alloc();
		var impulse = Vec3.alloc();

		Vec3.copy(old,this.impulse); //現在の拘束力保存
		this.calcDiffVelocity(impulse); //速度差
		Vec3.add(impulse,impulse,this.offset); //位置差(めり込み)補正分追加
		Mat33.dotVec3(impulse,this.coeffM,impulse);//速度差位置差0にするための力算出
		Vec3.add(this.impulse,this.impulse,impulse);//合計の力に加える
		Vec3.mul(this.impulse,this.impulse,OnoPhy.CFM);//やわらか拘束補正

		for(var i=0;i<OnoPhy.DIMENSION;i++){
			//与える力の制限
			if(this.motorMax!==0 && i===0){
				//モーター最大力積を超えないようにする
				this.impulse[i]= MAX(this.impulse[i],this.motorMax);
			}else{
				//片方のみ制限の場合は逆方向の力は加えない
				if(!this.lim[i]){
					this.impulse[i]= MAX(this.impulse[i],0); 
				}
			}
		}
		Vec3.sub(impulse,this.impulse,old); //前回との力の差
		Mat33.dotVec3(impulse,this.axisM,impulse); //力を向きをワールド座標に変換
		this.addImpulse(impulse); //オブジェクトに力を加える

		Vec3.free(2);
	}

	calcCoeffM(m){
		var idx=0;
		for(var i=0;i<OnoPhy.DIMENSION;i++){
			if( Vec3.scalar(this.axis[i])){
				a[idx]=this.axis[i];
				b[idx]=fv[i];
				idx++;
			}else{
				fv[i].fill(0);
			}
		}

		if(idx==1){
			Constraint.calcEffic(b[0],m,a[0]);
		}else if(idx==2){
			Constraint.calcEffic2(b[0],b[1],m,a[0],a[1]);
		}else if(idx==3){
			Constraint.calcEffic3(b[0],b[1],b[2],m,a[0],a[1],a[2]);
		}

		for(var i=0;i<OnoPhy.DIMENSION;i++){
			this.coeffM[i]=fv[i][0];
			this.coeffM[i+3]=fv[i][1];
			this.coeffM[i+6]=fv[i][2];
		}
	}
};
