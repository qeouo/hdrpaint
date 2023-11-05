import {Vec3,Vec4,Mat43,Mat33} from "../vector.js"
import Collider from "../collider/collider.js"
import Particle from "./particle.js"

var MIN = Math.min;
var MAX = Math.max;

var DIMENSION=3;
export default class Fluid{
	//MLS-MPM

	constructor(location,field_size){
		this.onophy = null;
		this.location = new Vec3();
		this.field_size = new Vec3();
		Vec3.copy(this.location,location);
		Vec3.copy(this.field_size,field_size);
		var max = Math.max(Math.max(this.field_size[0],this.field_size[1]),this.field_size[2]);
		this.grid_res = 16;
		this.cell_size = max / this.grid_res;
		this._cell_size = 1 / this.cell_size;
		this.particle_size = this.cell_size / 2;
		this.density = 1000;
		this.particles=[];
		this.phash=[];

		 //粒子の質量 
		Particle.prototype.mass =4/3 * Math.PI * Math.pow(this.particle_size,3)*this.density;
		Particle.prototype.size=this.particle_size;
		Particle.prototype.inv_mass =1/Particle.prototype.mass;

		this.grid =[];
		this.grid_enable =[];
		var GRID_RES = this.grid_res;
		var GRID_RES2 = Math.pow(GRID_RES,2);

		for(var k=0;k<GRID_RES;k++){
			for(var j=0;j<GRID_RES;j++){
				for(var i=0;i<GRID_RES;i++){
					var cell=new Cell();
					cell.idx = i+ j*GRID_RES + k *GRID_RES2;
					
					if(i<=0 || i>=GRID_RES-1 
					|| j<=0 || j>=GRID_RES-1
					|| k<=0 || k>=GRID_RES-1){
						cell.fix=1;
						cell.edge=1;
						cell.capacity=0;
					}
					this.grid.push(cell);
					this.grid_enable.push(cell);
				}
			}
		}

		var phash=[];
		for(var i=0;i<this.grid.length;i++){
			phash.push([]);
		}
		this.phash = phash;
		this.phash2 = new Array(this.grid.length*8);
	}
	neighborhoods(p,f){
		//近傍27セル走査関数
		var _CELL_SIZE = this._cell_size;
		var grid = this.grid;
		var GRID_RES = this.grid_res;
		var GRID_RES2 = this.grid_res * this.grid_res;

		//var scaled_p_x = (p.location[0] - this.location[0]) * _CELL_SIZE;
		//var scaled_p_y = (p.location[1] - this.location[1])* _CELL_SIZE;
		//var scaled_p_z = (p.location[2] - this.location[2])* _CELL_SIZE;
		//var idx_x = scaled_p_x | 0;
		//var idx_y = scaled_p_y | 0;
		//var idx_z = scaled_p_z | 0;
		//var diff_x = scaled_p_x - idx_x- 0.5;
		//var diff_y = scaled_p_y - idx_y - 0.5;
		//var diff_z = scaled_p_z - idx_z - 0.5;
		var diff_x = p.idx_diff[0];
		var diff_y = p.idx_diff[1];
		var diff_z = p.idx_diff[2];
		var diff_x2 = diff_x*diff_x;
		var diff_y2 = diff_y*diff_y;
		var diff_z2 = diff_z*diff_z;

//		weights_x[0] = 0.5 * (0.25 - diff_x + diff_x2);
//		weights_y[0] = 0.5 * (0.25 - diff_y + diff_y2);
//		weights_z[0] = 0.5 * (0.25 - diff_z + diff_z2);
//		weights_x[1] = 0.75 - diff_x2;
//		weights_y[1] = 0.75 - diff_y2;
//		weights_z[1] = 0.75 - diff_z2;
//		weights_x[2] = weights_x[0] + diff_x;
//		weights_y[2] = weights_y[0] + diff_y;
//		weights_z[2] = weights_z[0] + diff_z;

		var nx0 = 0.5 * (0.25 - diff_x + diff_x2);
		var ny0 = 0.5 * (0.25 - diff_y + diff_y2);
		var nz0 = 0.5 * (0.25 - diff_z + diff_z2);
		var nx1 = 0.75 - diff_x2;
		var ny1 = 0.75 - diff_y2;
		var nz1 = 0.75 - diff_z2;
		var nx2 = nx0 + diff_x;
		var ny2 = ny0 + diff_y;
		var nz2 = nz0 + diff_z;

		//var idx = idx_x -1 + (idx_y -1)*GRID_RES + (idx_z - 1)*GRID_RES2;
		var idx = p.idx - GRID_RES2 -GRID_RES-1;
		var idx2;
		//diff_x+=1;
		//diff_y+=1;
		//diff_z+=1;
//		for(var gz=0;gz<3;gz++){
//			for(var gy=0;gy<3;gy++){
//				for(var gx=0;gx<3;gx++){
//
//					var cell = grid[idx + gx + gy *GRID_RES + gz*GRID_RES2];
//					var weight = weights_x[gx] * weights_y[gy] * weights_z[gz];
//
//					f(p,cell,weight,gx-diff_x,gy-diff_y,gz-diff_z);
//				}
//			}
//		}

				var dx = -1- diff_x;
				var dy = -1- diff_y;
				var dz = -1- diff_z;
				var weight = ny0 * nz0;

				f(p,grid[idx],weight*nx0,dx,dy,dz);
				f(p,grid[idx+1],weight*nx1,dx+1,dy,dz);
				f(p,grid[idx+2],weight*nx2,dx+2,dy,dz);

				weight = ny1 * nz0;
				idx2 =idx + GRID_RES;
				f(p,grid[idx2  ],weight*nx0,dx,dy+1,dz);
				f(p,grid[idx2+1],weight*nx1,dx+1,dy+1,dz);
				f(p,grid[idx2+2],weight*nx2,dx+2,dy+1,dz);

				weight = ny2 * nz0;
				idx2 =idx + GRID_RES*2;
				f(p,grid[idx2 ],weight*nx0,dx,dy+2,dz);
				f(p,grid[idx2+1],weight*nx1,dx+1,dy+2,dz);
				f(p,grid[idx2+2],weight*nx2,dx+2,dy+2,dz);


				weight = ny0 * nz1;
				idx2 =idx + GRID_RES2;
				f(p,grid[idx2  ],weight*nx0,dx,dy,dz+1);
				f(p,grid[idx2+1 ],weight*nx1,dx+1,dy,dz+1);
				f(p,grid[idx2+2 ],weight*nx2,dx+2,dy,dz+1);

				weight = ny1 * nz1;
				idx2 =idx + GRID_RES+GRID_RES2;
				f(p,grid[idx2 ],weight*nx0,dx,dy+1,dz+1);
				f(p,grid[idx2+1],weight*nx1,dx+1,dy+1,dz+1);
				f(p,grid[idx2+2],weight*nx2,dx+2,dy+1,dz+1);

				weight = ny2 * nz1;
				idx2 =idx + GRID_RES*2 +GRID_RES2;
				f(p,grid[idx2 ],weight*nx0,dx,dy+2,dz+1);
				f(p,grid[idx2+1],weight*nx1,dx+1,dy+2,dz+1);
				f(p,grid[idx2+2],weight*nx2,dx+2,dy+2,dz+1);

				weight = ny0 * nz2;
				idx2 =idx  +GRID_RES2*2;
				f(p,grid[idx2   ],weight*nx0,dx,dy,dz+2);
				f(p,grid[idx2+1 ],weight*nx1,dx+1,dy,dz+2);
				f(p,grid[idx2+2 ],weight*nx2,dx+2,dy,dz+2);

				weight = ny1 * nz2;
				idx2 =idx  + GRID_RES + GRID_RES2*2;
				f(p,grid[idx2  ],weight*nx0,dx,dy+1,dz+2);
				f(p,grid[idx2+1],weight*nx1,dx+1,dy+1,dz+2);
				f(p,grid[idx2+2],weight*nx2,dx+2,dy+1,dz+2);

				weight = ny2 * nz2;
				idx2 =idx  + GRID_RES*2 + GRID_RES2*2;
				f(p,grid[idx2 ],weight*nx0,dx,dy+2,dz+2);
				f(p,grid[idx2+1],weight*nx1,dx+1,dy+2,dz+2);
				f(p,grid[idx2+2],weight*nx2,dx+2,dy+2,dz+2);

	}


	createParticle(location){
		var p = new Particle();
		Vec3.copy(p.location,location);
		p.domain= this;
		this.particles.push(p);
		return p;
	}


	preProcess(dt,onoPhy){
		var grid = this.grid;
		var phash = this.phash;
		//グリッドをリセット
		
		var grid_length = grid.length;
		this.grid_enable.forEach((cell)=>{
			cell.mass = 0;
			cell.locationV.fill(0);
			var i = cell.idx;

			phash[i].splice(0,phash[i].length);

		});

		//パーティクル→グリッド
		this.p2g(dt);

		//グリッド計算
		this.calcGrid(dt);

		//粘性計算
		//this.calcViscosity(dt);

		//圧力計算
		this.liquidPreProcess(dt);


		//接触
		var ans1=new Vec3();
		var ans2=new Vec3();
		var sphere = new Collider.Sphere();
		sphere.bold = this.particle_size;
		var rigidBodies = onoPhy.rigidBodies;
		var particles = this.particles;

		var min =new Vec3();
		var max= new Vec3();

		var GRID_RES= this.grid_res;
		var GRID_RES2 = Math.pow(GRID_RES,2);
		rigidBodies.forEach((rigidBody)=>{
			Vec3.sub(min,rigidBody.collision.aabb.min,this.location);
			Vec3.sub(max,rigidBody.collision.aabb.max,this.location);
			Vec3.mul(min,min,this._cell_size);
			Vec3.mul(max,max,this._cell_size);
			for(var i=0;i<3;i++){
				min[i] = Math.max(0,(min[i]|0)-1);
				max[i]= Math.min(GRID_RES-1,(max[i]|0)+1);
			}

			for(var z=min[2];z<=max[2];z++){
				for(var y=min[1];y<=max[1];y++){
					for(var x=min[0];x<=max[0];x++){
						phash[z*GRID_RES2 +y*GRID_RES+x].forEach((particle)=>{

							sphere.matrix[9]= particle.location[0];
							sphere.matrix[10]= particle.location[1];
							sphere.matrix[11]= particle.location[2];
							sphere.refresh();
							var l = Collider.calcClosest(ans1,ans2,sphere,rigidBody.collision);
							if(l<0){
								var hitConstraint = onoPhy.registHitConstraint(
									particle,ans1,rigidBody,ans2);
								if(hitConstraint){
									onoPhy.readjustHitConstraint(hitConstraint);
								}
							}

						});
					}
				}
			}

		});
//		particles.forEach((particle)=>{
//			sphere.matrix[9]= particle.location[0];
//			sphere.matrix[10]= particle.location[1];
//			sphere.matrix[11]= particle.location[2];
//			sphere.refresh();
//			rigidBodies.forEach((rigidBody)=>{
//				var l = Collider.calcClosest(ans1,ans2,sphere,rigidBody.collision);
//				if(l<0){
//					var hitConstraint = onoPhy.registHitConstraint(
//						particle,ans1,rigidBody,ans2);
//					if(hitConstraint){
//						onoPhy.readjustHitConstraint(hitConstraint);
//					}
//				}
//
//			});
//		});

	}
	afterProcess(dt){
		this.liquidAfterProcess(dt);

		//グリッド→パーティクル
		this.g2p(dt,0);
	}

	p2g(dt){
		//パーティクルからグリッドに反映
		var phash = this.phash;
		var particles = this.particles;
		var CELL_SIZE = this.cell_size;
		var FIELD_SIZE_X = this.field_size[0];
		var FIELD_SIZE_Y = this.field_size[1];
		var FIELD_SIZE_Z = this.field_size[2];
		var _CELL_SIZE = this._cell_size;
		var GRID_RES = this.grid_res;
		var GRID_RES2 = Math.pow(this.grid_res,2);
		var grid = this.grid;


		this.phash2.fill(0);

		var size=particles.length;
		for(var i=0;i<size;i++){
			var p = particles[i];
			var idx_x = (p.location[0] -this.location[0])* _CELL_SIZE;
			var idx_y = (p.location[1] -this.location[1])* _CELL_SIZE;
			var idx_z = (p.location[2] -this.location[2])* _CELL_SIZE;

			if(idx_x<1 || idx_x >= GRID_RES -1
				|| idx_y<1 || idx_y >= GRID_RES -1
				|| idx_z<1 || idx_z >= GRID_RES -1){
				//グリッド外
				p.idx=-1;
				continue;
			}

			p.idx_diff[0] = idx_x - (idx_x|0)-0.5;
			p.idx_diff[1] = idx_y - (idx_y|0)-0.5;
			p.idx_diff[2] = idx_z - (idx_z|0)-0.5;


			var idx = ((idx_x*2)|0)
			   + ((idx_y*2)|0) * GRID_RES*2 
			   + ((idx_z*2)|0) * GRID_RES2*4; 

			idx_x|=0;
			idx_y|=0;
			idx_z|=0;

			var idx = idx_x + idx_y * GRID_RES + idx_z * GRID_RES2; 
			p.idx = idx;
			phash[idx].push(p);


			
			this.p2gFunc(p);
			p.locationV.fill(0);
		}

		

	}
	p2gFunc(p){
		//近傍27セル走査関数
		var grid = this.grid;
		var GRID_RES = this.grid_res;
		var GRID_RES2 = this.grid_res * this.grid_res;

		var diff_x = p.idx_diff[0];
		var diff_y = p.idx_diff[1];
		var diff_z = p.idx_diff[2];
		var diff_x2 = diff_x*diff_x;
		var diff_y2 = diff_y*diff_y;
		var diff_z2 = diff_z*diff_z;

		var nx0 = 0.5 * (0.25 - diff_x + diff_x2);
		var ny0 = 0.5 * (0.25 - diff_y + diff_y2);
		var nz0 = 0.5 * (0.25 - diff_z + diff_z2);
		var nx1 = 0.75 - diff_x2;
		var ny1 = 0.75 - diff_y2;
		var nz1 = 0.75 - diff_z2;
		var nx2 = nx0 + diff_x;
		var ny2 = ny0 + diff_y;
		var nz2 = nz0 + diff_z;

		var _idx = p.idx - GRID_RES2 -GRID_RES-1;

		var dx = -1- diff_x;
		var dy = -1- diff_y;
		var dz = -1- diff_z;

		var C = p.C;


		var p2gSub = this.p2gSub;

		var _x =  p.locationV[0]+C[0]*dx+C[3]*dy+C[6]*dz;
		var _y =  p.locationV[1]+C[1]*dx+C[4]*dy+C[7]*dz;
		var _z =  p.locationV[2]+C[2]*dx+C[5]*dy+C[8]*dz;
		
		for(var i=0;i<3;i++){
			var C = p.C;
			var nz = [nz0,nz1,nz2][i];
			var weight = ny0 * nz;
			var idx = _idx + (i) *GRID_RES2 ;
			var x=_x + C[6]*i;
			var y=_y + C[7]*i;
			var z=_z + C[8]*i;

			p2gSub(p,grid[idx],weight*nx0,x,y,z);
			p2gSub(p,grid[idx+1],weight*nx1,x+C[0],y+C[1],z+C[2]);
			p2gSub(p,grid[idx+2],weight*nx2,x+C[0]*2,y+C[1]*2,z+C[2]*2);

			x +=  C[3];
			y +=  C[4];
			z +=  C[5];
			weight = ny1 * nz;
			idx+=GRID_RES;
			p2gSub(p,grid[idx ],weight*nx0,x,y,z);
			p2gSub(p,grid[idx+1],weight*nx1,x+C[0],y+C[1],z+C[2]);
			p2gSub(p,grid[idx+2],weight*nx2,x+C[0]*2,y+C[1]*2,z+C[2]*2);

			weight = ny2 * nz;
			x +=  C[3];
			y +=  C[4];
			z +=  C[5];
			idx+=GRID_RES;
			p2gSub(p,grid[idx ],weight*nx0,x,y,z);
			p2gSub(p,grid[idx+1],weight*nx1,x+C[0],y+C[1],z+C[2]);
			p2gSub(p,grid[idx+2],weight*nx2,x+C[0]*2,y+C[1]*2,z+C[2]*2);

		}



	}
	p2gSub(p,cell,weight,dx,dy,dz){
		cell.mass += weight;
		cell.locationV[0] += weight * dx;
		cell.locationV[1] += weight * dy;
		cell.locationV[2] += weight * dz;
	};

	liquidPreProcess(dt){
		var _six = 1/6;
		this.grid_enable.splice(0,this.grid_enable.length);
		var CELL_SIZE = this.cell_size;
		var CELL_SIZE_dt = CELL_SIZE/dt;
		var GRID_RES = this.grid_res;
		var GRID_RES2 = Math.pow(this.grid_res,2);
		var grid = this.grid;
		 // 1セル内を粒子で満たした場合の質量
		var mass0 = CELL_SIZE * CELL_SIZE* CELL_SIZE * this.density;
		//for(var k=1;k<GRID_RES-1;k++){
		//	for(var j=1;j<GRID_RES-1;j++){
		//		for(var i=1;i<GRID_RES-1;i++){
		//			var idx = j*GRID_RES+i + k * GRID_RES2;
					//var cell = grid[idx];
		var idx=-1;
		grid.forEach((cell)=>{
			idx++;
			if(cell.fix){return;};

			cell.m_x = 0;
			cell.m_y = 0;
			cell.m_z = 0;

			cell.w_x=0;
			cell.w_y=0;
			cell.w_z=0;
			cell.w=0;

			cell.coef_x=0;
			cell.coef_y= 0;
			cell.coef_z= 0;

			if(cell.capacity<=0){
				return;
			}
			var left = grid[idx-1];
			var right= grid[idx+1];
			var up= grid[idx-GRID_RES];
			var down= grid[idx+GRID_RES];
			var front= grid[idx-GRID_RES2];
			var back= grid[idx+GRID_RES2];

			var m_x = (cell.mass + right.mass) ;
			var m_y = (cell.mass + down.mass);
			var m_z = (cell.mass + back.mass);
			
			cell.m_x = m_x;
			cell.m_y = m_y;
			cell.m_z = m_z;

			if(m_x !==0){
				cell.w_x=1/m_x;
			}
			if(m_y !==0){
				cell.w_y=1/m_y;
			}
			if(m_z !==0){
				cell.w_z=1/m_z;
			}

			if(cell.capacity && right.capacity){
				cell.coef_x= (cell.capacity +right.capacity)*0.5;
			}
			if(cell.capacity && down.capacity){
				cell.coef_y= (cell.capacity +down.capacity)*0.5;
			}
			if(cell.capacity && back.capacity){
				cell.coef_z= (cell.capacity +back.capacity)*0.5;
			}

			cell.m_x*=cell.coef_x;
			cell.m_y*=cell.coef_y;
			cell.m_z*=cell.coef_z;

			cell.w_x*=cell.coef_x;
			cell.w_y*=cell.coef_y;
			cell.w_z*=cell.coef_z;

			if(left.w_x+cell.w_x+up.w_y+cell.w_y + cell.w_z + front.w_z===0){
				return;
			}

			cell.gap = (cell.mass- mass0*cell.capacity) * CELL_SIZE_dt;

			var w = (left.coef_x+cell.coef_x+up.coef_y+cell.coef_y + cell.coef_z + front.coef_z);
			if(w ===0){
				return;
			}
			this.grid_enable.push(cell);
			w = 1/w;
			
			cell.w=w;
			cell.m_x *= _six;
			cell.m_y *= _six;
			cell.m_z *= _six;

			if(cell.gap<0 || cell.capacity<1){
			  cell.pressure=0;
			}else{
				cell.pressure*=0.5;
			}
		});
	}
	liquidAfterProcess(dt){
		var grid = this.grid;
		var GRID_RES = this.grid_res;
		var GRID_RES2 = Math.pow(GRID_RES,2);

		this.grid_enable.forEach((cell)=>{
				var idx = cell.idx;
				var left = grid[idx-1];
				var right= grid[idx+1];
				var up= grid[idx-GRID_RES];
				var down= grid[idx+GRID_RES];
				var front= grid[idx-GRID_RES2];
				var back= grid[idx+GRID_RES2];

				cell.locationV[0]+=((left.pressure - cell.pressure)*left.w_x
				-(right.pressure - cell.pressure)*cell.w_x);
				cell.locationV[1]+=((up.pressure - cell.pressure)* up.w_y
				-(down.pressure - cell.pressure)*cell.w_y);
				cell.locationV[2]+=((front.pressure - cell.pressure)* front.w_z
				-(back.pressure - cell.pressure)*cell.w_z);

		});
	}

	calcGrid(dt){
		var grid = this.grid;
		//グリッド速度計算
		var gra =  G * dt;
		var grid_length = grid.length;
		for(var i=0;i<grid_length;i++){
			var cell = grid[i];

			if(cell.mass < 0.0001 || cell.fix){
				cell.mass = 0;
				cell._mass = 0;
				cell.locationV.fill(0);
				cell.pressure=0;
			}else{
				cell._mass = 1/cell.mass;
				cell.locationV[0] *=cell._mass;
				cell.locationV[1] *=cell._mass;
				cell.locationV[2] *=cell._mass;
				cell.locationV[1] -= gra;

				if(cell.mass>0.5){
					this.phash2[i]=true;
				}

				cell.mass *= Particle.prototype.mass;
				
			}
		
		}
	}
	g2p(dt,a){
		var phash = this.phash;
		var particles = this.particles;
		var minlimit = new Vec3();
		var maxlimit = new Vec3();
		var tani=[1,1,1];
		Vec3.mad(minlimit,this.location,tani,this.cell_size+this.particle_size);
		Vec3.add(maxlimit,this.location,this.field_size);
		Vec3.mad(maxlimit,maxlimit,tani,-this.cell_size-this.particle_size);

		var _dt = 1 / dt;

		//重なり防止
		var phash_length=phash.length;
		var SIZE = this.particle_size;
		var SIZE2 = Math.pow(SIZE,2);
		var GRID_RES = this.grid_res;
		var GRID_RES2 = Math.pow(GRID_RES,2);
		for(var i=0;i<phash_length;i++){
			var hash = phash[i];
			var hash_length = hash.length;
			for(var j=0;j<hash_length;j++){
				var p = hash[j];
				for(var k=j+1;k<hash_length;k++){
					var pk = hash[k];
					this.kasanariFunc(p,pk);

				}
				phash[i+1].forEach((pj)=>{this.kasanariFunc(p,pj)});
				phash[i+GRID_RES].forEach((pj)=>{this.kasanariFunc(p,pj)});
				phash[i+GRID_RES2].forEach((pj)=>{this.kasanariFunc(p,pj)});
				phash[i+GRID_RES2+GRID_RES].forEach((pj)=>{this.kasanariFunc(p,pj)});
				phash[i+1+GRID_RES].forEach((pj)=>{this.kasanariFunc(p,pj)});
				phash[i+1+GRID_RES2].forEach((pj)=>{this.kasanariFunc(p,pj)});
				phash[i+1+GRID_RES2+GRID_RES].forEach((pj)=>{this.kasanariFunc(p,pj)});
			}
		}
		//グリッドからパーティクルに反映

		for(var i=0;i<particles.length;i++){
			var p = particles[i];
			var B = p.C;
			if(p.idx>=0){
			
			var pv = p.locationV;
				B.fill(0);
				

				this.neighborhoods(p,this.g2pFunc);
				Mat33.mul(B,B,4);
			}
			

			for(var j=0;j<DIMENSION;j++){
				var old = p.location[j];
				p.location[j] += p.locationV[j] * dt;
				var limit = minlimit[j];
				if (p.location[j] <  limit){
				  p.location[j] = limit;
				  p.locationV[j] = (p.location[j] - old) * _dt;
				  //B.fill(0);
				}

				limit = maxlimit[j];
				if (p.location[j] > limit){
				  p.location[j] = limit;
				  p.locationV[j] = (p.location[j] - old) * _dt;
				  //B.fill(0);
				}
			}
		}

	}
	kasanariFunc(p,pk){
		var SIZE = this.particle_size;
		var SIZE2 = Math.pow(SIZE,2);
		var dx = p.location[0] - pk.location[0];
		var dy = p.location[1] - pk.location[1];
		var dz = p.location[2] - pk.location[2];
		if(dx*dx+dy*dy+dz*dz<SIZE2){
			//randomx = (3*randomx+ 1)&7;
			//var dx = (randomx-3)*0.0005;
			//var dy = (randomx-3)*0.0005;
			//var dz = (randomx-3)*0.0005;
			var l = dx*dx+dy*dy+dz*dz;
			if(l!==0){
				l = Math.sqrt(l);
				l = (SIZE-l)/l*10;
			}
			dx*=l;
			dy*=l;
			dz*=l;
			p.locationV[0]+=dx;
			p.locationV[1]+=dy;
			p.locationV[2]+=dz;
			pk.locationV[0]-=dx;
			pk.locationV[1]-=dy;
			pk.locationV[2]-=dz;
		}

	}
	g2pFunc(p,cell,weight,dx,dy,dz){
		var weighted_velocity_x = (cell.locationV[0] )* weight;
		var weighted_velocity_y = (cell.locationV[1] )* weight;
		var weighted_velocity_z = (cell.locationV[2] )* weight;
		p.locationV[0] += weighted_velocity_x;
		p.locationV[1] += weighted_velocity_y;
		p.locationV[2] += weighted_velocity_z;
		var B = p.C;


		B[0] += weighted_velocity_x * dx;
		B[1] += weighted_velocity_y * dx;
		B[2] += weighted_velocity_z * dx;
		B[3] += weighted_velocity_x * dy;
		B[4] += weighted_velocity_y * dy;
		B[5] += weighted_velocity_z * dy;
		B[6] += weighted_velocity_x * dz;
		B[7] += weighted_velocity_y * dz;
		B[8] += weighted_velocity_z * dz;
	};

	solvProcess(dt){
		var dp = new Vec3();
		var dv = new Vec3(); 
		var impulse = new Vec3();
		var grid = this.grid;
		var GRID_RES = this.grid_res;
		var GRID_RES2 = Math.pow(GRID_RES,2);

		//for(var k=0;k<SOLV_PER_STEP;k++){
			this.grid_enable.forEach((cell)=>{
				var idx = cell.idx;

				var left = grid[idx-1];
				var right= grid[idx+1];
				var up= grid[idx-GRID_RES];
				var down= grid[idx+GRID_RES];
				var front = grid[idx-GRID_RES2];
				var back = grid[idx+GRID_RES2];
				
				var gap=cell.gap -(
				-(left.locationV[0]  +cell.locationV[0]) *left.m_x
				+(right.locationV[0] +cell.locationV[0]) *cell.m_x
				-(up.locationV[1]    +cell.locationV[1]) *up.m_y
				+(down.locationV[1]  +cell.locationV[1]) *cell.m_y
				-(front.locationV[2] +cell.locationV[2]) *front.m_z
				+(back.locationV[2]  +cell.locationV[2]) *cell.m_z
				) ;


				cell.pressure =(
					+left.pressure    *left.coef_x
					+right.pressure   *cell.coef_x
					+ up.pressure     *up.coef_y
					+ down.pressure   *cell.coef_y
					+ front.pressure  *front.coef_z
					+ back.pressure   *cell.coef_z
					+ gap)*cell.w;

				cell.pressure = Math.max(cell.pressure,0);
			});

//			for (var i = 0;i<hit_count; i++) {
//				var hitInfo = hitInfos[i];
//
//				hitInfo.calcDiffVelocity(dv);
//				Vec3.add(dv,dv,hitInfo.offset);
//				var old = hitInfo.nImpulse;
//				hitInfo.nImpulse += Vec3.dot(dv, hitInfo.nVec) * hitInfo.nEffic + hitInfo.repulsion;
//				hitInfo.nImpulse = Math.max(hitInfo.nImpulse,0);
//
//				hitInfo.nImpulse*=0.99;
//				Vec3.mul(impulse, hitInfo.nVec, (hitInfo.nImpulse-old));
//				hitInfo.addImpulse(impulse);
//
//				hitInfo.calcDiffVelocity(dv);
//				var max = hitInfo.nImpulse * hitInfo.fricCoe;
//				old = hitInfo.tImpulse;
//				hitInfo.tImpulse += Vec3.dot(dv, hitInfo.tVec)* hitInfo.tEffic;
//				if (hitInfo.tImpulse > max) {
//					hitInfo.tImpulse = max;
//				}
//				if (hitInfo.tImpulse < -max) {
//					hitInfo.tImpulse = -max;
//				}
//				Vec3.mul(impulse, hitInfo.tVec, (hitInfo.tImpulse-old));
//				hitInfo.addImpulse(  impulse);
//			}
		//}


	}

	//粘性計算(怪しい)
	calcViscosity(dt){
		var GRID_RES = this.grid_res;
		var grid  = this.grid;

		for(var j=1;j<GRID_RES-1;j++){
			for(var i=1;i<GRID_RES-1;i++){
				var idx = j*GRID_RES+i;
				var cell = grid[idx];
				if(cell.mass===0){
					continue;
				}
				var left = grid[idx-1];
				var right= grid[idx+1];
				var up= grid[idx-GRID_RES];
				var down= grid[idx+GRID_RES];
				var w = left.mass + right.mass + up.mass+down.mass + cell.mass;
				if(w===0 || cell.mass===0){
					Vec3.mul(v2,cell.locationV,1);
					continue;
				}
				w=1/w;

				var v2 = cell.locationV2;

				Vec3.mul(v2,cell.locationV,cell.mass);
				Vec3.mad(v2,v2,left.locationV,left.mass);
				Vec3.mad(v2,v2,right.locationV,right.mass);
				Vec3.mad(v2,v2,up.locationV,up.mass);
				Vec3.mad(v2,v2,down.locationV,down.mass);
				Vec3.mul(v2,v2,w);

			}
		}
		for(var j=1;j<GRID_RES-1;j++){
			for(var i=1;i<GRID_RES-1;i++){
				var idx = j*GRID_RES+i;
				var cell = grid[idx];
				var ro = DENSITY;//cell.mass * DENSITY/mass0;
				if(ro<=0.01){
					continue;
				}
				var nyu = visconsity/ ro ;// m^2/s
				nyu *= dt ;
				//nyu=0;

				Vec3.sub(cell.locationV2,cell.locationV2,cell.locationV);
				Vec3.mad(cell.locationV,cell.locationV,cell.locationV2,nyu);

			}
		}
	}

};

var G = 9.8; //重力加速度 9.8m/s
var STEP_PER_FRAME=1; //1フレームあたりのステップ数 でかいほど良いがCPU負荷がかかる
var SOLV_PER_STEP =20; //1ステップでの圧力計算の繰り返し数
var DT = 1/60; //1フレームに進める時間
var DENSITY = 1000; //粒子密度 1000kg/m^3

var visconsity=1;//粘性  N・s/m2

var ERP= 0.1;//めり込み補正値

var rigid_id=1;
var RigidBody = function(size,density) {
	this.id = rigid_id;
	rigid_id++;
	this.location = new Vec3();
	this.locationV = new Vec3();
	this.rotation = 0;
	this.rotationV = 0;
	this.size = size; 
	this.mass = density*this.size*this.size*Math.PI; 
	this.moment = 2.0 / 5.0 * this.mass * this.size * this.size;
	this.inv_mass = 1.0 / this.mass; 
	this.inv_moment = 1.0 / this.moment; 
	this.inv_restCoe = 1.0/0.2; 
	this.fricCoe = 0.2; 
	this.type=0;
	this.hitflg=3;

	if(density<0){
		this.mass=99999999;
		this.moment=99999999;
		this.inv_mass=0;
		this.inv_moment=0;
		this.fix=true;
	}else{
		this.fix=false;
	}
}
RigidBody.prototype.addImpulse=function(pos,impulse){
	if (this.inv_mass > 0) {
	Vec3.mad(this.locationV,this.locationV,impulse, this.inv_mass);
	this.rotationV += Vec3.cross(pos, impulse) * this.inv_moment;
	}
}
RigidBody.prototype.calcVel=function(vel,pos){
	vel[0] =this.locationV[0];
	vel[1] =this.locationV[1];
	vel[0] += -pos[1] * this.rotationV;
	vel[1] +=  pos[0] * this.rotationV;
}
var HitInfo = function() {
	this.obj1 = null;
	this.obj2 = null;
	this.pos1 = new Vec3();
	this.pos2 = new Vec3();
	this.nVec = new Vec3();
	this.offset=new Vec3();
	this.nEffic = 0;
	this.nImpulse = 0; 
	this.tVec = new Vec3();
	this.tEffic= 0;
	this.tImpulse = 0; 
	this.restCoe = 0; 
	this.fricCoe = 0;
}
HitInfo.prototype.calcEffic =function(n) {
	var obj1 = this.obj1;
	var obj2 = this.obj2;
	var t = Vec3.cross(n, this.pos1);
	var d = t * t * obj1.inv_moment;
	t = Vec3.cross(n, this.pos2);
	if(obj2.type===0){
		d += t * t * obj2.inv_moment;
		return 1 / (obj1.inv_mass + obj2.inv_mass + Vec3.dot(n, this.tVec) * d);
	}else{
		return 1 / (obj1.inv_mass + obj2.inv_mass);
	}
}

var vel2=new Vec3();
HitInfo.prototype.calcDiffVelocity=function(dv){
	var obj1 = this.obj1;
	var obj2 = this.obj2;
	obj1.calcVel(dv,this.pos1);
	obj2.calcVel(vel2,this.pos2);
	Vec3.sub(dv,vel2,dv);
}


HitInfo.prototype.addImpulse=function(impulse){
	var obj1 = this.obj1;
	var obj2 = this.obj2;

	obj1.addImpulse(this.pos1,impulse);
	Vec3.mul(impulse,impulse,-1);
	obj2.addImpulse(this.pos2,impulse);
	Vec3.mul(impulse,impulse,-1);
}
var impulseBuf = function() {
	this.id0 = 0;
	this.id1 = 0;
	this.nImpulse = 0;
	this.tImpulse = 0;
}

var hitInfos = [];
var hit_count=0;
for (var i = 1024; i--;) {
	hitInfos.push(new HitInfo());
}

var rigid_bodies = [];



var Cell= function(){
	this.locationV = new Vec3();
	this.locationV2 = new Vec3();
	this.mass = 0;
	this.gap = 0;
	this.pressure=0;
	this.fix=false;
	this.w_x=0;
	this.w_y=0;
	this.w_z=0;
	this.m_x=0;
	this.m_y=0;
	this.m_z=0;
	this.coef_x=0;
	this.coef_y=0;
	this.coef_z=0;

	this.capacity=1;
	this.count=0;
	this.hitcount=0;
	this.edge=0;

}




var randomx=1;


