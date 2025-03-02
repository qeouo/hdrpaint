import Layer from "../layer.js";
import CommandBase from "./commandbase.js";


hdrpaint.registCommand(
class Deleteanchor extends CommandBase{
	static name ="deleteanchor"

	undo(){
		var param = this.param;
		var layer = hdrpaint.getLayerById(param.layer_id);
		var points= layer.commands[param.command_index].param.points;
		points.splice(param.anchor_index,0,this.undo_data);
		//super.undo();

		var parent_layer = Layer.findById(layer.parent);
		parent_layer.bubbleComposite();
		hdrpaint.redraw_ui = true;

	};
	func(undo){
		var param = this.param;
		var layer = hdrpaint.getLayerById(param.layer_id);
		var points= layer.commands[param.command_index].param.points;
		var anchor = points[param.anchor_index];

		if(!this.undo_data){
			this.undo_data = anchor;
		}
		points.splice(param.anchor_index,1);

		hdrpaint.redraw_ui=true;
		var parent_layer = Layer.findById(layer.parent);
		parent_layer.bubbleComposite();

	};

}
);
