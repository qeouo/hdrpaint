import {Vec3,Vec4,Mat43,Mat33} from "../vector.js"
var mat43 = new Mat43();
export default class Particle{
	//粒子構造体
	constructor(){
		this.location = new Vec3();
		this.locationV = new Vec3();
		this.idx = -1;
		this.idx_diff = new Vec3();
		this.C = new Mat33();
		this.C.fill(0);
		this.type=1;
	}
	getInvInertiaTensor(){
		//逆慣性テンソルを返す
		Mat43.mul(mat43,mat43,0);
		return mat43;
	}
	getFriction(){
		return 0;
	}
	getExPos(a,b){
		//ワールド座標を剛体のローカル座標にする
		Vec3.copy(a,b);
	}
	addImpulseR(impulse){
		//衝撃を与える(回転のみ
	}

	addImpulse(pos,impulse){
		var p = this;
		
		var vx = impulse[0]*this.inv_mass;
		var vy = impulse[1]*this.inv_mass;
		var vz = impulse[2]*this.inv_mass;

		if(p.idx<0){
			Vec3.mul(p.locationV,impulse,this.inv_mass);
			return;
		}


		this.domain.neighborhoods(p,(p,cell,weight,dx,dy,dz)=>{
				var w= weight*cell._mass;
				cell.locationV[0] += w * vx;
				cell.locationV[1] += w * vy;
				cell.locationV[2] += w * vz;
		});
	}
	getRestitution(){
		return 0;
	}
	calcEfficM(m,r1){
		//点r1に力を加えたとき点がどれだけ加速するかを計算するための行列を求める
		//var r = Vec3.alloc();
		//var R1 = Mat33.alloc();

		//Vec3.sub(r,r1,this.COM);
		//Mat33.setValue(R1,0,r[2],-r[1],-r[2],0,r[0],r[1],-r[0],0);

		//Mat33.dot(m,R1,this.inv_inertiaTensor);
		//Mat33.dot(m,m,R1);
		//Mat33.mul(m,m,-1);
		Mat33.mul(m,m,0);
		m[0]+=this.inv_mass;
		m[4]+=this.inv_mass;
		m[8]+=this.inv_mass;

//		Vec3.free(1);
//		Mat33.free(1);
	}
	calcVelocity(vel,pos){
		var p = this;

		var domain = this.domain;
		var grid = domain.grid;
		var GRID_RES = domain.grid_res;
		var GRID_RES2 = Math.pow(GRID_RES,2);

		vel[0]=p.locationV[0];
		vel[1]=p.locationV[1];
		vel[2]=p.locationV[2];
		if(p.idx<0){
			return;
		}
		this.domain.neighborhoods(p,(p,cell,weight,dx,dy,dz)=>{
			if(cell.fix){
				return;
			}

			var idx = cell.idx;
			var weighted_velocity_x = cell.locationV[0] ;
			var weighted_velocity_y = cell.locationV[1] ;
			var weighted_velocity_z = cell.locationV[2] ;

			var left = grid[idx-1];
			var right= grid[idx+1];
			var up=    grid[idx-GRID_RES];
			var down= grid[idx+GRID_RES];
			var front=    grid[idx-GRID_RES2];
			var back= grid[idx+GRID_RES2];

			weighted_velocity_x +=((left.pressure- cell.pressure)*left.w_x
					-(right.pressure- cell.pressure)*cell.w_x);
			weighted_velocity_y+=((up.pressure- cell.pressure)* up.w_y
					-(down.pressure- cell.pressure)*cell.w_y);
			weighted_velocity_z+=((front.pressure- cell.pressure)* front.w_z
					-(back.pressure- cell.pressure)*cell.w_z);

			vel[0] += weighted_velocity_x*weight;
			vel[1] += weighted_velocity_y*weight;
			vel[2] += weighted_velocity_z*weight;
		});
	}
}
Particle.prototype.rotV=new Vec3();
Particle.prototype.hitflg=1;

