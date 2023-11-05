import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import Geono from "../geono.js"
import Collider from "./collider.js"
const DIMENSION = 3;
const INVALID = -9999999; //無効値

var TRIANGLE_LINE=function(p1,t0,t1,t2){
	//原点からの直線が三角と交差するかどうか
	var cross=Vec3.alloc();
	var dt=Vec3.alloc();
	var ret=0;
	Vec3.sub(dt,t1,t0);

	var vs=[t0,t1,t2,t0,t1];
	for(var j=0;j<3;j++){
		Vec3.cross(cross,p1,dt); //線と辺に垂直なベクトル
		Vec3.sub(dt,vs[j+2],vs[j+1]);
		if(Vec3.dot(cross,vs[j])*Vec3.dot(cross,dt)>0){
			//辺の外の場合はずれ
			ret |= (1<<j);
			break;
		}
	}
	Vec3.free(2);
	return ret;
}
function convexCast(_t,o1,o2,ans1,ans2){
	//凸包o1をo2にt方向にぶつける


	if(Vec3.scalar2(_t)===0){
		min=INVALID;
		return min;
	}

	if(o1.type===Collider.MESH){
		return o1.convexCast(_t,o2,ans1,ans2)
	}
	if(o2.type===Collider.MESH){
		var tt = new Vec3();
		Vec3.mul(tt,_t,-1);
		
		var hit = o2.convexCast(tt,o1,ans1,ans2)
		if(ans2){
			Vec3.mul(ans2,ans2,-1);
		}
		if(ans1){
			Vec3.madd(ans1,ans1,ans2,-hit);
		}
		return hit;
	}
	var t=Vec3.alloc();
	var tlen = Vec3.scalar(_t);
	tlen=1;
	Vec3.mul(t,_t,1.0/tlen);
	var axis=Vec3.alloc();
	var v=[];
	var v1=[];

	for(var i=0;i<DIMENSION+1;i++){
		v.push(Vec3.alloc());
		v1.push(Vec3.alloc());
	}
	var vbuf=Vec3.alloc();
	

	Vec3.copy(axis,t);

	var idx=1;
	var counter=0;

	//最初の点を求める
	//cast方向で一番近い点
	o1.calcSupportB(v1[0],axis);
	o2.calcSupportReverseB(v[0],axis);
	Vec3.sub(v[0],v1[0],v[0]);

	//次の方向はcast方向と最初の点の垂直方向
	Vec3.cross(axis,v[0],t);
	Vec3.cross(axis,t,axis);
	if(Vec3.dot(axis,v[0])>0){
		Vec3.mul(axis,axis,-1);
	}

	var vloop=[v[0],v[1],v[2],v[0],v[1],v[2]];
	var tar=[
		0 //貫通(使わない)
		,2 // 0-1
		,0 // 1-2
		,1 // 0-1-2
		,1 // 2-0
		,0 // 2-0-1
		,2 // 1-2-0
	];
	var min2=99999999;

	while(1){
		if(Vec3.scalar2(axis)===0){
			console.log("0vec");
			break;
		}
		//axisの向きで一番近い点をとる
		o1.calcSupportB(v1[idx],axis);
		o2.calcSupportReverseB(v[idx],axis);

		Vec3.sub(v[idx],v1[idx],v[idx]);
	

		if(Vec3.dot(v[idx],axis)<=Vec3.dot(axis,v[0])+0.01){
			//取得した点が既存点よりもaxis方向に遠くない場合は終了
			break;
		}

		if(idx===1){
			//線分のときはcast方向と垂直方向を軸に取る
			Vec3.sub(vbuf,v[0],v[1]);
			Vec3.cross(axis,vbuf,t);
			if(Vec3.dot(v[0],axis)>0){
				Vec3.mul(axis,axis,-1);
			}
			idx++;
		}else if(idx===2){
			//三角のとき
			var ret =TRIANGLE_LINE(t,v[0],v[1],v[2]);
			if(ret===0){
				//貫通している場合は手前法線方向に4つめの点を取りに行く
				Vec3.cross2(axis,v[0],v[1],v[2]);
				if(Vec3.dot(axis,t)<0){
					Vec3.mul(axis,axis,-1);
				}
				idx++;
			}else{
				//貫通していない場合は外側の点をとりにいく
				Vec3.copy(vloop[tar[ret]],vloop[2]);
				Vec3.sub(vbuf,v[0],v[1]);
				Vec3.cross(axis,vbuf,t);
				if(Vec3.dot(v[0],axis)>0){
					Vec3.mul(axis,axis,-1);
				}
			}
				if(Vec3.scalar(axis)===0){
					break;

				}
		}else{
			
			//四面体の手前3つの面のどれを貫通しているか調べる
			var min3 = min2;
			for (var i=0;i<3;i++){
				if(TRIANGLE_LINE(t,v[i],vloop[i+1],v[3])){
					//貫通していない場合はスルー
					continue;
				}

				//垂直はスルー
				Vec3.cross2(axis,v[i],vloop[i+1],v[3]);
				if(Vec3.dot(axis,t)===0){
					continue;
				}

				//貫通している三角を底辺として次の頂点を取得しにいく
				Vec3.copy(vloop[i+2],v[3]);
				Vec3.cross2(axis,v[0],vloop[1],v[2]);

				if(Vec3.dot(t,axis)<0){
					Vec3.mul(axis,axis,-1);
				}
				min3 = -Vec3.dot(axis,v[0])/Vec3.dot(axis,t);

				break;
				
			}
			if(min3>=min2){
				//前回よりも手前にならなかった場合か
				//どれも貫通しない場合は終了
				break;
			}
			min2 = min3;
		}

		//無限ループ対策
		counter++;
		if(counter===18){
			console.log("lo!!");
		}
		if(counter>21){
			console.log("loooop!!");
			break;
		}

	}

	var min = INVALID;

	//その時点が最短
	if(idx>2){

		Vec3.cross2(axis,v[0],v[1],v[2]);
		if(-Vec3.dot(axis,t)<0){
			Vec3.mul(axis,axis,-1);
		}
		if(ans2){
			ans2.set(axis);
			Vec3.norm(ans2);
		}

		if(ans1 && !ans2){
			Vec3.copy(ans1,axis);
		}

		var l=-Vec3.dot(axis,t);
		if(l !== 0){
			min=Vec3.dot(axis,v[0])/l;
		}else{
			min=-Vec3.dot(t,v[0]);
		}

		if(ans1 && ans2){
			Vec3.mul(axis,t,-min);
			var ans = new Vec3();
			Geono.triangleWeight(ans,axis,v[0],v[1],v[2]);
			Vec3.setValue(ans1,0,0,0);
			for(var i=0;i<3;i++){
				Vec3.madd(ans1,ans1,v1[i],ans[i]);
			}
			Vec3.sub(ans1,ans1,axis);
		}
		min/=tlen;
	}
	Vec3.free(11);
	return min;
};
export default convexCast;
