
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import Collision from "./collision.js"
import Collider from "./collider.js"
import Sphere from "./sphere.js"
import convexCast from "./convexcast.js"
var sphere=new Sphere();
Mat43.setValue(sphere.matrix,1,0,0,0,1,0,0,0,1,0,0,0);
sphere.bold=0;
export default class ConvexHull extends Collision{
		//凸包
		constructor(){
			super();
			this.type=Collision.CONVEX_HULL;
			//this.mesh=null; //メッシュ情報
			this.poses=[]; //頂点座標
		}

		calcSupport(ans,_v){
			var n=0;
			var poses=this.poses;
			var v = Vec3.alloc();
			Mat33.dotVec3(v,this.inv_matrix,_v);
			var l = Vec3.dot(v,poses[n]);
			for(var i=1;i<poses.length;i++){
				var l2 = Vec3.dot(v,poses[i]);
				if(l2>l){
					l=l2;
					n=i;
				}
			}
			//Vec3.copy(ans,poses[n]);
			Mat43.dotVec3(ans,this.matrix,poses[n]);

			Vec3.free(1);
		}

		rayCast(p0,p1,normal){
			sphere.matrix[9]=p0[0];
			sphere.matrix[10]=p0[1];
			sphere.matrix[11]=p0[2];
			sphere.refresh();
			var ang=Vec3.alloc();
			Vec3.sub(ang,p1,p0);
			var l =convexCast(ang,sphere,this,normal);
			Vec3.free(1);

			return l;
		};
	}
