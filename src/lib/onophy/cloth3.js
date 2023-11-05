
import PhyObj from "./phyobj.js"
import RigidBody from "./rigidbody.js"
import OnoPhy from "./onophy.js"
import Collider from "../collider/collider.js"
import Geono from "../geono.js"
import AABB from "../aabb.js";
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import Cloth from "./cloth.js"

var MIN = Math.min;
var MAX = Math.max;

var AIR_DAMPER=1;
var DIMENSION=3;
export default class Cloth2 extends Cloth{
	//クロスシミュ

	constructor(v,e,f){
		super(v,e,f);

		this.edges=[];
		for(var i=0;i<e;i++){
			this.edges.push(new Edge());
			this.edges[i].cloth=this;
		}
	}
	init(){
		var edges=this.edges;

		edges.forEach((e)=>{
			Vec3.sub(e.sabun,e.point2.location,e.point1.location);
		});
		this.inv_pointMass = 1/this.mass;
	}
	calcPre(onophy){
		var loop=5;
		var dt = this.onophy.dt/loop;
		for(var l=0;l<loop;l++){
			this.edges.forEach((e)=>{
				//エッジ拘束
				e.calcPre(dt,0);
			});

			AIR_DAMPER=Math.pow(1-0.7,dt*this.air_damping);
			this.points.forEach((e)=>{
				Vec3.mul(e.rotV,e.rotV,AIR_DAMPER);
				e.update(dt,this.mass);
			});
		}
	}
	update(dt){
	}
}



class Edge {
	constructor(){
		this.point1 = null;
		this.point2 = null;
		this.sabun=new Vec3();
		this.impulse = new Vec3();
		this.n = new Vec3();
		this.offset = new Vec3();
		this.cloth=null;
	};

	calcPre(dt,flg){
		var dv = new Vec3();
		var dv2 = new Vec3();
		var pos1 = new Vec3();
		var pos2 = new Vec3();
		var inv_mass = this.cloth.inv_pointMass;

		//接続位置
		Vec4.rotVec3(pos1,this.point1.rotq,this.sabun);
		Vec4.rotVec3(pos2,this.point2.rotq,this.sabun);
		Vec3.mul(pos1,pos1,0.5);
		Vec3.mul(pos2,pos2,-0.5);

		//接続位置速度
		Vec3.cross(dv,this.point1.rotV,pos1);
		Vec3.cross(dv2,this.point2.rotV,pos2);
		Vec3.sub(dv,dv2,dv);

		Vec3.add(pos1,this.point1.location,pos1);
		Vec3.add(pos2,this.point2.location,pos2);

		Vec3.sub(this.offset,pos2,pos1);

		//位置補正
		Vec3.mul(this.impulse,this.offset,this.cloth.structual_stiffness*this.cloth.mass);
		//速度補正
		Vec3.madd(this.impulse,this.impulse,dv,this.cloth.mass);

		Vec3.mul(this.impulse,this.impulse,dt);
		this.addImpulse(this.impulse);



		//回転
		var impulse = new Vec3();
		var rotq = new Vec4();
		Vec4.qmdot(rotq,this.point2.rotq,this.point1.rotq,-1);
		Vec4.toTorque(impulse,rotq);
		Vec3.mul(impulse,impulse,this.cloth.bending_stiffness*inv_mass);
		Vec3.sub(dv,this.point2.rotV,this.point1.rotV);
		Vec3.madd(impulse,impulse,dv,0.1);

		Vec3.mul(impulse,impulse,dt);
		Vec3.add(this.point1.rotV,this.point1.rotV,impulse);
		Vec3.sub(this.point2.rotV,this.point2.rotV,impulse);
	}

	addImpulse(impulse){
		var pos1 = new Vec3();
		var pos2 = new Vec3();

		Vec4.rotVec3(pos1,this.point1.rotq,this.sabun);
		Vec4.rotVec3(pos2,this.point2.rotq,this.sabun);
		Vec3.mul(pos2,pos2,-1);
		var m=this.cloth.inv_pointMass;
		var dv = new Vec3();
		if(!this.point1.fix){
			Vec3.madd(this.point1.v,this.point1.v,impulse,m);
			Vec3.norm(pos1);
			Vec3.cross(dv,pos1,impulse); 
			Vec3.madd(this.point1.rotV,this.point1.rotV,dv,m*10); //回転
		}
		if(!this.point2.fix){
			Vec3.madd(this.point2.v,this.point2.v,impulse,-m);
			Vec3.norm(pos2);
			Vec3.cross(dv,pos2,impulse); 
			Vec3.madd(this.point2.rotV,this.point2.rotV,dv,-m*10); //回転
		}
	}
	calcConstraintPre(){
//		var impulse = new Vec3();
//		Vec3.mul(impulse,this.impulse*this.cloth.inv_pointMass);
//
//		this.addImpulse(impulse);

	}
	calcConstraint(m){
//		var dv = new Vec3();
//		var old = new Vec3();
//		Vec3.copy(old,this.impulse);
//
//		Vec3.copy(this.impulse,this.offset);
//		this.impulse*=0.98; //やわらか拘束
//
//		Vec3.sub(old,this.impulse,old);
//
//		this.addImpulse(old);

	}
};

