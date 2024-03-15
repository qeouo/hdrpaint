import {Vec2} from "../lib/vector.js";
import CommandBase from "./commandbase.js";
import Hdrpaint from "../hdrpaint.js";
import Layer from "../layer.js";

class CreateModifier extends CommandBase{
	constructor(){
		super();
	}
	static name ="createmodifier";

	undo(){
		Hdrpaint.removeLayer(this.undo_data.layer_id);
	}
	func(){
		var param = this.param;
		var src_layer= param.src_layer;
		var n= param.position;

		var layer;
		if(!this.undo_data){
			layer = Hdrpaint.createModifier(param.modifier);
			Vec2.setValues(layer.size,param.width,param.height);
			layer.init();

			this.undo_data={"layer_id":layer.id};
		}
		if(param.parent_layer_id>0){
			var parentLayer = Layer.findById(param.parent_layer_id);

			parentLayer.append(n,this.undo_data.layer_id);
			hdrpaint.selectLayer(this.undo_data.layer_id);
		}else{
			hdrpaint.root_layer_id = layer.id;
			hdrpaint.root_layer = layer;
		}

		return layer;
	}

}
hdrpaint.commandObjs["createmodifier"] = CreateModifier;
