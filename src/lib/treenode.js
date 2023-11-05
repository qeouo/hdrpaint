
export default class TreeNode{
	constructor(){
		this.children=new Array(2);
		this.element=null;
	}

	find(func){
		var res = func(this);
		if(res){
			return;
		}
		this.children.forEach((e)=>{
			if(e){
				e.find(func);
			}
		});
	}
};
