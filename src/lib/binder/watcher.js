// 変数監視ライブラリ
import Task from "./task.js"
import Watch from "./watch.js"


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
	static getValue(root,name,flg = 0){
		var v= name.split(".");
		var value=root;
		for(var j=0;j<v.length - flg;j++){
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
	static setValue(root,name,value){
		var v= name.split(".");
		var val =this.getValue(root,name,1); //対象の変数の親を取得
		val[v[v.length-1]]=value;
	}

}

