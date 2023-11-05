import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import OnoPhy from "./onophy.js"
export default class Spring {
	//ばね
	constructor(){
		this.defaultLength=0; //デフォルト長さ
		this.k=1; //ばね定数
		this.c=0; //ダンパ係数
		this.p0 = new Vec3(); //ばね先端1座標
		this.p1 = new Vec3(); //ばね先端2座標
		this._p0 = new Vec3(); //前回の座標
		this._p1 = new Vec3(); //前回の座標
		this.con1Obj = null; //接続オブジェクト1
		this.con1Pos = new Vec3(); //オブジェクト接続座標
		this.con2Obj = null; //接続オブジェクト2
		this.con2Pos = new Vec3(); //オブジェクト接続座標
	}

	calc(dt){
		var dv= Vec3.alloc();
		var dp=Vec3.alloc();
		var n=Vec3.alloc();
		//接続点
		if(this.con1){
			Mat43.dotVec3(this.p0,this.con1.matrix,this.con1Pos);
			this.con1.calcVelocity(dp,this.p0);
		}else{
			Vec3.sub(dp,this.p0,this._p0);
		}
		if(this.con2){
			if(this.con2.type===OnoPhy.FACE){
				Vec3.set(this.p1,0,0,0);
				for(var i=0;i<3;i++){
					Vec3.madd(this.p1,this.p1,this.con2.p[i].location,this.con2.ratio[i]);
				}
			}else{
				Mat43.dotVec3(this.p1,this.con2.matrix,this.con2Pos);
			}
			this.con2.calcVelocity(dv,this.p1);
		}else{
			Vec3.sub(dv,this.p1,this._p1);
		}
		//速度差
		Vec3.sub(dv,dv,dp);

		//位置差
		Vec3.sub(dp,this.p1,this.p0);
		//バネ長さ
		var defaultLength = this.defaultLength;
		
		//バネのび量
		var l = -defaultLength + Vec3.scalar(dp);
		Vec3.normalize(n,dp);//バネ向き

		var damp=this.c*Vec3.dot(dv,n); //ダンパ力
		var spr = l*this.f; //バネ力
		Vec3.mul(n,n,(damp+spr)*dt);

		if(this.con1){
			//Vec3.sub(dp,this.p0,this.con1.location);
			this.con1.addImpulse2(this.p0,n);
		}
		if(this.con2){
			//Vec3.sub(dp,this.p1,this.con2.location);
			Vec3.mul(n,n,-1);
			this.con2.addImpulse2(this.p1,n);
		}

		Vec3.copy(this._p0,this.p0);
		Vec3.copy(this._p1,this.p1);

		Vec3.free(3);
	}
}
