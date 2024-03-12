"use strict"

import {Vec2,Vec3,Vec4} from "./lib/vector.js"
import Hdrpaint from "./hdrpaint.js";
import Slider from "./lib/slider.js";
import Img from "./lib/img.js";
import CommandLog from "./commandlog.js";
import FileManager from "./file.js";
import Redraw from "./redraw.js";
import PenFunc from "./penfunc.js";
import Brush from "./brush.js";
import PenPoint from "./penpoint.js"
import Layer from "./layer.js";
import Util from "./lib/util.js";
import ColorpickerHDR from "./lib/colorpickerhdr.js";
import ColorSelector from "./lib/colorselector.js";
import Binder from "./lib/binder.js";
import Watcher from "./lib/watcher.js";
var binder =new Binder();
window.binder=binder;
var watcher =new Watcher();


window.Redraw = Redraw;
window.inputs=[];
var shortcuts=[];
window.pen_log=null;
window.pen_func=null;

window.bloomed_img=null;
window.bloom_img=null;
window.preview=null;
window.preview_ctx=null;
window.preview_ctx_imagedata=null;


//コマンド
import "./command/copy.js"
import "./command/paste.js"
import "./command/drawLine.js"
import "./command/changeLayerAttribute.js"
import "./command/changeModifierAttribute.js"
import "./command/clear.js"
import "./command/composite.js"
import "./command/createNewLayer.js"
import "./command/copylayer.js"
import "./command/createmodifier.js"
import "./command/deleteLayer.js"
import "./command/fill.js"
import "./command/joinLayer.js"
import "./command/loadImage.js"
import "./command/moveLayer.js"
import "./command/multiCommand.js"
import "./command/resizeCanvas.js"
import "./command/resizeLayer.js"
import "./command/translate.js"

//合成function
import "./blendfuncs/normal.js";
import "./blendfuncs/mul.js";
import "./blendfuncs/add.js";
import "./blendfuncs/sub.js";
import "./blendfuncs/transmit.js";

//モデファイア
import "./modifier/grayscale.js";
import "./modifier/shift.js";
import "./modifier/blur.js";
import "./modifier/gradient.js";
import "./modifier/colormap.js";
import "./modifier/noise.js";
import "./modifier/link.js";
import "./modifier/composite.js";

window.Brush= Brush;

Hdrpaint.inputs=inputs;

Hdrpaint.doc={};
Hdrpaint.doc.draw_col=new Vec4();
Hdrpaint.doc.background_color=new Vec4();
Vec4.setValues(Hdrpaint.doc.background_color,1,1,1,1);
Hdrpaint.doc.scale=100;
Hdrpaint.doc.canvas_pos=new Vec2();
Hdrpaint.cursor_pos=new Vec2();


var canvas_field;

	//最初に全コントロールを配列に入れる
	var elements= Array.prototype.slice.call(document.getElementsByTagName("input"));
	elements = elements.concat(Array.prototype.slice.call(document.getElementsByTagName("select")));
	elements = elements.concat(Array.prototype.slice.call(document.getElementsByTagName("button")));
	for(var i=0;i<elements.length;i++){
		var input = elements[i];
		var id= input.getAttribute("id");
		inputs[id]= elements[i];

		var input = inputs[id];
		if(input.getAttribute("shortcut")){
			var shortcut = {};
			var ka= input.getAttribute("shortcut");
			if(ka.length===1){
				ka = ka.charCodeAt(0);
			}
			shortcut.key =ka;
			shortcut.command = input;
			shortcuts.push(shortcut);
		}
	}


	var getPos=function(e){
		var rect = preview.getBoundingClientRect();
		Hdrpaint.cursor_pos[0] =(e.clientX- rect.left)-1;
		Hdrpaint.cursor_pos[1] = (e.clientY- rect.top)-1;
		
		Hdrpaint.cursor_pos[0]*=100/Hdrpaint.doc.scale;
		Hdrpaint.cursor_pos[1]*=100/Hdrpaint.doc.scale;
		
	}
var onloadfunc=function(e){


	if(Util.getLoadingCount()>0){
		window.setTimeout(onloadfunc,1000);
		return;
	}


	preview=  document.getElementById('preview');
	preview_ctx =  preview.getContext('2d')
	preview_ctx_imagedata=preview_ctx.createImageData(preview.width,preview.height);

	window.addEventListener("beforeunload",function(event){ 
		if(CommandLog.command_logs.length>1){
			event.returnValue = '移動前に表示する確認のメッセージ';
			return false;
		}
		return true;
	});

	//blendfuncセット
	var layer_blendfunc = document.querySelector("#layer_blendfunc");
	 while(layer_blendfunc.firstChild){
	 	layer_blendfunc.removeChild(layer_blendfunc.firstChild);
	 }
	for(var i=0;i<Hdrpaint.blendfuncsname.length;i++){
		var name = Hdrpaint.blendfuncsname[i];
		var option = document.createElement("option");
		option.value = name;
		Util.setText(option,name);
		layer_blendfunc.appendChild(option);
	}

		

	//ダイアログ閉じる処理
	//document.querySelector(".dialog_parent").addEventListener("click",function(e){
	//	if(this !== e.target)return false;
	//	Hdrpaint.closeDialog();
	//});


	var keys=Object.keys(inputs);
	for(var i=0;i<keys.length;i++){
		var key = keys[i];
		var input = inputs[key];
		if(input.getAttribute("title") ===null){
			input.setAttribute("title",key);
		}
	}

	
	var rag=null;

	var absolute=new Vec2();
	var drawfunc =function(e){
		//描画関数
		
		var x =Hdrpaint.cursor_pos[0];
		var y = Hdrpaint.cursor_pos[1];

		if((e.buttons & 2) || (Hdrpaint.selected_tool === "color_picker")){
			//カラーピッカー
			var layer_id = Hdrpaint.root_layer;
			if(inputs["selected_layer_only"].checked){
				layer_id = Hdrpaint.selected_layer_id;
			}
			var img = Layer.findById(layer_id).img;
			if(x<0 || x>=img.width || y<0 || y>img.height){
			}else{
				var data = img.data;

				var idx=((y|0)*img.width+(x|0))*4;

				selectorhdr.R_txt.value = data[idx];
				selectorhdr.G_txt.value = data[idx+1];
				selectorhdr.B_txt.value = data[idx+2];
				selectorhdr.A_txt.value = data[idx+3];
				Util.fireEvent(selectorhdr.A_txt,"change");

			}
			return;
		}


		if(Hdrpaint.selected_tool==="rectangle"){
			if(!(e.buttons&1)){
				return;
			}
			//矩形選択時
			var rectangle = Hdrpaint.select_rectangle;
			var x2 = Math.floor(x);
			var y2 = Math.floor(y);
			if(Hdrpaint.mode==="areamove"){
				rectangle.x += (-drag_start[0] +x2);
				rectangle.y += (-drag_start[1] +y2);
				drag_start[0]=x2;
				drag_start[1]=y2;
			}else{
				if(!rectangle){
					rectangle={x:0,y:0,w:0,h:0};
					Hdrpaint.select_rectangle=rectangle;
				}

				rectangle.x = Math.min(drag_start[0],x2);
				rectangle.y = Math.min(drag_start[1],y2);
				rectangle.w = Math.abs(drag_start[0]-x2);
				rectangle.h = Math.abs(drag_start[1]-y2);
			}



		}else if(Hdrpaint.selected_tool==="pen"){//inputs["pen"].checked){
			//ペンのとき
			if(!pen_log)return;

			var point=new PenPoint();
			var layer = Layer.findById(hdrpaint.selected_layer_id);
			layer.getAbsolutePosition(point.pos);
			point.pos[0]= x- point.pos[0];
			point.pos[1]= y - point.pos[1];
			if(e.buttons&1){
				if(e.pointerType === "mouse"){
					point.pressure=1;
				}else{
					point.pressure=e.pressure;
				}
			}else{
				point.pressure=0;
			}	
			var points= pen_log.obj.param.points;

			//今回座標をパスに追加
			point.time=Date.now();

			points.push(point);
			if(inputs["stroke_correction"].checked){
				if(points.length>=3 && pen_func.idx <points.length-2){
					var buf=new Vec2();
					Vec2.sub(buf,points[points.length-2].pos,points[points.length-3].pos);
					var a=Vec2.scalar(buf);
					if(a>20){
						Vec2.norm(buf);
						Vec2.mul(buf,buf,a-20);
					}
					Vec2.add(points[points.length-2].pos,points[points.length-3].pos,buf);
				}
			}

			if(!(e.buttons&1)){

				//描画前ポイントを補正
					var points = pen_log.obj.param.points;
				if(pen_func.idx +1<points.length){
					var len = points.length - (pen_func.idx + 1) ;
					var a = points[pen_func.idx].pressure;
					var b = points[points.length-1].pressure;
					for(var pi=pen_func.idx+1;pi<points.length;pi++){
						var r = ((pi-pen_func.idx)/len);
						points[pi].pressure = a + (b-a) * r;
					}
				}
			}

			if(!(e.buttons&1)){
				pen_func.end();
				point.pressure=0;
				pen_log=null;
			}	

			pen_func.actualDraw();

			
		}else if(Hdrpaint.selected_tool==="translate") {
			//移動のとき
			if((e.buttons & 1) && pen_log){
				var oldx =pen_log.obj.param.x;
				var oldy =pen_log.obj.param.y;
				x = (x|0) - drag_start[0];
				y = (y|0) - drag_start[1];
				

				//一旦元の座標に戻してから再度移動させる
				pen_log.obj.param.x=x-oldx;
				pen_log.obj.param.y=y-oldy;
				pen_log.obj.func();
				pen_log.obj.param.x=x;
				pen_log.obj.param.y=y;

				pen_log.refreshLabel();
				//CommandLog.appendOption();
				
			}

			if(!(e.buttons&1)){
				pen_log=null;
			}
		}
	};

	inputs["background_color"].addEventListener("change",function(e){
		var sp = this.value.split(",");
		var rgb=Hdrpaint.doc.background_color;
		rgb[0]=Number(sp[0]);
		rgb[1]=Number(sp[1]);
		rgb[2]=Number(sp[2]);
		rgb[3]=Number(sp[3]);

		Hdrpaint.root_layer.composite();
	});

	window.addEventListener("pointerup",function(e){
		getPos(e);
		if(pen_log){
			drawfunc(e);
			e.preventDefault();
		}

		Layer.enableRefreshThumbnail = true;
	});
	
	var drag_start=new Vec2();



	var canvas_field = document.querySelector("#canvas_field");
	canvas_field.addEventListener("pointermove",function(e){
		getPos(e);
		//Redraw.refreshPreviewStatus(e);
		if(e.buttons){
			drawfunc(e);
			e.preventDefault();
		}
	});

	preview.addEventListener("contextmenu",function(e){
		event.preventDefault();
	},false);
	canvas_field.addEventListener("pointerdown",function(e){

		if(e.buttons&4){
			//キャンバス移動
			oldpos[0]=e.pageX;
			oldpos[1]=e.pageY;
			e.preventDefault();
		}

		getPos(e);
		var x =Hdrpaint.cursor_pos[0];
		var y = Hdrpaint.cursor_pos[1];
		drag_start[0]= x;
		drag_start[1]= y;

		Layer.enableRefreshThumbnail = false;

		if(Hdrpaint.selected_layer===null){
			return;
		}



		Hdrpaint.mode="";
		if(Hdrpaint.selected_tool==="rectangle" && (e.buttons &1)){
			var rectangle= Hdrpaint.select_rectangle;

			x = Math.floor(x);
			y = Math.floor(y);
			if(Hdrpaint.select_rectangle){
				if( x >= rectangle.x 
					&& x < rectangle.x + rectangle.w
					&& y >= rectangle.y
					&& y < rectangle.y + rectangle.h){
					//選択領域内で押下された場合は移動モードにする
					Hdrpaint.mode="areamove";
					return;
				}
			}
			Hdrpaint.mode="areaselect";
			Hdrpaint.select_rectangle=null;
		
			
			var rect =document.querySelector(".select_rectangle");
			rect.style.display="none"
			return;
		}else if(Hdrpaint.selected_tool==="fill" && (e.buttons &1)){
			if(Hdrpaint.selected_layer.type === 1){
				return;
			}
			//塗りつぶし

			var joined_img = Hdrpaint.root_layer.img;
			if(x<0 || x>=joined_img.width || y<0 || y>=joined_img.height){
				//範囲外は無視
				return;
			}
			var layer = Hdrpaint.selected_layer;
			//Hdrpaint.selected_layer.getAbsolutePosition(absolute);
			//x -= absolute[0];
			//y -= absolute[1];
			if(x<0 || x>=layer.width || y<0 || y>=layer.height){
				//範囲外は無視
				return;
			}
			var color = new Float32Array(4);
			Vec4.copy(color,Hdrpaint.color);
			var flg_active_layer_only = inputs["selected_layer_only"].checked;
			Hdrpaint.executeCommand("fill",{"layer_id":Hdrpaint.selected_layer.id,"x":x,"y":y,"color":color,"is_layer":flg_active_layer_only});

		}else if(Hdrpaint.selected_tool ==="translate" && (e.buttons &1) ){
			//レイヤ位置移動
			drag_start[0]= x | 0;
			drag_start[1]= y | 0;
			var layer_id=-1;//全レイヤ移動
			var flg_active_layer_only = inputs["selected_layer_only"].checked;
			//if(flg_active_layer_only){
				//アクティブレイヤ
				layer_id=Hdrpaint.selected_layer.id;
			//}
			pen_log = Hdrpaint.executeCommand("translateLayer",{"layer_id":layer_id,"x":0,"y":0} ,{"x":Hdrpaint.selected_layer.position[0],"y":Hdrpaint.selected_layer.position[1]},1);


		}else if((Hdrpaint.selected_tool==="pen") && (e.buttons &1) ){
			//ペンもしくは消しゴム
			if(Hdrpaint.selected_layer.type !== 0){
				//通常レイヤ以外は無効
				return;
			}

			if(Hdrpaint.selected_layer.mask_alpha
			&& inputs["eraser"].checked){
				//アルファマスクありで消しゴムの場合無視
				return;
			}


			//ペン状態取得

			var param={};
			Brush.setParam(param);
			param.alpha_mask = Hdrpaint.selected_layer.mask_alpha;
			param.points=[];
			param.img_id= Hdrpaint.selected_layer.img_id;
			pen_log = Hdrpaint.executeCommand("brush",param);
			if(pen_log){
				pen_func= new PenFunc();
				pen_func.pen_log=pen_log;
				if(inputs["stroke_correction"].checked){
					pen_func.ragtime=40;
				}else{
					pen_func.ragtime=18;
				}

				drawfunc(e);
			}
		}

		drawfunc(e);


	},false);

    inputs["history"].addEventListener('change', function(event){
		var index = this.selectedIndex;
		var option = this.options[index];
		CommandLog.moveLog(parseInt(option.value));
	});

	var ctrlkey;
	document.addEventListener('keyup',function(event){
		if(event.keyCode ==17){
			ctrlkey = false;
		}
		switch(event.keyCode){
		case 81://q
			if(old_tool){
				Hdrpaint.selected_tool = old_tool;
				old_tool=null;
			}
			break;
		//case 32://space
		case 87://w
			//flg_active_layer_only=false;
			Hdrpaint.selected_layer_only =false;
		//	inputs["selected_layer_only"].checked=false;
		//	Util.fireEvent(inputs["selected_layer_only"],"change");
		}
	});

	var old_tool=null;
	document.addEventListener('keydown', async function(event){

		if(event.ctrlKey){
			ctrlkey = true;
		}
		var keycode = event.keyCode;
		if(!event.shiftKey && keycode<=96&& keycode>=65){
			keycode +=32;
		}

		//キーショートカット
		if(event.target.tagName==="INPUT"){
			if(event.target.type==="text"){
				return;
			}
		}
		var shortcut = shortcuts.find((a)=>{return a.key === keycode});
		if(shortcut){
			var command = shortcut.command;
			if(command.nodeName==="INPUT"){
				if(command.type==="checkbox" || command.type==="radio"){
					command.checked=true;
				}
				Util.fireEvent(command,"change");
			}
			return;
		}
		for(var bi=0;bi<Hdrpaint.brushes.length;bi++){
			var brush = Hdrpaint.brushes[bi];
			if(!brush.shortcut)continue;
			var shortcut = brush.shortcut.charCodeAt(0);
			if(shortcut === keycode){
				brush.select()
				return;
			}
		}
		

		switch(keycode){
		case 113://q
			if(!old_tool){
				old_tool  = Hdrpaint.selected_tool;
			}
			Hdrpaint.selected_tool = "color_picker";
			break;
		case 82://R
			Redraw.compositeAll();
			break;
		case 99://c
			if(event.ctrlKey){
				//コピー
				var range=Hdrpaint.getSelectArea();
				var src_layer = Hdrpaint.selected_layer;
				var img = new Img(range.w,range.h);
				Img.copy(img,0,0,src_layer.img,range.x,range.y,range.w,range.h);

				Hdrpaint.clipboard = img;
			}
			break;

		case 118-32://V
			//クリップボードからペースト
			 navigator.clipboard.read().then(async data => {
					if(data.length === 0)return;
				  for (let i=0; i<data[0].types.length; i++) {
					  const blob = await data[0].getType("image/png");
					  if(!blob)break;
					  var file = new File([blob],"paste.png",{type:"image/png"});
			//var imageFile = data.getAsFile();
						Hdrpaint.loadImageFile_(file);
					  break;
				  }
				});
			
			//var imageFile = data.getAsFile();
			//Hdrpaint.loadImageFile_(imageFile);
			event.preventDefault();
			break;
		case 118://v
			if(event.ctrlKey){
				//ペースト
				var data =Hdrpaint.getPosition();
				Hdrpaint.executeCommand("paste",{"position":data.position,"parent":data.parent_layer.id});
			}
			break;

		case 120://x
			if(event.ctrlKey){
				//カット
				var src_layer = Hdrpaint.selected_layer;
				var range= Hdrpaint.getSelectArea();
				var img = new Img(range.w,range.h);
				Img.copy(img,0,0,src_layer.img,range.x,range.y,range.w,range.h);

				Hdrpaint.clipboard = img;
				var data =Hdrpaint.getPosition();
				var rectangle=Hdrpaint.getSelectArea();
				//Hdrpaint.executeCommand("copy",{"position":data.position,"parent":data.parent_layer.id,"src_layer_id":Hdrpaint.selected_layer.id,range:rectangle});

				//選択範囲をクリア
				Hdrpaint.executeCommand("clear",{"layer_id":Hdrpaint.selected_layer.id,"range":range});
			}
			break;
		case 122-32://Z
			if(event.ctrlKey){
				//リドゥ
				Hdrpaint.redo();
			}
			event.preventDefault();
			break;
		case 122://z
			if(event.ctrlKey){
				if (event.shiftKey) {
					//リドゥ
					Hdrpaint.redo();

				}else{
					//アンドゥ
					Hdrpaint.undo();
				}
			}
			event.preventDefault();
			break;
		case 46://delete
			if(Hdrpaint.selected_layer.type!==0){
				//通常レイヤ以外は無視
				break;
			}
			var rectangle=Hdrpaint.getSelectArea();
			
			//選択範囲をクリア
			Hdrpaint.executeCommand("clear",{"layer_id":Hdrpaint.selected_layer.id,range:rectangle});
			break;
		case 119://w
			Hdrpaint.selected_layer_only =true;

			break;
		}

    });

	window.changeGamma=function(arg){
		Redraw.refreshPreview(2);
		Layer.eachLayers(function(layer){
			layer.registRefreshThumbnail();
		});
	}


	var resizeCanvas=function(){
		var width = parseInt(inputs["canvas_width"].value);
		var height= parseInt(inputs["canvas_height"].value);
		Hdrpaint.executeCommand("resizeCanvas",{"width":width,"height":height});
	}
	inputs["canvas_width"].addEventListener("change",resizeCanvas);
	inputs["canvas_height"].addEventListener("change",resizeCanvas);
	inputs["btn_resize_layer"].addEventListener("click",function(e){
		var width = parseInt(preview.width);
		var height= parseInt(preview.height);
		Hdrpaint.executeCommand("resizeLayer",{"layer_id":Hdrpaint.selected_layer.id,"width":width,"height":height});

	});
	inputs["btn_resize_layers"].addEventListener("click",function(e){
		var width = parseInt(preview.width);
		var height= parseInt(preview.height);
		Hdrpaint.executeCommand("resizeLayer",{"layer_id":-1,"width":width,"height":height});

	});
	inputs["open_layer"].addEventListener("change",function(e){
		var file=this.files[0];
		
		if(file){
			Hdrpaint.loadImageFile_(file);
		}
		this.value=null;

	});


	document.getElementById("open_hpd").addEventListener("click",function(e){
		var file_hpd = inputs['file_hpd'];
		file_hpd.onchange=function(){
			var file = file_hpd.files[0];

			FileManager.loadHpd(file);
	//		Util.loadBinary(file,function(buffer){
	//			loadHpd(buffer);
	//			var log =CommandLog.createLog("loadDocumentFile",{"file":file.name});
	//			CommandLog.appendOption(log);
	//		});
			file_hpd.value=null;
		};
		file_hpd.click();
		e.preventDefault();
		return false;
	});

	document.getElementById("add_brush").addEventListener("click",function(e){
		var file_hpd = inputs['file_hpd'];
		file_hpd.onchange=function(){
			var file = file_hpd.files[0];

			Util.loadBinary(file,function(buffer){
				addBrush(buffer);
			});
			file_hpd.value=null;
		};
		file_hpd.click();
		e.preventDefault();
		return false;
	});
	var layerMove = function(delta){
		if(!Hdrpaint.selected_layer){
			return;
		}
		var layer_id = Hdrpaint.selected_layer_id;
		var layer = Layer.findById(layer_id);
		var parent_layer =  Layer.findById(layer.parent);
		var children = parent_layer.children;
		var position = children.indexOf(layer_id);
		position +=delta;
		if(position>=children.length || position < 0){return;}
		Hdrpaint.executeCommand("moveLayer",{"layer_id":layer_id,"parent_layer_id":parent_layer.id,"position":position});
	}

	inputs["down_layer"].addEventListener("click",function(e){
		layerMove(-1);
	});
	inputs["up_layer"].addEventListener("click",function(e){
		layerMove(1);
	});

	//レイヤ結合ボタン押下時
	inputs["join_layer"].addEventListener("click",function(e){
		if(Hdrpaint.selected_layer.type===1){
			Hdrpaint.executeCommand("composite"
				,{"layer_id":Hdrpaint.selected_layer.id});
			return;
		}
		var parent_layer = Hdrpaint.selected_layer.parent;
		var position = parent_layer.children.indexOf(Hdrpaint.selected_layer);

		if(position===0){
			return;
		}

		if(parent_layer.children[position-1].type===1){
			return;
		}

		var id2= parent_layer.children[position-1].id;
		Hdrpaint.executeCommand("joinLayer",{"layer_id":id2,"layer_id2":Hdrpaint.selected_layer.id});
	});

	inputs["delete_layer"].addEventListener("click",function(e){
		Hdrpaint.executeCommand("deleteLayer",{"layer_id":Hdrpaint.selected_layer.id});
	});

	var oldpos=new Vec2();
	canvas_field = document.getElementById("canvas_field");
	var canvas_area = document.getElementById("canvas_area");
	//canvas_area.addEventListener("paste", function(e){
	//	//navigator.clipboard.write(data);
	//	//if(Hdrpaint.floating_layer){

	//	//	var data =Hdrpaint.getPosition();
	//	//	Hdrpaint.executeCommand("paste",{"position":data.position,"parent":data.parent_layer.id});
	//	//}else{
	//	//
	//	//
	//		var data =null;

	//		for(var i=0;i<navigator.clipboard.types.length;i++){
	//			if(navigator.clipboard.types[i] ==="Files"){
	//				data = e.clipboardData.items[i];
	//				break;
	//			}
	//		}
	//		if(!data){
	//			return true;
	//		}
	//		
	//		var imageFile = data.getAsFile();
	//		Hdrpaint.loadImageFile_(imageFile);
	//	//}
	//});
	canvas_area.addEventListener("copy", function(e){
		//OSのクリップボードにSDR結合画像をコピー
		const selection = document.getSelection();

		var url = Hdrpaint.root_layer.img.toBlob((blob)=>{
			let data = [new ClipboardItem({ [blob.type]: blob})];

			navigator.clipboard.write(data);
			},"image/png"
		);

		event.preventDefault();
	});

//レイヤパラメータコントロール変更時反映
document.querySelector("#layer_param").addEventListener("change"
	,function(e){

	var input = e.target;
	if(!Hdrpaint.selected_layer){ return; }
	if(!input){return;}

	var layer = Hdrpaint.selected_layer;
	var member = input.id.replace("layer_","");
	if(input.getAttribute("type")==="radio"){
		member = input.name;
	}
	if(member===""){
		member = input.title;
	}
	var value;
	if(input.getAttribute("type")==="checkbox"){
		value = input.checked;
	}else{
		value = input.value;
	}
	if(input.hasAttribute("number")){
		value = Number(value);
	}
	var int_val = parseInt(value);

	switch(member){
		case "width":
			Hdrpaint.executeCommand("resizeLayer",{"layer_id":layer.id,"width":int_val,"height":layer.height});
			break;
		case "height":
			Hdrpaint.executeCommand("resizeLayer",{"layer_id":layer.id,"width":layer.width,"height":int_val});
			break;
		case "x":
			Hdrpaint.executeCommand("translateLayer",{"layer_id":layer.id,"x":int_val - layer.position[0],"y":0});
			break;
		case "y":
			Hdrpaint.executeCommand("translateLayer",{"layer_id":layer.id,"x":0,"y":int_val - layer.position[1]});
			break;
		default:
			Hdrpaint.executeCommand("changeLayerAttribute",{"layer_id":layer.id,"name":member,"value":value});
	}
	
});


function arrayToBase64(array){
	return btoa(String.fromCharCode(...array));
}
function base64ToArray(base64){
	var binary = atob(base64);
	var len = binary.length;
	var bytes = new Uint8Array(len);
	for (var i = 0; i < len; i++) {
	  bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}
function dataURIConverter(dataURI) {
    // base64/URLEncodedデータを文字列としてバイナリデータに変換する
    var buffer = base64ToArray(dataURI.split(',')[1]);

    // mimetypeを抜き出す
    var mimeType = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // 第一引数は配列で渡し、Fileオブジェクトを返す。
    return new File([buffer], 'ファイル名', { type:mimeType } );
}

	canvas_field.addEventListener( "pointermove", function(e){
		if(e.buttons&4){
			//中ボタンドラッグでキャンバス移動
			//c.scrollLeft-=e.pageX-oldpos[0];
			//c.scrollTop-=e.pageY-oldpos[1];
			var doc = Hdrpaint.doc;

			doc.canvas_pos[0]+=(e.pageX-oldpos[0]);
			doc.canvas_pos[1]+=(e.pageY-oldpos[1]);

			var c=document.getElementById("canvas_field");
			var spacer=document.getElementById("spcaer");
			if(doc.canvas_pos[0]<0){
			//	c.scrollLeft-=doc.canvas_pos[0];
				doc.canvas_pos[0]=0;
			}
			if(doc.canvas_pos[1]<0){
				doc.canvas_pos[1]=0;
			}

			preview.style.left = doc.canvas_pos[0] + "px";
			preview.style.top = doc.canvas_pos[1] + "px";

			oldpos[0]=e.pageX;
			oldpos[1]=e.pageY;

			
		}
	});
	document.getElementById("canvas_area").addEventListener( "wheel", function(e){
		if(!e.ctrlKey){
			return;
		}
		var doc = Hdrpaint.doc;
		var add=0;
		e.preventDefault();
		if(e.buttons&4){
			return;
		}
		if(event.deltaY>0){
			if(doc.scale<=100){
				doc.scale/=2;
			}else{
				doc.scale-=100;
			}
			
		}else{
			if(doc.scale<=100){
				doc.scale*=2;
			}else{
				doc.scale+=100;
			}
			
		}
		if(doc.scale<25){
			doc.scale=25;
		}
		if(doc.scale>2000){
			doc.scale=2000;
		}
		if(doc.scale>100){
			preview.style.imageRendering="pixelated";
		}else{
			preview.style.imageRendering="auto";
		}
		var cx = canvas_field.scrollX+canvas_field.clientWidth/2;
		var cy = canvas_field.scrollY+canvas_field.clientHeight/2;
		preview.style.width = (preview.width* doc.scale/100 ) + "px";
		preview.style.height= (preview.height*doc.scale/100) + "px";

		//Redraw.refreshPreviewStatus(e);


	}) ;

    var a = document.getElementById("save_hpd");
	a.addEventListener("contextmenu",FileManager.saveHpd);
	a.addEventListener("click",FileManager.saveHpd);
	

    a = document.getElementById("save_ldr");
	a.addEventListener("contextmenu",FileManager.saveLdr);
	a.addEventListener("click",FileManager.saveLdr);

    a = document.getElementById("save_hdr");
	a.addEventListener("contextmenu",FileManager.saveHdr);
	a.addEventListener("click",FileManager.saveHdr);


	var url=location.search.substring(1,location.search.length)
	var args=url.split("&")

	Vec4.setValues(Hdrpaint.doc.draw_col,0.8,0.2,0.2,1);

	for(i=args.length;i--;){
		var arg=args[i].split("=")
		if(arg.length >1){
			var name = arg[0];
			if(!isNaN(arg[1]) && arg[1]!=""){
				if(arg[1].length>1 && arg[1].indexOf(0) =="0"){
					globalParam[name] = arg[1]
				}else{
					globalParam[name] = +arg[1]
				}
			}else{
				globalParam[name] = arg[1]
			}
		}
		if(inputs.hasOwnProperty(name)){
			if((inputs[name].type=="checkbox" || inputs[name].type=="radio") && globalParam[name]){
				inputs[name].checked=true;
			}else{
				inputs[name].value = globalParam[name];
			}
			Util.fireEvent(inputs[name],"input");
		}
	}



	if(globalParam.hasOwnProperty("file")){

		//パラメタ渡されてる場合はそれ開く

		FileManager.loadHpd(globalParam.file);
		//Util.loadBinary(globalParam.file,function(buffer){
		//	loadHpd(buffer);
		//});
	}else{
		//Hdrpaint.executeCommand("resizeLayer",{"layer_id":root_layer.id,"width":512,"height":512});
		Hdrpaint.executeCommand("createNewLayer",{"position":0,"parent":0,"width":512,"height":512,"composite_flg":1});

		Hdrpaint.executeCommand("resizeCanvas",{"width":512,"height":512});

		var canvas_field=document.querySelector("#canvas_field");
		Hdrpaint.doc.canvas_pos[0]=(canvas_field.clientWidth-512)>>1;
		Hdrpaint.doc.canvas_pos[1]=(canvas_field.clientHeight-512)>>1;
		
		preview.style.left = Hdrpaint.doc.canvas_pos[0] + "px";
		preview.style.top = Hdrpaint.doc.canvas_pos[1] + "px";

		CommandLog.reset();

		Hdrpaint.executeCommand("createNewLayer",{"position":0,"parent":Hdrpaint.root_layer.id,"width":preview.width,"height":preview.height});
		var layer = Layer.findById(hdrpaint.root_layer.children[0]);
		layer.name="default"
		layer.refreshDiv();
		layer.registRefreshThumbnail();

		hdrpaint.root_layer.refreshDiv();
	}

	binder.bind(document.querySelector("#status2")
		,"",Hdrpaint,["cursor_pos.0","cursor_pos.1","doc.scale"],(v)=>{
			var root_layer =hdrpaint.root_layer;
			var img = root_layer.img;
			var data = img.data;
			var width=img.width;
			var height=img.height;

			if(v[0]<0 || v[1]<0 || v[0]>=width || v[1]>=height){

				Hdrpaint.cursor_color[0]=NaN;
				Hdrpaint.cursor_color[1]=NaN;
				Hdrpaint.cursor_color[2]=NaN;
				Hdrpaint.cursor_color[3]=NaN;
				return "倍率:" ; v[2] + " X:- Y:-";
			}

			var idx=img.getIndex(v[0]|0,v[1]|0)<<2;
			Hdrpaint.cursor_color[0]= data[idx];
			Hdrpaint.cursor_color[1]= data[idx+1];
			Hdrpaint.cursor_color[2]= data[idx+2];
			Hdrpaint.cursor_color[3]= data[idx+3];
			return "倍率:" + v[2] + " X:" + v[0] +" Y:" + v[1];
	});

	var f = (v)=>isNaN(v[0])?"-":v[0].toFixed(3);

	binder.bind(document.querySelector("#pos_R")
		,"",Hdrpaint,["cursor_color.0"],f);
	binder.bind(document.querySelector("#pos_G")
		,"",Hdrpaint,["cursor_color.1"],f);
	binder.bind(document.querySelector("#pos_B")
		,"",Hdrpaint,["cursor_color.2"],f);
	binder.bind(document.querySelector("#pos_A")
		,"",Hdrpaint,["cursor_color.3"],f);

	watcher.watch(Hdrpaint,["doc.scale","doc.canvas_pos.0","doc.canvas_pos.1"],function(old){
		hdrpaint.refreshSelectedRectangle()
		hdrpaint.refreshLayerRectangle();
	});
	watcher.watch(hdrpaint,["select_rectangle.x","select_rectangle.y","select_rectangle.w","select_rectangle.h"]
		,function(values){
		hdrpaint.refreshSelectedRectangle()
	});
	watcher.watch(hdrpaint,["selected_layer.id","selected_layer.size.0","selected_layer.size.1","selected_layer.position.0","selected_layer.position.1","selected_layer.angle"]
		,function(values){
		hdrpaint.refreshLayerRectangle();
	});

//	watcher.watch(hdrpaint,"layers"
//		,function(values){
//			var node = document.getElementById("layerlist");
//				while( node.firstChild ){
//				  node.removeChild( node.firstChild );
//				}
//				var options = values[0];
//				if(!Array.isArray(options)){
//					options=[];
//				}
//				for(var i=0;i<options.length;i++){
//					var op= options[i];
//
//					var option = document.createElement("option");
//					option.value = op.id;
//					Util.setText(option,op.name);
//					node.appendChild(option);
//				}
//		hdrpaint.refreshLayerRectangle();
//	});
watcher.init();

	Brush.init();
	var brush = Brush.create();
	var brush1 = brush;
	brush.name="ペン"
	brush.shortcut="a";
	brush.weight_pressure_effect=true;
	brush.weight=5;
	Hdrpaint.brushes.push(brush);
	brush.refresh();

	brush = Brush.create();
	brush.name="消しゴム"
	brush.eraser=true;
	brush.shortcut="s";
	brush.weight=10;
	Hdrpaint.brushes.push(brush);
	brush.refresh();

	Brush.refreshBrush();

	brush1.select();


	var colorpickerhdr = new ColorpickerHDR();
	colorpickerhdr.init(document.getElementsByClassName("colorpickerhdr"));

	binder.init(document,Hdrpaint);

	var selectorhdr = new ColorSelector(true);
	document.querySelector("#color_selector").appendChild(selectorhdr.div);
	selectorhdr.changeCallback= function(){

		Hdrpaint.color[0]= Number(this.R_txt.value);
		Hdrpaint.color[1]= Number(this.G_txt.value);
		Hdrpaint.color[2]= Number(this.B_txt.value);
		Hdrpaint.color[3]= Number(this.A_txt.value);

		Brush.refreshPreview();
	}

	Vec4.setValues(Hdrpaint.color,1,0.5,0.5,1);

	selectorhdr.setColor(Hdrpaint.color);

}



document.body.onload=onloadfunc;
