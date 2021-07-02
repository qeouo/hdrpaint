//バインド

import Util from "./util.js";
class Bind{
	constructor(node,variable){
		this.node=node;
		this.attribute_name="";
		this.variable=variable;
	}

	getBindValue(n){
		//バインドされた変数の値を取得
		var bind = this;
		var value=this.variable_root;
		for(var j=0;j<bind.variable.length-n;j++){
			value = value[bind.variable[j]];
			if(value == undefined){
				value=null;
				break;
			}
		}
		return value;
	}

	feedBack(value){
		if(value === undefined){
			var node = this.node;
			if(node.getAttribute("type")==="checkbox"){
				value = node.checked;
			}else{
				value = node.value;
				if(node.hasAttribute("number")){
					value = Number(value);
				}
			}
		}
		//バインド変数にコントロールの値をセットする
		var val =this.getBindValue(1); //対象の変数の親を取得
		val[this.variable[this.variable.length-1]]=value;
		this.old_value=null;
	}

	refresh(){
		//バインドされた変数の値をノード属性にセット
		var bind = this;
		var value = this.getBindValue(0);
		if(bind.old_value  === value){
			return;
		}
		var node = bind.node;

		if(bind.attribute_name !==""){
			node.setAttribute(bind.attribute_name,value);
			bind.old_value = value;
			return;
		}
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
				Util.fireEvent(node,"input");
			break;
		default:
			if(value && (value instanceof HTMLElement || value.nodeName)){
				node.innerHTML="";
				node.appendChild(value);
			}else{
				node.textContent= value;
			}
		}
		bind.old_value = value;
	}
}

export default class Binder {
	constructor(){
		this.binds=[];
		this.variable_root = window;
	}

	init(_variable_root){
		//初期化&バインド
		if(_variable_root){
			this.variable_root = _variable_root;
		}
		//this.binds=[];

		var bindedNodes = document.querySelectorAll("*");
		bindedNodes.forEach((node)=>{
			for(var i=0;i<node.attributes.length;i++){
				var attribute_name = node.attributes[i].name;
				if(attribute_name.indexOf("bind:")!==0)continue;

				var variable_name = node.getAttribute(attribute_name);

				attribute_name = attribute_name.replace("bind:","");
				this.bind(node,attribute_name,variable_name);
			
			};
		});
		

		var func =()=>{
			this.refresh();
			window.requestAnimationFrame(func);
		}
		func();
	}

	bind(node,attribute_name,variable_name,variable_root){
		var bind = this.binds.find((e)=>{return (e.node == node && e.attribute_name == attribute_name);});
		if(bind){
			return bind;
		}
		//ノードとバインド変数を渡してバインド情報を登録する
		bind=new Bind();
		bind.node = node;

		bind.attribute_name = attribute_name;

		bind.variable = variable_name.split(".");
		if(!variable_root){
			variable_root = this.variable_root;
		}
		bind.variable_root = variable_root;
		bind.binder=this;
		this.binds.push(bind);

		if(node.hasAttribute("feedback")){
			node.addEventListener("change",()=>{
				bind.feedBack();
			});
		}
		return bind;
	}
	bindNodes(node,variable_root){
		var bindedNodes = node.querySelectorAll("*");
		bindedNodes.forEach((node)=>{
			for(var i=0;i<node.attributes.length;i++){
				var attribute_name = node.attributes[i].name;
				if(attribute_name.indexOf("bind:")!==0)continue;

				var variable_name = node.getAttribute(attribute_name);

				attribute_name = attribute_name.replace("bind:","");
				this.bind(node,attribute_name,variable_name,variable_root);
			
			};
		});
		
	}

	refresh(){
		//バインドしたノードに変数の値をセット
		for(var i=0;i<this.binds.length;i++){
			this.binds[i].refresh();
		}

	}
}
