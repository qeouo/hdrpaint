import Main from "../main.js";
import Hdrpaint from "../hdrpaint.js";

import Layer from "../layer.js";
var img;
var img_data;
class Link extends Layer{
	static name="link";
	static type="generator";
	static option="<select id='layerlist' name='target'></select>";
	constructor(){
		super();
		this.children=null;
	}

	beforeReflect(){}

	reflect(_img,composite_area){
	}

}

hdrpaint.registModifier(Link);

