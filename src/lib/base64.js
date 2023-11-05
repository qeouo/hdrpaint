export default class Base64Util{
	constructor(){
	}
	static arrayToBase64(array){
		return btoa(String.fromCharCode(...array));
	}
	static base64ToArray(base64){
		var binary = atob(base64);
		var len = binary.length;
		var bytes = new Uint8Array(len);
		for (var i = 0; i < len; i++)        {
		  bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	}
}
