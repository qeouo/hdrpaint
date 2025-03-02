export default class Watch{
	constructor(variable_root,variable_name){
		this.variable_root=variable_root;
		this.vairable_name = variable_name;
		this.variable_direction = variable_name.split(".");

		var value= this.getValue();

		if(value && (value instanceof HTMLElement || value.nodeName)){
		}else{
			if(typeof value === 'object'){
				value = JSON.stringify(value);
			}
		}
		this.old_value = value;

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
