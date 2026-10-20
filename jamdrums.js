/* なみぐる！TOOLS:ジャムモードのリズムとドラムの音(ジャムモード・ピアノで共通)
   NamiDrums.ST:リズム(16分のステップ。k=キック s=スネア h=ハット o=オープン r=リム c=クラップ y=ライド f=ペダル x=クラッシュ b=タンバリン w=カウベル z=シェイカー t,u=コンガ)
   NamiDrums.voices(A):ドラムの音。A={ac(),noise(),D(),M(),S()} を渡す(D=ドラムの出口、M=金物用、S=スネア用) */
(function(){
"use strict";
var ST={
 "8beat":{g:"std",n:"8ビート",sw:0,k:"x.......x.x.....",s:"....x.......x...",h:"x.x.x.x.x.x.x.x.",keys:[[0,15]],bass:[[0,"R",6],[6,"R",2],[8,"R",4],[12,"5",4]]},
 "16beat":{g:"std",n:"16ビート",sw:0,k:"x.....x...x.....",s:"....x.......x...",h:"xxxxxxxxxxxxxxxx",keys:[[0,6],[6,4],[10,6]],bass:[[0,"R",3],[3,"R",1],[6,"R",2],[10,"R",2],[12,"5",2],[14,"8",2]]},
 "neo":{g:"soul",n:"ネオソウル(ハネ)",sw:0.55,sw16:1,k:"x......x..x.....",s:"....x.......x...",h:"x.x.x.x.x.x.x.x.",keys:[[0,6],[7,9]],bass:[[0,"R",5],[7,"R",3],[10,"5",4],[14,"8",2]]},
 "bossa":{g:"latin",n:"ボサノバ",sw:0,k:"x..x....x..x....",r:"x..x..x...x..x..",h:"x.x.x.x.x.x.x.x.",keys:[[0,2],[3,2],[6,3],[10,2],[13,3]],bass:[[0,"R",6],[6,"R",2],[8,"5",6],[14,"5",2]]},
 "four":{g:"dance",n:"4つ打ち",sw:0,k:"x...x...x...x...",c:"....x.......x...",o:"..x...x...x...x.",h:"x.x.x.x.x.x.x.x.",keys:[[2,2],[6,2],[10,2],[14,2]],bass:[[2,"R",2],[6,"R",2],[10,"R",2],[14,"R",2]]},
 "rock":{n:"ロック",g:"std",sw:0,k:"x.....x.x.......",s:"....x.......x...",h:"x.x.x.x.x.x.x.x.",x:"x...............",keys:[[0,2],[2,2],[4,2],[6,2],[8,2],[10,2],[12,2],[14,2]],bass:[[0,"R",2],[2,"R",2],[4,"R",2],[6,"R",2],[8,"R",2],[10,"R",2],[12,"5",2],[14,"8",2]]},
 "halftime":{n:"ハーフタイム",g:"std",sw:0,k:"x.........x.....",s:"........x.......",h:"x.x.x.x.x.x.x.x.",o:"..............x.",keys:[[0,16]],bass:[[0,"R",8],[10,"R",4],[14,"5",2]]},
 "motown":{n:"モータウン",g:"std",sw:0,k:"x.x.....x.x.....",s:"....x.......x...",b:"....x.......x...",h:"x.x.x.x.x.x.x.x.",keys:[[4,2],[12,2]],bass:[[0,"R",2],[2,"R",2],[6,"5",2],[8,"R",2],[10,"R",2],[14,"8",2]]},
 "funk":{n:"ファンク",g:"std",sw:0,k:"x.x....x..x.....",s:"....x..x.x..x..x",h:"xxxxxxxxxxxxxx.x",o:"..............x.",keys:[[0,1],[3,1],[6,1],[10,1],[13,1]],bass:[[0,"R",2],[3,"8",1],[6,"R",1],[7,"R",1],[10,"5",2],[13,"8",1],[14,"R",2]]},
 "break":{n:"ブレイクビーツ",g:"std",sw:0,k:"x.x.......x.....",s:"....x..x.x..x...",h:"x.x.x.x.x.x.x.x.",o:"..........x.....",keys:[[0,6],[8,6]],bass:[[0,"R",3],[3,"R",1],[10,"R",2],[12,"5",4]]},
 "disco":{n:"ディスコ",g:"dance",sw:0,k:"x...x...x...x...",s:"....x.......x...",h:"x...x...x...x...",o:"..x...x...x...x.",b:"xxxxxxxxxxxxxxxx",keys:[[2,2],[6,2],[10,2],[14,2]],bass:[[0,"R",2],[2,"8",2],[4,"R",2],[6,"8",2],[8,"R",2],[10,"8",2],[12,"R",2],[14,"8",2]]},
 "trap":{n:"トラップ",g:"dance",sw:0,k:"x......x..x.....",c:"........x.......",h:"x.x.xxx.x.x.x.xx",keys:[[0,16]],bass:[[0,"R",7],[7,"R",3],[10,"R",6]]},
 "twostep":{n:"2ステップ",g:"dance",sw:0.5,sw16:1,k:"x.........x.....",s:"....x.......x...",h:"..x...x...x...x.",r:"...x......x....x",z:"x.x.x.x.x.x.x.x.",keys:[[3,2],[10,3]],bass:[[0,"R",3],[6,"R",2],[10,"R",3],[14,"5",2]]},
 "dnb":{n:"ドラムンベース",g:"dance",sw:0,k:"x.........x.....",s:"....x.......x...",h:"x.x.x.x.x.x.x.x.",y:"x...x...x...x...",keys:[[0,16]],bass:[[0,"R",8],[10,"R",6]]},
 "hiphop":{n:"ヒップホップ(ブーンバップ)",g:"soul",sw:0.4,sw16:1,k:"x......xx.x.....",s:"....x.......x...",h:"x.x.x.x.x.x.x.x.",keys:[[0,7],[8,8]],bass:[[0,"R",6],[7,"R",1],[8,"R",2],[10,"5",4]]},
 "samba":{n:"サンバ",g:"latin",sw:0,k:"x..xx..xx..xx..x",b:"x.xxx.xxx.xxx.xx",s:"..x...x...x..x.x",w:"x.x..x.x..x.x..x",keys:[[0,2],[3,2],[6,2],[8,2],[11,2],[14,2]],bass:[[0,"R",3],[3,"5",1],[4,"5",4],[8,"R",3],[11,"5",1],[12,"5",4]]},
 "salsa":{n:"サルサ(ソン・クラーベ)",g:"latin",sw:0,k:"...x..x....x..x.",r:"x..x..x...x.x...",w:"x...x.x.x.x.x.x.",t:"......xx......xx",z:"x.x.x.x.x.x.x.x.",keys:[[0,1],[2,1],[3,1],[5,1],[6,1],[8,1],[10,1],[11,1],[13,1],[14,1]],bass:[[3,"5",3],[6,"R",6],[12,"5",4]]},
 "chacha":{n:"チャチャチャ",g:"latin",sw:0,k:"x.......x.......",w:"x...x...x...x...",t:"............x.x.",u:"..............x.",r:"....x.......x...",z:"x.xxx.xxx.xxx.xx",keys:[[0,2],[4,2],[8,2],[12,1],[14,2]],bass:[[0,"R",4],[6,"5",2],[8,"R",4],[12,"R",2],[14,"5",2]]},
 "reggaeton":{n:"レゲトン",g:"latin",sw:0,k:"x...x...x...x...",s:"...x..x....x..x.",h:"x.x.x.x.x.x.x.x.",b:"..x...x...x...x.",keys:[[0,16]],bass:[[0,"R",3],[3,"R",3],[6,"R",2],[8,"R",3],[11,"R",3],[14,"R",2]]},
 "cumbia":{n:"クンビア",g:"latin",sw:0,k:"x.......x.......",r:"....x.......x...",u:"..x...x...x...x.",z:"x.xxx.xxx.xxx.xx",keys:[[2,2],[6,2],[10,2],[14,2]],bass:[[0,"R",4],[4,"5",4],[8,"R",4],[12,"5",4]]},
 "baiao":{n:"バイアォン",g:"latin",sw:0,k:"x..x....x..x....",s:"......x.......x.",h:"x.xxx.xxx.xxx.xx",o:"..x.......x.....",keys:[[0,3],[3,3],[8,3],[11,3]],bass:[[0,"R",3],[3,"5",5],[8,"R",3],[11,"5",5]]},
 "onedrop":{n:"レゲエ(ワンドロップ)",g:"latin",sw:0.5,k:"........x.......",r:"........x.......",h:"x.x.x.x.x.x.x.x.",keys:[[2,1],[6,1],[10,1],[14,1]],bass:[[0,"R",3],[4,"5",2],[8,"R",3],[12,"3",2]]},
 "jersey":{n:"ジャージークラブ(140前後)",g:"net",sw:0,k:"x..x..x.x..x..x.",c:"....x.......x...",h:"..x...x...x...x.",b:"...x......x.....",keys:[[0,3],[3,3],[6,4],[10,6]],bass:[[0,"R",3],[3,"R",3],[6,"R",2],[8,"R",3],[11,"R",3],[14,"R",2]]},
 "phonk":{n:"フォンク(ドリフト系)",g:"net",sw:0,k:"x......x..x.....",c:"....x.......x...",h:"xxxxxxxxxxxxxxxx",w:"x..x..x...x..x..",keys:[[0,8],[8,8]],bass:[[0,"R",7],[7,"R",3],[10,"R",6]]},
 "drill":{n:"UKドリル(140前後・ハーフ)",g:"net",sw:0,k:"x......x..x.....",s:"........x.....x.",h:"x.x.xx.x.xx.x.xx",keys:[[0,16]],bass:[[0,"R",7],[7,"R",3],[10,"5",6]]},
 "lofi":{n:"ローファイ・ヒップホップ",g:"net",sw:0.5,sw16:1,k:"x......x.x......",s:"....x.......x...",h:"x.x.x.x.x.x.x.x.",z:"..x...x...x...x.",keys:[[0,7],[8,8]],bass:[[0,"R",6],[7,"R",2],[9,"5",7]]},
 "futurebass":{n:"フューチャーベース(ハーフ)",g:"net",sw:0,k:"x.........x.....",c:"........x.......",h:"..x...x...x...x.",x:"x...............",keys:[[0,2],[3,2],[6,2],[8,2],[11,2],[14,2]],bass:[[0,"R",10],[10,"R",6]]},
 "footwork":{n:"フットワーク(160前後)",g:"net",sw:0,k:"x..x..x...x..x..",c:"....x.......x...",h:"..x...x...x...x.",keys:[[0,3],[3,3],[6,4]],bass:[[0,"R",3],[3,"R",3],[6,"R",4],[10,"R",3],[13,"R",3]]},
 "amapiano":{n:"アマピアノ(112前後)",g:"net",sw:0.3,sw16:1,k:"x...x...x...x...",r:"...x..x....x..x.",c:"....x.......x...",z:"xxxxxxxxxxxxxxxx",keys:[[0,3],[3,3],[6,4],[10,3],[13,3]],bass:[[0,"R",3],[3,"R",3],[6,"5",4],[10,"R",3],[13,"8",3]]},
 "afro":{n:"アフロビーツ(105前後)",g:"net",sw:0.25,sw16:1,k:"x..x..x...x.....",c:"....x.......x...",r:"..x..x...x..x...",z:"x.xxx.xxx.xxx.xx",keys:[[0,2],[3,2],[6,2],[10,2],[12,2]],bass:[[0,"R",3],[3,"R",3],[6,"5",4],[10,"R",4],[14,"5",2]]},
 "waltz":{g:"odd",n:"ワルツ(3/4)",steps:12,ts:[3,4],sw:0,k:"x...........",s:"....x...x...",h:"x.x.x.x.x.x.",keys:[[4,3],[8,3]],bass:[[0,"R",4]]},
 "pop34":{g:"odd",n:"3拍子(3/4)",steps:12,ts:[3,4],sw:0,k:"x.....x.x...",s:"........x...",h:"x.x.x.x.x.x.",keys:[[0,12]],bass:[[0,"R",6],[6,"R",2],[8,"5",4]]},
 "68":{g:"odd",n:"ハチロク(6/8)",steps:12,ts:[6,8],grp:[0,6],sw:0,k:"x.........x.",s:"......x.....",h:"x.x.x.x.x.x.",keys:[[0,2],[2,2],[4,2],[6,2],[8,2],[10,2]],bass:[[0,"R",6],[6,"5",6]]},
 "54":{g:"odd",n:"5拍子(5/4)",steps:20,ts:[5,4],sw:0,k:"x.....x.....x.......",s:"........x.......x...",h:"x.x.x.x.x.x.x.x.x.x.",keys:[[0,12],[12,8]],bass:[[0,"R",6],[6,"R",6],[12,"5",8]]},
 "78":{g:"odd",n:"7拍子(7/8)",steps:14,ts:[7,8],grp:[0,4,8],sw:0,k:"x.......x.....",s:"....x.......x.",h:"x.x.x.x.x.x.x.",keys:[[0,4],[4,4],[8,6]],bass:[[0,"R",4],[4,"5",4],[8,"R",6]]},
 "jazz":{g:"soul",n:"ジャズ(スウィング)",sw:1,y:"x...x.x.x...x.x.",f:"....x.......x...",k:"x...............",keys:[[0,3],[6,4]],walk:1}
};
var GN=[["std","定番"],["dance","ダンス・クラブ"],["soul","ソウル・ジャズ・ヒップホップ"],["net","ネット・DTM"],["latin","ラテン・ワールド"],["odd","3拍子・変拍子"]];
function voices(A){
const env=(t,pk,dec,att)=>{const g=A.ac().createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(pk,t+(att||0.002));g.gain.setTargetAtTime(0.0001,t+(att||0.002),dec);g.connect(A.D());return g;};
const envM=(t,pk,dec,att)=>{const g=A.ac().createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(pk,t+(att||0.002));g.gain.setTargetAtTime(0.0001,t+(att||0.002),dec);g.connect(A.M());return g;};
const envS=(t,pk,dec,att)=>{const g=A.ac().createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(pk,t+(att||0.002));g.gain.setTargetAtTime(0.0001,t+(att||0.002),dec);g.connect(A.S());return g;};
const nz=(t,dur,dest,type,f,q)=>{const s=A.ac().createBufferSource(),b=A.ac().createBiquadFilter();s.buffer=A.noise();b.type=type;b.frequency.value=f;if(q)b.Q.value=q;s.connect(b);b.connect(dest);s.start(t,Math.random()*0.5);s.stop(t+dur);};
return {
 k(t,v){const o=A.ac().createOscillator();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(48,t+0.09);o.connect(env(t,0.9*v,0.18));o.start(t);o.stop(t+0.8);},
 s(t,v){const o=A.ac().createOscillator();o.type="triangle";o.frequency.setValueAtTime(210,t);o.frequency.exponentialRampToValueAtTime(180,t+0.03);o.connect(env(t,0.25*v,0.05));o.start(t);o.stop(t+0.3);nz(t,0.3,envS(t,0.26*v,0.07),"highpass",1600);},
 h(t,v){nz(t,0.08,envM(t,0.09*v,0.02),"highpass",6500);},
 o(t,v){nz(t,0.4,envM(t,0.075*v,0.13),"highpass",6000);},
 r(t,v){ /* リム(クロススティック):高域を抑えた丸めの音 */const lp=A.ac().createBiquadFilter();lp.type="lowpass";lp.frequency.value=2600;lp.Q.value=0.5;lp.connect(env(t,0.2*v,0.014));const b=A.ac().createBiquadFilter();b.type="bandpass";b.frequency.value=1150;b.Q.value=3;b.connect(lp);[["triangle",1150,0.09],["square",430,0.06]].forEach(a=>{const o=A.ac().createOscillator();o.type=a[0];o.frequency.value=a[1];o.connect(b);o.start(t);o.stop(t+a[2]);});},
 c(t,v){[0,0.01,0.02].forEach(d=>nz(t+d,0.03,env(t+d,0.4*v,0.006),"bandpass",1150,1.2));nz(t+0.03,0.3,env(t+0.03,0.3*v,0.06),"bandpass",1150,1.2);},
 y(t,v){ /* ライド:高域を削った丸めの音 */const lp=A.ac().createBiquadFilter();lp.type="lowpass";lp.frequency.value=5000;lp.Q.value=0.4;lp.connect(envM(t,0.048*v,0.32,0.004));nz(t,0.9,lp,"bandpass",4000,0.6);const o=A.ac().createOscillator();o.frequency.value=2350;o.connect(env(t,0.007*v,0.2,0.003));o.start(t);o.stop(t+0.8);},
 f(t,v){nz(t,0.06,envM(t,0.06*v,0.015),"bandpass",3500,1);},
 x(t,v){const lp=A.ac().createBiquadFilter();lp.type="lowpass";lp.frequency.value=9000;lp.connect(envM(t,0.06*v,0.55,0.003));nz(t,1.6,lp,"highpass",4200);},
 b(t,v){nz(t,0.12,envM(t,0.05*v,0.04,0.003),"bandpass",7000,1.5);},
 w(t,v){const bp=A.ac().createBiquadFilter();bp.type="bandpass";bp.frequency.value=900;bp.Q.value=2.5;bp.connect(env(t,0.22*v,0.07));[562,845].forEach(f=>{const o=A.ac().createOscillator();o.type="square";o.frequency.value=f;o.connect(bp);o.start(t);o.stop(t+0.4);});},
 z(t,v){nz(t,0.07,envM(t,0.042*v,0.02,0.008),"highpass",5000);},
 t(t,v){const o=A.ac().createOscillator();o.frequency.setValueAtTime(205,t);o.frequency.exponentialRampToValueAtTime(185,t+0.08);o.connect(env(t,0.32*v,0.12));o.start(t);o.stop(t+0.6);nz(t,0.02,env(t,0.06*v,0.008),"bandpass",2500,1);},
 u(t,v){const o=A.ac().createOscillator();o.frequency.setValueAtTime(320,t);o.frequency.exponentialRampToValueAtTime(295,t+0.06);o.connect(env(t,0.28*v,0.09));o.start(t);o.stop(t+0.5);nz(t,0.02,env(t,0.06*v,0.008),"bandpass",3000,1);}
};
}
/* ac と出口だけ渡せば使えるかんたん版:金物とスネアの高域を丸めるフィルターも中で作る */
function simple(ac,dest){var nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate),d=nb.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  var m=ac.createBiquadFilter();m.type="lowpass";m.frequency.value=7800;m.Q.value=0.5;m.connect(dest);
  var s=ac.createBiquadFilter();s.type="lowpass";s.frequency.value=6000;s.Q.value=0.5;s.connect(dest);
  return voices({ac:function(){return ac;},noise:function(){return nb;},D:function(){return dest;},M:function(){return m;},S:function(){return s;}});}
window.NamiDrums={ST:ST,GN:GN,voices:voices,simple:simple,KEYS:["k","s","h","o","r","c","y","f","x","b","w","z","t","u"]};
})();
