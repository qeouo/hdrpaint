import Plane from "./boundingplane.js";	
import {Vec3,Mat43} from "./vector.js"


var MAX = 4;
var picked_convex_list=new Array(32);

var p= new Vec3();
var p2 = new Vec3();
var n01= new Vec3();
var n12= new Vec3();
var n20= new Vec3();
var axis= new Vec3();
var axis2= new Vec3();
var ppp =  new Vec3();

var plane_list = new Array(32);
export default class BoundingBox {
   	//バウンディングボックス
  constructor(x, y, z,w, h,d) {
    this.min = new Vec3(-w / 2, -h / 2, -d/2);
    this.max = new Vec3(w / 2, h / 2,d/2);
    this.matrix = new Mat43();
  }
  support(p, n, reverse = 1) { //n方向のサポート関数

    for (var i = 0; i < 3; i++) {
      if ((this.matrix[0 + i * 3] * n[0]
		  + this.matrix[1 + i * 3] * n[1]
		  + this.matrix[2 + i * 3] * n[2]
		  ) * reverse > 0) {
        p[i] = this.max[i];
      } else {
        p[i] = this.min[i];
      }
    }
	Mat43.dotVec3(p,this.matrix,p);
  }
  supportReverse(p, n) { //nと逆方向のサポート関数
    this.support(p, n, -1);
  }
  checkDoublePlane(plane0, plane1) { //鋭角に交差する平面２つとの接触判定 falseで接触
	engine.draw_data.calc_count++;
	var a =Vec3.dot(plane0.normal , plane1.normal);
	if(a > 0.9999){//平行なとき例外処理
    	return false;
		}
    if(a < -0.9999){
    	return plane0.distance +plane1.distance>=0;
    }

    //鋭角と接触しているかどうか
	Vec3.cross(n01,plane0.normal,plane1.normal);
    Plane.intersection(p, plane0, plane1);


//	if(this.checkPoint(p,plane0.normal)){
//	  return true;
//	}
//	if(this.checkPoint(p,plane1.normal)){
//	  return true;
//	}

	Vec3.add(ppp,plane0.normal,plane1.normal);

    for (var i = 0; i < 3; i++) { //軸総当り
      axis[0] = this.matrix[0 + i * 3];
      axis[1] = this.matrix[1 + i * 3];
      axis[2] = this.matrix[2 + i * 3];

      if (Vec3.dot(plane0.normal, axis) *Vec3.dot(plane1.normal, axis) > 0){
	      continue;
	  }
	  Vec3.cross(axis,n01,axis);
	  if(Vec3.dot(ppp,axis)<0){
			  Vec3.mul(axis,axis,-1);
			  }
		if(this.checkPoint(p,axis)){
		  return true;
		}
    }

    return false;
  }

  checkPoint(p,axis){
	this.support(p2, axis);
	return Vec3.dot(p,axis) > Vec3.dot(p2, axis) ;
  }
  checkTriplePlane(plane0, plane1,plane2) { //鋭角に交差する平面3つとの接触判定 falseで接触
	engine.draw_data.calc_count++;

	var a =Vec3.dot(plane0.normal , plane1.normal);

	if(a > 0.9999){
		//ほぼ同じ向きの場合例外処理
		if(plane0.distance > plane1.distance){
			return this.checkDoublePlane(plane0,plane2);
		}else{
			return this.checkDoublePlane(plane1,plane2);
		}
	}
    if(a < -0.9999){
		//ほぼ逆向きの場合例外処理
    	if(plane0.distance +plane1.distance>=0){
			return true;
		}else{
			return this.checkDoublePlane(plane0,plane2);
		}
    }

	Vec3.cross(p,plane0.normal,plane1.normal);
	var l =Vec3.dot(plane2.normal,p);
	if(l*l<0.00000001){
		//交差しない場合
		Plane.intersection(p,plane0,plane1);
		if(plane2.checkFront(p)){
			return false;
		}
//		if(!Vec3.checkBetween(plane2.normal,plane0.normal,plane1.normal)){
//			return false;
//		}
//		if(Vec3.dot(plane2.normal,plane0.normal) + Vec3.dot(plane2.normal,plane1.normal) > 0){
//			return false;
//		}
		return true;
	}

	var l=Plane.intersection3(p,plane0,plane1,plane2);
	if(l*l<0.00000001){
		//交差しない
    	return false;
	}

	//エッジ面全部
//	if (this.checkPoint(p,plane0.normal)){
//	  return true;
//	}
//	if (this.checkPoint(p,plane1.normal)){
//	  return true;
//	}
//	if (this.checkPoint(p,plane2.normal)){
//	  return true;
//	}


	Vec3.cross(n01,plane0.normal,plane1.normal);
	Vec3.cross(n12,plane1.normal,plane2.normal);
	Vec3.cross(n20,plane2.normal,plane0.normal);

	Vec3.mul(n01,n01,-Math.sign(Vec3.dot(n01,plane2.normal)));
	Vec3.mul(n12,n12,-Math.sign(Vec3.dot(n12,plane0.normal)));
	Vec3.mul(n20,n20,-Math.sign(Vec3.dot(n20,plane1.normal)));

    for (var i = 0; i < 3; i++) { //軸総当り
		axis[0] = this.matrix[0 + i * 3];
		axis[1] = this.matrix[1 + i * 3];
		axis[2] = this.matrix[2 + i * 3];

		Vec3.mul(axis,axis,-Math.sign(Vec3.dot(axis,n01)));

		if(  Vec3.dot(axis,n12)>0 || Vec3.dot(axis,n20)>0){
			continue;
		}
		if (this.checkPoint(p,axis)){
		  return true;
		}

    }
    for (var i = 0; i < 3; i++) { //軸総当り
		axis[0] = this.matrix[0 + i * 3];
		axis[1] = this.matrix[1 + i * 3];
		axis[2] = this.matrix[2 + i * 3];

		Vec3.cross(axis2,axis,n01);
		Vec3.mul(axis2,axis2,-Math.sign(Vec3.dot(axis2,n12)));
		if( Vec3.dot(axis2,n20) < 0){
			if (this.checkPoint(p,axis2)){
			  return true;
			}
		}
		Vec3.cross(axis2,axis,n12);
		Vec3.mul(axis2,axis2,-Math.sign(Vec3.dot(axis2,n20)));
		if( Vec3.dot(axis2,n01) < 0){
			if (this.checkPoint(p,axis2)){
			  return true;
			}
		}
		Vec3.cross(axis2,axis,n20);
		Vec3.mul(axis2,axis2,-Math.sign(Vec3.dot(axis2,n01)));
		if( Vec3.dot(axis2,n12) < 0){
			if (this.checkPoint(p,axis2)){
			  return true;
			}
		}

    }


    return false;
  }

  checkPlanes(planes,idx) { //配列のうち最後の面とそれ以外のどれかの面の組み合わせで判定
    var last = planes[idx];

    for (var i = 0; i < idx; i++) {
      if (this.checkDoublePlane(planes[i], last)) {
        return true;
      }
      for (var j = i + 1; j < idx; j++) {
      	//３つの場合の対処
		  if (this.checkTriplePlane(planes[i],planes[j], last)) {
			return true;
		  }
	  }
    }
    return false;
  }
  check(convexes, plane_list,idx) { //複数多角形から辺を一つずつ選んで全組み合わせを調べる
    var ps = convexes[idx];
    for (var i = 0; i < ps.length; i++) {
      plane_list[idx] = ps[i];
      //外側に接触しない組み合わせがあれば早期終了なければ別の多角形を含めて再判定
      var result = this.checkPlanes(plane_list,idx);
      if (!result && idx + 1 < convexes.length ){
        result = this.check(convexes, plane_list,idx+1);
      }
      if (!result) {
        return false;
      }
    }
    return true;
  }
   
  pack(source){
    for (var i = 0; i < source[0].length; i++) {
      plane_list[0] = source[0][i];
      var result = this.check(source, plane_list,1);
      if (!result) {
        return false;
      }
    }
	return true;
  }

  pick(source,length){
	  for(var i=length;i<source.length;i++){
	  	picked_convex_list[length]=source[i];
		var result =false;
		if(length+1 >= source.length
		|| length+1 >= MAX){
			var list=[];
			for(var j=0;j<length+1;j++){
				list.push(picked_convex_list[j]);
			}
			if(length===0){
				return false;
			}
			var result = this.pack(list);
		}else{
			result = this.pick(source,length+1);
		}
		if(result){
			return true;
		}
	  }
  }

  checkConvexes(convexes,instance) {
    //複数の凸多角形の集合にバウンディングボックスが内包されているかの判定

    //メインの処理前に不要な多角形や辺を除外する（枝刈り）
    var new_convexes = [];
    for (var j = 0; j < convexes.length; j++) {
		if(convexes[j].instance === instance){
			continue;
		}
      var planes = convexes[j].planes;
      var new_planes = [];
      var count = 0;
      for (var i = 0; i < planes.length; i++) {
        this.support(p, planes[i].normal);
        if (Vec3.dot(p, planes[i].normal) < planes[i].distance) {
          //辺の内側の場合はその辺を除外
          count++;
          continue;
        }
        this.supportReverse(p, planes[i].normal);
        if (Vec3.dot(p, planes[i].normal) > planes[i].distance) {
          //多角形の外側の場合、その多角形は除外
          count = -1;
          break;
        }
        new_planes.push(planes[i]);
      }
      if (count < 0) {
        continue;
      }
      if (count === planes.length) {
        //1つの多角形で内包されている場合即終了
        return true;
      }

      //多角形追加
      new_convexes.push(new_planes);

		if(new_convexes.length>=MAX){
			break;
		}
    }
    if (new_convexes.length <= 1) {
      //対象凸多角形が1未満の場合は終了
      return false;
    }

	return this.pack(new_convexes);


  }

}
