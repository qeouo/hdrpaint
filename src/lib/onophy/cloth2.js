import PhyObj from "./phyobj.js"
import RigidBody from "./rigidbody.js"
import OnoPhy from "./onophy.js"
import Collider from "../collider/collider.js"
import Geono from "../geono.js"
import AABB from "../aabb.js";
import Cloth from "./cloth.js";
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"

var MIN = Math.min;
var MAX = Math.max;

var AIR_DAMPER=1;
var DIMENSION=3;
var triangle = new Collider.ConvexHull();
triangle.poses = new Array(3);
export default class Cloth2 extends RigidBody{
	//クロスシミュ

	constructor(v,e,f){
		super();
		this.type=OnoPhy.CLOTH;
		this.bold=0.015;
		this.points=[]; //頂点位置
		this.edges= []; //エッジ
		this.faces = []; //面
		this.facesSort =[];

		this.air_damping = 0;//空気抵抗
		this.vel_damping = 0;//速度抵抗

		this.restitution=0;//反発係数
		this.friction=0.1;
		this.inv_mass;

		this.tension={};
		this.bending={};
		this.tension.stiffness= 0;//引き剛性
		this.tension.damping = 0; //引き減衰
		this.bending.stiffness = 0; //曲げ剛性
		this.bending.damping= 5;//曲げ減衰


		for(var i=0;i<v;i++){
			this.points.push(new Point());
			this.points[i].cloth=this;
		}
		for(var i=0;i<e;i++){
			var edge = new Edge();
			edge.cloth=this;
			edge.setting=this.tension;

			this.edges.push(edge);
		}
		for(var i=0;i<f;i++){
			this.faces.push(new Face());
			this.faces[i].cloth=this;
			this.facesSort.push(this.faces[i]);
		}
		
		this.aabb= new AABB();
	}

	addBend(point1,point2){

		if(point1===point2){
			//同一頂点は無視
			return 0;
		}

		var i,imax;

		if(this.edges.some((e)=>{
			return (e.point1===point1 && e.point2===point2)
			|| (e.point1===point2 && e.point2===point1)
		})){
			//既にエッジが存在する場合は無視
			return 0;
		}

		var bend= new Edge();
		bend.cloth=this;
		bend.point1=point1;
		bend.point2=point2;
		bend.setting=this.bending;
		bend.len=Vec3.len(point1.location,point2.location);
		this.edges.push(bend);
		return 1;
	}

	init(){
		var edges=this.edges;

		//曲げエッジ追加
		var edges_num=edges.length;
		for(var i=0;i<edges_num;i++){
			for(var j=i+1;j<edges_num;j++){
				if(edges[i].point1 === edges[j].point1){
					this.addBend(edges[i].point2,edges[j].point2);
				}else if(this.edges[i].point1 === edges[j].point2){
					this.addBend(edges[i].point2,edges[j].point1);
				}else if(edges[i].point2 === edges[j].point1){
					this.addBend(edges[i].point1,edges[j].point2);
				}else if(this.edges[i].point2 === edges[j].point2){
					this.addBend(edges[i].point1,edges[j].point1);
				}
			}
		}


		this.inv_mass= 1/this.mass;
		this.tension.stiffness *= this.inv_mass*1000;
		this.bending.stiffness *= this.inv_mass*1000;
		this.tension.damping *= this.inv_mass;
		this.bending.damping *= this.inv_mass;

	}

	rayCast(res,p0,p1){
		var faces =this.faces;
		var poses = this.points999;
		var min=9999999;

		for(var i=0;i<faces.length;i++){
			var face = faces[i];

			if(!AABB.hitCheckLine(face.aabb,p0,p1)){
				continue;
			}
			var t0=face.points[0].location;
			var t1=face.points[1].location;
			var t2=face.points[2].location;

			var l =Geono.TRIANGLE_LINE(face.points[0].location
						,face.points[1].location
						,face.points[2].location
						,p0,p1);
			if(l<min){
				min=l;
				res.face= face;
				res.p1= face.points[0];
				res.p2= face.points[1];
				res.p3= face.points[2];
			}

			if(face.idxnum===4){
				l =Geono.TRIANGLE_LINE(face.points[0].location
						,face.points[2].location
						,face.points[3].location
						,p0,p1);
				if(l<min){
					min=l;
					res.face= face;
					res.p1= face.points[0];
					res.p2= face.points[2];
					res.p3= face.points[3];
				}
			}
		}
		
		return min;
	}
	getPhyFace(p1,p2,p3,face,ans2){
		var phyFace = Cloth.disablePhyFace.pop();
		var v1=new Vec3();
		var v2=new Vec3();
		phyFace.cloth=this;
		phyFace.face = face;
		phyFace.p[0]=p1;
		phyFace.p[1]=p2;
		phyFace.p[2]=p3;

		//ポリゴン接点から各頂点の影響比率を求める
		Vec3.sub(v1,p2.location,p1.location);
		Vec3.sub(v2,p3.location,p1.location);
		Vec3.cross(v1,v1,v2);
		var p=[p1.location
			,p2.location
			,p3.location
			,p1.location
			,p2.location];
		for(var k=0;k<DIMENSION;k++){
			Vec3.sub(v2,p[k+2],p[k+1]);
			Vec3.cross(v2,v1,v2);
			var a=Vec3.dot(v2,p[k+1]);
			var b=Vec3.dot(v2,p[k]);
			var c=Vec3.dot(v2,ans2);

			phyFace.ratio[k]=(a-c)/(a-b);
		}
		
		return phyFace;
	}

	calcPre(onophy){

		var loop=5;
		var dt = onophy.dt/loop;

		for(var lo=0;lo<loop;lo++){
			this.edges.forEach((e)=>{
				//エッジ拘束
				e.calcPre(dt);
			});
			this.points.forEach((e)=>{
				//頂点移動計算
				e.update(dt);
			});
		}

		if(this.use_collision){
			//当たり判定ある場合

			//AABB更新
			this.aabb.min.set(this.points[0].location);
			this.aabb.max.set(this.points[0].location);
			for(var i=1;i<this.faces.length;i++){
				//ポリゴン毎のAABB計算
				var face = this.faces[i];
				if(face.idxnum===4){
					AABB.createFromPolygon(face.aabb
						,face.points[0].location
						,face.points[1].location
						,face.points[2].location
						,face.points[3].location);
				}else{
					AABB.createFromPolygon(face.aabb
						,face.points[0].location
						,face.points[1].location
						,face.points[2].location);
				}
				for(var j=0;j<DIMENSION;j++){
					face.aabb.min[j]-=this.bold;
					face.aabb.max[j]+=this.bold;
				}

				for(var j=0;j<DIMENSION;j++){
					this.aabb.min[j]=MIN(this.aabb.min[j],face.aabb.min[j]);
					this.aabb.max[j]=MAX(this.aabb.max[j],face.aabb.max[j]);
				}
			}
			//this.facesSort.sort(function(a,b){return a.aabb.min[0]-b.aabb.min[0]});

			//剛体との衝突判定
			var list = onophy.collider.aabbSorts[0];
			//triangle = new Collider.Triangle();
			triangle.bold=this.bold;
			var ans1=Vec3.alloc();
			var ans2=Vec3.alloc();
			var norm=Vec3.alloc();

			list.forEach((col)=>{
				if(col.parent===null){
					return;
				}   
				if(col.aabb.min[0]>this.aabb.max[0]){
					return 0;
				}
				if(!AABB.hitCheck(col.aabb,this.aabb)){
					return;
				}

				this.faces.forEach((face)=>{
					if(!AABB.hitCheck(face.aabb,col.aabb)){
						return;
					}
					for(var k=0;k<face.idxnum-2;k++){
						triangle.poses[0] = face.points[0].location;
						triangle.poses[1] = face.points[1+k].location;
						triangle.poses[2] = face.points[2+k].location;
						triangle.aabb = face.aabb;

						var l = Collider.calcClosest(ans1,ans2,col,triangle);
						if(l<0){
							Vec3.cross2(norm,triangle.poses[0],triangle.poses[1],triangle.poses[2]);
							if(Vec3.dot(norm,ans1)<Vec3.dot(norm,ans2)){
								var phyFace = this.getPhyFace(face.points[0],face.points[1+k],face.points[2+k],face,ans2); //衝突計算用の板ポリ
								onophy.registHitConstraint(col.parent,ans1,phyFace,ans2);
							}
						}
					}
				});
			});
			Vec3.free(3);
		}
	}
	calcConstraintPre(){
	}
	calcConstraint(){
	}
	update(dt){
//		AIR_DAMPER=Math.pow(1-0.9,dt*this.air_damping);
		//
	}

};


var Point =  (function(){
	var Point = function(){
		this.v = new Vec3();
		this.location = new Vec3();
		//this.rotV = new Vec3();
		//this.rotq= new Vec4();
		//Vec4.set(this.rotq,1,0,0,0);
		
		this.fix = false;
	}
	var ret = Point;

	ret.prototype.addImpulse=function(impulse){
		if(this.fix) return;
		
		Vec3.add(this.v,this.v,impulse);
		
	}
	ret.prototype.update=function(dt){
		if(this.fix){
			return ;
		}

		Vec3.madd(this.location,this.location,this.v,dt);
		this.v[1]-=this.cloth.onophy.GRAVITY*dt;
	}
	return ret;
})()
class Edge {
	constructor(){
		this.point1 = null;
		this.point2 = null;
		this.len;
		this.cloth=null;
	};

	calcPre(dt){
		var dv = Vec3.alloc();
		var n = Vec3.alloc();
		var impulse=0;

		//位置補正
		Vec3.sub(dv,this.point2.location,this.point1.location);
		Vec3.normalize(n,dv);

		var l = Vec3.scalar(dv) - this.len;
		if(l<0){
			//ひっぱり
			impulse = l*this.setting.stiffness;
		}else{
			//圧縮
			impulse = l*this.setting.stiffness;
		}
		

		Vec3.sub(dv,this.point2.v,this.point1.v);
		impulse +=  Vec3.dot(dv,n) * this.setting.damping;


		Vec3.mul(dv,n,impulse*dt);
		this.point1.addImpulse(dv);
		
		Vec3.mul(dv,dv,-1);
		this.point2.addImpulse(dv);

		Vec3.free(2);
	}
};
class Face{
	constructor(){
		this.points = [null,null,null];
		this.aabb=new AABB();
		this.cloth=null;
	}
};

Cloth2.Point = Point;
Cloth2.Face = Face;
