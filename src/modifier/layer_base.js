"use strict"
import {Vec2,Vec3,Vec4,Mat33} from "../lib/vector.js"
import Img from "../lib/img.js";
import Redraw from "../redraw.js";
import Hdrpaint from "../hdrpaint.js";
import Util from "../lib/util.js";
import Mat43 from "../lib/mat43.js";

export default class Layer{
//���C��
	static name="layer";
	static type="generator";
	static option=`
		�T�C�Y<input type="text" id="layer_width" value="" class="size" name="width">
		<input type="text" id="layer_height" value="" class="size" name="height"><br>
		�ʒu<input type="text" id="layer_x" value="" class="size" name="position.0">
		<input type="text" id="layer_y" value="" class="size" name="position.1"><br>
		�X�P�[��<input type="text" id="scale.0" value="" class="size" name="scale.0">
		<input type="text" id="scale.1" value="" class="size" name="scale.1"><br>
		��]<input class="slider" min="0" max="360" id="angle" value="" class="size" name="angle"><br>
		<div id="div_blendfunc">����func<select type="text" id="layer_blendfunc" name="blendfunc">
		</select></div>
		��<input class="slider" id="layer_alpha" max="1" name="alpha"/>
		<label><input type="checkbox" id="layer_mask_alpha" name="mask_alpha"/>�����b�N</label><br>
		���邳<input class="slider" id="layer_power" min="-10" max="10" name="power"/><br>
	`;
	constructor(){
		this.id=-1;
		this.name="";
		this.display = true;
		this.lock = false;
		this.power=0.0;
		this.alpha=1.0;
		this.blendfunc="normal";
		this.modifier="layer";
		this.div=null;
		this.img=null;
		this.width=0;
		this.height=0;
		this.img_id=-1;
		this.mask_alpha=0;
		this.position =new Vec3();
		this.scale=new Vec3();
		Vec3.setValues(this.scale,1,1,1);
		this.angle = 0;//new Vec3();
		this.size=new Vec2();
		this.modifier_param={};

		this.type=0; //1�Ȃ�K�w���C�� ,2�Ȃ烂�f�t�@�C�A
		this.children=null; //�q�����C��


		var html=`
				<a href="#" class="openclosebutton">
				</a>
				<div class="layer_dragenter" > </div>
				<div class="thumbnailouter" >
					<img class="thumbnail" >
				</div>
				<div class="name"></div>
				<div class="layer_attributes"></div>
				<div class="children"></div>
			`;

		var dom =document.createElement("div");
		dom.insertAdjacentHTML('beforeend',html);
		dom.classList.add("layer");
		dom.classList.add("open");
		dom.setAttribute("draggable","true");
		dom.addEventListener("dragstart",DragStart);
		dom.addEventListener("dragover",DragOver);
		dom.addEventListener("click",click);
		dom.querySelector(".openclosebutton").addEventListener("click",opencloseClick);
		dom.querySelector(".layer_dragenter").addEventListener("dragenter",DragEnter);
		dom.querySelector(".children").addEventListener("dragenter",DragEnterChild);

		this.dom = dom;

		binder.bind(dom.querySelector(".name"),"",this,"name");


	};
	init(){ };

	static enableRefreshThumbnail=true;

	getMatrix(mat43){
		var rot = new Vec3();
		rot[2]=this.angle/360*(Math.PI*2);
		Mat43.fromLSE(mat43,this.position,this.scale,rot);

		var x =  this.size[0]*(1-mat43[0]) - this.size[1]*mat43[3];
		var y =  -this.size[0]*mat43[1] + this.size[1]*(1-mat43[4]);
		mat43[9] +=(x)*0.5;
		mat43[10] +=(y)*0.5;
	}

	//���C�������J�n�O����
	before(area){};

	//���C���������O����
	beforeReflect(){};

	//���C����������
	reflect (img,composite_area){
		var x = Math.max(img.offsetx,composite_area[0]);
		var y = Math.max(img.offsety,composite_area[1]);
		var x1 = Math.min(img.width+img.offsetx,composite_area[2]+composite_area[0]);
		var y1 = Math.min(img.height+img.offsety,composite_area[3]+composite_area[1]);
		var layer = this;
		var img_data = img.data;
		var img_width = img.width;
		var layer_img = hdrpaint.getImgById(layer.img_id);
		var layer_img_data = layer_img.data;
		var layer_alpha=layer.alpha;
		var layer_power=Math.pow(2,layer.power);
		var layer_img_width = layer_img.width;
		var func = Hdrpaint.blendfuncs[layer.blendfunc];
		var layer_position_x= layer.position[0];
		var layer_position_y= layer.position[1];

		//���C���̃N�����v
		var cos = Math.abs(Math.cos(layer.angle /360*Math.PI*2))
		var sin = Math.abs(Math.sin(layer.angle /360*Math.PI*2))
		var width = cos*layer_img.width + sin*layer_img.height>>1;
		var height= sin*layer_img.width + cos*layer_img.height>>1;
		var left2 = Math.max(x,layer.position[0]+ layer_img.width*0.5-width*layer.scale[0]);
		var top2 = Math.max(y,layer.position[1]+layer_img.height*0.5-height*layer.scale[1]);
		var right2 = Math.min(layer_img.width*0.5+width + layer_position_x ,x1);
		var bottom2 = Math.min(layer_img.height*0.5+height + layer_position_y ,y1);

		var pos = new Vec3();
		var pos2 = new Vec3();
		pos[2]=1;
		var matrix = new Mat43();
		this.getMatrix(matrix);
		Mat43.getInv(matrix,matrix);

		for(var yi=top2;yi<bottom2;yi++){
			var idx = (yi-img.offsety) * img_width + left2  - img.offsetx << 2;
			pos[1] = yi;
			for(var xi=left2;xi<right2;xi++){
				pos[0] = xi;
				Mat43.dotVec3(pos2,matrix,pos);
				pos2[0]=pos2[0]+0.5<<0;
				pos2[1]=pos2[1]+0.5<<0;
				idx+=4;
				if(pos2[0]<0)continue;
				if(pos2[0]>=layer_img.width)continue;
				if(pos2[1]<0)continue;
				if(pos2[1]>=layer_img.height)continue;
				var idx2 = pos2[1] * layer_img_width   + pos2[0] << 2;
				func(img_data,idx-4,layer_img_data,idx2,layer_alpha,layer_power);
			}
		}
			
	};
	composite(){}


	getPixel(ret,idx,x,y){
		if(!this.img){
			return;
		}

		if(x<0 || y<0 || x>=this.img.width || y>=this.img.height){
			return ret;
		}
		if(y === undefined){
			y= x;
			x = idx;
			idx = 0;
		}
		if(this.img.data){
			var data = this.img.data;
			var idx2 = this.img.getIndex(x,y)<<2;
			ret[idx+0] = data[idx2];
			ret[idx+1] = data[idx2+1];
			ret[idx+2] = data[idx2+2];
			ret[idx+3] = data[idx2+3];
		}
		
		return ret;
	}


	static bubble_func(layer_id,f){
		var layer = Layer.findById(layer_id);
		//�e�ɓ`�����鏈��
		f(layer);
		//var parent_layer= Layer.findParent(layer);
		var parent_layer=layer.parent;

		if(parent_layer){
			Layer.bubble_func(parent_layer,f);
		}

	}


	static eachLayers(f){
		if(!Hdrpaint.root_layer){
			return;
		}
		var cb = function(layer_id){
			var layer = Layer.findById(layer_id);
			if(f(layer)){
				return true;
			}
			if(layer.type === 0){
				return false;
			}
			var layers = layer.children;
			if(layers){
				for(var i=0;i<layers.length;i++){
					if(cb(layers[i])){
						return true;
					}
				}
			}
			return false;
		}
		return cb(hdrpaint.root_layer.id);
	}

	static findById(layer_id){
	//	var result_layer = null;
	//	Layer.eachLayers(function(layer){
	//		if(layer.id== layer_id){
	//			result_layer = layer;

	//			return true;
	//		}

	//	});
	//	return result_layer;
		return hdrpaint.layers[layer_id];
	}


	static layerArray(){
		var layers=[];
		Layer.eachLayers(function(layer){
			layers.push(layer);
		});
		return layers;

	}



	refreshImg(x,y,w,h){
		var layer = this;

		var left = 0;
		var top = 0;
		var right = 0;
		var bottom = 0;
		var layer_img = hdrpaint.getImgById(layer.img_id);
		if(layer_img){
			right = layer.size[0]-1;
			bottom = layer.size[1]-1;
		}else{
			right =Hdrpaint.root_layer.size[0]-1; 
			bottom =Hdrpaint.root_layer.size[1]-1; 
		}

		if( typeof w !== 'undefined'){
			//�X�V�̈�ݒ�A�͂ݏo���Ă���ꍇ�̓N�����v����
			left=Math.max(left,x);
			right=Math.min(right,x+w-1);
			top=Math.max(top,y);
			bottom=Math.min(bottom,y+h-1);
		}

		var mat43 = new Mat43();
		this.getMatrix(mat43);
		var poses=[];
		poses.push(new Vec3(left,top,0));
		poses.push(new Vec3(left,bottom,0));
		poses.push(new Vec3(right,bottom,0));
		poses.push(new Vec3(right,top,0));
		Mat43.dotVec3(poses[0],mat43,poses[0]);
		left = poses[0][0];
		right= poses[0][0];
		bottom= poses[0][1];
		top = poses[0][1];
		for(var i=1;i<poses.length;i++){
			Mat43.dotVec3(poses[i],mat43,poses[i]);
			left = Math.min(left,poses[i][0]);
			right = Math.max(right,poses[i][0]);
			top = Math.min(top,poses[i][1]);
			bottom = Math.max(bottom,poses[i][1]);
		}

		
		left=Math.floor(left);
		right=Math.ceil(right);
		top=Math.floor(top);
		bottom=Math.ceil(bottom);

		if(layer.parent){
			var parent = Layer.findById(layer.parent);
			if(typeof w === 'undefined'){
				parent.bubbleComposite();

			}else{
				parent.bubbleComposite(left
					,top 
					,right -left +1
					,bottom -top +1);
			}
		}
		this.registRefreshThumbnail();
	}
	bubbleComposite(x,y,w,h){

		if(typeof x === 'undefined'){
			x = 0;
			y = 0;
			w = this.size[0];
			h = this.size[1];
		}

		var left = x;
		var top= y;
		var right = x+w-1;
		var bottom = y+h-1;

		left = Math.max(0,left);
		top = Math.max(0,top);
		var layer_img = hdrpaint.getImgById(this.img_id);
		if(layer_img){
			right = Math.min(layer_img.width-1,right);
			bottom = Math.min(layer_img.height-1,bottom);
		}
		left=Math.floor(left);
		right=Math.ceil(right);
		top=Math.floor(top);
		bottom=Math.ceil(bottom);

		if(left == right || top == bottom){
			return;
		}

		if(this.type===2){
			if(this.parent){
				var parent = Layer.findById(this.parent);
				parent.bubbleComposite(left+this.position[0]
					,top + this.position[1]
					,right-left+1
					,bottom-top+1);
			}
			return;
		}
		if(typeof x === 'undefined'){
			this.composite();
		}else{
			this.composite(left,top,right,bottom);
		}
		if(this.parent){
			var parent = Layer.findById(this.parent);
			parent.bubbleComposite(left+this.position[0]
				,top + this.position[1]
				,right-left+1
				,bottom-top+1);
		}
	}
	showDivParam(){
		var layer = this;
		var txt="";
		txt += "offset:["+layer.position[0]+","+layer.position[1] +"]"
			+ "size:[" + layer.size[0]+ "," + layer.size[1]+"]<br>";
		
		layer.power=Number(layer.power);
		txt += "pow:"+layer.power.toFixed(2)+"";
		layer.alpha=Number(layer.alpha);
		txt += "��:"+layer.alpha.toFixed(2)+"<br>";
			
		return txt;

	}
	refreshDiv(){
		var layer = this;
		var layers_container = null;
		if(!hdrpaint.root_layer){return;};

		if(layer.id === hdrpaint.root_layer.id){
			layers_container = document.getElementById("layers_container");
		}else{
			//layer.dom.className="layer";
			if(Hdrpaint.selected_layer_id === layer.id){
				layer.dom.classList.add("active");
			}else{
				layer.dom.classList.remove("active");
			}

			if(layer.type===0 || !layer.children){
				layer.dom.classList.remove("group");
			}else{
				layer.dom.classList.add("group");
			}
			var div= layer.dom.getElementsByClassName("name")[0];
			var name=layer.name;
			if(!this.display){
				name +="(��\��)";
				layer.dom.classList.add("invisible");
			}else{
				layer.dom.classList.remove("invisible");
			}
			if(this.lock){
				name +="(lock)";
				layer.dom.classList.add("lock");
			}else{
				layer.dom.classList.remove("lock");
			}
			if(this.mask_alpha){
				name +="(��lock)";
			}
			//div.innerHTML=name;
			
			var span = layer.dom.getElementsByClassName("layer_attributes")[0];
			var txt="";
			if(layer.type === 2){
				txt += "modifier:"+layer.modifier+"<br>";
			}else{
				txt += "func:"+layer.blendfunc +"<br>";
			}
			txt+=layer.showDivParam();
			

			span.innerHTML = txt;

			layers_container = layer.dom.getElementsByClassName("children")[0];

		}


		//�q���C���ݒ�
		while (layers_container.firstChild) layers_container.removeChild(layers_container.firstChild);
		if(layer.children){
			for(var li=layer.children.length;li--;){
				var child = Layer.findById(layer.children[li]);
				layers_container.appendChild(child.dom);
			}
		}


//		if(layer === Hdrpaint.selected_layer){
//			Hdrpaint.refreshActiveLayerParam();
//		}

	}

	append(idx,layer_id){
		var layer = Layer.findById(layer_id);
		this.children.splice(idx,0,layer_id);

		layer.parent = this.id;

		this.refreshDiv();
		//refreshMain();
		this.bubbleComposite();
	}

	refreshThumbnail(){
		//���C���T���l�C���X�V
		var layer=this;
		var sum=new Vec4();
		//if(layer.children){

			layer.dom.style.backgroundImage = "none";
		//}

		if(layer.type === 2){ 
			//�W�F�l���[�^���C��
			var img = gen_thumbnail_img;
			img.thumbnail=true;
			var newx = img.width;
			var newy = img.height;

			img.offsetx=0;
			img.offsety=0;
			layer.reflect(img,[0,0,img.width,img.height]);

			layer.dom.style.backgroundImage = "url(" + img.toDataURL() + "),url(./css/back.png)";
			return;
			
		}

		var img = hdrpaint.getImgById(layer.img_id);
		if(!img){
			return;
		}
		if(!img.data){
			return;
		}
		var img_data=img.data;

		var layer_img=layer.dom.getElementsByTagName("img")[0];

		var r=img.width;
		if(img.width<img.height){
			r = img.height;
			layer_img.style.width="auto";
			layer_img.style.height="100%";
		}else{
			layer_img.style.width="100%";
			layer_img.style.height="auto";
		}
		r/=64;
		var newx = img.width/r|0;
		var newy = img.height/r|0;

		thumbnail_img.clear(0,0,newx,newy);
		var data = img.data;
		var dst_data = thumbnail_img.data;
		var _255 = 1/255;
		var ev = Number(inputs["ev"].value);
		var ev2  = Math.pow(2,-ev)*255;
		var rr255 = 255/(r*r);


		for(var yi=0;yi<newy;yi++){
			for(var xi=0;xi<newx;xi++){
				Vec4.setValues(sum,0,0,0,0);
				for(var yii=0;yii<r;yii++){
					for(var xii=0;xii<r;xii++){
						var idx = img.getIndex(xi*r+xii|0,yi*r+yii|0)<<2;
						var alpha = data[idx+3];
						sum[0]+=data[idx+0]*alpha;
						sum[1]+=data[idx+1]*alpha;
						sum[2]+=data[idx+2]*alpha;
						sum[3]+=alpha;
					}
				}
				var idx = thumbnail_img.getIndex(xi,yi)<<2;
				var _r = ev2/sum[3];
				dst_data[idx]=sum[0]*_r;
				dst_data[idx+1]=sum[1]*_r;
				dst_data[idx+2]=sum[2]*_r;
				dst_data[idx+3]=sum[3]*rr255;
			}
		}
		thumbnail_img.width=newx;
		thumbnail_img.height=newy;

		thumbnail_img.toBlob((blob)=>{
			URL.revokeObjectURL(layer_img.src);
			layer_img.src = URL.createObjectURL(blob);
		});
		thumbnail_img.width=64;
		thumbnail_img.height=64;

	}

	getAbsoluteMatrix(mat){
		//���C���̐�΍��W�擾
		Mat43.setInit(mat);

		Layer.bubble_func(this.id,function(layer){
			var a = new Mat43();
			layer.getMatrix(a);

			Mat43.dot(mat,a,mat);
		});
	}

	getAbsolutePosition(p){
		//���C���̐�΍��W�擾
		Vec2.setValues(p,0,0);

		Layer.bubble_func(this.id,function(layer){
			Vec2.add(p,p,layer.position);
		});
	}
	toRelative(p){
		var mat43  =new Mat43();
		this.getAbsoluteMatrix(mat43);
		Mat43.getInv(mat43,mat43);
		Mat43.dotVec3(p,mat43,p);
	}

	select(){
		//���C����I����Ԃɂ���
		Hdrpaint.selectLayer(this);

	}



	registRefreshThumbnail(){
		if(stackThumbnail.indexOf(this)>=0){
			return;
		}
		stackThumbnail.push(this);

		if(stackThumbnail.length===1){
			window.requestAnimationFrame(function(e){
				refreshThumbnail();
			});
		}
	}
	



};