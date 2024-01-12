
import {Vec2,Vec3,Vec4,Mat33} from "../lib/vector.js"
import Img from "../lib/img.js";
import Hdrpaint from "../hdrpaint.js";
import Layer from "../layer.js";

let composite_img = new Img(512,512);
let composite_area = new Vec4();

class Composite extends Layer{
	static name="composite";
	static type="filter";
	static option=`
		位置<input type="text" id="layer_x" value="" class="size" name="position.0">
		<input type="text" id="layer_y" value="" class="size" name="position.1">
		サイズ<input type="text" id="layer_width" value="" class="size" name="width">
		<input type="text" id="layer_height" value="" class="size" name="height"><br>
		<div id="div_blendfunc">合成func<select type="text" id="layer_blendfunc" name="blendfunc">
		</select></div>
		α<input class="slider" id="layer_alpha" max="1" name="alpha"/>
		<label><input type="checkbox" id="layer_mask_alpha" name="mask_alpha"/>αロック</label><br>
		明るさ<input class="slider" id="layer_power" min="-10" max="10" name="power"/><br>
	`;
	constructor(){
		super();


		this.children=[];
	};
	init(){
		var width = this.size[0];
		var height= this.size[1];
		var img = hdrpaint.createImg(width,height);
		this.img_id = img.id;
		//var layer =Hdrpaint.createLayer(img.id,1);
		this.width=width;
		this.height=height;
		this.type=1;
	}

//
//	reflect(img,composite_area){
//
//		var x = Math.max(0,composite_area[0]);
//		var y = Math.max(0,composite_area[1]);
//		var x1 = Math.min(this.parent.size[0],composite_area[2]+x);
//		var y1 = Math.min(this.parent.size[1],composite_area[3]+y);
//		var layer = this;
//
//
//		var offx =  img.offsetx;
//		var offy =  img.offsety;
//		img.scan(function(r,idx,x,y){layer.getPixel(r,idx,x +offx,y+offy);} ,x-img.offsetx,y-img.offsety,x1-x,y1-y);
//	}
	//レイヤ合成
	composite(left,top,right,bottom){
		var children=this.children;


		var layer_img = hdrpaint.getImgById(this.img_id);
		var pow=0;
		if(typeof left === 'undefined'){
			left=0;
			top=0;
			right = layer_img.width-1;
			bottom= layer_img.height-1;
		}

		if(this.type !==1){
			return;
		}

		var width = right-left+1;
		var height = bottom-top+1;


		Vec4.setValues(composite_area,left,top,width,height);
		//合成前処理
		for(var li=children.length;li--;){
			var layer = Layer.findById(children[li]);
			if(!layer.display ){
				//非表示の場合スルー
				continue;
			}
			layer.before(composite_area);
			
		}


		left = Math.max(0,composite_area[0]);
		top= Math.max(0,composite_area[1]);
		right= Math.min(layer_img.width,composite_area[2]+ left);
		bottom= Math.min(layer_img.height,composite_area[3]+ top);
		if(composite_img.data.length<((right-left)*(bottom-top)<<2)){
			composite_img = new Img(right-left,bottom-top);
		}
		composite_img.offsetx= left;
		composite_img.offsety= top;
		composite_img.width= right-left;
		composite_img.height= bottom-top;


		if(this.id === Hdrpaint.root_layer.id){
			var bg = Hdrpaint.doc.background_color;
			composite_img.fill(bg[0],bg[1],bg[2],bg[3],0,0,composite_img.width,composite_img.height);
		}else{
			composite_img.clear(0,0,composite_img.width,composite_img.height);
		}
		
		//合成処理
		for(var li=0;li<children.length;li++){
			var layer = Layer.findById(children[li]);
			if(!layer.display){
				//非表示の場合スルー
				continue;
			}
			layer.beforeReflect();
			layer.reflect(composite_img,composite_area);
		}

		var x0 = composite_area[0];
		var x1 = composite_area[0]+composite_area[2];
		var y0 = composite_area[1];
		var y1 = composite_area[1]+composite_area[3];
		x0=Math.max(0,x0);
		y0=Math.max(0,y0);
		x1=Math.min(layer_img.width,x1);
		y1=Math.min(layer_img.height,y1);
		Vec4.setValues(composite_area,x0,y0,x1-x0,y1-y0);
		Img.copy(layer_img
			,composite_area[0] 
			, composite_area[1]
			,composite_img
			, -composite_img.offsetx +composite_area[0]
			, -composite_img.offsety +composite_area[1]
			, composite_area[2] 
			, composite_area[3] 
		);

		if(this.id === Hdrpaint.root_layer.id){
			//ルートレイヤの場合はプレビュー更新
			Redraw.refreshPreview(0,composite_area[0],composite_area[1],composite_area[2],composite_area[3]);
		}else{
			//通常レイヤの場合はサムネ更新
			this.registRefreshThumbnail();
		}
	}

};
Hdrpaint.registModifier(Composite);
