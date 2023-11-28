"use strict" 
import {Vec2} from "./lib/vector.js"
import Util from "./lib/util.js";
import Layer from "./layer.js";
var absolute=new Vec2();
var refresh_stack=[] ;

	var refreshMain_=function(){

		if(Redraw.refreshoff){
			//更新禁止フラグが立っている場合は処理しない
			return;
		}
		if(refresh_stack.length===0){
			return;
		}
		
		for(var ri=0;ri<refresh_stack.length;ri++){
			var r= refresh_stack[ri];
			refreshMain_sub(r.step,r.x,r.y,r.w,r.h);
		}
		refresh_stack=[];
		
		//if(refresh_stack.length>0){

		//	window.requestAnimationFrame(function(e){
		//		refreshMain_();
		//	});
		//}
	}

	var refreshMain_sub=function(step,x,y,w,h){
		//プレビュー画面を更新
		
		if( typeof step === 'undefined'){
			step=0;
		}
		var root_layer = hdrpaint.root_layer;
		var bloom_size = parseFloat(hdrpaint.post_effect.bloom_size);
		var joined_img = root_layer.img;

		

		//引数無しの場合、デフォルトで更新領域は全域
		var left = 0;
		var right = joined_img.width; 
		var top = 0;
		var bottom = joined_img.height;
		
		var joined_img_data = joined_img.data;
		var joined_img_width = joined_img.width;

		if(w){
			left=x;
			right=x+w;
			top=y;
			bottom=y+h;

			//更新領域設定、はみ出している場合はクランプする
			left-=bloom_size;
			right+=bloom_size;
			top-=bloom_size;
			bottom+=bloom_size;
			
			left=Math.max(0,left);
			right=Math.min(joined_img.width,right);
			top=Math.max(0,top);
			bottom=Math.min(joined_img.height,bottom);

			left=Math.floor(left);
			right=Math.ceil(right);
			top=Math.floor(top);
			bottom=Math.ceil(bottom);
		}
		var width=right-left;
		var height=bottom-top;

		var flg_active_layer_only = inputs["selected_layer_only"].checked;
		if(flg_active_layer_only){
			//選択レイヤのみ表示
			var img = bloom_img;
			var img_data = img.data;
			var img_width = img.width;
			var layer = hdrpaint.selected_layer;
			
			bloom_img.clear(left,top,width,height);
			layer.getAbsolutePosition(absolute);
			if(layer.typename==="normal_layer"){
				bloom_img.copy(left,top,layer.img,left-absolute[0]
					,top-absolute[1],width,height);
			}else{
				layer.beforeReflect();
				bloom_img.scan(function(ret,idx,x,y){layer.getPixel(ret,idx,x-absolute[0],y-absolute[1]);}
				,left,top,width,height);
			}


		}else{

			if(step<=0){

				if(hdrpaint.post_effect.ch_bloom ){
					//ブルーム処理ありの場合は前処理を行う

					bloom_img.copy(left-bloom_size,top-bloom_size
						,hdrpaint.root_layer.img
						,left-bloom_size,top-bloom_size,right-left+bloom_size*2,bottom-top+bloom_size*2);
					bloom_img.gauss(bloom_size>>1,bloom_size,left,top,right-left,bottom-top);
					bloomed_img.copy(left,top,bloom_img
						,left,top,right-left,bottom-top);
				}
			}

			//ブルーム処理
			//ブルーム前の絵はjoined_imgに残し、結果はbloomed_imgに出力
			if(step<=1){
				var bloom = parseFloat(hdrpaint.post_effect.bloom_power);
				var _bloom = 1- bloom;

				var bloom_img_data = bloom_img.data;
				var bloomed_img_data = bloomed_img.data;
				if(hdrpaint.post_effect.ch_bloom && bloom>0){
					for(var yi=top;yi<bottom;yi++){
						var idx = yi * joined_img_width + left << 2;
						var max = yi * joined_img_width + right<< 2;
						for(;idx<max;idx+=4){
							bloom_img_data[idx]=joined_img_data[idx]*_bloom + bloomed_img_data[idx]*bloom;
							bloom_img_data[idx+1]=joined_img_data[idx+1]*_bloom+ bloomed_img_data[idx+1]*bloom;
							bloom_img_data[idx+2]=joined_img_data[idx+2]*_bloom+bloomed_img_data[idx+2]*bloom;
							bloom_img_data[idx+3]=joined_img_data[idx+3];
						}
					}
				}else{
					bloom_img.copy(left,top,joined_img,left,top,width,height);
				}
			}
		}

		if(step<=2){
			//ガンマ補正とトーンマッピング
			var ctx_imagedata_data = preview_ctx_imagedata.data;
			var ev = parseFloat(hdrpaint.post_effect.ev);
			var gamma = 1.0/parseFloat(hdrpaint.post_effect.gamma);

			joined_img_data = bloom_img.data;

			if(hdrpaint.post_effect.ch_gamma){
				var r = Math.pow(2,-ev);
				for(var yi=top;yi<bottom;yi++){
					var idx = yi * joined_img_width + left << 2;
					var max = yi * joined_img_width + right << 2;
					for(;idx<max;idx+=4){
						ctx_imagedata_data[idx+0]=Math.pow(joined_img_data[idx+0]*r,gamma)*255;
						ctx_imagedata_data[idx+1]=Math.pow(joined_img_data[idx+1]*r,gamma)*255;
						ctx_imagedata_data[idx+2]=Math.pow(joined_img_data[idx+2]*r,gamma)*255;
						ctx_imagedata_data[idx+3]=joined_img_data[idx+3]*255;
					}
				}
			}else{
				var r = Math.pow(2,-ev)*255;
				for(var yi=top;yi<bottom;yi++){
					var idx = yi * joined_img_width + left << 2;
					var max = yi * joined_img_width + right << 2;
					for(;idx<max;idx+=4){
						ctx_imagedata_data[idx+0]=joined_img_data[idx+0]*r;
						ctx_imagedata_data[idx+1]=joined_img_data[idx+1]*r;
						ctx_imagedata_data[idx+2]=joined_img_data[idx+2]*r;
						ctx_imagedata_data[idx+3]=joined_img_data[idx+3]*255;
					}
				}
			}
		}

		//結果をキャンバスに表示
		preview_ctx.putImageData(preview_ctx_imagedata,0,0,left,top,right-left,bottom-top);

		
	};
	let refreshoff=0;
export default class Redraw{
	constructor(){};


	static disableRefresh(){
		refreshoff=true;
	}
	static enableRefresh(){
		refreshoff=false;
	}


	static refreshPreview(step,x,y,w,h){
		var root_layer = hdrpaint.root_layer;
		if(refresh_stack.length === 1){
			//全更新がある場合は無視
			if(refresh_stack[0].step===0 
			&& refresh_stack[0].w === 0){
				return;
			}
		}
		if(typeof x === 'undefined'){
			//全更新の場合はコレまでのは無視する
			refresh_stack=[];
			x = 0;
			y = 0;
			w = root_layer.img.width;
			h = root_layer.img.height;
		}

		var refresh_data={};
		refresh_data.step=step;
		refresh_data.x=x;
		refresh_data.y=y;
		refresh_data.w=w;
		refresh_data.h=h;
		refresh_stack.push(refresh_data);

		if(refresh_stack.length===1){
			window.requestAnimationFrame(function(e){
				refreshMain_();
			});
		}
	}
	static compositeAll(){
		//全レイヤ更新
		var f = function(layer,left,top,right,bottom){
			if(layer.type !== Layer.COMPOSITE ){
				return;
			}
			var lower_layers = layer.children;
			for(var li=0;li<lower_layers.length;li++){
				var lower_layer = lower_layers[li];
				f(lower_layer,left,top,right,bottom);
			}
			layer.composite(left,top,right,bottom);
			

		}
		f(hdrpaint.root_layer);
	}

}
