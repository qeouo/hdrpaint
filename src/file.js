
import Util from "./lib/util.js"
import {Vec2} from "./lib/vector.js"
import Hdrpaint from "./hdrpaint.js";
import _Img from "./lib/img.js"
import Brush from "./brush.js"
import Zip from "./lib/zip.js"
import Redraw from "./redraw.js"
import Layer from "./layer.js";
import CommandLog from "./commandlog.js";
var loadHpd_=function(buffer){
	var files=Zip.read(buffer);

	var doc_file = files.find(function(f){return f.name==="doc.txt";});
	if(!doc_file){
		return;
	}

	Redraw.disableRefresh();
	if(hdrpaint.root_layer){
		hdrpaint.removeLayer(hdrpaint.root_layer.id);
		//hdrpaint.commandObjs.deleteLayer({param:{"layer_id":hdrpaint.root_layer.id}});
	}

	var doc_data = JSON.parse(Util.utf8ToString(doc_file.data));

	//情報セット
	var keys=Object.keys(doc_data);
	for(var ki=0;ki<keys.length;ki++){
		var id = keys[ki];
		var input = inputs[id];
		if(!input){
			continue;
		}
		input.value = doc_data[id];
		if(input.type==="checkbox" && input.value==="1"){
			input.checked = true;
		}
	}
	Layer.layer_id_count = doc_data.layer_id_count;

	
	var brushes = Hdrpaint.brushes;
	brushes=[];
	for(var bi=0;bi<doc_data.brushes.length;bi++){
		//ブラシ読み込み
		var doc_brush=doc_data.brushes[bi];
		var brush=Brush.create();
		brushes.push(brush);

		//パラメータ設定
		var id = brush.id;
		setParam(brush,doc_brush);
		brush.id=id;
		
		brush.refresh();
	}
	Brush.refreshBrush();


	for(var i=0;i<files.length;i++){
		var file= files[i];
		if(file.name.indexOf(".exr")<0){
			continue;
		}
		var id = file.name.replace(".exr");
		id = Number(id);
		hdrpaint.imgs[id]= _Img.loadExr(file.data);
	}

	hdrpaint.layers=[];
	hdrpaint.layer_id_count=0;
	for(var li=0;li<doc_data.layers.length;li++){
		//レイヤ読み込み
		var layer;
		var doc_layer=doc_data.layers[li];
		switch(parseInt(doc_layer.type)){
		case 0:
			//通常レイヤ
			layer =hdrpaint.createLayer(doc_layer.img_id,0);
			break;
		default:
			//グループレイヤ
			layer = Hdrpaint.createModifier(doc_layer.modifier);
			break;

		}

		//layers.push(layer);

		//レイヤパラメータ設定
		var keys=Object.keys(doc_layer);
		for(var ki=0;ki<keys.length;ki++){
			if(typeof layer[keys[ki]] ==="number"){
				layer[keys[ki]]=parseFloat(doc_layer[keys[ki]]);
			}else{
				layer[keys[ki]]=doc_layer[keys[ki]];
			}
		}
		hdrpaint.layers[layer.id]=layer;
		
	}
	for(var li=0;li<hdrpaint.layers.length;li++){
		layer = hdrpaint.layers[li];
		if(!layer)continue;
		layer.refreshDiv();
	}
	hdrpaint.root_layer=hdrpaint.layers[1];
	hdrpaint.root_layer_id=1;
	Hdrpaint.onlyExecute("resizeCanvas",{"width":hdrpaint.root_layer.width,"height":hdrpaint.root_layer.height});

	var maxid=0;
	//for(var li=0;li<layers.length;li++){
	//	var layer = layers[li];
	//	layer.refreshDiv();
	//	maxid=Math.max(maxid,layer.id);
	//}
	//Hdrpaint.setLayerIdCount(maxid+1);
	Redraw.enableRefresh();


	Redraw.compositeAll();
	
	CommandLog.reset();

	if(brushes.length>0){
		brushes[0].select();
	}
}
	Hdrpaint.addDialog("loading",
		`
		ファイル読み込み中...

		`);
var setParam = function(dst,src){
	var keys=Object.keys(src);
	for(var ki=0;ki<keys.length;ki++){
		var key = keys[ki];
		if(typeof dst[key] ==="number"){
			dst[key]=Number(src[key]);
		}else{
			dst[key]=src[key];
		}
	}
}
var addBrush = function(buffer){
	var files=Zip.read(buffer);
	var doc_file = files.find(function(f){return f.name==="doc.txt";});
	if(!doc_file){
		return;
	}
	var doc_data = JSON.parse(Util.utf8ToString(doc_file.data));

	for(var bi=0;bi<doc_data.brushes.length;bi++){
		//ブラシ読み込み
		var doc_brush=doc_data.brushes[bi];
		var brush=Brush.create();
		brushes.push(brush);

		//パラメータ設定
		var id = brush.id;
		setParam(brush,doc_brush);
		brush.id=id;
		
		brush.refresh();
	}
	Brush.refreshBrush();
}
export default class FileManager {
	constructor(){
	}


static saveHpd(e){
	//ドキュメントファイル保存
	var files=[];
	var doc_data={};
	var brushes = Hdrpaint.brushes;


	var layers = hdrpaint.layers;
	var imgs = hdrpaint.imgs;
	doc_data.layers=[];

	for(var li=0;li<imgs.length;li++){
		//通常レイヤ
		if(!imgs[li]){continue;}
		var file={};
		files.push(file);
		file.data= new Uint8Array(imgs[li].createExr(3));
		file.name = li+".exr";
	}
	for(var li=0;li<layers.length;li++){
		var layer = layers[li];
		if(!layer)continue;
		var layer2={};

		//レイヤ情報収集
		var keys=Object.keys(layer);
		for(var ki=0;ki<keys.length;ki++){
			layer2[keys[ki]]=layer[keys[ki]];
		}
		delete layer2.img;
		delete layer2.div;
		delete layer2.dom;
		delete layer2.aaadiv;

		doc_data.layers.push(layer2);
	}
	//ブラシ情報セット
	doc_data.brushes =[];
	for(var bi=0;bi<brushes.length;bi++){
		var brush = brushes[bi];
		var brush2 = {};

		//情報収集
		var keys=Object.keys(brush);
		for(var ki=0;ki<keys.length;ki++){
			brush2[keys[ki]]=brush[keys[ki]];
		}
		//不要なデータを削除
		delete brush2.div;
		delete brush2.dom;

		doc_data.brushes.push(brush2);
	}

	//その他情報をセット
	doc_data.canvas_width = preview.width;
	doc_data.canvas_height= preview.height;
	var keys=Object.keys(inputs);
	for(var i=0;i<keys.length;i++){
		var id = keys[i]
		var input = inputs[id];
		doc_data[id] = input.value;
		if(input.type==="checkbox"){
			if(input.checked){
				doc_data[id] =1;
			}else{
				doc_data[id] =0;
			}
		}
	}
	doc_data.layer_id_count = Layer.layer_id_count;

	//ドキュメント情報をdoc.txtとして書き込む
	var file = {}
	file.data = Util.stringToUtf8(JSON.stringify(doc_data));
	file.name="doc.txt"
	files.push(file);

	//doc.txtと画像ファイルを無圧縮zipにする
	var buffer = Zip.create(files,0);
    var blob = new Blob([buffer], {type: "application/octet-stream"});

	var a = e.target;
    a.href =  window.URL.createObjectURL(blob);
    a.target = '_blank';
    a.download = "project.hpd";
}



static loadHpd(file){
	Hdrpaint.showDialog("loading");

	Util.loadBinary(file,function(buffer){
		loadHpd_(buffer);
		var log =CommandLog.createLog("loadDocumentFile",{"file":file.name});
		CommandLog.appendOption(log);
		Hdrpaint.closeDialog();
	});
}

	static saveHdr(e){
		var a = e.target;
		var buffer = hdrpaint.root_layer.img.createExr(3);
		var blob = new Blob([buffer], {type: "application/octet-stream"});

		a.href =  window.URL.createObjectURL(blob);
		a.target = '_blank';
		a.download = "preview_hdr.exr";
	}
	static saveLdr(e){
		var a = e.target;

		a.href = preview.toDataURL("image/png");
		a.target = '_blank';
		a.download = "preview_ldr.png";
	}
}
