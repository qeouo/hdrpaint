//変数監視

import Util from "./util.js";
class Watch{
	constructor(variable_root,variable_name,callback){
		this.variable_root=variable_root;
		this.vairable_name = variable_name;
		this.variable_direction = variable_name.split(".");
		this.callback=callback;
		this.old_value={};
	}

	getValue(n){
		//監視対象の変数の値を取得
		// n=1なら親を取得
		if(!n){
			n=0;
		}
		var value=this.variable_root;
		var v=this.variable_direction;
		for(var j=0;j<v.length-n;j++){
			if(value == undefined){
				value=null;
				break;
			}
			if(!value){
				break;
			}
			value = value[v[j]];
		}
		return value;
	}
	setValue(value){
		//監視変数に値をセットする
		var val =this.getValue(1); //対象の変数の親を取得
		val[this.variable_direction[this.variable_direction.length-1]]=value;
	}

	refresh(){
		//バインドされた変数の値をノード属性にセット
		var value = this.getValue(0);
		if(value && (value instanceof HTMLElement || value.nodeName)){
		}else{
			if(typeof value === 'object'){
				value = JSON.stringify(value);
			}
		}
		this.change_flg = (this.old_value !== value);
		this.old_value = value;
	}
}
class Task{
	constructor(watches,callback){
		this.watches=watches;
		this.callback=callback;
	}
	exec(){
		var flg = false;
		for(var i=0;i<this.watches.length;i++){
			flg = flg || this.watches[i].change_flg;
		}
		if(flg){
			var values= this.watches.map((w)=>w.getValue(0));
			this.callback(values);
		}
	}
}

export default class Watcher {
	constructor(){
		this.watches=[];
		this.tasks=[];
	}

	init(){
		//初期化&バインド
//		var func =()=>{
//			this.refresh();
//			window.requestAnimationFrame(func);
//		}
//		func();
		var func =()=>{
			this.refresh();
			window.requestAnimationFrame(func);
		}
		func();
	}

	watch(variable_roots,variable_names,func){
		var ws = [];
		if(!Array.isArray(variable_names)){
			variable_names= [variable_names];
		}
		if(!Array.isArray(variable_roots)){
			var root = variable_roots;
			variable_roots=[];
			for(var i=0;i<variable_names.length;i++){
				variable_roots.push(root);
			}
		}
		
		for(var i=0;i<variable_names.length;i++){
			var variable_root =variable_roots[i];
			var variable_name = variable_names[i];
			var w =  this.watches.find((f)=>{return (variable_root == f.variable_root && f.variable_name == variable_name);});
			if(!w){
				//変数監視が無い場合は追加
				w = new Watch(variable_root,variable_name,func);
				this.watches.push(w);
			}
			ws.push(w);
		}
		var task = new Task(ws,func);
		this.tasks.push(task);
		return task;
	}
	refresh(){
		//監視対象をチェック
		this.watches.forEach((w)=>{
			w.refresh();
		});

		//タスク実行
		this.tasks.forEach((w)=>{
			w.exec();
		});
	}
}

