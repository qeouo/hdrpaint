
import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "./vector.js"
import Sort from "./sort.js"
var searchCount=0;
class Tree{
	constructor(){
		this.nodes=[];
		this.rootNode;
	}
	getItem(p){
		searchCount=0;
		var result = this.rootNode.getItem(p);
		this.searchCount=searchCount;

		return result;
	}
	_createBspTree(first,last,pAxis){
		//指定範囲の葉ノードを枝分けする

		var nodes = this.nodes;
		var node;
		if(first === last){
			//1個だけの場合はそのまま葉ノードを使う
			node = nodes[first];
		}else{
			//二個以上ある場合は枝ノード作って追加する
			node = new Bsp.Node();
			this.nodes.push(node);
		}

		//範囲内の要素を内包？する指定法線の平面を求める
		var m = nodes[first].element.calcSupportReverse(pAxis);
		var ii=0;
		for(var i=first+1;i<=last;i++){
			var mm = nodes[i].element.calcSupportReverse(pAxis);
			if(mm<m){
				m=mm;
				ii=i;
			}
		}
		node.collision.m=m;
		Vec3.copy(node.collision.v,pAxis);

		if(first === last){
			//1個だけの場合は葉ノード返す
			return node;
		}

		var center = (last+first)/2|0; //中央インデックス
		var axis2 = new Vec3();
		var axis = new Vec3();

		//指定範囲の四面体の各面の法線で分割して一番いいやつの法線を採用する
		var min=-99999;
		for(var i=first;i<=last;i++){
			var t=nodes[i].element;
			for(var j=0;j<4;j++){
				//Vec3.cross2(axis,t.p[j],t.p[(j+1)&3],t.p[(j+2)&3]);
				Vec3.normalize(axis,t.bsps[j].v);
				for(var k=first;k<=last;k++){
					var n = nodes[k];
					n.rsupport = n.element.calcSupportReverse(axis);
					n.support = n.element.calcSupport(axis);
				}
				Sort.qSort(nodes,first,last,function(a,b){
					var res = a.rsupport  - b.rsupport
					if(res){
						return res;
					}
					return a.support -b.support;
				});

				Vec3.mul(axis,axis,-1);
				var a = nodes[first].element.calcSupportReverse(axis);
				var kkk=0
				for(var k=first+1;k<=center;k++){
					var aa = nodes[k].element.calcSupportReverse(axis);
					if(aa<a){
						a = Math.min(a,aa);
						kkk=k;
					}
				}
				a= nodes[center+1].collision.m+a;
				if(min<a){
					//より良い軸に変更
					min=a;
					Vec3.mul(axis2,axis,-1);
				}
			}
		}

		for(var k=first;k<=last;k++){
			var n = nodes[k];
			n.rsupport = n.element.calcSupportReverse(axis2);
			n.support = n.element.calcSupport(axis2);
		}
		Sort.qSort(nodes,first,last,function(a,b){
			var res = a.rsupport  - b.rsupport
			if(res){
				return res;
			}
			return a.support -b.support;
		});

		node.child2=this._createBspTree(center+1,last,axis2);

		Vec3.mul(axis2,axis2,-1);
		node.child1=this._createBspTree(first,center,axis2);

		return node;
	}
}
class Node{
	constructor(){
		this.child1=null;
		this.child2=null;
		this.element=null;
		this.collision = new Bsp();
	}
	getItem(p){
		searchCount++;

		if(this.element){
			//if(Geono.TETRA_POINT(null,p,this.element.p)){
			//	return this.element;
			//}
			var bsps=this.element.bsps;
			for(var i=0;i<4;i++){
				if(Vec3.dot(bsps[i].v,p)-bsps[i].m< 0){
					return null;
				}
			}
			return this.element;
		}else{
			if(!this.collision.hitCheck(p)){
				return null;
			}
		}
		var result = this.child1.getItem(p);
		if(result)return result;
		return this.child2.getItem(p);
	}
}
export default class Bsp{
	constructor(){
		this.m = 0;//平面と原点との距離
		this.v =new Vec3();//平面の法線
	}

	hitCheck(p){
		return this.m <=Vec3.dot(p,this.v);
	}

	static createBspTree(items){
		var tree=new Bsp.Tree();

		var n = new Vec3();
		for(var i=0;i<items.length;i++){
			var node = new Bsp.Node();
			node.element=items[i];
			tree.nodes.push(node);
			var t=items[i];
			var bsps=t.bsps=[];

			for(var j=0;j<4;j++){
				//4つの面それぞれから対象までの距離を求める
				var t1=t.p[(j+1)&3];
				var t2=t.p[(j+2)&3];
				var t3=t.p[(j+3)&3];
				var t4=t.p[j];

				Vec3.cross2(n,t3,t2,t1);
				var l1=Vec3.dot(n,t1); //原点から面までの長さ
				var l2=Vec3.dot(n,t4); //原点から対頂点までの長さ
				l2 = 1.0/(l2-l1);
				var bsp = new Bsp();
				Vec3.mul(bsp.v,n,l2);
				bsp.m=l1*l2;
				bsps.push(bsp);

			}

		}
		
		var axis=new Vec3(1,0,0);
		tree.rootNode=tree._createBspTree(0,tree.nodes.length-1,axis);
		return tree;
	}
}
Bsp.Tree = Tree;
Bsp.Node = Node;
