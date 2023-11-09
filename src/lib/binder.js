//バインド

import Util from "./util.js";
import Watcher from "./watcher.js";
class Bind{
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

	refresh(watches){
		//バインドされた変数の値をノード属性にセット
		var bind = this;
		var check=false;
	//	this.watches.forEach((w,idx)=>{
	//		if(w.change_flg){
	//			check=true;
	//		}
	//	});
	//	if(!check){
	//		return;
	//	}

		var node = bind.node;

		var value = watches[0].getValue(0);
		if(bind.func){
			var old = bind.task.watches.map((w)=>w.old_value);
			value=bind.func(old);
		}

		if(bind.attribute_name !==""){
			if(bind.attribute_name=="disabled"){
				if(!value){
					node.removeAttribute(bind.attribute_name);
					return;
				}
				
			}
			node.setAttribute(bind.attribute_name,value);
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
	}
}

export default class Binder {
	constructor(){
		this.binds=[];
		this.variable_root = window;
		this.watcher = new Watcher();
	}

	init(_variable_root){
		//初期化&バインド
		if(_variable_root){
			this.variable_root = _variable_root;
		}
		this.bindNodes(document,this.variable_root);

		this.watcher.init();


	}

	bind(node,attribute_name,variable_root,variable_names,func){
		var bind = this.binds.find((e)=>{return (e.node == node && e.attribute_name == attribute_name);});
		if(bind){
			return bind;
		}
		//ノードとバインド変数を渡してバインド情報を登録する
		bind=new Bind();
		bind.node = node;

		bind.attribute_name = attribute_name;

		if(!variable_root){
			variable_root = this.variable_root;
		}

		if(!Array.isArray(variable_names)){
			variable_names = [variable_names];
		}

		var variable_roots = [];
		for(var i=0;i<variable_names.length;i++){
			variable_roots.push(variable_root);
		}

		bind.func=func;

		bind.binder=this;
		this.binds.push(bind);
		if(node.hasAttribute("feedback") && bind.attribute_name==""){
			var f= node.getAttribute("feedback");
			if(f != null && f!=""){
				bind.feedBack2 = Function(f);
			}
			node.addEventListener("change",()=>{
				bind.feedBack();
				if(bind.feedBack2){
					bind.feedBack2();
					}
			});
			
		}

	//	variable_names.forEach((name)=>{
	//		bind.watches.push(watcher.watch(variable_root,name));
	//	});
		bind.task = this.watcher.watch(variable_roots,variable_names,(watches)=>{bind.refresh(watches)});

		return bind;
	}
	bindNodes(node,variable_root){
		var bindedNodes = node.querySelectorAll("*");
		bindedNodes.forEach((node)=>{
			for(var i=0;i<node.attributes.length;i++){
				var attribute_name = node.attributes[i].name;
				if(attribute_name.indexOf("bind:")!==0)continue;

				var variable_names = node.getAttribute(attribute_name);
				variable_names = variable_names.split(",");

				attribute_name = attribute_name.replace("bind:","");

				var func=null;
				if(node.hasAttribute("bindfunc")){
					func = node.getAttribute("bindfunc");
					func = new Function('arg', func);
				}
				this.bind(node,attribute_name,null,variable_names,func);
			
			};
		});
		
	}

}
