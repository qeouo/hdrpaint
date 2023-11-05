import jis2unicode from "./jis2unicode.js";

var entries = Object.entries(jis2unicode);


var unicode2jis={};
entries.forEach((e)=>{
	unicode2jis[e[1]]=Number(e[0]);
});


export default unicode2jis;
