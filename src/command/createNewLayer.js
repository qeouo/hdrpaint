//レイヤ新規作成
import Hdrpaint from "../hdrpaint.js";
import Img from "../lib/img.js";
import Layer from "../layer.js";
import CommandBase from "./commandbase.js";

class CreateNewLayer extends CommandBase{
	constructor(){
		super();
	}
	undo(){
		Hdrpaint.removeLayer(this.undo_data.layer_id);
		return;
	}
	func(){
		var param = this.param;
		var width = param.width;
		var height= param.height;
		var n= param.position;

		var layer_id;
		if(!this.undo_data){
			var img = hdrpaint.createImg(width,height);

			var layer =Hdrpaint.createLayer(img.id,param.composite_flg);
			layer_id=layer.id;
			this.undo_data={"layer_id":layer.id};
		}else{
			layer_id = this.undo_data.layer;
		}
		if(param.parent>0){
			var parentLayer = Layer.findById(param.parent);

			parentLayer.append(n,layer_id);

			hdrpaint.selectLayer(layer_id);
		}else{
			hdrpaint.root_layer_id = layer_id;
			hdrpaint.root_layer = Layer.findById(layer_id);
		}

		return layer_id;

	}
};
CreateNewLayer.prototype.name="createNewLayer";

class CreateNewCompositeLayer extends CreateNewLayer{}
CreateNewCompositeLayer.prototype.name="createNewCompositeLayer";

hdrpaint.commandObjs["createNewLayer"] = CreateNewLayer;
hdrpaint.commandObjs["createNewCompositeLayer"] = CreateNewCompositeLayer;
