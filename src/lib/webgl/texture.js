import Img from "../img.js"
import gl from "./gl.js"
import Ono3d from "../ono3d.js"
import Rastgl from "../rastgl.js"
import Engine from "../../engine/engine.js"

export default class Texture extends Img {

	constructor(width,height,flg){
		super(width,height,1);
		this.path="";
		this.gl_texture = Texture.createTexture(null,width,height,flg);

		gl.bindTexture(gl.TEXTURE_2D, this.gl_texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	}
	bind(){
		gl.bindTexture(gl.TEXTURE_2D, this.gl_texture);
	}
	copy(x,y,w,h){
		gl.bindTexture(gl.TEXTURE_2D, this.gl_texture);
		gl.copyTexImage2D(gl.TEXTURE_2D,0,gl.RGBA,x,y,w,h,0);
	}
	copySub(tx,ty,x,y,w,h){
		gl.bindTexture(gl.TEXTURE_2D, this.gl_texture);
		gl.copyTexSubImage2D(gl.TEXTURE_2D,0,tx,ty,x,y,w,h);
	}
	static createDepth(x,y){
		var tex = new Texture(x,y);
		tex.width=x;
		tex.height=y;
		tex.gl_texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex.gl_texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16, x, y, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		return tex;
	}
	clamp(flg){
		gl.bindTexture(gl.TEXTURE_2D, this.gl_texture);
		if(flg){
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		}else{
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		}
	}
	filter(flg){
		gl.bindTexture(gl.TEXTURE_2D, this.gl_texture);
		if(flg){
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}else{
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		}

	}

	toLinear(){
		gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.framebuffer);
		gl.disable(gl.BLEND);
		gl.disable(gl.DEPTH_TEST);

		gl.viewport(0,0,this.width,this.height);
		Ono3d.postEffect(this,0,0 ,1,1,Engine.basecolorShader); 
		gl.bindTexture(gl.TEXTURE_2D, this.gl_texture);
		Ono3d.copyImage(this,0,0,0,0,this.width,this.height);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	static loadImg(path,func){
		var func2=((func)=>{
			return (image)=>{
				image.gl_texture = Texture.createTexture(image);
				if(func){
					func(image);
					}
			}
		})(func);
		var tex = super.loadImg(path,1,func2);	
		//Img.loadImg(path,1,func2);

		return tex;
	}
	createTexture(image,x,y,float_flg){
		this.gl_texture = Texture.createTexture(image,width,height,flg);

	}

	static createTexture(image,x,y,float_flg){
		var neheTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, neheTexture);
		if(image){
			//gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			gl.texImage2D(gl.TEXTURE_2D, 0,gl.RGBA,image.width,image.height,0,  gl.RGBA, gl.UNSIGNED_BYTE, image.data);
		}else{
			if(float_flg === 1){
				//整数テクスチャ1010102
				gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGB10_A2, x, y);
			}else if(float_flg === 2){
				//整数テクスチャ32bit
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32UI, x, y, 0, gl.RGBA_INTEGER, gl.UNSIGNED_INT, null);
			}else if(float_flg === 3){
				//浮動小数点数テクスチャ
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, x, y, 0, gl.RED, gl.FLOAT, null);
			}else if(float_flg === 4){
				//浮動小数点数テクスチャ
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, x, y, 0, gl.RGBA, gl.FLOAT, null);
			}else{
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, x, y, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
			}
		}
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.bindTexture(gl.TEXTURE_2D, null);
		return neheTexture;
	}
}

