
import Watcher from "../lib/watcher.js";
import Layer from "../layer.js";
import Hdrpaint from "../hdrpaint.js";
import CommandBase from "./commandbase.js";
class ChangeLayerAttribute extends CommandBase{
//レイヤパラメータ変更
	undo(){
		this.f(this.undo_data.value);
		
	}
	f(value){
		var param = this.param;
		var name = param.name;
		var layer = hdrpaint.getLayerById(param.layer_id);

		if(!this.undo_data){
			this.undo_data= {value:Watcher.getValue(layer,name)};
		}
		Watcher.setValue(layer,name,value)
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
