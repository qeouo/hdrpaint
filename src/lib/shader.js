import Rastgl from "./rastgl.js"
import Ono3d from "./ono3d.js";
import gl from "./webgl/gl.js";

var ShaderCompileException = function(message){
	this.message = message;
	this.name = "UserException";
}

var att_types={};
export default class Shader{

	constructor(){
		this.path=""; //シェーダファイルパス
		this.name=""; //シェーダ名称
		this.source="";
		this.option=[];
		this.included_files = [];
	}

	setUniform(name,value){
		var uni = this.unis[name];
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
				gl.activeTexture(gl.TEXTURE0 + uni.tex_count); 
				gl.uniform1i(uni.location,uni.tex_count);
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

	static load(path,options=[]){
		var shader = new Shader();
		shader.path = path;
		shader.options = options;
		shader.load();
		
		return shader;
	}
	load(){
		Util.loadText(this.path,(txt)=>{
			this.source = txt;
			this.include(txt);
		});
	}
	static create(source,options=[],path=""){
		var shader = new Shader();
		shader.path = path;
		shader.options = options;
		shader.source = source;
		shader.include();
		
		return shader;
	}

	include(){
		var source =  this.source;
		var re= /\#include\((.+)\)/g;
		var list;
		var list2=[];
		while((list = re.exec(this.source)) !== null){
			var path= list[1];
			if(this.included_files.includes(path)){
				this.source= this.source.replace(list[0],'');
			}else{
				list2.push(path);
			}
		}
		if(list2.length===0){
			try{
				return this.createShader2();
			}catch(e){
				alert(this.path+"\n"+e.message);
				return null;
			}
		}
		this.includes_count = list2.length;
		for(var i=0;i<list2.length;i++){
			var f = ((path)=>{
				return (source)=>{
					this.includes_count --;
					this.source= this.source.replace("#include(" + path + ")",source);

					this.included_files.push(path);

					if(this.includes_count===0){
						this.include();
					}
					
				};
			})(list2[i]);
			var dir = Util.getDir(this.path);
			Util.loadText(dir+ list2[i],f);
		}
	}
	static compileShader(vs,fs){
		var gl = Rastgl.gl;
		//シェーダをコンパイルする
		
		// Vertex shader
		var vshader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vshader, vs);
		gl.compileShader(vshader);
		if(!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)){
			throw new ShaderCompileException(gl.getShaderInfoLog(vshader));
		}

		// Fragment shader
		var fshader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fshader, fs);
		gl.compileShader(fshader);
		if(!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)){
			throw new ShaderCompileException(gl.getShaderInfoLog(fshader));
		}
		// Create shader program
		var program = gl.createProgram();
		gl.attachShader(program, vshader);
		gl.attachShader(program, fshader);
		gl.linkProgram(program);
		if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
		  throw new ShaderCompileException(gl.getProgramInfoLog(program));
		}
		gl.useProgram(program);

		return program;
	}

	createShader2(){
		var options = this.options;
		var source = this.source;

		var optionnum = 0;
		for(var i=0;i<options.length;i++){
			var option = options[i];
			var re = new RegExp("/\\*\\[" + option +"\\]","g");
			source=source.replace(re,"");
			re = new RegExp("\\[" + option +"\\]\\*/","g");
			source = source.replace(re,"");

			optionnum |= 2**i;
		}

		//無効なオプションコードを消す
		var re= /\/\*\[(.+)\]/g;
		var list;
		var list2=[];
		while(list = re.exec(source)){
			var name = list[1];
			list2.push(name);
		}
		for(var i=0;i<list2.length;i++){
			var name = list2[i];
			var re = new RegExp("/\\*\\[" + name +"\\][\\s\\S]*?\\[" + name +"\\]\\*/","g");
			source=source.replace(re,"");
		}
		
		source = " \n \
			#pragma optionNV(inline all) \n \
			#pragma optionNV(unroll all)  \n" + source;

		var sss=source.match(/\[vertexshader\]([\s\S]*)\[fragmentshader\]([\s\S]*)/);

		var vs = sss[1]; //バーテックスシェーダソース
		var fs = sss[2]; //フラグメントシェーダソース

		var glsl3 = false;

		//glsl3チェック
		if(fs.charAt(0)==='#'){
			fs="#version 300 es\n" 
			+ "precision mediump float;  \n "
				+ "\n" + fs.replace("#version 300 es","");
			fs = fs.replaceAll("texture2D(","texture(");
			glsl3 = true;
		}else{
			fs=
			 "precision mediump float;  \n "
			+ fs;
		}
		var unis = source.match(/uniform .+?;/g)
		var gl = Rastgl.gl;

		//コンパイル
		var program = Shader.compileShader(vs,fs);
		this.program = program;

		var atts;
		if(glsl3){
			atts = (vs).match(/in .+?;/g)
		}else{
			atts = (vs+fs).match(/attribute .+?;/g)
		}
		this.atts={};

		att_types["vec2"]={size:2,type:gl.FLOAT};
		att_types["vec3"]={size:3,type:gl.FLOAT};
		att_types["vec4"]={size:4,type:gl.FLOAT};
		att_types["float"]={size:1,type:gl.FLOAT};
		for(var i=0;i<atts.length;i++){
			var res = atts[i].match(/(\S+)\s+(\S+)\s*;/);
			var nam = res[2];

			var type = att_types[res[1]];
			var att={
				location:gl.getAttribLocation(program,nam)
				,type:type
			}
			this.atts[nam]=att;
			if(att.location>=0){
				gl.enableVertexAttribArray(att.location);
				gl.vertexAttribPointer(att.location, 1,gl.FLOAT, false, 0, 0);
			}
		}
		this.outnum = 1;
		if(glsl3){
			var outnum = (fs).match(/out .+?;/g)
			if(outnum){
				this.outnum = outnum.length;
			}
		}
		this.unis={};

		var texture_count = 0;
		for(var i=0;i<unis.length;i++){
			var res = unis[i].match(/(\S+)\s+([^\[\s]+)\S*\s*;/);
			var nam = res[2];
			var uni={}
			uni.location=gl.getUniformLocation(this.program,nam);
			uni.type=res[1];
			res = unis[i].match(/\[\d+\]/);
			if(res){
				uni.type+="[]";
			}
			this.unis[nam]=uni;

			if(/.*sampler.*/.test(uni.type)){
				uni.tex_count = texture_count;
				texture_count++;
			}
		}

	}
}
