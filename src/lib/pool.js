
export default function pooling(ret){
	//プール
	ret.poolIndex=0;
	ret.pool = [];

	for(var j=0;j<64;j++){
		ret.pool.push(new ret());
	}
	ret.alloc=function(){
		this.poolIndex++;
		//if(this.poolIndex>128){
		//	alert(this+ "poolIndex leak!?");
		//}
		//if(this.poolIndex>this.pool.length){
		//	for(var i=0;i<16;i++){
		//		this.pool.push(new this());
		//	}
		//}
		return this.pool[this.poolIndex-1];
	}
	ret.free=function(num){
		this.poolIndex-=num;
		//if(this.poolIndex<0){
		//	alert(this+"poolIndex okashii!");
		//}
	}
}
	
