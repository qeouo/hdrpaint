
import Util from "./lib/util.js";
import Img from "./lib/img.js";
import Layer from "./layer.js";
import CommandLog from "./commandlog.js";
import {Vec2,Vec3,Vec4} from "./lib/vector.js";


class Hdrpaint{
	constructor(){
		this.root_layer=null; //最上位レイヤ
		this.selected_tool="pen"; //選択しているツール
		this.selected_layer_only=false; //選択レイヤのみプレビューに表示
		this.color=new Vec4();
		this.cursor_color=new Vec4(); //カーソル下のピクセル色
		//現在選択状態にあるブラシ
		this.selected_brush=null;
		this.Command = {};
		this.commandObjs={};
		this.painted_mask=new Float32Array(1024*1024);
		//レイヤ
		this.layers=[];
		//画像データ
		this.imgs={};
		//選択レイヤ
		this.selected_layer=null;
		this.selected_layer_id=-1;
		//選択範囲
		this.select_rectangle=null;//{x:0,y:0,x2:0,y2:0};
		this.mode="";
		this.layer_id_count=0;
		this.img_id_count=0;

		//全ブラシ
		this.brushes=[];

		//ブラシ設定
		this.brush_status={}

		this.post_effect={
			ch_bloom:false
			,bloom_power:0.2
			,bloom_size:8
			,ev:0
			,ch_gamma:false
			,gamma:2.2
		};
	}

	// レイヤの範囲を表す点線 
	refreshLayerRectangle(){
		if(!this.selected_layer)return;

		var rect =document.querySelector(".layer_rectangle");
		var doc = this.doc;
		var scale = doc.scale/100;
		rect.style.left=(this.selected_layer.position[0]*scale  +  doc.canvas_pos[0] - 1)+"px";
		rect.style.top=(this.selected_layer.position[1]*scale + doc.canvas_pos[1] -1) +"px";
		rect.style.width =(this.selected_layer.size[0] * scale) + "px";
		rect.style.height=(this.selected_layer.size[1] * scale)+ "px";
		rect.style.display="inline-block"
	}
	refreshSelectedRectangle(){
		if(!this.select_rectangle)return;
		var rect =document.querySelector(".select_rectangle");
		var rectangle = this.select_rectangle;
		var doc = this.doc;
		var scale = doc.scale/100;
		rect.style.left=(rectangle.x * scale +  doc.canvas_pos[0]-1)+"px";
		rect.style.top=(rectangle.y  * scale + doc.canvas_pos[1]-1) +"px";
		rect.style.width =(rectangle.w * scale) + "px";
		rect.style.height=(rectangle.h * scale)+ "px";
		rect.style.display="inline-block"
	}

	getSelectArea(){
		//領域選択されていない場合はレイヤー全体を選択
		var rectangle= {};
		var layer = this.selected_layer;
		if(!this.select_rectangle){
			rectangle.x = 0;
			rectangle.y = 0;
			rectangle.w = layer.size[0];
			rectangle.h = layer.size[1];
		}else{
			var absolute=new Vec2();
			layer.getAbsolutePosition(absolute);
			rectangle.x = this.select_rectangle.x - absolute[0];
			rectangle.y = this.select_rectangle.y - absolute[1];
			rectangle.w = this.select_rectangle.w+this.select_rectangle.x - absolute[0];
			rectangle.h = this.select_rectangle.h+this.select_rectangle.y - absolute[1];
		}
		rectangle.x = Math.max(Math.min(rectangle.x,layer.size[0]),0);
		rectangle.y = Math.max(Math.min(rectangle.y,layer.size[1]),0);
		rectangle.w = Math.max(Math.min(rectangle.w,layer.size[0]),0);
		rectangle.h = Math.max(Math.min(rectangle.h,layer.size[1]),0);
		rectangle.w -= rectangle.x;
		rectangle.h -= rectangle.y;
		return rectangle;
	}
	selectLayer(target_layer_id){
		//アクティブレイヤ変更
		var target_layer = Layer.findById(target_layer_id);
		this.selected_layer=target_layer;
		this.selected_layer_id=target_layer_id;
		Layer.eachLayers(function(layer){
			if(target_layer !== layer){
				//アクティブレイヤ以外の表示を非アクティブにする
				layer.dom.classList.remove("active");
			}else{
				layer.dom.classList.add("active");
			}
		});


		if(inputs["selected_layer_only"].checked){
			refreshPreview(1);
		}


	}
	setLayerIdCount(id){
		this.layer_id_count=id;
	}
	getImgById(id){
		return this.imgs[id];
	}
	createImg(width,height){
		var img = new Img(width,height);
		this.img_id_count++;
		img.id = this.img_id_count;
		this.imgs[img.id]=img;
		var data = img.data;
		for(var i=0;i<data.length;i+=4){
			data[i+0]= 1;
			data[i+1]= 1;
			data[i+2]= 1;
			data[i+3]= 0;
		}
		return img;
	}

	createLayer(img_id,composite_flg){
		var layer = new Layer();

		if(composite_flg){
			//グループレイヤの場合
			layer.type=1;
			layer.children=[];
		}

		if(layer.type == 1){
			layer.dom.classList.add("group");
		}

		//layer_div.addEventListener("click",layerSelect);

		layer.img_id=img_id;
		var img = this.imgs[img_id];
	//	layer.img=img;
		if(img){
			Vec2.setValues(layer.size,img.width,img.height);
		}

		this.layer_id_count++;
		layer.id=this.layer_id_count;
		layer.name ="layer"+("0000"+layer.id).slice(-4);

		layer.refreshDiv();
		layer.registRefreshThumbnail();


		this.layers[layer.id]=layer;

		return layer;

	}
	createModifier(modifier_name){
		var layer = new this.modifier[modifier_name]();

		layer.type=2;

		if(layer.children){
			layer.dom.classList.add("group");
		}
		layer.dom.classList.add("modifier");

		layer.img=null;

		layer.id=this.layer_id_count;
		this.layer_id_count++;
		layer.modifier=modifier_name;
		layer.name =modifier_name+("0000"+layer.id).slice(-4);

		layer.refreshDiv();
		layer.registRefreshThumbnail();
		return layer;

	}

	createNewCompositeLayer(e){
		//新規コンポジットレイヤを作成
		var data = this.getPosition();
		var width= preview.width;
		var height= preview.height;
		
		this.executeCommand("createNewCompositeLayer",{"parent":data.parent_layer.id,"position":data.position,"width":width,"height":height,"composite_flg":1});

	}

	createNewModifier(e){
		if(e.target.value ==="" || !e.target.value){return;}
		var modifier = e.target.value;
		//新規モディファイア
		var data = this.getPosition();
		
		this.executeCommand("createmodifier",{"modifier":modifier,"parent_layer_id":data.parent_layer.id,"position":data.position
			,"width":data.parent_layer.size[0],"height":data.parent_layer.size[1]});

		//選択状態を元に戻す
		var generator_select = document.querySelector("#generator_select");
		generator_select.options[0].selected=true;
	}

	copylayer(e){
		//レイヤコピー

		var data =this.getPosition();
		
		this.executeCommand("copylayer",{"position":data.position,"parent":data.parent_layer.id,"src_layer_id":this.selected_layer.id});
	}

	redo(){
		//リドゥ

		var option_index = inputs["history"].selectedIndex;
		var options = inputs["history"].options;
		if(option_index === options.length-1){
			return;
		}	
		option_index++;
		var option = options[option_index];
		inputs["history"].selectedIndex = option_index;

		CommandLog.moveLog(parseInt(option.value));

	}

	undo(){
		//アンドゥ

		var option_index = inputs["history"].selectedIndex;
		var options = inputs["history"].options;
		if(option_index === 0){
			return;
		}	
		var option = options[option_index-1];
		if(option.disabled){
			return;
		}
		option_index--;
		inputs["history"].selectedIndex = option_index;

		CommandLog.moveLog(parseInt(option.value));

	}

	createNewLayer(e){
		//新規レイヤを作成

		var data = this.getPosition();

		var width= data.parent_layer.size[0];
		var height= data.parent_layer.size[1];
		
		this.executeCommand("createNewLayer",{"position":data.position,"parent":data.parent_layer.id,"width":width,"height":height});
	}
	getPosition(){
		var data={};
		if(!this.selected_layer){
			data.parent_layer_id = Hdrpaint.root_layer.id;
			data.parent_layer = Hdrpaint.root_layer;
			data.position = Hdrpaint.root_layer.length;
		}else{
			var parent = Layer.findById(this.selected_layer.parent);
			if(this.selected_layer.children && this.selected_layer.dom.classList.contains("open")){
				data.parent_layer_id = this.selected_layer.id;
				data.parent_layer = this.selected_layer;
				data.position = this.selected_layer.length;
			}else{
				data.parent_layer_id = parent.id;
				data.parent_layer = parent;
				data.position = parent.children.indexOf(this.selected_layer_id)+1;
			}
		}
		return data;
	}

	loadImageFile_(file){
		var data = this.getPosition();
		var fu =(img)=>{
			var log =this.executeCommand("loadImage",{"img":img,"file":file.name
				,"parent_layer_id":data.parent_layer_id,"position":data.position});
		}
	 	if(/.*exr$/.test(file.name)){
			Img.loadExr(file,0,fu);
	 	}else if(/^image\//.test(file.type)){
			Img.loadImg(file,0,fu);
	 	}
	}

	createDif(img,left,top,width,height){
		if(img instanceof Layer){
			img = img.img;
		}
		//更新領域の古い情報を保存
		var dif_img = new Img(width,height);
		Img.copy(dif_img,0,0,img,left,top,width,height);
		var dif={};
		dif.img=dif_img;
		dif.x=left;
		dif.y=top;
		return dif;
	}

	removeLayer(layer_id){
		var layer = Layer.findById(layer_id);
		var parent_layer = Layer.findById(layer.parent);
		var children = parent_layer.children;
		var idx = children.indexOf(layer_id);

		children.splice(idx,1);
		if(layer == this.selected_layer){
			if(parent_layer.children.length>0){
				if(parent_layer.children.length<=idx){
					idx= parent_layer.children.length-1;
				}
				
				this.selectLayer(parent_layer.children[idx]);
			}
		}
		parent_layer.refreshDiv();
		parent_layer.bubbleComposite();

		//this.layers[layer.id]=null;
	}

	onlyExecute= function(command,param){
		if(param.layer_id && command !=="changeLayerAttribute"){
			var layer = Layer.findById(param.layer_id);
			if(layer){
				if(layer.lock || !layer.display){
					return;
				}
			}
		}

		var commandObjs = this.commandObjs;
		log.obj = new commandObjs[command]();
		log.obj.param = param;
		log.obj.func();
	}
	executeCommand(command,param,flg){

		if(param.layer_id && command !=="changeLayerAttribute" && command!=="moveLayer"){
			var layer = Layer.findById(param.layer_id);
			if(layer){
				if(layer.lock || !layer.display){
					return null;
				}
			}
		}

		var log = CommandLog.createLog(command,param,flg);
		CommandLog.appendOption();
		var commandObjs = this.commandObjs;
		if(!log.obj){
			log.obj = new commandObjs[command]();
		}
		log.obj.param = param;
		log.obj.func();

		log.refreshLabel();

		return log;
	}

//ブレンドファンクション
	blendfuncs={};

	blendfuncsname= [ "normal"
		,"mul"
		,"add"
		,"sub"
		,"transmit"
	];



	addFilter(id,name){

		var a= document.createElement("a");
		a.id=id;
		Util.setText(a,name);
		a.setAttribute("href","#");
		var area = document.getElementById("additional");
		area.appendChild( a);
		
	}
	addDialog= function(id,html){
		var div= document.createElement("div");
		div.id=id;
		div.style.display="none";
		div.classList.add("area");
		div.classList.add("dialog");
		div.insertAdjacentHTML('beforeend',html);

		var dialog_parent= document.querySelector(".dialog_parent");
		dialog_parent.appendChild(div);
	}
	showDialog(id){
		document.getElementById(id).style.display="inline";
		document.querySelector(".dialog_parent").style.display="flex";
	}
	closeDialog(){
		var parent= document.querySelector(".dialog_parent")
		parent.style.display="none";
		for(var i=0;i<parent.children.length;i++){
			parent.children[i].style.display="none";
		 }
	}



	modifier={};
	registModifier = (mod)=>{
		var name = mod.name;

		this.modifier[name] = mod;

		
		var div= document.createElement("div");
		div.id="div_"+name;
		div.classList.add("modifier_param");
		div.insertAdjacentHTML('beforeend',mod.option);

		var nodes = div.querySelectorAll("*[name]");
		for(var i=0;i<nodes.length;i++){
			var node = nodes[i];
			var nodename = node.getAttribute("name");
			node.setAttribute("title",nodename);
			node.setAttribute("bind:","selected_layer." + nodename);
		}

		var dialog_parent= document.querySelector("#modifier_param_area");
		dialog_parent.appendChild(div);


		//var area = document.querySelector("#modifier_area");
		//var input= document.createElement("input");
		//input.type="button";
		//input.title=name;
		//input.value=name;
		//area.appendChild(input);

		this.stylesheet.insertRule(` 
			#modifier_param_area[modifier="${name}"] div#div_${name}{
				display:inline;
			}
		`, this.stylesheet.cssRules.length);

		var generator_select = document.querySelector("#generator_select");
		var filter_select = document.querySelector("#filter_select");
		var option = document.createElement("option");
		option.innerHTML=name;
		option.value=name;
		if(mod.type==="generator"){
			generator_select.appendChild(option);
		}else{
			filter_select.appendChild(option);
		}
	}


	clearSelectArea = ()=>{
		//選択解除
		this.selected_area_enable= false;
		
	}

}
const hdrpaint = new Hdrpaint();
window.hdrpaint = hdrpaint;

	//動的スタイルシート生成
	var newStyle = document.createElement('style');newStyle.type = "text/css";
	document.getElementsByTagName('head').item(0).appendChild(newStyle);
	hdrpaint.stylesheet = document.styleSheets.item(document.styleSheets.length-1);
export default hdrpaint;




