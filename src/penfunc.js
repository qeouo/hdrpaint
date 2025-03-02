
import Util from "./lib/util.js";
import Hdrpaint from "./hdrpaint.js";
import Layer from "./layer.js";
import Aabb from "./lib/aabb.js"
var id=-1;
export default class PenFunc{
	constructor(){
		this.pen_log=null;
		this.endFlg=0;
	}
	end(){
		this.endFlg=1;
	}

	actualDraw(){
		var log = this.pen_log;
		var points = log.obj.param.points;

		if(log.obj.param.img_id >=0){
			if(this.endFlg){
				log.refreshLabel();
				log.obj.draw(points.length-1);
				Hdrpaint.painted_mask.fill(0);
			}else{
				if(points.length>2){
					//ログ文面変更
					log.refreshLabel();

					//今回と前回の座標で直線描画
					log.obj.draw(points.length-2);
				}
			}
		}else{
			var layer = Layer.findById(log.obj.param.layer_id);

				var ps =[];
				var aabb = new Aabb();
			for(var i=0;i<points.length;i++){
				ps.push(points[i].pos);
			}
			Aabb.createFromPoints(aabb,ps);
			var w = log.obj.param.brush.weight*0.5;
			aabb.min[0]-=w;
			aabb.min[1]-=w;
			aabb.max[0]+=w;
			aabb.max[1]+=w;
			var parent = Layer.findById(layer.parent);
			layer.composite(aabb.min[0],aabb.min[1],aabb.max[0],aabb.max[1]);
			//layer.refreshImg(aabb.min[0],aabb.min[1],aabb.max[0]-aabb.min[0],aabb.max[1]-aabb.min[1]);
			//var parent = hdrpaint.getLayerById(layer.parent);
			//parent.bubbleComposite();
			
		}

		return;
		
	}
}
