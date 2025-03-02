import Layer from "../layer.js";
import CommandBase from "./commandbase.js";
import Brush from "../brush.js";

hdrpaint.registCommand(
class Cutstroke extends CommandBase{
	static name ="cutstroke"

	undo(){
		var param = this.param;
		var layer = hdrpaint.getLayerById(param.layer_id);
		var command = layer.commands[param.command_index];
		var command2 = layer.commands[layer.commands.length-1];
		var points= command.param.points;
		command.param.points = points.concat(command2.param.points);

		super.undo();

	};
	func(undo){
		var param = this.param;
		var layer = hdrpaint.getLayerById(param.layer_id);
		var command = layer.commands[param.command_index];
		var points= layer.commands[param.command_index].param.points;
		var anchor = points[param.anchor_index];

		command.param.points = points.slice(0,param.anchor_index);

		var command2 = this.undo_data;
		if(this.undo_data){
		}else{
			var points2 = points.slice(param.anchor_index);

			var param2 = {};
			Brush.setParam(param2,command.param.brush,command.param.color);
			param2.layer_id=param.layer_id;
			param2.img_id=-1;
			param2.points = points2;
			command2 = hdrpaint.createCommand("brush",param2);
			this.undo_data = command2;
		}
		layer.commands.push(command2);

		hdrpaint.redraw_ui=true;
		var parent_layer = Layer.findById(layer.parent);
		parent_layer.bubbleComposite();

	};

});
