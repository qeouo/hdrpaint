import {Vec2} from "../lib/vector.js"
import Layer from "../layer.js";
import CommandBase from "./commandbase.js";
import Hdrpaint from "../hdrpaint.js";
import Img from "../lib/img.js";

var commandObjs = Hdrpaint.commandObjs;
class CopyLayer extends CommandBase{
	constructor(){
		super();
	}

	static name ="copylayer";

	undo(){
		var undo_data=this.undo_data;
		var layer = undo_data.layer;
		Hdrpaint.removeLayer(layer);
		return;
	}

	func(){
		var param = this.param;
		var src_layer= param.src_layer;
		var n= param.position;

		var layer;
		if(!this.undo_data){
			var src_layer = Layer.findById(param.src_layer_id);
			var src_img = hdrpaint.getImgById(src_layer.img_id);
			var img = new Img(src_layer.size[0],src_layer.size[1]);
			Img.copy(img,0,0,src_img,0,0,img.width,img.height);

			layer =Hdrpaint.createLayer(img,0);

			var keys=Object.keys(layer);
			for(var i=0;i<keys.length;i++){
				var key = keys[i];
				if(["id","dom","img","children"].indexOf(key)>=0)continue;
				if(layer[key] instanceof Vec2){
					Vec2.copy(layer[key],src_layer[key]);
				}else{
					layer[key] = src_layer[key];
				}
			}

			layer.refreshDiv();
			this.undo_data={"layer":layer};
		}else{
			layer = this.undo_data.layer;
		}
		var parentLayer = Layer.findById(param.parent);

		parentLayer.append(n,layer.id);
		Hdrpaint.selectLayer(layer.id);

		return layer;
	}
}

commandObjs["copylayer"] = CopyLayer;
