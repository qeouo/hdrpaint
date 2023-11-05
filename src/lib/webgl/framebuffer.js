import Rastgl from "../rastgl.js"
import gl from "./gl.js"

export default class Framebuffer{
	constructor(){
		var gl = Rastgl.gl;
		this.gl_framebuffer = gl.createFramebuffer();
	}
	texture(num,tex){
		if(!tex){
			tex = num;
			num = 0;
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.gl_framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + num, gl.TEXTURE_2D, tex.gl_texture , 0);
	}
	clear(){
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.gl_framebuffer);
		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
	}
	depthTexture(tex){
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.gl_framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex.gl_texture, 0);
	}
}
