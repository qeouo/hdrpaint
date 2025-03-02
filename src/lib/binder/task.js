
export default class Task{

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
