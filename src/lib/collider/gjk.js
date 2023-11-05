import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import Geono from "../geono.js"
	//GJKとEPA

class closestFace{
	constructor(){
		this.v=new Int32Array(3);
		this.cross = new Vec3();
		this.len = 0;
	}
}
var vertices=[];
var vertices1=[];
var faces=[];
var edges=[];
var edgesIndex;
var faceIndex;
var idx;
for(var i=0;i<256;i++){
	vertices.push(new Vec3());
	vertices1.push(new Vec3());
	faces.push(new closestFace());
	var edge=new Int32Array(2);//[-1,-1];
	edges.push(edge);
}


var line_zero_vec3 =new Vec3();
var line_zero = function(ans,l1,l2){
	//線分と原点との最近点を求める
	var ret;
	var dir =line_zero_vec3;
	Vec3.sub(dir,l2,l1); //線分の向き
	var r = -Vec3.dot(dir,l1);
	if(r <= 0){
		//始点未満
		Vec3.copy(ans,l1);
		ret=-1;
	}else{
		var r2 = Vec3.scalar2(dir);
		if( r > r2){
			//終点超え
			Vec3.copy(ans,l2);
			ret=1;
		}else{
			Vec3.madd(ans,l1,dir, r/r2);
			ret=0;
		}
	}
	return ret;
}
var triangleCheck=function(t1,t2,t3){
	//三角形上に原点があるか
	//ある/0   ない/2,4,6
	var cross = Vec3.alloc();
	var cross2 = Vec3.alloc();

	Vec3.cross2(cross,t1,t2,t3);

	var ts=[t1,t2,t3,t1];
	var ret=0;

	for(var i=0;i<3;i++){
		var v1 = ts[i];
		var v2 = ts[i+1];
		Vec3.sub(cross2,v2,v1);
		Vec3.cross(cross2,cross,cross2);
		if(Vec3.dot(cross2,v1)>0){
			ret=(i+1)<<1;
			break;
		}
	}
	Vec3.free(2);
	return ret;

}

var triangle_zero=function(ans,t1,t2,t3){
	//三角と原点の最近点を求める
	var dir = Vec3.alloc(); 
	var cross = Vec3.alloc();
	Vec3.cross2(cross,t1,t2,t3);

	var ts=[t1,t2,t3,t1,t2];

	var res =triangleCheck(t1,t2,t3);
	if(res===0){
		//面の上にいる場合
		Vec3.mul(ans,cross,Vec3.dot(cross,t1)/Vec3.scalar2(cross));
	}else{
		//辺の外側にいる場合
		var r = (res>>1) -1;

		var v1 = ts[r];
		var v2 = ts[r+1];
		var v3 = ts[r+2];
		Vec3.sub(dir,v2,v1); //線分の向き

		var l=-Vec3.dot(v1,dir);
		var _l=Vec3.dot(dir,dir);
		if(l<0){
			//辺の始点より外の場合
			res+=line_zero(ans,v1,v3);

		}else  if(l>_l){
			//辺の終点より外の場合
			res+=line_zero(ans,v3,v2);
		}else{
			Vec3.madd(ans,v1,dir,l/_l);
		}
		
	}
	Vec3.free(2);
	return res;

}
var addFace = function(v1,v2,v3){
	//EPAで使う
	var vs = vertices;
	var face;
	var i;
	for(i=0;i<faceIndex;i++){
		if(faces[i].len<0){
			break;
		}
	}
	if(i===faceIndex){
		faceIndex++;
	}
	face=faces[i];

	//現状4つの距離を計算
	Vec3.setValue(face.v,v1,v2,v3);
	Vec3.cross2(face.cross,vs[v1],vs[v2],vs[v3]);
	Vec3.norm(face.cross);
	face.len = Vec3.dot(face.cross,vs[v1]);

	if(face.len<0){
		face.len*=-1;
		Vec3.mul(face.cross,face.cross,-1);
	}

	return face;
}
for(var i=0;i<128;i++){
	var edge=[-1,-1];
	edges.push(edge);
}
var addEdge = function(v1,v2){
	for(var j=0;j< edgesIndex;j++){
		if((edges[j][0]===v1 && edges[j][1]===v2)
		|| (edges[j][0]===v2 && edges[j][1]===v1)){
			//既に同一エッジがある場合は追加せず既存のも無効化
			edges[j][0]=-1;
			return;
			
		}
	}
	//無効インデックスを探す
	for(var j=0;j< edgesIndex;j++){
		if(edges[j][0]<0){
			break;
		}
	}
	if(j>=edgesIndex){
		//エッジ増えたらインデックスを増やす
		edgesIndex++;
	}
	var edge=edges[j];
	edge[0]=v1;
	edge[1]=v2;
}
var calcClosestPrimitive = function(ans1,ans2,obj1,obj2){
	var s= Vec3.alloc();
	var s1= Vec3.alloc();
	var vbuf= Vec3.alloc();
	var axis= Vec3.alloc();
	var v=vertices; //ミンコフスキー差の座標
	var v1=vertices1; //obj2の座標 (v-v1でobj1の座標)
	var distance=-1;
	var next_change_idx=-1;//次に入れかえる頂点のインデックス

	//中心
	Vec3.add(axis,obj1.aabb.min,obj1.aabb.max);
	Vec3.sub(axis,axis,obj2.aabb.min);
	Vec3.sub(axis,axis,obj2.aabb.max);
	Vec3.mul(axis,axis,-0.5);


	//1個目の頂点を取る
	obj1.calcSupport(v1[0],axis);
	obj2.calcSupportReverse(v[0],axis);
	Vec3.sub(v[0],v1[0],v[0]);
	Vec3.copy(axis,v[0]);
	idx=1;
	next_change_idx=1;

	var counter=0;
	var hitflg=false ;
	while(1){
		//axisの向きで一番近い点をとる
		obj1.calcSupportReverse(s1,axis);
		obj2.calcSupport(s,axis);
		Vec3.sub(s,s1,s);

		//現状の最短を求める
		var min=Vec3.dot(v[0],axis);
		for(var i=1;i<idx;i++){
			var l =Vec3.dot(v[i],axis);
			if(l<min){
				min=l;
			}
		}

		if(Vec3.dot(s,axis)>=min-0.0000001){
			//取得した点が最短と同じなら外判定
			break;
		}

		Vec3.copy(v[next_change_idx],s);
		Vec3.copy(v1[next_change_idx],s1);

		if(idx<4){
			idx++;
		}

		//現在の取得点から目標点までの最短点を求める
		if(idx===2){
			line_zero(axis,v[0],v[1]);

			min=Vec3.scalar2(axis);
			if(min===0){
				//接触している場合は適当に垂直な方向をとる
				axis[0]=-(v[0][1]-v[1][1]);
				axis[1]=v[0][2]-v[1][2];
				axis[2]=v[0][0]-v[1][0];

			}
			if(Vec3.dot(axis,v[0])<0){
				Vec3.mul(axis,axis,-1);
			}
			next_change_idx=2;
		}else if(idx===3){

	//		Vec3.cross(axis,v[0],v[1],v[2]);

			triangle_zero(axis,v[0],v[1],v[2]);
			min=Vec3.scalar2(axis);
			if(min===0){
				//接触している場合は適当に垂直な方向をとる
				Vec3.cross2(axis,v[0],v[1],v[2]);
				if(Vec3.dot(axis,v[0])<0){
					Vec3.mul(axis,axis,-1);
				}
			}
			next_change_idx=3;
		}else{
			next_change_idx =0;
			var min=-1;
			for(var i=0;i<4;i++){
				//四面体それぞれの面に対して計算
				var t4=v[i];
				var t1=v[(i+1)&3];
				var t2=v[(i+2)&3];
				var t3=v[(i+3)&3];
				Vec3.cross2(vbuf,t1,t2,t3); //面の法線
				var l1=Vec3.dot(t1,vbuf); //原点から面までの距離
				var l2=Vec3.dot(t4,vbuf)-l1; //面からもうひとつの頂点までの距離
				//if(l1*l2===0){
				//	next_change_idx=i;
				//	Vec3.copy(axis,vbuf);
				//	if(l1<0){
				//		Vec3.mul(axis,axis,-1);
				//	}
				//	break;
				//}

				if( l1*l2>0){
					//四面体に内包されない
					var l=triangle_zero(vbuf,t1,t2,t3);
					var m=Vec3.scalar2(vbuf);
					if(min<0 || m<min ){
						min=m;
						next_change_idx = i;
						Vec3.copy(axis,vbuf);
					}
				}
			}
			if(min<0){
				//内包する場合終了
				hitflg=true;
				break;
			}
			//next_change_idx =farIndex ;

		}

		//無限ループ対策
		counter++;
		if(counter === 32){
			console.log("gjk!!");
		}
		if(counter>33){
			console.log("loooop!!");
			break;
		}

	}

	if(!hitflg){
		//内包してない場合の処理
		distance=Vec3.scalar(axis);

		if(ans1 && ans2){
			var ans=new Vec3();
			//両オブジェクトの最近点算出
			if(idx===1){
				//頂点が1個の場合はそれぞれの頂点が最近点
				Vec3.copy(ans1,v1[0]);
				
			}else if(idx===2){
				Geono.lineWeight(ans,axis,v[0],v[1]);
				Vec3.setValue(ans1,0,0,0);
				for(var i=0;i<3;i++){
					Vec3.madd(ans1,ans1,v1[i],ans[i]);
				}
			}else{
				if(idx===4){
					Vec3.copy(v[next_change_idx],v[3]);
					Vec3.copy(v1[next_change_idx],v1[3]);
				}
				Geono.triangleWeight(ans,axis,v[0],v[1],v[2]);
				Vec3.setValue(ans1,0,0,0);
				for(var i=0;i<3;i++){
					Vec3.madd(ans1,ans1,v1[i],ans[i]);
				}
			}
			Vec3.sub(ans2,ans1,axis);
		}
		
	}else if(ans1 || ans2){
		if(idx<3){
			console.log("AAA");
		}
		//内包する場合
		//EPA
		faceIndex=0;
		idx=4;
		counter=0;
		for(var i=0;i<4;i++){ 
			//現状4つの面を追加
			addFace(i,(i+1)&3,(i+2)&3);
		}
		var face;
		var min;
		while(1){
			//最短面探索
			for(var i=0;i<faceIndex;i++){
				if(faces[i].len>=0){
					face=faces[i];
					min=face.len;
					break;
				}
			}
			for(;i<faceIndex;i++){
				if(faces[i].len<min && faces[i].len>=0){
					face=faces[i];
					min=face.len;
				}
			}

			//サポ射
			obj1.calcSupport(s1,face.cross);
			obj2.calcSupportReverse(s,face.cross);
			Vec3.sub(s,s1,s);


			//新たに取得した頂点距離が最短面との距離と同じだった場合は終了
			if(Vec3.dot(s,face.cross) < face.len + 0.0000001){
				
				break;
			}

			//終了しなかった場合はその点を追加
			Vec3.copy(v[idx],s);
			Vec3.copy(v1[idx],s1);

			edgesIndex=0;
			for(var i=0;i<faceIndex;i++){
				//追加した頂点に関係する面を探す
				var face=faces[i];
				if(face.len<0){
					//無効面はスルー
					continue;
				}
				//Vec3.sub(vbuf,s,v[face.v[0]]);
				if(Vec3.dot(s,face.cross) - face.len>0.0000001){
					//面のエッジを追加
					addEdge(face.v[0],face.v[1]);
					addEdge(face.v[1],face.v[2]);
					addEdge(face.v[2],face.v[0]);
					//face削除
					face.len2=face.len;
					face.len=-1;
				}
			}
			var edgeflg=true;
			for(var i=0;i<edgesIndex;i++){
				if(edges[i][0]<0){
					continue;
				}
				//新たなfaceを追加、
				addFace(edges[i][0],edges[i][1],idx);
				edgeflg=false;
			}
			if(edgeflg){
				break;
				//Vec3.free(4);
//				return 1000000;
			}
			idx++;


			//無限ループ対策
			counter++;
			if(counter === 32){
				console.log("epa!!");
			}
			if(counter>33){
				console.log("loooop!!");
				Vec3.free(4);
				return 1000000;
			}
		}

		//両三角のめり込み点を求める
		Vec3.mul(axis,face.cross,face.len);
		var ans = new Vec3();
		Geono.triangleWeight(ans,axis,v[face.v[0]],v[face.v[1]],v[face.v[2]]);
		Vec3.setValue(ans1,0,0,0);
		for(var i=0;i<3;i++){
			Vec3.madd(ans1,ans1,v1[face.v[i]],ans[i]);
		}

		Vec3.sub(ans2,ans1,axis);
		distance=-face.len;
	}else{
		console.log("ARIENAI");
	}
	Vec3.free(4);
	return distance;
};
export default calcClosestPrimitive;
