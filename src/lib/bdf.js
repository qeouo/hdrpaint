import Img from "./img.js"
import jis2unicode from "./jis2unicode";

var createXMLHttpRequest = function(){
  if (window.XMLHttpRequest) {
	return new XMLHttpRequest()
  } else if (window.ActiveXObject) {
	try {
	  return new ActiveXObject("Msxml2.XMLHTTP")
	} catch (e) {
	  try {
		return new ActiveXObject("Microsoft.XMLHTTP")
	  } catch (e2) {
		return null
	  }
	}
  } else {
	return null
  }
}
	
var seek=function(data){
	var res
	var index2 = data.src.indexOf("\n",data.index)
	if(index2<0)return null
	res = data.src.substring(data.index,index2)
	data.index=index2 + 1
	if(/^[\]\}]/.test(res))return null
	return res
	
}

	var code_lf='\n'.codePointAt(0)
	,code_unknown='x'.codePointAt(0);
class BdfChar{
	constructor(){
		this.dwidth=0
		this.bitmap= new Array() 
		this.bbx = new Array(4)
		this.encoding = 0
	}
}
export default class Bdf{

	constructor(){
		this.boundingBox = new Array(4)
		this.size = new Array(3)
		this.bdfChars = {};
	}

	static load(url,bdf,callback){
		if(!bdf){
			bdf = new Bdf();
		}
		Util.loadText(url,function(buf){
			var res
			 ,line
			 ,type
			 ,bdfChar
			
			
			var data=new String()
		
			//buf= buf.replace(/#.*$/mg, "")
			//buf= buf.replace(/\s+$/mg, "")
			buf= buf.replace(/^\s+/mg, "")
			data.src = buf
			data.index = 0
			while(line=seek(data)){
				if(line.match(/FONTBOUNDINGBOX (.+) (.+) (.+) (.+)/)){
					bdf.boundingBox[0]=parseInt(RegExp.$1)
					bdf.boundingBox[1]=parseInt(RegExp.$2)
					bdf.boundingBox[2]=parseInt(RegExp.$3)
					bdf.boundingBox[3]=parseInt(RegExp.$4)
				}else if(line.match(/CHARSET_REGISTRY "(.+)"/)){
					bdf.charset_registry = RegExp.$1;
					if(bdf.charset_registry.indexOf("jisx")>=0){
						bdf.jis=true;
					}else{
						bdf.jis=false;
					}
				}else if(line.match(/SIZE (\d+) (\d+) (\d+)/)){
					bdf.size[0]=parseInt(RegExp.$1)
					bdf.size[1]=parseInt(RegExp.$2)
					bdf.size[2]=parseInt(RegExp.$3)
				}else if(line.match(/STARTCHAR/)){
					bdfChar = new BdfChar()
				}else if(line.match(/BBX (.+) (.+) (.+) (.+)/)){
					bdfChar.bbx[0]=parseInt(RegExp.$1)
					bdfChar.bbx[1]=parseInt(RegExp.$2)
					bdfChar.bbx[2]=parseInt(RegExp.$3)
					bdfChar.bbx[3]=parseInt(RegExp.$4)
				}else if(line.match(/ENCODING (\d+)/)){
					var code=parseInt(RegExp.$1)
					if(bdf.jis){
						code=jis2unicode[code]
					}
					bdfChar.encoding=code
					bdf.bdfChars[code] = bdfChar
				}else if(line.match(/DWIDTH (\d+) (\d+)/)){
					bdfChar.dwidth=parseInt(RegExp.$1)
				}else if(line.match(/BITMAP/)){
					while(line=seek(data)){
						if(/ENDCHAR/.test(line))break
						line = (line + "00000000").slice(0,8)
						bdfChar.bitmap.push(parseInt(line,16))
					}
				}
			}
			if(callback){
				callback(bdf);
			}
		});
		
		return bdf
	}
	static textwidth;
	static textheight

	static render(text,bdf,flg,imagedata){
		var width,height
		,i,imax=text.length
		,j,jmax
		,fontheight=bdf.boundingBox[1]
		,fontwidth=bdf.boundingBox[0]
		,k,kmax=fontheight
		,code
		,bdfChar
		,idx=0
		,idx2=0
		,bits
		,x,y

		x=0
		y=0
		width=0
		height=0
		for(i=0;i<imax;i++){
			code = text.codePointAt(i)
			bdfChar = bdf.bdfChars[code]
			if(code ==code_lf){
				if(width<x)width=x
				x=0
				y+=fontheight
				continue
			}
			if(!bdfChar){
			   bdfChar = bdf.bdfChars[code_unknown]
			}
			if(flg){
				x+=fontwidth;
			} else {
				if(bdfChar){
					x+=bdfChar.dwidth//kmax
				}else{
					x+=fontwidth;
				}
			}
		}
		if(width<x)width=x
		height=y+fontheight
		this.textwidth=width
		this.textheight=height
		if(!imagedata){
			width=height=512;
			imagedata = new Img(width,height,1);
		}
		var data=imagedata.data
		width=imagedata.width;
		height=imagedata.height;
		var width4=width*4

		x=0
		y=0
		for(i=0;i<imax;i++){
			code = text.codePointAt(i)
			bdfChar = bdf.bdfChars[code]

			if(code ==code_lf){
				//改行
				x=0;
				y+=fontheight;
				continue;
			}

			if(!bdfChar){
				bdfChar = bdf.bdfChars[code_unknown];
			}
			if(bdfChar){
				idx=x*4+(y+(bdf.boundingBox[1]+bdf.boundingBox[3]-bdfChar.bbx[1]-bdfChar.bbx[3]))*width4
				//idx=x*4+(y)*width4
				jmax=bdfChar.bitmap.length
				kmax=bdfChar.dwidth
				kmax=bdfChar.bbx[0]
				jmax=bdfChar.bbx[1]
				for(j=0;j<jmax;j++){
					bits=bdfChar.bitmap[j]
					idx2=idx+width4*j
					for(k=0;k<kmax;k++){
						data[idx2]=0xff
						data[idx2+1]=0xff
						data[idx2+2]=0xff
						if((bits>>>(31-k))&1){
							data[idx2+3]=0xff
						}else{
							data[idx2+3]=0x0
						}
						idx2+=4
					}
				}
			}
			if(flg){
				x+=fontwidth;
			} else {
				if(bdfChar){
					x+=bdfChar.dwidth//kmax
				}else{
					x+=fontwidth;
				}
			}
		}

		return imagedata
	}
	static renderAscii(bdf){
		var str="";
		for(i=32;i<128;i++){
			str=str+String.fromCharCode(i);
		}
		return this.render(str,bdf);

	}

}

