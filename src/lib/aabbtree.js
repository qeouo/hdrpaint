import AABB from "./aabb.js"
import Sort from "./sort.js"
import TreeNode from "./treenode.js"
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "./vector.js"

function _createAABBTree(list,first,last,axis){
		if(first === last){
			return list[first];
		}
		var node = new TreeNode();
		node.aabb = new AABB();
		Sort.qSort(list,first,last,function(a,b){return a.aabb.min[axis] - b.aabb.min[axis]});
		var center = (last+first)/2|0;


		axis=[1,2,0][axis];
		node.children[0]=_createAABBTree(list,first,center,axis);
		node.children[1]=_createAABBTree(list,center+1,last,axis);
		node.element=null;
		AABB.add(node.aabb,node.children[0].aabb,node.children[1].aabb);

		return node;
	}

function _createBspTree(list,first,last,axis,axis2){
		if(first === last){
			return list[first];
		}
		var node = new TreeNode();

		node.aabb = new AABB();
		Sort.qSort(list,first,last,function(a,b){return a.aabb.min[axis] - b.aabb.min[axis]});
		var center = (last+first)/2|0;

		node.axis = new Vec3();
		if(axis2){
			node.axis.set(axis2);
		}

		axis=[1,2,0][axis];
		var a = new Vec3();
		a[axis]=1;
		node.children[0]=_createBspTree(list,first,center,axis,a);
		a[axis]=-1;
		node.children[1]=_createBspTree(list,center+1,last,axis,a);
		node.element=null;
		AABB.add(node.aabb,node.children[0].aabb,node.children[1].aabb);

		node.aabb.calcSupport(a,node.axis);
		node.len = Vec3.dot(a,node.axis);

		return node;
	}

export default class AABBTree{
	constructor(){
		this.root;
	}

	static createAABBTree(list){
		//return _createBspTree(list,0,list.length-1,0);
		return _createAABBTree(list,0,list.length-1,0);
	}

};

