
import {Vec2} from "../lib/vector.js"
import Img from "../lib/img.js";
import Hdrpaint from "../hdrpaint.js";
import CommandBase from "./commandbase.js";
import Layer from "../layer.js";

export default class Crop extends CommandBase{
	static name = "crop";

	undo(){
		this.func(true);
	}
	func(undo_flg){
		if(undo_flg){
			for(var li=this.cmds.length;li--;){
				this.cmds[li].undo();
			}

			return;
		}

		//バッチ作成
		var cmds =[];
		this.cmds=cmds;
		var root_layer = hdrpaint.root_layer;
		var param  =this.param;

		var layers = root_layer.children;
		for(var li=0;li<layers.length;li++){
			var cmd = hdrpaint.createCommand("translateLayer",{"layer_id":null,"x":-param.x,"y":-param.y});
			cmd.func();
			cmds.push(cmd);
		}
		var cmd = hdrpaint.createCommand("resizeCanvas",{"width":param.width,"height":param.height});
		cmd.func();
		cmds.push(cmd);
		//root_layer.composite();
	}
};

Crop.prototype.name = "crop";
hdrpaint.registCommand(Crop);
