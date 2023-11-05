import {Vec3,Vec4} from "./vector.js"
import Util from "./util.js";
import ColorSelector from "./colorselector.js";

window.Util = Util;

//カラーピッカー
export default class Colorpicker{
	#safe=0;

	#bindfunc=`
var value = this.watches[0].getValue();
if(!value){
	value =[0,0,0];
}
var hex;
hex = Util.rgb2hex(value);

return hex;
	`

	#feedback=`
var cols=new Array(3);

Util.hex2rgb(cols,event.currentTarget.value);
var value = this.watches[0].getValue();
value[0] = Number(cols[0]);
value[1] = Number(cols[1]);
value[2] = Number(cols[2]);
	`

	constructor(){
		this.colorselector = new ColorSelector(false);

		var parentInput=null;//カラーピッカーが表示されている親コントロール
		

	}
	init(nodes){
		//カラーピッカー要素作成
		var container = document.createElement("div");
		container.classList.add("colorpickerhdr_form");
		container.appendChild(this.colorselector.div);
		document.body.appendChild(container);

		this.container = container;

		this.colorselector.changeCallback=()=>{
			this.changeCallback(this.parentInput);
		}

		//カラーピッカー表示非表示イベント
		container.addEventListener("pointerdown",(evt)=>{
			this.#safe=1;
		});
		window.addEventListener("pointerdown",(evt)=>{
			if(!this.#safe){
				container.style.display="none";
			}
			this.#safe=0;
		});

		this.setBind(nodes);

	}
	setBind(nodes){
		//ページ読み込み時に className="colorpicker"のinputタグを対象に
		//カラーピッカーコントロール対応させる
		Array.prototype.forEach.call(nodes,(e)=>{
			var node=e;
			if(node.value === ""){
				node.value = "ffffff";
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

		var rgb = new Vec4();
		Util.hex2rgb(rgb,node.value);

		var rgba = Util.rgba(rgb[0]*255,rgb[1]*255,rgb[2]*255,1);

		node.style.backgroundImage= "linear-gradient( 0," + rgba + "," + rgba + "),url(css/back.png)";

		//テキスト色を背景色に合わせて変える
		node.style.color=(0.3*rgb[0]+0.6*rgb[1]+0.1*rgb[2]<0.5)?"white":"black";
		
	}

	changeCallback(node){
		//カラーピッカーで色が選択されたときに元コントロールに反映する処理
		if(!node){
			return;
		}
		var rgb = new Vec4();
		rgb[0] = this.colorselector.R_txt.value;
		rgb[1] = this.colorselector.G_txt.value;
		rgb[2] = this.colorselector.B_txt.value;

		node.value = Util.rgb2hex(rgb);
		Util.fireEvent(node,"change");

		this.updateStyle(node);
	}

	
	showSelector(node){
		//インプットボックスがクリックされたときカラーピッカーを表示する
		this.parentInput = node;
		var container = this.container;
		//クリック時、カラーピッカーを表示
		//parentInput=this;
		container.style.display="block";

		var rect = node.getBoundingClientRect();
		container.style.left=rect.left + window.pageXOffset+"px";
		container.style.top=rect.top+rect.height  +window.pageYOffset +"px";


		//カラーピッカーに現在値をセット
		var rgb = new Vec4();
		Util.hex2rgb(rgb,node.value);
		rgb[3]=1;

		this.colorselector.setColor(rgb);

	}
};
