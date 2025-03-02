
import Util from "../lib/util.js";
import {Vec2,Vec3,Vec4,Mat33} from "../lib/vector.js"
import Hdrpaint from "../hdrpaint.js";
import Aabb from "../lib/aabb.js"

import Layer from "../layer.js";
var img;
var img_data;
var offset=new Vec2();
		var RECT_SIZE=4;
class VectorLayer extends Layer{
	static name="vector";
	static type="generator";
	constructor(){
		super();
		this.commands=[];

		var data = hdrpaint.getPosition();
		var width= data.parent_layer.size[0];
		var height= data.parent_layer.size[1];
		var img = hdrpaint.createImg(width,height);
		img.data.fill(1);
		this.width=width;
		this.height=height;
		this.img_id = img.id;
		this._img = img;
		this.selected_point=null;
		this.select=null;
	}

	redraw(){
		if( this.id !== hdrpaint.selected_layer_id){
			return;
		}
		var ctx = hdrpaint.ui_ctx;
		var vec3 = new Vec3();
		for(var i=0;i<this.commands.length;i++){
			var command = this.commands[i];
			if(command.name ==="brush"){
				var points = command.param.points;
				for(var j=0;j<points.length;j++){
					var point = points[j];
					vec3[0]=point.pos[0];
					vec3[1]=point.pos[1];
					this.toAbsolute(vec3);
					ctx.strokeRect(vec3[0]-RECT_SIZE,vec3[1]-RECT_SIZE,RECT_SIZE*2,RECT_SIZE*2);

					if(this.select === point){
						vec3[0]=point.pos[0];
						vec3[1]=point.pos[1];
						this.toAbsolute(vec3);
						ctx.strokeRect(vec3[0]-RECT_SIZE-4,vec3[1]-RECT_SIZE-4,(RECT_SIZE+4)*2,(RECT_SIZE+4)*2);
					}
				}

			}
		}
	}

	changeParam(_targets,_values){
		if(Hdrpaint.selected_tool !== "rectangle"){
			return;
		}
		if(!this.select){
			return;
		}
		var targets =  Util.toArray(_targets);
		var values=  Util.toArray(_values);
		for(var i=0;i<this.commands.length;i++){
			var command = this.commands[i];
			if(command.name !=="brush"){
				continue;
			}
			var points = command.param.points;
			var p = points.indexOf(this.select);
			if(p<0)continue;

			for(var j=0;j<targets.length;j++){
				targets[j] = "commands."+i+".param."+ targets[j];
			}

			 hdrpaint.executeCommand("changeLayerAttribute",{"layer_id":this.id
				,"name":targets
				,"value":values} );
			break;

		}
	}
	getTargetCommandIndex(){
		for(var i=0;i<this.commands.length;i++){
			var command = this.commands[i];
			if(command.name !=="brush"){
				continue;
			}
			var points = command.param.points;
			var p = points.indexOf(this.select);
			if(p<0)continue;
			return i;
		}
		return -1;
	}
	changeColor(){

		if(Hdrpaint.selected_tool !== "rectangle"){
			return;
		}
		var i =this.getTargetCommandIndex();
		if(i<0)return;

		var targets=new Array(4);
		targets[0] = "commands."+i+".param.color.0";
		targets[1] = "commands."+i+".param.color.1";
		targets[2] = "commands."+i+".param.color.2";
		targets[3] = "commands."+i+".param.color.3";

		var values=new Array(4);
		values[0] = hdrpaint.color[0];
		values[1] = hdrpaint.color[1];
		values[2] = hdrpaint.color[2];
		values[3] = hdrpaint.color[3];
		 hdrpaint.executeCommand("changeLayerAttribute",{"layer_id":this.id
			,"name":targets
			,"value":values} );

	}
	cutStroke(){
		if(Hdrpaint.selected_tool !== "rectangle"){
			return;
		}
		if(!this.select){
			return;
		}
		for(var i=0;i<this.commands.length;i++){
			var command = this.commands[i];
			if(command.name !=="brush"){
				continue;
			}
			var points = command.param.points;
			var p = points.indexOf(this.select);
			if(p<0)continue;
			Hdrpaint.executeCommand("cutstroke",{"layer_id":this.id,"command_index":i,"anchor_index":p});
			break;

		}
	}
	deleteAnchor(){
		if(Hdrpaint.selected_tool !== "rectangle"){
			return;
		}
		if(!this.select){
			return;
		}
		for(var i=0;i<this.commands.length;i++){
			var command = this.commands[i];
			if(command.name !=="brush"){
				continue;
			}
			var points = command.param.points;
			var p = points.indexOf(this.select);
			if(p<0)continue;
			Hdrpaint.executeCommand("deleteanchor",{"layer_id":this.id,"command_index":i,"anchor_index":p});

		}
	}
	edit(){
		if(Hdrpaint.selected_tool!=="rectangle"){
			this.selected_point=null;
			return;
		}
		var vec3 = new Vec3();
		var aabb = new Aabb();
		vec3[0]=Hdrpaint.cursor_pos[0];
		vec3[1]= Hdrpaint.cursor_pos[1];
		aabb.min[0]=vec3[0]-RECT_SIZE*2;
		aabb.min[1]=vec3[1]-RECT_SIZE*2;
		aabb.max[0]=vec3[0]+RECT_SIZE*2;
		aabb.max[1]=vec3[1]+RECT_SIZE*2;
		this.toRelative(vec3);
		var mouse_button = hdrpaint.mouse_button;
		if(mouse_button===1){
			this.select=null;
			for(var i=0;i<this.commands.length;i++){
				var command = this.commands[i];
				if(command.name ==="brush"){
					var points = command.param.points;
					for(var j=0;j<points.length;j++){
						var point = points[j];
						aabb.min[0]=point.pos[0]-RECT_SIZE-4;
						aabb.min[1]=point.pos[1]-RECT_SIZE-4;
						aabb.max[0]=point.pos[0]+RECT_SIZE+4;
						aabb.max[1]=point.pos[1]+RECT_SIZE+4;
						if(!Aabb.hitCheckPos(aabb,vec3)){
							continue;
						}
						this.selected_point = hdrpaint.executeCommand("changeLayerAttribute",{"layer_id":this.id
							,"name":["commands."+i+".param.points."+j+".pos.0"
							,"commands."+i+".param.points."+j+".pos.1"]
							,"value":[point.pos[0],point.pos[1]]} ).obj;
						offset[0]=point.pos[0] - vec3[0];
						offset[1]=point.pos[1] - vec3[1];
						//point.pos[0]+=10;
						//point.pos[1]+=0;
						this.select=point;

	//					selected.point.func();
						var parent_layer = Layer.findById(this.parent);
						parent_layer.bubbleComposite();
						//hdrpaint.redraw_ui=true;
						break;
					}
				}
			}
			hdrpaint.redraw_ui=true;
		}else if(mouse_button===2){
			if(this.selected_point){
				this.selected_point.param.value[0]=vec3[0] + offset[0];
				this.selected_point.param.value[1]=vec3[1] + offset[1];
				this.selected_point.func();

				var parent_layer = Layer.findById(this.parent);
//				parent_layer.bubbleComposite();
			}
		}else if(mouse_button===3){
			this.selected_point=null;
		}
	}

	reflect(_img,composite_area){
		var img = this._img;
		img.clear();
		for(var i=0;i<this.commands.length;i++){
			var command = this.commands[i];
			command.func();
		}
		super.reflect(_img,composite_area);

	}
	//	this.beforeReflect();

	//	 img = _img;
	//	 img_data = img.data;

	//	var x = Math.max(0,composite_area[0]);
	//	var y = Math.max(0,composite_area[1]);
	//	var parent = Layer.findById(this.parent);
	//	var x1 = Math.min(parent.size[0],composite_area[2]+x);
	//	var y1 = Math.min(parent.size[1],composite_area[3]+y);

	//	var layer= this;
	//	img.scan(layer.getPixel,x-img.offsetx,y-img.offsety,x1-x,y1-y);
	//}

//	getPixel(ret,idx,x,y){
//		if(y == undefined){
//			y = x;
//			x = idx;
//			idx=0;
//		}
//		if(!img){return;}
//		var idx = img.getIndex(x,y)<<2;
//		var total = img_data[idx]+ img_data[idx+1] + img_data[idx+2];
//		total *=0.33333;
//		ret[idx+0] = total;
//		ret[idx+1] = total;
//		ret[idx+2] = total;
//		ret[idx+3] = img_data[idx+3];
//	}
}

Hdrpaint.registModifier(VectorLayer);
