"use strict"

import Util from "./util.js"
import {Vec2,Vec3,Vec4,Mat43,Mat44} from "./vector.js"
import Texture from "./webgl/texture.js"
import Framebuffer from "./webgl/framebuffer.js"
import gl from "./webgl/gl.js"

export default class Rastgl{
	static dummyTexture;

	static fullposbuffer;
	static FACE_MAX = 40960*2;
	static VERTEX_MAX = this.FACE_MAX*3;

	static init(_gl){

		var x=1024;
		var y =1024;
		gl = _gl;

		this.gl = _gl;

		//メインフレームバッファ
		gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.clearDepth(1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.CULL_FACE);


		var framebuffer = new Framebuffer();

		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.gl_framebuffer);
		var depthTexture = Texture.createDepth(x,y);
		depthTexture.filter(false);
		framebuffer.depthTexture(depthTexture);


		var texture = new Texture(x,y,0);
		texture.clamp(false);
		texture.filter(false);
		framebuffer.texture(texture);


		this.framebuffer = framebuffer.gl_framebuffer;

		this.fTexture= texture;

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.clearColor(1.0, 1.0, 1.0, 1.0);

		var default_framebuffer = new Framebuffer();
		default_framebuffer.gl_framebuffer = null;

		default_framebuffer.clear();

		var dummyTexture = new Texture(1,1);
		this.dummyTexture = dummyTexture.gl_texture;
		dummyTexture.copy(0,0,1,1);
		
		gl.clearColor(0.0, 0.0, 0.0, 0.0);

		this.glIdxBuffer=gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glIdxBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.VERTEX_MAX), gl.DYNAMIC_DRAW);

		this.glbuffer=gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.glbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.VERTEX_MAX*20), gl.DYNAMIC_DRAW);

		var fullposbuffer=gl.createBuffer();
		this.fullposbuffer = fullposbuffer;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.fullposbuffer);
		var buffer=new Float32Array(8);
		buffer[0]=-1;
		buffer[1]=-1;
		buffer[2]=1;
		buffer[3]=-1;
		buffer[4]=1;
		buffer[5]=1;
		buffer[6]=-1;
		buffer[7]=1;
		gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);


		return false;

	}
}

