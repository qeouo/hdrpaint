
import {Vec2,Vec3,Vec4,Mat33} from "../lib/vector.js"
import Img from "../lib/img.js";
import Hdrpaint from "../hdrpaint.js";
import Layer from "../layer.js";

let composite_img = new Img(512,512);
let composite_area = new Vec4();

class Composite extends Layer{
	static name="composite";
	static type="filter";
	constructor(){
		super();

		this.children=[];
		this.type=1;
	};
	init(){
		var width = this.size[0];
		var height= this.size[1];
		var img = hdrpaint.createImg(width,height);
		this.img_id = img.id;
		//var layer =Hdrpaint.createLayer(img.id,1);
		this.width=width;
		this.height=height;

		if(img){
			Vec2.setValues(this.size,img.width,img.height);
		}
		this.type=1;
	}
//	reflect(img,area){
//		composite(
//	}

	//レイヤ合成
	composite(left,top,right,bottom){
		var children=this.children;

		var layer_img = hdrpaint.getImgById(this.img_id);

		if(typeof left === 'undefined'){
			//エリア指定無しの場合は全体
			left=0;
			top=0;
			right = layer_img.width-1;
			bottom= layer_img.height-1;
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

		//コンポジットバッファエリア再計算
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
			//ルートレイヤなら背景色塗りつぶし
			var bg = Hdrpaint.doc.background_color;
			composite_img.fill(bg[0],bg[1],bg[2],bg[3],0,0,composite_img.width,composite_img.height);
		}else{
			//ルートレイヤ以外は透明色塗りつぶし
			composite_img.clear(0,0,composite_img.width,composite_img.height);
		}
		
		//合成処理
		for(var li=0;li<children.length;li++){
			var layer = Layer.findById(children[li]);
			if(!layer.display){
				//非表示の場合スルー
				continue;
			}
			//layer.beforeReflect(composite_area);
			layer.reflect(composite_img,composite_area);
		}

		//コンポジット結果をコンポジットキャッシュに反映
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
