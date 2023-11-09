import {Vec3,Vec4} from "./vector.js"
import Util from "./util.js";
import ColorSelector from "./colorselector.js";
import Colorpicker from "./colorpicker.js";

export default class ColorpickerHDR extends Colorpicker{
	//カラーピッカーHDR
	constructor(){
		super();
		this.colorselector = new ColorSelector(true);

		
	}
	#bindfunc=`
var value = this.task.watches[0].getValue();
return value;
	`
	#feedback=`
var cols=new Array(3);

Util.hex2rgb(cols,event.currentTarget.value);
var value = this.task.watches[0].getValue();
value[0] = Number(cols[0]);
value[1] = Number(cols[1]);
value[2] = Number(cols[2]);
	`

	setBind(nodes){
		//ページ読み込み時に className="colorpicker"のinputタグを対象に
		//カラーピッカーコントロール対応させる
		Array.prototype.forEach.call(nodes,(e)=>{
			var node=e;
			if(node.value === ""){
				node.value = "1,1,1,1";
			}
			
			node.addEventListener("click",(evt)=>{
				this.showSelector(evt.currentTarget);

			});
			node.addEventListener("input",(evt)=>{
				//内容変更時、背景色とカーソルをリフレッシュする
				this.updateStyle(evt.currentTarget);
			});
			this.updateStyle(e);



			for(var i=0;i<node.attributes.length;i++){
				var attribute_name = node.attributes[i].name;
				if(attribute_name.indexOf("bind:")<0)continue;

				node.setAttribute("bindfunc",this.#bindfunc);

				if(node.hasAttribute("feedback")){
					node.setAttribute("feedback",this.#feedback);
				}
				break;
			}
			
		});
	}

	updateStyle(node){
		//テキストの内容を背景色にセット
		var rgb=new Vec4();

		var sp = node.value.split(",");
		rgb[0]=Number(sp[0]);
		rgb[1]=Number(sp[1]);
		rgb[2]=Number(sp[2]);
		rgb[3]=Number(sp[3]);

		var rgba = Util.rgba(rgb[0]*255,rgb[1]*255,rgb[2]*255,rgb[3]);

		node.style.backgroundImage= "linear-gradient( 0," + rgba + "," + rgba + "),url(css/back.png)";

		node.style.color=(0.3*rgb[0]+0.6*rgb[1]+0.1*rgb[2]<0.5)?"white":"black";
		
	}

	changeCallback(node){
		if(!node){
			return;
		}
		node.value = this.colorselector.R_txt.value
			+", " +this.colorselector.G_txt.value
			+", " +this.colorselector.B_txt.value
			+", " +this.colorselector.A_txt.value;
		Util.fireEvent(node,"change");

		this.updateStyle(node);
	}	

};
