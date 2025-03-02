import Util from "../util.js";
export default class Bind{
	constructor(node,variable){
		this.node=node;
		this.attribute_name="";
		this.variables=[];
		this.watches=[];
	}


	feedBack(value){
		if(value === undefined){
			var node = this.node;
			if(node.getAttribute("type")==="checkbox"){
				value = node.checked;
			}else if(node.getAttribute("type")==="radio"){
				value = node.value;
			}else{
				value = node.value;
				if(node.hasAttribute("number")){
					value = Number(value);
				}
			}
		}
		//バインド変数にコントロールの値をセットする
		var val =this.task.watches[0].setValue(value); 
	}

	refresh(values){
		//バインドされた変数の値をノード属性にセット
		var bind = this;
		var check=false;

		var node = bind.node;

		var value = values[0];
		if(bind.func){
			value=bind.func(values);
		}

		if(bind.attribute_name !==""){
			if(bind.attribute_name=="disabled"){
				if(!value){
					node.removeAttribute(bind.attribute_name);
					return;
				}
				
			}
			if(node.tagName ==="SELECT" && bind.attribute_name==="options"){
				while( node.firstChild ){
				  node.removeChild( node.firstChild );
				}
				var options = value;
				if(!Array.isArray(options)){
					options=[];
				}
				for(var i=0;i<options.length;i++){
					var op= options[i];

					var option = document.createElement("option");
					option.value = op.value;
					//option.innerText=op.name;
					Util.setText(option,op.name);
					node.appendChild(option);
				}

			}else{
				node.setAttribute(bind.attribute_name,value);
			}
			return;
		}
		node.setAttribute("content",value);
		switch(node.tagName){
			case "INPUT":
			case "SELECT":
			case "TEXTAREA":
			if(node.getAttribute("type")==="checkbox"){
				node.checked = value;
			}
			if(node.getAttribute("type")==="radio"){
				node.checked=Boolean(value === node.value);
			}else{
				node.value = value;
			}
				Bind.fireEvent(node,"input");
			break;
		default:
			if(value && (value instanceof HTMLElement || value.nodeName)){
				node.innerHTML="";
				node.appendChild(value);
			}else{
				node.textContent= value;
			}
		}
	}

	static fireEvent(elem,eventname,evt){
		if(document.all){
			elem.fireEvent("on"+eventname)
		}else{
			if(!evt){
				evt = document.createEvent("Event");
			}
			evt.initEvent(eventname,true,true);
			elem.dispatchEvent(evt)
		}
	}
}
