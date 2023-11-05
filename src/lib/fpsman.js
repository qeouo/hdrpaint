export default class Fpsman{
	#fps;
	#spf; //1frameあたりの時間[ms]
	#fpserror; //蓄積誤差[ms]
	#fpserrordelta; //1secあたりの想定誤差[ms]
	#nextsleep; //次回実行時間
	#mainfunc; //1frameごとに実行する関数

	constructor(fps,mainfunc){
		this.setFps(fps);
		this.#mainfunc=mainfunc;
	
	}
	setFps(fps){
		if(this.#fps === fps){
			return;
		}

		this.#fps=fps|0;
		this.#spf=(1000/this.#fps)|0;
		this.#fpserror = 0;
		this.#fpserrordelta= 1000%this.#fps;
		this.#nextsleep=0;
	}

	mainloop = ()=>{
		var nowTime = performance.now();//現在時間
		var dt = this.#nextsleep - nowTime; //想定時間との差異

		//時間差異が1frameぶんより大きい場合は次回の呼び出し時間を補正する
		if(dt>this.#spf)dt=this.#spf;
		if(dt<-this.#spf)dt=-this.#spf;


		//ミリ秒で割り切れない分の誤差の端数処理
		this.#fpserror +=this.#fpserrordelta;
		if(this.#fpserror>=this.#fps){
			//時間誤差が1msを超えたら次回1ms増やす
			this.#fpserror-=this.#fps;
			dt+=1;
		}
		

		//次回実行時間
		this.#nextsleep = nowTime + this.#spf + dt;

		this.#mainfunc(); //メイン処理

		nowTime = performance.now();//現在時間再取得

		dt=Math.max(1,this.#nextsleep-nowTime); //次回実行時間の差異を取得(最低1ms)

		setTimeout(this.mainloop,dt);
	}
}
