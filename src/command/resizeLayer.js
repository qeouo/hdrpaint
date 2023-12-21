//リサイズレイヤ
//
import Hdrpaint from "../hdrpaint.js";
import CommandLog from "../commandlog.js";
import CommandBase from "./commandbase.js";
import Layer from "../layer.js";
import Img from "../lib/img.js";

class ResizeLayer extends CommandBase{
	undo(){
		this.func(true);
	}

	func(undo_flg){

		var param = this.param;

		if(param.layer_id===-1){
			if(undo_flg){
				for(var li=this.cmds.length;li--;){
					this.cmds[li].undo();
				}

				return;
			}

			//全レイヤ一括の場合バッチ化
			var cmds =[];
			var layers = Layer.layerArray();
			for(var li=0;li<layers.length;li++){
				var layer = layers[li];
				if(layer === Hdrpaint.root_layer){continue;}
				var cmd = new ResizeLayer();
				cmd.param={"layer_id":layer.id,"width":param.width,"height":param.height};
				cmd.func();
				cmds.push(cmd);
			}
			this.cmds = cmds;

			return;
		}

		var layer = Layer.findById(param.layer_id);
		var old_img = hdrpaint.getImgById(layer.img_id);
		if(!old_img){
			return;
		}
		var old_width=old_img.width;
		var old_height=old_img.height;
		var width  = param.width;
		var height= param.height;

		if(undo_flg){
			width=this.undo_data.width;
			height=this.undo_data.height;
		}
		layer.width=width;
		layer.height=height;
		
		//差分ログ作成
		if(!this.undo_data){
			this.undo_data = {"width":old_width,"height":old_height};
			var dx = old_width-width;
			var dy = old_height-height;
			this.undo_data.difs=[];
			
			var dif;
			if(dx>0){
				dif = Hdrpaint.createDif(old_img,width,0,dx,old_height);
				this.undo_data.difs.push(dif);
			}
			if(dy>0){
				dif= Hdrpaint.createDif(old_img,0,height,old_width,dy);
				this.undo_data.difs.push(dif);
			}
		}

		var new_img = hdrpaint.createImg(width,height);
		layer.img_id= new_img.id;
		layer.size[0]=width;
		layer.size[1]=height;
		Img.copy(new_img,0,0,old_img,0,0,old_img.width,old_img.height);
		layer.refreshDiv();
		layer.registRefreshThumbnail();
		if(layer.parent){
			var parentLayer = Layer.findById(layer.parent);
			parentLayer.bubbleComposite();
		}
	}
};
ResizeLayer.prototype.name="resizeLayer";
Hdrpaint.commandObjs["resizeLayer"] = ResizeLayer;
