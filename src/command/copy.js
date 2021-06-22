import {Vec2} from "../lib/vector.js"
import Layer from "../layer.js";
import CommandBase from "./commandbase.js";
import Hdrpaint from "../hdrpaint.js";
import Img from "../lib/img.js";

var commandObjs = Hdrpaint.commandObjs;
class Copy extends CommandBase{
	constructor(){
		super();
	}

	static name ="copy";

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
			var range = param.range;
			var img = new Img(range.w,range.h);
			Img.copy(img,0,0,src_layer.img,range.x,range.y,range.w,range.h);

			//layer.refreshDiv();

			Hdrpaint.clipboard = img;
		}else{
			layer = this.undo_data.layer;
		}

		return layer;
	}
}

commandObjs["copy"] = Copy;
