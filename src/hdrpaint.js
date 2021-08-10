
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
		//選択レイヤ
		this.selected_layer=null;
		//選択範囲
		this.select_rectangle=null;//{x:0,y:0,x2:0,y2:0};
		this.mode="";
		this.layer_id_count=0;

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

	refreshLayerRectangle(){
		if(!this.selected_layer)return;

		var rect =document.querySelector(".layer_rectangle");
		var doc = this.doc;
		rect.style.left=(this.selected_layer.position[0]  +  doc.canvas_pos[0] - 1)+"px";
		rect.style.top=(this.selected_layer.position[1] + doc.canvas_pos[1] -1) +"px";
		rect.style.width=this.selected_layer.size[0] + "px";
		rect.style.height=this.selected_layer.size[1]+ "px";
		rect.style.display="inline-block"
	}

	getSelectArea(){
		//領域選択されていない場合はレイヤー全体を選択
		var rectangle= {};
		if(!this.select_rectangle){
			rectangle.x = 0;
			rectangle.y = 0;
			rectangle.w = this.selected_layer.size[0];
			rectangle.h = this.selected_layer.size[1];
		}else{
			rectangle.x = this.select_rectangle.x;
			rectangle.y = this.select_rectangle.y;
			rectangle.w = this.select_rectangle.w;
			rectangle.h = this.select_rectangle.h;
		}
		return rectangle;
	}
	select(target_layer){
		//アクティブレイヤ変更
		
		this.selected_layer=target_layer;
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


		this.refreshLayerRectangle();

	}
	setLayerIdCount(id){
		this.layer_id_count=id;
	}

	createLayer(img,composite_flg){
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

		layer.img=img;
		if(img){
			Vec2.set(layer.size,img.width,img.height);
		}

		layer.id=this.layer_id_count;
		this.layer_id_count++;
		layer.name ="layer"+("0000"+layer.id).slice(-4);

		layer.refreshDiv();
		layer.registRefreshThumbnail();

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
		if(e.target.value ===""){return;}
		var modifier = e.target.value;
		//新規モディファイア
		var data = this.getPosition();
		
		this.executeCommand("createmodifier",{"modifier":modifier,"parent_layer_id":data.parent_layer.id,"position":data.position
			,"width":data.parent_layer.size[0],"height":data.parent_layer.size[1]});
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
			if(this.selected_layer.children && this.selected_layer.dom.classList.contains("open")){
				data.parent_layer_id = this.selected_layer.id;
				data.parent_layer = this.selected_layer;
				data.position = this.selected_layer.length;
			}else{
				data.parent_layer_id = this.selected_layer.parent.id;
				data.parent_layer = this.selected_layer.parent;
				data.position = this.selected_layer.parent.children.indexOf(this.selected_layer)+1;
			}
		}
		return data;
	}

	loadImageFile_(file){
		var data = this.getPosition();
		var fu =function(img){
			var log =this.executeCommand("loadImage",{"img":img,"file":file.name
				,"parent_layer_id":data.parent_layer_id,"position":data.position});
		}
	 	if(/.*exr$/.test(file.name)){
			Img.loadExr(file,0,fu);
	 	}else if(/^image\//.test(file.type)){
			Img.loadImg(file,0,fu);
	 	}
	}

	createDif(layer,left,top,width,height){
		//更新領域の古い情報を保存
		var img = new Img(width,height);
		Img.copy(img,0,0,layer.img,left,top,width,height);
		var dif={};
		dif.img=img;
		dif.x=left;
		dif.y=top;
		return dif;
	}

	removeLayer(layer){
		var parent_layer = layer.parent;
		var layers = parent_layer.children;
		var idx = layers.indexOf(layer);

		layers.splice(idx,1);
		if(layer == this.selected_layer){
			if(parent_layer.children.length>0){
				if(parent_layer.children.length<=idx){
					idx= parent_layer.children.length-1;
				}
				
				parent_layer.children[idx].select();
			}
		}
		parent_layer.refreshDiv();
		parent_layer.bubbleComposite();
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
	registModifier = (mod,name,html)=>{
		mod.prototype.typename=name;

		this.modifier[name] = mod;

		
		var div= document.createElement("div");
		div.id="div_"+name;
		div.classList.add("modifier_param");
		div.insertAdjacentHTML('beforeend',html);

		var nodes = div.querySelectorAll("*[name]");
		for(var i=0;i<nodes.length;i++){
			var node = nodes[i];
			var nodename = node.getAttribute("name");
			node.setAttribute("title",nodename);
			node.setAttribute("bind:","selected_layer." + nodename);
		}

		var dialog_parent= document.querySelector("#modifier_param_area");
		dialog_parent.appendChild(div);


		var area = document.querySelector("#modifier_area");
		var input= document.createElement("input");
		input.type="button";
		input.title=name;
		input.value=name;
		area.appendChild(input);

		this.stylesheet.insertRule(` 
			#modifier_param_area[modifier="${name}"] div#div_${name}{
				display:inline;
			}
		`, this.stylesheet.cssRules.length);
	}


	clearSelectArea = ()=>{
		//選択解除
		this.selected_area_enable= false;
		
	}

}
const hdrpaint = new Hdrpaint();

	//動的スタイルシート生成
	var newStyle = document.createElement('style');newStyle.type = "text/css";
	document.getElementsByTagName('head').item(0).appendChild(newStyle);
	hdrpaint.stylesheet = document.styleSheets.item(document.styleSheets.length-1);
export default hdrpaint;




