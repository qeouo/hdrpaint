
import Zip from "./zip.js"
import Util from "./util.js"
export default class  Cap{
	constructor(canvas,func,num){
		this.canvas = canvas;
		this.func= func;
		this.num= num;
		this.count = 0;
		this.files = [];
	}
	async mainloop(){	
		this.count++;
		this.func();
		var blob = await this.createBlob();
		var result = await this.createFile(blob);
		this.files.push({name:"img"+this.files.length+".png",data:new Uint8Array(result)});
			
		if(this.count<this.num){
			this.mainloop();
		   }else{
			 var blob=  this.createZip();
			var a = document.getElementById("a");
			 a.href =  window.URL.createObjectURL(blob);
			 a.target = '_blank';
			 a.download = "project.zip";
		}
	}

	createBlob(){
		return new Promise(resolve=>{
		this.canvas.toBlob( function ( blob ) {
			resolve(blob);
		},"image/png",100 ) ;
		});
	}
	createFile(blob){
		return new Promise(resolve=>{
			const reader = new FileReader();
			reader.readAsArrayBuffer(blob);
			reader.addEventListener("loadend", () => {
				resolve(reader.result);
			});
		});
	}
	createZip(){
			//ドキュメント情報をdoc.txtとして書き込む
			var file = {}
			file.data = Util.stringToUtf8("てすとて");
			file.name="doc.txt"
			this.files.push(file);

			//doc.txtと画像ファイルを無圧縮zipにする
			var buffer = Zip.create(this.files,0);
		    var blob = new Blob([buffer], {type: "application/octet-stream"});
		return blob;
	}
}
