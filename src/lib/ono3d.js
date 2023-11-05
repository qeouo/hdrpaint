"use strict"
import Engine from "../engine/engine.js"
import Util from "./util.js"
import Rastgl from "./rastgl.js"
import Img from "./img.js"
import Sort from "./sort.js"
import Shader from "./shader.js"
import Texture from "./webgl/texture.js"
import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "./vector.js"

var att_types={};

var setUniform=function(gl,uni,value,num){
	if(!uni)return;
	var l=uni.location;

	switch(uni.type){
		case "int":
			gl.uniform1i(l,value);
			break;
		case "float":
			gl.uniform1f(l,value);
			break;
		case "float[]":
			gl.uniform1fv(l,value);
			break;
		case "vec2":
			gl.uniform2fv(l,value);
			break;
		case "vec3":
			gl.uniform3fv(l,value);
			break;
		case "mat3":
			gl.uniformMatrix3fv(l,false,value);
			break;
		case "mat4":
			gl.uniformMatrix4fv(l,false,value);
			break;
		case "sampler2D":
		case "usampler2D":
		case "isampler2D":
			gl.activeTexture(gl.TEXTURE0 + num); 
			gl.uniform1i(uni.location,num);
			if(value){
				gl.bindTexture(gl.TEXTURE_2D,value.gl_texture);
			}else{
				gl.bindTexture(gl.TEXTURE_2D,Rastgl.dummyTexture); //テクスチャ未指定の場合はダミーを設定
			}
			break;
		default:
			break;
	}
}

	var mat=new Float32Array(9);
	var reso  =new Float32Array(2);

	var _PI= 1.0/Math.PI;
	var gl;
	var shaders;
	var currentpath = "./lib/";//Util.getCurrent();
	var
		i
		
		,RF_OUTLINE=i=1
		,RF_DOUBLE_SIDED=++i

	;
	var DEFAULT_VERTEX_DATA_SIZE = 20*4;
	var TEXSIZE =1024;
	var LightSource= function(){
		this.matrix= new Mat44();
		this.viewmatrix= new Mat44();
		this.viewmatrix2= new Mat44();
		this.color = new Vec3();
		this.type
		this.power =1
	}

	var Environment=function(){
		this.name="";
		this.envTexture ="";
		this.sun = new LightSource();
		this.area = new LightSource();
	}
	var Material =function(){
		this.name="";
		this.baseColor =new Vec3();//乱反射色 
		this.baseColorMap =null; //ベースカラーテクスチャ
		this.opacity = 1.0; //不透明度
		this.metallic= 0.0; //全反射強度
		this.metalColor = new Vec3();//反射色
		this.roughness =1.0; //反射粗度
		this.ior = 0.0; //屈折率
		this.subRoughness = 0.0; //透明粗度
		this.emt=0.0; //自己発光強度
		this.pbrMap=null; //pbrテクスチャ

		this.heightMap=null; //法線マップテクスチャ
		this.heightMapPower=0.0; //法線マップ強度
		this.lightMap=null;
		this.offsetx=0.0; //uvオフセット
		this.offsety=0.0; //
		this.uv="";

		this.bold=1.0; //太さ

		this.shader = ""; //シェーダ


	}
	var Face = function(){
		this.vertices=new Uint16Array(3);
		
		this.environments=new Array(2);
		this.environmentRatio=0.0;
	}
	var Line = function(){
		this.bold=1;
		this.pos=[];
		this.pos[0]=new Vec3();
		this.pos[1]=new Vec3();
		this.material=0;
	};
	var perspectiveMatrix = function(mat,left,right,top,bottom,zn,zf){
		if(zn==null){
			//省略されている場合
			zf=bottom;
			zn=top;
			top =right*zn;
			bottom=-top;
			right=left*zn;
			left=-right;
		}
		//透視行列を作る 
		Mat44.setValue(mat
			,2*zn/(right-left),0,0,0
			,0,2*zn/(top-bottom),0,0
			,(right+left)/(right-left),(top+bottom)/(top-bottom),-(zn+zf)/(zf-zn),-1.0
			,0,0,-2*zn*zf/(zf-zn),0);

	}
export default class Ono3d {
	static setUniform=function(gl,uni,value,num){
		setUniform(gl,uni,value,num);
	}
	constructor(){
		this.rf = 0; //描画フラグ
		this.smoothing = 0; //スムーシング率
		this.viewMatrix=new Mat44(); //ビュー変換行列
		this.worldMatrix=new Mat44(); //ワールド変換行列
		this.projectionMatrix=new Mat44(); //プロジェクション行列
		this.pvMatrix=new Mat44();// プロジェクションxビュー行列

		//描画プリミティブバッファのインデックス
		this.vertices_index = 0
		this.faces_index=0;
		this.lines_index = 0

		//静的プリミティブバッファ
		this.vertices_static_index=0;
		this.faces_static_index=0;
		this.materials_static_index=0;

		//ビューポート情報
		this.viewport = new Float32Array(4);
		this.viewport[0]=0;
		this.viewport[1]=0;
		this.viewport[2]=100;
		this.viewport[3]=100;

		//ニアクリップ
		this.znear=0.1;
		//ファークリップ
		this.zfar=80;
		//視野角 ( (中心から端)/奥行 ) 
		this.aov=1;

		this.renderTarget;
		this.canvasTarget;

		this.bold=1.0
		this.lineColor=new Vec4();

		this.env2Texture=null;
		this.shadowTexture=null;
		this.envbufTexture=null;

		var i
		,RENDERFACES_MAX=40960;
		
		this.materials=[];
		for(i=0;i<256;i++)this.materials.push(new Material());

		this.environments=[];
		for(i=0;i<8;i++)this.environments.push(new Environment());


		this.lines = new Array(RENDERFACES_MAX)
		this.faces= new Array(RENDERFACES_MAX)
		for(i=this.faces.length;i--;){
			this.faces[i] = new Face();
			this.lines[i] = new Line();
		}



		this.stackTransMatrix=new Array()
		this.stackIndex=0
		for(var i=32;i--;)this.stackTransMatrix.push(new Mat44())

		//this.clear();
		this.faces_index=this.faces_static_index;
		this.lines_index=0;
		this.vertices_index=this.vertices_static_index;
		this.materials_index=this.materials_static_index;

	}

	setStatic(){
		this.faces_static_index=0;//this.faces_index;
		this.vertices_static_index=this.vertices_index;
		this.materials_static_index=this.materials_index;
	}
	clear(){
		this.faces_index=this.faces_static_index;
		this.lines_index=0;
		this.vertices_index=this.vertices_static_index;
		this.materials_index=this.materials_static_index;
	};

	
	stereoDraw(func){
		var x=this.viewport[0];
		var y=this.viewport[1];
		var WIDTH=this.viewport[2];
		var HEIGHT=this.viewport[3];

		if(globalParam.stereomode==0){
			globalParam.gl.viewport(x,y,WIDTH,HEIGHT);
			//perspectiveMatrix(this.projectionMatrix,this.aov,this.aov*HEIGHT/WIDTH
			//	,this.znear,this.zfar);
			//Mat44.dot(this.pvMatrix,this.projectionMatrix,this.viewMatrix);
			func();
		}else{
			var p=1.0;
			var q=(1-p)*0.5;
			var stereo;
			WIDTH =WIDTH/2;
			globalParam.gl.viewport(WIDTH*q,HEIGHT*q,WIDTH*p,HEIGHT*p);
			stereo=globalParam.stereo;
			perspectiveMatrix(this.projectionMatrix,this.aov,this.aov*HEIGHT/WIDTH
				,this.znear,this.zfar);
			this.projectionMatrix[8]=0;//stereo/10;
			this.projectionMatrix[12]=stereo;
			Mat44.dot(this.pvMatrix,this.projectionMatrix,this.viewMatrix);
			func();

			this.projectionMatrix[12]*=-1;
			Mat44.dot(this.pvMatrix,this.projectionMatrix,this.viewMatrix);
			globalParam.gl.viewport(WIDTH+WIDTH*q,HEIGHT*q,WIDTH*p,HEIGHT*p);
			func();
		}
	}


	render(camerap,flg){
	}

	drawLine=function(start,size){
		if(size===0)return;

		var ono3d = this;
		var material;
		var lines=ono3d.lines;
		var shader = this.shaders["plain"];

		var i=0;

		var a= Vec4.alloc();

		material = lines[start].material;
		Ono3d.encode(a,material.baseColor);

		gl.uniform4f(shader.unis["uColor"].location,a[0],a[1],a[2],a[3]);

		//if(!globalParam.windows){
		if(!globalParam.windows){
			gl.lineWidth(material.bold);
		}
			gl.lineWidth(2);

		ono3d.stereoDraw(function(){
			gl.uniformMatrix4fv(shader.unis["projectionMatrix"].location,false,ono3d.pvMatrix);
			gl.drawArrays(gl.LINES, start*2, size*2);
		});
		
		Vec4.free(1);
	}


	/** 環境マップを背景として描画 **/
	drawCelestialSphere(image,flg){
		var shader = this.shaders["celestialsphere"];
		if(flg){
			//エンコードせずに描画
			shader = this.shaders["celestialsphere_f"];
		}
		var mat44 = Mat44.alloc();

		Mat44.getInv(mat44,this.pvMatrix);
		gl.useProgram(shader.program);
		gl.uniformMatrix4fv(shader.unis["projectionMatrix"].location,false,new Float32Array(mat44));

		Ono3d.postEffect(image,0,0,1,1,shader); 
		Mat44.free(1);
	}


	setFace(p0,p1,p2,material){
		var renderVertices =this.verticesFloat32Array;
		var rvIndex=this.vertices_index;
		var renderFaces=this.faces;
		var rfIndex=this.faces_index;

		var n = new Vec3();
		Vec3.cross2(n,p0,p1,p2);
		Vec3.normalize(n,n);
		
		//面追加
		var renderFace = this.faces[this.faces_index];
		renderFace.material= material;
		renderFace.vertices[0]=rvIndex;
		renderFace.vertices[1]=rvIndex+1;
		renderFace.vertices[2]=rvIndex+2;
		var environment = this.environments[0];
		renderFace.environments[0] = environment;
		renderFace.environments[1] = environment;
		renderFace.environmentRatio = 0;

		renderVertices[rvIndex*20] = p0[0];
		renderVertices[rvIndex*20+1] = p0[1];
		renderVertices[rvIndex*20+2] = p0[2];
		renderVertices[rvIndex*20+3] = n[0];
		renderVertices[rvIndex*20+4] = n[1];
		renderVertices[rvIndex*20+5] = n[2];
		renderVertices[rvIndex*20+14]=0;
		renderVertices[rvIndex*20+17]=0;
		renderVertices[rvIndex*20+18]=0;
		renderVertices[rvIndex*20+19]=0;
		rvIndex++;
		renderVertices[rvIndex*20] = p1[0];
		renderVertices[rvIndex*20+1] = p1[1];
		renderVertices[rvIndex*20+2] = p1[2];
		renderVertices[rvIndex*20+3] = n[0];
		renderVertices[rvIndex*20+4] = n[1];
		renderVertices[rvIndex*20+5] = n[2];
		renderVertices[rvIndex*20+14]=0;
		renderVertices[rvIndex*20+17]=0;
		renderVertices[rvIndex*20+18]=0;
		renderVertices[rvIndex*20+19]=0;
		rvIndex++;
		renderVertices[rvIndex*20] = p2[0];
		renderVertices[rvIndex*20+1] = p2[1];
		renderVertices[rvIndex*20+2] = p2[2];
		renderVertices[rvIndex*20+3] = n[0];
		renderVertices[rvIndex*20+4] = n[1];
		renderVertices[rvIndex*20+5] = n[2];
		renderVertices[rvIndex*20+14]=0;
		renderVertices[rvIndex*20+17]=0;
		renderVertices[rvIndex*20+18]=0;
		renderVertices[rvIndex*20+19]=0;

		this.vertices_index+=3;
		this.faces_index+=1;
	}

	setLine(p0,p1,material){
		//線追加
		var renderLine =this.lines[this.lines_index];
		renderLine.material=material;
		this.lines_index++;
		Vec3.copy(renderLine.pos[0],p0);
		Vec3.copy(renderLine.pos[1],p1);
	}
		
	loadShader(path,name){
		if(!name){
			name = path;
		}
		this.shaders[name] = Shader.load(path);
	}
		
	init(_canvas,_ctx){
		gl = Rastgl.gl;

		this.gl = gl;
		this.clear()

		var x = 1024;
		var y = 1024;

		this.texture32 = new Texture(x,y,1);






		att_types["vec2"]={size:2,type:gl.FLOAT};
		att_types["vec3"]={size:3,type:gl.FLOAT};
		att_types["vec4"]={size:4,type:gl.FLOAT};
		att_types["float"]={size:1,type:gl.FLOAT};

		this.env2Texture= new Texture(TEXSIZE,TEXSIZE);
		this.shadowTexture = new Texture(TEXSIZE,TEXSIZE);
		this.shadowTexture.clamp(true);
		gl.bindTexture(gl.TEXTURE_2D, this.shadowTexture.gl_texture);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

		this.envbufTexture = new Texture(1024,512);
		this.indexBuffer = new Uint16Array(Rastgl.VERTEX_MAX);
		this.verticesFloat32Array= new Float32Array(Rastgl.VERTEX_MAX*20);

		this.shaders=[];
		shaders = this.shaders;

		var filenames=[ "shadow_dec","shadow","plain","half","multiadd","fill","add"
			,"average","average2","average3","decode"
			,"rough","celestialsphere","celestialsphere_f","envset","gauss","normal"
			,"cube2polar","hud","u32tof111110","directional"
			,"copy","copy2","hextiling","basecolor"
			];
		for(var i=0;i<filenames.length;i++){
			var filename = filenames[i];
			this.loadShader(currentpath+"shader/"+filename+".shader",filename);
		}

		Ono3d.plainShader=  Shader.create(" \
			[vertexshader] \
			attribute vec2 aPos; \
			uniform vec2 uPosScale; \
			uniform vec2 uPosOffset; \
				uniform vec2 uUvScale; \
			uniform vec2 uUvOffset; \
			varying vec2 vUv; \
			void main(void){ \
				gl_Position = vec4(aPos * uPosScale + uPosOffset,1.0,1.0); \
				vUv = (aPos+ 1.0) * 0.5 * uUvScale +  uUvOffset; \
			} \
			[fragmentshader] \
			varying lowp vec2 vUv; \
			uniform sampler2D uSampler; \
			void main(void){ \
				gl_FragColor= texture2D(uSampler,vUv); \
			} "
		);

	}
	setViewport(x,y,width,height){
		this.viewport[0]=x;
		this.viewport[1]=y;
		this.viewport[2]=width;
		this.viewport[3]=height;
		gl.viewport(x,y,width,height);
	}

	static setDrawBuffers(gl,n,offset=0){
		if(!gl.getParameter(gl.FRAMEBUFFER_BINDING)){
			return;
		}

		var buffer_list = [];
		for(var ii=0;ii<offset;ii++){
			buffer_list.push( gl.NONE) ;
		}
		for(var ii=0;ii<n;ii++){
			buffer_list.push( gl.COLOR_ATTACHMENT0+(ii+offset)) ;
		}
		gl.drawBuffers(buffer_list);
	}
}
	Ono3d.Material = Material;
	Ono3d.Face = Face;

	Ono3d.RF_OUTLINE=RF_OUTLINE
	Ono3d.RF_DOUBLE_SIDED=RF_DOUBLE_SIDED

	
	//-x~x,-y~y,zn~zf
	Ono3d.calcOrthoMatrix = function(mat,x,y,zn,zf){
		Mat44.setValue(mat
		,-1.0/x,0,0,0
		,0,1.0/y,0,0.0
		,0,0,2.0/(zf-zn),0.0
		,0,0,-(zf+zn)/(zf-zn),1.0);
	}


	Ono3d.calcMainShaderName=function(material){
		//マテリアルの各種設定を有効化したシェーダを取得
		var options=["lightMap","heightMapPower","pbrMap"];
		var num=0;
		for(var oi=0;oi<options.length;oi++){
			if(options[oi]==="opacity"){
				if(material[options[oi]] !== 1.0){
					num|=(1<<oi);
				}
			}else{
				if(material[options[oi]]){
					num|=(1<<oi);
				}
			}
		}

		if(material["metallic"]){
			num|=(1<<2);
		}

		var options3=[];
		if(material.lightMap){options3.push("lightmap")}
		else {options3.push("lightprobe")};
		if(material.heightMapPower){options3.push("height")};
		if(material.pbrMap){options3.push("pbr")};
		var txt = Ono3d.main_shader_org;

		var name = "main_"+num;
		if(!shaders[name]){
			var path = currentpath + this.mainshader_path;
			var src = shaders["main"].source;
			shaders[name] = Shader.create(src ,options3,path);
		}
		return "main_"+num;
	}

Ono3d.calcST = function(s,t,p0,p1,p2,u0,v0,u1,v1,u2,v2){
	var du1=u1-u0;
	var dv1=v1-v0;
	var du2=u2-u0;
	var dv2=v2-v0;
	var dx1=p1[0]-p0[0];
	var dy1=p1[1]-p0[1];
	var dz1=p1[2]-p0[2];
	var dx2=p2[0]-p0[0];
	var dy2=p2[1]-p0[1];
	var dz2=p2[2]-p0[2];

	var d2=du1*dv2-du2*dv1;
	if(d2===0){
	}else{
		d2=1/d2;
		//d2 = 1.0;
		s[0]=(dv1*dx2-dv2*dx1)*d2;
		s[1]=(dv1*dy2-dv2*dy1)*d2;
		s[2]=(dv1*dz2-dv2*dz1)*d2;
		t[0]=-(du1*dx2-du2*dx1)*d2;
		t[1]=-(du1*dy2-du2*dy1)*d2;
		t[2]=-(du1*dz2-du2*dz1)*d2;
	}
		Vec3.mul(s,s,1/Vec3.scalar2(s));
		Vec3.mul(t,t,1/Vec3.scalar2(t));
	return false;
}

	Ono3d.loadShader=function(path,func){
		var s={};
		Util.loadText(path,function(txt){
			try{
				var shader = Ono3d.createShader(txt);
				shader.name = path;
				var keys =Object.keys(shader);
				for(var i=0;i<keys.length;i++){
					s[keys[i]] =shader[keys[i]]
				}
				
			}catch(e){
				alert(path+"\n"+e.message);
			}
		});
		return s;
	}

	Ono3d.copyImage= function(target,tx,ty,x,y,w,h){
		gl.bindTexture(gl.TEXTURE_2D, target.gl_texture);
		gl.copyTexSubImage2D(gl.TEXTURE_2D,0,tx,ty,x,y,w,h);
	}
	Ono3d.postEffect =function(src,u,v,w,h,sh){
		gl.disable(gl.DEPTH_TEST);
		gl.depthMask(false);

		if(!sh.program){
			return;
		}
		gl.useProgram(sh.program);

		Ono3d.setDrawBuffers(gl,sh.outnum);


		var unis = sh.unis;
		var atts = sh.atts;

		if(unis["uUvScale"])gl.uniform2f(unis["uUvScale"].location,w,h);
		if(unis["uUvOffset"])gl.uniform2f(unis["uUvOffset"].location,u,v);
		if(unis["uUnit"])gl.uniform2f(unis["uUnit"].location,1.0/src.width,1.0/src.height);

		if(src){
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D,src.gl_texture);
			//if(unis["uSampler"])gl.uniform1i(unis["uSampler"].location,0);
			if(unis["uSampler"])sh.setUniform("uSampler",src);
		}

				
		gl.bindBuffer(gl.ARRAY_BUFFER, Rastgl.fullposbuffer);
		gl.vertexAttribPointer(atts["aPos"].location, 2,gl.FLOAT, false,0 , 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, Rastgl.fullposbuffer);

		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	}

	Ono3d.packFloat = function (dst,src){ 
		var m = Math.max(src[0],Math.max(src[1],src[2])); 
		var idx = Math.ceil(Math.log(m+0.01)/Math.log(2.0)); 
		m = 1.0/Math.pow(2.0,idx);
		dst[0]=src[0]* m;
		dst[1]=src[1]* m;
		dst[2]=src[2]* m;
		dst[3]=(idx+128.0)/255.0; 
	} 

	Ono3d.unpackFloat = function(dst,src){ 
		dst[0] = src[0] * (1 - (((src[3]>>7)&1)<<1));
		dst[1] = src[1] * (1 - (((src[3]>>6)&1)<<1));
		dst[2] = src[2]  *(1 - (((src[3]>>5)&1)<<1));
		var idx= Math.floor((src[3]&0x1f)  - 15.0); 
		var m = Math.pow(2.0,idx)/255;
		dst[0] = dst[0]*m;
		dst[1] = dst[1]*m;
		dst[2] = dst[2]*m;
	} 
	Ono3d.encode = function (dst,src){ 
		var m = Math.max(src[0],Math.max(src[1],src[2])); 
		var idx = Math.ceil(Math.log(m+0.01)/Math.log(2.0)); 
		m = 1.0/Math.pow(2.0,idx);
		dst[0]=src[0]* m;
		dst[1]=src[1]* m;
		dst[2]=src[2]* m;
		dst[3]=(idx+128.0)/255.0; 
	} 
	Ono3d.decode2 = function(dst,src){ 
		var idx= Math.floor(src[2] * 256.0 - 128.0); 
		var idx2= Math.floor(src[3] * 256.0 - 128.0); 
		var m = Math.pow(2.0,idx);
		dst[0] = src[0]*Math.pow(2.0,idx);
		dst[1] = src[1]*Math.pow(2.0,idx2);
	} 
	/** 単純な画像コピー **/
	Ono3d.drawCopy= function(dx,dy,dw,dh,image,sx,sy,sw,sh){
		if(sw == null){
			sh = image;
			image = dx;
			sx = dx = dy;
			sy = sy = dw;
			sw = dw = dh;
			dh = sh;
		}
		var shader = shaders["copy"];
		var unis = shader.unis;

		gl.useProgram(shader.program);
		gl.uniform2f(unis["uPosScale"].location,dw,dh);
		gl.uniform2f(unis["uPosOffset"].location,dx,dy);

		Ono3d.postEffect(image,sx,sy,sw,sh,shader); 
	}
	/** ガウスぼかし **/
	Ono3d.gauss=function(width,height,d,src,x,y,w,h){
		//係数作成
		var weight = new Array(5);
		var t = 0.0;
		for(var i = 0; i < weight.length; i++){
			var r = 1.0 + 2.0 * i;
			var we = Math.exp(-0.5 * (r * r) / d);
			weight[i] = we;
			if(i > 0){we *= 2.0;}
			t += we;
		}
		for(i = 0; i < weight.length; i++){
			weight[i] /= t;
		}
		var shader = shaders["gauss"];
		var args=shader.unis;

		gl.useProgram(shader.program);

		gl.uniform1fv(args["weight"].location,weight);
		gl.bindBuffer(gl.ARRAY_BUFFER, Rastgl.fullposbuffer);

		//横ぼかし
		gl.uniform2f(args["uAxis"].location,1/width*w,0);
		Ono3d.postEffect(src,x,y,w,h,shader); 

		Ono3d.copyImage(src,0,src.height - height,0,0,width,height);


		//縦ぼかし
		gl.uniform2f(args["uAxis"].location,0,1/src.height);
		Ono3d.postEffect(src,0,(src.height- height)/src.height,width/src.width,height/src.height,shader); 
	}

	/** 法線マップ初期設定 (ハイトマップから法線マップに変換する)**/
	Ono3d.initNormal=function(src){
		var shader = shaders["normal"];
		

		gl.bindTexture(gl.TEXTURE_2D, src.gl_texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

		gl.disable(gl.BLEND);
		gl.disable(gl.DEPTH_TEST);

		gl.useProgram(shader.program);

		Ono3d.postEffect(src,0,0,1,1,shader); 
		Ono3d.copyImage(src,0,0,0,0,src.width,src.height);
		//this.setViewport(0,0,512,1024);
		//Ono3d.gauss(src.width,src.height,100
		//	,src,0,0,1.0,1.0,src.width,src.height); 

	}
Ono3d.LightSource = LightSource;
Ono3d.perspectiveMatrix= perspectiveMatrix;
Ono3d.mainshader_path = "shader/main.shader";

