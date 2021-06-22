import {Vec2} from "../lib/vector.js"
import Layer from "../layer.js";
import CommandBase from "./commandbase.js";
import Hdrpaint from "../hdrpaint.js";
import Img from "../lib/img.js";

var commandObjs = Hdrpaint.commandObjs;
class Paste extends CommandBase{
	constructor(){
		super();
	}
	undo(){
		Hdrpaint.removeLayer(this.undo_data.layer);
		return;
	}
	func(){
		var param = this.param;
		var n= param.position;

		var layer;
		if(!this.undo_data){
			var img = Hdrpaint.clipboard;

			layer =Hdrpaint.createLayer(img,param.composite_flg);
			layer.position[0]=Hdrpaint.select_rectangle.x;
			layer.position[1]=Hdrpaint.select_rectangle.y;
			this.undo_data={"layer":layer};
		}else{
			layer = this.undo_data.layer;
		}
		var parentLayer = Layer.findById(param.parent);

		parentLayer.append(n,layer);

		Hdrpaint.select(layer);

		return layer;

	}
}

commandObjs["paste"] = Paste;
