
import AABB from "../aabb.js"
import AABBTree from "../aabbtree.js"
import TreeNode from "../treenode.js"
import Collider from "./collider.js"
import ConvexHull from "./convexhull.js";
import Geono from "../geono.js";
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import convexCast from "./convexcast.js"


var convex_buffer= [];
for(var i=0;i<2;i++){
	var convex = new ConvexHull();
	convex.poses=new Array(3);
	convex_buffer.push(convex);
}
var convex_buffer_index=0;

export default class Mesh extends ConvexHull{
	//メッシュ
	constructor(){
		//メッシュ
		super();
		this.type=Collider.MESH;
		this.triangles=[]; //三角ポリゴンセット
		this.aabbTreeRoot= null;
	};

	createTree(){
		var triangle = convex_buffer[0];
		//三角AABB
		var nodes = [];
		var defmat = new Mat43();
		triangle.matrix  =  defmat;
		triangle.inv_matrix  = defmat;

		this.triangles.forEach((e)=>{
			var node = new TreeNode();
			node.aabb = new AABB();
			node.element=e;
			nodes.push(node);

			triangle.poses=e;
			triangle.calcAABB(node.aabb);
			
		});

		this.aabbTreeRoot=AABBTree.createAABBTree(nodes);
	}

	hitCheck(ans1,ans2,col){
		var min=999999999;
		var ansA = Vec3.alloc();
		var ansB = Vec3.alloc();
		var norm = Vec3.alloc();

		var triangle = convex_buffer[convex_buffer_index];
		triangle.matrix = this.matrix;
		triangle.inv_matrix = this.inv_matrix;
		convex_buffer_index++;

		var mat43 = Mat43.alloc();
		var inv_mat43 = Mat43.alloc();
		
		Mat43.dot(mat43,this.inv_matrix,col.matrix);
		Mat43.dot(inv_mat43,col.inv_matrix,this.matrix);

		var aabb  = AABB.alloc();
		var matref=col.matrix;
		var invref=col.inv_matrix;
		col.matrix=mat43;
		col.inv_matrix=inv_mat43;
		col.calcAABB(aabb);
		col.matrix=matref;
		col.inv_matrix=invref;

		Mat43.free(2);

		//this.triangles.forEach((e)=>{

		//		triangle.poses=e;
		//		triangle.calcAABB();
		//		var l=Collider.calcClosestWithoutBold(ansA,ansB,triangle,col);
		//		if(l<min){
		//			Vec3.cross2(norm,triangle.poses[0],triangle.poses[1],triangle.poses[2]);
		//			Mat33.dotVec3(norm,triangle.matrix,norm);
		//			//if(Vec3.dot(norm,ansA)>Vec3.dot(norm,ansB)){
		//				min=l;
		//				ans1.set(ansA);
		//				ans2.set(ansB);
		//			//}
		//		}
		//});
		this.aabbTreeRoot.find((node)=>{
			if(!AABB.hitCheck(node.aabb,aabb)){
				return 1;
			}

			if(node.element){
				var e = triangle;
				var poses = node.element;
				triangle.poses=node.element;
				e.calcAABB();
				var l=Collider.calcClosestWithoutBold(ansA,ansB,e,col);
				if(l<min){
					Vec3.cross2(norm,triangle.poses[0],triangle.poses[1],triangle.poses[2]);
					Mat33.dotVec3(norm,triangle.matrix,norm);
					//if(Vec3.dot(norm,ansA)>Vec3.dot(norm,ansB)){
						min=l;
						ans1.set(ansA);
						ans2.set(ansB);
					//}
				}
			}
			return 0;
			
			
		});
		convex_buffer_index--;

		Vec3.free(3);
		AABB.free(1);
		return min;
	}


	rayCast(_p0,_p1,normal) {
		var min=Collider.INVALID;
		var norm=Vec3.alloc();
		var p0 = Vec3.alloc();
		var p1 = Vec3.alloc();
		Mat43.dotVec3(p0,this.inv_matrix,_p0);
		Mat43.dotVec3(p1,this.inv_matrix,_p1);
		var count = 0;
		var lineaabb =  AABB.alloc();
		for(var i=0;i<3;i++){
			lineaabb.min[i] = Math.min(p0[i],p1[i]);
			lineaabb.max[i] = Math.max(p0[i],p1[i]);

		}

		this.aabbTreeRoot.find((e)=>{
			count++;
			if(!AABB.hitCheck(e.aabb,lineaabb)){
				return 1;
			}
			var res = AABB.hitCheckLine(e.aabb,p0,p1);

			if(AABB.result<0){
				//aabbにすらヒットしない
				return 1;
			}
			if(res>min && min !== Collider.INVALID){
				//aabbにすらヒットしない
				return 1;
			}

			if(!e.element){
				return 0;
			}

			//var l=node.element.rayCast(p0,p1,norm);
			var pos = e.element;
			var t0=pos[0];
			var t1=pos[1];
			var t2=pos[2];
			var l = Geono.TRIANGLE_LINE(t0,t1,t2,p0,p1);
			if((l<min || min<0)&& l>0){
				min=l;
				if(normal){
					Vec3.cross2(normal,t0,t1,t2);
					Mat33.dotVec3(normal,this.matrix,normal);
					Vec3.norm(normal);
				}

			}
			
			
			return 0;
		});
		//this.triangles.forEach((e)=>{
		//		var pos = e;
		//		var t0=pos[0];
		//		var t1=pos[1];
		//		var t2=pos[2];
		//		var l = Geono.TRIANGLE_LINE(t0,t1,t2,p0,p1);
		//		if((l<min || min<0)&& l>0){
		//			min=l;
		//			if(normal){
		//				Vec3.cross2(normal,t0,t1,t2);
		//				Mat33.dotVec3(normal,this.matrix,normal);
		//				Vec3.norm(normal);
		//			}

		//		}
		//		
		//});

		Vec3.free(3);
		AABB.free(1);
		return min;
	}

	convexCast(t,col,ans1,ans2){
		var min=99999;

		var triangle = convex_buffer[convex_buffer_index];
		triangle.matrix = this.matrix;
		triangle.inv_matrix = this.inv_matrix;
		convex_buffer_index++;
		var ansA = Vec3.alloc();
		var ansB = Vec3.alloc();
		var _t = Vec3.alloc();
		var normal = Vec3.alloc();

		Mat33.dotVec3(_t,this.inv_matrix,t);


		//対象オブジェクトから判定用AABBを作成する
		var mat43 = Mat43.alloc();
		var inv_mat43 = Mat43.alloc();
		
		Mat43.dot(mat43,this.inv_matrix,col.matrix);
		Mat43.dot(inv_mat43,col.inv_matrix,this.matrix);

		var aabb  = AABB.alloc();
		var matref=col.matrix;
		var invref=col.inv_matrix;
		col.matrix=mat43;
		col.inv_matrix=inv_mat43;
		col.calcAABB(aabb);
		col.matrix=matref;
		col.inv_matrix=invref;

		Mat43.free(2);
		var lineaabb  = AABB.alloc();

		Vec3.sub(lineaabb.min,aabb.min,_t);
		Vec3.sub(lineaabb.max,aabb.max,_t);
		AABB.add(lineaabb,lineaabb,aabb);

		var count=0;
		this.aabbTreeRoot.find((e)=>{
			count++;

			if(!AABB.hitCheck(e.aabb,lineaabb)){
				return 1;
			}

			var res = AABB.aabbCast(_t,e.aabb,aabb);
			if(AABB.result <0){
				return 1;
			}

			if(res>min){
				return 1;
			}
			if(!e.element){
				return 0;
			}

			triangle.poses=e.element;
			triangle.calcAABB();
			var l=convexCast(t,triangle,col,ansA,ansB);
			if((l<min) && l !== Collider.INVALID ){
				Vec3.cross2(normal,triangle.poses[0],triangle.poses[1],triangle.poses[2]);
				if(Vec3.dot(normal,ansB)<0){
					min=l;
					ans1.set(ansA);
					ans2.set(ansB);
				}
			}
			return 0;
		});

		//this.triangles.forEach((e)=>{
		//	triangle.poses=e;
		//	triangle.calcAABB();
		//	var l=convexCast(t,triangle,col,ans1,ans2);
		//	if((l<min || min == Collider.INVALID) && l !== Collider.INVALID){
		//		min=l;
		//		ans1.set(ansA);
		//		ans2.set(ansB);
		//	}
		//});
		Vec3.free(4);
		convex_buffer_index--;

		if(min>=99999){
			min=Collider.INVALID;
		}
		AABB.free(2);
		return min;
		
	}
};
