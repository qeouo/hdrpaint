"use strict"
import Collider from "../collider/collider.js"
import Constraint from "./constraint.js"
import HitConstraint from "./hitconstraint.js"
import Joint from "./joint.js"
import PhyObj from "./phyobj.js"
import RigidBody from "./rigidbody.js"
import PhyFace from "./phyface.js"
import Cloth from "./cloth.js"
import Cloth2 from "./cloth2.js"
import SoftBody from "./softbody.js"
import Spring from "./spring.js"
import Fluid from "./fluid.js"
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"

	var MIN = Math.min;
	var MAX = Math.max;

	var REPETITION_MAX=10; //繰り返しソルバ最大回数
	var DT; //ステップ時間
	var CFM=0.99; //柔らかい拘束
	var i=0;

	var disableHitConstraints=[];
	for(var i=0;i<1024;i++){
		disableHitConstraints.push(new HitConstraint());
	}
	
export default class OnoPhy{
	constructor(){
		this.rigidBodies = []; //剛体
		this.springs= []; //ばね
		this.clothes =[]; //布
		this.joints = []; //ジョイント
		this.repetition=0; //ソルバ繰り返した回数

		this.fluids = []; //流体ドメイン

		this.collider=new Collider(); //コライダ
		this.hitConstraints=[]; //コリジョン接触情報
		this.disableList=new Array(1024); //コリジョン無効リスト

		this.ANGDAMP = 0;//回転摩擦
		this.LINDAMP = 0;//平行移動摩擦
		this.GRAVITY = 9.81; //重力加速度
	}
	static CFM = 0.99;
	static ERP = 10;

	init(){
		//剛体削除
		var rigidBodies = this.rigidBodies;
		for(var i=rigidBodies.length;i--;){
			var rigidBody = rigidBodies[i];
			//コリジョンを削除
			if(rigidBody.collision){
				this.collider.deleteCollision(rigidBody.collision);
			}
			rigidBodies.splice(i,1);
		}
		//ジョイント削除
		var joints=this.joints;
		for(var i=joints.length;i--;){
			joints.splice(i,1);
		}
		//スプリングオブジェクト削除
		var springs=this.springs;
		for(var i=springs.length;i--;){
			springs.splice(i,1);
		}
	}


	createRigidBody = function(){
		var phyobj=new RigidBody();
		phyobj.parent = this;
		this.rigidBodies.push(phyobj);

		return phyobj;
	}
	addPhyObj= function(phyObj){
		phyObj.onophy=this;
		if(phyObj.type===OnoPhy.RIGID){
			this.rigidBodies.push(phyObj);
			this.collider.addCollision(phyObj.collision);
		}else{
			this.clothes.push(phyObj);
		}

	}

	deleteRigidBody = function(object){
		//オブジェクト削除
		var rigidBodies=this.rigidBodies;
		for(var i=rigidBodies.length;i--;){
			if(rigidBodies[i]===object){
				//コリジョンを削除
				if(object.collision){
					this.deleteCollision(object.collision);
				}
				rigidBodies.splice(i,1);
				break;
			}
		}
	}
	createJoint= function(){
		var joint =new Joint();
		this.joints.push(joint);
		return joint;
	}
	addJoint= function(joint){
		this.joints.push(joint);
	}

	deleteJoint= function(joint){
		//ジョイント削除
		var joints=this.joints;
		for(var i=joints.length;i--;){
			if(joints[i]===joint){
				joints.splice(i,1);
				break;
			}
		}
	}

	add = function(obj){
		switch(obj.constructor){
		case Spring:
			this.springs.push(obj);
			break;
		}
	}
	remove = function(obj){
		switch(obj.constructor){
		case Spring:
			this.springs.forEach(function(obj2,idx,arr){
				if(obj2 === obj){
					arr.splice(idx,1);
					return false;
				}
			});
			break;
		}
	}
	createSpring = function(){
		//スプリングオブジェクト作成
		var res=new Spring();
		this.springs.push(res)
		return res
	}
	deleteSpring = function(obj){
		//スプリングオブジェクト削除
		var springs=this.springs;
		for(var i=0;i<springs.length;i++){
			if(springs[i]===obj){
				springs.splice(i,1);
				break;
			}
		}
	}

	removeHitConstraint(i){
		//削除
		var hitConstraint = this.hitConstraints[i];
		this.hitConstraints.splice(i,1);
		if(hitConstraint.obj1.type===OnoPhy.FACE){
			Cloth.disablePhyFace.push(hitConstraint.obj1);
		}
		if(hitConstraint.obj2.type===OnoPhy.FACE){
			Cloth.disablePhyFace.push(hitConstraint.obj2);
		}
		disableHitConstraints.push(hitConstraint);
	}

	readjustHitConstraint(target){
		var obj1 = target.obj1;
		var obj2 = target.obj2;
		var pos1= target.pos1;
		var pos2= target.pos2;
		var hitConstraint;
		var hitConstraints = this.hitConstraints;

		//座標が近いやつはまとめる
		for(var i=hitConstraints.length;i--;){
			hitConstraint=hitConstraints[i];
			if(obj1 !== hitConstraint.obj1
			|| obj2 !== hitConstraint.obj2){
				continue;
			}

			if(Vec3.len2(hitConstraint.pos1,pos1)<0.01
			&& Vec3.len2(hitConstraint.pos2,pos2)<0.01){

				if(hitConstraint === target){
					continue;
				}
				//力をまとめる
				Vec3.add(target.impulse,target.impulse,hitConstraint.impulse);
				Vec3.add(target.impulseR,target.impulseR,hitConstraint.impulseR);

				//削除
				this.removeHitConstraint(i);
			}
		}

		if(!(obj1.type === OnoPhy.RIGID &&  obj2.type === OnoPhy.RIGID)){
			return;
		}

		//同一の組み合わせが一定以上の場合は古いやつから消して一定数以下にする
		var count=0;
		var max=8;
		for(var i=hitConstraints.length;i--;){
			hitConstraint=hitConstraints[i];

			if(hitConstraint.obj1!== obj1|| hitConstraint.obj2!==obj2){
				continue;
			}

			if(Vec3.dot(hitConstraint.axis[0],target.axis[0])<0){
				//めり込み方向が反対の場合は削除
				this.removeHitConstraint(i);
				continue;
			}

			count++;
			if(count>max){
				//一定数以上なので削除
				this.removeHitConstraint(i);
			}
		}
	}
	registHitConstraint(obj1,pos1,obj2,pos2,hitConstraint){

		if(Vec3.len2(pos1,pos2) === 0 ){
			//例外
			return null;
		}

		if(!hitConstraint){
			//新しく取得する場合
			hitConstraint = disableHitConstraints.pop();
			this.hitConstraints.push(hitConstraint);
			hitConstraint.obj1 = obj1;
			hitConstraint.obj2 = obj2;
			Vec3.setValue(hitConstraint.impulse,0,0,0);
			Vec3.setValue(hitConstraint.impulseR,0,0,0);

		}

		Vec3.copy(hitConstraint.pos1,pos1);
		Vec3.copy(hitConstraint.pos2,pos2);

		Vec3.sub(hitConstraint.axis[0],pos2,pos1);
		Vec3.norm(hitConstraint.axis[0]);
		
		hitConstraint.counter=0;


		return hitConstraint;

	};


	/** dt秒シミュレーションを進める **/
	calc(dt){

		this.DT = dt;
		DT=dt; //ステップ時間をグローバルに格納
		this.dt =dt;
		var rigidBodies = this.rigidBodies ; //剛体配列

		var dv=new Vec3();

		for(i = this.rigidBodies.length;i--;){
			//判定用行列更新
			this.rigidBodies[i].calcPre();
		}

		var idx=0;
		for(var i=0;i<this.joints.length;i++){
			//コリジョン無効リスト作成
			if(this.joints[i].disable_collisions){
				//ジョイント接続されたもの同士の接触無効
				this.disableList[idx]=Collider.getPairId(
					this.joints[i].object1.collision.id
					,this.joints[i].object2.collision.id);
				idx++;

			}
		}
		this.disableList[idx]=-1;

		//すべてのコリジョンの衝突判定
		this.collider.All(this.disableList,idx);
		var hitList = this.collider.hitList;

		for(var i=0;hitList[i].col1;i++){
			//接触拘束作成
			var hit = hitList[i];
			if(hit.col1.parent && hit.col2.parent){
				var hitConstraint = this.registHitConstraint(hit.col1.parent,hit.pos1,hit.col2.parent,hit.pos2);
				if(hitConstraint){
					this.readjustHitConstraint(hitConstraint);
				}
			}
		}


		this.joints.forEach((e)=>{
			//ジョイント拘束セット+ばね
			e.setConstraint();
		});
		this.joints.forEach((e)=>{
			//バネ処理
			e.bane();
		});

		this.springs.forEach((e)=>{
			//バネ処理
			e.calc(dt);
		});

		this.clothes.forEach((e)=>{
			//クロス処理
			e.calcPre(this);
		});

		for(var i = 0;i<this.clothes.length;i++){
			for(var j = i+1;j<this.clothes.length;j++){
				//クロス同士の接触処理
			//	this.clothes[i].calcCollision(this.clothes[j],this);
			}
		}
		

		//衝突情報の持続判定
		var ans1= new Vec3();
		var ans2= new Vec3();
		var ans4= new Vec3();
		var t=new Vec3();
		this.hitConstraints.forEach((e)=>{
			var hitConstraint = e;

			var obj1=hitConstraint.obj1;
			var obj2=hitConstraint.obj2;
			//if(!obj1.moveflg && !obj2.moveflg){
			//	continue;
			//}
			if(hitConstraint.counter === 0){
				//接触1フレーム目は無視
				return;
			}

			if(obj1.type !== OnoPhy.RIGID || obj2.type !== OnoPhy.RIGID){
				if(obj1.type===OnoPhy.FACE){
					Cloth.disablePhyFace.push(hitConstraint.obj1);
				}
				if(obj2.type===OnoPhy.FACE){
					Cloth.disablePhyFace.push(hitConstraint.obj2);
				}
				hitConstraint.obj1=null;
				return;
			}

			//前回の衝突点の現在位置を求めてめり込み具合を調べる
			var l,l2;
			Mat43.dotVec3(ans1,obj1.matrix,hitConstraint.pos1ex);
			Vec3.sub(t,ans1,hitConstraint.axis[0]);
			l=obj2.collision.rayCast(ans1,t);
			if(l === Collider.INVALID){
				l = 999;
			}
			Vec3.madd(ans2,ans1,hitConstraint.axis[0],-l);

			Mat43.dotVec3(ans4,obj2.matrix,hitConstraint.pos2ex);
			Vec3.add(t,ans4,hitConstraint.axis[0]);
			l2=obj1.collision.rayCast(ans4,t);
			if(l2 === Collider.INVALID){
				l2 = 999;
			}
			
			if(l2<l){
				//めり込みが大きい方を採用
				Vec3.copy(ans2,ans4);
				Vec3.madd(ans1,ans2,hitConstraint.axis[0],l2);
				l=l2;
			}

			if(l>=0){
				//めり込んでいない場合は削除
				hitConstraint.obj1=null;
			}else{
				//持続処理
				this.registHitConstraint(obj1,ans1,obj2,ans2,hitConstraint);
			}
		});
		for(var i=this.hitConstraints.length;i--;){
			var hitConstraint = this.hitConstraints[i];
			if(hitConstraint.obj1){
				continue;
			}

			this.hitConstraints.splice(i,1);
			disableHitConstraints.push(hitConstraint);
		}

		for(i = this.rigidBodies.length;i--;){
			//重力
			var obj = rigidBodies[i];
			if(obj.fix)continue
			obj.v[1]+=-this.GRAVITY*dt;
			
		}

		//流体シミュ
		this.fluids.forEach((fluid)=>{
			fluid.preProcess(dt,this);
		});


		//繰り返しソルバ
		performance.mark("impulseStart");
		var repetition;
		var constraints = [];
		//拘束を一つの配列にまとめる
		Array.prototype.push.apply(constraints,this.hitConstraints);
		Array.prototype.push.apply(constraints,this.joints);
		var clothes=this.clothes;
		//Array.prototype.push.apply(constraints,this.clothes);
		

		for (var i = 0;i<constraints.length; i++) {
			//ウォームスタート処理
			constraints[i].calcConstraintPre();
		}


		for (repetition = 0; repetition < REPETITION_MAX; repetition++) {
			//繰り返し最大数まで繰り返して撃力を収束させる
			//var impnum=0;
			//for(i = rigidBodies.length;i--;){
			//	//現在の速度を保存
			//	var o = rigidBodies[i];
			//	if(!o.impFlg){continue;}
			//	Vec3.copy(o.oldv,o.v);
			//	Vec3.copy(o.oldrotV,o.rotV);
			//	impnum++;
			//}


			for (var i = 0;i<constraints.length; i++) {
				constraints[i].calcConstraint();
			}

			//流体シミュ
			this.fluids.forEach((fluid)=>{
				fluid.solvProcess(dt);
			});
			
			////収束チェック
			//var sum= 0;
			//for(i = rigidBodies.length;i--;){
			//	var o = rigidBodies[i];
			//	if(!o.impFlg){continue;}
			//	Vec3.sub(dv,o.oldv,o.v);
			//	sum+=(dv[0]*dv[0]+dv[1]*dv[1]+dv[2]*dv[2]);
			//	Vec3.sub(dv,o.oldrotV,o.rotV);
			//	sum+=(dv[0]*dv[0]+dv[1]*dv[1]+dv[2]*dv[2]);
			//	
			//}
			//if ( sum<= 0.000001*impnum && repetition>1) {
			//	break;
			//}

		}
		//流体シミュ
		this.fluids.forEach((fluid)=>{
			fluid.afterProcess(dt);
		});
		
		//クロスシミュ
		this.clothes.forEach((e)=>{
			//ウォームスタート処理
			e.calcConstraintPre();
		});
		this.clothes.forEach((e)=>{
			e.calcConstraint();
		});

		this.repetition=repetition;
		performance.mark("impulseEnd");

		this.LINDAMP = 1.0-0.04;
		this.ANGDAMP = 1.0-0.04;

		this.LINDAMP = Math.pow(this.LINDAMP,dt);
		this.ANGDAMP = Math.pow(this.ANGDAMP,dt);

		this.rigidBodies.forEach((e)=>{
			e.update(dt);
		});

		this.clothes.forEach((e)=>{
			e.update(dt);
		});



		return;
	}
}
OnoPhy.RigidBody = RigidBody;
OnoPhy.Joint = Joint;
OnoPhy.RIGID= i++; //剛体
OnoPhy.CLOTH = i++ ;//布およびソフトボディ（バネメッシュ）
OnoPhy.FACE = i++ ;//メッシュのうちの1フェイス
OnoPhy.Spring_MESH= i++; //バネメッシュ

var disablePhyFace=Cloth.disablePhyFace=[]; //接触時のダミー板
for(var i=0;i<1024;i++){
	disablePhyFace.push(new PhyFace());
}

OnoPhy.DIMENSION=3; //次元
OnoPhy.Cloth= Cloth;
OnoPhy.Cloth2= Cloth2;
OnoPhy.SoftBody= SoftBody;

//export Spring;
