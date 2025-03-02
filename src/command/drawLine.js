import {Vec2} from "../lib/vector.js";
import PenPoint from "../penpoint.js"
import Hdrpaint from "../hdrpaint.js";
import Img from "../lib/img.js";
import Layer from "../layer.js";
import CommandBase from "./commandbase.js";

var painted_mask = Hdrpaint.painted_mask;

class Brush extends CommandBase{
	constructor(){
		super();
		this.undo_data={"difs":[]};
	}
	toString(){
		var points = this.param.points;
		var str=this.name;
		if(points.length){
			str +=  "(" + points[0].pos[0].toFixed(2)+ ","+ points[0].pos[1].toFixed(2)+")-";
			str += (points.length-2) +"-";
			str += "(" + points[points.length-1].pos[0].toFixed(2)+ ","+ points[points.length-1].pos[1].toFixed(2)+")";
		}
		return str;
	}

	func(){
		//ペン描画
		var param = this.param;
		var layer = Layer.findById(param.layer_id);

		if(layer){
			if(layer.modifier === "vector"){
				var a = layer.commands.indexOf(this);
				if(a<0){
					layer.commands.push(this);
					var parent_layer = Layer.findById(layer.parent);
					parent_layer.bubbleComposite();
				}
			}
		}
		var points = param.points;

		painted_mask.fill(0);

		for(var li=1;li<points.length;li++){
			this.draw(li);
		}
	}
	draw(n){
		var param = this.param;
		var points = param.points;
		var img ;
		var vector_flg=false;
		if(param.img_id>=0){
			img = hdrpaint.getImgById(param.img_id);
		}else{
			var img_id = Layer.findById(param.layer_id).img_id;
			img = hdrpaint.getImgById(img_id);
			vector_flg=true;
		}

		var left   = img.width;
		var right  = 0;
		var top    = img.height;
		var bottom = 0;

		var wei = param.brush.weight;

		var p = points[Math.max(0,n-1)]
		left = Math.min(p.pos[0],left);
		right= Math.max(p.pos[0],right);
		top= Math.min(p.pos[1],top);
		bottom = Math.max(p.pos[1],bottom);

		p = points[Math.max(0,n)]
		left = Math.min(p.pos[0],left);
		right= Math.max(p.pos[0],right);
		top= Math.min(p.pos[1],top);
		bottom = Math.max(p.pos[1],bottom);

		left = Math.floor(clamp(left -wei,0,img.width-1));
		right= Math.ceil(clamp(right + wei,0,img.width-1));
		top= Math.floor(clamp(top -wei,0,img.height-1));
		bottom=Math.ceil(clamp(bottom + wei,0,img.height-1));

			//差分ログ作成
		if(!vector_flg){
			var dif= Hdrpaint.createDif(img,left,top,right-left+1,bottom-top+1);
			this.undo_data.difs.push(dif);
		}
		
		this.drawBetween(img
			,points[Math.max(0,n-2)]
			,points[Math.max(0,n-1)]
			,points[n]
			,points[Math.min(n+1,points.length-1)]
		)

		if(!vector_flg){
			//再描画
			var keys = Object.keys(hdrpaint.layers);
			for(var i=0;i<keys.length;i++){
				var layer = hdrpaint.layers[keys[i]];
				if(layer.img_id === param.img_id){
					layer.refreshImg(left,top,right-left+1,bottom-top+1);
				}
			}
		}else{
			hdrpaint.redraw_ui=true;
		}
	}

		
	calck(k,p0,p1,p2,p3){
		k.c = (p2-p0)*0.5;
		k.d = p1;

		k.a = (p3-p1)*0.5 -2*p2+k.c+2*p1;
		k.b = p2 -k.a-k.c-p1;


		return k;
	}

	drawBetween(img,a0,a1,a2,a3){
		var param = this.param;
		var delta0;
		var delta1;
		var k =[{},{}];
		

		this.calck(k[0],a0.pos[0],a1.pos[0],a2.pos[0],a3.pos[0])
		this.calck(k[1],a0.pos[1],a1.pos[1],a2.pos[1],a3.pos[1])
		var members=["pressure"];
		for(var i=0;i<members.length;i++){
			var member = members[i];
			k[i+2]={};
			this.calck(k[i+2],a0[member],a1[member],a2[member],a3[member])
		};


		var dummy0={pos:[0,0],bold:1}
		dummy0.pos[0]=a1.pos[0];
		dummy0.pos[1]=a1.pos[1];

		for(var i=0;i<members.length;i++){
			var member = members[i];
			dummy0[member]=a1[member];
		}

		var dummy1={pos:[0,0],pressure:1}

		var sep_num= (Vec2.len(a1.pos,a2.pos)>>3)+1;
		if(!param.brush.stroke_interpolation){
			sep_num = 1;
		}
		var _sep_num = 1/sep_num;
		var param = this.param;
		for(var i=0;i<sep_num;i++){
			var r = (i+1)*_sep_num;
			var r2 = r*r;
			var r3 = r*r*r;
			dummy1.pos[0]= r3 * k[0].a +  r2 * k[0].b + r * k[0].c + k[0].d;
			dummy1.pos[1]= r3 * k[1].a +  r2 * k[1].b + r * k[1].c + k[1].d;
			for(var j=0;j<members.length;j++){
				var member = members[j];
				dummy1[member]= r3 * k[2+j].a +  r2 * k[2+j].b + r * k[2+j].c + k[2+j].d;
			};
			
			drawPen(img,dummy0,dummy1,param); //drawLine(dummy0,dummy1);

			var buf = dummy0;
			dummy0 = dummy1;
			dummy1 = buf;
			
			
		}
	}

};
Brush.prototype.name="brush";

class Eraser extends Brush{}
Eraser.prototype.name="eraser";

Hdrpaint.commandObjs["eraser"]=Eraser;
Hdrpaint.commandObjs["brush"]=Brush;


	var clamp=function(value,min,max){
		return Math.min(max,Math.max(min,value));
	}
	var brush_blend=function(dst,idx,pressure,dist,flg,weight,param){
		var alpha_mask = param.alpha_mask;
		var color = param.color;
		var brush =param.brush;
		var sa = color[3] * brush.alpha; 
		if(brush.eraser){
			sa = brush.alpha;
		}
		if(brush.alpha_pressure_effect){
			sa *= pressure;
		}
		var l = Vec2.scalar(dist);
		if(brush.softness){
			sa = sa  *((1- l/weight )/ (brush.softness))
		}else{
			if(brush.antialias){
				l = Math.min(Math.max(weight-l,0),1);
				sa = sa * l;
			}	
		}
		sa = Math.max(Math.min(sa,1),0);
		if(brush.eraser){
			if(brush.overlap===2){
				dst[idx+3]=(1-sa) * (1-brush.alpha);
			return;
			}
		}

		if(brush.overlap===2){
			//直接上書き
			dst[idx+0] =  color[0] ;
			dst[idx+1] =  color[1] ;
			dst[idx+2] =  color[2] ;
			if(!alpha_mask){
				dst[idx+3] =  sa ;
			}
			return;
		}

		if(brush.overlap==0){
			//アルファが大きい場合に上書き
			if(flg[idx>>2]>=sa){
				return;
			}
			var olda =flg[idx>>2];
			flg[idx>>2]=sa;
			sa = (sa - olda)/(1-olda);
		}
		if(brush.eraser){
			dst[idx+3] = dst[idx+3] * (1-sa);
			return;
		}

		var da = dst[idx+3]*(1-sa);
		if(!alpha_mask){
			//アルファマスク指定時以外はアルファを更新
			dst[idx+3] = da + sa;
		}

		if( dst[idx+3] && !brush.eraser){
			var rr = 1/dst[idx+3];
			da*=rr;
			sa*=rr;
			dst[idx+0] += (dst[idx+0] * (-1+da) + color[0] * sa);
			dst[idx+1] += (dst[idx+1] * (-1+da) + color[1] * sa);
			dst[idx+2] += (dst[idx+2] * (-1+da) + color[2] * sa);
		}
	}

	var vec2 =new Vec2();
	var dist = new Vec2();
	var drawPen=function(img,point0,point1,param){
		var brush = param.brush;
		var weight = brush.weight;
		var softness= brush.softness;
		//描画
		var img_data = img.data;
	
		weight*=0.5;

		var weight_pressure_effect = brush.weight_pressure_effect;
		if(weight_pressure_effect){
			weight_pressure_effect= 1;
		}else{
			weight_pressure_effect= 0;
		}
		var alpha_pressure_effect = brush.alpha_pressure_effect;
		var pos1 = point1.pos;
		var pos0 = point0.pos;

		var max_pressure = Math.max(point0.pressure,point1.pressure);
		var pressure_0=point0.pressure;
		var d_pressure=point1.pressure - point0.pressure;

		var max_weight = max_pressure * weight;
		if(weight_pressure_effect){
			max_weight = weight;
		};

		var left = Math.min(pos1[0],pos0[0]);
		var right= Math.max(pos1[0],pos0[0])+1;
		var top= Math.min(pos1[1],pos0[1]);
		var bottom= Math.max(pos1[1],pos0[1])+1;
		
		left = Math.floor(clamp(left-max_weight,0,img.width));
		right= Math.ceil(clamp(right+max_weight,0,img.width));
		top= Math.floor(clamp(top-max_weight,0,img.height));
		bottom=Math.ceil(clamp(bottom+max_weight,0,img.height));

		Vec2.sub(vec2,pos1,pos0);
		var l = Vec2.scalar2(vec2);
		if(l!==0){
			Vec2.mul(vec2,vec2,1/l);
		}else{
			Vec2.setValues(vec2,0,0);
		}


		for(var dy=top;dy<bottom;dy++){
			for(var dx=left;dx<right;dx++){
				dist[0]=dx-pos0[0];
				dist[1]=dy-pos0[1];
				var dp = Math.max(Math.min(Vec2.dot(vec2,dist),1),0);
				var l=0;
				var l2=0;
				var local_pressure=0;
					
				var local_pressure = d_pressure * dp + pressure_0 ;
				var local_weight = ((local_pressure*weight_pressure_effect)+  (1-weight_pressure_effect)) * weight ;

				dist[0]=dx-(pos0[0] * (1-dp) + pos1[0]*(dp));
				dist[1]=dy-(pos0[1] * (1-dp) + pos1[1]*(dp));
				
				
				if(Vec2.scalar2(dist)>=local_weight * local_weight){
					continue;
				}
				var idx = dy*img.width+ dx|0;

				brush_blend(img_data,idx<<2,local_pressure,dist,painted_mask,local_weight,param);
			}
		}


	}

