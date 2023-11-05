export default class Vec3{
	constructor(x = 0 ,y = 0,z = 0){
		//var o=new Array(3);
		var o = new Float32Array(3);
		o[0]=x;
		o[1]=y;
		o[2]=z;
		return o;
	}
	

	static setValues(a,x,y,z){
		a[0]=x;
		a[1]=y;
		a[2]=z;
	}
	static setValue(a,x,y,z){
		this.setValues(a,x,y,z);
	}
	static copy(a,b){
		a[0]=b[0];
		a[1]=b[1];
		a[2]=b[2];
	}

	static add(a,b,c){
		a[0] = b[0] + c[0];
		a[1] = b[1] + c[1];
		a[2] = b[2] + c[2];
	}

	static sub(a,b,c){
		a[0] = b[0] - c[0];
		a[1] = b[1] - c[1];
		a[2] = b[2] - c[2];
	}
	static copy(a,b){
		a[0] = b[0];
		a[1] = b[1];
		a[2] = b[2];
	}
	static mult(a,b,c){
		a[0]=b[0]*c;
		a[1]=b[1]*c;
		a[2]=b[2]*c;
	}
	static mul(a,b,c){
		a[0]=b[0]*c;
		a[1]=b[1]*c;
		a[2]=b[2]*c;
	}
	static madd(a,b,c,d){
		this.mad(a,b,c,d);
	}
	static mad(a,b,c,d){
		a[0]=b[0]+c[0]*d;
		a[1]=b[1]+c[1]*d;
		a[2]=b[2]+c[2]*d;
	}
	static len(b,c){
		var buf0 = b[0]-c[0];
		var buf1 = b[1]-c[1];
		var buf2 = b[2]-c[2];
		return Math.sqrt( buf0*buf0 + buf1*buf1 + buf2*buf2);
	}
	static len2(b,c){
		var buf0 = b[0]-c[0];
		var buf1 = b[1]-c[1];
		var buf2 = b[2]-c[2];
		return buf0*buf0 + buf1*buf1 + buf2*buf2
	}
	static scalar(a){
		return Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2])
	}
	static scalar2(a){
		return a[0]*a[0] + a[1]*a[1] + a[2]*a[2];
	}
	static normalize(a,b){
		if(b[0] ===0 && b[1] ===0 && b[2]=== 0){
			return;
		}
		var l = Math.sqrt(b[0]*b[0] + b[1]*b[1] + b[2]*b[2])
		
		l= 1/l;
		
		a[0] =b[0]*l;
		a[1] =b[1]*l;
		a[2] =b[2]*l;
	}
	static norm(a){
		this.normalize(a,a);
	}
	static dot(a,b){
		return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
	}
	static vecmul(a,b,c){
		a[0]=b[0]*c[0];
		a[1]=b[1]*c[1];
		a[2]=b[2]*c[2];
	}
	static cross(a,b,c){
		var buf0 = b[1]*c[2] - b[2]*c[1];
		var buf1 = b[2]*c[0] - b[0]*c[2];
		var buf2 = b[0]*c[1] - b[1]*c[0];
		a[0] = buf0
		a[1] = buf1
		a[2] = buf2
	}

	static eulerFromVec3= function(a,b){
		a[1]=Math.atan2(b[0],b[2]);
		a[2]=0;
		a[0]=Math.atan2(b[1],Math.sqrt(b[0]*b[0]+b[2]*b[2]));
	}

	static cross3(a,b,c,d,e){
		Vec3.sub(buf1,c,b);
		Vec3.sub(buf2,e,d);
		Vec3.cross(a,buf1,buf2);
	}
	static cross2(a,b,c,d){
		this.cross3(a,b,c,b,d);
	}

	static checkBetween(n,n0,n1){
		var cross = new Vec3();
		Vec3.cross(cross,n0,n1);
		Vec3.cross(cross,cross,n);
		if(Vec3.dot(cross,n0) * Vec3.dot(cross,n1) > 0){
			return false;
		}
		return true;
	}
};

Vec3.ZERO = new Vec3();
var buf1=new Vec3();
var buf2=new Vec3();
