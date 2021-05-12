
import Util from "./lib/util.js";
import Img from "./lib/img.js";
import Layer from "./layer.js";
import CommandLog from "./commandlog.js";
import {Vec2,Vec3,Vec4} from "./lib/vector.js";


class Hdrpaint{
	constructor(){
		this.color=new Vec4();
		this.Command = {};
		this.commandObjs={};
		this.painted_mask=new Float32Array(1024*1024);
		this._select_rectangle={x:0,y:0,x2:0,y2:0};
		this.select_rectangle={x:0,y:0,x2:0,y2:0};
		this.mode="";
		this.layer_id_count=0;
	}

	refreshActiveLayerParam(){
		//アクティブレイヤパラメータ更新
		var layer = selected_layer;
		if(!layer){
			return;
		}
		var layer_inputs = Array.prototype.slice.call(document.getElementById("layer_param").getElementsByTagName("input"));
		layer_inputs = layer_inputs.concat(Array.prototype.slice.call(document.getElementById("layer_param").getElementsByTagName("select")));
		for(var i=0;i<layer_inputs.length;i++){
			var input = layer_inputs[i];
			switch(input.id){
				case "layer_x":
				input.value = layer.position[0];
				break;
			case "layer_y":
				input.value = layer.position[1];
				break;
			case "layer_width":
				if(layer.img){
					input.value = layer.img.width;
				}
				break;
			case "layer_height":
				if(layer.img){
					input.value = layer.img.height;
				}
				break;
			default:
				var member = input.id.replace("layer_","");
				if(member in layer){
					if(input.getAttribute("type")==="checkbox"){
						input.checked=layer[member];
					}else{
						input.value=layer[member];
					}
					Util.fireEvent(input,"input");
				}
			}
		}
	var inputs = this.inputs;
		if(selected_layer.type ===1){
			inputs["join_layer"].value="子を結合";
		}else{
			inputs["join_layer"].value="下のレイヤと結合";
		}

		var elems = document.querySelector("#modifier_param_area").children;
		for(var i=0;i<elems.length;i++){
			elems[i].style.display="none";
		}
		var elem = document.querySelector("#div_" + selected_layer.modifier);
		if(elem){
			elem.style.display="inline";

			var elems = elem.querySelectorAll("input,select");
			for(var i=0;i<elems.length;i++){
				var input = elems[i];
				var name = input.title;
				if(name in layer){
					if(input.type==="checkbox"){
						input.checked=Boolean(layer[name]);
					}else if(input.type==="radio"){
						input.checked=Boolean(layer[name] === input.value);
					}else{
						input.value=layer[name];
					}
					Util.fireEvent(input,"input");
				}
			}
		}
		
	}
	refreshLayerRectangle(){
		if(selected_layer){
			var rect =document.querySelector(".layer_rectangle");
			var doc = this.doc;
			rect.style.left=(selected_layer.position[0]  +  doc.canvas_pos[0])+"px";
			rect.style.top=(selected_layer.position[1] + doc.canvas_pos[1]) +"px";
			rect.style.width=selected_layer.size[0] + "px";
			rect.style.height=selected_layer.size[1]+ "px";
			rect.style.display="inline-block"
		}
	}

	select(target_layer){
		//アクティブレイヤ変更
		
		selected_layer=target_layer;
		Layer.eachLayers(function(layer){
			if(target_layer !== layer){
				//アクティブレイヤ以外の表示を非アクティブにする
				layer.dom.classList.remove("active");
			}else{
				layer.dom.classList.add("active");
			}
		});
		this.refreshActiveLayerParam();


		if(inputs["selected_layer_only"].checked){
			refreshPreview(1);
		}

		//領域選択されていない場合はレイヤー全体を選択
		var sr= this._select_rectangle;
		if(!sr.enable){
			var rectangle= this.select_rectangle;
			rectangle.x = 0;
			rectangle.y = 0;
			rectangle.w = selected_layer.size[0];
			rectangle.h = selected_layer.size[1];
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
	//	var layer = new Layer();
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
		
		this.executeCommand("copylayer",{"position":data.position,"parent":data.parent_layer.id,"src_layer_id":selected_layer.id});
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
		if(!selected_layer){
			data.parent_layer_id = root_layer.id;
			data.parent_layer = root_layer;
			data.position = root_layer.length;
		}else{
			if(selected_layer.children && selected_layer.dom.classList.contains("open")){
				data.parent_layer_id = selected_layer.id;
				data.parent_layer = selected_layer;
				data.position = selected_layer.length;
			}else{
				data.parent_layer_id = selected_layer.parent.id;
				data.parent_layer = selected_layer.parent;
				data.position = selected_layer.parent.children.indexOf(selected_layer)+1;
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
		if(layer == selected_layer){
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
		log.obj = new commandObjs[command]();
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

		var dialog_parent= document.querySelector("#modifier_param_area");
		dialog_parent.appendChild(div);


		var area = document.querySelector("#modifier_area");
		var input= document.createElement("input");
		input.type="button";
		input.title=name;
		input.value=name;
		area.appendChild(input);
	}


	clearSelectArea{
		//選択解除
		this.selected_area_enable= false;
		
	}

}
const hdrpaint = new Hdrpaint();
export default hdrpaint;




