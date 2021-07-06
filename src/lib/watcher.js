//�ϐ��Ď�

import Util from "./util.js";
class Watch{
	constructor(variable_root,variable_name,callback){
		this.variable_root=variable_root;
		this.variable_direction = variable_name.split(".");
		this.callback=callback;
		this.old_value={};
	}

	getValue(n){
		//�Ď��Ώۂ̕ϐ��̒l���擾
		var value=this.variable_root;
		var v=this.variable_direction;
		for(var j=0;j<v.length-n;j++){
			value = value[v[j]];
			if(value == undefined){
				value=null;
				break;
			}
		}
		return value;
	}
	setValue(value){
		//�Ď��ϐ��ɒl���Z�b�g����
		var val =this.getValue(1); //�Ώۂ̕ϐ��̐e���擾
		val[this.variable_direction[this.variable_direction.length-1]]=value;
	}

	refresh(){
		//�o�C���h���ꂽ�ϐ��̒l���m�[�h�����ɃZ�b�g
		var value = this.getValue(0);
		this.change_flg = (this.old_value !== value);
		this.old_value = value;
	}
}

export default class Watcher {
	constructor(){
		this.watches=[];
	}

	init(){
		//������&�o�C���h
//		var func =()=>{
//			this.refresh();
//			window.requestAnimationFrame(func);
//		}
//		func();
	}

	watch(variable_root,variable_name,func){
		//�Ď��ϐ���ǉ�
		var watch = new Watch(variable_root,variable_name,func);
		this.watches.push(watch);
		return watch;
	}
	refresh(){
		//�Ď��Ώۂ��`�F�b�N
		this.watches.forEach((w)=>{
			w.refresh();
		});
	}
}
