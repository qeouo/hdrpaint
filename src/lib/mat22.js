
export default class Mat22{
	constructor(){
		var res = new Float32Array([1,0,0,1]);
		return res;
	}

	static scalar(a){
		return Math.sqrt(a[0]*a[0]+a[1]*a[1]);
	}
	static mul(a,b,c){
		a[0]=b[0]*c;
		a[1]=b[1]*c;
		a[2]=b[2]*c;
		a[3]=b[3]*c;
	}

	static dotVec2(a,b,c){
		a[0]=b[0]*c[0]+b[2]*c[1];
		a[1]=b[1]*c[0]+b[3]*c[1];
	}

	static dot(a,b,c){
		var m0=(b[0]*c[0] + b[2]*c[1]);
		var m1=(b[1]*c[0] + b[3]*c[1]);
		var m2=(b[0]*c[2] + b[2]*c[3]);
		var m3=(b[1]*c[2] + b[3]*c[3]);
		a[0]=m0;
		a[1]=m1;
		a[2]=m2;
		a[3]=m3;
	}
}
