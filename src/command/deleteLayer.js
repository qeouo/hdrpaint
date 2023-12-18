//レイヤ削除
import Hdrpaint from "../hdrpaint.js";
import CommandBase from "./commandbase.js";
import Layer from "../layer.js";
class DeleteLayer extends CommandBase{
	undo(){
		var layer = this.undo_data.layer;
		var idx = this.undo_data.position;
		var parent_layer = Layer.findById(this.undo_data.parent);

		parent_layer.append(idx,layer.id);
	}
	func(){

		var layer_id = this.param.layer_id;

		var layer = Layer.findById(layer_id);
		var parent_layer = Layer.findById(layer.parent);
		if(parent_layer){
			var children = parent_layer.children;
			var idx=  children.indexOf(layer_id);

			if(!this.undo_data){
				this.undo_data ={"layer":layer,"position":idx,"parent":parent_layer.id};
			}

			//レイヤ削除
			Hdrpaint.removeLayer(layer_id);
			if(layer === Hdrpaint.selected_layer){
				if(children.length===0){
					hdrpaint.selectLayer(parent_layer.id);
				}else{
					if(idx<children.length){
						layers[idx].select();
					}else{
						layers[children.length-1].select();
					}
				}
			}
			parent_layer.bubbleComposite();
		}
	}
};

Hdrpaint.commandObjs["deleteLayer"]= DeleteLayer;
