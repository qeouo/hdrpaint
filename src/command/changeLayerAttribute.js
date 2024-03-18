
import Watcher from "../lib/watcher.js";
import Layer from "../layer.js";
import Hdrpaint from "../hdrpaint.js";
import CommandBase from "./commandbase.js";
import Util from "../lib/util.js";
class ChangeLayerAttribute extends CommandBase{
//レイヤパラメータ変更
	undo(){
		this.f(this.undo_data.value);
		
	}
	f(value){
		var param = this.param;
		var names = Util.toArray(param.name);
		var values = Util.toArray(param.value);
		var layer = hdrpaint.getLayerById(param.layer_id);

		if(!this.undo_data){
			var undo_values =[];
			for(var i=0;i<names;i++){
				undo_values.push(Watcher.getValue(layer,names[i]));
			}
			this.undo_data= {value:undo_values};
		}
		for(var i=0;i<names;i++){
			Watcher.setValue(layer,names[i],values[i])
		}
		//layer[name] = value;
		layer.refreshDiv();
		if(layer.type===2){
			layer.registRefreshThumbnail();
		}
		parent = hdrpaint.getLayerById(layer.parent);

		parent.bubbleComposite();
	}
	func(){
		this.f(this.param.value);

	}
};
ChangeLayerAttribute.prototype.name="changeLayerAttribute";
Hdrpaint.commandObjs["changeLayerAttribute"] = ChangeLayerAttribute;
