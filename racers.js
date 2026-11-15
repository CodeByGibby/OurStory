/* Corgi Racers: unlocked by earning all 120 stars in Our Story */
window.CRZ=(()=>{
/* ===================================================================
   CORGI RACERS: the unlockable career mode (all 120 stars).
   Runs in its own overlay with its own loop; borrows the pixel helpers,
   sounds and music engine from Our Story.
   =================================================================== */
const BW=160,BH=288,U=n=>'calc(var(--u)*'+n+')';
const buf=document.createElement('canvas');buf.width=BW;buf.height=BH;const bg=buf.getContext('2d');bg.imageSmoothingEnabled=false;
let root=null,dcv=null,dctx=null,ui=null,on=0,tm=0,lastTs=0,scr=null,uiLock=0;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k,rr=(a,b)=>a+Math.random()*(b-a),ri=(a,b)=>Math.floor(rr(a,b+1)),pick=a=>a[Math.floor(Math.random()*a.length)];
const fmt$=n=>'$'+(n>=1e6?(n/1e6).toFixed(n%1e6?1:0)+'M':Math.round(n).toLocaleString('en-US'));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
function withCx(g,fn){const m=cx;cx=g;g._c=null;try{fn()}finally{cx=m;if(m)m._c=null}}
function mkc(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;if(fn)withCx(g,()=>fn(w,h,g));return c}
/* tiny pixel text on the canvas (the game's 3x5 font): centred or left */
function ptxt(s,x,y,c,z,al){s=String(s).toUpperCase();z=z||1;const w=s.length*4*z-z;if(al==='c')x-=w/2;else if(al==='r')x-=w;txt(s,Math.round(x),Math.round(y),c,z);return w}
function ptxtS(s,x,y,c,z,al,sc){ptxt(s,x+1,y+1,sc||'#2b1830',z,al);return ptxt(s,x,y,c,z,al)}

/* ---------------- save ---------------- */
const SK='ourstory_racers';
function defSave(){return {v:1,week:1,lg:0,money:0,lv:1,xp:0,sp:0,st:{spd:14,acc:12,sta:9,agi:10,foc:6,cha:15},en:100,mood:75,ap:3,raced:0,gym:1,eq:{},own:['bandana'],wear:{head:null,body:'bandana',paws:null,charm:null},sk:[],bag:{},boss:0,lp:0,rp:0,wins:0,races:0,spon:null,fl:{},best:{},seen:{}}}
let S=defSave();
function load(){try{const o=JSON.parse(localStorage.getItem(SK)||'null');if(o&&o.v===1){S=Object.assign(defSave(),o);S.st=Object.assign(defSave().st,o.st);S.wear=Object.assign(defSave().wear,o.wear)}}catch(e){}}
function save(){try{localStorage.setItem(SK,JSON.stringify(S))}catch(e){}}

/* ---------------- styles ---------------- */
function css(){if($('crzcss'))return;const s=document.createElement('style');s.id='crzcss';const u=n=>U(n);
 const tag='background:radial-gradient(circle at '+u(5.6)+' 50%,#24143c 0 '+u(1.15)+',#e8b84a '+u(1.2)+' '+u(1.85)+',transparent '+u(1.9)+'),linear-gradient(#fff7e8,#fff0d8 calc(100% - '+u(1.1)+'),#d9c2a4 0);clip-path:polygon('+u(4.6)+' 0,100% 0,100% 100%,'+u(4.6)+' 100%,0 50%)';
 s.textContent=`
#crz{position:absolute;inset:0;z-index:70;display:none;background:#0e0828;overflow:hidden;font-family:inherit}
#crz>canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;touch-action:none}
#crzui{position:absolute;inset:0;pointer-events:none;color:#fff6e0;font-size:${u(3.4)};line-height:1.6}
#crzui>*{pointer-events:auto}#crzui .pass{pointer-events:none}
#crz button{font:inherit;color:#5a2148;border:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
#crz .tag{${tag};font-size:${u(3.6)};text-align:left;padding:${u(2.6)} ${u(3)} ${u(3)} ${u(9.5)};line-height:1.5}
#crz .tag:active,#crz .tile:active{filter:brightness(.86)}#crz .tag:disabled{opacity:.45}
#crz .tag.pink{background:radial-gradient(circle at ${u(5.6)} 50%,#24143c 0 ${u(1.15)},#e8b84a ${u(1.2)} ${u(1.85)},transparent ${u(1.9)}),linear-gradient(#ffd6e8,#ffbcd8 calc(100% - ${u(1.1)}),#d98aae 0)}
#crz .tag small,#crz .tile small{display:block;font-size:${u(2.5)};opacity:.75;margin-top:${u(.8)}}
#crz .top{position:absolute;left:0;right:0;top:0;padding:${u(2.4)} ${u(3)} ${u(1.6)};background:linear-gradient(rgba(14,8,40,.92),rgba(14,8,40,.78));display:flex;flex-direction:column;gap:${u(1.4)};font-size:${u(2.7)}}
#crz .top .r1{display:flex;justify-content:space-between;align-items:center}
#crz .top .lg{color:#ffd86b}#crz .top .mo{color:#8be28b;font-size:${u(3.4)}}
#crz .meters{display:grid;grid-template-columns:1fr 1fr 1fr;gap:${u(2)}}
#crz .mtr{font-size:${u(2.2)};color:#cdb8e8}#crz .mtr i{display:block;height:${u(2)};margin-top:${u(.6)};background:#2b1830;box-shadow:inset 0 0 0 ${u(.4)} #4a3a6a;position:relative}
#crz .mtr i b{position:absolute;left:${u(.4)};top:${u(.4)};bottom:${u(.4)};background:var(--c);transition:width .4s}
#crz .xbtn{position:absolute;font-size:${u(2.6)};padding:${u(1.6)} ${u(2.6)};background:rgba(255,246,224,.12);color:#fff6e0;border-radius:${u(2)}}
#crz .dock{position:absolute;left:${u(3)};right:${u(3)};bottom:${u(3)};display:grid;grid-template-columns:1fr 1fr;gap:${u(2.6)}}
#crz .tile{background:#fff6e0;color:#5a2148;border-radius:${u(2)};padding:${u(2.4)} ${u(2.4)} ${u(2.6)};box-shadow:0 ${u(1.1)} 0 #c9a98a,${u(.8)} ${u(1.8)} 0 rgba(10,4,30,.5);text-align:left;font-size:${u(3.3)};position:relative;line-height:1.4}
#crz .tile.big{grid-column:1/3;background:#ffd86b;box-shadow:0 ${u(1.1)} 0 #c2417a,${u(.8)} ${u(1.8)} 0 rgba(10,4,30,.5);font-size:${u(4.2)}}
#crz .tile .bdg{position:absolute;right:${u(1.6)};top:${u(-1.6)};background:#e0468c;color:#fff;font-size:${u(2.3)};padding:${u(.8)} ${u(1.4)};border-radius:${u(2)}}
#crz .tile:disabled{opacity:.5}
#crz .aps{display:flex;gap:${u(1.4)};align-items:center;font-size:${u(2.3)};color:#cdb8e8}
#crz .pan{position:absolute;inset:0;background:rgba(14,8,40,.96);display:flex;flex-direction:column;padding:${u(8)} ${u(5)} ${u(5)};gap:${u(2.6)};overflow-y:auto;text-align:center}
#crz .pan h2{font-size:${u(6)};font-weight:400;color:#ffd86b;text-shadow:${u(.7)} ${u(.7)} 0 #c2417a;margin-bottom:${u(1)}}
#crz .pan .sub{font-size:${u(2.6)};color:#cdb8e8;line-height:1.8}
#crz .pan .hd{font-size:${u(2.6)};color:#ff9ccb;margin-top:${u(2)};text-align:left}
#crz .row{display:flex;gap:${u(2)};justify-content:center;flex-wrap:wrap}
#crz .chip{font-size:${u(2.6)};padding:${u(1.6)} ${u(2.4)};background:rgba(255,246,224,.12);color:#fff6e0;border-radius:${u(2)}}
#crz .chip.on{background:#ffd86b;color:#5a2148}
#crz .card{background:#fff6e0;color:#5a2148;border-radius:${u(2)};padding:${u(2.4)} ${u(2.6)};text-align:left;font-size:${u(3)};line-height:1.55;box-shadow:0 ${u(1)} 0 #c9a98a;display:flex;gap:${u(2.4)};align-items:center}
#crz .card .ic{flex:none;width:${u(14)};height:${u(14)};image-rendering:pixelated}
#crz .card .bd{flex:1;min-width:0}#crz .card small{display:block;font-size:${u(2.3)};opacity:.78;margin-top:${u(.6)}}
#crz .card .go{flex:none;font-size:${u(2.6)};padding:${u(1.6)} ${u(2)};background:#c2417a;color:#fff;border-radius:${u(1.6)}}
#crz .card .go:disabled{background:#a99;opacity:.7}
#crz .card.dim{opacity:.55}#crz .card.boss{background:#ffe9a8;box-shadow:0 ${u(1)} 0 #c2417a}
#crz .back{margin-top:${u(2)};align-self:center;width:${u(80)}}
#crz .dlg{position:absolute;left:${u(4)};right:${u(4)};bottom:${u(5)};background:#fff;border:${u(.9)} solid #2b1830;box-shadow:${u(1)} ${u(1.6)} 0 rgba(10,4,30,.45);border-radius:${u(6)};padding:${u(4)} ${u(5)};color:#2b1830;font-size:${u(3.8)};line-height:1.7;min-height:${u(30)}}
#crz .dlg .nm{font-size:${u(3.2)};margin-bottom:${u(1.2)}}
#crz .dlg .nx{position:absolute;right:${u(4)};bottom:${u(2.4)};font-size:${u(2.6)};color:#e0468c;animation:zbob .8s ease-in-out infinite}
@keyframes zbob{50%{transform:translateY(${u(-1)})}}
#crz .dlg .chs{display:flex;flex-direction:column;gap:${u(2)};margin-top:${u(2.6)}}
#crz .dlg .chs button{font-size:${u(3)};text-align:left;padding:${u(2)} ${u(3)};background:#ffe0ee;border-radius:${u(2)};box-shadow:0 ${u(.8)} 0 #d98aae}
#crz .toast{position:absolute;left:50%;top:${u(34)};transform:translateX(-50%);background:#2b1830;color:#ffd86b;border:${u(.6)} solid #ffd86b;padding:${u(2)} ${u(3.4)};font-size:${u(2.8)};border-radius:${u(2)};white-space:nowrap;animation:ztoast 2.2s both;pointer-events:none}
@keyframes ztoast{0%{opacity:0;transform:translate(-50%,${u(3)})}10%,80%{opacity:1;transform:translate(-50%,0)}100%{opacity:0}}
#crz .res{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${u(2.6)};background:radial-gradient(circle at 50% 38%,rgba(70,36,110,.92),rgba(14,8,40,.97));padding:${u(6)};text-align:center}
#crz .res h2{font-size:${u(8)};font-weight:400;color:#ffd86b;text-shadow:${u(.8)} ${u(.8)} 0 #c2417a;animation:zin .5s cubic-bezier(.2,.9,.3,1.3) both}
#crz .res .rn{font-size:${u(2.6)};color:#cdb8e8}
#crz .res .st{display:flex;gap:${u(2.6)}}#crz .res .st svg{width:${u(13)};height:${u(13)};animation:zpop .45s cubic-bezier(.2,1.6,.4,1) both}
#crz .res .ln{font-size:${u(3)};color:#fff6e0;line-height:1.9}#crz .res .ln b{color:#8be28b;font-weight:400}#crz .res .ln em{color:#ffd86b;font-style:normal}
#crz .res .news{background:#efe4c8;color:#2a2018;padding:${u(2)} ${u(3)};font-size:${u(2.4)};line-height:1.7;transform:rotate(-1.2deg);box-shadow:${u(.8)} ${u(1.2)} 0 rgba(0,0,0,.4);max-width:${u(130)}}
#crz .res .news b{display:block;font-size:${u(2)};color:#a0302a;font-weight:400}
#crz .res .btns{display:flex;flex-direction:column;gap:${u(2.6)};margin-top:${u(2)}}#crz .res .btns .tag{width:${u(96)}}
@keyframes zin{0%{opacity:0;transform:scale(.6)}100%{opacity:1;transform:none}}@keyframes zpop{0%{opacity:0;transform:scale(0) rotate(-40deg)}100%{opacity:1;transform:none}}
#crz .fadein{animation:zfade .35s both}@keyframes zfade{0%{opacity:0}}
#crz .tree{display:grid;grid-template-columns:1fr 1fr 1fr;gap:${u(2)}}
#crz .tree .col{display:flex;flex-direction:column;gap:${u(2)}}
#crz .tree .tn{font-size:${u(2.4)};color:var(--c);margin-bottom:${u(.6)}}
#crz .sk{font-size:${u(2.2)};line-height:1.45;padding:${u(1.8)} ${u(1.2)};background:rgba(255,246,224,.1);color:#cdb8e8;border-radius:${u(1.6)};box-shadow:inset 0 0 0 ${u(.5)} rgba(255,246,224,.15);min-height:${u(15)}}
#crz .sk.own{background:var(--c);color:#2b1830;box-shadow:none}#crz .sk.can{color:#fff6e0;box-shadow:inset 0 0 0 ${u(.6)} var(--c)}
#crz .sk b{display:block;font-weight:400;font-size:${u(1.9)};opacity:.8;margin-top:${u(.6)}}
#crz .stats{display:grid;grid-template-columns:1fr 1fr;gap:${u(1.4)} ${u(3)};text-align:left;font-size:${u(2.5)}}
#crz .stats span i{display:block;height:${u(1.6)};background:#2b1830;margin-top:${u(.5)};position:relative}#crz .stats span i b{position:absolute;inset:0 auto 0 0;background:var(--c)}#crz .stats span i s{position:absolute;top:0;bottom:0;background:#8be28b;opacity:.9}
`;document.head.appendChild(s)}

/* ---------------- screen + loop ---------------- */
function mount(){if(root)return;css();root=document.createElement('div');root.id='crz';root.innerHTML='<canvas></canvas><div id="crzui"></div>';$('g').appendChild(root);dcv=root.firstChild;dctx=dcv.getContext('2d');ui=$('crzui');
 const gp=e=>{const R=dcv.getBoundingClientRect();return [(e.clientX-R.left)/R.width*BW,(e.clientY-R.top)/R.height*BH]};
 dcv.addEventListener('pointerdown',e=>{e.preventDefault();const [x,y]=gp(e);IN.down=1;IN.x0=IN.x=x;IN.y0=IN.y=y;IN.t0=tm;IN.sw=0;IN.id=e.pointerId;try{dcv.setPointerCapture(e.pointerId)}catch(_){}if(scr&&scr.down)scr.down(x,y)});
 dcv.addEventListener('pointermove',e=>{if(!IN.down||e.pointerId!==IN.id)return;const [x,y]=gp(e);IN.x=x;IN.y=y;if(!IN.sw){const dy=y-IN.y0,dxx=x-IN.x0;if(Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dxx)*1.1){IN.sw=dy<0?'u':'d';scr&&scr.swipe&&scr.swipe(IN.sw)}else if(Math.abs(dxx)>10&&Math.abs(dxx)>Math.abs(dy)*1.3){IN.sw=dxx<0?'l':'r';scr&&scr.swipe&&scr.swipe(IN.sw)}}});
 const up=e=>{if(!IN.down||e.pointerId!==IN.id)return;IN.down=0;const [x,y]=gp(e);if(!IN.sw&&tm-IN.t0<.3&&scr&&scr.tap)scr.tap(IN.x0,IN.y0);if(scr&&scr.up)scr.up(x,y)};
 dcv.addEventListener('pointerup',up);dcv.addEventListener('pointercancel',up);
 addEventListener('keydown',e=>{if(!on||e.repeat)return;const k=e.key;if(k===' '){IN.down=1;IN.t0=tm;scr&&scr.down&&scr.down(80,140)}else if(k==='ArrowUp')scr&&scr.swipe&&scr.swipe('u');else if(k==='ArrowDown')scr&&scr.swipe&&scr.swipe('d');else if(k==='ArrowLeft')scr&&scr.swipe&&scr.swipe('l');else if(k==='ArrowRight')scr&&scr.swipe&&scr.swipe('r')});
 addEventListener('keyup',e=>{if(!on)return;if(e.key===' '){IN.down=0;if(tm-IN.t0<.3&&scr&&scr.tap)scr.tap(80,140);scr&&scr.up&&scr.up(80,140)}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&on&&scr&&scr.pause)scr.pause()})}
const IN={down:0,x0:0,y0:0,x:0,y:0,t0:0,sw:0,id:null};
function go(s){if(scr&&scr.exit)scr.exit();scr=s;IN.down=0;ui.innerHTML='';if(s.enter)s.enter();if(s.ui)s.ui()}
function frame(ts){if(!on)return;let dt=(ts-lastTs)/1000||0;lastTs=ts;dt=Math.min(dt,.05);tm+=dt;
 try{if(scr&&scr.upd)scr.upd(dt);withCx(bg,()=>{if(scr&&scr.draw)scr.draw(tm)})}catch(e){console.error(e)}
 const w=BW*(typeof DS!=='undefined'?DS:4);if(dcv.width!==w){dcv.width=w;dcv.height=BH*w/BW}dctx.imageSmoothingEnabled=false;dctx.drawImage(buf,0,0,dcv.width,dcv.height);
 try{if(typeof AU!=='undefined'){AU.want=mus()}}catch(e){}requestAnimationFrame(frame)}
let MUS='crzHub';function mus(){return MUS}
function snd(n,a){try{sfx(n,a)}catch(e){}}
function toast(s){const d=document.createElement('div');d.className='toast';d.innerHTML=s;ui.appendChild(d);setTimeout(()=>d.remove(),2300)}
function el(h){const d=document.createElement('div');d.innerHTML=h.trim();return d.firstChild}
function open(){mount();load();on=1;root.style.display='block';$('chap').style.display='none';lastTs=performance.now();requestAnimationFrame(frame);
 try{if(AU.ctx&&AU.ctx.state!=='running')AU.ctx.resume()}catch(e){}
 if(!S.seen.intro){S.seen.intro=1;save();storyIntro()}else hub()}
function close(){on=0;if(scr&&scr.exit)scr.exit();scr=null;root.style.display='none';ui.innerHTML='';try{AU.want=null}catch(e){}save();try{openMini()}catch(e){}}

/* ---------------- music ---------------- */
(()=>{if(typeof AMS==='undefined')return;
 AMS.crzHub={bpm:116,sw:.18,vol:.5,dly:.4,chords:['C','Am','F','G','C','Am','Dm','G','F','G','Em','Am','F','G','C','C'],
  lines:[{i:'pluck',v:.32,n:['E5 . G5 . C6 - G5 .','A5 - G5 - E5 - . .','F5 . A5 . C6 - A5 .','G5 - - - D5 - . .','E5 . G5 . C6 - E6 .','D6 - C6 - A5 - . .','F5 - A5 - D6 - C6 -','B5 - - - G5 - . .',
   'A5 - C6 - F6 - E6 -','D6 - B5 - G5 - . .','G5 - B5 - E6 - D6 -','C6 - A5 - E5 - . .','F5 - A5 - C6 - A5 -','B5 - D6 - G6 - F6 -','E6 - - - C6 - G5 -','C6 - - - . . . .']}],
  bass:{i:'upright',v:.2,o:2,p:['R...5...R...5.R.']},pad:{i:'pad',v:.055,o:4},
  drums:[{v:.75,p:['k.......k..k....']},{v:.55,p:['....c.......c...']},{v:.4,p:['h.h.h.h.h.h.h.h.']}]};
 AMS.crzRace={bpm:152,vol:.46,dly:.3,chords:['Em','C','G','D','Em','C','G','B','C','D','Bm','Em','C','D','B','B'],
  lines:[{i:'hero',v:.44,n:['E5 . E5 . G5 . B5 .','C6 - B5 - G5 - E5 -','D5 . D5 . G5 . B5 .','A5 - - - F#5 - D5 -','E5 . E5 . G5 . B5 .','E6 - D6 - C6 - B5 -','D6 - B5 - G5 - B5 -','D#6 - - - B5 - . .',
   'C6 - E6 - G6 - E6 -','D6 - F#6 - A6 - F#6 -','B5 - D6 - F#6 - D6 -','E6 - - - B5 - G5 -','C6 - - - E6 - - -','D6 - - - F#6 - - -','D#6 - F#6 - B5 - A5 -','F#5 - D#5 - B4 - . .']}],
  arp:{i:'arp',v:.1,o:4,mode:'up'},bass:{i:'bsq',v:.17,o:2,p:['R.R.8.R.R.R.8.R.']},
  drums:[{v:.9,p:['k...k...k...k...']},{v:.65,p:['....s.......s...'],bars:{7:'....s...s.s.ssss',15:'....s...ssssssss'}},{v:.5,p:['h.h.h.h.h.h.h.h.']},{v:1,p:[null],bars:{0:'x...............',8:'x...............'}}]};
})();
/* ---------------- data ---------------- */
const STATS=[['spd','Speed','#ff7e7e'],['acc','Acceleration','#ffb86b'],['sta','Stamina','#8be28b'],['agi','Agility','#7ee8fa'],['foc','Focus','#b78cff'],['cha','Charm','#ff9ccb']];
const SN={};STATS.forEach(s=>SN[s[0]]=s);
/* coats: b base, l light, d dark, w white, k saddle (tri/sable), f fluffy */
const COATS={
 red:{b:'#e0903a',l:'#eaa456',d:'#b8682a',w:'#fbf6ec'},
 cream:{b:'#f0cf98',l:'#f8e2b8',d:'#c89f6a',w:'#fffaf0'},
 tri:{b:'#c8823e',l:'#d89a58',d:'#8a5426',w:'#fbf6ec',k:'#2a2228'},
 sable:{b:'#b8743e',l:'#c88a50',d:'#7a4a28',w:'#f6efe2',k:'#5a3a26'},
 fawn:{b:'#e6b070',l:'#f0c488',d:'#b8844a',w:'#fbf6ec'},
 blk:{b:'#b8682e',l:'#c87a3a',d:'#7a4220',w:'#f6efe2',k:'#1e1a22'},
 merle:{b:'#8e9cb2',l:'#a8b4c6',d:'#5a6478',w:'#f2f2f4',k:'#3a4050',m:1},
 deep:{b:'#cc6a28',l:'#dc8240',d:'#94481a',w:'#fbf6ec'},
 shiba:{b:'#e88a3a',l:'#f0a050',d:'#b0601e',w:'#fff6e8'},
 fluff:{b:'#e8a050',l:'#f4bc70',d:'#b87430',w:'#fffaf2',f:1}};
const RIVN=['Nugget','Waffles','Pretzel','Bean','Tater Tot','Mochi','Pickles','Noodle','Butters','Ziggy','Peaches','Toast','Meatball','Sprout','Cheddar','Gizmo','Pumpkin','Olive','Rocket','Taco','Bagel','Scout','Penny','Ruckus','Muffin','Dumpling','Kiwi','Hamlet','Juno','Bao'];
const RCOATS=['red','cream','tri','sable','fawn','blk','red','deep','fluff'];
const RGEAR=[null,null,{body:'bandB'},{body:'bandG'},{head:'sweat'},{body:'silkB'},{head:'cap'},{paws:'boot'},{body:'bandY'}];

/* leagues */
const LG=[
 {n:'Amateur League',s:'AMATEUR',c:'#8be28b',r:[9,20],purse:100,boss$:250,xp:40,lp:[3,2,1],gear:0,
  ev:['park','market','brewery','funrun'],boss:[['biscuit','park',2],['waddles','funrun',6]]},
 {n:'Minor League',s:'MINOR',c:'#7ee8fa',r:[24,40],purse:500,boss$:1200,xp:80,lp:[3,2,1],gear:1,
  ev:['ballpark','fair','college','boardwalk'],boss:[['tina','fair',3],['loaf','ballpark',7],['pepper','boardwalk',11]]},
 {n:'Major League',s:'MAJOR',c:'#ffd86b',r:[44,64],purse:3000,boss$:7500,xp:140,lp:[3,2,1],gear:2,
  ev:['nfl','kc','showcase','vegas'],boss:[['chad','nfl',3],['duchess','vegas',7],['comet','kc',11]]},
 {n:'Global Rankings',s:'GLOBAL',c:'#ff9ccb',r:[64,86],purse:12000,boss$:30000,xp:220,lp:[3,2,1],gear:3,
  ev:['london','tokyo','paris','sydney'],boss:[['kenji','tokyo',40],['baguette','paris',25],['matilda','sydney',12],['fluff','final',8]]}];

/* venues: sky, backdrop, ground, obstacle mix, distractions */
const VEN={
 park:{n:'Riverside Dog Park',sky:'day',bg:'park',gr:'grass',len:1700,o:['puddle','cone','log'],d:['squirrel','ball'],du:['branch']},
 market:{n:'Saturday Farmers’ Market',sky:'day',bg:'market',gr:'dirt',len:1800,o:['crate','puddle','cone'],d:['hotdog','pigeon'],du:['bunting']},
 brewery:{n:'Brewery Lawn Dash',sky:'dusk',bg:'brewery',gr:'grass',len:1800,o:['barrel','cone','puddle'],d:['pretzel','ball'],du:['lights']},
 funrun:{n:'Charity Fun Run',sky:'day',bg:'funrun',gr:'road',len:2000,o:['cone','hay','puddle'],d:['kid','squirrel'],du:['banner']},
 ballpark:{n:'7th Inning Stretch',sky:'dusk',bg:'ballpark',gr:'dirt',len:2200,o:['base','cone','bat'],d:['hotdog','mascot'],du:['banner']},
 fair:{n:'County Fair Derby',sky:'day',bg:'fair',gr:'dirt',len:2300,o:['hay','barrel','puddle'],d:['corndog','chicken'],du:['bunting']},
 college:{n:'College Halftime',sky:'night',bg:'college',gr:'turf',len:2300,o:['tackle','cone','hurdle'],d:['mascot','popcorn'],du:['tshirt']},
 boardwalk:{n:'Boardwalk Sprint',sky:'sunny',bg:'boardwalk',gr:'boards',len:2400,o:['crate','sandcastle','cone'],d:['seagull','corndog'],du:['bunting']},
 nfl:{n:'NFL Halftime Show',sky:'night',bg:'nfl',gr:'turf',len:2600,o:['tackle','hurdle','football'],d:['mascot','popcorn'],du:['tshirt']},
 kc:{n:'KC Corgi Classic',sky:'dusk',bg:'kc',gr:'track',len:2800,o:['hurdle','hay','cone'],d:['bbq','squirrel'],du:['banner']},
 showcase:{n:'Doubles Relay Showcase',sky:'night',bg:'showcase',gr:'track',len:2600,o:['hurdle','cone','tire'],d:['popcorn','ball'],du:['lights'],relay:1},
 vegas:{n:'Vegas Strip Stakes',sky:'night',bg:'vegas',gr:'track',len:2800,o:['chips','hurdle','cone'],d:['popcorn','cat'],du:['lights']},
 london:{n:'London Royal Mile',sky:'grey',bg:'london',gr:'track',len:2900,o:['hurdle','puddle','teacup'],d:['pigeon','squirrel'],du:['bunting']},
 tokyo:{n:'Tokyo Night Dash',sky:'night',bg:'tokyo',gr:'track',len:3000,o:['hurdle','cone','lantern'],d:['sushi','cat'],du:['lights']},
 paris:{n:'Paris Grand Prix',sky:'dusk',bg:'paris',gr:'cobble',len:3000,o:['hurdle','puddle','cone'],d:['croissant','pigeon'],du:['bunting']},
 sydney:{n:'Bondi Beach Run',sky:'sunny',bg:'sydney',gr:'sand',len:3000,o:['sandcastle','hurdle','surf'],d:['seagull','ball'],du:['banner']},
 final:{n:'World Final · Newcastle',sky:'final',bg:'final',gr:'track',len:3400,o:['hurdle','puddle','cone','hay'],d:['pigeon','squirrel','popcorn'],du:['banner','bunting']}};

/* bosses */
const BOSS={
 biscuit:{n:'Biscuit',coat:'cream',gear:{body:'bowP'},sz:.85,st:[22,26,18,16,14,30],h:'Kayleigh (age 9)',hc:'#ff7eb6',trait:'none',
  t:'She is SO fast. She ate a whole sock once and she was STILL fast.',w:'Biscuit is the cutest racer in the park. And the hungriest.',drop:'ball'},
 waddles:{n:'Sir Waddles III',coat:'tri',gear:{head:'tophat'},st:[30,18,34,22,26,28],h:'Reginald',hc:'#8a6a3a',trait:'closer',
  t:'Sir Waddles comes from a long line of champions. His grandfather once finished a race.',w:'Slow starter. Saves everything for the finish.',drop:'monocle'},
 tina:{n:'Turbo Tina',coat:'red',gear:{head:'goggles',body:'silkR'},st:[46,62,30,38,34,36],h:'Dale',hc:'#5a7a4a',trait:'rocket',
  t:'Tina’s gonna be gone before your pup finishes sniffing the start line.',w:'Explosive start. Fades if you stay close.',drop:'tinag'},
 loaf:{n:'The Loaf',coat:'fawn',gear:{body:'sweater'},sz:1.18,st:[44,34,62,30,46,40],h:'Big Mike',hc:'#3a4a6b',trait:'tank',
  t:'Everybody laughs at The Loaf. Then The Loaf passes them.',w:'Huge stamina. Never slows down.',drop:'sweater'},
 pepper:{n:'Pepper',coat:'blk',gear:{paws:'bootR'},sz:.8,st:[50,52,40,64,48,38],h:'Rosa',hc:'#e0468c',trait:'nimble',
  t:'Pepper is little. Pepper is angry. Pepper has never hit a cone in her life.',w:'Never stumbles. Darts through everything.',drop:'pepb'},
 chad:{n:'Chad Barkley',coat:'sable',gear:{head:'sweat',body:'jersey'},st:[66,62,58,56,50,40],h:'Brock',hc:'#2a6ad8',trait:'taunt',
  t:'Bro. Chad has never lost a staring contest. Your dog blinked like six times already.',w:'Trash talker. Barks to break your focus mid-race.',drop:'chadb'},
 duchess:{n:'Duchess',coat:'merle',gear:{head:'tiara'},st:[68,64,66,62,72,80],h:'Lady Penelope',hc:'#7a2fe0',trait:'perfect',
  t:'Duchess does not race, darling. She simply arrives first.',w:'Flawless form. Never distracted.',drop:'tiaraD'},
 comet:{n:'Kansas City Comet',coat:'deep',gear:{body:'starcape'},st:[74,60,70,60,58,60],h:'Coach Ray',hc:'#c23a2a',trait:'surge',
  t:'The Comet doesn’t lose at home. Not in front of these people.',w:'Huge surge in the final stretch.',drop:'starcape'},
 kenji:{n:'Kenji',coat:'shiba',gear:{head:'hband'},st:[80,78,74,84,86,62],h:'Sato-san',hc:'#d8352f',trait:'perfect',
  t:'Kenji has trained on these streets for six years. He knows every crack.',w:'Perfect jumps. Perfect focus.',drop:'hband'},
 baguette:{n:'Le Baguette',coat:'cream',gear:{head:'beret',body:'stripe'},st:[86,82,70,72,60,84],h:'Jacques',hc:'#2a4aa8',trait:'snack',
  t:'Le Baguette is ze fastest dog in all of France. When he is not eating.',w:'Blistering speed. Stops for croissants.',drop:'beret'},
 matilda:{n:'Matilda',coat:'sable',gear:{head:'akubra'},st:[84,80,88,82,78,70],h:'Shazza',hc:'#b8843a',trait:'sand',
  t:'Bondi’s her backyard, mate. She’s never lost on sand. Not once.',w:'Sand doesn’t slow her down at all.',drop:'akubra'},
 fluff:{n:'Lord Fluffington',coat:'fluff',gear:{head:'crown',body:'royal'},st:[94,90,92,90,94,96],h:'Sir Nigel Pomfrey',hc:'#7a2fe0',trait:'royal',
  t:'A park dog. How quaint. Lord Fluffington has not lost in four years.',w:'Undefeated world champion. The Royal Surge.',drop:'crown'}};

/* gear: slot, league tier, price, bonuses, look */
const GEAR={
 bandana:{n:'Red Bandana',sl:'body',t:0,p:0,b:{cha:2},lk:'bandR'},
 sweat:{n:'Sweatband',sl:'head',t:0,p:60,b:{foc:3},lk:'sweat'},
 goggles:{n:'Racing Goggles',sl:'head',t:0,p:140,b:{spd:3,foc:1},lk:'goggles'},
 silks:{n:'Racing Silks',sl:'body',t:0,p:160,b:{spd:2,sta:3},lk:'silkP'},
 booties:{n:'Racing Booties',sl:'paws',t:0,p:90,b:{agi:3},lk:'boot'},
 sausage:{n:'Lucky Sausage Roll',sl:'charm',t:0,p:70,b:{sta:3},ic:'sausage'},
 visor:{n:'Sun Visor',sl:'head',t:1,p:450,b:{cha:4,foc:2},lk:'visor'},
 helmet:{n:'Tiny Helmet',sl:'head',t:1,p:800,b:{agi:5,foc:2},lk:'helmet'},
 cape:{n:'Superhero Cape',sl:'body',t:1,p:650,b:{cha:6,spd:2},lk:'capeR'},
 harness:{n:'Pink Harness',sl:'body',t:1,p:950,b:{sta:6,agi:2},lk:'harn'},
 sandb:{n:'Sand Boots',sl:'paws',t:1,p:550,b:{agi:2},sand:1,lk:'bootS'},
 clover:{n:'Four-Leaf Clover',sl:'charm',t:1,p:800,b:{foc:5},ic:'clover'},
 aviator:{n:'Aviator Goggles',sl:'head',t:2,p:2600,b:{spd:6,foc:3},lk:'aviator'},
 tiara:{n:'Sparkle Tiara',sl:'head',t:2,p:4200,b:{cha:12},lk:'tiara'},
 spikes:{n:'Spike Booties',sl:'paws',t:2,p:3200,b:{acc:6,agi:3},lk:'bootK'},
 scape:{n:'Star Cape',sl:'body',t:2,p:5200,b:{spd:5,cha:6},lk:'starcape'},
 ggog:{n:'Gold Goggles',sl:'head',t:3,p:14000,b:{spd:10,foc:4},lk:'ggog'},
 rsilk:{n:'Royal Silks',sl:'body',t:3,p:21000,b:{spd:8,sta:8},lk:'silkG'},
 gboot:{n:'Gold Booties',sl:'paws',t:3,p:16000,b:{acc:9,agi:6},lk:'bootG'},
 gbone:{n:'Golden Bone',sl:'charm',t:3,p:19000,b:{spd:3,acc:3,sta:3,agi:3,foc:3,cha:3},ic:'gbone'},
 /* sponsor and story items */
 pupband:{n:'Pup-Cup Bandana',sl:'body',t:9,p:0,b:{cha:3},lk:'bandW'},
 neon:{n:'Zoomies Neon Suit',sl:'body',t:9,p:0,b:{spd:3,cha:-2},lk:'neon'},
 kibband:{n:'Royal Kibble Scarf',sl:'body',t:9,p:0,b:{sta:4,cha:3},lk:'bandB'},
 couture:{n:'Couture Capelet',sl:'body',t:9,p:0,b:{cha:8,spd:4},lk:'capeP'},
 chew:{n:'Crumpet’s Chew Toy',sl:'charm',t:9,p:0,b:{foc:4,sta:2},ic:'chew'},
 bracelet:{n:'Abigail’s Bracelet',sl:'charm',t:9,p:0,b:{spd:2,acc:2,sta:2,agi:2,foc:2,cha:2},ic:'bracelet'},
 /* boss trophies */
 ball:{n:'Biscuit’s Tennis Ball',sl:'charm',t:9,p:0,b:{acc:3,foc:1},ic:'ball',boss:1},
 monocle:{n:'Sir Waddles’ Monocle',sl:'head',t:9,p:0,b:{foc:6,cha:4},lk:'monocle',boss:1},
 tinag:{n:'Tina’s Turbo Goggles',sl:'head',t:9,p:0,b:{acc:8,spd:2},lk:'goggles',boss:1},
 sweater:{n:'The Loaf’s Sweater',sl:'body',t:9,p:0,b:{sta:9},lk:'sweater',boss:1},
 pepb:{n:'Pepper’s Booties',sl:'paws',t:9,p:0,b:{agi:9},lk:'bootR',boss:1},
 chadb:{n:'Chad’s Headband',sl:'head',t:9,p:0,b:{acc:6,cha:4},lk:'sweatB',boss:1},
 tiaraD:{n:'Duchess’s Tiara',sl:'head',t:9,p:0,b:{cha:12,foc:5},lk:'tiara',boss:1},
 starcape:{n:'Comet’s Star Cape',sl:'body',t:9,p:0,b:{spd:9,cha:5},lk:'starcape',boss:1},
 hband:{n:'Kenji’s Headband',sl:'head',t:9,p:0,b:{foc:10,agi:5},lk:'hband',boss:1},
 beret:{n:'Le Baguette’s Beret',sl:'head',t:9,p:0,b:{spd:6,cha:8},lk:'beret',boss:1},
 akubra:{n:'Matilda’s Hat',sl:'head',t:9,p:0,b:{sta:8,agi:5},sand:1,lk:'akubra',boss:1},
 crown:{n:'The Champion’s Crown',sl:'head',t:9,p:0,b:{spd:6,acc:6,sta:6,agi:6,foc:6,cha:6},lk:'crown',boss:1}};
const SLOTS=[['head','Head'],['body','Body'],['paws','Paws'],['charm','Charm']];

/* training equipment, three tiers per stat */
const EQ={spd:['Treadmill','Pro Treadmill','Turbo Treadmill'],acc:['Ball Launcher','Sled Pull','Starting Blocks'],sta:['Kiddie Pool','Lap Pool','Hydro Treadmill'],
 agi:['Cone Set','Weave Poles','Agility Course'],foc:['Squirrel Plush','Meditation Mat','Distract-O-Tron'],cha:['Mirror','Ring Light','Photo Studio']};
const EQP=[80,900,7000],EQG=[1,2,4],EQM=[1,1.35,1.75,2.2];
const GYM=[null,{n:'The Backyard',p:0,m:1,d:'A tire, some cones and a lot of heart.'},{n:'Garage Gym',p:400,m:1.25,d:'Rubber mats and a space heater. Very official.'},
 {n:'Gus’s Gym',p:2500,m:1.55,d:'Coach Gus’s old gym. Smells like champions.'},{n:'Pro Facility',p:15000,m:1.9,d:'Indoor track, real lights, +1 action every week.'},
 {n:'The Donut Dome',p:60000,m:2.3,d:'A dome. With a giant donut on top. Obviously.'}];

/* training games */
const TR=[['spd','Treadmill Tempo','Tap on the beat'],['acc','Fetch Sprint','Go the instant the ball flies'],['sta','Pool Laps','Paddle left, right, left, right'],
 ['agi','Weave Poles','Weave through every pole'],['foc','Squirrel Watch','Tap treats. Ignore squirrels.'],['cha','Photo Shoot','Strike the right pose']];

/* shop treats */
const TREAT={pupcup:{n:'Pup Cup',p:12,d:'+25 Mood',f:()=>{S.mood=clamp(S.mood+25,0,100)}},
 bone:{n:'Energy Bone',p:30,d:'+35 Energy',f:()=>{S.en=clamp(S.en+35,0,100)}},
 pb:{n:'Peanut Butter Spoon',p:25,d:'+8 Focus in your next race',buff:{foc:8}},
 sroll:{n:'Sausage Roll',p:40,d:'+10 Stamina in your next race',buff:{sta:10}},
 steak:{n:'Steak Bites',p:300,d:'+6 Speed in your next race',buff:{spd:6},t:1},
 honey:{n:'Honey Biscuit',p:1500,d:'+6 to every stat next race',buff:{spd:6,acc:6,sta:6,agi:6,foc:6,cha:6},t:2}};

/* skill trees */
const SKT=[['Sprinter','#ff7e7e',[['quick','Quick Feet','Accelerate 15% faster',1],['rocket','Rocket Start','Perfect starts launch twice as hard',1],['wind','Second Wind','Once a race, an empty tank refills halfway',2],['after','Afterburner','+6% top speed in the final stretch',2],['turbo','Turbo Zoomies','Zoomies last twice as long and hit harder',3]]],
 ['Tactician','#7ee8fa',[['light','Light Paws','Wider jump window, fewer clipped hurdles',1],['pacer','Pacer','Sprinting uses 20% less stamina',1],['iron','Iron Focus','Ignore distractions 40% faster',2],['draft','Draft Slip','+7% speed tucked in behind a rival',2],['shake','Shake It Off','Stumbles cost half as much',3]]],
 ['Superstar','#ff9ccb',[['crowd','Crowd Pleaser','Zoomies meter fills 30% faster',1],['fan','Fan Favorite','+20% race winnings',1],['show','Showboat','Perfect jumps give a speed pop',2],['magnet','Sponsor Magnet','+30% sponsor and gig pay',2],['star','Star Power','Zoomies refill stamina and the crowd roar rattles rivals',3]]]];
const hasSk=k=>S.sk.includes(k);

/* sponsors and side gigs */
const SPON={pupcup:{n:'Pup-Cup Treats',pay:40,it:'pupband',lg:0},zoomies:{n:'Zoomies Energy',pay:450,it:'neon',lg:1},kibble:{n:'Royal Kibble',pay:2600,it:'kibband',lg:2},couture:{n:'Corgi Couture',pay:9500,it:'couture',lg:3}};
const GIGS=[[0,'Kid’s birthday party',50,0],[0,'Farmers’ market mascot',90,24],[1,'Pet store grand opening',420,32],[1,'Local TV morning show',750,42],
 [2,'Dog food commercial',3200,52],[2,'Halftime meet & greet',4800,62],[3,'Paris perfume ad',12500,72],[3,'Tokyo café guest star',16000,82]];

/* people in cutscenes */
const NC2={Abigail:'#c2417a',Hunter:'#d8352f','Coach Gus':'#8a5a2a',Buzz:'#e8a020',Vivian:'#7a2fe0',Crumpet:'#e0903a',Donut:'#e0903a','Paws & Effect':'#2a6ad8'};
/* ---------------- racing corgi sprite ----------------
   o: c coat, st run|jump|duck|trip|sit|stand|lie|cheer|swim, ph gait phase, g gear looks, dir, sz, jy, tongue */
const GCOL={bandR:'#d8352f',bandB:'#2a6ad8',bandG:'#3aa84a',bandY:'#e8b820',bandW:'#ff7eb6',silkP:'#e0468c',silkR:'#d8352f',silkB:'#2a6ad8',silkG:'#e8b820',
 capeR:'#d8352f',capeP:'#c2417a',boot:'#2a6ad8',bootR:'#d8352f',bootS:'#c8a060',bootK:'#3a3a4a',bootG:'#ffd040',sweat:'#ff4a6a',sweatB:'#2a6ad8'};
function rdog(x,y,o){const C=typeof o.c==='string'?COATS[o.c]:o.c,st=o.st||'run',g=o.g||{},z=o.sz||1;x=Math.round(x);y=Math.round(y);
 const L=Math.round(18*z),H=z>1?8:z<.9?6:7,f4=st==='run'?((Math.floor(o.ph||0)%4)+4)%4:-1,air=f4===1?1:0,jy=Math.round(o.jy||0);
 const sit=st==='sit',lie=st==='lie',duck=st==='duck'||st==='trip',swim=st==='swim';
 if(!swim)ell(x,y,Math.round(L/2+1),1,'#000',.2*(jy>0?Math.max(.35,1-jy/26):1));
 cx.save();if(o.dir==='l'){cx.translate(2*x+1,0);cx.scale(-1,1)}
 if(o.al!=null)cx.globalAlpha=o.al;
 const lg=duck?2:lie?0:4,yy=y-jy-air-(st==='cheer'?Math.round(Math.abs(Math.sin((o.ph||0)*1.6))*4):0),by=yy-lg;
 const W2=C.w,FL='#e8dccb',boot=g.paws?(GCOL[g.paws]||'#2a6ad8'):null;
 const leg=(lx,ly,h,near)=>{r(lx,ly,2,h,near?W2:FL);if(boot)r(lx,ly+h-1,2,1,near?boot:sh(boot,.8))};
 let hx,hy,bx0=x-Math.round(L/2);
 if(sit){/* sitting: haunch on the ground, chest up */
  r(x-7,yy-6,9,6,C.b);r(x-6,yy-7,7,1,C.b);r(x-6,yy-7,7,1,C.l);r(x-3,yy-11,7,7,C.b);r(x-3,yy-11,7,1,C.l);r(x-8,yy-4,2,4,W2);
  if(C.k){r(x-6,yy-7,6,2,C.k);r(x-3,yy-11,4,2,C.k)}if(C.m){r(x-5,yy-5,2,2,C.k);r(x-1,yy-9,2,1,C.k)}leg(x,yy-4,4,0);leg(x+2,yy-4,4,1);r(x+1,yy-11,3,7,W2);r(x-3,yy-2,4,2,W2);hx=x-1;hy=yy-16}
 else if(lie){r(bx0,yy-5,L,5,C.b);r(bx0,yy-5,L,1,C.l);r(bx0+2,yy-1,L-5,1,W2);r(bx0-1,yy-4,2,3,W2);if(C.k)r(bx0+2,yy-5,L-7,2,C.k);
  r(x+L/2-2,yy-2,5,2,W2);r(x+L/2-1,yy-1,5,1,FL);hx=x+L/2-6;hy=yy-9}
 else if(swim){r(bx0+1,yy-5,L-2,4,C.b);r(bx0+1,yy-5,L-2,1,C.l);if(C.k)r(bx0+3,yy-5,L-8,2,C.k);hx=x+L/2-5;hy=yy-10}
 else{/* standing / running / jumping / ducking */
  const sp=st==='jump'?2:0,rl=[[bx0+2,0,-1],[bx0+4,1,-1],[x+Math.round(L/2)-5,0,1],[x+Math.round(L/2)-3,1,1]];
  rl.forEach(([lx,near,e])=>{let ox=f4===0?e*2:f4===2?-e*2:f4===3?e:0,h=lg;if(st==='jump'){ox=e*2;h=lg-1}if(duck)ox=e;leg(lx+ox,by,h,near)});
  const hh=duck?H-1:H;r(bx0,by-hh,L,hh,C.b);r(bx0,by-hh,L,1,C.l);r(bx0+3,by-2,L-6,2,W2);r(bx0+3,by-2,L-6,1,sh(W2,.94));
  r(bx0-1,by-hh+1,2,hh-2,W2);r(bx0-2,by-hh+2,1,hh-4,W2);/* fluffy butt */
  if(C.k){r(bx0+2,by-hh,L-7,2,C.k);r(bx0+3,by-hh+2,L-10,1,C.k)}
  if(C.m){r(bx0+4,by-hh+2,2,2,C.k);r(x+1,by-hh+3,2,1,C.k);r(bx0+2,by-hh+4,1,2,C.k)}
  if(C.f){r(bx0+4,by,2,1,W2);r(bx0+9,by,2,1,W2);r(bx0-3,by-hh+3,1,3,W2)}
  r(x+Math.round(L/2)-3,by-hh+2,3,hh-2,W2);/* bib */
  hx=x+Math.round(L/2)-4;hy=by-hh-(duck?2:4)}
 /* head, facing right */
 const dk=duck&&!sit;
 r(hx,hy,8,6,C.b);r(hx,hy,8,1,C.l);r(hx+6,hy+3,3,3,W2);r(hx+9,hy+3,1,1,'#2a1a1a');r(hx+3,hy+4,4,2,W2);r(hx+6,hy,1,3,W2);
 if(C.k&&(o.c==='blk'||o.c==='tri'))r(hx,hy,5,2,C.k);
 if(C.f){r(hx-1,hy+3,2,4,W2);r(hx+2,hy+6,5,1,W2)}
 if(st==='trip'){r(hx+4,hy+1,1,1,'#2a1a1a');r(hx+5,hy+2,1,1,'#2a1a1a');r(hx+5,hy+1,1,1,'#2a1a1a');r(hx+4,hy+2,1,1,'#2a1a1a')}
 else if(o.sleep)r(hx+4,hy+2,2,1,'#2a1a1a');else r(hx+5,hy+2,1,1,'#2a1a1a');
 if(dk){r(hx-2,hy+1,3,2,C.b);r(hx-3,hy+1,1,1,C.d)}
 else{const ea=(ex)=>{r(ex+1,hy-4,1,1,C.b);r(ex,hy-3,2,1,C.b);r(ex,hy-2,3,2,C.b);r(ex+1,hy-2,1,2,'#f0a0a0')};ea(hx);ea(hx+3);if(C.f){r(hx-1,hy-2,1,2,W2);r(hx+6,hy-2,1,2,W2)}}
 if(o.tongue||(st==='run'&&!o.nt)||st==='cheer')r(hx+7,hy+6,1,2,'#ff7e9e');
 /* gear */
 const lk=g.body;if(lk&&!sit&&!lie&&!swim){const hh=duck?H-1:H,top=by-hh;
  if(lk.startsWith('band')){const c=GCOL[lk]||'#d8352f',nx=x+Math.round(L/2)-5;r(nx,top+2,5,1,c);r(nx+1,top+3,3,1,c);r(nx+2,top+4,1,1,c);r(nx+1,top+2,1,1,'#fff6e0')}
  else if(lk.startsWith('silk')){const c=GCOL[lk];r(x-5,top,9,4,c);r(x-5,top,9,1,sh(c,1.2));r(x-2,top+1,3,2,'#fff6e0')}
  else if(lk==='harn'){r(x+3,top,2,hh,'#ff7eb6');r(x-3,top+2,8,1,'#ff7eb6');r(x+3,top+1,1,1,'#ffd86b')}
  else if(lk==='neon'){r(bx0,top,L,hh-2,'#b8ff3a');r(bx0,top+2,L,1,'#ff3ad8');r(bx0+2,top+4,L-4,1,'#ff3ad8')}
  else if(lk==='sweater'){r(bx0+1,top,L-3,hh-1,'#c84a5a');r(bx0+1,top+2,L-3,1,'#fff6e0');r(bx0+1,top+4,L-3,1,'#fff6e0')}
  else if(lk==='jersey'){r(bx0+1,top,L-4,hh-2,'#2a6ad8');r(x-2,top+1,3,3,'#fff6e0');r(x-1,top+2,1,1,'#2a6ad8')}
  else if(lk==='stripe'){for(let i=0;i<hh-2;i++)r(bx0+1,top+i,L-4,1,i%2?'#fff6e0':'#1e2a5a')}
  else if(lk==='bowP'){}
  else{/* capes */const c=lk==='starcape'?'#1e2a6a':lk==='royal'?'#6a2aa8':GCOL[lk]||'#d8352f',w=st==='run'?Math.floor((o.ph||0)*1.5)%2:0;
   r(bx0+3,top-1,L-6,3,c);r(bx0,top+w,4,3,c);r(bx0-3,top+1+w,3,2,c);r(x+Math.round(L/2)-4,top-1,2,3,sh(c,.8));
   if(lk==='starcape'){r(x-3,top,1,1,'#ffd86b');r(x-4,top+1,3,1,'#ffd86b');r(bx0+1,top+1+w,1,1,'#ffd86b')}
   if(lk==='royal'){r(bx0+3,top+1,L-6,1,'#fff6e0');r(x-2,top+1,1,1,'#2a1a1a');r(x+2,top+1,1,1,'#2a1a1a');r(bx0-3,top+2+w,3,1,'#ffd86b')}}}
 const hd=g.head;if(hd){const hy2=dk?hy:hy;
  if(hd==='sweat'||hd==='sweatB'){const c=GCOL[hd];r(hx,hy2+1,8,1,c);r(hx+2,hy2+1,1,1,'#fff6e0')}
  else if(hd==='goggles'||hd==='ggog'){r(hx,hy2+1,8,1,hd==='ggog'?'#c89a20':'#3a3a4a');r(hx+4,hy2+1,3,2,'#2a2a3a');r(hx+5,hy2+1,2,1,hd==='ggog'?'#ffb040':'#7ee8fa')}
  else if(hd==='aviator'){r(hx,hy2-1,6,3,'#8a5a2a');r(hx,hy2-1,6,1,'#a87a42');r(hx+4,hy2+1,3,2,'#5a3a1a');r(hx+5,hy2+1,1,1,'#ffd86b')}
  else if(hd==='visor'){r(hx+1,hy2,7,1,'#fff6e0');r(hx+6,hy2+1,4,1,'#2a6ad8')}
  else if(hd==='helmet'){r(hx,hy2-2,7,3,'#e0468c');r(hx+1,hy2-3,5,1,'#e0468c');r(hx+3,hy2-3,1,3,'#fff6e0')}
  else if(hd==='tiara'){r(hx+1,hy2-1,6,1,'#ffd86b');r(hx+2,hy2-2,1,1,'#ffd86b');r(hx+4,hy2-3,1,2,'#ffd86b');r(hx+6,hy2-2,1,1,'#ffd86b');r(hx+4,hy2-1,1,1,'#ff7eb6')}
  else if(hd==='tophat'||hd==='monocle'){if(hd==='tophat'){r(hx+1,hy2-7,5,6,'#1e1a22');r(hx,hy2-1,7,1,'#1e1a22');r(hx+1,hy2-3,5,1,'#a02a3a')}
   r(hx+4,hy2+1,3,1,'#ffd86b');r(hx+4,hy2+3,3,1,'#ffd86b');r(hx+4,hy2+2,1,1,'#ffd86b');r(hx+6,hy2+2,1,1,'#ffd86b');r(hx+5,hy2+4,1,2,'#c8a040')}
  else if(hd==='hband'){r(hx,hy2+1,8,1,'#fff6e0');r(hx+3,hy2+1,2,1,'#d8352f');r(hx-3,hy2+1,3,1,'#fff6e0');r(hx-4,hy2+2,2,1,'#fff6e0')}
  else if(hd==='beret'){r(hx,hy2-2,7,2,'#1e2a5a');r(hx-1,hy2-1,1,1,'#1e2a5a');r(hx+3,hy2-3,1,1,'#1e2a5a')}
  else if(hd==='akubra'){r(hx+1,hy2-4,6,3,'#8a6a3a');r(hx+1,hy2-2,6,1,'#4a3a2a');r(hx-1,hy2-1,10,1,'#6a4a2a')}
  else if(hd==='crown'){r(hx+1,hy2-3,6,3,'#ffd86b');r(hx+1,hy2-4,1,1,'#ffd86b');r(hx+3,hy2-5,2,2,'#ffd86b');r(hx+6,hy2-4,1,1,'#ffd86b');r(hx+3,hy2-2,2,1,'#d8352f');r(hx+1,hy2-1,6,1,'#c89a20')}
  else if(hd==='cap'){r(hx+1,hy2-1,5,2,'#2a6ad8');r(hx+6,hy2,3,1,'#1e4aa8')}}
 if(g.body==='bowP'||o.bow){r(hx+2,hy-2,1,2,'#ff7eb6');r(hx+4,hy-2,1,2,'#ff7eb6');r(hx+3,hy-1,1,1,'#e0468c')}
 if(g.charm&&!sit&&!lie&&!swim)r(hx+2,hy+6,1,1,'#ffd86b');
 cx.restore()}
/* Donut's current look */
function dGear(){const o={};SLOTS.forEach(([s])=>{const id=S.wear[s];if(id&&GEAR[id]){if(s==='charm')o.charm=1;else o[s]=GEAR[id].lk}});return o}

/* Coach Gus: an old basset hound in a cap with a whistle */
function gus(x,y,t,dir,talk){x=Math.round(x);y=Math.round(y);ell(x,y,13,1,'#000',.2);cx.save();if(dir==='l'){cx.translate(2*x+1,0);cx.scale(-1,1)}
 const B='#a8682e',K='#2a2026',Wt='#f6efe2',E='#7a4a22';
 r(x-11,y-3,3,3,Wt);r(x-6,y-3,3,3,Wt);r(x+5,y-3,3,3,Wt);r(x+9,y-3,3,3,Wt);
 r(x-12,y-10,24,7,B);r(x-11,y-10,18,3,K);r(x-12,y-10,24,1,sh(B,1.1));r(x-9,y-4,18,1,Wt);r(x-14,y-11,3,2,Wt);r(x-15,y-12,2,2,Wt);
 const hx=x+9,hy=y-17,bob=talk?Math.floor(t*8)%2:0;
 r(hx,hy,8,8,B);r(hx,hy,8,1,sh(B,1.1));r(hx+5,hy+4,5,4+bob,Wt);r(hx+9,hy+4,1,1,'#2a1a1a');r(hx+3,hy,2,4,Wt);
 r(hx+4,hy+3,2,1,'#5a2a2a');r(hx+5,hy+2,1,1,'#2a1a1a');r(hx,hy+2,3,10,E);r(hx-1,hy+4,1,7,E);/* long ear */
 r(hx-1,hy-2,8,3,'#d8352f');r(hx+6,hy-1,4,1,'#a02a2a');r(hx+1,hy-1,3,1,'#fff6e0');/* cap */
 r(hx+3,hy+8,1,3,'#3a3a4a');r(hx+2,hy+11,3,2,'#ffd86b');/* whistle */
 r(x-13,y-9,2,2,B);cx.restore()}

/* simple people for the circuit: announcer, executive, fans */
const PEO={};
function ppl(k,x,y,t,dir){try{if(!PEO[k]){const base={buzz:['morgan',{n:'Buzz',skin:'#f1c9a0',hair:'#e8e4d8',hl:0,eye:'#3a5a9a',top:'#e8a020',pants:'#3a2a1a',shoe:'#1a1a1a'}],
  viv:['abi',{n:'Vivian',skin:'#f6d2b0',hair:'#1a1420',hl:2,eye:'#5a3a7a',top:'#7a2fe0',skirt:'#2a2030',pants:'#2a2030',shoe:'#111'}],
  hunter:['hunter',{}],abi:['abi',{}]}[k];PEO[k]=mk(base[0],x,y,base[1])}
 const p=PEO[k];p.x=x;p.y=y;p.dir=dir||'d';p.moving=false;p.hold=null;p.sit=0;p.tag=0;person(p,t)}catch(e){r(x-3,y-18,6,18,'#888')}}

/* pixel icons for menus: drawn once, cached as data URLs */
const ICN={};
function icon(key,fn,w,h){if(ICN[key])return ICN[key];const c=mkc(w||24,h||20,fn);return ICN[key]=c.toDataURL()}
function gearIcon(id){const G=GEAR[id];return icon('g'+id,()=>{
 if(G.sl==='charm'){charmIc(G.ic)}else{const g={};g[G.sl]=G.lk;rdog(G.sl==='head'?8:11,G.sl==='head'?24:16,{c:'red',st:G.sl==='paws'?'run':'stand',ph:0,g,nt:1})}},24,20)}
function charmIc(k){const c={sausage:'#c8743a',clover:'#3aa84a',gbone:'#ffd040',chew:'#ff7eb6',bracelet:'#7ee8fa',ball:'#c8e83a'}[k]||'#ffd86b';
 if(k==='sausage'){r(6,8,12,5,'#e8b060');r(5,9,14,3,'#e8b060');r(8,9,8,3,c)}
 else if(k==='clover'){disc(10,8,2,c,1);disc(14,8,2,c,1);disc(10,12,2,c,1);disc(14,12,2,c,1);r(12,13,1,4,'#2a7a3a')}
 else if(k==='gbone'||k==='chew'){r(7,9,10,3,c);disc(6,8,2,c,1);disc(6,12,2,c,1);disc(18,8,2,c,1);disc(18,12,2,c,1)}
 else if(k==='ball'){disc(12,10,5,c,1);r(8,8,8,1,'#fff6e0');r(9,12,6,1,'#fff6e0')}
 else if(k==='bracelet'){for(let i=0;i<8;i++){const a=i/8*Math.PI*2;r(12+Math.round(Math.cos(a)*5),10+Math.round(Math.sin(a)*4),2,2,['#7ee8fa','#ff7eb6','#ffd86b'][i%3])}}
 else disc(12,10,5,c,1)}
function dogIcon(coat,gear,key,st){return icon('d'+key,()=>rdog(11,17,{c:coat,st:st||'stand',g:gear||{},nt:1}),24,20)}
/* ---------------- venues: sky, far skyline, stands, ground, foreground ---------------- */
let PR=1;const prn=()=>(PR=PR*16807%2147483647)/2147483647,pri=(a,b)=>a+Math.floor(prn()*(b-a+1)),ppk=a=>a[Math.floor(prn()*a.length)];
const SKY={day:['#7cc4f4','#8ccdf6','#9dd6f8','#b0def8','#c4e7fa','#d8f0fc'],sunny:['#4aa8ec','#5ab4f0','#6cc0f2','#80caf4','#98d6f6','#b4e4f8'],
 dusk:['#2e2a6a','#4a3278','#7a3a7e','#b84a76','#e8706a','#f8a070','#ffc888'],night:['#0a0a24','#0e1030','#141a3e','#1a2250','#222a5c','#2a3268'],
 grey:['#7a8698','#8692a2','#929eac','#a0aab6','#aeb6c0','#bcc2ca'],final:['#0a0820','#120c34','#1c1244','#281a54','#342260','#402a6a']};
const SKIN=['#f1c9a0','#f6d2b0','#c98e62','#8d5a3a','#e8b890','#a8744a'],HAIR=['#2a1a12','#5a3620','#1a1a1a','#d8a33a','#8a5a2a','#3a2216','#c8c0b0'],SHIRT=['#d8352f','#2a6ad8','#3aa84a','#e8b820','#e0468c','#7a2fe0','#f6efe2','#2a2a3a','#ff8a3a','#7ee8fa'];
function skyPaint(k){const c=SKY[k],n=c.length,h=Math.ceil(150/n);c.forEach((q,i)=>r(0,i*h,160,h,q));
 if(k==='day'||k==='sunny'){disc(130,26,8,'#fff4b0',1);disc(130,26,11,'#fff4b0',.25);PR=5;for(let i=0;i<5;i++){const x=pri(0,150),y=pri(14,70);ell(x,y,pri(7,12),2,'#ffffff',.85);ell(x+4,y-2,5,2,'#ffffff',.85)}}
 if(k==='night'||k==='final'){PR=9;for(let i=0;i<46;i++)r(pri(0,159),pri(0,100),1,1,prn()<.2?'#fff6e0':'#8a90c0');if(k==='night'){disc(28,24,6,'#fff6d8',1);disc(26,22,5,c[1],1)}}
 if(k==='dusk'){disc(116,104,14,'#ffd890',.5);disc(116,104,10,'#ffe8b0',1)}
 if(k==='grey'){PR=3;for(let i=0;i<7;i++)ell(pri(0,160),pri(10,80),pri(12,20),3,'#c8ced6',.7)}}
function crowd(x0,y0,w,rows,f,cols,seat){for(let j=0;j<rows;j++){const y=y0+j*7;r(x0,y+4,w,3,seat||'#4a3a5a');r(x0,y+6,w,1,sh(seat||'#4a3a5a',.7));
 for(let x=x0+1+(j%2)*2;x<x0+w-2;x+=4){if(prn()<.12)continue;const sk=ppk(SKIN),sc=cols?ppk(cols):ppk(SHIRT),up=f&&prn()<.35;r(x,y+2,3,3,sc);r(x,y,3,2,sk);r(x,y,3,1,ppk(HAIR));if(up){r(x-1,y-2,1,3,sk);r(x+3,y-2,1,3,sk)}}}}
function tree(x,y,s,c){r(x-1,y-s,3,s,'#6a4a2a');disc(x,y-s-2,s*.7|0,c||'#3a8a3a',1);disc(x-2,y-s,s*.5|0,sh(c||'#3a8a3a',1.15),1);disc(x+3,y-s-4,s*.4|0,sh(c||'#3a8a3a',.85),1)}
function tent(x,y,w,c1,c2){r(x,y-14,w,3,c1);for(let i=0;i<w;i+=4)r(x+i,y-14,2,3,c2);r(x,y-11,w,1,sh(c1,.7));r(x+1,y-11,1,11,'#6a5a4a');r(x+w-2,y-11,1,11,'#6a5a4a');r(x+2,y-5,w-4,5,'#a87a4a');for(let i=3;i<w-3;i+=3)r(x+i,y-6,2,2,ppk(['#d8352f','#e8b820','#3aa84a','#ff8a3a']))}
function bldg(x,y,w,h,c,win,lit){r(x,y-h,w,h,c);r(x,y-h,w,1,sh(c,1.15));for(let j=y-h+3;j<y-3;j+=5)for(let i=x+2;i<x+w-2;i+=4)if(prn()<.8)r(i,j,2,2,lit&&prn()<.7?ppk(lit):win)}
function stands(w,f,cols,seat,top){r(0,top,w,150-top,sh(seat,.6));crowd(0,top+2,w,Math.floor((144-top)/7),f,cols,seat)}
function adBoards(w,y,cs){for(let x=0;x<w;x+=32){const c=cs[(x/32)%cs.length];r(x,y,31,6,c);r(x+4,y+2,23,2,sh(c,1.4))}}
function farPaint(bg,sk){const W2=320,nt=sk==='night'||sk==='final',dusk=sk==='dusk';PR=bg.length*77+3;
 const hill=(y,c,a)=>{for(let x=0;x<W2;x++){const h=Math.round(Math.sin(x/W2*Math.PI*2*a)*5+Math.sin(x/W2*Math.PI*2*(a+2))*3);r(x,y-h,1,150-y+h,c)}};
 const city=(y,c,lit)=>{for(let x=0;x<W2;){const w=pri(10,22),h=pri(14,44);bldg(x,y,w,h,c,sh(c,.8),lit);x+=w+pri(0,3)}};
 if(bg==='park'||bg==='brewery'){hill(112,dusk?'#6a4a7a':'#7ab88a',2);for(let x=4;x<W2;x+=pri(10,16))tree(x,118,pri(6,9),dusk?'#4a3a5a':'#4a9a4a')}
 else if(bg==='market'||bg==='funrun'){hill(118,'#8ac09a',1);for(let x=0;x<W2;x+=pri(16,24)){const w=pri(12,16),h=pri(10,14);r(x,120-h,w,h,ppk(['#e8d8c0','#c8b8a8','#f0e0d0','#d8c8e0']));tri(x+w/2,120-h-7,120-h,1.2,ppk(['#a04a3a','#5a4a6a','#4a5a7a']));r(x+3,120-h+3,3,3,'#7ab8d8');r(x+w-6,120-h+3,3,3,'#7ab8d8')}}
 else if(bg==='fair'){hill(120,'#8ac09a',1);const cx0=70,cy0=78;for(let a=0;a<16;a++){const q=a/16*Math.PI*2;for(let k=0;k<26;k+=2)r(cx0+Math.round(Math.cos(q)*k),cy0+Math.round(Math.sin(q)*k),1,1,'#e8e4f0');r(cx0+Math.round(Math.cos(q)*27)-1,cy0+Math.round(Math.sin(q)*27)-1,3,3,ppk(['#d8352f','#e8b820','#2a6ad8']))}
  r(cx0-6,cy0,2,44,'#c8c4d0');r(cx0+5,cy0,2,44,'#c8c4d0');for(let x=130;x<W2;x+=40)tent(x,122,26,'#d8352f','#fff6e0')}
 else if(bg==='boardwalk'||bg==='sydney'){r(0,104,W2,46,'#3a8ac8');r(0,104,W2,2,'#8ac8f0');for(let i=0;i<60;i++)r(pri(0,W2),pri(108,148),pri(2,5),1,'#6ab0e0');
  if(bg==='boardwalk'){for(let x=180;x<300;x+=4){const y=60+Math.round(Math.abs(Math.sin((x-180)/22))*30);r(x,y,2,2,'#c8c4d0');if(x%12==0)r(x,y,1,104-y,'#a8a4b0')}}
  else{const ox=40;[[0,0,14],[10,-4,18],[22,-2,15],[32,2,11]].forEach(([dx,dy,h])=>{for(let j=0;j<h;j++){const w=Math.round((h-j)*.8);r(ox+dx,104-j+dy,w,1,'#f6f2ea')}});r(ox-4,102,48,2,'#c8b8a0')}}
 else if(bg==='vegas'){city(132,'#2a1e4a',['#ff3ad8','#ffd86b','#7ee8fa','#ff7e7e']);for(let x=20;x<W2;x+=60){r(x,48,14,84,'#3a2a5a');for(let j=52;j<130;j+=4)r(x+2,j,10,1,ppk(['#ff3ad8','#ffd86b','#7ee8fa']))}}
 else if(bg==='london'){city(130,'#6a7080','#a8b0c0');const bx=90;r(bx,40,12,90,'#8a7a5a');r(bx,40,12,1,'#a89a7a');disc(bx+6,52,4,'#f6f0d8',1);r(bx+6,49,1,3,'#2a2a2a');r(bx+6,52,3,1,'#2a2a2a');tri(bx+6,26,40,.45,'#6a5a4a');r(bx+1,60,10,70,'#7a6a4a');for(let j=64;j<126;j+=6)r(bx+3,j,6,2,'#5a4a3a')}
 else if(bg==='tokyo'){city(132,'#1a1a3a',['#ff3ad8','#7ee8fa','#ffd86b','#ff4a4a']);const tx=200;for(let j=0;j<90;j++){const w=Math.max(1,Math.round(j*.16));r(tx-w,40+j,w*2+1,1,j%12<6?'#ff4a2a':'#f6f0e8')}r(tx-8,72,17,3,'#f6f0e8');r(tx-12,100,25,3,'#ff4a2a')}
 else if(bg==='paris'){for(let x=0;x<W2;x+=pri(18,26)){const w=pri(16,24),h=pri(22,30);r(x,132-h,w,h,'#e8d8c0');r(x,132-h-5,w,5,'#5a6a8a');for(let i=x+2;i<x+w-2;i+=5)r(i,132-h+4,2,4,dusk?'#ffd890':'#7a8aa8')}
  const ex=150;for(let j=0;j<104;j++){const w=Math.round(Math.pow(j/104,2.2)*20);r(ex-w,30+j,1,1,'#5a4a5a');r(ex+w,30+j,1,1,'#5a4a5a');if(j%9==0)r(ex-w,30+j,w*2+1,1,'#5a4a5a')}r(ex-8,86,17,2,'#5a4a5a');r(ex-13,110,27,2,'#5a4a5a')}
 else if(bg==='final'){city(132,'#1a1a34',['#ffd86b','#fff6e0']);const bx=110;for(let x=0;x<90;x++){const y=Math.round(70+Math.pow((x-45)/45,2)*34);r(bx+x,y,1,3,'#3a8a5a')}r(bx,104,90,2,'#3a8a5a');for(let x=8;x<90;x+=8){const y=Math.round(70+Math.pow((x-45)/45,2)*34);r(bx+x,y,1,104-y,'#2a6a4a')}}
 else if(bg==='showcase'){r(0,0,W2,150,'#0e0a22');for(let x=0;x<W2;x+=20){r(x,10,1,40,'#2a2442');r(x,30,20,1,'#2a2442')}}
 else{/* stadium skylines: upper deck rim + light towers */r(0,58,W2,92,nt?'#1e1a3a':'#6a6a8a');r(0,58,W2,3,nt?'#3a3460':'#8a8aa8');for(let x=10;x<W2;x+=80){r(x,16,2,44,'#4a4a5a');r(x-5,12,12,6,'#e8e4d0');for(let i=0;i<5;i++)r(x-4+i*2,13,1,4,'#fff6d0')}}}
function midPaint(bg,sk,f){const W2=256,nt=sk==='night'||sk==='final';PR=bg.length*31+11;
 if(bg==='park'){for(let x=0;x<W2;x+=pri(28,44))tree(x,136,pri(10,14));for(let x=8;x<W2;x+=60){r(x,138,18,4,ppk(['#d8352f','#2a6ad8','#e8b820']));for(let i=0;i<2;i++){const px=x+3+i*8;r(px,132,4,6,ppk(SHIRT));r(px,128,4,4,ppk(SKIN));r(px,128,4,1,ppk(HAIR));if(f&&i)r(px+4,126,1,4,SKIN[0])}}
  for(let x=0;x<W2;x+=8){r(x,140,1,10,'#c8b898');r(x,142,8,1,'#c8b898');r(x,146,8,1,'#c8b898')}}
 else if(bg==='market'){for(let x=0;x<W2;x+=44)tent(x+4,140,34,ppk(['#3aa84a','#d8352f','#2a6ad8','#e8b820']),'#fff6e0');for(let x=0;x<W2;x+=12){if(prn()<.6){const c=ppk(SHIRT);r(x+2,136,4,8,c);r(x+2,132,4,4,ppk(SKIN));r(x+2,132,4,1,ppk(HAIR));if(f&&prn()<.5)r(x+6,130,1,4,SKIN[1])}}r(0,144,W2,6,'#8a6a4a')}
 else if(bg==='brewery'){r(0,96,W2,44,'#5a3a2a');for(let x=6;x<W2;x+=26){r(x,104,16,20,'#ffd890');r(x,104,16,1,'#3a2a1a');r(x+7,104,1,20,'#3a2a1a')}for(let x=0;x<W2;x+=3)r(x,92+Math.round(Math.sin(x/16)*2),1,1,x%9==0?'#ffe8a0':'#3a2a2a');
  for(let x=0;x<W2;x+=9)if(x%27==0)disc(x,93+Math.round(Math.sin(x/16)*2),2,'#ffe8a0',.6);for(let x=10;x<W2;x+=50){r(x,132,22,3,'#8a5a3a');r(x+2,135,2,6,'#6a4a2a');r(x+18,135,2,6,'#6a4a2a');for(let i=0;i<3;i++){const px=x+2+i*7;r(px,126,4,6,ppk(SHIRT));r(px,122,4,4,ppk(SKIN));r(px,122,4,1,ppk(HAIR));if(f&&i==1)r(px+4,120,1,4,SKIN[0])}}}
 else if(bg==='funrun'){for(let x=0;x<W2;x+=6){if(prn()<.85){const c=ppk(SHIRT);r(x+1,132,4,8,c);r(x+1,128,4,4,ppk(SKIN));r(x+1,128,4,1,ppk(HAIR));if(f&&prn()<.4){r(x,124,1,5,SKIN[0]);r(x+5,124,1,5,SKIN[0])}}}r(0,140,W2,10,'#e8e4ec');for(let x=0;x<W2;x+=16)r(x,140,8,10,'#d8352f')}
 else if(bg==='ballpark'){stands(W2,f,null,'#2a5a3a',70);r(0,128,W2,22,'#2a6a3a');adBoards(W2,132,['#d8352f','#e8b820','#2a6ad8','#fff6e0'])}
 else if(bg==='college'){stands(W2,f,['#e86a1a','#fff6e0','#e86a1a','#2a2a3a'],'#3a2a3a',64);adBoards(W2,140,['#e86a1a','#fff6e0'])}
 else if(bg==='nfl'){stands(W2,f,['#d8352f','#ffd86b','#2a6ad8','#fff6e0','#1e2a5a'],'#2a2a44',54);r(0,138,W2,12,'#1e1a2a');adBoards(W2,140,['#2a6ad8','#d8352f','#e8e4f0'])}
 else if(bg==='kc'){stands(W2,f,['#d8352f','#ffd86b','#d8352f'],'#4a1e2a',62);adBoards(W2,140,['#d8352f','#ffd86b'])}
 else if(bg==='showcase'){stands(W2,f,null,'#1e1a34',70);r(0,138,W2,12,'#2a2448');adBoards(W2,140,['#7a2fe0','#ff3ad8','#7ee8fa'])}
 else if(bg==='final'){stands(W2,f,['#ffd86b','#fff6e0','#3a8a5a','#d8352f','#2a6ad8'],'#2a2244',50);adBoards(W2,140,['#ffd86b','#3a8a5a','#c2417a'])}
 else if(bg==='fair'){for(let x=0;x<W2;x+=64){r(x+4,108,40,32,'#b8382a');tri(x+24,92,108,1.3,'#8a2a22');r(x+18,120,12,20,'#5a2a1a');r(x+4,108,40,1,'#fff6e0')}for(let x=0;x<W2;x+=4)r(x,96+Math.round(Math.sin(x/10)*3),2,2,ppk(['#d8352f','#ffd86b','#2a6ad8']));
  for(let x=0;x<W2;x+=10)if(prn()<.6){r(x+2,134,4,8,ppk(SHIRT));r(x+2,130,4,4,ppk(SKIN));r(x+2,130,4,1,ppk(HAIR));if(f&&prn()<.5)r(x+6,128,1,4,SKIN[2])}r(0,142,W2,8,'#c8a878');for(let x=0;x<W2;x+=6)r(x,142,1,8,'#a8885a')}
 else if(bg==='boardwalk'){for(let x=0;x<W2;x+=40){const c=ppk(['#ff7eb6','#7ee8fa','#ffd86b','#8be28b']);r(x+2,104,34,36,c);r(x+2,104,34,4,'#fff6e0');for(let i=x+4;i<x+34;i+=4)r(i,104,2,4,'#d8352f');r(x+10,116,16,12,'#3a3a4a');r(x+11,117,14,10,'#ffe8b0')}
  for(let x=0;x<W2;x+=8)if(prn()<.6){r(x+2,134,4,8,ppk(SHIRT));r(x+2,130,4,4,ppk(SKIN));r(x+2,130,4,1,ppk(HAIR));if(f&&prn()<.5)r(x+6,128,1,4,SKIN[0])}r(0,142,W2,8,'#a87a4a');for(let x=0;x<W2;x+=8)r(x,142,1,8,'#8a5a3a')}
 else if(bg==='vegas'){for(let x=0;x<W2;x+=36){r(x+16,96,3,44,'#6a4a2a');for(let a=-2;a<=2;a++)r(x+17+a*4,94+Math.abs(a),5,2,'#2a8a4a')}stands(W2,f,['#ff3ad8','#7ee8fa','#ffd86b','#fff6e0'],'#2a1a3a',112);adBoards(W2,140,['#ff3ad8','#ffd86b','#7ee8fa'])}
 else if(bg==='london'){stands(W2,f,['#d8352f','#fff6e0','#2a4aa8'],'#3a3a4a',96);for(let x=0;x<W2;x+=6)r(x,92+Math.round(Math.sin(x/12)*2),3,3,ppk(['#d8352f','#fff6e0','#2a4aa8']));adBoards(W2,140,['#d8352f','#2a4aa8'])}
 else if(bg==='tokyo'){for(let x=0;x<W2;x+=20){disc(x+10,98,3,'#ff4a4a',1);r(x+9,95,3,1,'#2a1a1a')}stands(W2,f,null,'#1e1a34',104);adBoards(W2,140,['#ff3ad8','#7ee8fa','#ffd86b'])}
 else if(bg==='paris'){for(let x=0;x<W2;x+=48){r(x+4,108,40,6,'#d8352f');for(let i=0;i<40;i+=8)r(x+4+i,108,4,6,'#fff6e0');r(x+8,114,32,26,'#e8d8c0');r(x+12,118,10,10,'#ffd890');r(x+28,118,8,22,'#5a3a2a');r(x+6,134,6,6,'#3a3a3a');r(x+36,134,6,6,'#3a3a3a')}
  for(let x=0;x<W2;x+=7)if(prn()<.6){r(x+2,134,4,8,ppk(SHIRT));r(x+2,130,4,4,ppk(SKIN));r(x+2,130,4,1,ppk(HAIR));if(f&&prn()<.5)r(x+6,128,1,4,SKIN[1])}r(0,142,W2,8,'#8a8a96')}
 else if(bg==='sydney'){r(0,120,W2,30,'#f0dca8');for(let x=10;x<W2;x+=70){r(x,104,2,26,'#c8382a');r(x-6,98,14,8,'#ffd86b');r(x-6,98,14,2,'#d8352f')}for(let x=30;x<W2;x+=50){r(x,124,2,10,'#8a6a4a');tri(x+1,114,124,1.2,ppk(['#d8352f','#2a6ad8','#ffd86b']))}
  for(let x=0;x<W2;x+=9)if(prn()<.5){r(x+2,136,4,6,ppk(SHIRT));r(x+2,132,4,4,ppk(SKIN));r(x+2,132,4,1,ppk(HAIR));if(f&&prn()<.5)r(x+6,130,1,4,SKIN[0])}}
}
const LANE=[140,162,184,206],TRK=118,TRH=106;
function groundPaint(g){const w=128,h=TRH;PR=g.length*13+1;
 if(g==='grass'){for(let x=0;x<w;x+=16)r(x,0,16,h,(x/16)%2?'#5aa83a':'#64b444');for(let i=0;i<70;i++)r(pri(0,w),pri(0,h),1,2,'#4a9a32')}
 else if(g==='dirt'){r(0,0,w,h,'#b8844a');for(let i=0;i<120;i++)r(pri(0,w),pri(0,h),pri(1,2),1,ppk(['#a87440','#c8945a','#9a6a3a']));[33,55,77].forEach(y=>r(0,y,w,1,'#c89a60'))}
 else if(g==='road'){r(0,0,w,h,'#5a5a66');for(let i=0;i<140;i++)r(pri(0,w),pri(0,h),1,1,ppk(['#6a6a76','#4a4a56']));for(let x=0;x<w;x+=16){r(x,33,8,1,'#e8e4ec');r(x,55,8,1,'#e8e4ec');r(x,77,8,1,'#e8e4ec')}r(0,99,w,2,'#e8c040')}
 else if(g==='turf'){for(let x=0;x<w;x+=32)r(x,0,32,h,(x/32)%2?'#3a9a3a':'#44a644');r(0,0,1,h,'#f6f6f0');r(64,0,1,h,'#f6f6f0');for(let x=0;x<w;x+=8){r(x,8,1,2,'#f6f6f0');r(x,98,1,2,'#f6f6f0')}}
 else if(g==='track'){r(0,0,w,h,'#c8503a');for(let i=0;i<120;i++)r(pri(0,w),pri(0,h),1,1,ppk(['#b84a34','#d85a44']));[11,33,55,77,99].forEach(y=>r(0,y,w,1,'#f6efe8'))}
 else if(g==='boards'){for(let x=0;x<w;x+=6){r(x,0,6,h,(x/6)%2?'#b88a5a':'#ae8050');r(x,0,1,h,'#8a5a3a');r(x+3,pri(4,60),1,1,'#6a4a2a')}}
 else if(g==='sand'){r(0,0,w,h,'#ead29a');for(let j=4;j<h;j+=7)for(let x=0;x<w;x++)if(Math.sin(x/5+j)>.6)r(x,j+Math.round(Math.sin(x/9)),1,1,'#dcc088');for(let i=0;i<30;i++)r(pri(0,w),pri(0,h),1,1,'#c8ac70')}
 else if(g==='cobble'){r(0,0,w,h,'#8a8a96');for(let j=0;j<h;j+=5)for(let x=(j/5%2)*4;x<w;x+=8){r(x,j,7,4,ppk(['#9a9aa6','#a4a4b0','#929aa2']));r(x,j+3,7,1,'#7a7a86')}}
 r(0,0,w,2,'rgba(0,0,0,.25)')}
function fgPaint(bg,g){const w=192;PR=bg.length*7;
 const stad=['ballpark','college','nfl','kc','showcase','vegas','london','tokyo','final'].includes(bg);
 if(g==='sand'){r(0,0,w,14,'#f0dca8');for(let x=0;x<w;x+=3)r(x,Math.round(Math.sin(x/8)*2)+2,3,1,'#e0c890')}
 else if(stad){r(0,0,w,14,'#2a2a3a');r(0,0,w,2,'#e8e4f0');for(let x=0;x<w;x+=6){const c=ppk(['#1a1626','#221c30','#2a2238']);disc(x+3,11,3,c,1);r(x+1,12,5,4,c)}}
 else{r(0,0,w,14,'#4a9a32');for(let x=0;x<w;x+=pri(10,18)){disc(x,9,pri(3,5),'#3a8a2a',1);if(prn()<.4)r(x+2,5,2,2,ppk(['#ff7eb6','#ffd86b','#fff6e0']))}}}
const VCACHE={};
function venueArt(id){if(VCACHE[id])return VCACHE[id];const V=VEN[id],A={};A.sky=mkc(160,150,()=>skyPaint(V.sky));A.far=mkc(320,150,()=>farPaint(V.bg,V.sky));
 A.mid=[0,1].map(f=>mkc(256,152,()=>midPaint(V.bg,V.sky,f)));A.gr=mkc(128,TRH,()=>groundPaint(V.gr));A.fg=mkc(192,16,()=>fgPaint(V.bg,V.gr));return VCACHE[id]=A}
const tile=(c,ox,y,par)=>{const w=c.width;let x=-((ox*par)%w);if(x>0)x-=w;for(;x<BW;x+=w)cx.drawImage(c,Math.round(x),y)};
function venueDraw(id,cam,t,hype){const A=venueArt(id),V=VEN[id];cx.drawImage(A.sky,0,0);
 if(V.bg==='showcase'||V.sky==='final'||V.bg==='nfl'||V.bg==='college'){for(let i=0;i<3;i++){const a=Math.sin(t*.7+i*2.1)*.5;cx.globalAlpha=.08;for(let j=0;j<140;j++){const x=Math.round(30+i*50+a*j*.6);r(x-j*.12,j,1+j*.25,1,'#fff6d0')}cx.globalAlpha=1}}
 if(V.sky==='final'){for(let k=0;k<3;k++){const ph=(t*.45+k*.33)%1,fx=30+((k*53+Math.floor(t*.45+k*.33)*37)%110),fy=26+k*12;if(ph<.6){const rad=ph*40;for(let a=0;a<12;a++){const q=a/12*Math.PI*2;cx.globalAlpha=1-ph/.6;r(fx+Math.cos(q)*rad,fy+Math.sin(q)*rad*.8,2,2,['#ffd86b','#ff7eb6','#7ee8fa'][k])}cx.globalAlpha=1}}}
 tile(A.far,cam,TRK-150,.12);tile(A.mid[hype&&Math.floor(t*3)%2?1:0],cam,TRK-150,.4);tile(A.gr,cam,TRK,1)}
function venueFg(id,cam){tile(venueArt(id).fg,cam,TRK+TRH,1.25)}

/* ---------------- obstacles and distractions ---------------- */
const DUCKS=new Set(['banner','bunting','lights','branch','tshirt']);
function obsDraw(k,x,y,t){x=Math.round(x);
 switch(k){
 case 'puddle':ell(x,y,7,1,'#4a8ac8',.85);r(x-3,y-1,4,1,'#9ad0f8');break;
 case 'cone':r(x-3,y-1,7,1,'#d85a1a');tri(x,y-7,y-2,.42,'#ff8a3a');r(x-1,y-5,3,1,'#fff6e0');break;
 case 'log':r(x-6,y-4,12,4,'#8a5a2a');r(x-6,y-4,12,1,'#a87a42');disc(x+6,y-2,2,'#c8a070',1);break;
 case 'crate':r(x-4,y-7,8,7,'#c8944a');r(x-4,y-7,8,1,'#e0b060');r(x-4,y-4,8,1,'#8a5a2a');r(x-1,y-7,1,7,'#8a5a2a');break;
 case 'barrel':r(x-3,y-8,7,8,'#8a5a2a');r(x-3,y-7,7,1,'#4a4a4a');r(x-3,y-2,7,1,'#4a4a4a');r(x-2,y-8,1,8,'#a87a42');break;
 case 'hay':r(x-6,y-6,12,6,'#e8c050');r(x-6,y-6,12,1,'#f8dc80');r(x-6,y-3,12,1,'#c8a030');r(x-2,y-6,1,6,'#a87a2a');r(x+2,y-6,1,6,'#a87a2a');break;
 case 'hurdle':r(x-1,y-8,1,8,'#fff6e0');r(x+3,y-8,1,8,'#fff6e0');for(let i=0;i<5;i++)r(x-1+i,y-8,1,2,i%2?'#d8352f':'#fff6e0');break;
 case 'base':r(x-4,y-2,8,2,'#fff6e0');r(x-4,y,8,1,'#c8c4d0');break;
 case 'bat':r(x-7,y-2,12,2,'#c8945a');r(x+5,y-3,3,3,'#a87440');break;
 case 'tackle':r(x-3,y-11,6,11,'#2a4aa8');r(x-3,y-11,6,1,'#4a6ac8');r(x-3,y-6,6,1,'#fff6e0');break;
 case 'football':{const b=Math.abs(Math.sin(t*6))*3|0;ell(x,y-3-b,4,2,'#8a4a22',1);r(x-1,y-4-b,3,1,'#fff6e0');break}
 case 'sandcastle':r(x-5,y-5,10,5,'#e0c080');r(x-4,y-8,3,3,'#e0c080');r(x+1,y-8,3,3,'#e0c080');r(x-3,y-10,1,2,'#d8352f');break;
 case 'surf':ell(x,y-1,8,1,'#ff7eb6',1);r(x-6,y-2,12,1,'#fff6e0');break;
 case 'chips':for(let i=0;i<3;i++){r(x-4+i*3,y-3-i*2,4,3+i*2,['#d8352f','#2a2a3a','#2a6ad8'][i]);r(x-4+i*3,y-3-i*2,4,1,'#fff6e0')}break;
 case 'teacup':r(x-4,y-6,8,5,'#f6f6f0');r(x-5,y-1,10,1,'#d8d4e0');r(x+4,y-5,2,3,'#f6f6f0');r(x-3,y-5,6,1,'#2a6ad8');break;
 case 'lantern':r(x-3,y-8,6,8,'#ff4a2a');r(x-3,y-8,6,1,'#2a1a1a');r(x-3,y-1,6,1,'#2a1a1a');r(x-1,y-6,2,4,'#ffd86b');break;
 case 'tire':ell(x,y-3,5,3,'#2a2a2a',1);ell(x,y-3,2,1,'#5a5a5a',1);break;
 /* duck under these */
 case 'banner':case 'bunting':case 'lights':{const c=k==='lights'?'#ffe8a0':'#fff6e0';r(x-6,y-18,1,18,'#8a8a96');r(x+6,y-18,1,18,'#8a8a96');r(x-6,y-14,13,1,'#e8e4f0');
  for(let i=-5;i<6;i+=2){const q=k==='lights'?(Math.floor(t*4+i)%2?'#ffe8a0':'#ff7eb6'):['#d8352f','#ffd86b','#2a6ad8','#3aa84a'][(i+6)%4];r(x+i,y-13,k==='banner'?2:1,k==='banner'?4:2,q)}break}
 case 'branch':r(x-8,y-15,16,2,'#6a4a2a');disc(x-4,y-15,3,'#3a8a3a',1);disc(x+4,y-14,3,'#4a9a3a',1);break;
 case 'tshirt':{const b=Math.round(Math.sin(t*8)*1);r(x-4,y-15+b,8,5,'#d8352f');r(x-6,y-15+b,2,2,'#d8352f');r(x+4,y-15+b,2,2,'#d8352f');r(x-1,y-14+b,2,2,'#fff6e0');break}}}
function disDraw(k,x,y,t,lure){x=Math.round(x);const b=Math.floor(t*6)%2;
 switch(k){
 case 'squirrel':r(x-3,y-4,6,4,'#8a6a5a');r(x+2,y-6,3,3,'#8a6a5a');r(x+4,y-5,1,1,'#2a1a1a');r(x-5,y-8+b,3,6,'#a8887a');r(x-6,y-9+b,2,3,'#a8887a');break;
 case 'ball':{const h=Math.abs(Math.sin(t*5))*6|0;disc(x,y-3-h,2,'#c8e83a',1);r(x-1,y-4-h,2,1,'#fff6e0');break}
 case 'hotdog':case 'corndog':case 'bbq':ell(x,y-1,6,1,'#000',.15);if(k==='corndog'){r(x-1,y-9,2,4,'#e8d8b0');r(x-2,y-6,4,6,'#d89a3a')}else{r(x-5,y-3,10,3,k==='bbq'?'#8a3a1a':'#e8c080');r(x-4,y-4,8,2,k==='bbq'?'#5a2a12':'#c8483a');r(x-3,y-4,6,1,'#ffd86b')}
  for(let i=0;i<2;i++)r(x-2+i*3,y-8-((t*8+i*3)%5|0),1,2,'rgba(255,255,255,.6)');break;
 case 'pigeon':case 'seagull':{const c=k==='pigeon'?'#8a8aa0':'#f6f6f0';r(x-3,y-4,6,4,c);r(x+2,y-6+b,3,3,c);r(x+5,y-5+b,2,1,'#e8a020');r(x+3,y-5+b,1,1,'#2a1a1a');r(x-1,y,1,1,'#e8a020');r(x+1,y,1,1,'#e8a020');if(k==='seagull')r(x-3,y-4,4,1,'#9a9aa8');break}
 case 'kid':r(x-2,y-12,5,7,'#ff8a3a');r(x-2,y-16,5,4,'#f1c9a0');r(x-2,y-16,5,1,'#5a3620');r(x,y-5,1,5,'#3a4a6b');r(x+2,y-5,1,5,'#3a4a6b');r(x+3,y-14-b*2,1,4,'#f1c9a0');r(x+3,y-16-b*2,2,2,'#c8743a');break;
 case 'popcorn':r(x-3,y-7,6,7,'#d8352f');r(x-2,y-7,1,7,'#fff6e0');r(x+1,y-7,1,7,'#fff6e0');for(let i=0;i<4;i++)r(x-3+i*2,y-9,2,2,'#fff6d0');r(x+5,y-1,1,1,'#fff6d0');r(x+7,y-1,1,1,'#fff6d0');break;
 case 'mascot':r(x-5,y-16,10,12,'#e8a020');disc(x,y-19,5,'#e8a020',1);r(x-2,y-21,1,1,'#2a1a1a');r(x+2,y-21,1,1,'#2a1a1a');r(x-4,y-24,2,3,'#e8a020');r(x+3,y-24,2,3,'#e8a020');r(x-7,y-14-b*3,2,6,'#e8a020');r(x+5,y-14,2,6,'#e8a020');r(x-3,y-4,2,4,'#e8a020');r(x+1,y-4,2,4,'#e8a020');r(x-3,y-12,6,4,'#fff6e0');break;
 case 'chicken':r(x-3,y-6,6,5,'#f6f2ea');r(x+2,y-9,3,4,'#f6f2ea');r(x+3,y-10,2,1,'#d8352f');r(x+5,y-8,1,1,'#e8a020');r(x-1,y-1,1,1,'#e8a020');r(x+1,y-1,1,1,'#e8a020');break;
 case 'croissant':for(let i=0;i<5;i++)r(x-5+i*2,y-3-(i==2?2:i%2),2,3+(i==2?2:0),i%2?'#e8a850':'#c8843a');break;
 case 'sushi':r(x-3,y-3,6,3,'#fff6f0');r(x-3,y-5,6,2,'#ff8a5a');r(x-3,y-4,6,1,'#2a2a2a');break;
 case 'cat':r(x-4,y-5,8,4,'#5a5a66');r(x+2,y-8,4,4,'#5a5a66');r(x+2,y-9,1,1,'#5a5a66');r(x+5,y-9,1,1,'#5a5a66');r(x+3,y-7,1,1,'#c8e83a');r(x-6,y-7+b,2,4,'#5a5a66');break}
 if(lure){const a=.5+Math.sin(t*10)*.5;cx.globalAlpha=a;r(x-1,y-30,3,6,'#ffd86b');r(x-1,y-22,3,2,'#ffd86b');cx.globalAlpha=1}}

/* ---------------- the gym (hub backdrop), five levels ---------------- */
const GCACHE={};
function gymArt(lv){if(GCACHE[lv])return GCACHE[lv];return GCACHE[lv]=mkc(160,288,()=>{PR=lv*91;
 if(lv===1){skyPaint('day');r(0,96,160,192,'#5aa83a');for(let y=96;y<288;y+=12)r(0,y,160,6,'#62b040');
  for(let x=0;x<160;x+=10){r(x,70,8,28,'#c8945a');r(x,70,8,1,'#e0b070');r(x+2,72,1,22,'#a87440')}r(0,78,160,2,'#a87440');r(0,90,160,2,'#a87440');
  tree(146,70,14);r(8,94,26,4,'#a87a4a');r(10,98,2,10,'#6a4a2a');r(30,98,2,10,'#6a4a2a');r(118,52,30,30,'#e0e8f0');tri(133,38,52,1.1,'#a04a3a');r(126,66,14,16,'#2a2026');r(132,58,4,4,'#7ab8d8')}
 else if(lv===2){r(0,0,160,288,'#8a8a96');r(0,0,160,100,'#b8b4bc');for(let y=10;y<96;y+=14)r(0,y,160,1,'#a8a4ac');r(0,100,160,188,'#9a9aa2');for(let y=110;y<288;y+=20)for(let x=0;x<160;x+=24)r(x,y,23,19,'#3a3a44');
  r(10,20,50,40,'#c8a878');for(let i=0;i<5;i++)for(let j=0;j<4;j++)r(14+i*9,24+j*9,2,2,'#6a5a4a');r(20,30,3,10,'#d8352f');r(32,28,8,3,'#3a3a3a');r(46,26,2,14,'#e8b820');
  r(100,14,52,72,'#6a6a76');for(let y=18;y<84;y+=8)r(102,y,48,1,'#5a5a66');r(118,40,16,10,'#ffd890')}
 else if(lv===3){r(0,0,160,110,'#a85a3a');for(let y=0;y<110;y+=6)for(let x=(y/6%2)*6;x<160;x+=12)r(x,y,11,5,'#b8664a');r(0,104,160,6,'#5a3a2a');r(0,110,160,178,'#4a5a8a');for(let y=110;y<288;y+=16)r(0,y,160,1,'#3a4a7a');
  r(30,18,100,16,'#2a2026');ptxt("GUS'S GYM",80,23,'#ffd86b',1,'c');r(12,44,40,52,'#c8d8e8');r(14,46,36,48,'#a8c0d8');r(108,44,40,52,'#c8d8e8');r(110,46,36,48,'#a8c0d8');
  r(64,44,32,40,'#fff6e0');r(66,46,28,26,'#e8a050');ptxt('1987',80,76,'#2a2026',1,'c')}
 else if(lv===4){r(0,0,160,120,'#2a3a5a');for(let x=0;x<160;x+=40){r(x+4,8,32,60,'#7ab8e8');r(x+4,8,32,2,'#a8d8f8');r(x+19,8,2,60,'#2a3a5a')}r(0,70,160,40,'#e8e4f0');for(let x=0;x<160;x+=32){r(x+2,74,28,30,ppk(['#d8352f','#2a6ad8','#ffd86b']));r(x+8,82,16,14,'#fff6e0')}
  r(0,110,160,178,'#c8503a');[150,190,230].forEach(y=>r(0,y,160,1,'#f6efe8'))}
 else{r(0,0,160,140,'#1e1a3a');for(let a=0;a<9;a++){const q=Math.PI*(a/8);for(let k=0;k<120;k+=2)r(80+Math.round(Math.cos(q)*k*1.2),130-Math.round(Math.sin(q)*k),1,1,'#3a3460')}
  for(let i=0;i<40;i++)r(pri(0,159),pri(0,120),1,1,'#ffe8a0');disc(80,40,22,'#e8a050',1);disc(80,40,9,'#1e1a3a',1);for(let i=0;i<30;i++){const a=prn()*Math.PI*2,d=11+prn()*10;r(80+Math.round(Math.cos(a)*d),40+Math.round(Math.sin(a)*d),2,1,ppk(['#ff7eb6','#7ee8fa','#ffd86b','#fff6e0']))}
  r(0,120,160,168,'#5a3a8a');for(let y=130;y<288;y+=18)r(0,y,160,1,'#6a4a9a');r(6,80,30,40,'#8a6a3a');for(let i=0;i<3;i++){r(9+i*9,84,6,10,'#ffd86b');r(11+i*9,94,2,6,'#c89a20')}r(124,80,30,40,'#8a6a3a');for(let i=0;i<3;i++){r(127+i*9,96,6,8,'#c8c4d0');r(129+i*9,104,2,6,'#a8a4b0')}}})}
/* owned equipment shows up in the gym */
function gymEquip(lv,t){const e=S.eq,fl=lv===1?118:120;
 if(e.spd){const c=['#3a3a44','#2a6ad8','#d8352f'][e.spd-1];r(8,fl+2,30,6,c);r(8,fl+2,30,1,sh(c,1.3));r(34,fl-12,3,14,'#6a6a76');r(30,fl-14,8,3,c);for(let i=0;i<6;i++)r(10+((i*5+Math.floor(t*12))%28),fl+4,1,1,'#8a8a96')}
 if(e.acc){r(132,fl-6,14,10,['#e8b820','#8a5a2a','#2a2a3a'][e.acc-1]);disc(139,fl-8,3,'#c8e83a',1)}
 if(e.sta){ell(30,fl+32,13,3,'#4a8ac8',1);ell(30,fl+31,11,2,'#8ac8f0',1);r(17,fl+31,1,3,'#ff7eb6');r(43,fl+31,1,3,'#ff7eb6')}
 if(e.agi){for(let i=0;i<3+e.agi;i++){const x=104+i*8;if(e.agi===1){r(x,fl+30,3,1,'#d85a1a');r(x+1,fl+27,1,3,'#ff8a3a')}else{r(x,fl+22,1,10,i%2?'#fff6e0':'#d8352f');r(x,fl+22,1,2,'#ffd86b')}}}
 if(e.foc){r(140,fl+26,8,5,'#8a6a5a');r(146,fl+24,3,3,'#8a6a5a');r(138,fl+23,3,5,'#a8887a')}
 if(e.cha){r(4,fl-40,10,22,'#c8d8e8');r(5,fl-39,8,20,'#e8f4fc');if(e.cha>1){r(150,fl-40,2,24,'#3a3a44');disc(151,fl-42,4,'#fff6d0',1)}}}
/* ---------------- race engine ---------------- */
function eff(){const e=Object.assign({},S.st);SLOTS.forEach(([s])=>{const G=GEAR[S.wear[s]];if(G)for(const k in G.b)e[k]+=G.b[k]});if(S.buff)for(const k in S.buff)e[k]+=S.buff[k];for(const k in e)e[k]=clamp(e[k],1,140);return e}
const sandOK=()=>SLOTS.some(([s])=>{const G=GEAR[S.wear[s]];return G&&G.sand});
const vOf=s=>58+s*.62;
const ORD=['1ST','2ND','3RD','4TH'];
function arw(x,y,up,c){for(let i=0;i<4;i++){const w=up?i*2+1:7-i*2;r(x-(w>>1),y+i,w,1,c)}r(x,up?y+4:y-3,1,3,c)}
function mkRival(i,lg,boss,lane){if(boss){const B=BOSS[boss],[spd,acc,sta,agi,foc,cha]=B.st;return {n:B.n,coat:B.coat,g:B.gear,sz:B.sz||1,boss,trait:B.trait,s:{spd,acc,sta,agi,foc,cha},lane}}
 const L=LG[lg];let [a,b]=L.r;if(lg===3){const k=clamp((100-rankOf())/100,0,1);a+=k*8;b+=k*8}if(lg===0&&S.races<2){a-=3;b-=4}
 const s={};STATS.forEach(([k])=>s[k]=ri(a,b));return {n:'',coat:pick(RCOATS),g:pick(RGEAR)||{},sz:pick([1,1,1,.9,1.08]),s,lane,trait:'none'}}
const rankOf=()=>S.fl.champ?1:Math.max(2,100-Math.round(S.rp*1.15));
function raceScreen(ev){const V=VEN[ev.ven],E=eff(),lg=S.lg,len=V.len,boss=ev.boss,relay=!!V.relay;
 /* field */const names=RIVN.slice().sort(()=>Math.random()-.5);const riv=[];const nR=3;
 for(let i=0;i<nR;i++){const isB=boss&&i===nR-1;const R=mkRival(i,lg,isB?boss:null,isB?2:i);if(!isB)R.n=names[i];riv.push(R)}
 riv.forEach(R=>{const s=R.s;Object.assign(R,{x:0,v:0,ph:Math.random()*4,vm:vOf(s.spd),ac:30+s.acc*1.1,form:rr(.97,1.03),jt:-1,dk:0,trip:0,chase:0,fin:null,done:{},st:'stand',surge:0})});
 const D={n:'Donut',coat:'red',x:0,v:0,ph:0,d:0,sta:100,gas:0,jt:-1,jh:0,dk:0,trip:0,chase:0,chX:0,fin:null,lane:3,done:{},zm:0,zt:0,wind:hasSk('wind'),st:'stand',held:0,pf:0};
 const vm=vOf(E.spd)*(V.gr==='sand'&&!sandOK()?.93:1),ac=(30+E.acc*1.1)*(hasSk('quick')?1.15:1),focusNeed=clamp((.9-E.foc*.0058)*(hasSk('iron')?.6:1)*(S.mood<30?1.25:1),.22,1.2);
 const tired=S.en<30,stCost=3.3*(1-E.sta/230)*(hasSk('pacer')?.8:1)*(tired?1.35:1);
 /* course */const obs=[];let x=260;const types=V.o,du=V.du;let k=0;
 while(x<len-160){const duck=k>1&&Math.random()<.22;obs.push({x,k:duck?pick(du):pick(types),duck});x+=rr(150,250)-Math.min(40,lg*12);k++}
 const dis=[];const nd=lg===0?2:3;for(let i=0;i<nd;i++){const at=len*(.25+i*.6/nd)+rr(-40,40);obs.forEach(o=>{if(Math.abs(o.x-at)<70)o.x+=90});dis.push({x:at,k:pick(V.d),hit:0,res:0,on:0})}
 if(boss==='chad')dis.push({x:len*.48,k:'bark',hit:0,res:0,on:0,chad:1});
 const all=[D,...riv];let phase='count',ct=3.4,time=0,cam=-40,pops=[],endT=0,hype=0,crum=relay,handed=0,flop=0,flopTaps=0,shake=0,falseT=0,msg=null;
 const pop=(s,c,big)=>{pops.push({s,c:c||'#ffd86b',t:0,big})};
 const say=(s,d)=>{msg={s,t:d||1.6}};
 MUS=boss?'kart':'crzRace';
 function startGo(){phase='run';snd('go');D.st='run';riv.forEach(R=>{R.st='run';R.v=R.vm*(R.trait==='rocket'?.6:rr(.15,.3))})}
 function special(){if(D.zm<1||D.zt>0||phase!=='run')return;D.zm=0;D.zt=hasSk('turbo')?5:2.6;D.d=1;pop('ZOOMIES!','#ff7eb6',1);snd('boost');hype=2;
  if(hasSk('star')){D.sta=100;riv.forEach(R=>{if(Math.abs(R.x-D.x)<70&&R.trait!=='perfect'&&R.trait!=='royal'){R.trip=.35;R.v*=.8}});pop('CROWD ROAR!','#7ee8fa')}}
 function tap(){if(phase==='count'){if(ct<1.0){/* jumped the gun */}if(ct>0.02){falseT=.7;pop('EARLY!','#ff7e7e');snd('miss')}return}
  if(phase!=='run'||D.fin!=null)return;
  if(flop>0){flopTaps++;snd('blip');if(flopTaps>=3){flop=0;pop('UP SHE GETS!','#ff9ccb')}return}
  if(D.trip>0||D.chase>0)return;if(time<.28&&!D.pf){D.pf=1;const big=hasSk('rocket');D.v=vm*(big?.95:.62);D.d=1;pop(big?'ROCKET START!':'PERFECT START!','#8be28b');snd('boost');return}
  if(D.gas>0){snd('miss');return}D.d=Math.min(1,D.d+.2);D.sta-=stCost;D.puff=.18;snd('foot');if(D.sta<=0){D.sta=0;if(D.wind){D.wind=0;D.sta=50;pop('SECOND WIND!','#8be28b');snd('boost')}else{D.gas=1.5;pop('PANTING...','#ff7e7e')}}}
 const SCR={
  enter(){},
  down(px,py){if(py>238&&px>104&&D.zm>=1)special();else tap()},
  swipe(dir){if(phase!=='run'||D.fin!=null||D.trip>0||D.chase>0||flop>0)return;if(dir==='u'&&D.jt<0&&D.dk<=0){D.jt=0;snd('jump')}else if(dir==='d'&&D.jt<0){D.dk=.62;snd('whoosh')}},
  pause(){},
  _st:()=>({D,riv,phase,len,time}),
  upd(dt){if(phase==='count'){ct-=dt;if(falseT>0)falseT-=dt;const c0=Math.ceil(ct+dt),c1=Math.ceil(ct);if(c1!==c0&&c1>0)snd('beep');if(ct<=0){startGo();if(falseT>0){D.trip=falseT}}cam=lerp(cam,D.x-46,dt*3);return}
   if(phase==='end'){endT+=dt;all.forEach(R=>{R.v=lerp(R.v,R.fin!=null?vOf(20)*.35:R.v,dt*1.5);R.x+=R.v*dt;R.ph+=R.v*dt*.11});cam=lerp(cam,D.x-46,dt*2);pops.forEach(p=>p.t+=dt);if(endT>2.2)finish();return}
   if(SCR.auto)autoP(dt);time+=dt;if(hype>0)hype-=dt;if(msg){msg.t-=dt;if(msg.t<=0)msg=null}if(shake>0)shake-=dt;
   const prog=D.x/len;
   /* Donut */
   D.d=Math.max(0,D.d-.55*dt);if(D.gas<=0)D.sta=Math.min(100,D.sta+(2.5+(D.d<.35?6*(1+E.sta/150):0))*dt);if(D.puff>0)D.puff-=dt;if(D.gas>0){D.gas-=dt;D.sta=Math.min(100,D.sta+10*dt)}
   let vt=vm*(.74+.26*D.d)*(hasSk('after')&&prog>.75?1.06:1);
   if(D.gas>0)vt*=.8;if(D.zt>0){D.zt-=dt;vt=vm*(hasSk('turbo')?1.36:1.28);D.sta=Math.min(100,D.sta+3*dt)}
   if(hasSk('draft')&&riv.some(R=>R.x-D.x>6&&R.x-D.x<42)){vt*=1.07;D.drf=1}else D.drf=0;
   if(crum&&!handed)vt*=.82;if(flop>0)vt=0;
   if(D.trip>0){D.trip-=dt;vt*=.35}if(D.chase>0){D.chase-=dt;vt*=.28}
   const a=vt>D.v?ac:ac*1.6;D.v+=clamp(vt-D.v,-a*dt,a*dt);if(D.fin==null){D.x+=D.v*dt}D.ph+=D.v*dt*.11;
   if(D.jt>=0){D.jt+=dt;const jd=hasSk('light')?.6:.52;D.jh=Math.sin(Math.min(1,D.jt/jd)*Math.PI)*15;if(D.jt>=jd){D.jt=-1;D.jh=0;snd('step')}}if(D.dk>0)D.dk-=dt;
   D.zm=Math.min(1,D.zm+.032*dt*(hasSk('crowd')?1.3:1));
   /* relay: Crumpet runs the first half */
   if(crum&&!handed){if(!flop&&prog>.12&&prog<.45&&Math.random()<dt*.18&&!D.flopped){D.flopped=1;flop=1;flopTaps=0;pop('CRUMPET LIES DOWN','#ff9ccb');say('Tap tap tap to get her up!',2)}
    if(prog>=.5){handed=1;crum=0;pop('TAG! GO DONUT!','#ffd86b',1);snd('confirm');D.d=1;D.v=Math.max(D.v,vm*.8)}}
   /* obstacles */
   obs.forEach((o,i)=>{if(D.done[i])return;const dx=o.x-(D.x+6);if(dx<0){D.done[i]=1;
     const ok=o.duck?D.dk>0:D.jh>3;if(ok){const perf=o.duck?D.dk>.25:D.jh>11;if(perf){pop('PERFECT!','#8be28b');D.zm=Math.min(1,D.zm+.18*(hasSk('crowd')?1.3:1));if(hasSk('show')){D.v*=1.08}snd('ding')}else{snd('step')}}
     else if(!(hasSk('light')&&!o.duck&&D.jh>1)){D.trip=hasSk('shake')?.28:.5;D.v*=hasSk('shake')?.72:.5;D.d=0;pop(o.duck?'BONK!':'OOF!','#ff7e7e');snd('bump');shake=.25}}});
   /* distractions */
   dis.forEach(q=>{if(q.hit||q.res)return;const dx=q.x-D.x;if(dx<95&&dx>-6){q.on=1;if(IN.down)D.held+=dt;if(D.held>=focusNeed){q.res=1;q.on=0;D.held=0;pop('FOCUSED!','#b78cff');D.zm=Math.min(1,D.zm+.22);snd('chime')}}
    else if(dx<=-6&&q.on){q.on=0;q.hit=1;D.held=0;D.chase=1.1;D.d=0;pop(q.chad?'DISTRACTED!':{squirrel:'SQUIRREL!!',ball:'BALL!!',hotdog:'HOT DOG!!',pigeon:'BIRD!!',seagull:'BIRD!!'}[q.k]||'OOH! SNACK!','#ffd86b');snd('alert')}});
   if(boss==='chad'){const q=dis[dis.length-1];if(!q.said&&q.x-D.x<120){q.said=1;say('Chad Barkley: BARK BARK! (HOLD to stay focused!)',2.4);snd('buzz')}}
   /* rivals */
   riv.forEach(R=>{if(R.trip>0)R.trip-=dt;if(R.chase>0)R.chase-=dt;const p=R.x/len,s=R.s;
    let dr=.6+.22*s.sta/100+Math.sin(time*.9+R.ph)*.08,mul=R.form;
    if(R.trait==='closer')dr=p<.6?.42:1.05;if(R.trait==='rocket'){if(p<.25){dr=1;mul*=1.07}else if(p>.5)dr=.5}if(R.trait==='surge'&&p>.7)mul*=1.12;if(R.trait==='royal'&&p>.7){mul*=1.1;if(!R.said){R.said=1;say('LORD FLUFFINGTON: THE ROYAL SURGE!',1.8)}}
    if(R.trait==='snack'&&p>.55&&!R.ate){R.ate=1;R.chase=1.1;say('Le Baguette stops for a croissant!',1.8)}
    if(R.trait==='tank'){dr=.82}else if(p>.7)mul*=1-Math.max(0,.1-s.sta*.0011);
    if(V.gr==='sand'&&R.trait!=='sand')mul*=.93;
    if(crum&&!handed)mul*=.97;
    let vt=R.vm*(.74+.26*Math.min(1.05,dr))*mul;if(R.trip>0)vt*=.35;if(R.chase>0)vt*=.28;
    const a=vt>R.v?R.ac:R.ac*1.6;R.v+=clamp(vt-R.v,-a*dt,a*dt);if(R.fin==null)R.x+=R.v*dt;R.ph+=R.v*dt*.11;
    if(R.jt>=0){R.jt+=dt;R.jh=Math.sin(Math.min(1,R.jt/.5)*Math.PI)*13;if(R.jt>=.5){R.jt=-1;R.jh=0}}if(R.dk>0)R.dk-=dt;
    obs.forEach((o,i)=>{if(R.done[i])return;const dx=o.x-R.x;if(dx<18&&dx>0&&!R.pre){R.pre=i+1;const sp=R.trait==='perfect'||R.trait==='nimble'||R.trait==='royal'?0:clamp(.3-s.agi*.0032,.03,.3);R.fail=Math.random()<sp;
      if(!R.fail){if(o.duck)R.dk=.5;else R.jt=0}}
     if(dx<0){R.done[i]=1;R.pre=0;if(R.fail){R.trip=.5;R.v*=.5}}});
    dis.forEach(q=>{if(q.chad)return;const k='d'+q.x;if(R.done[k]||q.x>R.x)return;R.done[k]=1;const sp=R.trait==='perfect'||R.trait==='royal'?0:clamp(.28-s.foc*.003,.02,.28);if(Math.random()<sp)R.chase=.9});
    if(R.fin==null&&R.x>=len){R.fin=time-(R.x-len)/Math.max(1,R.v)}});
   if(D.fin==null&&D.x>=len){D.fin=time-(D.x-len)/Math.max(1,D.v);D.st='cheer';phase='end';snd('fanfare');hype=3;
    riv.forEach(R=>{if(R.fin==null)R.fin=time+(len-R.x)/Math.max(20,R.v*.95)});}
   cam=lerp(cam,D.x-46,Math.min(1,dt*8));pops.forEach(p=>p.t+=dt);pops=pops.filter(p=>p.t<1.1);
   all.forEach(R=>{R.st=R.trip>0?'trip':R.chase>0?'run':R.jt>=0?'jump':R.dk>0?'duck':'run'})},
  draw(t){const sx=shake>0?Math.round(Math.sin(t*90)*1.5):0;cx.save();cx.translate(sx,0);
   venueDraw(ev.ven,cam,t,hype>0||phase==='end');
   /* start and finish lines */const line=(wx,c1,c2)=>{const X=Math.round(wx-cam);if(X<-8||X>BW+8)return;for(let y=TRK+2;y<TRK+TRH;y+=4){r(X,y,2,2,c1);r(X+2,y,2,2,c2);r(X,y+2,2,2,c2);r(X+2,y+2,2,2,c1)}};
   line(0,'#fff6e0','#2a2026');line(len,'#fff6e0','#2a2026');
   const fx=Math.round(len-cam);if(fx>-30&&fx<BW+30){r(fx-1,TRK-40,2,40,'#e8e4f0');r(fx+3,TRK-40,2,40,'#e8e4f0');r(fx-4,TRK-46,12,8,'#d8352f');ptxt('FINISH',fx+2,TRK-56,'#fff6e0',1,'c');
    /* the superfans with their sign: it gets bigger every league */const sz=[1,1,2,2][lg];for(let i=0;i<3;i++){const px=fx-30+i*7;r(px,TRK-12,5,8,'#e0903a');r(px,TRK-16,5,4,SKIN[i]);r(px,TRK-16,5,1,HAIR[i+1]);r(px+1,TRK-10,3,2,'#fbf6ec')}
    const sw=[18,22,28,34][lg];r(fx-31,TRK-30-sz*4,sw,8+sz*4,'#fff6e0');ptxt(lg>2?'DONUT GOAT':'GO DONUT',fx-31+sw/2,TRK-28-sz*4,'#e0468c',1,'c')}
   /* distractions sit by the near rail */
   dis.forEach(q=>{if(q.chad)return;const X=q.x-cam;if(X<-20||X>BW+20)return;const tx=q.hit&&D.chase>0?X:X;disDraw(q.k,tx,TRK+TRH+2,t,q.on);
    if(q.on){const need=focusNeed,k=Math.min(1,D.held/need);for(let a=0;a<24;a++){const qq=a/24*Math.PI*2;if(a/24<=k)r(Math.round(X+Math.cos(qq-Math.PI/2)*9),Math.round(TRK+TRH-24+Math.sin(qq-Math.PI/2)*9),2,2,'#b78cff');else r(Math.round(X+Math.cos(qq-Math.PI/2)*9),Math.round(TRK+TRH-24+Math.sin(qq-Math.PI/2)*9),1,1,'rgba(255,255,255,.7)')}ptxtS('HOLD',X,TRK+TRH-26,'#fff6e0',1,'c')}});
   /* draw lanes back to front: obstacles in each lane, then the racer in it */
   for(let ln=0;ln<4;ln++){const y=LANE[ln];obs.forEach(o=>{const X=o.x-cam;if(X>-14&&X<BW+14)obsDraw(o.k,X,y,t)});
    all.filter(R=>R.lane===ln).forEach(R=>{const X=R.x-cam;if(X<-30||X>BW+30)return;const isD=R===D;
     if(isD&&D.zt>0){for(let k=1;k<4;k++){cx.globalAlpha=.18/k;rdog(X-k*7,y,{c:crum&&!handed?'red':'red',st:'run',ph:D.ph-k,g:dGear(),jy:D.jh});}cx.globalAlpha=1}
     if(isD&&crum&&!handed){rdog(X,y,{c:'red',st:flop?'lie':D.st,ph:D.ph,jy:D.jh,bow:1,sz:.95,tongue:1});return}
     rdog(X,y,{c:R.coat,st:R.st,ph:R.ph,g:isD?dGear():R.g,jy:R.jh||0,sz:R.sz||1,dir:isD&&D.chase>0&&Math.floor(t*6)%2?'l':'r'});
     if(R.boss&&R.trait!=='none'){ptxt('BOSS',X,y-30,'#ffd86b',1,'c')}
     if(isD){if(D.drf)r(X-14,y-6,4,1,'#7ee8fa');if(D.puff>0&&!D.jh){cx.globalAlpha=D.puff*3;r(X-12,y-2,2,1,'#efe6d6');r(X-15,y-3,2,1,'#efe6d6');cx.globalAlpha=1}heart(X+4,y-25-D.jh-(Math.floor(t*3)%2),'#ff5f9e')}})}
   venueFg(ev.ven,cam);cx.restore();
   /* upcoming warnings */const nx=obs.find(o=>!D.done[o.x]&&o.x-cam>BW-6&&o.x-D.x<260);
   let wn=0;obs.forEach((o,i)=>{if(D.done[i]||wn)return;const X=o.x-cam;if(X>BW-8&&o.x-D.x<270){wn=1;const a=.65+Math.sin(t*12)*.35,y=LANE[3]-30;cx.globalAlpha=a;r(146,y,12,14,'#2b1830');r(147,y+1,10,12,o.duck?'#7ee8fa':'#ffd86b');arw(152,y+3,!o.duck,'#2b1830');cx.globalAlpha=1}});
   /* pops */pops.forEach((p,i)=>{const y=LANE[3]-34-p.t*16-i*2;cx.globalAlpha=Math.min(1,(1.1-p.t)*3);ptxtS(p.s,52,y,p.c,p.big?2:1,'c');cx.globalAlpha=1});
   /* top hud */r(0,0,BW,22,'rgba(14,8,40,.78)');const place=1+riv.filter(R=>R.x>D.x).length;ptxtS(ORD[place-1],4,4,place===1?'#ffd86b':'#fff6e0',2);
   ptxt((time).toFixed(1),156,4,'#cdb8e8',1,'r');r(40,13,112,3,'#3a2e5a');all.slice().sort((a,b)=>a===D?1:b===D?-1:0).forEach(R=>{const k=clamp(R.x/len,0,1),X=40+Math.round(k*108),c=COATS[R.coat].b;if(R===D){r(X-2,9,5,6,'#fff6e0');r(X-1,10,3,4,c)}else r(X-1,11,3,4,R.boss?'#ffd86b':c)});
   ptxt(boss?BOSS[boss].n:VEN[ev.ven].n,40,4,'#cdb8e8',1);
   /* bottom panel */r(0,238,BW,50,'#1a1430');r(0,238,BW,1,'#4a3a6a');ptxt(crum&&!handed?'CRUMPET':'STAMINA',6,243,'#cdb8e8');
   r(6,250,90,7,'#2b1830');const sc=D.sta>50?'#8be28b':D.sta>22?'#ffd86b':'#ff7e7e';r(7,251,Math.round(88*D.sta/100),5,D.gas>0&&Math.floor(t*8)%2?'#ff7e7e':sc);
   for(let i=0;i<5;i++)r(7+i*18,259,16,3,D.d>i/5?'#ff9ccb':'#3a2e5a');
   const zf=D.zm>=1,zx=130,zy=262;disc(zx,zy,17,zf?'#ff7eb6':'#2b1830',1);for(let a=0;a<40;a++){const q=a/40*Math.PI*2-Math.PI/2;r(Math.round(zx+Math.cos(q)*15),Math.round(zy+Math.sin(q)*15),2,2,a/40<=D.zm?'#ffd86b':'#4a3a6a')}
   ptxtS(zf?'ZOOM':D.zt>0?'GO!':'',zx,zy-3,'#fff6e0',1,'c');if(!zf&&D.zt<=0)ptxt(Math.floor(D.zm*100)+'%',zx,zy-2,'#8a7aa8',1,'c');if(zf&&Math.floor(t*4)%2)disc(zx,zy,19,'#fff6e0',.25);
   ptxt('TAP SPRINT  SWIPE^ JUMP',6,268,'#8a7aa8');ptxt('SWIPEV DUCK  HOLD FOCUS',6,277,'#8a7aa8');
   if(msg){r(4,26,152,12,'rgba(14,8,40,.85)');ptxt(msg.s.toUpperCase().slice(0,37),80,30,'#fff6e0',1,'c')}
   if(phase==='count'){const n=Math.ceil(ct);r(0,96,BW,40,'rgba(14,8,40,.4)');ptxtS(n>0?String(n):'GO!',80,104,n>0?'#fff6e0':'#8be28b',5,'c');if(ct>2.6)ptxtS('READY...',80,140,'#ffd86b',1,'c')}
   else if(phase==='run'&&time<.9)ptxtS('GO!',80,104,'#8be28b',5,'c');
   if(phase==='end'){const pl=placeOf();ptxtS(ORD[pl-1]+'!',80,90,pl===1?'#ffd86b':'#fff6e0',4,'c')}}};
 let at=0;function autoP(dt){const A=SCR.auto;at-=dt;const o=obs.find((o,i)=>!D.done[i]);if(o){const dx=o.x-(D.x+6);if(!o.duck&&D.jt<0&&dx<D.v*.27&&dx>0&&Math.random()<A.k)SCR.swipe('u');if(o.duck&&D.dk<=0&&dx<D.v*.28&&dx>0&&Math.random()<A.k)SCR.swipe('d')}
  IN.down=dis.some(q=>q.on)&&A.k>.5?1:0;if(at<=0){at=A.rate||.36;if(D.sta>(A.save||25)||D.zt>0)tap()}if(D.zm>=1&&D.x/len>(A.zat||.6))special()}
 function placeOf(){const t=D.fin;return 1+riv.filter(R=>R.fin!=null&&R.fin<t).length}
 if(window.CRZ_AUTO)SCR.auto=window.CRZ_AUTO;
 let finished=0;function finish(){if(finished)return;finished=1;const pl=placeOf();raceDone(ev,pl,D.fin,riv)}
 return SCR}
/* ---------------- training minigames ---------------- */
function mgShell(def){const G={t:0,ph:'how',sc:0,pops:[]};let doneT=0,cdn=3;
 const pop=(s,c,x,y)=>G.pops.push({s,c:c||'#ffd86b',x:x||80,y:y||120,t:0});G.pop=pop;def.init(G);MUS='crzRace';
 return {down(x,y){if(G.ph==='play'&&def.down)def.down(G,x,y)},tap(x,y){if(G.ph==='how'){G.ph='cd';snd('confirm');return}if(G.ph==='play'&&def.tap)def.tap(G,x,y)},swipe(d){if(G.ph==='play'&&def.swipe)def.swipe(G,d)},up(x,y){if(G.ph==='play'&&def.up)def.up(G,x,y)},
  upd(dt){if(G.ph==='cd'){const a=Math.ceil(cdn);cdn-=dt;if(Math.ceil(cdn)!==a&&cdn>0)snd('beep');if(cdn<=0){G.ph='play';snd('go')}return}
   if(G.ph==='play'){G.t+=dt;def.upd(G,dt);if(G.t>=def.dur||G.over){G.ph='done';G.sc=clamp(def.score(G),.3,1.5);snd(G.sc>1?'win':'coin')}}
   if(G.ph==='done'){doneT+=dt;if(doneT>1.8)trainDone(def.k,G.sc,0)}G.pops.forEach(p=>p.t+=dt);G.pops=G.pops.filter(p=>p.t<1)},
  draw(t){def.draw(G,t);G.pops.forEach(p=>{cx.globalAlpha=Math.min(1,(1-p.t)*3);ptxtS(p.s,p.x,p.y-p.t*14,p.c,1,'c');cx.globalAlpha=1});
   r(0,0,BW,18,'rgba(14,8,40,.8)');ptxtS(def.n.toUpperCase(),4,4,SN[def.k][2]);if(G.ph==='play'){r(4,13,152,2,'#3a2e5a');r(4,13,Math.round(152*(1-G.t/def.dur)),2,SN[def.k][2])}
   if(G.ph==='how'){r(10,70,140,112,'rgba(14,8,40,.92)');r(10,70,140,1,SN[def.k][2]);ptxtS(def.n.toUpperCase(),80,80,'#ffd86b',1,'c');def.how.forEach((s,i)=>ptxt(s,80,96+i*10,'#fff6e0',1,'c'));
    ptxt('TRAINS '+SN[def.k][1].toUpperCase(),80,150,SN[def.k][2],1,'c');if(Math.floor(t*2)%2)ptxtS('TAP TO START',80,166,'#ff9ccb',1,'c')}
   if(G.ph==='cd')ptxtS(String(Math.ceil(cdn)),80,110,'#fff6e0',5,'c');
   if(G.ph==='done'){r(20,100,120,50,'rgba(14,8,40,.9)');ptxtS(G.sc>=1.2?'AMAZING!':G.sc>=.9?'GREAT!':G.sc>=.6?'GOOD':'KEEP AT IT',80,110,'#ffd86b',2,'c');const n=G.sc>=1.2?3:G.sc>=.8?2:1;for(let i=0;i<3;i++)starPx(62+i*14,132,i<n)}}}}
function starPx(x,y,on){const c=on?'#ffd86b':'#4a3a6a';r(x+3,y,2,2,c);r(x,y+2,8,2,c);r(x+1,y+4,6,2,c);r(x,y+6,3,2,c);r(x+5,y+6,3,2,c)}
function grassBg(){r(0,0,160,288,'#5aa83a');for(let y=0;y<288;y+=12)r(0,y,160,6,'#62b040')}
/* 1. Treadmill Tempo: tap on the beat */
const MG_SPD={k:'spd',n:'Treadmill Tempo',dur:17,how:['TAP WHEN EACH PAW','PRINT HITS THE RING.','THE BEAT GETS FASTER!'],
 init(G){G.notes=[];let tt=1.0,bpm=96;while(tt<16.5){G.notes.push({t:tt,h:0});bpm=Math.min(168,bpm+3.2);tt+=60/bpm}G.p=0;G.g=0;G.m=0;G.run=0},
 upd(G,dt){G.notes.forEach(n=>{if(!n.h&&G.t-n.t>.16){n.h=-1;G.m++;G.pop('MISS','#ff7e7e',40,196)}});const nx=G.notes.find(n=>n.t>G.t);if(nx&&!nx.tk&&nx.t-G.t<.02){nx.tk=1;snd('tick')}G.run+=dt*(4+G.t*.5)},
 tap(G){const n=G.notes.filter(n=>!n.h).sort((a,b)=>Math.abs(a.t-G.t)-Math.abs(b.t-G.t))[0];if(!n||Math.abs(n.t-G.t)>.16){G.pop('OFF BEAT','#ff7e7e',40,196);G.m++;return}
  const e=Math.abs(n.t-G.t);n.h=1;if(e<.06){G.p++;G.pop('PERFECT','#8be28b',40,196);snd('ding')}else{G.g++;G.pop('GOOD','#ffd86b',40,196);snd('blip')}},
 score:G=>(G.p+G.g*.6-G.m*.15)/G.notes.length*1.45,
 draw(G,t){r(0,0,160,288,'#9a9aa2');r(0,0,160,120,'#b8b4bc');r(0,120,160,168,'#3a3a44');const tm=G.t;
  r(28,166,104,10,'#2a2a34');r(28,166,104,2,'#5a5a66');for(let i=0;i<10;i++)r(28+((i*11-Math.floor(G.run*30))%104+104)%104,170,1,4,'#6a6a76');r(122,128,4,40,'#6a6a76');r(114,124,16,8,'#2a6ad8');ptxt(String(Math.round(96+tm*4.3)),122,126,'#7ee8fa',1,'c');
  rdog(78,166,{c:'red',st:'run',ph:G.run*4,g:dGear()});
  r(0,200,160,28,'#1a1430');r(0,200,160,1,'#4a3a6a');disc(40,214,9,'#ff9ccb',.35);for(let a=0;a<20;a++){const q=a/20*Math.PI*2;r(Math.round(40+Math.cos(q)*9),Math.round(214+Math.sin(q)*9),1,1,'#ff9ccb')}
  G.notes.forEach(n=>{if(n.h)return;const X=40+(n.t-tm)*70;if(X>-6&&X<170){r(X-2,212,5,4,'#fff6e0');r(X-3,209,2,2,'#fff6e0');r(X+2,209,2,2,'#fff6e0');r(X,208,1,2,'#fff6e0')}});
  ptxt('TAP ON THE BEAT',80,240,'#cdb8e8',1,'c');ptxt('PERFECT '+G.p+'  GOOD '+G.g,80,252,'#8a7aa8',1,'c')}};
/* 2. Fetch Sprint: react the instant the ball flies */
const MG_ACC={k:'acc',n:'Fetch Sprint',dur:60,how:['HUNTER WILL THROW','THE BALL. TAP THE','INSTANT IT FLIES.','DON’T FALL FOR FAKES!'],
 init(G){G.rd=0;G.sc2=[];G.st='wait';G.at=rr(1.2,2.4);G.fake=Math.random()<.5?rr(.5,G.at-.3):-1;G.lt=0;G.dx=0;G.bx=0},
 upd(G,dt){G.lt+=dt;if(G.st==='wait'){if(G.lt>=G.at){G.st='fly';G.ft=G.lt;snd('throw')}}else if(G.st==='fly'){G.bx+=dt;if(G.lt-G.ft>1.2){G.sc2.push(.3);G.pop('TOO SLOW','#ff7e7e',80,120);G.st='run';G.rt=9}}
  else if(G.st==='run'){G.dx+=dt*150;if(G.dx>110){G.st='back';G.lt=0}}else if(G.st==='back'){if(G.lt>.8){G.rd++;if(G.rd>=5){G.over=1;return}G.st='wait';G.lt=0;G.at=rr(1,2.6);G.fake=Math.random()<.55?rr(.45,G.at-.3):-1;G.dx=0;G.bx=0}}},
 tap(G){if(G.st==='wait'){G.sc2.push(0);G.pop('FALSE START!','#ff7e7e',80,120);snd('miss');G.st='back';G.lt=0;return}if(G.st!=='fly')return;const rt=G.lt-G.ft;G.rt=rt;
  const s=rt<.24?1.5:rt<.34?1.2:rt<.48?.9:rt<.7?.6:.35;G.sc2.push(s);G.pop((rt*1000|0)+' MS',s>=1.2?'#8be28b':'#ffd86b',80,120);snd(s>=1.2?'boost':'step');G.st='run'},
 score:G=>G.sc2.reduce((a,b)=>a+b,0)/5,
 draw(G,t){grassBg();skyPaint('day');r(0,140,160,148,'#5aa83a');for(let y=140;y<288;y+=12)r(0,y,160,6,'#62b040');
  const hx=128,thr=G.st==='fly'||G.st==='run';const fakeArm=G.st==='wait'&&G.fake>0&&Math.abs(G.lt-G.fake)<.25;
  ppl('hunter',hx,182,t,'l');if(G.st==='wait'&&!fakeArm)disc(hx-5,166,2,'#c8e83a',1);if(fakeArm){r(hx-8,158,2,6,'#f1c9a0');disc(hx-8,156,2,'#c8e83a',1)}
  if(thr){const k=Math.min(1,G.bx/1.1),bx=hx-8-k*120,by=160-Math.sin(k*Math.PI)*60+k*30;disc(bx,by,2,'#c8e83a',1)}
  const dx=20+G.dx;rdog(dx,196,{c:'red',st:G.st==='run'?'run':'stand',ph:G.dx*.2,g:dGear()});if(G.st==='wait'&&Math.floor(t*3)%2)ptxt('READY...',80,220,'#fff6e0',1,'c');
  ptxt('ROUND '+Math.min(5,G.rd+1)+' / 5',80,250,'#2b1830',1,'c')}};
/* 3. Pool Laps: alternate left and right */
const MG_STA={k:'sta',n:'Pool Laps',dur:15,how:['TAP LEFT, THEN RIGHT,','THEN LEFT, THEN RIGHT.','A STEADY RHYTHM','SWIMS FARTHEST.'],
 init(G){G.x=0;G.v=0;G.last=null;G.good=0;G.bad=0;G.lap=0},
 upd(G,dt){G.v=Math.max(0,G.v-dt*14);G.x+=G.v*dt},
 down(G,x){const s=x<80?'l':'r';if(s===G.last){G.bad++;G.v*=.5;G.pop('SPLASH!','#7ee8fa',x<80?40:120,160);snd('splash')}else{G.good++;G.v=Math.min(46,G.v+8);snd('blip')}G.last=s},
 score:G=>G.x/330*1.3,
 draw(G,t){r(0,0,160,288,'#e8e4ec');for(let y=0;y<100;y+=10)for(let x=(y/10%2)*8;x<160;x+=16)r(x,y,15,9,'#f6f2fa');r(0,100,160,110,'#3a8ac8');for(let y=110;y<210;y+=24)r(0,y,160,1,'#5aa8e0');
  for(let i=0;i<20;i++){const x=((i*31-G.x*2)%180+180)%180-10;r(x,104+(i*13)%100,5,1,'#8ac8f0')}for(let x=-((G.x*2)%40);x<160;x+=40)for(let y=128;y<210;y+=24){r(x,y,20,2,'#ff7eb6');r(x+20,y,20,2,'#fff6e0')}
  const bob=Math.round(Math.sin(t*8)*1);rdog(70,150+bob,{c:'red',st:'swim',ph:t*8,g:{}});for(let i=0;i<3;i++)r(52-i*6,148+((i+Math.floor(t*10))%2),3,1,'#fff6e0');
  r(0,210,160,78,'#1a1430');r(0,210,80,78,G.last==='l'?'#2a2050':'#1a1430');r(80,210,1,78,'#4a3a6a');ptxtS('LEFT',40,240,'#7ee8fa',2,'c');ptxtS('RIGHT',120,240,'#7ee8fa',2,'c');
  ptxt(Math.floor(G.x/6)+' M',80,22,'#2b1830',1,'c');r(30,30,100,3,'#c8c4d0');r(30,30,Math.min(100,G.x/330*100),3,'#8be28b')}};
/* 4. Weave Poles: switch sides for every pole */
function dogTop(x,y,t){x=Math.round(x);y=Math.round(y);const w=Math.floor(t*12)%2;ell(x,y+1,4,7,'#000',.15);r(x-3,y-5,7,11,'#e0903a');r(x-2,y-3,5,7,'#eaa456');r(x-3,y+5,7,2,'#fbf6ec');r(x-3,y-9,7,5,'#e0903a');r(x,y-9,1,4,'#fbf6ec');r(x-1,y-11,1,2,'#e0903a');r(x+2,y-11,1,2,'#e0903a');r(x-1,y-10,3,1,'#2a1a1a');
 r(x-4,y-4+w,1,2,'#fbf6ec');r(x+4,y-4-w+1,1,2,'#fbf6ec');r(x-4,y+3-w,1,2,'#fbf6ec');r(x+4,y+2+w,1,2,'#fbf6ec')}
const MG_AGI={k:'agi',n:'Weave Poles',dur:30,how:['TAP LEFT OR RIGHT TO','WEAVE AROUND EACH POLE.','LEFT OF ONE, RIGHT OF','THE NEXT. GO GO GO!'],
 init(G){G.y=0;G.v=46;G.side=-1;G.dx=-12;G.poles=[];for(let i=0;i<18;i++)G.poles.push({y:-60-i*44,need:i%2?1:-1,res:0});G.ok=0;G.bad=0},
 upd(G,dt){G.v=Math.min(110,G.v+dt*3.5);G.y+=G.v*dt;G.dx=lerp(G.dx,G.side*12,Math.min(1,dt*14));G.poles.forEach(p=>{if(p.res)return;if(p.y+G.y>200){p.res=Math.sign(G.dx)===p.need?1:-1;if(p.res>0){G.ok++;snd('blip')}else{G.bad++;G.pop('WRONG SIDE','#ff7e7e',80,170);snd('bump')}}});if(G.poles.every(p=>p.res))G.over=1},
 down(G,x){G.side=x<80?-1:1},swipe(G,d){if(d==='l')G.side=-1;if(d==='r')G.side=1},
 score:G=>(G.ok-G.bad*.4)/18*1.45,
 draw(G,t){grassBg();for(let y=-((G.y)%24);y<288;y+=24)r(0,y,160,12,'#62b040');r(76,0,8,288,'rgba(255,255,255,.12)');
  G.poles.forEach(p=>{const Y=p.y+G.y;if(Y<-10||Y>300)return;r(79,Y-12,3,14,p.need<0?'#d8352f':'#2a6ad8');r(79,Y-12,3,2,'#ffd86b');ell(80,Y+2,3,1,'#000',.2);
   if(!p.res&&Y>0)ptxt(p.need<0?'<':'>',p.need<0?66:90,Y-8,'#fff6e0',1);if(p.res)r(p.need<0?66:92,Y-6,3,3,p.res>0?'#8be28b':'#ff7e7e')});
  dogTop(80+G.dx,206,t);r(0,236,160,52,'rgba(14,8,40,.7)');ptxtS('LEFT',40,256,'#fff6e0',2,'c');ptxtS('RIGHT',120,256,'#fff6e0',2,'c');ptxt(G.ok+' / 18',80,24,'#2b1830',1,'c')}};
/* 5. Squirrel Watch: tap treats, ignore squirrels */
const MG_FOC={k:'foc',n:'Squirrel Watch',dur:16,how:['DONUT IS ON A SIT-STAY.','TAP THE TREATS THAT POP UP.','DO NOT TAP THE SQUIRRELS.','(SHE WANTS TO. SO BAD.)'],
 init(G){G.it=[];G.nt=.6;G.hit=0;G.sq=0;G.ms=0;G.tot=0;G.wob=0},
 upd(G,dt){G.nt-=dt;if(G.nt<=0){G.nt=rr(.45,.95)-G.t*.012;const holes=[[30,150],[80,136],[130,150],[48,186],[112,186]];const free=holes.filter(h=>!G.it.some(i=>i.h===h));if(free.length){const h=pick(free),tr=Math.random()<.45;if(tr)G.tot++;G.it.push({h,tr,t:0,life:rr(.8,1.1)-G.t*.015})}}
  G.it.forEach(i=>{i.t+=dt;if(i.t>i.life&&!i.gone){i.gone=1;if(i.tr&&!i.got){G.ms++}}});G.it=G.it.filter(i=>!i.gone||i.t<i.life+.2);if(G.wob>0)G.wob-=dt},
 tap(G,x,y){const i=G.it.find(i=>!i.gone&&Math.abs(i.h[0]-x)<14&&Math.abs(i.h[1]-8-y)<14);if(!i)return;i.gone=1;i.got=1;if(i.tr){G.hit++;G.pop('GOOD GIRL!','#8be28b',i.h[0],i.h[1]-20);snd('coin')}else{G.sq++;G.wob=.5;G.pop('NO! STAY!','#ff7e7e',i.h[0],i.h[1]-20);snd('alert')}},
 score:G=>(G.hit-G.sq*1.2-G.ms*.4)/Math.max(4,G.tot)*1.45,
 draw(G,t){grassBg();skyPaint('day');r(0,100,160,188,'#5aa83a');for(let y=100;y<288;y+=12)r(0,y,160,6,'#62b040');for(let x=0;x<160;x+=10){r(x,80,8,22,'#c8945a');r(x,80,8,1,'#e0b070')}
  [[30,150],[80,136],[130,150],[48,186],[112,186]].forEach(([x,y])=>{disc(x,y+2,10,'#3a8a3a',1);disc(x-5,y,6,'#4a9a3a',1)});
  G.it.forEach(i=>{if(i.gone&&!i.got)return;const k=Math.min(1,i.t/.12),[x,y]=i.h,yy=y-Math.round(k*10);if(i.gone)return;if(i.tr){r(x-5,yy-3,10,3,'#e8c080');disc(x-5,yy-2,2,'#e8c080',1);disc(x+5,yy-2,2,'#e8c080',1)}else disDraw('squirrel',x,yy+3,t)});
  [[30,150],[80,136],[130,150],[48,186],[112,186]].forEach(([x,y])=>{disc(x,y+6,9,'#3a8a3a',1)});
  const wb=G.wob>0?Math.round(Math.sin(t*40)*1):0;rdog(80+wb,244,{c:'red',st:'sit',g:dGear()});if(G.wob>0)ptxtS('!',96,214,'#ff7e7e',2);
  ptxt('TREATS '+G.hit+'  OOPS '+G.sq,80,272,'#2b1830',1,'c')}};
/* 6. Photo Shoot: pose on cue */
const POSES=[['SIT','sit'],['BOW','bow'],['TILT','tilt'],['WAVE','wave']];
function posed(x,y,p,t){if(p==='bow'){rdog(x,y,{c:'red',st:'duck',g:dGear(),tongue:1});r(x-10,y-12,2,3,'#e0903a')}else{rdog(x,y,{c:'red',st:'sit',g:dGear(),tongue:p!=='sit'});if(p==='tilt')ptxtS('?',x+12,y-26,'#fff6e0',1);if(p==='wave'){r(x+8,y-14+Math.round(Math.sin(t*12)),2,6,'#fbf6ec')}}}
const MG_CHA={k:'cha',n:'Photo Shoot',dur:40,how:['THE PHOTOGRAPHER CALLS','A POSE. TAP THE MATCHING','POSE BEFORE THE','SHUTTER CLICKS!'],
 init(G){G.n=0;G.ok=0;G.next=()=>{G.want=pick(POSES)[1];G.lim=Math.max(1.05,2.3-G.n*.16);G.lt=0;G.cur=G.cur||'sit';G.n++};G.next();G.fl=0},
 upd(G,dt){G.lt+=dt;if(G.fl>0)G.fl-=dt;if(G.lt>=G.lim){G.pop('TOO SLOW','#ff7e7e',80,150);snd('miss');if(G.n>=8)G.over=1;else G.next()}},
 tap(G,x,y){if(y<236)return;const i=clamp(Math.floor(x/40),0,3);const p=POSES[i][1];G.cur=p;if(p===G.want){G.ok+=1+Math.max(0,(G.lim-G.lt)/G.lim)*.5;G.fl=.25;snd('shutter');G.pop('SNAP!','#fff6e0',80,150)}else{snd('miss');G.pop('BLURRY...','#ff7e7e',80,150)}if(G.n>=8)G.over=1;else G.next()},
 score:G=>G.ok/8*1.15,
 draw(G,t){r(0,0,160,288,'#f0e6f6');r(0,180,160,56,'#e0d4ea');ell(80,196,40,6,'#d0c4dc',1);r(10,30,2,120,'#3a3a44');disc(11,26,8,'#fff6d0',1);r(148,30,2,120,'#3a3a44');disc(149,26,8,'#fff6d0',1);
  ppl('abi',130,170,t,'l');r(118,150,8,6,'#2a2a34');r(116,152,3,3,'#5a5a66');posed(72,196,G.cur,t);
  r(20,40,120,40,'#fff6e0');r(20,40,120,1,'#c2417a');ptxt('POSE:',80,46,'#8a7aa8',1,'c');ptxtS(POSES.find(p=>p[1]===G.want)[0],80,58,'#c2417a',2,'c');r(30,74,100,3,'#e8dcf0');r(30,74,Math.round(100*(1-G.lt/G.lim)),3,'#e0468c');
  if(G.fl>0){cx.globalAlpha=G.fl*3;r(0,0,160,288,'#ffffff');cx.globalAlpha=1}
  r(0,236,160,52,'#2b1830');POSES.forEach(([n,p],i)=>{r(i*40+2,238,36,48,'#fff6e0');r(i*40+2,238,36,1,'#ff9ccb');ptxt(n,i*40+20,278,'#5a2148',1,'c');posed(i*40+16,268,p,0)});
  ptxt('SHOT '+Math.min(8,G.n)+' / 8',80,24,'#5a2148',1,'c')}};
const MGS={spd:MG_SPD,acc:MG_ACC,sta:MG_STA,agi:MG_AGI,foc:MG_FOC,cha:MG_CHA};
/* ---------------- progression ---------------- */
const xpNeed=lv=>40+lv*18;
function addXP(n){S.xp+=Math.round(n);const ups=[];while(S.lv<50&&S.xp>=xpNeed(S.lv)){S.xp-=xpNeed(S.lv);S.lv++;S.sp++;STATS.forEach(([k])=>S.st[k]+=1);ups.push(S.lv)}return ups}
const apMax=()=>3+(S.gym>=4?1:0);
const spa$=()=>[40,250,1500,6000][S.lg];
function trainDone(k,perf,quick){const before=S.st[k],m=GYM[S.gym].m*EQM[S.eq[k]||0]*(.75+S.mood/250)*Math.max(.1,1-S.st[k]/118);
 const g=Math.round(2.6*m*perf*10)/10;S.st[k]=Math.round((S.st[k]+g)*10)/10;S.ap--;S.en=clamp(S.en-(quick?14:18),0,100);S.mood=clamp(S.mood-(quick?2:3),0,100);
 const ups=addXP(18+perf*10);save();const lines=['<b>+'+g.toFixed(1)+' '+SN[k][1]+'</b>','+'+Math.round(18+perf*10)+' XP'];if(ups.length)lines.push('<em>LEVEL UP! Lv '+S.lv+'</em><br>+1 skill point &middot; +1 to every stat');
 resultCard({title:quick?'QUICK SESSION':perf>=1.2?'AMAZING!':perf>=.9?'GREAT SESSION!':perf>=.6?'NICE WORK':'TOUGH ONE',stars:quick?0:perf>=1.2?3:perf>=.8?2:1,lines,sub:SN[k][1]+' '+Math.floor(before)+' &rarr; '+Math.floor(S.st[k]),btn:'Back to the gym',then:()=>afterAny()})}
function raceDone(ev,pl,time,riv){const L=LG[S.lg],boss=ev.boss,V=VEN[ev.ven];S.races++;S.raced=1;S.buff=null;
 let purse=Math.round((boss?L.boss$:L.purse)*[1,.5,.25,.1][pl-1]*(hasSk('fan')?1.2:1));S.money+=purse;
 const xp=Math.round(L.xp*[1,.75,.55,.4][pl-1]*(boss?1.5:1));const ups=addXP(xp);
 S.en=clamp(S.en-28,0,100);S.mood=clamp(S.mood+[12,4,0,-6][pl-1],0,100);if(pl===1)S.wins++;
 let lp=0,rp=0,beat=0;if(!boss&&S.lg<3){lp=L.lp[pl-1]||0;S.lp+=lp}
 if(S.lg===3){rp=[12,7,4,1][pl-1]*(boss?2:1);S.rp+=rp}
 const key=boss||ev.ven;S.best[key]=Math.min(S.best[key]||9,pl);
 if(boss&&pl===1){beat=1;S.boss++;const it=BOSS[boss].drop;if(it&&!S.own.includes(it))S.own.push(it)}
 S.last={boss,pl,ven:ev.ven,beat};save();
 const lines=['<b>+'+fmt$(purse)+'</b> prize money','+'+xp+' XP'];if(lp)lines.push('+'+lp+' league points');if(rp)lines.push('World rank: <em>#'+rankOf()+'</em>');
 if(ups.length)lines.push('<em>LEVEL UP! Lv '+S.lv+'</em><br>+1 skill point &middot; +1 to every stat');if(beat&&BOSS[boss].drop)lines.push('Trophy: <em>'+GEAR[BOSS[boss].drop].n+'</em>');
 resultCard({title:pl===1?(boss?'BOSS BEATEN!':'1ST PLACE!'):ORD[pl-1]+' PLACE',stars:[3,2,1,0][pl-1],lines,sub:(boss?BOSS[boss].n+' &middot; ':'')+V.n+' &middot; '+time.toFixed(2)+'s',news:news(pl,boss),
  btn:'Continue',then:()=>afterRace(ev,pl)})}
function news(pl,boss){const n=S.races,w=S.wins,lg=S.lg;
 const h=lg===3&&S.fl.champ?['THE QUEEN OF SPEED','Donut, world champion, still demands belly rubs after every race.']
  :boss&&pl===1?['UPSET OF THE YEAR?','Donut takes down '+BOSS[boss].n+'. The crowd goes absolutely feral.']
  :n<=1?['WHO IS DONUT?','Local corgi with a very round name turns heads in her debut.']
  :w>=3&&lg===0?['DONUT MANIA?','Three fans in orange shirts refuse to leave the park.']
  :lg===1&&pl===1?['MINOR LEAGUE, MAJOR ZOOMIES','Is Donut the real deal? Our panel says: probably.']
  :lg===2&&pl===1?['PRIME TIME DONUT','Stadium crowds chant her name. She sneezes. They chant louder.']
  :lg===3&&pl===1?['THE WORLD IS WATCHING','Rankings shake up as Donut climbs to #'+rankOf()+'.']
  :pl>2?['A ROUGH ONE','Even champions have off days. Mostly because of squirrels.']
  :['STEADY DONUT','Another strong run from everybody’s favourite fluffy butt.'];return h}
const STAR='<svg viewBox="0 0 9 9" shape-rendering="crispEdges"><path fill="FILL" d="M4 0h1v2h1v1h3v1h-1v1h-1v1h1v3h-1v-1h-1v-1h-3v1h-1v1h-1v-3h1v-1h-1v-1h-1v-1h3v-1h1z"/></svg>';
function resultCard(o){const d=el('<div class="res fadein"><p class="rn">'+(o.sub||'')+'</p><h2>'+o.title+'</h2>'+(o.stars!=null&&o.stars>=0&&o.title.indexOf('QUICK')<0?'<div class="st">'+[0,1,2].map(i=>STAR.replace('FILL',i<o.stars?'#ffd86b':'#4a3a6a').replace('<svg','<svg style="animation-delay:'+(.3+i*.25)+'s"')).join('')+'</div>':'')+
  '<p class="ln">'+o.lines.join('<br>')+'</p>'+(o.news?'<div class="news"><b>PAWS &amp; EFFECT</b>'+o.news[0]+'<br>'+o.news[1]+'</div>':'')+'<div class="btns"><button class="tag">'+o.btn+'</button></div></div>');
 ui.appendChild(d);if(o.stars>=2)snd('win');d.querySelector('button').onclick=()=>{snd('select');d.remove();o.then()}}

/* ---------------- hub ---------------- */
const HUBD={zt:-9,ct:-9};
const HUB={enter(){MUS='crzHub'},ui(){hubUI()},
 tap(x,y){if(Math.abs(x-80)<16&&Math.abs(y-170)<16){HUBD.zt=tm;snd('whoosh')}else if(Math.abs(x-124)<14&&Math.abs(y-174)<10){HUBD.ct=tm;snd('pop')}},
 draw(t){cx.drawImage(gymArt(S.gym),0,0);gymEquip(S.gym,t);
  if(S.fl.gus)gus(30,178,t,'r',Math.floor(t/4)%3===0);ppl('abi',112,150,t,'d');ppl('hunter',138,150,t,'d');
  const z=t-HUBD.zt;if(z<1.4){const a=z/1.4*Math.PI*2,x=80+Math.cos(a)*30,y=170+Math.sin(a)*10;rdog(x,y,{c:'red',st:'run',ph:t*14,g:dGear(),dir:Math.sin(a)>0?'l':'r'})}
  else rdog(80,172,{c:'red',st:Math.floor(t/5)%3===2?'stand':'sit',g:dGear(),tongue:Math.floor(t*1.3)%4<2});
  const c=t-HUBD.ct;rdog(124,178,{c:'red',st:c<.6?'sit':'lie',bow:1,sz:.95,sleep:c>.6&&Math.floor(t/3)%2})}};
function hub(){go(HUB)}
function bar(lbl,v,c){return '<div class="mtr">'+lbl+'<i><b style="width:calc('+clamp(v,0,100)+'% - var(--u)*.8);--c:'+c+'"></b></i></div>'}
function hubUI(){const L=LG[S.lg],ap=apMax();ui.innerHTML='';
 const top=el('<div class="top"><div class="r1"><button class="xbtn" style="position:static">&#10005; Exit</button><span class="lg">WEEK '+S.week+' &middot; '+L.s+'</span><span class="mo">'+fmt$(S.money)+'</span></div>'+
  '<div class="meters">'+bar('ENERGY '+Math.round(S.en),S.en,S.en>30?'#8be28b':'#ff7e7e')+bar('MOOD '+Math.round(S.mood),S.mood,'#ff9ccb')+bar('LV '+S.lv,S.xp/xpNeed(S.lv)*100,'#ffd86b')+'</div>'+
  '<div class="aps">ACTIONS '+Array.from({length:ap},(_,i)=>'<span style="display:inline-block;width:'+U(2.6)+';height:'+U(2.6)+';border-radius:50%;background:'+(i<S.ap?'#ffd86b':'#3a2e5a')+'"></span>').join('')+'<span style="margin-left:auto">'+(S.lg===3?'WORLD RANK #'+rankOf():'')+'</span></div></div>');
 ui.appendChild(top);top.querySelector('.xbtn').onclick=()=>{snd('select');close()};
 const nxt=nextBoss(),rc=S.raced?'Raced this week':S.fl.rest?'Resting this week':nxt&&nxt.ok?'Boss race ready: '+BOSS[nxt.b].n:'Pick a race';
 const dock=el('<div class="dock"><button class="tile big" data-a="race">RACE DAY<small>'+rc+'</small></button>'+
  '<button class="tile" data-a="train">TRAIN<small>'+S.ap+' action'+(S.ap==1?'':'s')+' left</small></button><button class="tile" data-a="care">REST &amp; GIGS<small>Nap, play, earn</small></button>'+
  '<button class="tile" data-a="shop">SHOP<small>Gear, treats, equipment</small></button><button class="tile" data-a="gear">DONUT<small>Stats &amp; outfit</small></button>'+
  '<button class="tile" data-a="skill">SKILLS<small>Level '+S.lv+'</small>'+(S.sp?'<span class="bdg">'+S.sp+'</span>':'')+'</button><button class="tile" data-a="gym">GYM<small>'+GYM[S.gym].n+'</small></button>'+
  '<button class="tag pink" data-a="week" style="grid-column:1/3;justify-self:center;width:'+U(96)+'">End week &#9656;<small>Rest up, get paid, new week</small></button></div>');
 ui.appendChild(dock);dock.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{snd('select');({race:panRace,train:panTrain,care:panCare,shop:panShop,gear:panGear,skill:panSkill,gym:panGym,week:endWeek})[b.dataset.a]()})}
function panel(title,sub,body,wire){const p=el('<div class="pan fadein"><h2>'+title+'</h2>'+(sub?'<p class="sub">'+sub+'</p>':'')+body+'<button class="tag back">Back</button></div>');ui.appendChild(p);
 p.querySelector('.back').onclick=()=>{snd('select');p.remove();hubUI()};if(wire)wire(p);return p}
function refresh(p,fn){const st=p.scrollTop;p.remove();const q=fn();if(q)q.scrollTop=st}

/* race select */
function nextBoss(){const L=LG[S.lg],b=L.boss[S.boss];if(!b)return null;const need=b[2],ok=S.lg===3?rankOf()<=need:S.lp>=need;return {b:b[0],ven:b[1],need,ok}}
function panRace(){const L=LG[S.lg],blocked=S.raced||S.fl.rest;let h='';
 if(S.fl.rest)h+='<p class="sub" style="color:#ff9ccb">Donut is resting her paw this week.<br>Doctor’s orders (Abigail’s orders).</p>';else if(S.raced)h+='<p class="sub" style="color:#ff9ccb">Donut already raced this week.<br>End the week to race again.</p>';
 if(S.en<30&&!blocked)h+='<p class="sub" style="color:#ff7e7e">Donut is tired. Her stamina will drain faster.</p>';
 h+='<p class="hd">BOSS RACES</p>';L.boss.forEach((b,i)=>{const B=BOSS[b[0]],done=i<S.boss,cur=i===S.boss,nb=nextBoss(),ok=cur&&nb&&nb.ok;
  const req=S.lg===3?'Reach world rank #'+b[2]:'Needs '+b[2]+' league points';
  h+='<div class="card boss'+(done||ok?'':' dim')+'"><img class="ic" src="'+dogIcon(B.coat,B.gear,'b'+b[0])+'"><div class="bd">'+B.n+'<small>'+VEN[b[1]].n+'<br>'+(done?'Beaten &#10003;':cur?(ok?B.w:req+(S.lg<3?' ('+S.lp+' now)':' (#'+rankOf()+' now)')):'Locked')+'</small></div>'+(done?'':'<button class="go" data-b="'+i+'"'+(ok&&!blocked?'':' disabled')+'>RACE</button>')+'</div>'});
 h+='<p class="hd">CIRCUIT RACES &middot; '+fmt$(L.purse)+' TO WIN</p>';L.ev.forEach(v=>{const V=VEN[v],b=S.best[v];h+='<div class="card"><img class="ic" src="'+venueIcon(v)+'"><div class="bd">'+V.n+'<small>'+(V.relay?'Relay with Crumpet! ':'')+'3 rivals'+(b?' &middot; Best: '+ORD[b-1]:'')+'</small></div><button class="go" data-v="'+v+'"'+(blocked?' disabled':'')+'>RACE</button></div>'});
 panel(L.n.toUpperCase(),S.lg===3?'World rank #'+rankOf():'League points: '+S.lp,h,p=>{p.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{snd('confirm');startRace({ven:b.dataset.v})});
  p.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{snd('confirm');const x=L.boss[+b.dataset.b];startRace({ven:x[1],boss:x[0]})})})}
function venueIcon(v){return icon('v'+v,()=>{const A=venueArt(v);bg2(A,v)},24,20)}
function bg2(A,v){cx.drawImage(A.sky,0,-40);cx.drawImage(A.mid[0],-20,-122);cx.drawImage(A.gr,0,14)}
function startRace(ev){if(ev.boss)preBoss(ev,()=>go(raceScreen(ev)));else go(raceScreen(ev))}

/* training */
function panTrain(){let h='<p class="sub">Actions left this week: '+S.ap+' &middot; Energy '+Math.round(S.en)+'<br>Gym bonus x'+GYM[S.gym].m+'</p>';const can=S.ap>0&&S.en>=15;
 if(!S.ap)h+='<p class="sub" style="color:#ff9ccb">No actions left. End the week to keep training.</p>';else if(S.en<15)h+='<p class="sub" style="color:#ff7e7e">Donut is too tired to train. Rest first.</p>';
 TR.forEach(([k,n,d])=>{const t=S.eq[k]||0;h+='<div class="card"><img class="ic" src="'+trainIcon(k)+'"><div class="bd">'+n+'<small>'+SN[k][1]+' '+Math.floor(S.st[k])+(t?' &middot; '+EQ[k][t-1]:'')+'<br>'+d+'</small></div><div style="display:flex;flex-direction:column;gap:'+U(1.4)+'"><button class="go" data-p="'+k+'"'+(can?'':' disabled')+'>PLAY</button><button class="go" style="background:#8a7aa8" data-q="'+k+'"'+(can?'':' disabled')+'>QUICK</button></div></div>'});
 h+='<p class="sub">QUICK skips the minigame for a smaller gain.</p>';
 panel('TRAINING',null,h,p=>{p.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{snd('confirm');go(mgShell(MGS[b.dataset.p]))});p.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{snd('confirm');p.remove();trainDone(b.dataset.q,.62,1)})})}
function trainIcon(k){return icon('t'+k,()=>{r(0,0,24,20,SN[k][2]);r(0,0,24,1,sh(SN[k][2],1.2));const st={spd:'run',acc:'run',sta:'swim',agi:'jump',foc:'sit',cha:'sit'}[k];rdog(10,17,{c:'red',st,ph:1,nt:1,jy:k==='agi'?3:0})},24,20)}

/* rest, play and side gigs */
function panCare(){const can=S.ap>0;let h='<p class="sub">Actions left: '+S.ap+'</p>';
 const card=(id,n,d,btn,dis)=>'<div class="card"><div class="bd">'+n+'<small>'+d+'</small></div><button class="go" data-c="'+id+'"'+(dis?' disabled':'')+'>'+btn+'</button></div>';
 h+=card('nap','Nap on the couch','+40 Energy &middot; 1 action','NAP',!can)+card('play','Play with Crumpet','+25 Mood, +10 Energy &middot; 1 action','PLAY',!can)+card('spa','Spa day','+35 Energy, +35 Mood &middot; no action &middot; '+fmt$(spa$()),'BOOK',S.money<spa$());
 h+='<p class="hd">SIDE GIGS &middot; 1 action, -15 energy</p>';GIGS.filter(g=>g[0]<=S.lg).forEach((g,i)=>{const pay=Math.round(g[2]*(hasSk('magnet')?1.3:1)),ok=eff().cha>=g[3];h+=card('g'+GIGS.indexOf(g),g[1],(ok?'Pays '+fmt$(pay)+' &middot; +1 Charm':'Needs '+g[3]+' Charm'),'GO',!can||!ok||S.en<15)});
 const p=panel('REST &amp; GIGS',null,h,p=>p.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const c=b.dataset.c;snd('coin');
  if(c==='nap'){S.ap--;S.en=clamp(S.en+40,0,100);toast('Zzz... +40 Energy')}else if(c==='play'){S.ap--;S.mood=clamp(S.mood+25,0,100);S.en=clamp(S.en+10,0,100);S.fl.plays=(S.fl.plays||0)+1;toast('Crumpet flops over. Donut zooms. +25 Mood')}
  else if(c==='spa'){S.money-=spa$();S.en=clamp(S.en+35,0,100);S.mood=clamp(S.mood+35,0,100);toast('So fluffy. +35 Energy +35 Mood')}
  else{const g=GIGS[+c.slice(1)],pay=Math.round(g[2]*(hasSk('magnet')?1.3:1));S.ap--;S.en=clamp(S.en-15,0,100);S.money+=pay;S.st.cha+=1;S.mood=clamp(S.mood+5,0,100);toast(g[1]+': +'+fmt$(pay))}
  save();refresh(p,panCare);checkGifts()}))}

/* shop */
let SHOPTAB='gear';
function panShop(){let h='<div class="row">'+[['gear','Gear'],['eq','Equipment'],['treat','Treats']].map(([k,n])=>'<button class="chip'+(SHOPTAB===k?' on':'')+'" data-t="'+k+'">'+n+'</button>').join('')+'</div><p class="sub">You have <span style="color:#8be28b">'+fmt$(S.money)+'</span></p>';
 const bon=b=>Object.keys(b).map(k=>(b[k]>0?'+':'')+b[k]+' '+SN[k][1]).join(', ');
 if(SHOPTAB==='gear'){const L=Object.keys(GEAR).filter(id=>GEAR[id].t<=S.lg&&!S.own.includes(id)&&GEAR[id].p>0);if(!L.length)h+='<p class="sub">Sold out! New gear arrives in the next league.</p>';
  L.forEach(id=>{const G=GEAR[id];h+='<div class="card"><img class="ic" src="'+gearIcon(id)+'"><div class="bd">'+G.n+'<small>'+SLOTS.find(s=>s[0]===G.sl)[1]+' &middot; '+bon(G.b)+(G.sand?' &middot; no sand slowdown':'')+'</small></div><button class="go" data-g="'+id+'"'+(S.money<G.p?' disabled':'')+'>'+fmt$(G.p)+'</button></div>'})}
 else if(SHOPTAB==='eq'){h+='<p class="sub">Equipment multiplies training gains for one stat.</p>';STATS.forEach(([k,n])=>{const t=S.eq[k]||0;if(t>=3){h+='<div class="card dim"><img class="ic" src="'+trainIcon(k)+'"><div class="bd">'+EQ[k][2]+'<small>'+n+' &middot; maxed (x'+EQM[3]+')</small></div></div>';return}
  const need=EQG[t],ok=S.gym>=need;h+='<div class="card'+(ok?'':' dim')+'"><img class="ic" src="'+trainIcon(k)+'"><div class="bd">'+EQ[k][t]+'<small>'+n+' training x'+EQM[t+1]+(ok?'':' &middot; needs '+GYM[need].n)+'</small></div><button class="go" data-e="'+k+'"'+(ok&&S.money>=EQP[t]?'':' disabled')+'>'+fmt$(EQP[t])+'</button></div>'})}
 else{Object.keys(TREAT).filter(k=>(TREAT[k].t||0)<=S.lg).forEach(k=>{const T2=TREAT[k],p=Math.round(T2.p*(1+S.lg*1.5));h+='<div class="card"><div class="bd">'+T2.n+'<small>'+T2.d+'</small></div><button class="go" data-r="'+k+'"'+(S.money<p?' disabled':'')+'>'+fmt$(p)+'</button></div>'});
  if(S.buff)h+='<p class="sub" style="color:#8be28b">Next race boost: '+bon(S.buff)+'</p>'}
 const p=panel('SHOP',null,h,p=>{p.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{SHOPTAB=b.dataset.t;snd('select');refresh(p,panShop)});
  p.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{const id=b.dataset.g,G=GEAR[id];S.money-=G.p;S.own.push(id);S.wear[G.sl]=id;snd('kaching');toast('Bought and equipped: '+G.n);save();refresh(p,panShop)});
  p.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{const k=b.dataset.e,t=S.eq[k]||0;S.money-=EQP[t];S.eq[k]=t+1;snd('kaching');toast(EQ[k][t]+' installed in the gym!');save();refresh(p,panShop)});
  p.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const k=b.dataset.r,T2=TREAT[k];S.money-=Math.round(T2.p*(1+S.lg*1.5));if(T2.f)T2.f();if(T2.buff){S.buff=S.buff||{};for(const q in T2.buff)S.buff[q]=(S.buff[q]||0)+T2.buff[q]}snd('bite');toast(T2.n+': '+T2.d);save();refresh(p,panShop)})});return p}

/* Donut: stats and outfit */
function panGear(){const E=eff();let h='<img src="'+bigDonut()+'" style="width:'+U(64)+';align-self:center;image-rendering:pixelated">';
 h+='<div class="stats">'+STATS.map(([k,n,c])=>{const b=Math.floor(S.st[k]),e=Math.floor(E[k]);return '<span>'+n+' <span style="float:right;color:'+c+'">'+e+(e!==b?'<small style="font-size:.8em;color:#8be28b"> +'+(e-b)+'</small>':'')+'</span><i><b style="width:'+clamp(b,0,100)+'%;--c:'+c+'"></b>'+(e>b?'<s style="left:'+clamp(b,0,100)+'%;width:'+clamp(e-b,0,100-b)+'%"></s>':'')+'</i></span>'}).join('')+'</div>';
 SLOTS.forEach(([s,n])=>{const L=S.own.filter(id=>GEAR[id]&&GEAR[id].sl===s);h+='<p class="hd">'+n.toUpperCase()+'</p><div class="row" style="justify-content:flex-start">'+(L.length?'':'<span class="sub">Nothing yet</span>')+L.map(id=>'<button class="chip'+(S.wear[s]===id?' on':'')+'" data-w="'+id+'">'+GEAR[id].n+'</button>').join('')+'</div>'});
 if(S.spon){const P=SPON[S.spon],w=S.wear[GEAR[P.it].sl]===P.it;h+='<p class="sub" style="margin-top:'+U(2)+'">Sponsor: '+P.n+' &middot; '+(w?'wearing their gear (full pay)':'<span style="color:#ff9ccb">wear their gear for full pay</span>')+'</p>'}
 const p=panel('DONUT','Level '+S.lv+' &middot; '+S.wins+' wins in '+S.races+' races',h,p=>p.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{const id=b.dataset.w,G=GEAR[id];S.wear[G.sl]=S.wear[G.sl]===id?null:id;snd('item');save();refresh(p,panGear)}));return p}
function bigDonut(){const k='big'+JSON.stringify(S.wear);if(ICN[k])return ICN[k];return ICN[k]=mkc(40,30,()=>rdog(16,26,{c:'red',st:'stand',g:dGear(),nt:1})).toDataURL()}

/* skills */
function panSkill(){let h='<p class="sub">Skill points: <span style="color:#ffd86b">'+S.sp+'</span><br>Earn one every level. Each tree unlocks top to bottom.</p><div class="tree">';
 SKT.forEach(([tn,c,L])=>{h+='<div class="col" style="--c:'+c+'"><p class="tn">'+tn.toUpperCase()+'</p>';L.forEach(([id,n,d,cost],i)=>{const own=hasSk(id),can=!own&&(i===0||hasSk(L[i-1][0]))&&S.sp>=cost;
  h+='<button class="sk'+(own?' own':can?' can':'')+'" data-s="'+id+'" data-c="'+cost+'"'+(can?'':' disabled')+'>'+n+'<b>'+d+'</b><b>'+(own?'LEARNED':cost+' PT'+(cost>1?'S':''))+'</b></button>'});h+='</div>'});h+='</div>';
 const p=panel('SKILLS',null,h,p=>p.querySelectorAll('.sk.can').forEach(b=>b.onclick=()=>{S.sp-=+b.dataset.c;S.sk.push(b.dataset.s);snd('fanfare');save();refresh(p,panSkill)}));return p}

/* gym */
function panGym(){const n=GYM[S.gym+1];let h='<img src="'+gymThumb(S.gym)+'" style="width:'+U(90)+';align-self:center;image-rendering:pixelated;box-shadow:0 0 0 '+U(.8)+' #ffd86b">';
 h+='<p class="sub">'+GYM[S.gym].d+'<br>Training x'+GYM[S.gym].m+(S.gym>=4?' &middot; 4 actions a week':'')+'</p>';
 if(n)h+='<p class="hd">NEXT UPGRADE</p><div class="card"><img class="ic" src="'+gymThumb(S.gym+1)+'"><div class="bd">'+n.n+'<small>'+n.d+'<br>Training x'+n.m+'</small></div><button class="go" data-u="1"'+(S.money<n.p?' disabled':'')+'>'+fmt$(n.p)+'</button></div>';else h+='<p class="sub" style="color:#ffd86b">The Donut Dome is complete.</p>';
 h+='<p class="hd">EQUIPMENT</p><p class="sub" style="text-align:left">'+STATS.map(([k,nm])=>nm+': '+(S.eq[k]?EQ[k][S.eq[k]-1]:'none')).join('<br>')+'</p>';
 const p=panel('THE GYM',GYM[S.gym].n,h,p=>{const b=p.querySelector('[data-u]');if(b)b.onclick=()=>{S.money-=n.p;S.gym++;snd('fanfare');save();p.remove();gymUpgraded()}});return p}
function gymThumb(lv){return icon('gy'+lv,()=>cx.drawImage(gymArt(lv),0,-60),160,140)}

/* end of the week */
function endWeek(){const sp=S.spon?SPON[S.spon]:null;let pay=0;if(sp){const w=S.wear[GEAR[sp.it].sl]===sp.it;pay=Math.round(sp.pay*(w?1:.5)*(hasSk('magnet')?1.3:1));S.money+=pay}
 S.week++;S.ap=apMax();S.raced=0;S.fl.rest=0;const en0=S.en;S.en=clamp(S.en+50+S.gym*3,0,100);S.mood=clamp(S.mood+(68-S.mood)*.3,0,100);save();snd('chime');
 const lines=['Energy '+Math.round(en0)+' &rarr; '+Math.round(S.en),'Mood '+Math.round(S.mood)];if(pay)lines.unshift('<b>+'+fmt$(pay)+'</b> from '+sp.n);
 resultCard({title:'WEEK '+S.week,stars:-1,lines,sub:LG[S.lg].n,btn:'Let’s go',then:()=>weekStory()})}
function afterAny(){hub();checkGifts()}
/* ---------------- dialogue ---------------- */
function talk(lines,then,scene){if(scene)go(sceneScr(scene));let i=-1,typ=null,full='';
 const cat=el('<div style="position:absolute;inset:0"></div>'),box=el('<div class="dlg fadein"><div class="nm"></div><div class="tx"></div><div class="chs"></div><span class="nx">&#9660;</span></div>');ui.appendChild(cat);ui.appendChild(box);
 const nm=box.querySelector('.nm'),tx=box.querySelector('.tx'),chs=box.querySelector('.chs'),nx=box.querySelector('.nx');
 function show(){const L=lines[i];if(L.a)L.a();nm.textContent=L.n||'';nm.style.color=NC2[L.n]||(L.n?'#e0468c':'#8a7aa8');nm.style.display=L.n?'':'none';full=L.t;tx.textContent='';chs.innerHTML='';nx.style.display='none';let k=0;
  clearInterval(typ);typ=setInterval(()=>{k++;tx.textContent=full.slice(0,k);if(k%2==0&&L.n)snd('blip');if(k>=full.length){clearInterval(typ);typ=null;done()}},22)}
 function done(){const L=lines[i];if(L.c){nx.style.display='none';L.c.forEach(c=>{const b=el('<button>'+c.l+'</button>');b.onclick=e=>{e.stopPropagation();snd('confirm');if(c.f)c.f();adv(1)};chs.appendChild(b)})}else nx.style.display=''}
 function adv(force){if(typ){clearInterval(typ);typ=null;tx.textContent=full;done();return}if(lines[i]&&lines[i].c&&!force)return;i++;if(i>=lines.length){clearInterval(typ);cat.remove();box.remove();if(then)then();return}snd('adv');show()}
 cat.onclick=()=>adv();box.onclick=()=>adv();adv()}
function sceneScr(fn){return {enter(){},draw:fn}}
const D0={c:'red',g:null};
/* living room with the TV */
function livingRoom(st){return t=>{r(0,0,160,288,'#e8d8c8');for(let x=0;x<160;x+=16)r(x,0,1,190,'#dccab8');r(0,190,160,98,'#b8865a');for(let y=196;y<288;y+=10)r(0,y,160,1,'#a8764a');
 r(14,40,40,50,'#7ab8e8');r(14,40,40,50,'rgba(14,8,40,.55)');r(13,39,42,2,'#fff6e0');r(13,90,42,2,'#fff6e0');r(33,40,2,50,'#fff6e0');disc(42,52,3,'#fff6d0',1);
 r(96,120,56,6,'#5a3a2a');r(98,126,4,64,'#4a2a1a');r(146,126,4,64,'#4a2a1a');r(100,66,48,46,'#1a1a22');r(102,68,44,40,'#3a8a3a');r(102,68,44,14,'#7ab8e8');r(102,96,44,12,'#c8503a');
 for(let i=0;i<2;i++){const x=102+((t*30+i*20)%44);rdog(x,104-i*4,{c:i?'tri':'red',st:'run',ph:t*14+i*2,sz:.5})}ptxt('LIVE',104,70,'#ff4a4a');r(122,112,4,8,'#2a2a2a');
 r(4,170,70,30,'#c2417a');r(4,166,70,8,'#d8508a');r(2,172,6,28,'#a8306a');r(70,172,6,28,'#a8306a');
 ppl('abi',24,188,t,'r');ppl('hunter',46,190,t,'r');
 const z=st.zoom&&t-st.zoom<1.6;if(z){const a=(t-st.zoom)/1.6*Math.PI*4;rdog(100+Math.cos(a)*22,232+Math.sin(a)*12,{c:'red',st:'run',ph:t*16,dir:Math.sin(a)>0?'l':'r'})}else rdog(110,236,{c:'red',st:'sit',tongue:1});
 rdog(140,246,{c:'red',st:'lie',bow:1,sz:.95,sleep:1})}}
/* a venue with a cast standing at the start line */
function venueScene(ven,cast,st){return t=>{venueDraw(ven,-30,t,st&&st.hype);if(st&&st.pod){r(48,200,24,24,'#c8c4d0');r(72,190,24,34,'#ffd86b');r(96,206,24,18,'#c87a3a');r(48,200,72,1,'rgba(255,255,255,.4)');ptxt('1',84,206,'#5a2148',2,'c');ptxt('2',60,212,'#5a2148',1,'c');ptxt('3',108,214,'#5a2148',1,'c')}venueFg(ven,-30);(cast||[]).forEach(c=>{if(c.k==='dog')rdog(c.x,c.y,{c:c.c,g:c.g||{},st:c.st||'stand',sz:c.sz,dir:c.dir,bow:c.bow,ph:t*14,tongue:c.tongue});else if(c.k==='gus')gus(c.x,c.y,t,c.dir);else ppl(c.k,c.x,c.y,t,c.dir)});
 if(st&&st.pod){
  for(let i=0;i<24;i++){const x=(i*37+Math.floor(t*40)*(i%3+1))%160,y=(i*53+t*60*(1+i%4))%200;r(x,y,2,2,['#ffd86b','#ff7eb6','#7ee8fa','#8be28b'][i%4])}}}}
function homeScene(st){return t=>{skyPaint('dusk');r(0,140,160,148,'#4a8a3a');for(let y=140;y<288;y+=12)r(0,y,160,6,'#52923e');for(let x=0;x<160;x+=10){r(x,112,8,30,'#a87440');r(x,112,8,1,'#c8945a')}
 r(96,186,40,4,'#8a5a3a');r(100,190,2,14,'#6a4a2a');r(130,190,2,14,'#6a4a2a');r(110,170,12,6,'#ffd86b');r(114,176,4,6,'#c89a20');r(108,182,16,4,'#c89a20');r(113,166,6,4,'#ffd86b');
 for(let i=0;i<10;i++){const x=(i*41)%160,y=150+((i*29)%40);const a=.4+Math.sin(t*2+i)*.4;cx.globalAlpha=a;r(x,y,1,1,'#ffe8a0');cx.globalAlpha=1}
 ppl('abi',58,224,t,'r');ppl('hunter',38,222,t,'r');rdog(78,236,{c:'red',st:st.flop?'lie':'sit',g:{head:'crown'},tongue:1});rdog(110,240,{c:'red',st:'lie',bow:1,sz:.95,sleep:1})}}
const gymSc=()=>t=>{HUB.draw(t)};

/* ---------------- story beats ---------------- */
function storyIntro(){const st={};MUS='cozy';
 talk([{n:'',t:'One quiet Sunday night...'},{n:'Abigail',t:'Hunter. Come look at Donut.'},{n:'Hunter',t:'Is she... watching TV?'},
  {n:'',t:'On the screen: the World Corgi Racing Championship. Tiny legs. Enormous speed.'},{n:'Abigail',t:'Donut. Are you watching corgi racing?'},
  {n:'Donut',t:'*ears straight up* *butt wiggling at maximum power*',a:()=>{st.zoom=tm;snd('whoosh')}},{n:'Hunter',t:'Oh no. She thinks she can do that.'},
  {n:'Abigail',t:'Babe. I think she CAN do that.'},{n:'Hunter',t:'There’s an amateur race at the dog park this Saturday. First entry is free...'},
  {n:'Abigail',t:'Then it’s settled. Donut is going to be a racer!'},{n:'Crumpet',t:'*does not wake up*'}],
  ()=>{hub();talk([{n:'Abigail',t:'Okay Donut, here’s the plan. Every week you get a few actions: train, rest, or do side gigs.'},
   {n:'Abigail',t:'Then on race day, pick a race. TAP to sprint, SWIPE UP to jump, SWIPE DOWN to duck.'},{n:'Hunter',t:'And when a squirrel shows up, HOLD your finger down so she stays focused.'},
   {n:'Abigail',t:'Win races, earn league points, and beat the boss corgis to move up. Next stop: the world!'}],()=>hubUI())},livingRoom(st))}
function preBoss(ev,then){const B=BOSS[ev.boss],V=VEN[ev.ven],st={hype:1};MUS='tense';
 const cast=[{k:'buzz',x:24,y:196,dir:'r'},{k:'dog',c:'red',g:dGear(),x:72,y:216},{k:'dog',c:B.coat,g:B.gear,sz:B.sz,x:112,y:200,dir:'l'}];if(S.fl.gus)cast.push({k:'gus',x:140,y:236,dir:'l'});
 const react=pick(['*sneezes. Confidently.*','*does one small zoomie*','*stares straight ahead. Locked in.*','*sits. Then stands. Then sits again.*']);
 const L=[{n:'Buzz',t:'LADIES AND GENTLEMEN, welcome to the '+V.n+'!'},{n:'Buzz',t:'In lane three... '+B.w.replace(/\.$/,'')+'... it’s '+B.n.toUpperCase()+'!'},{n:B.h,t:B.t},{n:'Donut',t:react}];
 if(ev.boss==='fluff')L.splice(2,0,{n:'Buzz',t:'The undefeated world champion versus the park dog from Missouri. You could not WRITE this!'});
 if(ev.boss==='chad')L.push({n:'Coach Gus',t:'He’s gonna bark at you mid-race. When he does: HOLD. Don’t you dare look at him.'});
 talk(L,then,venueScene(ev.ven,cast,st))}
function afterRace(ev,pl){const q=[];const B=ev.boss?BOSS[ev.boss]:null,win=pl===1;
 if(S.races===1)q.push(()=>talk([{n:'Abigail',t:win?'She WON?! Her very first race! Our girl is a RACER!':'Her very first race ever. Hunter, I’m so proud of her I could cry.'},{n:'Hunter',t:win?'Did you see her ears? They were FLAT. She was flying.':'Did you see her ears? Next week she’s gonna fly.'}],next));
 if(B){if(win)q.push(()=>talk([{n:B.h,t:{biscuit:'That’s okay Biscuit. You’re still the best at eating socks.',waddles:'Hmph. Sir Waddles shall return. Eventually. At his own pace.',tina:'She... she passed Tina? Nobody passes Tina.',loaf:'Big Mike respects that. The Loaf respects that.',pepper:'Pepper is going to be angry about this for a very long time.',
   chad:'Bro. BRO. That’s... okay that was actually sick. Respect.',duchess:'Well. Duchess has never been... second. How novel.',comet:'Hey, Kansas City! Give it up for the Missouri girl!',kenji:'Sato-san bows. Kenji bows. Donut... sniffs Kenji. That counts.',baguette:'Ze croissant was worth it. But zis dog... magnifique.',matilda:'Fair dinkum. She beat Matilda on SAND. Never seen it.',fluff:'...Well. Jolly good show, park dog.'}[ev.boss]}],next));
  else q.push(()=>talk([{n:S.fl.gus?'Coach Gus':'Abigail',t:pick(['We’ll get ’em next week. Back to work.','Close one. Train up and come back stronger.','That one stung. Good. Remember how it feels.'])}],next));
  if(!S.fl.gus)q.push(()=>meetGus(win));
  }
 if(win&&!S.spon&&S.lg===0&&S.wins>=3)q.push(()=>offer('pupcup',[{n:'',t:'A lady in a pink apron runs over with a clipboard.'},{n:'',t:'"Hi! I’m with Pup-Cup Treats! We’d love Donut to wear our bandana. $40 a week!"'}]));
 if(win&&S.lg===2&&!S.fl.kib){S.fl.mjw=(S.fl.mjw||0)+1;if(S.fl.mjw>=2){S.fl.kib=1;q.push(()=>offer('kibble',[{n:'Vivian',t:'Royal Kibble called. They want Donut. $2,600 a week. Even I’m impressed.'}]))}}
 if(win&&S.lg===3&&!S.fl.cout&&!S.fl.champ){S.fl.cout=1;q.push(()=>offer('couture',[{n:'Vivian',t:'Corgi Couture. Paris. They want her on the runway AND the racetrack. $9,500 a week, darling.'}]))}
 if(B&&win&&S.boss>=LG[S.lg].boss.length&&!S.fl.champ)q.push(()=>S.lg<3?promote():ending());
 let k=0;function next(){const f=q[k++];if(f)f();else afterAny()}next()}
function offer(id,lines){const P=SPON[id];talk(lines.concat([{n:'',t:P.n+': '+fmt$(P.pay)+' a week. Donut wears the '+GEAR[P.it].n+' for full pay.',c:[{l:'Sign the deal',f:()=>{S.spon=id;if(!S.own.includes(P.it))S.own.push(P.it);S.wear[GEAR[P.it].sl]=P.it;save();toast('New sponsor: '+P.n)}},{l:'No thanks',f:()=>{S.mood=clamp(S.mood+5,0,100);save()}}]}]),()=>afterAny(),gymSc())}
function meetGus(win){S.fl.gus=1;save();talk([{n:'',t:'Back home, someone is waiting by the gate. Low to the ground. Very long ears.'},
 {n:'Coach Gus',t:'Name’s Gus. Coach Gus. I raced the circuit back in ’87. Fastest basset hound in the Ozarks.'},{n:'Hunter',t:'Is a basset hound... fast?'},{n:'Coach Gus',t:'No. That’s what made it impressive.'},
 {n:'Coach Gus',t:win?'Your pup beat Biscuit on day one. Raw talent. Zero plan. That’s where I come in.':'Your pup’s got wheels. No plan. Biscuit ate her lunch today. That’s where I come in.'},
 {n:'Coach Gus',t:'Train smart. Rest when she’s tired. Buy her real equipment when you can. And for the love of kibble, watch the squirrels.'},{n:'Abigail',t:'Welcome to the team, Coach.'}],()=>afterAny(),gymSc())}
function promote(){const from=S.lg;S.lg++;S.boss=0;S.lp=0;S.ap=apMax();save();const L=LG[S.lg];MUS='race';
 const lines={1:[{n:'Buzz',t:'Folks, the Amateur League has a new champion! DONUT is moving up to the MINOR LEAGUE!'},{n:'Coach Gus',t:'Ballparks. County fairs. Real crowds. Real money. Real squirrels.'},{n:'Abigail',t:'Minor league, here we come!'}],
  2:[{n:'Buzz',t:'She did it! Donut is headed to THE MAJOR LEAGUE! Stadiums! Halftime shows! Prime time!'},{n:'Hunter',t:'Abby. She’s gonna run at an NFL game.'},{n:'Abigail',t:'I need a bigger GO DONUT sign.'},{n:'Crumpet',t:'*stretches* *looks at the track* *looks at Donut* ...!'}],
  3:[{n:'Buzz',t:'Ladies and gentlemen... Donut has qualified for the GLOBAL RANKINGS! She enters the world at number one hundred!'},{n:'',t:'Across the ocean, on a velvet cushion, Lord Fluffington watches the broadcast.'},{n:'Sir Nigel Pomfrey',t:'A park dog. How quaint. Lord Fluffington has not lost in four years.'},{n:'Coach Gus',t:'Then he’s due.'}]}[S.lg];
 talk(lines.concat([{n:'',t:'NOW ENTERING: '+L.n.toUpperCase()+'. New gear in the shop!'}]),()=>{S.week++;S.raced=0;save();weekStory()},venueScene(LG[from].boss.slice(-1)[0][1],[{k:'buzz',x:24,y:196,dir:'r'},{k:'dog',c:'red',g:dGear(),x:84,y:200,st:'cheer'},{k:'abi',x:132,y:222,dir:'l'},{k:'hunter',x:148,y:224,dir:'l'}],{hype:1,pod:1}))}
function weekStory(){const q=[];
 if(S.lg===1&&!S.fl.viv){S.fl.viv=1;q.push(()=>talk([{n:'',t:'Monday morning. A shiny car pulls up to the gym. Very shiny. Too shiny.'},{n:'Vivian',t:'Vivian Vance-Paws. I run the Minor League. And I make stars.'},
  {n:'Vivian',t:'Zoomies Energy wants Donut. $450 a week. She just has to wear... this.'},{n:'',t:'She holds up a neon green racing suit. It is very, very bright.'},{n:'Abigail',t:'(It’s hideous. But money is tight...)'},
  {n:'Vivian',t:'So? Do we have a deal?',c:[{l:'Take the deal ($450/week)',f:()=>{S.spon='zoomies';S.own.push('neon');S.wear.body='neon';save();toast('New sponsor: Zoomies Energy')}},{l:'She’s not wearing that',f:()=>{S.mood=clamp(S.mood+15,0,100);S.fl.noviv=1;save()}}]},
  {n:'',t:'',a:()=>{}}].filter(l=>l.t),()=>{if(S.fl.noviv)talk([{n:'Abigail',t:'We’ll make it on our own. Right, Donut?'},{n:'Donut',t:'*happy sneeze*'}],next,gymSc());else next()},gymSc()))}
 if(S.lg===2&&S.boss>=1&&!S.fl.inj){S.fl.inj=1;S.fl.rest=1;q.push(()=>talk([{n:'',t:'Monday. Donut hops off the couch... and holds up one front paw.'},{n:'Abigail',t:'Hunter. She’s limping.'},{n:'',t:'A trip to the vet. A sprained paw. Nothing broken, but she needs to rest.'},
  {n:'Vivian',t:'The Comet race is in two weeks. Sponsors are watching. Can she run hurt?'},{n:'Abigail',t:'No. She’s not a racer first. She’s our dog first.'},{n:'Hunter',t:'She sits out this week. End of discussion.'},
  {n:'',t:'That night, Abigail ties a little bracelet onto Donut’s collar.'},{n:'Abigail',t:'For luck. And so you know we love you, win or lose.'},{n:'',t:'Got: Abigail’s Bracelet. Donut rests this week (no race).'}],()=>{if(!S.own.includes('bracelet'))S.own.push('bracelet');if(!S.wear.charm)S.wear.charm='bracelet';S.mood=100;save();next()},gymSc()))}
 if(S.lg===2&&!S.fl.relay){S.fl.relay=1;q.push(()=>talk([{n:'',t:'Crumpet walks right up to the starting line Gus painted in the yard. And lies down on it.'},{n:'Hunter',t:'Does she... want to race?'},{n:'Coach Gus',t:'There’s a Doubles Relay Showcase this season. Sister runs first, Donut runs the anchor leg.'},{n:'Crumpet',t:'*rolls over. Ready.*'},{n:'',t:'The Doubles Relay is open on the race list!'}],next,gymSc()))}
 let k=0;function next(){const f=q[k++];if(f)f();else afterAny()}next()}
function checkGifts(){if((S.fl.plays||0)>=3&&!S.own.includes('chew')&&on&&scr===HUB){S.own.push('chew');save();talk([{n:'',t:'Crumpet waddles over and drops her favourite chew toy at Donut’s feet.'},{n:'Abigail',t:'Oh my gosh. Crumpet is giving Donut her TOY. That’s her most prized possession.'},{n:'',t:'Got: Crumpet’s Chew Toy (Charm: +4 Focus, +2 Stamina).'}],()=>hubUI())}}
function gymUpgraded(){hub();const n=GYM[S.gym].n;talk([{n:'',t:'Welcome to '+n+'!'},{n:S.fl.gus?'Coach Gus':'Hunter',t:{2:'A real home gym. Well. A garage. With mats. It counts.',3:'My old gym. I never thought I’d see a corgi in here. Feels right.',4:'Now THIS is a training facility. One more workout every week, starting now.',5:'A dome. With a giant donut on it. I’ve seen everything now.'}[S.gym]}],()=>hubUI())}
function champPhoto(h){try{const c=mkc(160,288,()=>homeScene({flop:0})(1));const p=mkc(120,120,(w,hh,g)=>g.drawImage(c,22,126,120,120,0,0,120,120));ALB.put('crzchamp',p)}catch(e){}}
function ending(){S.fl.champ=1;save();const st={hype:1,pod:1};MUS='race';
 talk([{n:'Buzz',t:'She’s done it! DONUT! IS! THE! WORLD! CHAMPION!'},{n:'',t:'The stadium in Newcastle shakes. Three fans in very large orange shirts are crying.'},{n:'Sir Nigel Pomfrey',t:'Lord Fluffington... would like to present the crown.'},
  {n:'',t:'Lord Fluffington walks over. Bows low. And sets the Champion’s Crown on Donut’s head.'},{n:'Coach Gus',t:'Fastest basset in the Ozarks, ’87. Coach of the fastest corgi in the world. I can retire happy.'}],()=>{
  const h={flop:0};MUS='sunset';talk([{n:'',t:'That night. Back home. The trophy sits on the patio table.'},{n:'Hunter',t:'The fastest corgi in the whole world.'},{n:'Abigail',t:'And she still just wants to be on the couch with us.'},
   {n:'',t:'Donut waddles over... and flops right onto Abigail’s shoes. Just like the day she picked you.',a:()=>{h.flop=1;snd('bump')}},{n:'Crumpet',t:'*does not move*'},{n:'Abigail',t:'Good girl, Donut. Our good, good girl.'},
   {n:'',t:'CORGI RACERS: COMPLETE. Donut is the World Champion! A new photo is in your album, and you can keep racing anytime.',a:()=>champPhoto(h)}],()=>{if(!S.own.includes('crown'))S.own.push('crown');save();afterAny()},homeScene(h))},
  venueScene('final',[{k:'buzz',x:24,y:196,dir:'r'},{k:'dog',c:'red',g:{head:'crown'},x:84,y:190,st:'cheer'},{k:'dog',c:'fluff',g:{body:'royal'},x:60,y:200,dir:'r'},{k:'abi',x:132,y:222,dir:'l'},{k:'hunter',x:148,y:224,dir:'l'},{k:'gus',x:22,y:222,dir:'r'}],st))}
try{C4CAP.crzchamp='WORLD CHAMPION'}catch(e){}
/* ---------------- entry points ---------------- */
return {get on(){return on},open,close,mus,_S:()=>S,_go:go,_race:ev=>{mount();load();on=1;root.style.display='block';lastTs=performance.now();requestAnimationFrame(frame);go(raceScreen(ev))},_mg:k=>{mount();load();on=1;root.style.display='block';lastTs=performance.now();requestAnimationFrame(frame);go(mgShell(MGS[k]))},_dbg:{rdog,gus,mkc,venueArt,venueDraw,venueFg,obsDraw,disDraw,gymArt,S:()=>S,save,hub,raceScreen,MGS,go,talk,ending,promote}};
})();
