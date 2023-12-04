import Layer from "../layer.js";
import Img from "../lib/img.js";

export default class CommandBase{
	constructor(){	
		this.param={};
		this.undo_data=null;
	}

	undo(){
		//アンドゥ処理
		var difs = this.undo_data.difs;
		if(difs){
			//画像戻す
			var param = this.param;
			var img_id = null;
			if(param.img_id){
				img_id = param.img_id;
			}else{
				var layer_id= param.layer_id;
				var layer = Layer.findById(layer_id);
				img_id = layer.img_id;
			}
			var img = hdrpaint.getImgById(param.img_id)

			for(var di=difs.length;di--;){
				var dif = difs[di];
				Img.copy(img,dif.x,dif.y,dif.img,0,0,dif.img.width,dif.img.height);

				//再描画
				var keys = Object.keys(hdrpaint.layers);
				for(var i=0;i<keys.length;i++){
					var layer = hdrpaint.layers[keys[i]];
					if(layer.img_id === param.img_id){
						layer.refreshImg(dif.x,dif.y,dif.img.width,dif.img.height);
					}
				}
			}
		}
	};
	func(){
		//メイン処理
	};

	toString(){
		var param_txt="";
		var param= this.param;
		var keys=Object.keys(param);
		for(var ki=0;ki<keys.length;ki++){
			var key = keys[ki];
			if(ki){
				param_txt+=",";
			}
			param_txt+=param[key];
		}
		return  this.name +"("+param_txt+")";

	}
};
CommandBase.prototype.name="command";
