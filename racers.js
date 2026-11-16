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
function defSave(){return {v:1,tutS:1,tips:{},week:1,lg:0,money:0,lv:1,xp:0,sp:0,st:{spd:14,acc:12,sta:9,agi:10,foc:6,cha:15},en:100,mood:75,ap:3,raced:0,gym:1,eq:{},own:['bandana'],wear:{head:null,body:'bandana',paws:null,charm:null},sk:[],bag:{},boss:0,lp:0,rp:0,wins:0,races:0,spon:null,fl:{},best:{},seen:{}}}
let S=defSave();
/* Saving: every change is written within half a second, and again whenever the app is hidden or closed.
   Two copies are kept (main + backup, each stamped with a time) and the newer good one is loaded. */
const SKB=SK+'_bak';let lastJ='',saveWarned=0,saveT=0;
function readSave(k){try{const o=JSON.parse(localStorage.getItem(k)||'null');return o&&o.v===1&&typeof o==='object'?o:null}catch(e){return null}}
function load(){const a=readSave(SK),b=readSave(SKB),o=a&&b?((b.ts||0)>(a.ts||0)?b:a):(a||b);
 if(o){S=Object.assign(defSave(),o);if(o.tutS==null)S.tutS=(o.races||0)>0?5:1;S.st=Object.assign(defSave().st,o.st);S.wear=Object.assign(defSave().wear,o.wear)}else S=defSave();
 lastJ=snap();try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}}
const snap=()=>{const {ts,...rest}=S;return JSON.stringify(rest)};
function save(){try{moodFloor()}catch(e){}S.ts=Date.now();const j=JSON.stringify(S);let ok=0;try{localStorage.setItem(SK,j);ok=1}catch(e){}try{localStorage.setItem(SKB,j);ok=1}catch(e){}
 if(ok)lastJ=snap();else if(!saveWarned&&ui){saveWarned=1;toast('Couldn’t save! Phone storage may be full.')}}
function autosave(force){if(S&&(force||snap()!==lastJ))save()}
const flush=()=>{try{if(root)autosave(1)}catch(e){}};
addEventListener('pagehide',flush);addEventListener('beforeunload',flush);addEventListener('blur',flush);document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});document.addEventListener('freeze',flush);

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
#crz .card .ic{flex:none;width:${u(15)};height:auto;image-rendering:pixelated}
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
#crz .fadein{animation:zfade .35s both}
#crz .coach{position:absolute;inset:0;z-index:40}#crz .coach.dim{background:rgba(10,4,30,.62)}
#crz .coach .hole{position:absolute;display:none;border-radius:${u(2.4)};box-shadow:0 0 0 9999px rgba(10,4,30,.62),0 0 0 ${u(.8)} #ffd86b,0 0 ${u(6)} ${u(1)} rgba(255,216,107,.8);animation:zglow 1.2s ease-in-out infinite;pointer-events:none}
@keyframes zglow{50%{box-shadow:0 0 0 9999px rgba(10,4,30,.62),0 0 0 ${u(1.2)} #fff6e0,0 0 ${u(9)} ${u(2)} rgba(255,216,107,.95)}}
#crz .coach .hole.nudge{animation:zglow 1.2s ease-in-out infinite,znudge .35s}@keyframes znudge{25%{transform:translateX(${u(-1.5)})}75%{transform:translateX(${u(1.5)})}}
#crz .coach .tip{position:absolute;left:${u(5)};right:${u(5)};background:#fff;border:${u(.9)} solid #2b1830;border-radius:${u(5)};padding:${u(3.4)} ${u(4.4)} ${u(2.4)};color:#2b1830;font-size:${u(3.4)};line-height:1.7;box-shadow:${u(1)} ${u(1.6)} 0 rgba(10,4,30,.45)}
#crz .coach .tip.pop{animation:zpopt .22s ease-out}@keyframes zpopt{0%{transform:translateY(${u(2)}) scale(.96);opacity:.4}100%{transform:none;opacity:1}}
#crz .coach .tip .nm{font-size:${u(3)};margin-bottom:${u(1)}}#crz .coach .tip b{font-weight:400;color:#c2417a}
#crz .coach .tip .ft{display:flex;justify-content:space-between;align-items:center;margin-top:${u(2.2)}}#crz .coach .skip{font-size:${u(2.3)};background:none;color:#8a7aa8;padding:${u(1)} 0}#crz .coach .go{font-size:${u(2.4)};color:#e0468c}@keyframes zfade{0%{opacity:0}}
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
function frame(ts){if(!on)return;let dt=(ts-lastTs)/1000||0;lastTs=ts;dt=Math.min(dt,.05);tm+=dt;saveT+=dt;if(saveT>.5){saveT=0;try{autosave()}catch(e){}}
 try{if(scr&&scr.upd)scr.upd(dt);withCx(bg,()=>{r(0,0,BW,BH,'#0e0828');if(scr&&scr.draw)scr.draw(tm)})}catch(e){console.error(e)}
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
 speedsuit:{n:'Speedy Paws Racing Suit',sl:'body',t:9,p:0,b:{spd:6,acc:4},lk:'silkB'},
 cupT:{n:'The Donut Cup',sl:'charm',t:9,p:0,b:{spd:4,acc:4,sta:4,agi:4,foc:4,cha:4},ic:'gbone',boss:1},
 crown:{n:'The Champion’s Crown',sl:'head',t:9,p:0,b:{spd:6,acc:6,sta:6,agi:6,foc:6,cha:6},lk:'crown',boss:1}};
const SLOTS=[['head','Head'],['body','Body'],['paws','Paws'],['charm','Charm']];

/* training equipment, three tiers per stat */
const EQ={spd:['Treadmill','Pro Treadmill','Turbo Treadmill'],acc:['Ball Launcher','Sled Pull','Starting Blocks'],sta:['Kiddie Pool','Lap Pool','Hydro Treadmill'],
 agi:['Cone Set','Weave Poles','Agility Course'],foc:['Squirrel Plush','Meditation Mat','Distract-O-Tron'],cha:['Mirror','Ring Light','Photo Studio']};
const EQP=[80,900,7000],EQG=[1,2,4],EQM=[1,1.35,1.75,2.2];
/* each gym sets how high Donut's stats can be trained, and opens up something new to do */
const GYM=[null,{n:'The Backyard',p:0,cap:25,d:'A tire, some cones and a lot of heart.',u:['Five training games','Rest, playtime and side gigs','A water bowl (tap it)']},
 {n:'Garage Gym',p:400,cap:40,d:'Rubber mats and a space heater. Very official.',u:['Crumpet becomes Donut’s training buddy (workouts lift Mood)','Weekly scrimmage with Crumpet','Workout plan: auto-train in one tap','A pegboard of Donut’s ribbons and a zoomies bell','Pick a perk']},
 {n:'Gus’s Gym',p:2500,cap:58,d:'Coach Gus’s old gym. Smells like champions.',u:['Coach Gus’s Weekly Drill (double gains)','Gus’s scouting notebook for every boss','Race-day game plans','Gus’s old-timer stories (permanent bonuses)','Pick a perk']},
 {n:'Pro Facility',p:15000,cap:75,d:'Indoor track, real lights, a real kitchen.',u:['+1 action every week','The Nutrition Kitchen and the Recovery Pool','Time trials against Donut’s ghost','The sports scientist','The sponsor lounge: +25% sponsor pay and a new sponsor','Pick a perk']},
 {n:'The Donut Dome',p:60000,cap:99,d:'A dome. With a giant donut on top. Obviously.',u:['Photo Shoot training, the Trophy Room and the Merch Stand','Rematch any boss, and Legend skills','THE DONUT CUP tournament','The wardrobe: recolour Donut’s gear','A visit from Donut’s biggest fans','Pick a perk']}];
/* one perk to choose with each new gym */
const PERKS={2:[['Early Riser','+5 Energy at the end of every week'],['Prize Purse','+10% prize money']],3:[['Thick Skin','Mood never drops below 40'],['Quick Study','+15% XP from everything']],
 4:[['Deep Lungs','+8 Stamina in every race'],['Big Paydays','+15% sponsor pay']],5:[['Overtime','+1 action every week'],['Showstopper','Zoomies meter fills 25% faster']]};
const perk=(lv,c)=>!!(S.perk&&S.perk[lv]===c);
/* Coach Gus's old-timer stories, each worth a little permanent bonus */
const STORIES=[['spd','The ’87 Ozark Dash. Dead last at the halfway mark. Then I smelled a ham sandwich at the finish line. Never ran faster in my life.','Picture the sandwich, kid.'],
 ['foc','I lost a race to a squirrel once. One squirrel. So I stared at a tree every morning for a whole summer. Never lost to a squirrel again.','Eyes on the line.'],
 ['sta','Back then we trained by chasing the mail truck. Six miles, every day. The mailman retired early. Said it was the stress.','Long legs aren’t everything. Big lungs are.'],
 ['agi','There was a course with a creek right through the middle. Everybody went around. I went through. Lost my hat. Won the race.','Sometimes straight through is the fastest way.'],
 ['acc','My first coach made me start every single race from a sit. Sit. Wait. GO. A thousand times. You don’t think, you just go.','Sit. Wait. GO.'],
 ['cha','The crowds loved me. Mostly the hat. I had a little hat. People still write to me about the hat.','Give the people a show.']];
const capOf=()=>GYM[S.gym].cap;
/* the Nutrition Kitchen's menu */
const MEALS=[['salmon','Salmon & Sweet Potato Bowl',{spd:8,sta:8}],['chicken','Chicken & Rice Power Plate',{acc:8,agi:8}],['blue','Blueberry Pupcakes',{foc:10,cha:6}],['feast','The Champion’s Feast',{spd:5,acc:5,sta:5,agi:5,foc:5,cha:5}]];
const meal$=()=>[200,200,600,3500][S.lg];

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
const SKT=[['Sprinter','#ff7e7e',[['quick','Quick Feet','Accelerate 15% faster',1],['rocket','Rocket Start','Perfect starts launch twice as hard',1],['wind','Second Wind','Once a race, an empty tank refills halfway',2],['after','Afterburner','+6% top speed in the final stretch',2],['turbo','Turbo Zoomies','Zoomies last twice as long and hit harder',3],['lgS','LEGEND: Comet Legs','+5% top speed for the whole race',4,1]]],
 ['Tactician','#7ee8fa',[['light','Light Paws','Wider jump window, fewer clipped hurdles',1],['pacer','Pacer','Sprinting uses 20% less stamina',1],['iron','Iron Focus','Ignore distractions 40% faster',2],['draft','Draft Slip','+7% speed tucked in behind a rival',2],['shake','Shake It Off','Stumbles cost half as much',3],['lgT','LEGEND: Perfect Line','Never trips: missed obstacles only slow her a little',4,1]]],
 ['Superstar','#ff9ccb',[['crowd','Crowd Pleaser','Zoomies meter fills 30% faster',1],['fan','Fan Favorite','+20% race winnings',1],['show','Showboat','Perfect jumps give a speed pop',2],['magnet','Sponsor Magnet','+30% sponsor and gig pay',2],['star','Star Power','Zoomies refill stamina and the crowd roar rattles rivals',3],['lgP','LEGEND: Born Star','Every race starts with a full Zoomies meter',4,1]]]];
const hasSk=k=>S.sk.includes(k);

/* sponsors and side gigs */
const SPON={speedy:{n:'Speedy Paws Athletic',pay:7000,it:'speedsuit',lg:2},pupcup:{n:'Pup-Cup Treats',pay:40,it:'pupband',lg:0},zoomies:{n:'Zoomies Energy',pay:450,it:'neon',lg:1},kibble:{n:'Royal Kibble',pay:2600,it:'kibband',lg:2},couture:{n:'Corgi Couture',pay:9500,it:'couture',lg:3}};
const GIGS=[[0,'Kid’s birthday party',50,0],[0,'Farmers’ market mascot',90,24],[1,'Pet store grand opening',420,32],[1,'Local TV morning show',750,42],
 [2,'Dog food commercial',3200,52],[2,'Halftime meet & greet',4800,62],[3,'Paris perfume ad',12500,72],[3,'Tokyo café guest star',16000,82]];

/* people in cutscenes */
const NC2={Abigail:'#c2417a',Hunter:'#d8352f','Coach Gus':'#8a5a2a',Buzz:'#e8a020',Vivian:'#7a2fe0',Crumpet:'#e0903a',Donut:'#e0903a','Paws & Effect':'#2a6ad8'};
/* ---------------- racing corgi sprite ----------------
   o: c coat, st run|jump|duck|trip|sit|stand|lie|cheer|swim, ph gait phase, g gear looks, dir, sz, jy, tongue */
const gC=(g,lk)=>{const sl=lk.startsWith('boot')?'paws':lk.startsWith('sweat')?'head':'body';return (g&&g.tint&&g.tint[sl])||GCOL[lk]};
const GCOL={bandR:'#d8352f',bandB:'#2a6ad8',bandG:'#3aa84a',bandY:'#e8b820',bandW:'#ff7eb6',silkP:'#e0468c',silkR:'#d8352f',silkB:'#2a6ad8',silkG:'#e8b820',
 capeR:'#d8352f',capeP:'#c2417a',boot:'#2a6ad8',bootR:'#d8352f',bootS:'#c8a060',bootK:'#3a3a4a',bootG:'#ffd040',sweat:'#ff4a6a',sweatB:'#2a6ad8'};
function rdog(x,y,o){const C=typeof o.c==='string'?COATS[o.c]:o.c,st=o.st||'run',g=o.g||{},z=o.sz||1;x=Math.round(x);y=Math.round(y);
 const L=Math.round(18*z),H=z>1?8:z<.9?6:7,f4=st==='run'?((Math.floor(o.ph||0)%4)+4)%4:-1,air=f4===1?1:0,jy=Math.round(o.jy||0);
 const sit=st==='sit',lie=st==='lie',duck=st==='duck'||st==='trip',swim=st==='swim';
 if(!swim&&!o.ns)ell(x,y,Math.round(L/2+1),1,'#000',.2*(jy>0?Math.max(.35,1-jy/26):1));
 cx.save();if(o.dir==='l'){cx.translate(2*x+1,0);cx.scale(-1,1)}
 if(o.al!=null)cx.globalAlpha=o.al;
 const lg=duck?2:lie?0:4,yy=y-jy-air-(st==='cheer'?Math.round(Math.abs(Math.sin((o.ph||0)*1.6))*4):0),by=yy-lg;
 const W2=C.w,FL='#e8dccb',boot=g.paws?(gC(g,g.paws)||'#2a6ad8'):null;
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
 const lk=g.body;if(lk&&sit)sitGear(x,yy,lk,g);
 if(lk&&!sit){const hh=lie?5:swim?4:duck?H-1:H,top=lie||swim?yy-5:by-hh;
  if(lk.startsWith('band')){const c=gC(g,lk)||'#d8352f',nx=x+Math.round(L/2)-5;r(nx,top+2,5,1,c);r(nx+1,top+3,3,1,c);r(nx+2,top+4,1,1,c);r(nx+1,top+2,1,1,'#fff6e0')}
  else if(lk.startsWith('silk')){const c=gC(g,lk);r(x-5,top,9,4,c);r(x-5,top,9,1,sh(c,1.2));r(x-2,top+1,3,2,'#fff6e0')}
  else if(lk==='harn'){r(x+3,top,2,hh,'#ff7eb6');r(x-3,top+2,8,1,'#ff7eb6');r(x+3,top+1,1,1,'#ffd86b')}
  else if(lk==='neon'){r(bx0,top,L,hh-2,'#b8ff3a');r(bx0,top+2,L,1,'#ff3ad8');r(bx0+2,top+4,L-4,1,'#ff3ad8')}
  else if(lk==='sweater'){r(bx0+1,top,L-3,hh-1,'#c84a5a');r(bx0+1,top+2,L-3,1,'#fff6e0');r(bx0+1,top+4,L-3,1,'#fff6e0')}
  else if(lk==='jersey'){r(bx0+1,top,L-4,hh-2,'#2a6ad8');r(x-2,top+1,3,3,'#fff6e0');r(x-1,top+2,1,1,'#2a6ad8')}
  else if(lk==='stripe'){for(let i=0;i<hh-2;i++)r(bx0+1,top+i,L-4,1,i%2?'#fff6e0':'#1e2a5a')}
  else if(lk==='bowP'){}
  else{/* capes */const c=lk==='starcape'?'#1e2a6a':lk==='royal'?'#6a2aa8':gC(g,lk)||'#d8352f',w=st==='run'?Math.floor((o.ph||0)*1.5)%2:0;
   r(bx0+3,top-1,L-6,3,c);r(bx0,top+w,4,3,c);r(bx0-3,top+1+w,3,2,c);r(x+Math.round(L/2)-4,top-1,2,3,sh(c,.8));
   if(lk==='starcape'){r(x-3,top,1,1,'#ffd86b');r(x-4,top+1,3,1,'#ffd86b');r(bx0+1,top+1+w,1,1,'#ffd86b')}
   if(lk==='royal'){r(bx0+3,top+1,L-6,1,'#fff6e0');r(x-2,top+1,1,1,'#2a1a1a');r(x+2,top+1,1,1,'#2a1a1a');r(bx0-3,top+2+w,3,1,'#ffd86b')}}}
 const hd=g.head;if(hd){const hy2=dk?hy:hy;
  if(hd==='sweat'||hd==='sweatB'){const c=gC(g,hd);r(hx,hy2+1,8,1,c);r(hx+2,hy2+1,1,1,'#fff6e0')}
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
 if(g.charm)r(hx+2,hy+6,1,1,'#ffd86b');if(boot&&lie){r(x+Math.round(L/2)-1,yy-1,2,1,boot);r(x+Math.round(L/2)+2,yy-1,2,1,sh(boot,.8))}
 cx.restore()}
/* body gear on a sitting dog (1x): back panel x-6..x, chest x-3..x+3, head sits on top from yy-10 up */
function sitGear(x,yy,lk,g){
 if(lk.startsWith('band')){const c=gC(g,lk)||'#d8352f';r(x,yy-10,5,1,c);r(x+1,yy-9,3,1,c);r(x+2,yy-8,1,1,c);r(x+1,yy-10,1,1,'#fff6e0');return}
 if(lk==='bowP')return;
 if(lk.startsWith('silk')){const c=gC(g,lk);r(x-6,yy-7,7,3,c);r(x-6,yy-7,7,1,sh(c,1.2));r(x-4,yy-6,3,2,'#fff6e0');return}
 if(lk==='harn'){r(x-6,yy-6,9,1,'#ff7eb6');r(x+1,yy-9,1,4,'#ff7eb6');r(x+1,yy-7,1,1,'#ffd86b');return}
 const fit=(c,c2,rows)=>{r(x-6,yy-7,7,4,c);r(x-6,yy-8,4,1,c);r(x-3,yy-9,7,6,c);rows.forEach(k=>{r(x-6,yy-7+k,10,1,c2)});r(x-3,yy-9,7,1,sh(c,1.12))};
 if(lk==='neon'){fit('#b8ff3a','#ff3ad8',[1,3]);return}
 if(lk==='sweater'){fit('#c84a5a','#fff6e0',[0,2]);r(x-6,yy-8,4,1,'#c84a5a');return}
 if(lk==='jersey'){fit('#2a6ad8','#2a6ad8',[]);r(x-1,yy-8,3,3,'#fff6e0');r(x,yy-7,1,1,'#2a6ad8');return}
 if(lk==='stripe'){for(let i=0;i<6;i++){const c=i%2?'#fff6e0':'#1e2a5a',yr=yy-9+i;if(yr>=yy-8&&yr<=yy-4)r(x-6,yr,4,1,c);r(x-3,yr,7,1,c)}return}
 /* capes: over the shoulders and hanging down behind */
 const c=lk==='starcape'?'#1e2a6a':lk==='royal'?'#6a2aa8':gC(g,lk)||'#d8352f';
 r(x-4,yy-9,7,2,c);r(x-7,yy-8,4,2,c);r(x-9,yy-7,3,6,c);r(x-9,yy-2,2,1,sh(c,.8));r(x+2,yy-9,2,2,sh(c,.8));
 if(lk==='starcape'){r(x-2,yy-9,1,1,'#ffd86b');r(x-8,yy-5,1,1,'#ffd86b');r(x-5,yy-8,1,1,'#ffd86b')}
 if(lk==='royal'){r(x-4,yy-8,7,1,'#fff6e0');r(x-9,yy-2,3,1,'#ffd86b')}}
/* Donut's current look */
function dGear(){const o={};SLOTS.forEach(([s])=>{const id=S.wear[s];if(id&&GEAR[id]){if(s==='charm')o.charm=1;else o[s]=GEAR[id].lk}});if(S.tint)o.tint=S.tint;return o}

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
function ppl(k,x,y,t,dir,walk){try{if(!PEO[k]){const base={buzz:['morgan',{n:'Buzz',skin:'#f1c9a0',hair:'#e8e4d8',hl:0,eye:'#3a5a9a',top:'#e8a020',pants:'#3a2a1a',shoe:'#1a1a1a'}],
  viv:['abi',{n:'Vivian',skin:'#f6d2b0',hair:'#1a1420',hl:2,eye:'#5a3a7a',top:'#7a2fe0',skirt:'#2a2030',pants:'#2a2030',shoe:'#111'}],
  pup:['morgan',{n:'Pup-Cup Lady',skin:'#f6d2b0',hair:'#e8b84a',hl:1,eye:'#3a7a5a',top:'#ff7eb6',apron:1,pants:'#5a6a8a',shoe:'#fff6e0'}],
  vet:['morgan',{n:'Vet',skin:'#c98e62',hair:'#1e1e1e',hl:1,eye:'#2a2a2a',top:'#5ac8c0',pants:'#5ac8c0',shoe:'#f6f6f0'}],
  nigel:['hunter',{n:'Sir Nigel',skin:'#f4dcc8',hair:'#d8d4cc',hl:0,eye:'#5a6a8a',top:'#2a2a3a',stripe:'#2a2a3a',collar:'#f6f6f0',pants:'#2a2a3a',shoe:'#111'}],
  driver:['hunter',{n:'Driver',skin:'#a8744a',hair:'#1a1a1a',hl:0,eye:'#2a2a2a',top:'#1a1a22',stripe:'#1a1a22',collar:'#f6f6f0',pants:'#1a1a22',shoe:'#111',cap:'#1a1a22'}],
  fan1:['morgan',{n:'Superfan',skin:'#f1c9a0',hair:'#e8c860',hl:1,eye:'#3a5a9a',top:'#f08a2a',pants:'#3a4a6b',shoe:'#fff6e0'}],
  fan2:['hunter',{n:'Superfan',skin:'#8a5a3a',hair:'#1a1a1a',hl:0,eye:'#2a2a2a',top:'#f08a2a',stripe:'#f08a2a',collar:'#f08a2a',pants:'#3a4a6b',shoe:'#1a1a1a',cap:'#f08a2a'}],
  fan3:['abi',{n:'Superfan',skin:'#f6d2b0',hair:'#c0502a',hl:2,eye:'#3a7a5a',top:'#f08a2a',skirt:'#3a4a6b',pants:'#3a4a6b',shoe:'#fff6e0'}],
  hunter:['hunter',{}],abi:['abi',{}]}[k]||['hunter',{n:k,top:k.startsWith('#')?k:'#5a7a4a',stripe:k.startsWith('#')?k:'#5a7a4a',collar:'#fff6e0',hair:'#3a2a1a',skin:'#e8c0a0',pants:'#3a3a4a'}];PEO[k]=mk(base[0],x,y,base[1])}
 const p=PEO[k];p.x=x;p.y=y;p.dir=dir||'d';p.moving=!!walk;p.hold=null;p.sit=0;p.tag=0;person(p,t)}catch(e){r(x-3,y-18,6,18,'#888')}}

/* pixel icons for menus: drawn once, cached as data URLs */
const ICN={};
function icon(key,fn,w,h){if(ICN[key])return ICN[key];const c=mkc(w||24,h||20,fn);return ICN[key]=c.toDataURL()}
function gearIcon(id){const G=GEAR[id];return icon('g'+id,()=>{
 if(G.sl==='charm'){charmIc(G.ic)}else{const g={};g[G.sl]=G.lk;rdog(G.sl==='head'?10:13,G.sl==='head'?26:18,{c:'red',st:G.sl==='paws'?'run':'stand',ph:0,g,nt:1})}},28,22)}
function charmIc(k){cx.translate(2,1);const c={sausage:'#c8743a',clover:'#3aa84a',gbone:'#ffd040',chew:'#ff7eb6',bracelet:'#7ee8fa',ball:'#c8e83a'}[k]||'#ffd86b';
 if(k==='sausage'){r(6,8,12,5,'#e8b060');r(5,9,14,3,'#e8b060');r(8,9,8,3,c)}
 else if(k==='clover'){disc(10,8,2,c,1);disc(14,8,2,c,1);disc(10,12,2,c,1);disc(14,12,2,c,1);r(12,13,1,4,'#2a7a3a')}
 else if(k==='gbone'||k==='chew'){r(7,9,10,3,c);disc(6,8,2,c,1);disc(6,12,2,c,1);disc(18,8,2,c,1);disc(18,12,2,c,1)}
 else if(k==='ball'){disc(12,10,5,c,1);r(8,8,8,1,'#fff6e0');r(9,12,6,1,'#fff6e0')}
 else if(k==='bracelet'){for(let i=0;i<8;i++){const a=i/8*Math.PI*2;r(12+Math.round(Math.cos(a)*5),10+Math.round(Math.sin(a)*4),2,2,['#7ee8fa','#ff7eb6','#ffd86b'][i%3])}}
 else disc(12,10,5,c,1)}
function dogIcon(coat,gear,key,st){return icon('d'+key,()=>rdog(13,19,{c:coat,st:st||'stand',g:gear||{},nt:1}),28,22)}
/* ---------------- venues: sky, far skyline, stands, ground, foreground ---------------- */
let PR=1;const fz=(f,q)=>prn()<q&&!!f;const prn=()=>(PR=PR*16807%2147483647)/2147483647,pri=(a,b)=>a+Math.floor(prn()*(b-a+1)),ppk=a=>a[Math.floor(prn()*a.length)];
const SKY={day:['#7cc4f4','#8ccdf6','#9dd6f8','#b0def8','#c4e7fa','#d8f0fc'],sunny:['#4aa8ec','#5ab4f0','#6cc0f2','#80caf4','#98d6f6','#b4e4f8'],
 dusk:['#2e2a6a','#4a3278','#7a3a7e','#b84a76','#e8706a','#f8a070','#ffc888'],night:['#0a0a24','#0e1030','#141a3e','#1a2250','#222a5c','#2a3268'],
 grey:['#7a8698','#8692a2','#929eac','#a0aab6','#aeb6c0','#bcc2ca'],final:['#0a0820','#120c34','#1c1244','#281a54','#342260','#402a6a']};
const SKIN=['#f1c9a0','#f6d2b0','#c98e62','#8d5a3a','#e8b890','#a8744a'],HAIR=['#2a1a12','#5a3620','#1a1a1a','#d8a33a','#8a5a2a','#3a2216','#c8c0b0'],SHIRT=['#d8352f','#2a6ad8','#3aa84a','#e8b820','#e0468c','#7a2fe0','#f6efe2','#2a2a3a','#ff8a3a','#7ee8fa'];
function skyPaint(k){const c=SKY[k],n=c.length,h=Math.ceil(150/n);c.forEach((q,i)=>r(0,i*h,160,h,q));
 if(k==='day'||k==='sunny'){disc(130,26,8,'#fff4b0',1);disc(130,26,11,'#fff4b0',.25);PR=5;for(let i=0;i<5;i++){const x=pri(0,150),y=pri(14,70);ell(x,y,pri(7,12),2,'#ffffff',.85);ell(x+4,y-2,5,2,'#ffffff',.85)}}
 if(k==='night'||k==='final'){PR=9;for(let i=0;i<46;i++)r(pri(0,159),pri(0,100),1,1,prn()<.2?'#fff6e0':'#8a90c0');if(k==='night'){disc(28,24,6,'#fff6d8',1);disc(26,22,5,c[1],1)}}
 if(k==='dusk'){disc(116,104,14,'#ffd890',.5);disc(116,104,10,'#ffe8b0',1)}
 if(k==='grey'){PR=3;for(let i=0;i<7;i++)ell(pri(0,160),pri(10,80),pri(12,20),3,'#c8ced6',.7)}}
/* one spectator: 4 wide, hair, face, shirt; some cheer with their arms up, some hold things */
function fan(x,y,f,cols,sk,dim){const k=dim||1,c=q=>k===1?q:sh(q,k),skin=c(ppk(SKIN)),hair=c(ppk(HAIR)),sc=c(cols?ppk(cols):ppk(SHIRT)),st=prn(),prop=prn(),up=fz(f,.4);
 r(x,y+3,4,4,sc);r(x,y+3,4,1,sh(sc,1.15));r(x+1,y+1,2,2,skin);r(x,y+1,1,2,skin);r(x+3,y+1,1,2,skin);
 if(st<.18){r(x,y,4,1,skin)}else if(st<.34){r(x,y,4,1,c(ppk(['#d8352f','#2a6ad8','#2a2a3a','#ffd86b'])));r(x+3,y+1,2,1,sh(c(ppk(['#d8352f','#2a6ad8','#2a2a3a','#ffd86b'])),.8))}
 else if(st<.6){r(x,y,4,1,hair);r(x,y+1,1,2,hair)}else{r(x,y,4,1,hair);r(x,y+1,1,1,hair);r(x+3,y+1,1,3,hair)}
 if(up){r(x-1,y-2,1,4,skin);r(x+4,y-2,1,4,skin)}else{r(x-1,y+4,1,2,sh(sc,.85));r(x+4,y+4,1,2,sh(sc,.85))}
 if(prop<.05){r(x+4,y-6,2,5,'#ffd86b');r(x+4,y-7,1,1,'#ffd86b')}else if(prop<.09){r(x-2,y-7,8,4,'#fff6e0');r(x-1,y-6,6,1,c(ppk(['#e0468c','#2a6ad8','#d8352f'])));r(x,y-4,4,1,c(ppk(['#e0468c','#2a6ad8'])));r(x+1,y-3,1,3,'#8a6a4a')}
 else if(prop<.12){r(x+4,y-6,1,7,'#8a6a4a');r(x+5,y-6,3,2,c(ppk(cols||SHIRT)))}}
function spec(x,yf,f,cols){fan(x,yf-11,f,cols);const p=ppk(['#3a4a6b','#2a2a3a','#5a4a3a','#4a6a8a','#6a3a3a']);r(x,yf-4,1,4,p);r(x+3,yf-4,1,4,p);r(x,yf-1,1,1,'#2a2020');r(x+3,yf-1,1,1,'#2a2020')}
function crowd(x0,y0,w,rows,f,cols,seat){const sc=seat||'#4a3a5a';for(let j=0;j<rows;j++){const y=y0+j*9,dim=.72+.28*(j+1)/rows;r(x0,y+6,w,3,sh(sc,dim));r(x0,y+6,w,1,sh(sc,dim*1.2));r(x0,y+8,w,1,sh(sc,dim*.7));
 for(let x=x0+1+(j%2)*3;x<x0+w-4;x+=6){if(prn()<.08)continue;fan(x,y,f,cols,0,dim)}}}
function tree(x,y,s,c){r(x-1,y-s,3,s,'#6a4a2a');disc(x,y-s-2,s*.7|0,c||'#3a8a3a',1);disc(x-2,y-s,s*.5|0,sh(c||'#3a8a3a',1.15),1);disc(x+3,y-s-4,s*.4|0,sh(c||'#3a8a3a',.85),1)}
function tent(x,y,w,c1,c2){r(x,y-14,w,3,c1);for(let i=0;i<w;i+=4)r(x+i,y-14,2,3,c2);r(x,y-11,w,1,sh(c1,.7));r(x+1,y-11,1,11,'#6a5a4a');r(x+w-2,y-11,1,11,'#6a5a4a');r(x+2,y-5,w-4,5,'#a87a4a');for(let i=3;i<w-3;i+=3)r(x+i,y-6,2,2,ppk(['#d8352f','#e8b820','#3aa84a','#ff8a3a']))}
function bldg(x,y,w,h,c,win,lit){r(x,y-h,w,h,c);r(x,y-h,w,1,sh(c,1.15));for(let j=y-h+3;j<y-3;j+=5)for(let i=x+2;i<x+w-2;i+=4)if(prn()<.8)r(i,j,2,2,lit&&prn()<.7?ppk(lit):win)}
function stands(w,f,cols,seat,top){r(0,top,w,150-top,sh(seat,.55));crowd(0,top+3,w,Math.floor((142-top)/9),f,cols,seat)}
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
 if(bg==='park'){for(let x=0;x<W2;x+=pri(28,44))tree(x,136,pri(10,14));for(let x=8;x<W2;x+=64){const bc=ppk(['#d8352f','#2a6ad8','#e8b820']);r(x,136,20,5,bc);for(let i=0;i<20;i+=4)r(x+i,136,2,5,sh(bc,1.2));fan(x+3,128,f);fan(x+11,129,f)}
  for(let x=36;x<W2;x+=64){spec(x,141,f);if(prn()<.6)spec(x+7,141,f)}for(let x=0;x<W2;x+=8){r(x,139,1,11,'#c8b898');r(x,141,8,1,'#d8c8a8');r(x,145,8,1,'#c8b898')}}
 else if(bg==='market'){for(let x=0;x<W2;x+=44)tent(x+4,140,34,ppk(['#3aa84a','#d8352f','#2a6ad8','#e8b820']),'#fff6e0');for(let x=2;x<W2;x+=9)if(prn()<.6)spec(x,144,f);r(0,144,W2,6,'#8a6a4a');r(0,144,W2,1,'#a8885a')}
 else if(bg==='brewery'){r(0,92,W2,48,'#5a3a2a');for(let y=96;y<140;y+=4)r(0,y,W2,1,'#4e3224');r(0,86,W2,6,'#2e1e1a');r(0,92,W2,1,'#1e1410');for(let x=6;x<W2;x+=26){r(x,102,16,20,'#ffd890');r(x,102,16,1,'#3a2a1a');r(x+7,102,1,20,'#3a2a1a');r(x,112,16,1,'#3a2a1a')}
  r(96,94,40,7,'#1e1410');ptxt('BREWERY',116,95,'#ffd86b',1,'c');for(let x=0;x<W2;x+=3)r(x,90+Math.round(Math.sin(x/16)*2),1,1,'#3a2a2a');for(let x=0;x<W2;x+=9)if(x%27==0)disc(x,91+Math.round(Math.sin(x/16)*2),1,'#ffe8a0',1);
  for(let x=10;x<W2;x+=50){r(x,132,22,3,'#8a5a3a');r(x,132,22,1,'#a87a4a');r(x+2,135,2,6,'#6a4a2a');r(x+18,135,2,6,'#6a4a2a');fan(x+2,124,f);fan(x+9,124,f);fan(x+16,124,f)}for(let x=34;x<W2;x+=50)spec(x,144,f);r(0,144,W2,6,'#4a3a2a')}
 else if(bg==='funrun'){for(let x=1;x<W2;x+=5)if(prn()<.85)spec(x,142,f);r(0,138,W2,8,'#e8e4ec');for(let x=0;x<W2;x+=16)r(x,138,8,8,'#d8352f');r(0,138,W2,1,'#fff6f0');for(let x=4;x<W2;x+=32){r(x,146,2,4,'#8a8a96');r(x+12,146,2,4,'#8a8a96')}}
 else if(bg==='ballpark'){stands(W2,f,null,'#2a5a3a',70);r(0,128,W2,22,'#2a6a3a');adBoards(W2,132,['#d8352f','#e8b820','#2a6ad8','#fff6e0'])}
 else if(bg==='college'){stands(W2,f,['#e86a1a','#fff6e0','#e86a1a','#2a2a3a'],'#3a2a3a',64);adBoards(W2,140,['#e86a1a','#fff6e0'])}
 else if(bg==='nfl'){stands(W2,f,['#d8352f','#ffd86b','#2a6ad8','#fff6e0','#1e2a5a'],'#2a2a44',54);r(0,138,W2,12,'#1e1a2a');adBoards(W2,140,['#2a6ad8','#d8352f','#e8e4f0'])}
 else if(bg==='kc'){stands(W2,f,['#d8352f','#ffd86b','#d8352f'],'#4a1e2a',62);adBoards(W2,140,['#d8352f','#ffd86b'])}
 else if(bg==='showcase'){stands(W2,f,null,'#1e1a34',70);r(0,138,W2,12,'#2a2448');adBoards(W2,140,['#7a2fe0','#ff3ad8','#7ee8fa'])}
 else if(bg==='final'){stands(W2,f,['#ffd86b','#fff6e0','#3a8a5a','#d8352f','#2a6ad8'],'#2a2244',50);adBoards(W2,140,['#ffd86b','#3a8a5a','#c2417a'])}
 else if(bg==='fair'){for(let x=0;x<W2;x+=64){r(x+4,108,40,32,'#b8382a');for(let y=110;y<140;y+=4)r(x+4,y,40,1,'#a83024');tri(x+24,92,108,1.3,'#8a2a22');r(x+18,120,12,20,'#5a2a1a');r(x+23,120,1,20,'#3a1a10');r(x+4,108,40,1,'#fff6e0');r(x+20,98,8,6,'#fff6e0');r(x+23,98,1,6,'#b8382a');r(x+20,100,8,1,'#b8382a')}
  for(let x=0;x<W2;x+=4)r(x,96+Math.round(Math.sin(x/10)*3),2,2,ppk(['#d8352f','#ffd86b','#2a6ad8']));for(let x=2;x<W2;x+=8)if(prn()<.6)spec(x,143,f);r(0,142,W2,8,'#c8a878');for(let x=0;x<W2;x+=6)r(x,142,1,8,'#a8885a');r(0,142,W2,1,'#e0c898')}
 else if(bg==='boardwalk'){for(let x=0;x<W2;x+=40){const c=ppk(['#ff7eb6','#7ee8fa','#ffd86b','#8be28b']);r(x,104,40,38,c);r(x,104,40,1,sh(c,1.2));r(x,104,40,5,'#fff6e0');for(let i=x;i<x+40;i+=4)r(i,104,2,5,'#d8352f');r(x,108,40,1,sh(c,.7));r(x+8,116,18,13,'#3a3a4a');r(x+9,117,16,11,'#ffe8b0');r(x+30,118,6,24,sh(c,.75));r(x+39,104,1,38,sh(c,.7))}
  for(let x=2;x<W2;x+=8)if(prn()<.6)spec(x,144,f);r(0,142,W2,8,'#a87a4a');for(let x=0;x<W2;x+=8)r(x,142,1,8,'#8a5a3a');r(0,142,W2,1,'#c8945a')}
 else if(bg==='vegas'){stands(W2,f,['#ff3ad8','#7ee8fa','#ffd86b','#fff6e0'],'#2a1a3a',104);adBoards(W2,140,['#ff3ad8','#ffd86b','#7ee8fa'])}
 else if(bg==='london'){stands(W2,f,['#d8352f','#fff6e0','#2a4aa8'],'#3a3a4a',96);for(let x=0;x<W2;x+=6)r(x,92+Math.round(Math.sin(x/12)*2),3,3,ppk(['#d8352f','#fff6e0','#2a4aa8']));adBoards(W2,140,['#d8352f','#2a4aa8'])}
 else if(bg==='tokyo'){for(let x=0;x<W2;x+=20){disc(x+10,98,3,'#ff4a4a',1);r(x+9,95,3,1,'#2a1a1a')}stands(W2,f,null,'#1e1a34',104);adBoards(W2,140,['#ff3ad8','#7ee8fa','#ffd86b'])}
 else if(bg==='paris'){r(0,100,W2,42,'#e8d8c0');r(0,98,W2,3,'#5a6a8a');for(let x=0;x<W2;x+=48){r(x+4,106,40,6,'#d8352f');for(let i=0;i<40;i+=8)r(x+4+i,106,4,6,'#fff6e0');r(x+4,112,40,1,'#a82a22');r(x+10,116,12,10,'#ffd890');r(x+10,116,12,1,'#8a7a6a');r(x+15,116,1,10,'#8a7a6a');r(x+30,116,9,26,'#5a3a2a');r(x+30,116,9,1,'#3a2a1a');r(x+47,100,1,42,'#d4c4ac');r(x+8,134,6,4,'#3a3a3a');r(x+9,138,1,4,'#3a3a3a');r(x+36,134,6,4,'#3a3a3a')}
  for(let x=2;x<W2;x+=7)if(prn()<.55)spec(x,144,f);r(0,142,W2,8,'#8a8a96');r(0,142,W2,1,'#aaaab6')}
 else if(bg==='sydney'){r(0,118,W2,32,'#f0dca8');for(let x=0;x<W2;x+=3)r(x,118+Math.round(Math.sin(x/9)*1),3,1,'#f6e6c0');for(let x=10;x<W2;x+=70){r(x,104,2,30,'#c8382a');r(x+8,104,2,30,'#c8382a');r(x-2,96,16,9,'#ffd86b');r(x-2,96,16,2,'#d8352f');r(x,110,10,1,'#c8382a');r(x,120,10,1,'#c8382a')}
  for(let x=30;x<W2;x+=50){r(x,122,1,12,'#8a6a4a');tri(x,113,122,1.3,ppk(['#d8352f','#2a6ad8','#ffd86b']));r(x-6,136,12,3,ppk(['#ff7eb6','#7ee8fa','#ffd86b']))}for(let x=4;x<W2;x+=9)if(prn()<.5)spec(x,144,f)}
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
 else if(g==='boards'){r(0,0,w,16,'#6a4a2a');r(0,2,w,2,'#a87a4a');r(0,2,w,1,'#c8945a');r(0,9,w,1,'#8a5a3a');for(let x=0;x<w;x+=12){r(x,0,3,16,'#8a5a3a');r(x,0,3,1,'#a87a4a')}}
 else if(g==='cobble'){r(0,0,w,16,'#7a7a86');r(0,0,w,3,'#b8b8c4');r(0,3,w,1,'#5a5a66');for(let x=0;x<w;x+=8)for(let y=5;y<16;y+=4)r(x+(y%8?4:0),y,7,3,'#8a8a96')}
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
function eff(){const e=Object.assign({},S.st);if(S.gb)for(const k in S.gb)e[k]+=S.gb[k];SLOTS.forEach(([s])=>{const G=GEAR[S.wear[s]];if(G)for(const k in G.b)e[k]+=G.b[k]});if(S.buff)for(const k in S.buff)e[k]+=S.buff[k];for(const k in e)e[k]=clamp(e[k],1,140);return e}
const sandOK=()=>SLOTS.some(([s])=>{const G=GEAR[S.wear[s]];return G&&G.sand});
const vOf=s=>58+s*.62;
const ORD=['1ST','2ND','3RD','4TH'];
/* Zoomies: Donut glows with a cycling rainbow outline */
const GLW={};function glowDog(X,y,o,t,k){if(!GLW.c){GLW.c=document.createElement('canvas');GLW.c.width=GLW.s=0;GLW.c.width=64;GLW.c.height=48;GLW.s=document.createElement('canvas');GLW.s.width=64;GLW.s.height=48}
 const g=GLW.c.getContext('2d'),s=GLW.s.getContext('2d'),jy=Math.round(o.jy||0);g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,64,48);withCx(g,()=>rdog(32,42,Object.assign({},o,{ns:1,jy:0})));
 const hue=Math.round(t*320)%360,col='hsl('+hue+',100%,62%)',col2='hsl('+((hue+70)%360)+',100%,70%)';if(!GLW.s2){GLW.s2=document.createElement('canvas');GLW.s2.width=64;GLW.s2.height=48}const s2=GLW.s2.getContext('2d');s2.globalCompositeOperation='source-over';s2.clearRect(0,0,64,48);s2.drawImage(GLW.c,0,0);s2.globalCompositeOperation='source-in';s2.fillStyle=col2;s2.fillRect(0,0,64,48);s2.globalCompositeOperation='source-over';s.setTransform(1,0,0,1,0,0);s.globalCompositeOperation='source-over';s.clearRect(0,0,64,48);s.drawImage(GLW.c,0,0);s.globalCompositeOperation='source-in';s.fillStyle=col;s.fillRect(0,0,64,48);s.globalCompositeOperation='source-over';
 const ox=Math.round(X)-32,oy=Math.round(y)-jy-42;ell(Math.round(X),Math.round(y),10,1,'#000',.2*(jy?.5:1));
 cx.globalCompositeOperation='lighter';[13,10,7].forEach(q=>ell(Math.round(X)+2,Math.round(y)-8-jy,q+3,q-2,col,.05*k));cx.globalCompositeOperation='source-over';
 cx.globalAlpha=.5*k;[[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[1,1],[1,-1],[-1,1]].forEach(([a,b])=>cx.drawImage(GLW.s2,ox+a,oy+b));
 cx.globalAlpha=k;[[-1,0],[1,0],[0,-1],[0,1]].forEach(([a,b])=>cx.drawImage(GLW.s,ox+a,oy+b));cx.globalAlpha=1;cx.drawImage(GLW.c,ox,oy)}
/* the cheering section at the finish line: drawn once per league and kept, two frames (arms down / arms up) */
const FFC={};function finishFans(lg){if(FFC[lg])return FFC[lg];const sz=lg>1?2:1,sg=lg>2?'DONUT GOAT':'GO DONUT',sw=sg.length*4*sz+6,sh2=5*sz+6,W2=96,H2=48;
 return FFC[lg]=[0,1].map(f=>mkc(W2,H2,()=>{PR=4242+lg;const OR=['#e0903a','#e0903a','#f0a050','#fff6e0'];
  r(6,H2-34,W2-12,21,'#4a2e22');for(let y=H2-34;y<H2-13;y+=9)r(6,y,W2-12,1,'#5e3c2c');r(6,H2-34,1,21,'#3a2218');r(W2-7,H2-34,1,21,'#3a2218');
  for(let i=0;i<9;i++)fan(10+i*9,H2-30,f,OR,0,.82);for(let i=0;i<8;i++)fan(14+i*9,H2-21,f,OR,0,1);
  for(let i=0;i<8;i++)r(15+i*9,H2-17,2,1,'#fbf6ec');r(4,H2-14,W2-8,8,'#e0903a');r(4,H2-14,W2-8,1,'#f0b060');r(4,H2-7,W2-8,1,'#b8682a');ptxt('DONUT FAN CLUB',W2/2,H2-12,'#fff6e0',1,'c');for(let x=8;x<W2-8;x+=16)r(x,H2-6,2,6,'#7a7a86');
  const sx=W2/2,sy=Math.max(0,H2-34-sh2-(f?2:0));r(sx-sw/2,sy,sw,sh2,'#fff6e0');r(sx-sw/2,sy,sw,1,'#ffd0e4');r(sx-sw/2,sy+sh2-1,sw,1,'#e8d0c0');ptxt(sg,sx,sy+3,'#e0468c',sz,'c');r(sx-sw/2+3,sy+sh2,1,6,'#8a6a4a');r(sx+sw/2-4,sy+sh2,1,6,'#8a6a4a');
  if(f)for(let i=0;i<10;i++)r(pri(4,W2-4),pri(0,H2-30),1,1,ppk(['#ffd86b','#ff7eb6','#7ee8fa']))}))}
function arw(x,y,up,c){for(let i=0;i<4;i++){const w=up?i*2+1:7-i*2;r(x-(w>>1),y+i,w,1,c)}r(x,up?y+4:y-3,1,3,c)}
function mkRival(i,lg,boss,lane){if(boss){const B=BOSS[boss],[spd,acc,sta,agi,foc,cha]=B.st;return {n:B.n,coat:B.coat,g:B.gear,sz:B.sz||1,boss,trait:B.trait,s:{spd,acc,sta,agi,foc,cha},lane}}
 const L=LG[lg];let [a,b]=L.r;if(lg===3){const k=clamp((100-rankOf())/100,0,1);a+=k*8;b+=k*8}if(lg===0&&S.races<2){a-=3;b-=4}
 const s={};STATS.forEach(([k])=>s[k]=ri(a,b));return {n:'',coat:pick(RCOATS),g:pick(RGEAR)||{},sz:pick([1,1,1,.9,1.08]),s,lane,trait:'none'}}
const rankOf=()=>S.fl.champ?1:Math.max(2,100-Math.round(S.rp*1.15));
function raceScreen(ev){const V=VEN[ev.ven],E=eff(),lg=S.lg,len=V.len,boss=ev.boss,relay=!!V.relay&&!ev.tt&&!ev.scrim&&!ev.field;if(perk(4,0))E.sta+=8;
 /* field */const names=RIVN.slice().sort(()=>Math.random()-.5);const riv=[];const nR=ev.tt?0:ev.tut||ev.scrim?1:ev.field?0:3;
 if(ev.field)ev.field.forEach((b,i)=>{const R=mkRival(i,lg,b,i);riv.push(R)});
 if(ev.scrim){const R=mkRival(0,lg,null,1);R.n='Crumpet';R.coat='red';R.bow=1;R.g={};R.sz=1.05;STATS.forEach(([k])=>R.s[k]=Math.max(4,Math.round(S.st[k]*.82)));riv.push(R)}
 for(let i=0;i<nR&&!ev.scrim;i++){const isB=boss&&i===nR-1;const R=mkRival(i,lg,isB?boss:null,isB?2:i);if(!isB)R.n=names[i];if(ev.tut){R.coat='cream';R.g={};R.lane=1;STATS.forEach(([k])=>R.s[k]=4)}riv.push(R)}
 riv.forEach(R=>{const s=R.s;Object.assign(R,{x:0,v:0,ph:Math.random()*4,vm:vOf(s.spd),ac:30+s.acc*1.1,form:rr(.97,1.03),jt:-1,dk:0,trip:0,chase:0,fin:null,done:{},st:'stand',surge:0})});
 const D={smoke:[],n:'Donut',coat:'red',x:0,v:0,ph:0,d:0,sta:100,gas:0,jt:-1,jh:0,dk:0,trip:0,chase:0,chX:0,fin:null,lane:3,done:{},zm:hasSk('lgP')?1:0,zt:0,wind:hasSk('wind'),st:'stand',held:0,pf:0};
 const PL=ev.plan||'';const vm=vOf(E.spd)*(V.gr==='sand'&&!sandOK()?.93:1)*(hasSk('lgS')?1.05:1),ac=(30+E.acc*1.1)*(hasSk('quick')?1.15:1),focusNeed=clamp((.9-E.foc*.0058)*(hasSk('iron')?.6:1)*(S.mood<30?1.25:1)*(PL==='focus'?.6:1),.22,1.2);
 const tired=S.en<30,stCost=3.3*(1-E.sta/230)*(hasSk('pacer')?.8:1)*(tired?1.35:1)*(PL==='save'?.75:1);
 const ghost=ev.tt&&S.tt&&S.tt[ev.ven]&&S.tt[ev.ven].g?S.tt[ev.ven].g:null,rec=[];let recT=0;
 /* course */const obs=[];let x=260;const types=V.o,du=V.du;let k=0;
 while(x<len-160){const duck=k>1&&Math.random()<.22;obs.push({x,k:duck?pick(du):pick(types),duck});x+=rr(150,250)-Math.min(40,lg*12);k++}
 const dis=[];const nd=lg===0?2:3;for(let i=0;i<nd;i++){const at=len*(.25+i*.6/nd)+rr(-40,40);obs.forEach(o=>{if(Math.abs(o.x-at)<70)o.x+=90});dis.push({x:at,k:pick(V.d),hit:0,res:0,on:0})}
 if(boss==='chad')dis.push({x:len*.48,k:'bark',hit:0,res:0,on:0,chad:1});
 if(ev.tut){obs.length=0;dis.length=0;obs.push({x:430,k:'cone'},{x:800,k:'banner',duck:true},{x:1420,k:'hay'});dis.push({x:1100,k:'squirrel',hit:0,res:0,on:0})}
 let gate=null;const TG={};
 const all=[D,...riv];let phase='count',ct=3.4,time=0,cam=-40,pops=[],endT=0,hype=0,crum=relay,handed=0,flop=0,flopTaps=0,shake=0,falseT=0,msg=null;
 const pop=(s,c,big)=>{pops.forEach(p=>p.dy=(p.dy||0)+(big?18:10));pops.push({s,c:c||'#ffd86b',t:0,big,dy:0})};
 const say=(s,d)=>{msg={s,t:d||1.6}};
 MUS=boss?'kart':'crzRace';
 function startGo(){phase='run';snd('go');D.st='run';riv.forEach(R=>{R.st='run';R.v=R.vm*(R.trait==='rocket'?.6:rr(.15,.3))})}
 function smokeUpd(dt){D.smoke.forEach(p=>{p.t+=dt;p.x+=(p.vx||-12)*dt;p.y+=(p.vy||-5)*dt;if(p.vx)p.vx*=.9;if(p.vy)p.vy*=.9});D.smoke=D.smoke.filter(p=>p.t<p.life);
  if(D.zt>0){let n=dt*55;while(n>0){if(Math.random()<n)D.smoke.push({x:D.x-11+rr(-2,2),y:LANE[3]-3-D.jh+rr(-2,1),t:0,life:rr(.5,.8),h:Math.round(time*320+rr(0,60))%360});n-=1}}}
 function special(){if(D.zm<1||D.zt>0||phase!=='run')return;D.zm=0;D.zt=hasSk('turbo')?5:2.6;D.d=1;for(let i=0;i<14;i++){const a=i/14*Math.PI*2;D.smoke.push({x:D.x-4+Math.cos(a)*6,y:LANE[3]-6+Math.sin(a)*3,t:0,life:.6,h:(i*26)%360,vx:Math.cos(a)*20,vy:Math.sin(a)*8})}pop('ZOOMIES!','#ff7eb6',1);snd('boost');hype=2;
  if(hasSk('star')){D.sta=100;riv.forEach(R=>{if(Math.abs(R.x-D.x)<70&&R.trait!=='perfect'&&R.trait!=='royal'){R.trip=.35;R.v*=.8}});pop('CROWD ROAR!','#7ee8fa')}}
 function tap(){if(phase==='count'){if(ct<1.0){/* jumped the gun */}if(ct>0.02){falseT=.7;pop('EARLY!','#ff7e7e');snd('miss')}return}
  if(phase!=='run'||D.fin!=null)return;
  if(flop>0){flopTaps++;snd('blip');if(flopTaps>=3){flop=0;pop('UP SHE GETS!','#ff9ccb')}return}
  if(D.trip>0||D.chase>0)return;if(time<(PL==='fast'?.45:.28)&&!D.pf){D.pf=1;const big=hasSk('rocket');D.v=vm*(big?.95:.62);D.d=1;pop(big?'ROCKET START!':'PERFECT START!','#8be28b');snd('boost');return}
  if(D.gas>0){snd('miss');return}D.d=Math.min(1,D.d+.2);D.sta-=stCost;D.puff=.18;snd('foot');if(D.sta<=0){D.sta=0;if(D.wind){D.wind=0;D.sta=50;pop('SECOND WIND!','#8be28b');snd('boost')}else{D.gas=1.5;pop('PANTING...','#ff7e7e')}}}
 const SCR={
  enter(){},
  down(px,py){if(gate&&gate.need==='zoom'){if(py>238&&px>104){gate=null;special()}return}if(gate&&gate.need==='tap'){tap();if(++gate.c>=3){gate=null;snd('confirm')}return}if(gate&&gate.need!=='hold')return;if(py>238&&px>104&&D.zm>=1)special();else tap()},
  swipe(dir){if(gate){if(gate.need===dir){gate=null;snd('confirm')}else return}if(phase!=='run'||D.fin!=null||D.trip>0||D.chase>0||flop>0)return;if(dir==='u'&&D.jt<0&&D.dk<=0){D.jt=0;snd('jump')}else if(dir==='d'&&D.jt<0){D.dk=.62;snd('whoosh')}},
  pause(){},
  _st:()=>({D,riv,phase,len,time,gate:gate&&gate.need,rec}),
  upd(dt){if(phase==='count'){ct-=dt;if(falseT>0)falseT-=dt;const c0=Math.ceil(ct+dt),c1=Math.ceil(ct);if(c1!==c0&&c1>0)snd('beep');if(ct<=0){startGo();if(falseT>0){D.trip=falseT}}cam=lerp(cam,D.x-46,dt*3);return}
   if(phase==='end'){smokeUpd(dt);endT+=dt;all.forEach(R=>{R.v=lerp(R.v,R.fin!=null?vOf(20)*.35:R.v,dt*1.5);R.x+=R.v*dt;R.ph+=R.v*dt*.11});cam=lerp(cam,D.x-46,dt*2);pops.forEach(p=>p.t+=dt);if(endT>2.2)finish();return}
   if(ev.tut){if(gate){if(gate.need==='hold'&&IN.down){gate=null;snd('confirm')}else{pops.forEach(p=>p.t+=dt*.3);return}}
    const G2=(k,o)=>{if(!TG[k]){TG[k]=1;gate=Object.assign({c:0},o);snd('alert')}};const o0=obs[0],o1=obs[1],o2=obs[2],q=dis[0];
    if(time>.7)G2('tap',{need:'tap',l:['TAP TAP TAP TO SPRINT!','EVERY TAP USES A LITTLE STAMINA']});
    if(!D.done[0]&&o0.x-(D.x+6)<D.v*.26+3)G2('u',{need:'u',l:['A CONE! SWIPE UP','TO JUMP OVER IT']});
    if(!D.done[1]&&o1.x-(D.x+6)<D.v*.27+3)G2('d',{need:'d',l:['A LOW BANNER!','SWIPE DOWN TO DUCK']});
    if(q.x-D.x<92&&!q.res&&!q.hit)G2('h',{need:'hold',l:['A SQUIRREL!','HOLD YOUR FINGER DOWN','UNTIL DONUT IS FOCUSED']});
    if((q.res||q.hit)&&!TG.z){D.zm=1;G2('z',{need:'zoom',l:['ZOOMIES ARE READY!','TAP THE ZOOM BUTTON']})}
    if(TG.z&&!D.done[2]&&o2.x-D.x<190&&!TG.f){TG.f=1;say('Last one: jump the hay bale yourself!',2.4)}
    if(gate)return}
   smokeUpd(dt);if(SCR.auto)autoP(dt);time+=dt;if(hype>0)hype-=dt;if(msg){msg.t-=dt;if(msg.t<=0)msg=null}if(shake>0)shake-=dt;
   const prog=D.x/len;
   /* Donut */
   D.d=Math.max(0,D.d-.55*dt);if(D.gas<=0)D.sta=Math.min(100,D.sta+(2.5+(D.d<.35?6*(1+E.sta/150):0))*dt);if(D.puff>0)D.puff-=dt;if(D.gas>0){D.gas-=dt;D.sta=Math.min(100,D.sta+10*dt)}
   let vt=vm*(.74+.26*D.d)*(hasSk('after')&&prog>.75?1.06:1)*(PL==='fast'&&prog<.2?1.06:1);
   if(D.gas>0)vt*=.8;if(D.zt>0){D.zt-=dt;vt=vm*(hasSk('turbo')?1.36:1.28);D.sta=Math.min(100,D.sta+3*dt)}
   if(hasSk('draft')&&riv.some(R=>R.x-D.x>6&&R.x-D.x<42)){vt*=1.07;D.drf=1}else D.drf=0;
   if(crum&&!handed)vt*=.82;if(flop>0)vt=0;
   if(D.trip>0){D.trip-=dt;vt*=.35}if(D.chase>0){D.chase-=dt;vt*=.28}
   const a=vt>D.v?ac:ac*1.6;D.v+=clamp(vt-D.v,-a*dt,a*dt);if(D.fin==null){D.x+=D.v*dt}D.ph+=D.v*dt*.11;
   if(D.jt>=0){D.jt+=dt;const jd=hasSk('light')?.6:.52;D.jh=Math.sin(Math.min(1,D.jt/jd)*Math.PI)*15;if(D.jt>=jd){D.jt=-1;D.jh=0;snd('step')}}if(D.dk>0)D.dk-=dt;
   D.zm=Math.min(1,D.zm+.032*dt*(hasSk('crowd')?1.3:1)*(perk(5,1)?1.25:1));if(ev.tt){recT+=dt;if(recT>=.1){recT-=.1;rec.push(Math.round(D.x))}}
   /* relay: Crumpet runs the first half */
   if(crum&&!handed){if(!flop&&prog>.12&&prog<.45&&Math.random()<dt*.18&&!D.flopped){D.flopped=1;flop=1;flopTaps=0;pop('CRUMPET LIES DOWN','#ff9ccb');say('Tap tap tap to get her up!',2)}
    if(prog>=.5){handed=1;crum=0;pop('TAG! GO DONUT!','#ffd86b',1);snd('confirm');D.d=1;D.v=Math.max(D.v,vm*.8)}}
   /* obstacles */
   obs.forEach((o,i)=>{if(D.done[i])return;const dx=o.x-(D.x+6);if(dx<0){D.done[i]=1;
     const ok=o.duck?D.dk>0:D.jh>3;if(ok){const perf=o.duck?D.dk>.25:D.jh>11;if(perf){pop('PERFECT!','#8be28b');D.zm=Math.min(1,D.zm+.18*(hasSk('crowd')?1.3:1));if(hasSk('show')){D.v*=1.08}snd('ding')}else{snd('step')}}
     else if(!(hasSk('light')&&!o.duck&&D.jh>1)){if(hasSk('lgT')){D.v*=.86;pop('CLIPPED IT','#ffd86b');snd('step')}else{D.trip=hasSk('shake')?.28:.5;D.v*=hasSk('shake')?.72:.5;D.d=0;pop(o.duck?'BONK!':'OOF!','#ff7e7e');snd('bump');shake=.25}}}});
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
   const fx=Math.round(len-cam);if(fx>-50&&fx<BW+50){r(fx-13,TRK-18,2,18,'#d8d4e0');r(fx+11,TRK-18,2,18,'#d8d4e0');r(fx-16,TRK-28,32,11,'#2b1830');for(let i=0;i<16;i++){r(fx-16+i*2,TRK-28,1,1,i%2?'#fff6e0':'#2b1830');r(fx-16+i*2,TRK-18,1,1,i%2?'#2b1830':'#fff6e0')}ptxt('FINISH',fx,TRK-25,'#fff6e0',1,'c');
    /* the cheering section for Donut, with a sign that gets bigger every league; they go wild as she gets close */
    const FF=finishFans(lg),near=D.x>len-260||phase==='end',fr=near?Math.floor(t*(phase==='end'?6:4))%2:Math.floor(t*1.2)%4===0?1:0;cx.drawImage(FF[fr],fx-110,TRK-47)}
   /* distractions sit by the near rail */
   dis.forEach(q=>{if(q.chad)return;const X=q.x-cam;if(X<-20||X>BW+20)return;const tx=q.hit&&D.chase>0?X:X;disDraw(q.k,tx,TRK+TRH+2,t,q.on);
    if(q.on){const need=focusNeed,k=Math.min(1,D.held/need);for(let a=0;a<24;a++){const qq=a/24*Math.PI*2;if(a/24<=k)r(Math.round(X+Math.cos(qq-Math.PI/2)*9),Math.round(TRK+TRH-24+Math.sin(qq-Math.PI/2)*9),2,2,'#b78cff');else r(Math.round(X+Math.cos(qq-Math.PI/2)*9),Math.round(TRK+TRH-24+Math.sin(qq-Math.PI/2)*9),1,1,'rgba(255,255,255,.7)')}ptxtS('HOLD',X,TRK+TRH-26,'#fff6e0',1,'c')}});
   /* draw lanes back to front: obstacles in each lane, then the racer in it */
   for(let ln=0;ln<4;ln++){const y=LANE[ln];obs.forEach(o=>{const X=o.x-cam;if(X>-14&&X<BW+14)obsDraw(o.k,X,y,t)});
    if(ghost&&ln===2&&phase!=='count'){const i=Math.min(ghost.length-1,Math.floor(time*10)),gx=i>=0?ghost[i]+(ghost[Math.min(ghost.length-1,i+1)]-ghost[i])*((time*10)%1):0,X=gx-cam;if(X>-30&&X<BW+30){cx.globalAlpha=.42;rdog(X,y,{c:'red',st:'run',ph:time*9,g:dGear()});cx.globalAlpha=1;ptxt('GHOST',X,y-30,'#cdb8e8',1,'c')}}
    all.filter(R=>R.lane===ln).forEach(R=>{const X=R.x-cam;if(X<-30||X>BW+30)return;const isD=R===D;
     if(isD)D.smoke.forEach(p=>{const k=p.t/p.life,rad=1.5+k*5,sx=Math.round(p.x-cam),sy=Math.round(p.y);if(sx<-10||sx>BW+10)return;disc(sx,sy,rad|0,k<.18?'hsl('+p.h+',90%,82%)':k<.5?'#f4f0f8':'#c8c4d4',.75*(1-k))});
     if(isD&&D.zt>0&&!(crum&&!handed)){glowDog(X,y,{c:'red',st:D.st,ph:D.ph,g:dGear(),jy:D.jh},t,Math.min(1,D.zt*3));if(D.drf)r(X-14,y-6,4,1,'#7ee8fa');heart(X+4,y-25-D.jh-(Math.floor(t*3)%2),'#ff5f9e');return}
     if(isD&&crum&&!handed){rdog(X,y,{c:'red',st:flop?'lie':D.st,ph:D.ph,jy:D.jh,bow:1,sz:.95,tongue:1});return}
     rdog(X,y,{c:R.coat,st:R.st,ph:R.ph,g:isD?dGear():R.g,jy:R.jh||0,sz:R.sz||1,bow:R.bow,dir:isD&&D.chase>0&&Math.floor(t*6)%2?'l':'r'});
     if(R.boss&&R.trait!=='none'){ptxt('BOSS',X,y-30,'#ffd86b',1,'c')}
     if(isD){if(D.drf)r(X-14,y-6,4,1,'#7ee8fa');if(D.puff>0&&!D.jh){cx.globalAlpha=D.puff*3;r(X-12,y-2,2,1,'#efe6d6');r(X-15,y-3,2,1,'#efe6d6');cx.globalAlpha=1}heart(X+4,y-25-D.jh-(Math.floor(t*3)%2),'#ff5f9e')}})}
   venueFg(ev.ven,cam);cx.restore();
   /* upcoming warnings */const nx=obs.find(o=>!D.done[o.x]&&o.x-cam>BW-6&&o.x-D.x<260);
   let wn=0;obs.forEach((o,i)=>{if(D.done[i]||wn)return;const X=o.x-cam;if(X>BW-8&&o.x-D.x<270){wn=1;const a=.65+Math.sin(t*12)*.35,y=LANE[3]-30;cx.globalAlpha=a;r(146,y,12,14,'#2b1830');r(147,y+1,10,12,o.duck?'#7ee8fa':'#ffd86b');arw(152,y+3,!o.duck,'#2b1830');cx.globalAlpha=1}});
   /* pops */pops.forEach((p,i)=>{const y=LANE[3]-34-p.t*16-(p.dy||0),z=p.big?2:1,w=p.s.length*4*z;cx.globalAlpha=Math.min(1,(1.1-p.t)*3);ptxtS(p.s,clamp(52,w/2+3,157-w/2),y,p.c,z,'c');cx.globalAlpha=1});
   /* top hud */r(0,0,BW,22,'rgba(14,8,40,.78)');const place=1+riv.filter(R=>R.x>D.x).length;ptxtS(ORD[place-1],4,4,place===1?'#ffd86b':'#fff6e0',2);
   ptxt((time).toFixed(1),156,4,'#cdb8e8',1,'r');r(40,13,112,3,'#3a2e5a');all.slice().sort((a,b)=>a===D?1:b===D?-1:0).forEach(R=>{const k=clamp(R.x/len,0,1),X=40+Math.round(k*108),c=COATS[R.coat].b;if(R===D){r(X-2,9,5,6,'#fff6e0');r(X-1,10,3,4,c)}else r(X-1,11,3,4,R.boss?'#ffd86b':c)});
   ptxt(ev.tt?'TIME TRIAL':ev.scrim?'SCRIMMAGE':ev.field?'DONUT CUP':boss?BOSS[boss].n:VEN[ev.ven].n,40,4,'#cdb8e8',1);
   /* bottom panel */r(0,238,BW,50,'#1a1430');r(0,238,BW,1,'#4a3a6a');ptxt(crum&&!handed?'CRUMPET':'STAMINA',6,243,'#cdb8e8');
   r(6,250,90,7,'#2b1830');const sc=D.sta>50?'#8be28b':D.sta>22?'#ffd86b':'#ff7e7e';r(7,251,Math.round(88*D.sta/100),5,D.gas>0&&Math.floor(t*8)%2?'#ff7e7e':sc);
   for(let i=0;i<5;i++)r(7+i*18,259,16,3,D.d>i/5?'#ff9ccb':'#3a2e5a');
   const zf=D.zm>=1,zx=130,zy=262;disc(zx,zy,17,zf?'#ff7eb6':'#2b1830',1);for(let a=0;a<40;a++){const q=a/40*Math.PI*2-Math.PI/2;r(Math.round(zx+Math.cos(q)*15),Math.round(zy+Math.sin(q)*15),2,2,a/40<=D.zm?'#ffd86b':'#4a3a6a')}
   ptxtS(zf?'ZOOM':D.zt>0?'GO!':'',zx,zy-3,'#fff6e0',1,'c');if(!zf&&D.zt<=0)ptxt(Math.floor(D.zm*100)+'%',zx,zy-2,'#8a7aa8',1,'c');if(zf&&Math.floor(t*4)%2)disc(zx,zy,19,'#fff6e0',.25);
   ptxt('TAP SPRINT',6,268,'#8a7aa8');arw(54,268,true,'#8a7aa8');ptxt('JUMP',60,268,'#8a7aa8');arw(9,278,false,'#8a7aa8');ptxt('DUCK',15,277,'#8a7aa8');ptxt('HOLD FOCUS',38,277,'#8a7aa8');
   if(msg){const ws=msg.s.toUpperCase().split(' '),ls=[''];ws.forEach(w=>{if((ls[ls.length-1]+' '+w).trim().length>36)ls.push(w);else ls[ls.length-1]=(ls[ls.length-1]+' '+w).trim()});r(4,26,152,4+ls.length*8,'rgba(14,8,40,.88)');ls.forEach((l,i)=>ptxt(l,80,29+i*8,'#fff6e0',1,'c'))}
   if(gate){const g=gate,k=Math.sin(t*6);r(0,0,BW,238,'rgba(14,8,40,.45)');r(8,70,144,16+g.l.length*9,'#fff6e0');r(8,70,144,2,'#ff9ccb');r(8,84+g.l.length*9,144,2,'#d9c2a4');
    g.l.forEach((s,i)=>ptxt(s,80,78+i*9,i?'#5a2148':'#c2417a',1,'c'));const gy=110+g.l.length*9;
    if(g.need==='u'||g.need==='d'){const up=g.need==='u',o=Math.round(k*5)*(up?-1:1);disc(80,gy+14+o,5,'#fff6e0',1);disc(80,gy+14+o,3,'#ff9ccb',1);arw(80,gy+(up?0:26),up,'#ffd86b');arw(80,gy+(up?-6:32),up,'#ffd86b')}
    else if(g.need==='tap'){const p=(t*3)%1;disc(80,gy+14,4,'#ff9ccb',1);for(let a=0;a<20;a++){const q2=a/20*Math.PI*2,rr2=5+p*10;r(Math.round(80+Math.cos(q2)*rr2),Math.round(gy+14+Math.sin(q2)*rr2),1,1,'#fff6e0')}}
    else if(g.need==='hold'){disc(80,gy+14,6,'#ff9ccb',1);for(let a=0;a<24;a++){const q2=a/24*Math.PI*2;r(Math.round(80+Math.cos(q2)*10),Math.round(gy+14+Math.sin(q2)*10),2,2,a/24<((t*.8)%1)?'#b78cff':'#5a4a7a')}}
    else if(g.need==='zoom'){const b=Math.round(Math.abs(k)*4);arw(130,236-b,false,'#ffd86b');arw(130,230-b,false,'#ffd86b');disc(130,262,20,'#ffd86b',.35+Math.abs(k)*.3)}}
   if(phase==='count'){const n=Math.ceil(ct);if(ev.tut&&ct>.6){r(8,150,144,20,'#fff6e0');ptxt('TAP RIGHT AT GO',80,154,'#c2417a',1,'c');ptxt('FOR A FAST START',80,162,'#5a2148',1,'c')}r(0,96,BW,40,'rgba(14,8,40,.4)');ptxtS(n>0?String(n):'GO!',80,104,n>0?'#fff6e0':'#8be28b',5,'c');if(ct>2.6)ptxtS('READY...',80,140,'#ffd86b',1,'c')}
   else if(phase==='run'&&time<.9)ptxtS('GO!',80,104,'#8be28b',5,'c');
   if(phase==='end'){const pl=placeOf();if(ev.tt)ptxtS(D.fin.toFixed(2),80,90,'#ffd86b',4,'c');else ptxtS(ORD[pl-1]+'!',80,90,pl===1?'#ffd86b':'#fff6e0',4,'c')}}};
 let at=0;function autoP(dt){const A=SCR.auto;at-=dt;const o=obs.find((o,i)=>!D.done[i]);if(o){const dx=o.x-(D.x+6);if(!o.duck&&D.jt<0&&dx<D.v*.27&&dx>0&&Math.random()<A.k)SCR.swipe('u');if(o.duck&&D.dk<=0&&dx<D.v*.28&&dx>0&&Math.random()<A.k)SCR.swipe('d')}
  IN.down=dis.some(q=>q.on)&&A.k>.5?1:0;if(at<=0){at=A.rate||.36;if(D.sta>(A.save||25)||D.zt>0)tap()}if(D.zm>=1&&D.x/len>(A.zat||.6))special()}
 function placeOf(){const t=D.fin;return 1+riv.filter(R=>R.fin!=null&&R.fin<t).length}
 if(window.CRZ_AUTO)SCR.auto=window.CRZ_AUTO;
 let finished=0;function finish(){if(finished)return;finished=1;const pl=placeOf();if(ev.tut)tutRaceDone(pl,D.fin);else{ev.rec=rec;raceDone(ev,pl,D.fin,riv)}}
 return SCR}
/* ---------------- training minigames ----------------
   Every game reports each move to the shell as good or bad, and the shell answers right away:
   a coloured edge flash, sparkles or a puff, a little shake on mistakes, a sound, and a combo count. */
function mgShell(def,hard){const G={t:0,ph:'how',sc:0,pops:[],parts:[],combo:0,best:0,fl:0,flc:'#8be28b',shk:0,hard:!!hard,cheer:0};let doneT=0,cdn=3;
 const pop=(s,c,x,y,big)=>{x=x||80;y=y||120;G.pops=G.pops.filter(p=>Math.abs(p.x-x)>24||Math.abs(p.y-y)>16);G.pops.push({s,c:c||'#ffd86b',x,y,t:0,big})};G.pop=pop;
 G.good=(x,y,s,lvl)=>{G.cheer=.45;G.combo++;G.best=Math.max(G.best,G.combo);G.fl=.3;G.flc=lvl===2?'#ffd86b':'#8be28b';pop(s,lvl===2?'#ffd86b':'#8be28b',x,y,lvl===2);
  for(let i=0;i<(lvl===2?12:8);i++){const a=i/(lvl===2?12:8)*Math.PI*2;G.parts.push({x,y:y+4,vx:Math.cos(a)*(30+Math.random()*20),vy:Math.sin(a)*(30+Math.random()*20)-10,c:['#ffd86b','#8be28b','#fff6e0'][i%3],t:0,life:.5,k:'s'})}
  if(G.combo>=3&&G.combo%5===0){snd('chime');pop(G.combo+' IN A ROW!','#ff9ccb',80,40,1)}};
 G.bad=(x,y,s)=>{G.combo=0;G.fl=.35;G.flc='#ff5a5a';G.shk=.25;pop(s,'#ff7e7e',x,y,1);
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2;G.parts.push({x,y:y+4,vx:Math.cos(a)*18,vy:Math.sin(a)*12-6,c:'#d8d0e0',t:0,life:.45,k:'p'})}G.parts.push({x,y:y+4,t:0,life:.45,k:'x'})};
 def.init(G);MUS='crzRace';
 return {down(x,y){if(G.ph==='play'&&def.down)def.down(G,x,y)},tap(x,y){if(G.ph==='how'){G.ph='cd';snd('confirm');return}if(G.ph==='play'&&def.tap)def.tap(G,x,y)},swipe(d){if(G.ph==='play'&&def.swipe)def.swipe(G,d)},up(x,y){if(G.ph==='play'&&def.up)def.up(G,x,y)},
  upd(dt){if(G.cheer>0)G.cheer-=dt;if(G.fl>0)G.fl-=dt;if(G.shk>0)G.shk-=dt;G.parts.forEach(p=>{p.t+=dt;if(p.vx!=null){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=60*dt}});G.parts=G.parts.filter(p=>p.t<p.life);G.pops.forEach(p=>p.t+=dt);G.pops=G.pops.filter(p=>p.t<1);
   if(G.ph==='cd'){const a=Math.ceil(cdn);cdn-=dt;if(Math.ceil(cdn)!==a&&cdn>0)snd('beep');if(cdn<=0){G.ph='play';snd('go')}return}
   if(G.ph==='play'){G.t+=dt;def.upd(G,dt);if(G.t>=def.dur||G.over){G.ph='done';G.sc=clamp(def.score(G),.3,1.5);snd(G.sc>1?'win':'coin')}}
   if(G.ph==='done'){doneT+=dt;if(doneT>1.8&&!G.fin){G.fin=1;trainDone(def.k,G.sc,0,G.hard)}}},
  draw(t){const sx=G.shk>0?Math.round(Math.sin(t*80)*2):0;cx.save();cx.translate(sx,0);def.draw(G,t);
   G.parts.forEach(p=>{const a=1-p.t/p.life;cx.globalAlpha=a;if(p.k==='s'){r(p.x,p.y,2,2,p.c);r(p.x-1,p.y+.5,4,1,p.c)}else if(p.k==='p')disc(p.x,p.y,1+p.t*6|0,p.c,a*.8);else{for(let i=-3;i<=3;i++){r(p.x+i,p.y+i-6,2,2,'#ff5a5a');r(p.x+i,p.y-i-6,2,2,'#ff5a5a')}}cx.globalAlpha=1});
   G.pops.forEach(p=>{const z=p.big?2:1,w=p.s.length*4*z;cx.globalAlpha=Math.min(1,(1-p.t)*3);ptxtS(p.s,clamp(p.x,w/2+3,157-w/2),p.y-p.t*14,p.c,z,'c');cx.globalAlpha=1});cx.restore();
   if(S.gym>=2&&G.ph!=='how'){const hop=G.cheer>0?Math.round(Math.abs(Math.sin(G.cheer*14))*3):0;crumpet(149,62-hop,'l',t,1,0);if(G.cheer>0)heart(144,40-Math.round((.45-G.cheer)*20),'#ff5f9e')}
   if(G.fl>0){const a=Math.min(1,G.fl*3);cx.globalAlpha=a*.85;r(0,0,BW,3,G.flc);r(0,BH-3,BW,3,G.flc);r(0,0,3,BH,G.flc);r(BW-3,0,3,BH,G.flc);cx.globalAlpha=a*.12;r(0,0,BW,BH,G.flc);cx.globalAlpha=1}
   r(0,0,BW,18,'rgba(14,8,40,.85)');ptxtS(G.hard?'GUS DRILL X2':def.n.toUpperCase(),4,4,G.hard?'#ffd86b':SN[def.k][2]);if(G.ph==='play'){r(4,13,152,2,'#3a2e5a');r(4,13,Math.round(152*(1-G.t/def.dur)),2,SN[def.k][2])}
   if(G.combo>=2&&G.ph==='play'){const s='X'+G.combo;ptxtS(s,156,4,G.combo>=5?'#ffd86b':'#fff6e0',1,'r');if(G.combo>=5){const f=Math.floor(t*10)%2;r(156-s.length*4-6,5+f,3,4,'#ff8a3a');r(156-s.length*4-5,4,1,2,'#ffd86b')}}
   if(G.ph==='how'){r(10,70,140,112,'rgba(14,8,40,.94)');r(10,70,140,1,SN[def.k][2]);ptxtS(def.n.toUpperCase(),80,80,'#ffd86b',1,'c');def.how.forEach((s,i)=>ptxt(s,80,96+i*10,'#fff6e0',1,'c'));if(G.hard)ptxtS('COACH GUS DRILL: HARDER, GAINS X2',80,138,'#ffd86b',1,'c');
    ptxt('TRAINS '+SN[def.k][1].toUpperCase(),80,150,SN[def.k][2],1,'c');if(Math.floor(t*2)%2)ptxtS('TAP TO START',80,166,'#ff9ccb',1,'c')}
   if(G.ph==='cd')ptxtS(String(Math.ceil(cdn)),80,110,'#fff6e0',5,'c');
   if(G.ph==='done'&&!G.fin){r(20,96,120,60,'rgba(14,8,40,.92)');ptxtS(G.sc>=1.2?'AMAZING!':G.sc>=.9?'GREAT!':G.sc>=.6?'GOOD':'KEEP AT IT',80,104,'#ffd86b',2,'c');const n=G.sc>=1.2?3:G.sc>=.8?2:1;for(let i=0;i<3;i++)starPx(62+i*14,124,i<n);if(G.best>=3)ptxt('BEST STREAK '+G.best,80,142,'#cdb8e8',1,'c')}}}}
function starPx(x,y,on){const c=on?'#ffd86b':'#4a3a6a';r(x+3,y,2,2,c);r(x,y+2,8,2,c);r(x+1,y+4,6,2,c);r(x,y+6,3,2,c);r(x+5,y+6,3,2,c)}
function grassBg(){r(0,0,160,288,'#5aa83a');for(let y=0;y<288;y+=12)r(0,y,160,6,'#5fac3e')}
const DUST=(G,x,y)=>{for(let i=0;i<3;i++)G.parts.push({x:x-i*3,y,vx:-20-i*10,vy:-8,c:'#efe6d6',t:0,life:.3,k:'p'})};

/* 1. Treadmill Tempo: tap on the beat */
const MG_SPD={k:'spd',n:'Treadmill Tempo',dur:17,how:['TAP WHEN EACH PAW','PRINT HITS THE RING.','THE BEAT GETS FASTER!'],
 init(G){G.notes=[];let tt=1.0,bpm=G.hard?120:96;while(tt<16.5){G.notes.push({t:tt,h:0});bpm=Math.min(G.hard?196:168,bpm+(G.hard?4.4:3.2));tt+=60/bpm}G.p=0;G.g=0;G.m=0;G.run=0;G.ring=0;G.ringC='#ff9ccb';G.trip=0;G.zip=0},
 upd(G,dt){if(G.ring>0)G.ring-=dt;if(G.trip>0)G.trip-=dt;if(G.zip>0)G.zip-=dt;
  G.notes.forEach(n=>{if(!n.h&&G.t-n.t>.16){n.h=-1;G.m++;G.ring=.25;G.ringC='#ff5a5a';G.trip=.3;G.bad(40,192,'MISS')}});
  const nx=G.notes.find(n=>n.t>G.t);if(nx&&!nx.tk&&nx.t-G.t<.02){nx.tk=1;snd('tick')}G.run+=dt*(4+G.t*.5)*(G.trip>0?.5:1)},
 tap(G){const n=G.notes.filter(n=>!n.h).sort((a,b)=>Math.abs(a.t-G.t)-Math.abs(b.t-G.t))[0];
  if(!n||Math.abs(n.t-G.t)>.16){G.m++;G.ring=.25;G.ringC='#ff5a5a';G.trip=.3;G.bad(40,192,n&&n.t>G.t?'TOO EARLY':'OFF BEAT');snd('miss');return}
  const e=Math.abs(n.t-G.t);n.h=1;G.ring=.25;if(e<.06){G.p++;G.ringC='#8be28b';G.zip=.25;G.good(40,192,'PERFECT',2);snd('ding')}else{G.g++;G.ringC='#ffd86b';G.good(40,192,n.t>G.t?'A BIT EARLY':'A BIT LATE');snd('blip')}},
 score:G=>(G.p+G.g*.6-G.m*.15)/G.notes.length*1.45,
 draw(G,t){r(0,0,160,288,'#9a9aa2');r(0,0,160,120,'#b8b4bc');for(let x=0;x<160;x+=10)r(x,18,1,102,'#aeaab4');r(0,120,160,168,'#3a3a44');const tm=G.t;
  r(28,166,104,10,'#2a2a34');r(28,166,104,2,'#5a5a66');for(let i=0;i<10;i++)r(28+((i*11-Math.floor(G.run*30))%104+104)%104,170,1,4,'#6a6a76');r(122,128,4,40,'#6a6a76');r(114,124,16,8,'#2a6ad8');ptxt(String(Math.round(96+tm*4.3)),122,126,'#7ee8fa',1,'c');
  if(G.zip>0){cx.globalAlpha=G.zip*3;for(let i=0;i<4;i++)r(50-i*6,150+i*4,10,1,'#fff6e0');cx.globalAlpha=1}
  rdog(78+(G.trip>0?Math.round(Math.sin(t*50)):0),166,{c:'red',st:G.trip>0?'trip':'run',ph:G.run*4,g:dGear()});
  r(0,196,160,34,'#1a1430');r(0,196,160,1,'#4a3a6a');const rc=G.ring>0?G.ringC:'#ff9ccb',rr2=9+(G.ring>0?(1-G.ring/.25)*5:0);disc(40,212,9,rc,G.ring>0?.55:.25);
  for(let a=0;a<24;a++){const q=a/24*Math.PI*2;r(Math.round(40+Math.cos(q)*rr2),Math.round(212+Math.sin(q)*rr2),1,1,rc)}
  G.notes.forEach(n=>{if(n.h)return;const X=40+(n.t-tm)*70;if(X>-6&&X<170){const near=Math.abs(n.t-tm)<.16,c=near?'#8be28b':'#fff6e0';r(X-2,210,5,4,c);r(X-3,207,2,2,c);r(X+2,207,2,2,c);r(X,206,1,2,c)}});
  ptxt('TAP ON THE BEAT',80,240,'#cdb8e8',1,'c');ptxt('PERFECT '+G.p+'  GOOD '+G.g+'  MISS '+G.m,80,252,'#8a7aa8',1,'c')}};

/* 2. Fetch Sprint: react the instant the ball flies */
const MG_ACC={k:'acc',n:'Fetch Sprint',dur:60,how:['HUNTER WILL THROW','THE BALL. TAP THE','INSTANT IT FLIES.','DON’T FALL FOR FAKES!'],
 init(G){G.rd=0;G.sc2=[];G.st='wait';G.at=rr(1.2,2.4);G.fake=Math.random()<(G.hard?.85:.5)?rr(.5,G.at-.3):-1;G.lt=0;G.dx=0;G.bx=0;G.rt=null;G.skid=0},
 upd(G,dt){G.lt+=dt;if(G.skid>0)G.skid-=dt;
  if(G.st==='wait'){if(G.lt>=G.at){G.st='fly';G.ft=G.lt;snd('throw')}}
  else if(G.st==='fly'){G.bx+=dt;if(G.lt-G.ft>1.1){G.sc2.push(.3);G.rt=1.1;G.bad(80,120,'TOO SLOW');G.st='run'}}
  else if(G.st==='run'){G.dx+=dt*150;if(Math.random()<.4)DUST(G,20+G.dx-8,196);if(G.dx>110){G.st='back';G.lt=0}}
  else if(G.st==='back'){if(G.lt>1){G.rd++;if(G.rd>=5){G.over=1;return}G.st='wait';G.lt=0;G.at=rr(1,2.6);G.fake=Math.random()<(G.hard?.85:.55)?rr(.45,G.at-.3):-1;G.dx=0;G.bx=0;G.rt=null}}},
 tap(G){if(G.st==='wait'){G.sc2.push(0);const fk=G.fake>0&&Math.abs(G.lt-G.fake)<.4;G.bad(80,120,fk?'FAKED OUT!':'FALSE START!');snd('miss');G.st='back';G.lt=0;G.skid=.5;G.dx=12;return}if(G.st!=='fly')return;const rt=G.lt-G.ft;G.rt=rt;
  const s=rt<.24?1.5:rt<.34?1.2:rt<.48?.9:rt<.7?.6:.35;G.sc2.push(s);if(s>=1.2){G.good(80,120,rt<.24?'LIGHTNING!':'QUICK!',rt<.24?2:1);snd('boost')}else if(s>=.9){G.good(80,120,'GOOD');snd('step')}else{G.bad(80,120,'SLOW START');snd('step')}G.st='run'},
 score:G=>G.sc2.reduce((a,b)=>a+b,0)/5,
 draw(G,t){skyPaint('day');r(0,140,160,148,'#5aa83a');for(let y=140;y<288;y+=12)r(0,y,160,6,'#5fac3e');
  const hx=128,thr=G.st==='fly'||G.st==='run';const fakeArm=G.st==='wait'&&G.fake>0&&Math.abs(G.lt-G.fake)<.25;
  ppl('hunter',hx,182,t,'l');if(G.st==='wait'&&!fakeArm)disc(hx-5,166,2,'#c8e83a',1);if(fakeArm){r(hx-8,158,2,6,'#f1c9a0');disc(hx-8,156,2,'#c8e83a',1)}
  if(thr){const k=Math.min(1,G.bx/1.1),bx=hx-8-k*120,by=160-Math.sin(k*Math.PI)*60+k*30;disc(bx,by,2,'#c8e83a',1);if(G.st==='fly'){cx.globalAlpha=.5;disc(bx+3,by-2,1,'#c8e83a',1);cx.globalAlpha=1}}
  const dx=20+G.dx;rdog(dx,196,{c:'red',st:G.st==='run'?'run':G.skid>0?'trip':G.st==='wait'?'duck':'stand',ph:G.dx*.2,g:dGear()});
  if(G.st==='wait'){const p=(Math.sin(t*6)+1)/2;cx.globalAlpha=.6+p*.4;ptxtS('READY...',80,220,'#fff6e0',1,'c');cx.globalAlpha=1}
  if(G.st==='fly'&&Math.floor(t*12)%2)ptxtS('NOW!',80,220,'#ffd86b',2,'c');
  /* reaction meter */r(20,232,120,8,'#2b1830');r(20,232,22,8,'#8be28b');r(42,232,24,8,'#c8e870');r(66,232,30,8,'#ffd86b');r(96,232,44,8,'#ff9a6a');
  if(G.rt!=null){const X=20+Math.min(119,G.rt/1.1*120);r(X-1,229,3,14,'#fff6e0');ptxt((Math.round(G.rt*1000))+' MS',80,246,'#2b1830',1,'c')}else ptxt('REACTION',80,246,'#2b1830',1,'c');
  for(let i=0;i<5;i++){const s=G.sc2[i],c=s==null?'#3a7a2a':s>=1.2?'#ffd86b':s>=.9?'#8be28b':s>0?'#ff9a6a':'#ff5a5a';disc(60+i*10,262,3,c,1)}}};

/* 3. Pool Laps: alternate left and right */
const MG_STA={k:'sta',n:'Pool Laps',dur:15,how:['TAP LEFT, THEN RIGHT,','THEN LEFT, THEN RIGHT.','A STEADY RHYTHM','SWIMS FARTHEST.'],
 init(G){G.x=0;G.v=0;G.last=null;G.good2=0;G.bad2=0;G.pl=0;G.pc='#8be28b';G.ps=null},
 upd(G,dt){G.v=Math.max(0,G.v-dt*(G.hard?21:14));G.x+=G.v*dt;if(G.pl>0)G.pl-=dt},
 down(G,x){const s=x<80?'l':'r';G.ps=s;G.pl=.2;if(s===G.last){G.bad2++;G.v*=.5;G.pc='#ff5a5a';G.bad(x<80?40:120,170,'SAME SIDE!');snd('splash')}
  else{G.good2++;G.v=Math.min(46,G.v+8);G.pc='#8be28b';snd('blip');G.combo++;G.best=Math.max(G.best,G.combo);if(G.combo%8===0)G.good(70,130,'GREAT RHYTHM!',2);
   for(let i=0;i<3;i++)G.parts.push({x:60-i*4,y:150,vx:-30-i*8,vy:-20-Math.random()*10,c:'#c8ecff',t:0,life:.35,k:'s'})}G.last=s},
 score:G=>G.x/330*1.3,
 draw(G,t){r(0,0,160,288,'#e8e4ec');for(let y=18;y<100;y+=10)for(let x=(y/10%2)*8;x<160;x+=16)r(x,y,15,9,'#f6f2fa');r(0,100,160,110,'#3a8ac8');for(let y=110;y<210;y+=24)r(0,y,160,1,'#5aa8e0');
  for(let i=0;i<20;i++){const x=((i*31-G.x*2)%180+180)%180-10;r(x,104+(i*13)%100,5,1,'#8ac8f0')}for(let x=-((G.x*2)%40);x<160;x+=40)for(let y=128;y<210;y+=24){r(x,y,20,2,'#ff7eb6');r(x+20,y,20,2,'#fff6e0')}
  const bob=Math.round(Math.sin(t*8)*1);rdog(70,150+bob,{c:'red',st:'swim',ph:t*8,g:dGear()});const wk=Math.min(3,Math.round(G.v/12));for(let i=0;i<wk;i++)r(52-i*6,148+((i+Math.floor(t*10))%2),3,1,'#fff6e0');
  /* speed bar */r(20,90,120,5,'#c8c4d0');r(20,90,Math.round(120*G.v/46),5,G.v>34?'#8be28b':G.v>18?'#ffd86b':'#ff9a6a');ptxt('SPEED',20,82,'#8a7aa8');
  const nxt=G.last==='l'?'r':G.last==='r'?'l':null;
  ['l','r'].forEach(s=>{const x0=s==='l'?0:81,hot=G.pl>0&&G.ps===s,want=nxt===s&&G.pl<=0;r(x0,210,79,78,hot?(G.pc==='#ff5a5a'?'#5a1a2a':'#1e4a2a'):'#1a1430');
   if(want){const a=.35+Math.sin(t*8)*.25;cx.globalAlpha=a;r(x0+2,212,75,74,'#7ee8fa');cx.globalAlpha=1}ptxtS(s==='l'?'LEFT':'RIGHT',x0+40,236,'#7ee8fa',2,'c');if(want)ptxt('NEXT',x0+40,256,'#fff6e0',1,'c')});
  r(80,210,1,78,'#4a3a6a');ptxt(Math.floor(G.x/6)+' M',80,22,'#2b1830',1,'c');r(30,30,100,3,'#c8c4d0');r(30,30,Math.min(100,G.x/330*100),3,'#8be28b')}};

/* 4. Weave Poles: run up the course and weave left, right, left... (seen from behind, like the story's 3/4 view) */
let WTILE=null;function weaveTile(){if(WTILE)return WTILE;return WTILE=mkc(160,64,()=>{r(0,0,160,64,'#5e9a46');PR=77;for(let i=0;i<70;i++){const x=pri(0,159),y=pri(0,63);r(x,y,1,2,prn()<.5?'#578f40':'#669f4c')}for(let i=0;i<10;i++){const x=pri(0,159),y=pri(0,63);r(x,y,1,1,ppk(['#e8e4f0','#ffd86b']))}})}
function arwS(x,y,d,c){for(let i=0;i<4;i++)r(d<0?x-3+i:x+3-i,y-i,1,i*2+1,c);r(d<0?x+1:x-6,y,6,1,c)}
function dogBack(x,y,t,run,lean){x=Math.round(x);y=Math.round(y);const O='#e0903a',L='#eaa456',D='#c87a32',Wt='#fbf6ec',f=run?Math.floor(t*12)%2:0,b=run?f:0;ell(x,y,7,1,'#000',.2);
 const ly=y-4;r(x-5,ly+(f?-2:0),3,4,Wt);r(x+3,ly+(f?0:-2),3,4,Wt);r(x-5,ly-1+(f?-2:0),3,1,O);r(x+3,ly-1+(f?0:-2),3,1,O);
 const by=y-13-b;r(x-6,by,13,9,O);r(x-6,by,13,1,L);r(x-7,by+2,1,6,O);r(x+7,by+2,1,6,O);r(x-5,by+4,5,5,Wt);r(x+1,by+4,5,5,Wt);r(x,by+5,1,4,'#e2d6c4');r(x-4,by+9,9,1,Wt);
 const hy=by-6+(lean?1:0),hx=x-4+(lean||0);r(hx,hy,9,7,O);r(hx,hy,9,1,L);r(hx,hy+1,1,6,D);r(hx+8,hy+1,1,6,D);
 for(let k=0;k<5;k++){const w=1+Math.round(k*.6);r(hx,hy-5+k,w,1,O);r(hx+9-w,hy-5+k,w,1,O)}r(hx,hy-5,1,1,L);r(hx+8,hy-5,1,1,L)}
const MG_AGI={k:'agi',n:'Weave Poles',dur:32,how:['TAP LEFT OR RIGHT TO','WEAVE AROUND EACH POLE:','LEFT OF ONE, RIGHT OF','THE NEXT. FOLLOW THE PAWS!'],
 init(G){G.y=0;G.v=G.hard?58:42;G.side=-1;G.dx=-13;G.poles=[];for(let i=0;i<18;i++)G.poles.push({y:-40-i*46,need:i%2?1:-1,res:0,wob:0});G.ok=0;G.bad2=0;G.st=0;G.lastSw=-9},
 upd(G,dt){G.v=Math.min(G.hard?128:104,G.v+dt*(G.hard?4:3.2));if(G.st>0){G.st-=dt}G.y+=G.v*dt*(G.st>0?.4:1);G.dx=lerp(G.dx,G.side*13,Math.min(1,dt*16));
  G.poles.forEach(p=>{if(p.wob>0)p.wob-=dt;if(p.res)return;const Y=p.y+G.y;if(Y>206){const ok=Math.sign(G.dx)===p.need&&Math.abs(G.dx)>6;p.res=ok?1:-1;
   if(ok){G.ok++;G.good(80,Y-24,G.combo>=4?'SMOOTH!':'NICE',G.combo>=4?2:1);snd('blip')}else{G.bad2++;p.wob=.5;G.st=.35;G.bad(80,Y-24,'WRONG SIDE');snd('bump')}}});
  if(G.poles.every(p=>p.res))G.over=1},
 down(G,x){const s=x<80?-1:1;if(s!==G.side){G.side=s;G.lastSw=G.t;snd('step')}},swipe(G,d){if(d==='l')G.side=-1;if(d==='r')G.side=1},
 score:G=>(G.ok-G.bad2*.4)/18*1.45,
 draw(G,t){const T2=weaveTile(),oy=Math.round(G.y)%64;for(let y=oy-64;y<288;y+=64)cx.drawImage(T2,0,y);
  /* the agility lane and the poles' base rail */r(52,0,56,288,'rgba(255,255,255,.05)');r(52,0,1,288,'rgba(255,255,255,.25)');r(107,0,1,288,'rgba(255,255,255,.25)');r(79,0,2,288,'#8a8a96');r(79,0,1,288,'#a8a8b4');
  const nx=G.poles.find(p=>!p.res);
  /* paw prints show the path to take around the next few poles */
  G.poles.forEach(p=>{if(p.res)return;const Y=p.y+G.y;if(Y<10||Y>210)return;const X=80+p.need*14,cur=p===nx,a=cur?.75+Math.sin(t*8)*.25:.3;cx.globalAlpha=a;const c=cur?'#fff6e0':'#e8f0d8';r(X-1,Y+2,3,2,c);r(X-2,Y,1,1,c);r(X,Y-1,1,1,c);r(X+2,Y,1,1,c);r(X-1,Y+12,3,2,c);r(X-2,Y+10,1,1,c);r(X,Y+9,1,1,c);r(X+2,Y+10,1,1,c);cx.globalAlpha=1;
   if(cur&&Y>30){arw(X,Y-14+Math.round(Math.sin(t*8)),true,'#ffd86b')}});
  G.poles.forEach(p=>{const Y=Math.round(p.y+G.y);if(Y<-20||Y>300)return;const w=p.wob>0?Math.round(Math.sin(t*50)*p.wob*4):0,tape=p.need<0?'#d8352f':'#2a6ad8';
   ell(81,Y,3,1,'#000',.25);for(let i=0;i<18;i++){const yy=Y-1-i,xx=80+Math.round(w*i/18);r(xx,yy,2,1,(i>>2)%2?'#f6f2ea':tape)}r(80+w-1,Y-19,4,1,'#ffd86b');
   if(p.res){const ok=p.res>0,X=80+p.need*14;if(ok){r(X-3,Y-8,2,2,'#8be28b');r(X-1,Y-6,2,2,'#8be28b');r(X+1,Y-8,2,2,'#8be28b');r(X+3,Y-10,2,2,'#8be28b')}else{for(let i=-2;i<=2;i++){r(X+i,Y-8+i,2,2,'#ff5a5a');r(X+i,Y-8-i,2,2,'#ff5a5a')}}}});
  dogBack(80+G.dx,214,t,1,Math.sign(G.dx));
  const L=G.side<0,a=G.t-G.lastSw<.15;r(0,236,79,52,L?'rgba(126,232,250,.22)':'rgba(14,8,40,.7)');r(81,236,79,52,!L?'rgba(126,232,250,.22)':'rgba(14,8,40,.7)');r(79,236,2,52,'rgba(14,8,40,.85)');
  arwS(40,249,-1,'#fff6e0');ptxtS('LEFT',40,258,'#fff6e0',2,'c');arwS(120,249,1,'#fff6e0');ptxtS('RIGHT',120,258,'#fff6e0',2,'c');
  if(nx){const want=nx.need<0?'l':'r';cx.globalAlpha=.35+Math.sin(t*8)*.25;r(want==='l'?0:81,236,79,2,'#ffd86b');cx.globalAlpha=1}
  ptxtS(G.ok+' / 18',80,24,'#fff6e0',1,'c')}};

/* 5. Squirrel Watch: tap treats, ignore squirrels */
const MG_FOC={k:'foc',n:'Squirrel Watch',dur:16,how:['DONUT IS ON A SIT-STAY.','TAP THE TREATS THAT POP UP.','DO NOT TAP THE SQUIRRELS.','(SHE WANTS TO. SO BAD.)'],
 init(G){G.it=[];G.nt=.6;G.hit=0;G.sq=0;G.ms=0;G.tot=0;G.wob=0;G.happy=0},
 upd(G,dt){G.nt-=dt;if(G.happy>0)G.happy-=dt;if(G.nt<=0){G.nt=(rr(.45,.95)-G.t*.012)*(G.hard?.72:1);const holes=[[30,150],[80,136],[130,150],[48,186],[112,186]];const free=holes.filter(h=>!G.it.some(i=>i.h===h&&!i.gone));if(free.length){const h=pick(free),tr=Math.random()<(G.hard?.36:.45);if(tr)G.tot++;G.it.push({h,tr,t:0,life:(rr(.8,1.1)-G.t*.015)*(G.hard?.75:1)})}}
  G.it.forEach(i=>{i.t+=dt;if(i.t>i.life&&!i.gone){i.gone=1;if(i.tr&&!i.got){G.ms++;G.combo=0;G.pop('MISSED','#cdb8e8',i.h[0],i.h[1]-14);for(let k=0;k<5;k++)G.parts.push({x:i.h[0],y:i.h[1]-6,vx:(k-2)*8,vy:-10,c:'#d8d0e0',t:0,life:.35,k:'p'})}}});
  G.it=G.it.filter(i=>!i.gone||i.t<i.life+.2);if(G.wob>0)G.wob-=dt},
 tap(G,x,y){const i=G.it.find(i=>!i.gone&&Math.abs(i.h[0]-x)<14&&Math.abs(i.h[1]-8-y)<14);if(!i)return;i.gone=1;i.got=1;
  if(i.tr){G.hit++;G.happy=.5;G.good(i.h[0],i.h[1]-20,G.combo>=3?'GOOD GIRL!!':'GOOD GIRL!',G.combo>=3?2:1);snd('coin')}else{G.sq++;G.wob=.6;G.bad(i.h[0],i.h[1]-20,'NO! STAY!');snd('alert')}},
 score:G=>(G.hit-G.sq*1.2-G.ms*.4)/Math.max(4,G.tot)*1.45,
 draw(G,t){skyPaint('day');r(0,100,160,188,'#5aa83a');for(let y=100;y<288;y+=12)r(0,y,160,6,'#5fac3e');for(let x=0;x<160;x+=10){r(x,80,8,22,'#c8945a');r(x,80,8,1,'#e0b070')}
  const H=[[30,150],[80,136],[130,150],[48,186],[112,186]];H.forEach(([x,y])=>{disc(x,y+2,10,'#3a8a3a',1);disc(x-5,y,6,'#4a9a3a',1)});
  G.it.forEach(i=>{if(i.gone)return;const k=Math.min(1,i.t/.12),[x,y]=i.h,yy=y-Math.round(k*10),left=1-i.t/i.life;
   if(i.tr){r(x-5,yy-3,10,3,'#e8c080');disc(x-5,yy-2,2,'#e8c080',1);disc(x+5,yy-2,2,'#e8c080',1);if(Math.floor(t*8)%2)r(x+6,yy-6,1,1,'#fff6e0')}else disDraw('squirrel',x,yy+3,t);
   r(x-6,yy+5,12,1,'#2b1830');r(x-6,yy+5,Math.round(12*left),1,i.tr?'#8be28b':'#ff9a6a')});
  H.forEach(([x,y])=>{disc(x,y+6,9,'#3a8a3a',1)});
  const wb=G.wob>0?Math.round(Math.sin(t*40)*2):0,up=G.wob>.3;rdog(80+wb,244-(up?3:0),{c:'red',st:up?'stand':'sit',g:dGear(),tongue:G.happy>0,dir:up&&Math.floor(t*6)%2?'l':'r'});
  if(G.happy>0){heart(76,214-Math.round((.5-G.happy)*16),'#ff5f9e')}if(G.wob>0)ptxtS('!',96,214,'#ff7e7e',2);
  ptxt('TREATS '+G.hit+'  OOPS '+G.sq+'  MISSED '+G.ms,80,272,'#2b1830',1,'c')}};

/* 6. Photo Shoot: pose on cue */
const POSES=[['SIT','sit'],['BOW','bow'],['TILT','tilt'],['WAVE','wave']];
function posed(x,y,p,t){if(p==='bow'){rdog(x,y,{c:'red',st:'duck',g:dGear(),tongue:1});r(x-10,y-12,2,3,'#e0903a')}else{rdog(x,y,{c:'red',st:'sit',g:dGear(),tongue:p!=='sit'});if(p==='tilt')ptxtS('?',x+12,y-26,'#fff6e0',1);if(p==='wave'){r(x+8,y-14+Math.round(Math.sin(t*12)),2,6,'#fbf6ec')}}}
const MG_CHA={k:'cha',n:'Photo Shoot',dur:40,how:['THE PHOTOGRAPHER CALLS','A POSE. TAP THE MATCHING','POSE BEFORE THE','SHUTTER CLICKS!'],
 init(G){G.n=0;G.ok=0;G.pk=-1;G.pkT=0;G.pkOk=0;G.shots=[];G.next=()=>{G.want=pick(POSES)[1];G.lim=G.hard?Math.max(.85,1.8-G.n*.14):Math.max(1.05,2.3-G.n*.16);G.lt=0;G.cur=G.cur||'sit';G.n++};G.next();G.fl2=0},
 upd(G,dt){G.lt+=dt;if(G.fl2>0)G.fl2-=dt;if(G.pkT>0)G.pkT-=dt;if(G.lt>=G.lim){G.shots.push(0);G.bad(80,150,'TOO SLOW');snd('miss');if(G.n>=8)G.over=1;else G.next()}},
 tap(G,x,y){if(y<236)return;const i=clamp(Math.floor(x/40),0,3);const p=POSES[i][1];G.cur=p;G.pk=i;G.pkT=.3;
  if(p===G.want){const q=Math.max(0,(G.lim-G.lt)/G.lim);G.ok+=1+q*.5;G.fl2=.25;G.pkOk=1;G.shots.push(q>.5?2:1);snd('shutter');G.good(80,150,q>.5?'PERFECT SHOT!':'SNAP!',q>.5?2:1)}
  else{G.pkOk=0;G.shots.push(0);snd('miss');G.bad(80,150,'WRONG POSE')}if(G.n>=8)G.over=1;else G.next()},
 score:G=>G.ok/8*1.15,
 draw(G,t){r(0,0,160,288,'#f0e6f6');r(0,180,160,56,'#e0d4ea');ell(80,196,40,6,'#d0c4dc',1);r(10,30,2,120,'#3a3a44');disc(11,26,8,'#fff6d0',1);r(148,30,2,120,'#3a3a44');disc(149,26,8,'#fff6d0',1);
  ppl('abi',130,170,t,'l');r(118,150,8,6,'#2a2a34');r(116,152,3,3,'#5a5a66');posed(72,196,G.cur,t);
  const urg=G.lt/G.lim>.65&&Math.floor(t*8)%2;r(20,40,120,40,'#fff6e0');r(20,40,120,1,urg?'#ff5a5a':'#c2417a');ptxt('POSE:',80,46,'#8a7aa8',1,'c');ptxtS(POSES.find(p=>p[1]===G.want)[0],80,58,'#c2417a',2,'c');
  r(30,74,100,3,'#e8dcf0');const k=1-G.lt/G.lim;r(30,74,Math.round(100*k),3,k>.5?'#8be28b':k>.25?'#ffd86b':'#ff5a5a');
  for(let i=0;i<8;i++){const s=G.shots[i];r(44+i*9,86,7,6,s==null?'#e0d4ea':s===2?'#ffd86b':s===1?'#8be28b':'#ff9a9a');r(45+i*9,87,5,3,s==null?'#e8dcf0':'#fff6e0')}
  if(G.fl2>0){cx.globalAlpha=G.fl2*3;r(0,0,160,288,'#ffffff');cx.globalAlpha=1}
  r(0,236,160,52,'#2b1830');POSES.forEach(([n,p],i)=>{const hot=G.pk===i&&G.pkT>0;r(i*40+2,238,36,48,hot?(G.pkOk?'#c8f8c0':'#ffc8c8'):'#fff6e0');r(i*40+2,238,36,1,hot?(G.pkOk?'#8be28b':'#ff5a5a'):'#ff9ccb');ptxt(n,i*40+20,278,'#5a2148',1,'c');posed(i*40+16,268,p,0)});
  ptxt('SHOT '+Math.min(8,G.n)+' / 8',80,24,'#5a2148',1,'c')}};
const MGS={spd:MG_SPD,acc:MG_ACC,sta:MG_STA,agi:MG_AGI,foc:MG_FOC,cha:MG_CHA};
/* ---------------- story-scale scenes (2x, like the rest of Our Story) ----------------
   The hub and every cutscene draw at the story's scale: 80 x 144 world pixels, each 2 screen pixels,
   with the game's own rooms, people and dogs so it all matches the story. */
function at2(fn){cx.save();cx.scale(2,2);try{fn()}finally{cx.restore()}}
/* draw one of Our Story's rooms with nobody in it (we place our own cast), plus its lighting */
function borrow(name,t,lt,pre){const Wd=window,sv={corgi:Wd.corgi,crumpet:Wd.crumpet,epYardDog:Wd.epYardDog,rocker:Wd.rocker};const E=typeof ep!=='undefined'?ep:null;
 const es=E?{ppl:E.ppl,dn:E.dn,cr:E.cr,pan:E.pan,fb:E.fb}:null;const L0=loc;
 Wd.corgi=Wd.crumpet=Wd.epYardDog=()=>{};if(pre&&pre.keepRocker){}else if(pre&&pre.noRocker)Wd.rocker=()=>{};if(E){E.ppl=[];E.dn=E.cr=null;E.pan=0}
 try{if(pre&&pre.before)pre.before();Wd[name](t);if(lt){loc=lt;try{ltDraw(t,0)}catch(e){}}}catch(e){console.warn('borrow',name,e)}
 finally{loc=L0;Object.assign(Wd,sv);if(E)Object.assign(E,es);if(pre&&pre.after)pre.after()}}
/* the game's corgi at story scale, recoloured for rivals, with gear on top */
function gcorgi(x,y,o){const C=typeof o.c==='string'?COATS[o.c]:o.c,t=o.t||0,run=o.st==='run';x=Math.round(x);y=Math.round(y)-(o.jy|0);
 const N='#2a1a1a',W2=C.w,FL=sh(W2,.94);ell(x,y+(o.jy|0),8,1,'#000',.18);cx.save();if(o.dir==='l'){cx.translate(2*x+1,0);cx.scale(-1,1)}
 if(o.st==='sit'){r(x-4,y-7,7,7,C.b);r(x-5,y-5,1,5,C.b);r(x+3,y-6,1,5,C.b);r(x-4,y-7,7,1,C.l);if(C.k)r(x-4,y-7,5,2,C.k);r(x,y-6,3,5,W2);r(x,y-1,1,1,W2);r(x+2,y-1,1,1,W2);r(x-6,y-2,3,2,C.b);r(x-7,y-3,1,2,W2);
  r(x-1,y-12,6,5,C.b);r(x-1,y-12,6,1,C.l);r(x+1,y-12,1,3,W2);r(x+2,y-9,3,2,W2);r(x+5,y-9,1,1,N);r(x+3,y-11,1,1,N);if(o.tongue)r(x+3,y-7,1,1,'#ff7e9e');
  r(x-1,y-15,2,3,C.b);r(x+3,y-15,2,3,C.b);r(x+3,y-14,1,2,'#f0a0a0');gear2(x,y,o.g,'sit',0)}
 else if(o.st==='lie'){r(x-7,y-5,13,5,C.b);r(x-7,y-5,13,1,C.l);if(C.k)r(x-6,y-5,8,2,C.k);r(x-6,y-1,10,1,W2);r(x-8,y-4,1,3,W2);r(x+3,y-2,5,2,W2);
  r(x+4,y-9,5,5,C.b);r(x+4,y-9,5,1,C.l);r(x+6,y-9,1,3,W2);r(x+7,y-6,3,2,W2);r(x+10,y-6,1,1,N);if(o.sleep)r(x+6,y-7,2,1,N);else r(x+7,y-8,1,1,N);r(x+4,y-11,2,2,C.b);r(x+7,y-11,2,2,C.b);r(x+7,y-10,1,1,'#f0a0a0');gear2(x,y,o.g,'lie',0)}
 else{const L=14,h=5,lg=3,g4=run?Math.floor(t*14)%4:-1,air=g4===1?1:0;y-=air;const by=y-lg;
  [[x-L/2+1,0,-1],[x-L/2+3,1,-1],[x+L/2-4,1,1],[x+L/2-2,0,1]].forEach(([lx,k,e])=>{const ox=g4===0?e:g4===2?-e:0;r(Math.round(lx)+ox,by,2,lg,k?W2:FL);const b=o.g&&o.g.paws;if(b)r(Math.round(lx)+ox,by+lg-1,2,1,gC(o.g,b)||'#2a6ad8')});
  r(x-L/2,by-h,L,h,C.b);r(x-L/2,by-h,L,1,C.l);r(x-L/2+2,by-1,L-4,1,W2);r(x-L/2-1,by-h+1,1,h-1,W2);r(x+L/2-2,by-h+1,2,h-1,W2);
  if(C.k){r(x-L/2+1,by-h,L-6,2,C.k)}if(C.m){r(x-3,by-h+2,2,1,C.k);r(x+1,by-h+1,1,2,C.k)}if(C.f){r(x-L/2-2,by-h+2,1,2,W2);r(x-4,by,2,1,W2)}
  const hs=5,hx=x+L/2-1,hy=by-h+1;r(hx,hy-hs+1,hs,hs,C.b);r(hx+hs-1,hy-1,2,2,W2);r(hx+hs+1,hy-1,1,1,N);r(hx+2,hy-hs+1,1,hs-1,W2);r(hx+hs-2,hy-hs+2,1,1,N);
  if(C.k&&(o.c==='blk'||o.c==='tri'))r(hx,hy-hs+1,2,2,C.k);const ey=hy-hs+1;
  if(run){r(hx-1,ey-2,2,2,C.b);r(hx+2,ey-2,2,2,C.b);r(hx+2,ey-1,1,1,'#f0a0a0');r(hx-1,ey-2,1,1,C.d)}else{r(hx,ey-3,2,3,C.b);r(hx+3,ey-3,2,3,C.b);r(hx+3,ey-2,1,2,'#f0a0a0');r(hx,ey-3,1,1,C.d)}
  if(run||o.tongue)r(hx+hs,hy+1,1,1,'#ff7e9e');gear2(x,y,o.g,'stand',run)}
 cx.restore()}
/* body gear on a sitting dog at story scale */
function sitGear2(x,y,b,g){
 if(b.startsWith('band')){const c=gC(g,b);r(x,y-7,3,1,c);r(x+1,y-6,1,1,c);return}
 if(b==='bowP')return;
 if(b.startsWith('silk')){const c=gC(g,b);r(x-4,y-7,4,3,c);r(x-4,y-7,4,1,sh(c,1.2));r(x-3,y-6,2,1,'#fff6e0');return}
 if(b==='harn'){r(x-5,y-5,8,1,'#ff7eb6');r(x+1,y-7,1,3,'#ff7eb6');return}
 const fit=(c)=>{r(x-4,y-7,7,4,c);r(x-5,y-5,1,2,c);r(x+3,y-6,1,3,c)};
 if(b==='neon'){fit('#b8ff3a');r(x-5,y-5,9,1,'#ff3ad8');return}
 if(b==='sweater'){fit('#c84a5a');r(x-5,y-5,9,1,'#fff6e0');r(x-4,y-7,7,1,sh('#c84a5a',1.12));return}
 if(b==='jersey'){fit('#2a6ad8');r(x,y-6,2,2,'#fff6e0');return}
 if(b==='stripe'){for(let i=0;i<4;i++)r(x-4-(i>1?1:0),y-7+i,8+(i>1?1:0),1,i%2?'#fff6e0':'#1e2a5a');return}
 const c=b==='starcape'?'#1e2a6a':b==='royal'?'#6a2aa8':gC(g,b)||'#d8352f';r(x-4,y-7,6,1,c);r(x-6,y-7,2,6,c);r(x-5,y-6,1,4,c);r(x+2,y-7,1,1,sh(c,.8));
 if(b==='starcape')r(x-6,y-4,1,1,'#ffd86b');if(b==='royal'){r(x-4,y-7,6,1,'#fff6e0');r(x-6,y-2,2,1,'#ffd86b')}}
/* gear at story scale (x,y = the dog's feet, facing right) */
function gear2(x,y,g,pose,run){if(!g)return;const sit=pose==='sit',lie=pose==='lie',hx=sit?x-1:lie?x+4:x+6,top=sit?y-12:lie?y-9:y-11,b=g.body;
 if(b&&sit)sitGear2(x,y,b,g);
 if(b&&!sit){if(lie)x-=1;const by=lie?y-5:y-8;if(b.startsWith('band')){const c=gC(g,b);r(x+4,by+1,4,1,c);r(x+5,by+2,2,1,c)}
  else if(b.startsWith('silk')){r(x-3,by,6,3,gC(g,b));r(x-1,by+1,2,1,'#fff6e0')}
  else if(b==='harn'){r(x+2,by,1,5,'#ff7eb6');r(x-3,by+2,6,1,'#ff7eb6')}
  else if(b==='neon'){r(x-6,by,12,3,'#b8ff3a');r(x-6,by+1,12,1,'#ff3ad8')}
  else if(b==='sweater'){r(x-6,by,12,4,'#c84a5a');r(x-6,by+2,12,1,'#fff6e0')}
  else if(b==='jersey'){r(x-6,by,11,3,'#2a6ad8');r(x-2,by+1,2,1,'#fff6e0')}
  else if(b==='stripe'){for(let i=0;i<4;i++)r(x-6,by+i,11,1,i%2?'#fff6e0':'#1e2a5a')}
  else if(b!=='bowP'){const c=b==='starcape'?'#1e2a6a':b==='royal'?'#6a2aa8':gC(g,b)||'#d8352f',w=run?Math.floor(Date.now()/120)%2:0;r(x-5,by-1,10,2,c);r(x-8,by+w,3,2,c);if(b==='starcape')r(x-2,by-1,1,1,'#ffd86b');if(b==='royal'){r(x-5,by,10,1,'#fff6e0');r(x-8,by+1+w,3,1,'#ffd86b')}}}
 if(lie)x+=1;if(g.paws&&lie){const c=gC(g,g.paws)||'#2a6ad8';r(x+4,y-1,2,1,c)}if(g.paws&&sit){const c=gC(g,g.paws)||'#2a6ad8';r(x,y-1,1,1,c);r(x+2,y-1,1,1,c)}
 if(g.charm)r(sit?x+1:lie?x+7:x+9,sit?y-7:lie?y-4:y-6,1,1,'#ffd86b');
 const h=g.head;if(!h)return;const ty=top-3;
 if(h==='sweat'||h==='sweatB')r(hx,top+1,5,1,gC(g,h));
 else if(h==='goggles'||h==='ggog'){r(hx,top+1,5,1,h==='ggog'?'#c89a20':'#3a3a4a');r(hx+3,top+1,2,1,h==='ggog'?'#ffb040':'#7ee8fa')}
 else if(h==='aviator'){r(hx-1,top-1,6,2,'#8a5a2a');r(hx+3,top+1,2,1,'#ffd86b')}
 else if(h==='visor'){r(hx,top,5,1,'#fff6e0');r(hx+4,top+1,3,1,'#2a6ad8')}
 else if(h==='helmet'){r(hx-1,ty+1,7,3,'#e0468c');r(hx+2,ty+1,1,3,'#fff6e0')}
 else if(h==='tiara'){r(hx,ty+2,5,1,'#ffd86b');r(hx+2,ty+1,1,1,'#ffd86b');r(hx+2,ty+2,1,1,'#ff7eb6')}
 else if(h==='tophat'){r(hx,ty-3,5,5,'#1e1a22');r(hx-1,ty+2,7,1,'#1e1a22');r(hx,ty,5,1,'#a02a3a');r(hx+4,top+1,1,2,'#ffd86b')}
 else if(h==='monocle')r(hx+4,top+1,1,2,'#ffd86b');
 else if(h==='hband'){r(hx,top+1,5,1,'#fff6e0');r(hx+2,top+1,1,1,'#d8352f');r(hx-3,top+1,3,1,'#fff6e0')}
 else if(h==='beret'){r(hx-1,ty+1,6,2,'#1e2a5a');r(hx+2,ty,1,1,'#1e2a5a')}
 else if(h==='akubra'){r(hx,ty-1,5,3,'#8a6a3a');r(hx,ty+1,5,1,'#4a3a2a');r(hx-2,ty+2,9,1,'#6a4a2a')}
 else if(h==='crown'){r(hx,ty,5,2,'#ffd86b');r(hx,ty-1,1,1,'#ffd86b');r(hx+2,ty-2,1,2,'#ffd86b');r(hx+4,ty-1,1,1,'#ffd86b');r(hx+2,ty+1,1,1,'#d8352f')}
 else if(h==='cap'){r(hx,ty+1,5,2,'#2a6ad8');r(hx+4,ty+2,3,1,'#1e4aa8')}}
/* Coach Gus at story scale */
function gus2(x,y,t,dir,talk){x=Math.round(x);y=Math.round(y);ell(x,y,11,1,'#000',.2);cx.save();if(dir==='l'){cx.translate(2*x+1,0);cx.scale(-1,1)}
 const B='#a8682e',K='#2a2026',Wt='#f6efe2',E='#6a3e1c',N='#2a1a1a',bob=talk?Math.floor(t*8)%2:0,wag=Math.floor(t*3)%2;
 r(x-8,y-2,2,2,Wt);r(x-5,y-2,2,2,sh(Wt,.94));r(x+4,y-2,2,2,sh(Wt,.94));r(x+7,y-2,2,2,Wt);
 r(x-9,y-7,18,5,B);r(x-9,y-7,18,1,sh(B,1.12));r(x-7,y-7,12,2,K);r(x-6,y-3,13,1,Wt);r(x+6,y-6,3,4,Wt);r(x-11,y-9-wag,2,3,B);r(x-11,y-10-wag,2,1,Wt);
 const hx=x+7,hy=y-13;r(hx,hy,6,6,B);r(hx,hy,6,1,sh(B,1.12));r(hx+2,hy,1,3,Wt);r(hx+4,hy+3,4,3+bob,Wt);r(hx+7,hy+3,1,1,N);r(hx+4,hy+2,1,1,N);r(hx+4,hy+1,2,1,sh(B,.8));
 r(hx-1,hy+1,2,9,E);r(hx,hy+9,1,1,E);r(hx-1,hy-2,6,2,'#d8352f');r(hx+5,hy-1,3,1,'#a02a2a');r(hx+1,hy-2,2,1,'#fff6e0');
 r(hx+2,hy+6,1,2,'#3a3a4a');r(hx+1,hy+8,2,1,'#ffd86b');cx.restore()}
/* our two people, sitting or standing, without disturbing the story's own copies */
function p2(k,x,y,t,dir,sit,walk){const p=k==='abi'?abi:k==='hunter'?hunter:null;if(!p){ppl(k,x,y,t,dir,walk);return}
 const keep=['x','y','dir','sit','sitF','hold','moving','tx','ty','reach','tag'].reduce((o,q)=>(o[q]=p[q],o),{});Object.assign(p,{x,y,dir:dir||'d',sit:sit?1:0,sitF:sit?1:0,hold:null,moving:!!walk,tx:null,ty:null,reach:null,tag:0});
 try{person(p,t)}finally{Object.assign(p,keep)}}
const ppl2=(k,x,y,t,dir)=>p2(k,x,y,t,dir,0);

/* ---- rooms ---- */
/* their apartment living room at night, the couch, the little TV */
function livingRoom(st){return t=>at2(()=>{const k6=['day','couch','h6'].map(k=>c6[k]),k7=['home','sitH','sitA','dim','lap'].map(k=>c7[k]),hx0=typeof hx!=='undefined'?hx:null;
 const hs={x:hunter.x,y:hunter.y,sit:hunter.sit,sitF:hunter.sitF,dir:hunter.dir,hold:hunter.hold},as={x:abi.x,y:abi.y,sit:abi.sit,sitF:abi.sitF,dir:abi.dir,hold:abi.hold};
 Object.assign(c6,{day:0,couch:0,h6:0});Object.assign(c7,{home:0,sitH:'d',sitA:'d',dim:0,lap:0});hunter.hold=abi.hold=null;try{hx=null}catch(e){}
 try{borrow('vHome6',t,null)}finally{['day','couch','h6'].forEach((k,i)=>c6[k]=k6[i]);['home','sitH','sitA','dim','lap'].forEach((k,i)=>c7[k]=k7[i]);try{hx=hx0}catch(e){}Object.assign(hunter,hs);Object.assign(abi,as)}
 /* the TV is on, showing the race; everything stays inside the screen */
 cx.save();cx.beginPath();cx.rect(44,59,14,11);cx.clip();r(44,59,14,4,'#6ab0e8');r(44,63,14,3,'#3a8a3a');r(44,66,14,4,'#c8503a');r(44,67,14,1,'#f6efe8');
 for(let i=0;i<3;i++){const x=44+((t*9+i*6)%20)-3,y=68-i;r(x,y-2,3,2,i?COATS[['tri','cream'][i-1]].b:'#e0903a');r(x+3,y-3,1,2,i?'#2a1a1a':'#e0903a');r(x,y,1,1,'#fbf6ec');r(x+2,y,1,1,'#fbf6ec')}
 if(Math.floor(t*2)%2)r(45,60,1,1,'#ff4a4a');cx.restore();cx.globalCompositeOperation='lighter';disc(51,66,11,'#6aa0ff',.1+Math.sin(t*9)*.02);disc(44,96,16,'#6aa0ff',.05);cx.globalCompositeOperation='source-over';
 /* Donut on the rug, nose to the screen; Crumpet asleep */
 const z=st.zoom&&tm-st.zoom<2.2;if(z){const a=(tm-st.zoom)/2.2*Math.PI*4;gcorgi(28+Math.cos(a)*18,118+Math.sin(a)*6,{c:'red',st:'run',t:tm,dir:-Math.sin(a)>0?'r':'l',g:dGear()})}
 else gcorgi(36,109,{c:'red',st:'stand',t,dir:'r',tongue:st.ear,g:dGear()});
 if(st.ear&&!z){const ex=36+6,ey=109-15;r(ex,ey-1,2,1,'#e0903a');r(ex+3,ey-1,2,1,'#e0903a')}
 crumpet(18,121,'r',t,3,0)})}
/* the broadcast, up close */
function tvClose(){return t=>{r(0,0,160,288,'#141a30');for(let y=0;y<288;y+=6)for(let x=((y/6)%2)*4;x<160;x+=8)r(x+1,y,1,1,'#1c2240');
 r(4,52,152,140,'#1a1a22');r(6,54,148,136,'#2a2a34');r(4,52,152,1,'#3a3a46');r(70,192,20,8,'#2a2a34');r(50,200,60,4,'#1a1a22');
 cx.save();cx.beginPath();cx.rect(10,58,140,124);cx.clip();cx.translate(10,-22);const cam=t*70%3000;venueDraw('final',cam,t,1);
 for(let i=0;i<3;i++){const x=40+Math.sin(t*1.3+i*2)*12+i*14;rdog(x,LANE[i],{c:['fluff','shiba','red'][i],st:'run',ph:t*14+i*1.3,g:[{head:'crown',body:'royal'},{head:'hband'},{body:'bandR'}][i]})}venueFg('final',cam);cx.restore();
 cx.globalAlpha=.1;for(let y=58;y<182;y+=2)r(10,y,140,1,'#000');cx.globalAlpha=1;
 r(10,58,62,20,'rgba(14,8,40,.85)');r(10,58,3,20,'#ffd86b');ptxt('WORLD CORGI',16,62,'#ffd86b');ptxt('CHAMPIONSHIP',16,70,'#fff6e0');r(118,62,28,9,'#d8352f');ptxt('LIVE',132,64,'#fff6e0',1,'c');if(Math.floor(t*2)%2)r(120,64,2,2,'#fff6e0');
 cx.globalCompositeOperation='lighter';disc(80,120,90,'#6aa0ff',.05);cx.globalCompositeOperation='source-over';
 /* Donut, from behind, nose to the screen: ears up, tips twitching */
 at2(()=>{const O='#e0903a',L1='#eaa456',D1='#c87a32',Wt='#fbf6ec',tw=Math.floor(t*1.7)%3===0?1:0;
  r(27,129,26,15,O);r(27,129,26,1,L1);r(25,133,4,11,Wt);r(51,133,4,11,Wt);r(26,131,2,2,Wt);r(52,131,2,2,Wt);
  r(31,110,18,18,O);r(31,110,18,1,L1);r(31,111,1,16,D1);r(48,111,1,16,D1);r(36,118,8,1,sh(O,.93));
  for(let k=0;k<10;k++){const w=1+Math.round(k*.62),q=k<3?tw:0;r(31-q,100+k,w,1,O);r(31-q,100+k,1,1,D1);r(49-w+q,100+k,w,1,O);r(48+q,100+k,1,1,D1)}r(31,100,1,1,L1);r(48,100,1,1,L1)})}}
/* the backyard of the house (gym level 1) and the porch at night (the ending) come straight from the story */
function yard(t){
 for(let y=0;y<60;y+=2){const k=y/60;r(0,y,80,2,`rgb(${Math.round(60+k*90)},${Math.round(130+k*70)},${Math.round(230-k*10)})`)}
 cx.globalCompositeOperation='lighter';for(let k=16;k>=6;k-=2)disc(34,10,k,'#fff6d0',.035);cx.globalCompositeOperation='source-over';disc(34,10,4,'#fffbe8',1);disc(34,10,3,'#ffffff',1);
 for(let i=0;i<8;i++){const a=i/8*6.283+t*.05;for(let k=6;k<18;k+=2){cx.globalAlpha=.18*(1-k/18);r(Math.round(34+Math.cos(a)*k),Math.round(10+Math.sin(a)*k),1,1,'#fffbe0')}}cx.globalAlpha=1;
 const TC=['#2e5a2a','#3a6a32','#4a7a3a','#7a8a3a','#a89a3a'];const farT=()=>{for(let i=0;i<18;i++){const x=(i*9+3)%84-2,y=38+((i*7)%8),q=6+((i*5)%5);disc(x,y,q,TC[(i*3)%5],1)}for(let i=0;i<12;i++){const x=(i*13+6)%80,y=46+((i*5)%6);disc(x,y,4+(i%3),TC[(i+2)%4],1)}};farT();
 r(0,56,80,1,'#a8a8b0');for(let x=0;x<80;x+=2)for(let y=57;y<63;y+=2)r(x+(y%4?1:0),y,1,1,'#8a8a92');for(let x=2;x<80;x+=12)r(x,55,1,8,'#7a7a82');
 for(let y=60;y<160;y++){const k=(y-60)/84,band=Math.floor(Math.pow(Math.min(k,1.2),.6)*12)%2;r(0,y,80,1,band?'#7aa64a':'#709c44')}
 for(let i=0;i<90;i++){const x=Math.floor(hsh(i,41)*80),y=62+Math.floor(hsh(i,42)*96);r(x,y,1,1,i%3?'#8ab858':'#9a8a4a')}
 for(let i=0;i<14;i++){const x=Math.floor(hsh(i,51)*78),y=66+Math.floor(hsh(i,52)*80);r(x,y,1,1,['#fff6e0','#ffd86b','#ff9ccb'][i%3]);r(x+1,y+1,1,1,'#5a8a3a')}
 cx.globalAlpha=.18;for(let s=0;s<3;s++){for(let y=62;y<112;y++){const x=Math.round([9,40,26][s]+(y-62)*[-.8,-.35,-.6][s]);r(x,y,4+((y-62)>>4),1,'#1e3a14')}}for(let y=72;y<108;y++){const x=Math.round(60+(y-72)*.2);r(x,y,6+((y-72)>>3),1,'#1e3a14')}cx.globalAlpha=1;
 r(46,55,15,8,'#c8c8c0');for(let x=46;x<61;x+=2)r(x,55,1,8,'#b0b0a8');r(52,56,1,7,'#8a8a84');r(54,56,1,7,'#8a8a84');r(46,62,15,1,'#9a9a92');r(45,52,17,3,'#8a4a2a');r(45,52,17,1,'#a85a34');for(let x=46;x<62;x+=3)r(x,53,1,2,'#6a3a20');
 r(39,28,2,36,'#5a4a3a');r(40,28,1,36,'#6a5a48');r(38,61,4,3,'#5a4a3a');r(36,34,3,1,'#5a4a3a');r(41,30,3,1,'#5a4a3a');
 r(60,26,3,46,'#5a4030');r(61,26,1,46,'#6a5040');r(58,70,7,2,'#4a3020');r(56,40,4,1,'#5a4030');r(63,36,5,1,'#5a4030');r(10,46,2,18,'#4a3a2a');r(26,48,2,14,'#4a3a2a');
 cx.save();cx.beginPath();cx.rect(0,0,80,52);cx.rect(0,52,45,4);cx.rect(62,52,18,3);cx.clip();farT();cx.restore();
 [[39,24,7],[34,29,5],[44,28,5],[39,33,5],[35,19,4],[43,19,4],[39,15,4]].forEach(([x,y,q],i)=>disc(x,y,q,i%2?'#6a8a3a':'#7a9a42',1));[[37,21],[42,25],[36,30],[41,31]].forEach(([x,y])=>disc(x,y,2,'#9ab04e',1));
 [[64,12,13],[72,20,11],[54,18,9],[76,8,8],[60,32,9],[72,34,8],[52,30,6]].forEach(([x,y,q],i)=>disc(x,y,q,['#c8a83a','#b89a34','#d8b84a','#a88a2e','#c0a040','#9a8a30','#d0b04a'][i],1));[[60,10],[68,16],[56,22],[74,28],[64,30]].forEach(([x,y])=>disc(x,y,3,'#e8cc60',1));
 [[8,40,8],[15,44,6],[26,40,7],[2,46,6]].forEach(([x,y,q],i)=>disc(x,y,q,i%2?'#2e5a2a':'#3e6a30',1))}
function porch(t){borrow('vEpPorch',t,'epporch',{keepRocker:1})}
/* ---------------- the gym, five levels, at story scale ---------------- */
function gymBg(lv,t){if(lv===1){yard(t);return}
 if(lv===2){/* the garage */r(0,0,80,64,'#cfc8bc');for(let x=0;x<80;x+=10)r(x,10,1,54,'#c4bcb0');r(0,0,80,10,'#a8a094');r(0,10,80,1,'#8a8478');
  r(4,18,30,24,'#c8a878');r(4,18,30,1,'#dcc090');for(let y=20;y<42;y+=3)for(let x=6;x<34;x+=3)r(x,y,1,1,'#8a6a4a');
  r(8,22,1,8,'#6a4a2a');r(6,22,5,2,'#5a5a66');r(14,23,6,1,'#9a9aa8');r(14,23,1,3,'#9a9aa8');r(19,23,1,3,'#9a9aa8');disc(27,28,4,'#e8b820',1);disc(27,28,2,'#c8a878',1);r(9,34,3,6,'#d8352f');r(15,35,8,2,'#3a3a46');
  r(4,46,30,2,'#7a5a3a');[[6,'#3a6ab0'],[12,'#e8e4dc'],[18,'#d8352f'],[25,'#3aa84a']].forEach(([x,c])=>{r(x,40,5,6,c);r(x,40,5,1,sh(c,1.25));r(x+1,42,3,2,'#f6f2ea')});
  r(44,12,34,52,'#e8e4dc');for(let y=12;y<64;y+=9){r(44,y,34,1,'#c8c4bc');r(44,y+8,34,1,'#f6f2ea')}for(let x=47;x<76;x+=8){r(x,15,6,4,'#8ac8f0');r(x,15,6,1,'#b0dcf8')}r(44,12,34,1,'#9a948a');r(43,12,1,52,'#9a948a');r(78,12,1,52,'#9a948a');
  r(39,10,1,7,'#3a3a3a');disc(39,18,2,'#fff2c0',1);cx.globalCompositeOperation='lighter';disc(39,18,12,'#ffd890',.08);cx.globalCompositeOperation='source-over';
  r(0,64,80,80,'#9c9ca0');for(let i=0;i<60;i++)r(hsh(i,7)*80|0,64+(hsh(i,8)*80|0),1,1,'#8c8c92');for(let y=72;y<144;y+=12)for(let x=2;x<80;x+=13){r(x,y,12,11,'#3a3a44');r(x,y,12,1,'#4a4a56')}
  r(34,52,8,12,'#5a5a66');r(35,54,6,6,'#ff7e3a');for(let i=0;i<3;i++)r(36+i*2,55,1,4,'#ffd060');cx.globalCompositeOperation='lighter';disc(38,60,9,'#ff8a3a',.1);cx.globalCompositeOperation='source-over'}
 else if(lv===3){/* Gus's old gym */for(let y=0;y<64;y+=4)for(let x=(y/4%2)*4;x<84;x+=8){r(x-4,y,7,3,(x+y)%3?'#a8583a':'#b4624a');r(x-4,y+3,8,1,'#8a4a30')}
  r(12,8,56,11,'#2a2026');r(12,8,56,1,'#4a3a46');r(12,18,56,1,'#1a1418');ptxt('GUS GYM',40,11,'#ffd86b',1,'c');
  r(3,24,20,34,'#8a6a4a');r(4,25,18,32,'#c8d8e8');for(let i=0;i<4;i++)r(6+i*3,27+i*2,1,6,'#eef6fc');r(25,24,1,34,'#7a5a3a');
  r(30,26,16,12,'#2a3a2a');r(30,26,16,1,'#8a6a4a');r(30,37,16,1,'#8a6a4a');r(32,29,8,1,'#e8e8e0');r(32,32,11,1,'#e8e8e0');r(32,35,6,1,'#e8e8e0');r(42,34,1,1,'#ff7eb6');
  r(54,24,16,14,'#c8a060');r(55,25,14,10,'#e8d8b0');r(57,30,9,3,'#a8682e');r(64,28,3,3,'#a8682e');r(64,30,1,4,'#6a3e1c');r(57,30,6,1,'#2a2026');r(58,36,8,1,'#8a6a3a');ptxt('87',62,40,'#ffd86b',1,'c');
  r(48,46,22,2,'#6a4a2a');[[50,'#ffd86b'],[57,'#c8c4d0'],[64,'#c87a3a']].forEach(([x,c])=>{r(x,41,4,4,c);r(x+1,45,2,1,c);r(x+1,41,2,1,sh(c,1.3))});
  r(72,40,7,24,'#e8e8f0');r(73,42,5,8,'#7ab8e8');r(73,52,5,10,'#d8d8e0');
  r(0,64,80,80,'#a8784a');for(let y=64;y<144;y+=5){r(0,y,80,1,'#94683e');for(let x=(y*7)%23;x<80;x+=23)r(x,y,1,5,'#94683e')}}
 else if(lv===4){/* the pro facility */r(0,0,80,64,'#2a3a5a');for(let x=2;x<80;x+=19){r(x,4,17,40,'#8ac8f0');r(x,4,17,14,'#a8d8f8');for(let i=0;i<5;i++){const h=6+(i*7+x)%14;r(x+1+i*3,44-h,3,h,'#5a7aa8')}r(x,4,17,1,'#d8e8f8')}r(0,44,80,2,'#d8e0e8');
  r(0,48,80,9,'#141228');const m=Math.floor(t*14)%120;ptxt('DONUT RACING  GO DONUT',82-m,50,'#ff7eb6',1);r(0,48,1,9,'#141228');r(0,57,80,1,'#3a3460');
  for(let i=0;i<5;i++){const x=6+i*16;r(x,58,1,6,'#c8c4d0');tri(x+4,58,63,.0,'#ffd86b');r(x+1,58,6,3,['#d8352f','#2a6ad8','#ffd86b','#3aa84a','#e0468c'][i]);r(x+1,61,4,1,['#d8352f','#2a6ad8','#ffd86b','#3aa84a','#e0468c'][i])}
  r(0,64,80,80,'#c8503a');for(let i=0;i<80;i++)r(hsh(i,9)*80|0,64+(hsh(i,10)*80|0),1,1,'#b84a34');[70,86,102,118].forEach(y=>r(0,y,80,1,'#f6efe8'))}
 else{/* the Donut Dome */r(0,0,80,64,'#1a1636');for(let a=0;a<7;a++){const q=Math.PI*(a+.5)/7;for(let k=0;k<70;k++){const x=40+Math.cos(q)*k*.9,y=62-Math.sin(q)*k*.85;if(y>0)r(x|0,y|0,1,1,'#2e2858')}}for(let k=10;k<64;k+=12)for(let a=0;a<60;a++){const q=Math.PI*a/60;r((40+Math.cos(q)*k*.9)|0,(62-Math.sin(q)*k*.85)|0,1,1,'#2e2858')}
  for(let i=0;i<26;i++){const on=Math.sin(t*2+i*1.7)>-.3;if(on)r(hsh(i,3)*80|0,hsh(i,4)*40|0,1,1,'#ffe8a0')}
  cx.globalCompositeOperation='lighter';disc(40,24,18,'#ff9ccb',.08);cx.globalCompositeOperation='source-over';disc(40,24,12,'#d8964a',1);disc(40,23,11,'#e8a050',1);for(let a=0;a<28;a++){const q=Math.PI+a/27*Math.PI;r((40+Math.cos(q)*9)|0,(23+Math.sin(q)*8)|0,2,2,'#ff7eb6')}disc(40,24,4,'#1a1636',1);
  for(let i=0;i<14;i++){const q=Math.PI+(i+.5)/14*Math.PI,k=6+(i%3)*1.6;r((40+Math.cos(q)*k)|0,(22+Math.sin(q)*k*.8)|0,1,1,['#7ee8fa','#ffd86b','#fff6e0','#8be28b'][i%4])}
  r(2,40,22,24,'#6a4a2a');r(3,41,20,22,'#2a1e3a');r(3,51,20,1,'#6a4a2a');const tr=Object.keys(GEAR).filter(k=>GEAR[k].boss&&S.own.includes(k)).length;for(let i=0;i<Math.min(12,tr+1);i++){const x=4+(i%6)*3,y=i<6?44:54,c=i?'#ffd86b':'#c8c4d0';r(x,y,2,3,c);r(x,y+3,2,1,sh(c,.7))}
  r(56,40,22,24,'#6a4a2a');r(57,41,20,22,'#2a1e3a');['#8be28b','#7ee8fa','#ffd86b','#ff9ccb'].forEach((c,i)=>{r(59+i*5,43,3,14,i<=S.lg?c:'#3a2e5a');r(59+i*5,57,3,1,'#6a4a2a')});
  r(0,64,80,80,'#4a3080');for(let y=64;y<144;y+=8)r(0,y,80,1,'#5a3a94');ell(40,90,22,6,'#6a4aa8',.6);ptxt('D',40,86,'#ffd86b',1,'c');
  cx.globalCompositeOperation='lighter';[14,66].forEach((x,i)=>{for(let y=0;y<90;y++){const w=2+y*.12;cx.globalAlpha=.04;r(x-w+Math.sin(t*.6+i)*y*.15,y,w*2,1,'#fff6d0')}});cx.globalAlpha=1;cx.globalCompositeOperation='source-over'}}
/* equipment she owns shows up in the gym */
/* Equipment lines the back of the gym (and one small item in a front corner) so the middle and the right side stay open:
   that's where Donut runs her zoomies and where visitors walk in. */
function equip2(lv,t){const e=S.eq,B=77;
 if(e.spd){const c=['#3a3a44','#2a6ad8','#d8352f'][e.spd-1];r(2,B-5,18,4,'#1e1e24');r(2,B-5,18,1,'#4a4a56');for(let i=0;i<5;i++)r(3+((i*4+Math.floor(t*10))%16),B-3,1,1,'#5a5a66');r(2,B-1,2,2,c);r(18,B-1,2,2,c);r(17,B-17,2,12,c);r(14,B-19,7,3,c);r(15,B-18,5,1,'#7ee8fa')}
 if(e.agi){for(let i=0;i<(e.agi>1?5:3);i++){const x=24+i*4;if(e.agi===1){r(x,B-1,3,1,'#d85a1a');r(x+1,B-4,1,3,'#ff8a3a')}else{r(x,B-10,1,10,i%2?'#fff6e0':'#d8352f');r(x,B-10,1,1,'#ffd86b')}}if(e.agi>2)r(23,B,19,1,'#5a5a66')}
 if(e.sta){const px=52,py=B-2;ell(px,py,8,2,['#4a8ac8','#3a7ac0','#2a6ab0'][e.sta-1],1);ell(px,py-1,6,1,'#8ac8f0',1);r(px-4+((t*5|0)%8),py-1,2,1,'#c8ecff');r(px-8,py-1,1,2,'#ff7eb6');r(px+8,py-1,1,2,'#ff7eb6');if(e.sta>1){r(px+5,py-7,1,6,'#c8c4d0');r(px+5,py-7,3,1,'#c8c4d0')}}
 if(e.acc){const c=['#e8b820','#8a5a2a','#2a2a3a'][e.acc-1];r(64,B-9,9,8,c);r(64,B-9,9,1,sh(c,1.3));r(61,B-8,4,3,'#3a3a46');disc(67,B-5,1,'#2a2a34',1);r(65,B-1,2,2,'#2a2a34');r(70,B-1,2,2,'#2a2a34');disc(59,B-11,1,'#c8e83a',1)}
 if(e.cha){if(e.cha>2){r(66,B-34,1,26,'#3a3a44');r(79,B-34,1,26,'#3a3a44');r(65,B-35,16,2,'#5a5a66');r(67,B-33,12,22,'#ff9ccb');r(67,B-33,12,1,'#ffb8d8')}
  r(74,B-28,5,18,'#8a6a4a');r(75,B-27,3,16,'#d8e8f4');r(76,B-25,1,5,'#f4fafe');r(73,B-10,3,1,'#6a4a2a');r(77,B-10,3,1,'#6a4a2a');
  if(e.cha>1){const rx=68;r(rx,B-24,1,14,'#3a3a44');r(rx-2,B-10,5,1,'#3a3a44');for(let a=0;a<16;a++){const q=a/16*Math.PI*2;r(Math.round(rx+Math.cos(q)*3),Math.round(B-27+Math.sin(q)*3),1,1,'#fff6d0')}}}
 if(e.foc){const fx=72,fy=110;if(e.foc===1){ell(fx+2,fy,4,1,'#000',.15);r(fx,fy-4,5,4,'#8a6a5a');r(fx+4,fy-6,2,3,'#8a6a5a');r(fx+5,fy-5,1,1,'#2a1a1a');r(fx-2,fy-7,2,6,'#a8887a')}else if(e.foc===2){r(fx-4,fy-3,12,3,'#7a4ab8');r(fx-4,fy-3,12,1,'#9a6ad8')}else{r(fx-2,fy-10,10,10,'#3a3a46');r(fx-2,fy-10,10,1,'#5a5a66');r(fx-1,fy-9,8,5,'#1e2a1e');r(fx,fy-8,1+Math.floor(t*3)%6,1,'#8be28b');r(fx+5,fy-3,1,1,Math.floor(t*4)%2?'#ff4a4a':'#4a1a1a')}}}
/* ---------------- cutscenes ----------------
   A cutscene is a scene that keeps a beat number and the moment that beat started.
   Dialogue lines move it to the next beat (a:bt(K,n)), and the scene animates from there:
   cars pull up, people walk in, things get handed over. */
function cutScr(fn){const C={b:0,bt:tm,v:{}};return {C,draw:t=>fn(C,tm-C.bt,t)}}
const bt=(K,n,f)=>()=>{K.C.b=n;K.C.bt=tm;if(f)f()};
const ez=k=>{k=clamp(k,0,1);return k*k*(3-2*k)};
const tw=(a,b,u,d,dl)=>a+(b-a)*ez((u-(dl||0))/d);
const castDraw=L=>L.sort((a,b)=>a.y-b.y).forEach(q=>q.f());
function homeBack(t){cx.translate(0,-12);gymBg(S.gym,t);equip2(S.gym,t)}
const dust=(x,y,u,n)=>{for(let i=0;i<(n||5);i++){const k=(u*2+i/(n||5))%1;disc(Math.round(x-k*10-i),Math.round(y-k*4),1+(k*3|0),'#e8e0d0',.6*(1-k))}};
const glint=(x,y,u)=>{const k=(u*1.4)%1;if(k<.3){const s=Math.round(k*10);r(x,y-s,1,s*2+1,'#ffffff');r(x-s,y,s*2+1,1,'#ffffff')}};
/* vehicles at story scale */
function limo(x,y,o){x=Math.round(x);y=Math.round(y);const B='#5a2a8a',H='#9a6aca';cx.save();if(o.dir==='l'){cx.translate(2*x+1,0);cx.scale(-1,1)}
 ell(x,y,22,2,'#000',.25);r(x-21,y-10,42,7,B);r(x-21,y-10,42,1,H);r(x+15,y-12,6,2,B);r(x+15,y-12,6,1,H);r(x-21,y-12,6,2,B);r(x-12,y-17,24,7,'#4a2072');r(x-11,y-17,22,1,H);
 r(x-10,y-16,9,5,'#26304a');r(x+1,y-16,9,5,'#26304a');r(x-9,y-16,3,1,'#6a7ab0');r(x+2,y-16,3,1,'#6a7ab0');r(x-21,y-6,42,1,'#d8d4e0');r(x+20,y-10,1,3,'#fff6c0');r(x-21,y-9,1,2,'#ff4a4a');r(x+8,y-8,3,1,'#d8d4e0');
 [x-13,x+13].forEach(wx=>{disc(wx,y-2,3,'#141418',1);disc(wx,y-2,1,'#d8d4e0',1);const a=o.spin||0;r(wx+Math.round(Math.cos(a)*2),y-2+Math.round(Math.sin(a)*2),1,1,'#b8b4c0')});
 if(o.door){const w=Math.round(o.door*6);r(x-2,y-16,3,11,'#2a1240');r(x+1,y-16,w,11,B);r(x+1,y-16,w,1,H)}
 if(o.shine!=null){const sx=x-20+Math.round((o.shine*50)%44);r(sx,y-10,3,1,'#ffffff');r(sx+1,y-11,1,3,'#ffffff')}cx.restore()}
function kibTruck(x,y,o){x=Math.round(x);y=Math.round(y);cx.save();if(o.dir==='l'){cx.translate(2*x+1,0);cx.scale(-1,1)}
 ell(x,y,24,2,'#000',.25);r(x-24,y-21,34,16,'#ffd86b');r(x-24,y-21,34,1,'#fff0b0');r(x-24,y-6,34,1,'#c89a20');
 const k=o.open||0,ph=Math.round(k*12);if(k>0){r(x-22,y-19,30,12,'#5a3a1a');for(let i=0;i<5;i++){r(x-21+i*6,y-15,5,8,'#e8b820');r(x-21+i*6,y-15,5,1,'#fff0b0');r(x-19+i*6,y-12,1,1,'#d8352f')}}
 r(x-22,y-19-ph,30,Math.max(1,12-ph),'#f0c84a');r(x-22,y-19-ph,30,1,'#c89a20');if(k<.5){ptxt('KIBBLE',x-7,y-17,'#8a5a1a',1,'c');r(x-10,y-10,6,3,'#d8352f');r(x-9,y-12,1,2,'#ffd86b');r(x-7,y-13,1,3,'#ffd86b');r(x-5,y-12,1,2,'#ffd86b')}
 r(x+10,y-16,12,11,'#e8b820');r(x+10,y-16,12,1,'#fff0b0');r(x+15,y-14,6,5,'#7ab8e8');r(x+16,y-14,2,1,'#b8dcf8');r(x+21,y-8,1,2,'#fff6c0');r(x-24,y-6,46,2,'#5a5a66');
 [x-16,x+14].forEach(wx=>{disc(wx,y-2,3,'#141418',1);disc(wx,y-2,1,'#d8d4e0',1)});cx.restore()}
/* bits that get held up or handed over */
const neonSuit=(x,y,u)=>{const g=.5+Math.sin(u*14)*.5;cx.globalCompositeOperation='lighter';disc(x,y,9,'#b8ff3a',.12+g*.12);cx.globalCompositeOperation='source-over';r(x-5,y-3,10,7,'#b8ff3a');r(x-5,y-1,10,1,'#ff3ad8');r(x-5,y+2,10,1,'#ff3ad8');r(x-7,y-3,2,3,'#b8ff3a');r(x+5,y-3,2,3,'#b8ff3a');glint(x+4,y-4,u)};
const bandanaAt=(x,y,c)=>{r(x-3,y,6,1,c);r(x-2,y+1,4,1,c);r(x-1,y+2,2,1,c);r(x-2,y,1,1,'#fff6e0')};
const capelet=(x,y,u)=>{r(x-6,y-3,12,6,'#c2417a');r(x-6,y-3,12,1,'#ff9ccb');r(x-4,y+3,8,2,'#c2417a');for(let i=0;i<3;i++)r(x-4+i*4,y-1,1,1,'#ffd86b');glint(x+5,y-4,u)};
const clipboard=(x,y)=>{r(x,y,4,5,'#a87a42');r(x+1,y+1,2,3,'#fff6e0');r(x+1,y-1,2,1,'#8a8a96')};
const crown2=(x,y)=>{r(x,y,5,2,'#ffd86b');r(x,y-1,1,1,'#ffd86b');r(x+2,y-2,1,2,'#ffd86b');r(x+4,y-1,1,1,'#ffd86b');r(x+2,y+1,1,1,'#d8352f')};
const pillow=(x,y)=>{r(x-5,y,10,3,'#7a2fe0');r(x-5,y,10,1,'#9a5af0');r(x-6,y+2,1,2,'#ffd86b');r(x+5,y+2,1,2,'#ffd86b')};

/* ---- the sponsor and story cutscenes ---- */
/* Pup-Cup Treats: a lady in a pink apron sprints over with a clipboard */
function cutPupCup(ven,then){const K=cutScr((C,u,t)=>{cx.save();cx.scale(2,2);cx.translate(0,-VOY);venueDraw(ven,-8,t,0);venueFg(ven,-8);const b=C.b,L=[];
  const lx=b===0?tw(-12,14,u,1.3):b===4?tw(14,-14,u,1.6):14,run=(b===0&&u<1.3)||b===4,ly=178+(b===2||b===3?-Math.round(Math.abs(Math.sin(u*8))*2):0);
  L.push({y:ly,f:()=>{ppl('pup',lx,ly,t,b===4?'l':'r',run);if(b<3||b===4)clipboard(lx+3,ly-15);if(b===0&&u>1.2&&u<1.6)dust(lx-6,ly,u,4)}});
  L.push({y:176,f:()=>gcorgi(38,176,{c:'red',st:b===3?'stand':'stand',t,dir:'l',tongue:b>=1,g:dGear(),jy:b===3&&u<1?Math.round(Math.abs(Math.sin(u*9))*3):0})});
  L.push({y:180,f:()=>p2('abi',58,180,t,'l')});L.push({y:182,f:()=>p2('hunter',70,182,t,'l')});
  if(b===2)bandanaAt(lx+2,ly-30+Math.round(Math.sin(u*6)),'#ff7eb6');
  if(b===3&&u<.8){const k=ez(u/.8);bandanaAt(Math.round(lx+2+(32-lx-2)*k),Math.round(ly-30+(176-9-(ly-30))*k-Math.sin(k*Math.PI)*10),'#ff7eb6')}
  castDraw(L);if(b===1)hearts(lx+2,ly-26,u,2);if(b===3)confetti(u,22);cx.restore()});
 talk([{n:'',t:'Somebody in a pink apron is SPRINTING across the grass toward you, waving a clipboard.',a:bt(K,0)},
  {n:'Pup-Cup Lady',t:'Hi! HI! Sorry! Hi! I’m with Pup-Cup Treats!',a:bt(K,1)},
  {n:'Pup-Cup Lady',t:'We’ve been watching Donut all season. We’d love her to wear OUR bandana. $40 a week!',a:bt(K,2)},
  {n:'',t:'Pup-Cup Treats: '+fmt$(SPON.pupcup.pay)+' a week. Donut wears the Pup-Cup Bandana for full pay.',c:[{l:'Sign the deal',f:()=>{signSpon('pupcup');bt(K,3)()}},{l:'No thanks',f:()=>{S.mood=clamp(S.mood+5,0,100);save();bt(K,4)()}}]},
  {n:'Pup-Cup Lady',get t(){return S.spon==='pupcup'?'Welcome to the Pup-Cup family! Free treats for LIFE. Well. For a while.':'Totally get it! Here’s a free Pup Cup anyway. Bye Donut!'}}],then,K.draw)}
function signSpon(id){const P=SPON[id];S.spon=id;if(!S.own.includes(P.it))S.own.push(P.it);S.wear[GEAR[P.it].sl]=P.it;save();snd('kaching');toast('New sponsor: '+P.n)}
/* Vivian Vance-Paws arrives: a very shiny car */
function cutVivian(then){S.fl.viv=1;save();const K=cutScr((C,u,t)=>{at2(()=>{homeBack(t);const b=C.b,L=[];
  const cx0=b===0?tw(120,52,u,2.2):b>=7?tw(52,-40,u,2.4,1.6):52,door=b===0?0:b===1?ez(u/.5):b>=7?(u<1.2?1-ez((u-.6)/.5):0):1;
  L.push({y:80,f:()=>{limo(cx0,80,{spin:b===0?u*14:b>=7&&u>1.6?u*14:0,door,shine:u});if(b===0&&u<2.2)dust(cx0+22,80,u,4);if(b>=7&&u>1.6)dust(cx0+22,80,u,5);if(b===0&&u>2.2)glint(cx0-8,70,u)}});
  const vx=b===1?tw(52,46,u,.8,.4):b>=2&&b<7?46:b>=7?tw(46,52,u,.6):52,vy=b===1?tw(80,90,u,.8,.4):b>=2&&b<7?90:b>=7?tw(90,82,u,.6):82;
  if(b>=1&&!(b>=7&&u>.7))L.push({y:vy,f:()=>{ppl('viv',vx,vy,t,b>=7?'r':'l',(b===1&&u>.4&&u<1.2)||(b>=7&&u<.6));if(b===2&&u<.8)for(let i=0;i<4;i++)glint(vx-4+i*3,vy-30+i,u+i*.2);if(b>=3&&b<7)neonSuit(vx,vy-34,u)}});
  L.push({y:86,f:()=>p2('abi',20,86,t,'r')});L.push({y:87,f:()=>p2('hunter',32,87,t,'r')});
  const worn=b===6&&u>.8;L.push({y:98,f:()=>gcorgi(42,98,{c:'red',st:b===4?'sit':'stand',t,dir:'r',g:worn||S.wear.body==='neon'?Object.assign(dGear(),{body:'neon'}):dGear(),tongue:b===6})});
  if(b===6&&u<.8){const k=ez(u/.8);neonSuit(Math.round(48+(42-48)*k),Math.round(56+(89-56)*k-Math.sin(k*Math.PI)*10),u)}
  castDraw(L);if(b===4){r(23,60,1,2,'#7ee8fa');r(22,62,3,2,'#7ee8fa')}if(b===6&&u>.8){cx.globalCompositeOperation='lighter';disc(42,91,10,'#b8ff3a',.12);cx.globalCompositeOperation='source-over'}})});
 talk([{n:'',t:'Monday morning. A long purple car purrs up to the gym. Very shiny. TOO shiny.',a:bt(K,0)},{n:'',t:'The door swings open.',a:bt(K,1)},
  {n:'Vivian',t:'Vivian Vance-Paws. I run the Minor League. And I make stars.',a:bt(K,2)},{n:'Vivian',t:'Zoomies Energy wants Donut. $450 a week. She just has to wear... this.',a:bt(K,3)},
  {n:'',t:'She holds up a neon green racing suit. It is very, very bright. It might be humming.'},{n:'Abigail',t:'(It’s hideous. But money is tight...)',a:bt(K,4)},
  {n:'Vivian',t:'So? Do we have a deal?',a:bt(K,5),c:[{l:'Take the deal ($450/week)',f:()=>{signSpon('zoomies');bt(K,6)()}},{l:'She’s not wearing that',f:()=>{S.mood=clamp(S.mood+15,0,100);S.fl.noviv=1;save();bt(K,7)()}}]},
  {n:'',get t(){return S.fl.noviv?'Vivian lowers her sunglasses. Sniffs. Gets back in the car without a word.':'The suit goes on. Donut glows faintly in the dark now.'}},
  {get n(){return S.fl.noviv?'Abigail':'Vivian'},get t(){return S.fl.noviv?'We’ll make it on our own. Right, Donut?':'Fabulous. You’ll be hearing from me.'},a:()=>{if(!S.fl.noviv){K.C.b=6}}}],then,K.draw)}
/* Royal Kibble: a golden truck, a fanfare, and a scarf */
function cutKibble(then){const K=cutScr((C,u,t)=>{at2(()=>{homeBack(t);const b=C.b,L=[];
  const tx=b===0?tw(124,54,u,2.2):b>=5?tw(54,-50,u,2.4,1.2):54,open=b===1?ez(u/.8):b>=2&&b<5?1:b>=5?1-ez(u/.6):0;
  L.push({y:78,f:()=>{kibTruck(tx,78,{open});if(b===0&&u<2.2)dust(tx+24,78,u,4);if(b>=5&&u>1.2)dust(tx+24,78,u,5)}});
  if(b===1&&u>.6)for(let i=0;i<3;i++)glint(36+i*12,58,u+i*.3);
  const vx=b===1?tw(66,50,u,.8,.6):b>=2&&b<5?50:b>=5?tw(50,62,u,.7):66,show=b>=1&&!(b>=5&&u>.7)&&!(b===1&&u<.6);
  if(show)L.push({y:90,f:()=>{ppl('viv',vx,90,t,b>=5?'r':'l',(b===1&&u<1.4)||(b>=5&&u<.7));if(b===3)bandanaAt(vx+2,58+Math.round(Math.sin(u*6)),'#2a6ad8')}});
  L.push({y:86,f:()=>p2('abi',20,86,t,'r')});L.push({y:87,f:()=>p2('hunter',32,87,t,'r')});
  const sc=b===4&&u>.8;L.push({y:98,f:()=>{gcorgi(42,98,{c:'red',st:'stand',t,dir:'r',g:dGear(),tongue:b===2||b===4,jy:b===1&&u>.4&&u<1?Math.round(Math.abs(Math.sin(u*10))*2):0});if(b===2)hearts(46,83,u,2)}});
  if(b===4){if(u<.8){const k=ez(u/.8);bandanaAt(Math.round(52+(47-52)*k),Math.round(58+(90-58)*k-Math.sin(k*Math.PI)*8),'#2a6ad8')}r(54,93,8,10,'#ffd86b');r(54,93,8,1,'#fff0b0');r(56,96,4,3,'#d8352f');r(57,95,1,1,'#ffd86b')}
  castDraw(L)})});
 talk([{n:'',t:'BEEP. BEEP. BEEP. A golden truck backs right up to the gym.',a:bt(K,0)},{n:'',t:'The side rolls up. A trumpet plays. Inside: bags and bags of Royal Kibble.',a:bt(K,1,()=>snd('fanfare'))},
  {n:'',t:'Donut has never wanted anything more in her life.',a:bt(K,2)},{n:'Vivian',t:'Royal Kibble called. They want Donut. $2,600 a week. Even I’m impressed.',a:bt(K,3)},
  {n:'',t:'Royal Kibble: '+fmt$(SPON.kibble.pay)+' a week. Donut wears the Royal Kibble Scarf for full pay.',c:[{l:'Sign the deal',f:()=>{signSpon('kibble');bt(K,4)()}},{l:'No thanks',f:()=>{S.mood=clamp(S.mood+5,0,100);save();bt(K,5)()}}]},
  {get n(){return S.spon==='kibble'?'Vivian':''},get t(){return S.spon==='kibble'?'And a lifetime supply. Don’t say I never did anything for you.':'The truck pulls away. Donut watches it go. For a long, long time.'},a:()=>{if(S.spon!=='kibble')bt(K,5)()}}],then,K.draw)}
/* Corgi Couture: a runway in Paris */
function cutCouture(then){const K=cutScr((C,u,t)=>{cx.save();cx.scale(2,2);cx.translate(0,-VOY);venueDraw('paris',-8,t,1);const b=C.b,L=[];
  const w=b===0?Math.round(tw(0,80,u,1.4)):80;r(0,168,w,10,'#b8283a');r(0,168,w,1,'#e84a5a');for(let x=4;x<w;x+=8)r(x,173,3,1,'#ffd86b');if(w>0&&w<80){r(w-2,166,3,13,'#8a1a2a')}
  for(let i=0;i<6;i++){const x=6+i*13;r(x,165,1,4,'#ffd86b');disc(x,164,1,'#ffd86b',1)}
  const vx=b===1?tw(92,58,u,1.6):58;if(b>=1)L.push({y:172,f:()=>{ppl('viv',vx,172,t,'l',b===1&&u<1.6);if(b===2)capelet(vx+1,141+Math.round(Math.sin(u*6)),u);if(b===1&&u>1.6)glint(vx+2,150,u)}});
  const dx=b===3?tw(10,36,u,2.2):b===4?20:24;L.push({y:174,f:()=>gcorgi(dx,174,{c:'red',st:b===3&&u<2.2?'run':'stand',t:b===3?u*.6:t,dir:'r',g:b>=3&&S.spon==='couture'?Object.assign(dGear(),{body:'capeP'}):dGear(),tongue:1})});
  L.push({y:190,f:()=>{for(let i=0;i<5;i++)kid(8+i*16,192,u+i,['#2a2a3a','#5a5a66','#2a2a3a','#7a2fe0','#2a2a3a'][i],0)}});
  castDraw(L);if(b>=1&&!(b===4))flashes(u,b===3?8:4);venueFg('paris',-8);cx.restore()});
 talk([{n:'',t:'Paris. A red carpet rolls out right down the middle of the track.',a:bt(K,0)},{n:'',t:'Cameras everywhere. And at the end of the runway, in enormous sunglasses...',a:bt(K,1)},
  {n:'Vivian',t:'Corgi Couture. Paris. They want her on the runway AND the racetrack. $9,500 a week, darling.',a:bt(K,2)},
  {n:'',t:'Corgi Couture: '+fmt$(SPON.couture.pay)+' a week. Donut wears the Couture Capelet for full pay.',c:[{l:'Sign the deal',f:()=>{signSpon('couture');bt(K,3)()}},{l:'No thanks',f:()=>{S.mood=clamp(S.mood+5,0,100);save();bt(K,4)()}}]},
  {get n(){return S.spon==='couture'?'':'Vivian'},get t(){return S.spon==='couture'?'Donut struts the whole runway in her new capelet. Paris loses its mind.':'Non? ...Fine. Paris will wait. Paris always waits.'}}],then,K.draw)}
/* Coach Gus: waiting by the gate at sunset */
function cutGus(win,then){S.fl.gus=1;save();const K=cutScr((C,u,t)=>{at2(()=>{homeBack(t);cx.globalAlpha=.22;r(0,0,80,156,'#5a2a6a');cx.globalAlpha=1;const b=C.b,L=[];
  const gx=b===0?8:b===1?tw(8,22,u,2.6):22,gy=b===0?84:b===1?tw(84,102,u,2.6):102;
  L.push({y:gy,f:()=>{gus2(gx,gy,b===1?u:t,b===1||b>=2?'r':'r',b>=2&&b!==4);if(b===0){r(gx-4,gy-6,6,5,'#5a6a8a');r(gx-4,gy-6,6,1,'#7a8aaa')}if(b===4&&u<.8){for(let i=0;i<3;i++)r(gx+18+i*3,gy-12-i*2,2,1,'#fff6e0');}}});
  L.push({y:86,f:()=>p2('abi',44,86,t,'l')});L.push({y:87,f:()=>p2('hunter',56,87,t,'l')});
  const dx=b===4&&u<1?tw(42,48,u,.4):b>=4?48:42;L.push({y:98,f:()=>{gcorgi(dx,98,{c:'red',st:b>=4?'sit':'stand',t,dir:'l',g:dGear(),tongue:b===6});if(b===4&&u>.3&&u<1.2)ptxt('!',dx-2,73,'#ff7eb6')}});
  castDraw(L);if(b===6)hearts(30,80,u,4)})});
 talk([{n:'',t:'Back home, at sunset, someone is sitting by the gate. Low to the ground. Very long ears. A duffel bag.',a:bt(K,0)},
  {n:'',t:'He waddles across the yard. It takes a while.',a:bt(K,1)},
  {n:'Coach Gus',t:'Name’s Gus. Coach Gus. I raced the circuit back in ’87. Fastest basset hound in the Ozarks.',a:bt(K,2)},{n:'Hunter',t:'Is a basset hound... fast?',a:bt(K,3)},{n:'Coach Gus',t:'No. That’s what made it impressive.'},
  {n:'Coach Gus',t:win?'Your pup beat Biscuit on day one. Raw talent. Zero plan. That’s where I come in.':'Your pup’s got wheels. No plan. Biscuit ate her lunch today. That’s where I come in.'},
  {n:'',t:'He blows his whistle. FWEEEET. Donut sits at attention so fast she skids.',a:bt(K,4,()=>snd('alert'))},
  {n:'Coach Gus',t:'Train smart. Rest when she’s tired. Buy her real equipment when you can. And for the love of kibble, watch the squirrels.',a:bt(K,5)},{n:'Abigail',t:'Welcome to the team, Coach.',a:bt(K,6)}],then,K.draw)}
/* the sprained paw: couch, vet, and a bracelet */
function cutInjury(then){const K=cutScr((C,u,t)=>{at2(()=>{const b=C.b,L=[];
  if(b<=1){aptBg(t,1);const jx=b===0?tw(22,40,u,.6):40,jy=b===0&&u<.6?Math.round(Math.sin(u/.6*Math.PI)*8):0,yy=b===0?tw(92,112,u,.6):112;
   L.push({y:yy,f:()=>{gcorgi(jx,yy,{c:'red',st:'stand',t,dir:'r',jy,g:dGear()});if(u>.7||b===1){r(jx+5,yy-5-Math.round(Math.abs(Math.sin(t*3))),2,2,'#fbf6ec')}}});
   if(b===1)L.push({y:110,f:()=>p2('abi',tw(70,56,u,1),110,t,'l',u<1)});castDraw(L);if(b===0&&u>.7)ptxt('?',44,88,'#ff7eb6')}
  else if(b<=4){r(0,0,80,144,'#e8f4f2');for(let x=0;x<80;x+=8)r(x,0,1,64,'#dcece8');r(0,62,80,2,'#b8d0cc');for(let y=64;y<144;y+=8)for(let x=((y-64)/8%2)*8;x<80;x+=16)r(x,y,8,8,'#f0f6f4');
   r(4,20,16,20,'#fff6e0');r(4,20,16,4,'#5ac8c0');r(8,28,3,3,'#e0903a');r(13,30,4,2,'#e0903a');r(70,40,10,48,'#c8b8a0');r(71,41,8,46,'#d8c8b0');r(72,64,1,4,'#8a7a6a');r(26,14,22,10,'#2a3a4a');r(28,16,18,1,'#7ee8fa');
   r(22,84,36,4,'#c8c8d0');r(22,84,36,1,'#e8e8f0');r(24,88,2,14,'#8a8a96');r(54,88,2,14,'#8a8a96');
   L.push({y:84,f:()=>{gcorgi(40,84,{c:'red',st:'stand',t,dir:'l',g:dGear()});const bw=b===2?Math.round(tw(0,3,u,1.4)):3;if(bw)r(33,81,2,bw,'#ffffff')}});
   L.push({y:100,f:()=>ppl('vet',30,100,t,'r')});L.push({y:104,f:()=>p2('abi',52,104,t,'l')});L.push({y:106,f:()=>p2('hunter',62,106,t,'l')});
   if(b>=3)L.push({y:96,f:()=>ppl('viv',b===3?tw(84,72,u,1):b===4?tw(72,90,u,1.4,.6):72,96,t,b===4?'r':'l',(b===3&&u<1)||(b===4&&u>.6))});castDraw(L)}
  else{aptBg(t,0);L.push({y:93,f:()=>gcorgi(20,93,{c:'red',st:'lie',sleep:b===6,g:dGear()})});L.push({y:110,f:()=>p2('abi',30,110,t,'l')});castDraw(L);
   if(b>=5){const k=b===5?ez(u/1.2):1;for(let i=0;i<5;i++){if(i/5<k)r(23+i,86,1,1,['#7ee8fa','#ff7eb6','#ffd86b','#8be28b','#b78cff'][i])}}if(b===6)hearts(26,78,u,4)}})});
 talk([{n:'',t:'Monday. Donut hops off the couch... and holds up one front paw.',a:bt(K,0)},{n:'Abigail',t:'Hunter. She’s limping.',a:bt(K,1)},
  {n:'',t:'A trip to the vet. A sprained paw. Nothing broken, but she needs to rest.',a:bt(K,2)},
  {n:'Vivian',t:'The Comet race is in two weeks. Sponsors are watching. Can she run hurt?',a:bt(K,3)},{n:'Abigail',t:'No. She’s not a racer first. She’s our dog first.'},
  {n:'Hunter',t:'She sits out this week. End of discussion.',a:bt(K,4)},
  {n:'',t:'That night, Abigail ties a little bracelet onto Donut’s collar.',a:bt(K,5)},{n:'Abigail',t:'For luck. And so you know we love you, win or lose.',a:bt(K,6)},
  {n:'',t:'Got: Abigail’s Bracelet. Donut rests this week (no race).'}],then,K.draw)}
/* Crumpet signs up for the relay */
function cutRelay(then){const K=cutScr((C,u,t)=>{at2(()=>{homeBack(t);const b=C.b,L=[];const lw=b===0?Math.round(tw(0,60,u,2)):60;r(14,96,lw,2,'#fff6e0');r(14,96,lw,1,'#ffffff');
  const gx=b===0?tw(8,72,u,2):72;L.push({y:104,f:()=>{gus2(gx,104,u,'r',b>=2);if(b===0&&u<2){r(gx+12,96,4,3,'#3a3a46');r(gx+11,97,1,1,'#ffffff')}}});
  const cxp=b<=1?tw(92,44,u,2.4):44,cp=b===0||(b===1&&u<2.4)?0:b===3?(Math.floor(u*3)%2?2:3):3;L.push({y:96,f:()=>crumpet(cxp,96,'l',t,cp,0)});
  L.push({y:86,f:()=>p2('abi',20,86,t,'r')});L.push({y:85,f:()=>p2('hunter',30,85,t,'r')});L.push({y:110,f:()=>gcorgi(44,110,{c:'red',st:'sit',t,g:dGear(),tongue:b>=3})});castDraw(L);if(b===3)hearts(44,82,u,3)})});
 talk([{n:'',t:'Coach Gus is painting a starting line across the yard.',a:bt(K,0)},{n:'',t:'Crumpet walks right up to it. Slowly. Purposefully. And lies down ON the line.',a:bt(K,1)},
  {n:'Hunter',t:'Does she... want to race?'},{n:'Coach Gus',t:'There’s a Doubles Relay Showcase this season. Sister runs first, Donut runs the anchor leg.',a:bt(K,2)},
  {n:'Crumpet',t:'*rolls over. Ready.*',a:bt(K,3)},{n:'',t:'The Doubles Relay is open on the race list!'}],then,K.draw)}
/* Crumpet gives Donut her chew toy */
function cutChew(then){const K=cutScr((C,u,t)=>{at2(()=>{homeBack(t);const b=C.b,L=[];const cxp=b===0?tw(92,58,u,2.2):58,drop=b>=1;
  L.push({y:100,f:()=>{crumpet(cxp,100,'l',t,b===0&&u<2.2?0:1,0);if(!drop){r(cxp-12,90,5,2,'#ff7eb6');r(cxp-13,89,2,2,'#ff7eb6');r(cxp-9,89,2,2,'#ff7eb6')}}});
  if(drop){const ty=b===1?Math.round(tw(90,100,u,.4)):100;r(46,ty-2,5,2,'#ff7eb6');r(45,ty-3,2,2,'#ff7eb6');r(49,ty-3,2,2,'#ff7eb6')}
  L.push({y:100,f:()=>gcorgi(38,100,{c:'red',st:b>=2?'stand':'sit',t,dir:'r',g:dGear(),tongue:b>=2})});L.push({y:86,f:()=>p2('abi',20,86,t,'r')});L.push({y:87,f:()=>p2('hunter',32,87,t,'r')});castDraw(L);if(b>=2)hearts(42,84,u,4)})});
 talk([{n:'',t:'Crumpet waddles across the yard with something pink in her mouth.',a:bt(K,0)},{n:'',t:'She drops her favourite chew toy right at Donut’s feet.',a:bt(K,1,()=>snd('pop'))},
  {n:'Abigail',t:'Oh my gosh. Crumpet is giving Donut her TOY. That’s her most prized possession.',a:bt(K,2)},{n:'',t:'Got: Crumpet’s Chew Toy (Charm: +4 Focus, +2 Stamina).'}],then,K.draw)}
/* a palace, a velvet cushion, and the world champion */
function palace(C,u,t){at2(()=>{r(0,0,80,144,'#4a1430');for(let y=0;y<70;y+=8)for(let x=((y/8)%2)*4;x<80;x+=8){r(x+2,y+2,2,2,'#5a1a3c');r(x+3,y+1,1,1,'#5a1a3c')}r(0,66,80,4,'#c89a20');r(0,70,80,74,'#2a1020');for(let y=74;y<144;y+=6)r(0,y,80,1,'#341428');
  ell(40,104,30,8,'#7a1a2a',1);ell(40,104,26,6,'#9a2a3a',1);[[10,16],[56,16]].forEach(([x,y])=>{r(x,y,14,18,'#ffd86b');r(x+1,y+1,12,16,'#3a2a4a');r(x+4,y+8,6,6,'#e8a050')});r(39,0,2,10,'#c89a20');for(let i=0;i<5;i++){r(32+i*4,10,2,4,'#fff6d0');disc(33+i*4,9,1,'#fff6d0',1)}
  r(56,58,20,14,'#1a1a22');r(57,59,18,11,'#6ab0e8');r(57,65,18,5,'#3a8a3a');const k=(t*12)%22;r(57+k,64,3,2,'#e0903a');r(60+k,63,1,2,'#e0903a');r(64,72,4,10,'#c89a20');r(60,82,12,2,'#c89a20');
  r(26,96,28,7,'#7a2fe0');r(26,96,28,1,'#9a5af0');r(25,101,1,3,'#ffd86b');r(54,101,1,3,'#ffd86b');gcorgi(38,98,{c:'fluff',st:'lie',sleep:C.v.yawn&&tm-C.v.yawn>1.2,g:{}});crown2(43,85);
  if(C.v.yawn&&tm-C.v.yawn<1.2){r(46,92,2,2,'#5a1a2a')}ppl('nigel',16,110,t,'r')})}
/* the boss walks out, the handler talks, Donut reacts */
function bossWalkout(ev,cast0,st){const B=BOSS[ev.boss],V=VEN[ev.ven],ri=ri0();function ri0(){return Math.floor(Math.random()*4)}
 const K=cutScr((C,u,t)=>{cx.save();cx.scale(2,2);cx.translate(0,-VOY);venueDraw(ev.ven,-8,t,1);venueFg(ev.ven,-8);const b=C.b,L=[];
  L.push({y:162,f:()=>{ppl('buzz',10,162,t,'r');if(b<=1){r(16,146,2,3,'#3a3a46');disc(17,145,1,'#8a8a96',1)}}});
  const bx=b===0?92:b===1?tw(92,54,u,1.4):54;L.push({y:170,f:()=>{gcorgi(bx,170,{c:B.coat,g:B.gear,st:b===1&&u<1.4?'run':'stand',t,dir:'l'});if(b===1&&u<1.4)dust(bx+8,170,u,4)}});
  if(b>=2)L.push({y:166,f:()=>ppl(B.hc,b===2?tw(90,68,u,1):68,166,t,'l',b===2&&u<1)});
  const re=b===3,dx=30;L.push({y:176,f:()=>{if(re&&ri===1&&u<1.6){const a=u/1.6*Math.PI*2;gcorgi(dx+Math.cos(a)*7,176+Math.sin(a)*3,{c:'red',st:'run',t,dir:Math.sin(a)>0?'l':'r',g:dGear()})}
   else gcorgi(dx,176,{c:'red',st:re&&ri===3&&Math.floor(u*2)%2?'sit':'stand',t,dir:'r',g:dGear(),tongue:re&&ri!==2});if(re&&ri===0&&u<.6){for(let i=0;i<4;i++)r(dx+12+i*2,166-i,1,1,'#e8f0ff')}
   if(re&&ri===2){r(dx+12,164,2,1,'#ffffff');r(dx+15,163,2,1,'#ffffff');r(dx+12,168,4,1,'#ffffff')}}});
  if(S.fl.gus)L.push({y:186,f:()=>gus2(64,186,t,'l',b===4)});castDraw(L);if(b<=1&&Math.floor(u*4)%2)flashes(u,3);cx.restore()});
 const react=['*sneezes. Confidently.*','*does one small zoomie*','*stares straight ahead. Locked in.*','*sits. Then stands. Then sits again.*'][ri];
 const L=[{n:'Buzz',t:'LADIES AND GENTLEMEN, welcome to the '+V.n+'!',a:bt(K,0)},{n:'Buzz',t:'In lane three... '+B.w.replace(/\.$/,'')+'... it’s '+B.n.toUpperCase()+'!',a:bt(K,1,()=>snd('cheer'))},{n:B.h,t:B.t,a:bt(K,2)},{n:'Donut',t:react,a:bt(K,3)}];
 if(ev.boss==='fluff')L.splice(2,0,{n:'Buzz',t:'The undefeated world champion versus the park dog from Missouri. You could not WRITE this!'});
 if(ev.boss==='chad')L.push({n:'Coach Gus',t:'He’s gonna bark at you mid-race. When he does: HOLD. Don’t you dare look at him.',a:bt(K,4)});
 return {L,draw:K.draw}}
/* ---------------- tutorial: a guided first week ----------------
   S.tutS: 1 tour of the gym, 2 after the first workout, 3 after the practice race,
   4 after the first real race, 5 done. One-off tips live in S.tips. */
function coach(steps,done){let i=-1,cur=null;const ov=el('<div class="coach"><div class="hole"></div><div class="tip"><div class="nm"></div><div class="tx"></div><div class="ft"><button class="skip">Skip tutorial</button><span class="go"></span></div></div></div>');
 ui.appendChild(ov);const hole=ov.querySelector('.hole'),tip=ov.querySelector('.tip'),nm=ov.querySelector('.nm'),tx=ov.querySelector('.tx'),gl=ov.querySelector('.go');
 const tgt=s=>!s.sel?null:typeof s.sel==='function'?s.sel():ui.querySelector(s.sel);
 function place(){const s=steps[i],t=tgt(s),R0=root.getBoundingClientRect(),u=R0.width/BW;
  if(t){const b=t.getBoundingClientRect(),p=u*1.6;ov.classList.remove('dim');hole.style.display='block';Object.assign(hole.style,{left:(b.left-R0.left-p)+'px',top:(b.top-R0.top-p)+'px',width:(b.width+p*2)+'px',height:(b.height+p*2)+'px'});
   const below=(b.top+b.bottom)/2<R0.top+R0.height*.5;tip.style.top=below?(b.bottom-R0.top+p+u*5)+'px':'';tip.style.bottom=below?'':(R0.bottom-b.top+p+u*5)+'px'}
  else{ov.classList.add('dim');hole.style.display='none';tip.style.top='';tip.style.bottom=(R0.height*.38)+'px'}}
 function next(){i++;if(i>=steps.length){ov.remove();removeEventListener('resize',place);if(done)done();return}const s=steps[i];if(s.pre)s.pre();
  const show=()=>{const t=tgt(s);if(t&&t.scrollIntoView)t.scrollIntoView({block:'center'});setTimeout(()=>{place();nm.textContent=s.n||'';nm.style.color=NC2[s.n]||'#e0468c';tx.innerHTML=s.t;gl.textContent=s.act?'Tap the glowing button':'Tap to continue ▸';tip.classList.remove('pop');void tip.offsetWidth;tip.classList.add('pop')},40)};
  setTimeout(show,s.wait||0);snd('blip')}
 ov.addEventListener('click',e=>{if(e.target.closest('.skip')){snd('select');S.tutS=5;save();ov.remove();removeEventListener('resize',place);hubUI();return}
  const s=steps[i];if(!s)return;if(s.act){const t=tgt(s);if(!t)return;const b=t.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom){hole.classList.remove('nudge');void hole.offsetWidth;hole.classList.add('nudge');return}
   ov.style.display='none';if(s.do)s.do();else t.click();ov.style.display='';setTimeout(next,90)}else next()});
 addEventListener('resize',place);next();return ov}
function tutCheck(){if(!on||scr!==HUB||ui.querySelector('.coach,.dlg,.res,.pan'))return;const st=S.tutS||5;
 if(st===1)coach([
  {n:'Abigail',t:'Welcome to Donut’s racing career! Let me show you around the gym.'},
  {sel:'.top .r1',n:'Abigail',t:'Up here: the week, which league Donut is in, and how much money we have.'},
  {sel:'.top .meters',n:'Abigail',t:'<b>Energy</b> goes down when she trains or races. <b>Mood</b> makes training work better. Races and workouts earn XP to level her up.'},
  {sel:'.top .aps',n:'Abigail',t:'Every week Donut gets <b>3 actions</b>. Training, naps, playtime and side gigs each use one.'},
  {sel:'[data-a="train"]',act:1,n:'Abigail',t:'Let’s start with a workout. Tap <b>TRAIN</b>.'},
  {sel:'[data-p="spd"]',act:1,wait:350,n:'Abigail',t:'Each workout raises one stat. <b>PLAY</b> the minigame for the biggest boost, or <b>QUICK</b> to skip it. Try Treadmill Tempo!',pre:()=>{S.tutS=2;save()}}]);
 else if(st===2)coach([
  {n:'Abigail',t:'Nice workout! Her Speed went up. Now let’s try a <b>practice race</b> before the real thing.'},
  {sel:'[data-a="race"]',act:1,n:'Abigail',t:'Tap <b>RACE DAY</b>.',do:()=>{go(raceScreen({ven:'park',tut:1}))}}]);
 else if(st===3)coach([
  {sel:'[data-a="race"]',act:1,n:'Abigail',t:'She’s ready for a real race! Donut gets <b>one race a week</b>. Tap <b>RACE DAY</b>.'},
  {sel:'#crz .pan .boss',wait:350,n:'Abigail',t:'These are the <b>boss corgis</b>. Beat them all to move up to the next league. They unlock as you earn <b>league points</b>.'},
  {sel:'[data-v="park"]',act:1,n:'Abigail',t:'Circuit races earn prize money and league points (3 for 1st, 2 for 2nd, 1 for 3rd). Let’s race at the dog park!',pre:()=>{S.tutS=4;save()}}]);
 else if(st===4)coach([
  {n:'Abigail',t:'Her first real race! A few more things before you’re on your own.'},
  {sel:'[data-a="care"]',n:'Abigail',t:'Tired pup? <b>REST &amp; GIGS</b> has naps, playtime with Crumpet, and side gigs that pay extra money.'},
  {sel:'[data-a="shop"]',n:'Abigail',t:'The <b>SHOP</b> sells gear Donut can wear, equipment that boosts training, and treats for race day.'},
  {sel:'[data-a="gear"]',n:'Abigail',t:'<b>DONUT</b> shows her stats and lets you change her outfit. Every piece of gear gives a bonus.'},
  {sel:'[data-a="skill"]',n:'Abigail',t:'Each level-up gives a <b>skill point</b>. Spend them in <b>SKILLS</b> on special moves.'},
  {sel:'[data-a="gym"]',n:'Abigail',t:'Each <b>GYM</b> has a stat limit. When Donut hits it, upgrade the gym to keep growing. Every new gym unlocks something new to do, too.'},
  {sel:'[data-a="week"]',n:'Abigail',t:'When you’re done, <b>END WEEK</b>. Donut rests, sponsors pay, and a new week begins. Go get ’em, Donut!',pre:()=>{S.tutS=5;save()}}]);
 else tipCheck()}
/* one-off tips the first time something new shows up */
function tipCheck(){S.tips=S.tips||{};const T=S.tips,nb=nextBoss();
 const one=(k,steps)=>{T[k]=1;save();coach(steps);return 1};
 if(nb&&nb.ok&&!S.raced&&!T['boss'+S.lg+S.boss])return one('boss'+S.lg+S.boss,[{sel:'[data-a="race"]',n:S.fl.gus?'Coach Gus':'Abigail',t:'A <b>boss race</b> is open: <b>'+BOSS[nb.b].n+'</b>. '+BOSS[nb.b].w+' Find it at the top of RACE DAY.'}]);
 if(S.sp>0&&!T.sk)return one('sk',[{sel:'[data-a="skill"]',n:'Abigail',t:'Level up! You have a <b>skill point</b> to spend. Tap SKILLS to pick a special move.'}]);
 if(S.money>=GYM[2].p&&S.gym===1&&!T.gym)return one('gym',[{sel:'[data-a="gym"]',n:'Hunter',t:'We can afford the <b>Garage Gym</b> now! Donut’s stats can go up to 40 there, and Crumpet can train with her.'}]);
 if(GYM[S.gym+1]&&STATS.some(([k])=>S.st[k]>=capOf())&&!T['cap'+S.gym])return one('cap'+S.gym,[{sel:'[data-a="gym"]',n:S.fl.gus?'Coach Gus':'Abigail',t:'One of Donut’s stats has hit this gym’s limit of <b>'+capOf()+'</b>. Upgrade to <b>'+GYM[S.gym+1].n+'</b> to keep growing.'}]);
 if(S.en<30&&!T.tired)return one('tired',[{sel:'[data-a="care"]',n:'Abigail',t:'Donut is pooped. Low energy makes her run out of stamina faster. Take a <b>nap</b> or <b>end the week</b>.'}]);
 if(S.lg===1&&!T.lg1)return one('lg1',[{sel:'[data-a="shop"]',n:'Coach Gus',t:'New league, new gear. Check the <b>SHOP</b>, and remember: equipment makes every workout count for more.'}])}
function tutRaceDone(pl,time){if((S.tutS||5)<3)S.tutS=3;const ups=addXP(20);save();
 resultCard({title:'PRACTICE DONE!',stars:3,lines:['Donut knows all the moves!','+20 XP'].concat(ups.length?['<em>LEVEL UP! Lv '+S.lv+'</em>']:[]),sub:'Practice run &middot; '+time.toFixed(2)+'s',btn:'Back to the gym',then:()=>hub()})}
/* the help page: controls and the weekly loop, plus replays */
function panHelp(){const h='<div class="card" style="display:block"><b style="color:#c2417a;font-weight:400">RACE CONTROLS</b><small>TAP to sprint (uses stamina)<br>SWIPE UP to jump &middot; SWIPE DOWN to duck<br>HOLD your finger down when a squirrel or snack appears<br>Tap ZOOM when the meter is full</small></div>'+
 '<div class="card" style="display:block"><b style="color:#c2417a;font-weight:400">EACH WEEK</b><small>3 actions: train, nap, play with Crumpet or work a side gig<br>1 race: circuit races earn money and league points<br>END WEEK to rest up and get paid by sponsors</small></div>'+
 '<div class="card" style="display:block"><b style="color:#c2417a;font-weight:400">MOVING UP</b><small>League points unlock boss races. Beat every boss to move up: Amateur, Minor, Major, then the Global Rankings, where your world rank unlocks the bosses.</small></div>'+
 '<div class="card" style="display:block"><b style="color:#c2417a;font-weight:400">GETTING STRONGER</b><small>Training raises stats and equipment multiplies it. Each gym has a stat limit (25, 40, 58, 75, 99): upgrade to keep growing, and each gym unlocks something new. Gear adds bonuses on top. Level-ups give a skill point and +1 to every stat.</small></div>'+
 '<button class="tag" data-h="race">Replay the practice race</button><button class="tag" data-h="tour">Show me around again</button>'+
 '<p class="hd" style="margin-top:'+U(4)+'">START OVER</p><p class="sub" style="text-align:left">Restart Corgi Racers from Week 1, with the intro and tutorial. Your Our Story progress, stars and photos are not touched.</p><button class="tag pink" data-h="reset">Start Corgi Racers over</button>';
 panel('HOW TO PLAY',null,h,p=>{p.querySelector('[data-h="race"]').onclick=()=>{snd('confirm');go(raceScreen({ven:'park',tut:1}))};
  p.querySelector('[data-h="reset"]').onclick=()=>{snd('select');confirmReset()};
  p.querySelector('[data-h="tour"]').onclick=()=>{snd('confirm');p.remove();hubUI();S.tutS=4;setTimeout(()=>{if(!ui.querySelector('.coach'))tutCheck()},400)}})}

/* start the career over from week 1: only Corgi Racers' own save is cleared */
function confirmReset(){const d=el('<div class="res fadein"><h2 style="font-size:'+U(6)+'">START OVER?</h2><p class="ln">Donut goes back to <em>Week 1</em> in the Amateur League.<br>Her stats, money, gear, skills, gym and wins in Corgi Racers will be reset.</p><p class="ln" style="color:#8be28b">Your Our Story progress, stars<br>and photo album stay just as they are.</p><div class="btns"><button class="tag pink" data-r="1">Yes, start over</button><button class="tag" data-r="0">Keep my progress</button></div></div>');
 ui.appendChild(d);d.querySelector('[data-r="0"]').onclick=()=>{snd('select');d.remove()};
 d.querySelector('[data-r="1"]').onclick=()=>{snd('confirm');S=defSave();save();for(const k in ICN)if(k.startsWith('big'))delete ICN[k];HUBD.zt=HUBD.ct=-9;d.remove();storyIntro()}}
/* ---------------- little moments: short scenes for rest, play, the spa, side gigs and treats ----------------
   The stats change the moment you tap; these play right after (about 5 seconds, tap to skip). */
function aptBg(t,day){const k6=['day','couch','h6'].map(k=>c6[k]),k7=['home','sitH','sitA','dim','lap'].map(k=>c7[k]),hx0=typeof hx!=='undefined'?hx:null;
 Object.assign(c6,{day:day?1:0,couch:0,h6:0});Object.assign(c7,{home:0,sitH:0,sitA:0,dim:0,lap:0});try{hx=null}catch(e){}
 try{borrow('vHome6',t,null)}finally{['day','couch','h6'].forEach((k,i)=>c6[k]=k6[i]);['home','sitH','sitA','dim','lap'].forEach((k,i)=>c7[k]=k7[i]);try{hx=hx0}catch(e){}}}
const zzz=(x,y,u)=>{for(let i=0;i<3;i++){const k=((u*.7+i/3)%1),X=Math.round(x+k*8+Math.sin(k*6)*2),Y=Math.round(y-k*16);cx.globalAlpha=1-k;r(X,Y,3,1,'#fff6e0');r(X+1,Y+1,1,1,'#fff6e0');r(X,Y+2,3,1,'#fff6e0');cx.globalAlpha=1}};
const hearts=(x,y,u,n)=>{for(let i=0;i<(n||3);i++){const k=((u*.8+i/(n||3))%1);cx.globalAlpha=1-k;heart(Math.round(x+Math.sin(k*7+i)*4+i*3-4),Math.round(y-k*18),'#ff5f9e');cx.globalAlpha=1}};
const sparkle=(x,y,c)=>{r(x,y-1,1,3,c);r(x-1,y,3,1,c)};
const confetti=(u,n)=>{for(let i=0;i<(n||24);i++){const x=(i*37+Math.floor(u*30)*(i%3+1))%80,y=((i*29)+u*40*(1+i%3))%144;r(x,y,1,1,['#ffd86b','#ff7eb6','#7ee8fa','#8be28b'][i%4])}};
const beam=(x,y,w)=>{cx.globalAlpha=.1;for(let k=0;k<y;k+=2){const ww=Math.round(4+k/y*w);r(x-ww,k,ww*2,2,'#fff6d0')}cx.globalAlpha=.16;ell(x,y,w+2,3,'#fff6d0',1);cx.globalAlpha=1};
const flashes=(u,n)=>{for(let i=0;i<(n||5);i++){const ph=(u*1.7+i*.37)%1;if(ph<.12){const x=(i*29+7)%76+2,y=(i*17)%30+40;disc(x,y,3,'#fff6e0',.8);sparkle(x,y,'#ffffff')}}};
function kid(x,y,u,c,hat){x=Math.round(x);const b=Math.round(Math.abs(Math.sin(u*6+x))*2);y=Math.round(y)-b;r(x-2,y-6,5,4,c);r(x-2,y-10,5,4,'#f1c9a0');r(x-2,y-10,5,1,'#5a3620');r(x-1,y-2,1,2,'#3a4a6b');r(x+1,y-2,1,2,'#3a4a6b');r(x-3,y-6-b,1,3,'#f1c9a0');r(x+3,y-6-b,1,3,'#f1c9a0');if(hat){r(x,y-13,1,3,hat);r(x-1,y-11,3,1,hat)}}
/* the scenes, drawn at story scale; u = seconds since the scene began */
const FUN={
 nap:{t:'NAP TIME',d:5,draw(u,t){aptBg(t,1);const dim=u>1&&u<3.6?Math.sin((u-1)/2.6*Math.PI)*.45:0;
   if(u<3.6){gcorgi(20,92,{c:'red',st:'lie',sleep:1,g:dGear()});zzz(28,80,u)}else{const s=u-3.6;gcorgi(20,92,{c:'red',g:dGear(),st:s<.6?'lie':'stand',t,dir:'r',tongue:s>.6});if(s>.6)ptxt('!',30,72,'#ff7eb6')}
   if(dim>0){cx.globalAlpha=dim;r(0,0,80,144,'#141a40');cx.globalAlpha=1;disc(33,19,3,'#fff3c4',dim*1.6)}}},
 play:{t:'PLAYTIME WITH CRUMPET',d:5,draw(u,t){yard(t);const cxr=40,cyr=98;
   if(u<2.8){const a=u*3.4,x=cxr+Math.cos(a)*20,y=cyr+Math.sin(a)*6,bx=cxr+Math.cos(a+.6)*22,by=cyr+Math.sin(a+.6)*6-Math.abs(Math.sin(u*9))*4;
    const L=[{y:cyr,f:()=>crumpet(cxr,cyr,'r',t,1,0)},{y,f:()=>gcorgi(x,y,{c:'red',st:'run',t,dir:-Math.sin(a)>0?'r':'l',g:dGear()})},{y:by,f:()=>{disc(bx,by-2,1,'#c8e83a',1)}}];L.sort((a,b)=>a.y-b.y).forEach(q=>q.f())}
   else{crumpet(cxr+6,cyr,'l',t,u<3.2?1:2,0);gcorgi(cxr-10,cyr,{c:'red',st:u<3.6?'stand':'lie',t,dir:'r',tongue:1,g:dGear()});hearts(cxr-2,cyr-14,u-2.8,4)}}},
 spa:{t:'SPA DAY',d:5,draw(u,t){r(0,0,80,144,'#f6e2ea');for(let y=0;y<64;y+=6)for(let x=(y/6%2)*3;x<80;x+=6)r(x,y,5,5,'#fbeef3');r(0,62,80,2,'#e8b8cc');
   for(let y=64;y<144;y+=8)for(let x=((y-64)/8%2)*8;x<80;x+=16)r(x,y,8,8,'#fff6fa');for(let y=64;y<144;y+=8)for(let x=8-((y-64)/8%2)*8;x<80;x+=16)r(x,y,8,8,'#f8dbe6');
   r(56,18,16,22,'#c8a878');r(57,19,14,20,'#e8f4fc');r(58,21,2,6,'#ffffff');r(6,28,20,2,'#c8a878');[[8,'#7ee8fa'],[13,'#ff9ccb'],[18,'#ffd86b'],[22,'#b78cff']].forEach(([x,c])=>{r(x,22,3,6,c);r(x+1,20,1,2,'#fff6e0')});
   r(4,50,6,12,'#b8683a');disc(7,46,5,'#4a9a54',1);disc(5,42,3,'#5aaa64',1);
   if(u<2.2){r(18,84,44,14,'#f6f6fa');r(20,96,40,4,'#e0e0e8');r(18,84,44,1,'#ffffff');r(22,98,3,4,'#c8c8d0');r(55,98,3,4,'#c8c8d0');
     const hy=82-Math.round(Math.sin(u*4)*1);r(37,hy-6,7,6,'#e0903a');r(39,hy-6,1,3,'#fbf6ec');r(41,hy-3,3,2,'#fbf6ec');r(44,hy-3,1,1,'#2a1a1a');r(41,hy-5,1,1,'#2a1a1a');r(37,hy-9,2,3,'#e0903a');r(41,hy-9,2,3,'#e0903a');
     for(let i=0;i<14;i++){const x=20+((i*7)%40),y=84-((i*3)%5);disc(x,y,2+(i%2),'#ffffff',1);disc(x,y,1,'#e8f0ff',1)}for(let i=0;i<5;i++){const k=(u*.9+i/5)%1;disc(26+i*7,80-k*24,1+(i%2),'#ffffff',1-k)}}
   else if(u<3.8){r(26,100,28,4,'#ff9ccb');r(26,100,28,1,'#ffb8d8');const p=Math.sin(u*20)>0?1:0;gcorgi(40,102,{c:'red',st:'stand',t,dir:'r',g:dGear()});for(let i=0;i<10;i++){const a=i/10*Math.PI*2;r(Math.round(40+Math.cos(a)*(9+p)),Math.round(94+Math.sin(a)*(6+p)),1,1,'#fbf6ec')}
     r(58,82,8,5,'#7ee8fa');r(64,86,2,6,'#5a5a66');for(let i=0;i<4;i++){const k=(u*3+i/4)%1;r(Math.round(57-k*10),83+i,2,1,'#fff6e0')}}
   else{r(26,100,28,4,'#ff9ccb');gcorgi(40,102,{c:'red',st:'sit',t,tongue:1,g:dGear()});r(39,87,1,2,'#ff7eb6');r(42,87,1,2,'#ff7eb6');r(40,88,2,1,'#e0468c');for(let i=0;i<6;i++){const ph=(u*2+i/6)%1;if(ph<.5)sparkle(30+(i*9)%22,82+(i*7)%18,'#fff6e0')}}}},
 snack:{t:'SNACK TIME',d:3.4,draw(u,t){yard(t);gcorgi(36,98,{c:'red',st:'sit',t,tongue:u>1.2,g:dGear()});if(u<1.2){r(44,96,6,2,'#e8c080');r(43,95,2,2,'#e8c080');r(49,95,2,2,'#e8c080')}else if(u<2){for(let i=0;i<4;i++)r(42+i*2+Math.round(Math.sin(u*20+i)),94-((u*20+i*3)%6),1,1,'#e8c080')}else hearts(38,84,u-2,3)}},
 gig:{t:'SIDE GIG',d:5,draw(u,t,o){const g=o.gig||0;
   if(g===0){yard(t);[[16,60,'#ff7eb6'],[22,56,'#7ee8fa'],[28,61,'#ffd86b']].forEach(([x,y,c])=>{const b=Math.round(Math.sin(u*2+x)*1);r(x,y+5+b,1,18,'#e8e4f0');disc(x,y+b,3,c,1);r(x-1,y-2+b,1,1,'#ffffff')});
     r(52,88,16,3,'#8a5a3a');r(54,91,2,8,'#6a4a2a');r(64,91,2,8,'#6a4a2a');r(56,82,8,6,'#fff6e0');r(56,82,8,2,'#ff9ccb');r(59,79,1,3,'#ffd86b');kid(30,104,u,'#ff7eb6','#7ee8fa');kid(52,106,u,'#2a6ad8','#ffd86b');kid(64,104,u,'#3aa84a','#ff7eb6');
     gcorgi(42,100,{c:'red',st:'stand',t,jy:Math.round(Math.abs(Math.sin(u*5))*3),tongue:1,g:dGear()});r(46,84-Math.round(Math.abs(Math.sin(u*5))*3),1,3,'#ffd86b');r(45,87-Math.round(Math.abs(Math.sin(u*5))*3),3,1,'#ff7eb6');confetti(u,18)}
   else if(g===1||g===5||g===6){const ven=['','market','','','','nfl','paris'][g];cx.save();cx.translate(0,-VOY);venueDraw(ven,-8,t,1);venueFg(ven,-8);cx.restore();
     if(g===5){for(let i=0;i<4;i++)kid(48+i*8,130,u+i,['#d8352f','#2a6ad8','#ffd86b','#fff6e0'][i],0);flashes(u,6)}if(g===6){beam(34,104,12);for(let i=0;i<8;i++){const ph=(u*1.5+i/8)%1;if(ph<.5)sparkle(20+(i*11)%30,80+(i*7)%20,'#fff6e0')}}
     if(g===1){r(14,72,24,10,'#fff6e0');r(14,72,24,1,'#3aa84a');ptxt('FRESH',26,75,'#3aa84a',1,'c');r(25,82,2,20,'#8a6a4a')}
     gcorgi(34,104,{c:'red',st:g===6?'sit':'stand',t,jy:g===6?0:Math.round(Math.abs(Math.sin(u*5))*3),tongue:1,g:g===6?Object.assign(dGear(),{head:'beret'}):dGear(),dir:'r'})}
   else if(g===2){r(0,0,80,144,'#8ac8f0');r(0,60,80,84,'#9a9aa2');r(6,14,68,50,'#f6e8d8');r(6,14,68,10,'#3aa84a');ptxt('PET SHOP',40,17,'#fff6e0',1,'c');r(10,26,60,3,'#fff6e0');for(let i=0;i<8;i++)r(11+i*7,29,4,3,['#ff7eb6','#7ee8fa','#ffd86b','#8be28b'][i%4]);[[8,22,'#ff7eb6'],[72,22,'#7ee8fa']].forEach(([x,y,c])=>{r(x,y+4,1,30,'#e8e4f0');disc(x,y,3,c,1)});r(30,34,20,30,'#5a3a2a');r(31,35,18,28,'#7ab8e8');r(10,30,16,16,'#7ab8e8');r(54,30,16,16,'#7ab8e8');
     const cut=u>2.4;if(!cut){r(8,52,64,2,'#d8352f');r(38,50,4,5,'#d8352f')}else{const k=Math.min(1,(u-2.4)*2);r(8,52+k*10,30,2,'#d8352f');r(42,52+k*10,30,2,'#d8352f');confetti(u,20)}
     gcorgi(40,78,{c:'red',st:'stand',t,dir:'r',tongue:cut,jy:cut?Math.round(Math.abs(Math.sin(u*5))*3):0,g:dGear()});kid(14,84,u,'#ff8a3a',0);kid(66,84,u,'#7a2fe0',0);if(cut)flashes(u,4)}
   else if(g===3||g===4){r(0,0,80,144,g===3?'#2a4a8a':'#2a2a3a');for(let i=0;i<5;i++)r(i*18,0,1,64,g===3?'#3a5a9a':'#3a3a4a');r(0,64,80,80,'#3a3a46');for(let y=64;y<144;y+=8)r(0,y,80,1,'#32323e');
     if(g===3){r(10,10,60,10,'#ffd86b');ptxt('GOOD MORNING',40,12,'#2a4a8a',1,'c');r(8,70,32,10,'#c84a5a');r(8,66,32,4,'#e86a7a');ppl('viv',18,80,t,'d');ppl('buzz',30,80,t,'d')}
     else{r(54,74,16,10,'#2a2a34');r(64,70,8,6,'#3a3a46');r(52,70,4,3,'#5a5a66');const cl=u<1;r(6,14,30,12,'#2a2a3a');for(let i=0;i<5;i++)r(7+i*6,cl?15:12-i,3,2,'#fff6e0');r(6,18,30,8,'#fff6e0');ptxt(cl?'TAKE 1':'ACTION',21,20,'#d8352f',1,'c');r(50,96,10,3,'#c8c4d0');r(51,95,8,1,'#a87a42')}
     r(62,40,3,24,'#5a5a66');r(56,34,14,8,'#1e1e24');disc(63,38,2,'#7ee8fa',1);if(Math.floor(u*2)%2)r(68,35,2,2,'#ff4a4a');
     beam(g===3?48:40,g===3?84:98,12);
     gcorgi(g===3?48:40,g===3?84:98,{dir:g===4&&u>1.6&&u<3.4?'r':'r',c:'red',st:g===4&&u>1.6&&u<3.4?'stand':'sit',t,tongue:1,g:dGear(),dir:'r'});if(g===4&&u>3.4)hearts(40,84,u-3.4,3);if(g===3)flashes(u,2)}
   else{r(0,0,80,144,'#8a5a3a');for(let y=0;y<64;y+=6)r(0,y,80,1,'#7a4a2a');r(10,10,26,18,'#2a3a2a');ptxt('MENU',23,13,'#fff6e0',1,'c');r(13,20,18,1,'#e8e8e0');r(13,23,12,1,'#e8e8e0');[[46,'#ff4a4a'],[58,'#ff4a4a'],[70,'#ff4a4a']].forEach(([x,c])=>{disc(x,14,4,c,1);r(x-1,9,3,2,'#2a1a1a')});
     r(0,64,80,80,'#c89a6a');for(let y=64;y<144;y+=6)r(0,y,80,1,'#b88a5a');r(30,90,20,4,'#ff9ccb');r(30,90,20,1,'#ffb8d8');for(let i=0;i<3;i++){r(8+i*24,104,10,3,'#6a4a2a');r(10+i*24,98,6,6,'#fff6e0');r(11+i*24,99,4,2,'#c8945a')}
     kid(10,94,u,'#7ee8fa',0);kid(70,94,u,'#ff7eb6',0);gcorgi(40,92,{c:'red',st:'sit',t,tongue:1,g:dGear()});hearts(40,78,u,3)}}}};
function vignette(k,o,then){const F=FUN[k],t0=tm;let done=0;const end=()=>{if(done)return;done=1;then()};
 go({enter(){MUS='crzHub'},draw(t){const u=tm-t0;at2(()=>F.draw(u,t,o||{}));
   r(0,0,BW,20,'rgba(14,8,40,.82)');ptxtS(String(o&&o.title||F.t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,'AND'),80,7,'#ffd86b',1,'c');r(0,19,BW,1,'#4a3a6a');
   const p=clamp((u-(F.d-1.6))/.3,0,1);if(p>0){const L=(o&&o.lines)||[];const h=10+L.length*10,y0=284-h;r(14,y0,132,h,'rgba(14,8,40,'+(.88*p)+')');r(14,y0,132,1,'rgba(255,216,107,'+p+')');cx.globalAlpha=p;L.forEach((s,i)=>ptxtS(s,80,y0+5+i*10,s[0]==='-'?'#ff9a9a':'#8be28b',1,'c'));cx.globalAlpha=1}
   else if(u>1)ptxt('TAP TO SKIP',80,278,'rgba(255,246,224,.5)',1,'c');if(u>=F.d)end()},
  tap(){if(tm-t0>.5)end()}});snd(k==='nap'?'chime':k==='snack'?'bite':'confirm')}
/* ---------------- gym unlocks: the Nutrition Kitchen and the Trophy Room ---------------- */
function panKitchen(){const pr=meal$(),bon=b=>Object.keys(b).map(k=>'+'+b[k]+' '+SN[k][1]).join(', ');let h='<p class="sub">Cook one meal before race day. Its boost lasts for your next race. No action needed.</p><p class="sub">You have <span style="color:#8be28b">'+fmt$(S.money)+'</span></p>';
 MEALS.forEach(([id,n,b],i)=>{const p2$=i===3?pr*3:pr;h+='<div class="card"><div class="bd">'+n+'<small>'+bon(b)+'</small></div><button class="go" data-m="'+i+'"'+(S.money<p2$?' disabled':'')+'>'+fmt$(p2$)+'</button></div>'});
 if(S.buff)h+='<p class="sub" style="color:#8be28b">Next race boost: '+bon(S.buff)+'</p>';
 panel('THE KITCHEN','Pro Facility',h,p=>p.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{const i=+b.dataset.m,[id,n,bf]=MEALS[i],cost=i===3?pr*3:pr;S.money-=cost;S.buff=S.buff||{};for(const k in bf)S.buff[k]=(S.buff[k]||0)+bf[k];save();snd('kaching');
  vignette('cook',{title:n.toUpperCase().replace(/’/g,'').replace(/&/g,'AND'),lines:Object.keys(bf).length>2?['+5 TO EVERY STAT','FOR YOUR NEXT RACE']:Object.keys(bf).map(k=>'+'+bf[k]+' '+SN[k][1].toUpperCase()).concat(['FOR YOUR NEXT RACE','-'+fmt$(cost)])},()=>{hub();panCare()})}))}
FUN.cook={t:'THE KITCHEN',d:5,draw(u,t){r(0,0,80,144,'#f4e8d8');for(let y=30;y<62;y+=4)for(let x=((y-30)/4%2)*4;x<80;x+=8)r(x,y,7,3,'#fff6ec');r(0,62,80,82,'#c89a6a');for(let y=62;y<144;y+=6)r(0,y,80,1,'#b88a5a');
 r(0,52,80,12,'#8a5a3a');r(0,52,80,2,'#d8d0c0');r(34,52,22,12,'#3a3a46');r(36,53,8,1,'#5a5a66');r(46,53,8,1,'#5a5a66');r(4,8,24,16,'#7ab8e8');r(4,8,24,16,'rgba(255,255,255,.2)');r(15,8,2,16,'#f4e8d8');r(60,10,16,14,'#e8e0d0');r(62,12,12,4,'#c8b8a0');
 const fl=Math.floor(t*12)%2;r(38,50,6,2,fl?'#ff8a3a':'#ffd060');r(40,44,8,7,'#8a8a96');r(40,44,8,1,'#b8b8c4');for(let i=0;i<3;i++){const k=(u*.8+i/3)%1;disc(41+i*3,Math.round(42-k*16),1+Math.round(k*2),'#ffffff',.6*(1-k))}
 p2('hunter',48,72,t,'u');const served=u>3;gcorgi(26,96,{c:'red',st:served&&u>3.4?'stand':'sit',t,tongue:1,g:dGear(),dir:'r'});if(!served&&Math.floor(u*2)%2)r(30,82,1,2,'#7ee8fa');
 if(served){const k=ez((u-3)/.4);const bx=Math.round(48+(36-48)*k),by=Math.round(72+(98-72)*k);r(bx-3,by-2,7,3,'#c2417a');r(bx-2,by-3,5,1,'#e8b860');if(u>3.6)hearts(28,80,u-3.6,3)}}};
function panTrophy(){let h='<p class="sub">Every boss trophy Donut has won, and her records.</p>';const own=k=>S.own.includes(k);
 LG.forEach(l=>{h+='<p class="hd">'+l.n.toUpperCase()+'</p>';l.boss.forEach(b=>{const B=BOSS[b[0]],it=B.drop,got=it&&own(it);h+='<div class="card'+(got?'':' dim')+'"><img class="ic" src="'+dogIcon(B.coat,B.gear,'b'+b[0])+'"><div class="bd">'+(got?GEAR[it].n:'???')+'<small>'+(got?'Beat '+B.n+' at the '+VEN[b[1]].n:'Not won yet')+'</small></div>'+(got?'<img class="ic" style="width:'+U(12)+'" src="'+gearIcon(it)+'">':'')+'</div>'})});
 h+='<p class="hd">RECORDS</p><div class="card" style="display:block"><small>'+S.wins+' wins in '+S.races+' races &middot; level '+S.lv+'<br>'+(S.fl.champ?'WORLD CHAMPION':'World rank #'+rankOf())+'</small></div>';
 panel('TROPHY ROOM','The Donut Dome',h)}
/* ---------------- gym perks: everything a new gym brings ---------------- */
const moodFloor=()=>{if(perk(3,0))S.mood=Math.max(S.mood,40)};
const sponMul=()=>(S.gym>=4?1.25:1)*(perk(4,1)?1.15:1);
const purseMul=()=>perk(2,1)?1.1:1;
function beatenBosses(){const out=[];LG.forEach((l,li)=>l.boss.forEach((b,bi)=>{if(li<S.lg||(li===S.lg&&bi<S.boss)||S.fl.champ)out.push(b)}));return out}
function nextBossId(){const b=LG[S.lg].boss[S.boss];return b?b[0]:null}
/* the stats where Donut trails the next boss the most */
function gaps(bid){const B=BOSS[bid];if(!B)return [];const E=eff();return STATS.map(([k,n],i)=>({k,n,d:Math.round(E[k]-B.st[i])})).sort((a,b)=>a.d-b.d)}

/* ---- moving day: every new gym gets its own little scene, then a perk to pick ---- */
function gymUpgraded(){const lv=S.gym,G=GYM[lv];const K=cutScr((C,u,t)=>{at2(()=>{homeBack(t);const b=C.b,L=[];
  if(b===2){if(lv===4&&u<1.2&&Math.floor(u*8)%3===0){r(0,0,80,156,'rgba(10,8,20,.6)')}if(lv===5){const k=1-ez(u/1.6);if(k>0){cx.globalAlpha=k*.7;r(0,0,80,156,'#0a0818');cx.globalAlpha=1}cx.globalCompositeOperation='lighter';disc(40,24,18+Math.round(Math.sin(u*6)*2),'#ff9ccb',.12*ez(u));cx.globalCompositeOperation='source-over'}
   if(lv===2&&u>.6){cx.globalCompositeOperation='lighter';disc(38,58,12,'#ff8a3a',.15);cx.globalCompositeOperation='source-over'}if(lv===3&&u<1.4){for(let i=0;i<3;i++)glint(56+i*6,26+i*3,u+i*.2)}}
  const ax=b<1?92:b===1?tw(92,20,u,2):20,hx2=b<1?100:b===1?tw(100,32,u,2.2):32,walk=b===1;
  L.push({y:86,f:()=>{p2('abi',ax,86,t,ax<40?'d':'l',0,walk&&u<2);if(b<=1&&(b<1||u<2))boxAt(ax-4,58)}});L.push({y:87,f:()=>{p2('hunter',hx2,87,t,hx2<40?'d':'l',0,walk&&u<2.2);if(b<=1&&(b<1||u<2.2))boxAt(hx2-4,58)}});
  if(b>=1&&(b>1||u>2))L.push({y:92,f:()=>{boxAt(10,88);boxAt(16,90);boxAt(13,84)}});
  if(lv>=3)L.push({y:104,f:()=>gus2(lv===3&&b===2?tw(40,12,u,1.6):12,104,t,'r',b===2)});
  const cxp=b<3?94:b===3?tw(94,54,u,2):54;L.push({y:110,f:()=>crumpet(cxp,110,'l',t,b===3&&u<2?0:3,0)});
  L.push({y:98,f:()=>gcorgi(42,98,{c:'red',st:b===3&&u>2?'stand':'sit',t,dir:b===3?'r':'r',g:dGear(),tongue:b>=2})});castDraw(L);
  if(b===0){const k=u/1.6;if(k<1)for(let i=0;i<22;i++){const a=i*2.39,d=8+k*60*(.5+(i%5)/8);disc(Math.round(40+Math.cos(a)*d),Math.round(90+Math.sin(a)*d*.5),Math.round(8*(1-k)+2),'#efe8dc',.85*(1-k))}}
  if(b===4)hearts(42,84,u,3)})});
 const special={2:[{n:'Abigail',t:'Space heater: plugged in. Rubber mats: down. It’s official. We own a gym.',a:bt(K,2)}],3:[{n:'',t:'Coach Gus hangs his old photo back on the wall, right where it used to be.',a:bt(K,2)},{n:'Coach Gus',t:'There. Now it’s home.'}],
  4:[{n:'',t:'*clunk* ... *bzzzt* ... The big lights flicker on, one bank at a time.',a:bt(K,2,()=>snd('buzz'))},{n:'Hunter',t:'Abby. There’s a KITCHEN. And a POOL.'}],5:[{n:'',t:'The dome lights come up. Then the giant donut sign. Then the sprinkles.',a:bt(K,2,()=>snd('fanfare'))},{n:'Abigail',t:'Hunter. We built Donut a DOME.'}]}[lv]||[];
 const P=PERKS[lv];talk([{n:'',t:'*CRASH* *BANG* *drill noises* ... The dust settles. Moving day at '+G.n+'!',a:bt(K,0,()=>snd('whoosh'))},{n:'',t:'Hunter and Abigail carry in the boxes.',a:bt(K,1)}].concat(special,[
  {n:'Crumpet',t:'*inspects every corner* *picks a spot* *flops*',a:bt(K,3)},
  {n:S.fl.gus?'Coach Gus':'Abigail',t:'New gym, new perk. Pick one.',a:bt(K,4),c:P.map((p2,i)=>({l:p2[0]+': '+p2[1],f:()=>{S.perk=S.perk||{};S.perk[lv]=i;S.ap=apMax();save();toast('Perk: '+p2[0])}}))},
  {n:'',t:'Welcome to '+G.n+'! Donut’s stats can now reach '+G.cap+'.'}]),()=>{if(lv===5)fanMeet(()=>hub());else hub()},K.draw)}
const boxAt=(x,y)=>{r(x,y,8,6,'#c8945a');r(x,y,8,1,'#e0b070');r(x+3,y,2,6,'#a87440');r(x,y+5,8,1,'#a87440')};
/* the three superfans finally meet Donut */
const lvGus=()=>S.gym>=3&&S.fl.gus;
function fanMeet(then){const K=cutScr((C,u,t)=>{at2(()=>{homeBack(t);const b=C.b,L=[];const fx=b===0?tw(100,50,u,2.4):50,walk=b===0&&u<2.4;
  ['fan1','fan2','fan3'].forEach((k,i)=>{const x=fx+i*9,y=88+(i===1?2:0);L.push({y,f:()=>{ppl(k,x,y,t,b===0?'l':'l',walk);if(b>=2&&i===1&&u>.4){const d=Math.floor(t*6)%3;r(x-2,y-13+d,1,2,'#7ee8fa');r(x+2,y-13+((d+1)%3),1,2,'#7ee8fa')}}})});
  if(b<=1)L.push({y:91,f:()=>{const sx=fx-1,sy=60;r(sx+1,sy+9,1,10,'#8a6a4a');r(sx+26,sy+9,1,10,'#8a6a4a');r(sx-1,sy,30,10,'#fff6e0');r(sx-1,sy,30,1,'#ffd0e4');r(sx-1,sy+9,30,1,'#e8d8c0');heart(sx+2,sy+3,'#e0468c');ptxt('DONUT',sx+9,sy+3,'#e0468c')}});
  if(lvGus())L.push({y:104,f:()=>gus2(12,104,t,'r')});
  const dx=b>=2?tw(42,44,u,.4):42;L.push({y:98,f:()=>gcorgi(dx,98,{c:'red',st:b>=2?'stand':'sit',t,dir:'r',g:dGear(),tongue:1,jy:b>=2?Math.round(Math.abs(Math.sin(u*6))*2):0})});
  L.push({y:86,f:()=>p2('abi',20,86,t,'r')});L.push({y:87,f:()=>p2('hunter',32,87,t,'r')});castDraw(L);if(b===3&&u<.3){cx.globalAlpha=1-u/.3;r(0,0,80,156,'#ffffff');cx.globalAlpha=1}if(b>=2)hearts(58,66,u,4)})});
 talk([{n:'',t:'Three people in very, very large orange shirts are at the door. They’re holding a sign.',a:bt(K,0)},{n:'Superfan',t:'We’ve been to EVERY race. Since the dog park. Every. Single. One.',a:bt(K,1)},
  {n:'',t:'Donut walks right up to them. One of the superfans immediately starts crying.',a:bt(K,2)},{n:'Superfan',t:'Can we... can we get a picture?',a:bt(K,3,()=>snd('shutter'))},
  {n:'',t:'Best day of their lives. Donut gets +3 Charm, forever.',a:()=>{S.gb=S.gb||{};S.gb.cha=(S.gb.cha||0)+3;save()}}],then,K.draw)}

/* ---- things to tap in the gym, ribbons on the wall, and visiting rivals ---- */
const BELL=lv=>lv===5?[52,47]:lv===4?[58,38]:[46,50],BOWL=[76,101],SCB=lv=>lv===4?[3,30]:[27,44];
function hubExtras(t){const lv=S.gym;
 /* ribbons for every win */const RB=[0,0,[6,20,9,3,7],[30,38,6,2,5],[23,42,17,1,0],[3,29,7,2,5]][lv],n=lv>=2?Math.min(S.wins,RB[2]*RB[3]):0;for(let i=0;i<n;i++){const x=RB[0]+(i%RB[2])*3,y=RB[1]+Math.floor(i/RB[2])*RB[4];const c=['#2a6ad8','#d8352f','#ffd86b','#8be28b'][i%4];r(x,y,2,2,c);r(x,y+2,1,2,c);r(x+1,y+2,1,2,sh(c,.8))}
 /* water bowl */r(BOWL[0]-3,BOWL[1]-2,7,2,'#2a6ad8');r(BOWL[0]-3,BOWL[1]-2,7,1,'#7ab8e8');r(BOWL[0]-2,BOWL[1]-3,5,1,'#8ac8f0');
 /* zoomies bell */if(lv>=2){const [x,y]=BELL(lv),sw=HUBD.bell&&tm-HUBD.bell<.8?Math.round(Math.sin((tm-HUBD.bell)*30)*1):0;if(lv===4)r(x,y-14,1,11,'#5a5a6a');else{r(x-2,y-6,4,1,'#6a4a2a');r(x-2,y-7,1,2,'#6a4a2a');r(x,y-5,1,2,'#8a6a4a')}r(x-2+sw,y-3,5,4,'#ffd86b');r(x-2+sw,y-3,5,1,'#fff0b0');r(x+sw,y+1,1,1,'#c89a20')}
 /* scoreboard */if(lv>=4){const [x,y]=SCB(lv);if(lv===4){r(x+3,y-8,1,8,'#5a5a6a');r(x+18,y-8,1,8,'#5a5a6a')}r(x,y,22,10,'#141228');r(x,y,22,1,'#3a3460');const b=S.tt?Object.values(S.tt).filter(v=>v.b).map(v=>v.b).sort((a,c)=>a-c)[0]:null;ptxt(b?b.toFixed(1):'--.-',x+11,y+3,'#ffd86b',1,'c')}
 /* an outfit on display in the Dome */if(lv>=5){const body=S.own.filter(i=>GEAR[i]&&GEAR[i].sl==='body'&&i!==S.wear.body).slice(-1)[0];if(body){r(59,56,14,2,'#c8a060');gcorgi(66,56,{c:{b:'#c8c4d0',l:'#d8d4e0',d:'#a8a4b0',w:'#e8e4f0'},st:'stand',t:0,g:{body:GEAR[body].lk},dir:'r'})}}}
function visitors(){const B=beatenBosses();if(!B.length||S.gym<2)return [];let s=S.week*7+3;const pickN=()=>{s=(s*16807)%2147483647;return s};const out=[];const n=Math.min(1,B.length);const used={};
 for(let i=0;i<n;i++){let k=pickN()%B.length,tries=0;while(used[k]&&tries++<5)k=(k+1)%B.length;used[k]=1;out.push(B[k][0])}return out}
const VSPOT=[[62,88]];
function drawVisitors(t,L){visitors().forEach((id,i)=>{const B=BOSS[id],[x,y]=VSPOT[i];
 if(id==='loaf'&&S.eq.sta)L.push({y:77,f:()=>{gcorgi(52,79,{c:B.coat,st:'lie',g:{},sleep:1});r(44,77,16,2,'#8ac8f0')}});
 else L.push({y,f:()=>gcorgi(x,y,{c:B.coat,g:B.gear,st:id==='biscuit'||i===1?'lie':'sit',sleep:id==='biscuit',t,dir:'l'})})})}
function hubTapExtra(wx,wy){const lv=S.gym;
 if(Math.abs(wx-BOWL[0])<7&&Math.abs(wy-BOWL[1]+2)<6){HUBD.drink=tm;snd('splash');if(S.bowlW!==S.week){S.bowlW=S.week;S.mood=clamp(S.mood+2,0,100);save();toast('Slurp! +2 Mood');setTimeout(()=>{if(scr===HUB)hubUI()},1200)}else toast('Slurp!');return 1}
 if(lv>=2){const [x,y]=BELL(lv);if(Math.abs(wx-x)<6&&Math.abs(wy-y)<7){HUBD.bell=tm;HUBD.zt=tm+.2;snd('ding');setTimeout(()=>snd('whoosh'),200);return 1}}
 if(lv>=4){const [x,y]=SCB(lv);if(wx>x&&wx<x+22&&wy>y&&wy<y+10){snd('select');panTT();return 1}}
 const V=visitors();for(let i=0;i<V.length;i++){const [x,y]=VSPOT[i];if(Math.abs(wx-x)<10&&wy<y+3&&wy>y-14){const B=BOSS[V[i]];snd('pop');toast(B.n+(V[i]==='biscuit'?' is napping. Shh.':V[i]==='loaf'?' is hogging the pool.':' is training here today!'));return 1}}
 return 0}

/* ---- Garage: scrimmage, workout plan ---- */
function autoTrain(){const cap=capOf();let n=0;const before=Object.assign({},S.st);while(S.ap>0&&S.en>=15){const k=STATS.map(s=>s[0]).filter(k=>S.st[k]<cap).sort((a,b)=>S.st[a]-S.st[b])[0];if(!k)break;
  const m=EQM[S.eq[k]||0]*(.75+S.mood/250)*(.55+.45*Math.max(0,1-S.st[k]/120)),g=Math.max(0,Math.min(cap-S.st[k],Math.round(2.8*m*.62*10)/10));S.st[k]=Math.round((S.st[k]+g)*10)/10;S.ap--;S.en=clamp(S.en-14,0,100);S.mood=clamp(S.mood+(buddy()?4:-2),0,100);addXP(18+6.2);n++}
 save();const lines=STATS.filter(([k])=>S.st[k]>before[k]).map(([k,nm])=>'<b>+'+(S.st[k]-before[k]).toFixed(1)+' '+nm+'</b>');
 resultCard({title:n?'WORKOUT PLAN':'NOTHING TO TRAIN',stars:-1,lines:n?lines.concat(['+'+Math.round(n*24.2)+' XP']):['Out of actions, energy, or every stat is maxed.'],sub:n+' quick session'+(n===1?'':'s'),btn:'Back to the gym',then:()=>afterAny()})}

/* ---- Gus's Gym: scouting notebook, race-day plans, stories ---- */
function panScout(bid){const B=BOSS[bid],E=eff();let h='<img src="'+dogIcon(B.coat,B.gear,'b'+bid)+'" style="width:'+U(40)+';align-self:center;image-rendering:pixelated"><p class="sub">'+B.w+'</p>';
 h+='<div class="stats">'+STATS.map(([k,n,c],i)=>{const d=Math.floor(E[k]),o=B.st[i];return '<span>'+n+' <span style="float:right"><span style="color:'+(d>=o?'#8be28b':'#ff9a9a')+'">'+d+'</span> vs '+o+'</span><i><b style="width:'+clamp(o,0,100)+'%;--c:#8a7aa8"></b><s style="left:0;width:'+clamp(d,0,100)+'%;background:'+c+';opacity:.8"></s></i></span>'}).join('')+'</div>';
 const G=gaps(bid),tip={none:'Just run clean. She’s beatable.',closer:'He saves it all for the end. Get ahead early and stay there.',rocket:'She’ll blow you away at the start. Stay close, she fades.',tank:'Never slows down. You need raw Speed to pass.',nimble:'She never trips. You can’t either.',taunt:'He’ll bark mid-race. HOLD. Don’t look.',perfect:'No mistakes, ever. Out-train them.',surge:'Huge finish. Save your Zoomies for the last stretch.',snack:'He’ll stop for a croissant. That’s your window.',sand:'Sand Boots, or don’t bother.',royal:'The Royal Surge comes at 70%. Have Zoomies ready.'}[B.trait]||'';
 h+='<div class="card" style="display:block"><b style="font-weight:400;color:#8a5a2a">COACH GUS’S NOTES</b><small>'+tip+'</small></div>';
 if(S.gym>=4)h+='<div class="card" style="display:block"><b style="font-weight:400;color:#2a6ad8">SPORTS SCIENCE</b><small>Biggest gap: '+G[0].n+' ('+(G[0].d>0?'+':'')+G[0].d+'). Next: '+G[1].n+' ('+(G[1].d>0?'+':'')+G[1].d+').<br>'+(G[0].d>=0?'Donut is ahead everywhere. Go win it.':'Train '+G[0].n+' first.')+'</small></div>';
 panel('SCOUTING: '+B.n.toUpperCase(),B.h,h)}
function planPick(ev,go2){const d=el('<div class="pan fadein"><h2>GAME PLAN</h2><p class="sub">Coach Gus: "What’s the plan, kid?"</p>'+[['fast','Fast Start','Easier perfect start and +6% speed through the first fifth of the race'],['save','Save Stamina','Sprinting uses 25% less stamina all race'],['focus','Stay Focused','Ignore distractions 40% faster']].map(([k,n,dd])=>'<div class="card"><div class="bd">'+n+'<small>'+dd+'</small></div><button class="go" data-pl="'+k+'">PICK</button></div>').join('')+'<button class="tag pink" data-pl="" style="align-self:center;width:'+U(80)+'">No plan, just run</button></div>');
 ui.appendChild(d);d.querySelectorAll('[data-pl]').forEach(b=>b.onclick=()=>{snd('confirm');ev.plan=b.dataset.pl;d.remove();go2()})}
function gusStory(then){const i=(S.stories||0)%STORIES.length,[k,tx,end]=STORIES[i];S.stories=(S.stories||0)+1;S.storyW=S.week;S.gb=S.gb||{};S.gb[k]=(S.gb[k]||0)+2;save();
 talk([{n:'',t:'Coach Gus settles onto his favourite mat. Uh oh. Story time.'},{n:'Coach Gus',t:tx},{n:'Coach Gus',t:end},{n:'',t:'Donut was listening. Somehow. +2 '+SN[k][1]+', forever.'}],then,gymSc())}
/* ---- Pro Facility: the sponsor lounge's new sponsor ---- */
const speedSuit=(x,y,u)=>{r(x-5,y-3,10,7,'#2a6ad8');r(x-5,y-3,10,1,'#7ab8ff');r(x-7,y-3,2,3,'#2a6ad8');r(x+5,y-3,2,3,'#2a6ad8');r(x-2,y-2,2,2,'#ffd86b');r(x,y,2,2,'#ffd86b');r(x-1,y+1,1,2,'#ffd86b');glint(x+4,y-4,u)};
const lounge=()=>{r(60,88,20,3,'#6a3a5a');r(60,84,20,4,'#8a4a6a');r(60,84,20,1,'#a86a8a');r(60,84,2,7,'#6a3a5a');r(78,84,2,7,'#6a3a5a');r(63,91,1,2,'#3a2030');r(76,91,1,2,'#3a2030')},ltable=()=>{r(51,96,14,2,'#c8a060');r(51,96,14,1,'#e0c080');r(52,98,1,3,'#8a6a40');r(63,98,1,3,'#8a6a40')};
function loungeOffer(then){S.fl.speedy=1;save();let dec=0;const K=cutScr((C,u,t)=>{at2(()=>{homeBack(t);const b=C.b,L=[];L.push({y:91,f:lounge});L.push({y:97.5,f:ltable});
  const vx=b===0?tw(100,72,u,2.4):b>=4&&dec?tw(72,100,u,2.4,.4):72,vy=99,walk=(b===0&&u<2.4)||(b>=4&&dec&&u>.4);
  const open=b>=1?ez(Math.min(1,u/.6)):0,onTable=b>=1&&!(b>=4&&dec&&u>.4);
  L.push({y:vy,f:()=>{ppl('viv',vx,vy,t,b>=4&&dec?'r':'l',walk);if(!onTable)r(Math.round(vx)-8,vy-10,6,4,'#3a2a20')}});
  if(onTable)L.push({y:97.6,f:()=>{r(54,92,8,4,'#3a2a20');r(57,91,2,1,'#c8a060');if(b>=1){const lh=Math.round(4*(b<2?open:1));r(54,92-lh,8,lh,'#3a2a20');if(lh>2)r(55,93-lh,6,lh-2,'#a87a8a');r(55,92,6,1,'#ffd86b')}}});
  if(b>=1&&b<3){const k=b===1?ez(Math.min(1,Math.max(0,(u-.5)/.8))):1;speedSuit(58,Math.round(89-k*9),u)}
  if(b===3&&!dec&&u<.8){const k=ez(u/.8);speedSuit(Math.round(58+(40-58)*k),Math.round(80+(90-80)*k-Math.sin(k*Math.PI)*8),u)}
  L.push({y:86,f:()=>p2('abi',20,86,t,'r')});L.push({y:87,f:()=>p2('hunter',32,87,t,'r')});
  const worn=b>=3&&!dec&&(b>3||u>.8);L.push({y:98,f:()=>gcorgi(40,98,{c:'red',st:b>=2?'stand':'sit',t,dir:'r',g:worn?Object.assign(dGear(),{body:'silkB'}):dGear(),tongue:b>=2&&!dec})});
  castDraw(L);if(b===2)for(let i=0;i<3;i++)glint(24+i*6,60,u+i*.3);if(worn){glint(46,86,u);hearts(40,80,u,3)}})});
 talk([{n:'',t:'The sponsor lounge has its first visitor. Vivian, of course. With a briefcase.',a:bt(K,0)},
  {n:'Vivian',t:'Speedy Paws Athletic. The real deal. Inside: one proper racing suit.',a:bt(K,1,()=>snd('item'))},
  {n:'Vivian',t:fmt$(SPON.speedy.pay)+' a week (before lounge bonuses). Donut wears the suit for full pay.',a:bt(K,2)},
  {n:'Abigail',t:'(No neon. No humming. It’s actually... nice?)',c:[{l:'Sign the deal',f:()=>{signSpon('speedy');bt(K,3)()}},{l:'No thanks',f:()=>{dec=1;bt(K,4)()}}]},
  {n:'',get t(){return dec?'Vivian snaps the briefcase shut. “Your loss, darling.”':'Donut models the suit. Vivian is, for once, speechless.'}}],then,K.draw)}

/* ---- time trials ---- */
/* medal times calibrated by autopilot: gold ~ stats in the 90s, silver ~75, bronze ~58 */const TTT={park:[15.2,16.3,18.3],market:[15.8,17.5,19.3],brewery:[15.6,17.3,19.6],funrun:[17.3,19.5,21.0],ballpark:[19.8,21.1,23.3],fair:[19.6,22.8,24.7],college:[20.0,23.5,24.5],boardwalk:[20.9,22.6,25.8],nfl:[22.7,24.7,28.3],kc:[24.6,26.5,30.4],showcase:[22.2,24.8,28.0],vegas:[24.3,27.0,31.2],london:[24.9,27.6,31.6],tokyo:[26.4,28.8,33.0],paris:[26.1,28.8,33.1],sydney:[27.8,31.3,36.0],final:[29.4,34.5,38.5]};
const TTM=v=>TTT[v]||(L=>[L/88,L/80,L/72])(VEN[v].len);
function panTT(){if(S.gym<4){toast('Time trials open with the Pro Facility');return}S.tt=S.tt||{};let h='<p class="sub">Race any track alone against Donut’s ghost. Beat the times for medals. Doesn’t use your race for the week (-10 Energy).</p>';
 LG.forEach((l,li)=>{if(li>S.lg)return;h+='<p class="hd">'+l.n.toUpperCase()+'</p>';l.ev.concat(l.boss.map(b=>b[1])).filter((v,i,a)=>a.indexOf(v)===i).forEach(v=>{const T=S.tt[v]||{},M=TTM(v),md=T.m||0;
  h+='<div class="card"><img class="ic" src="'+venueIcon(v)+'"><div class="bd">'+VEN[v].n+'<small>'+(T.b?'Best '+T.b.toFixed(2)+'s':'No run yet')+(md?' &middot; '+['','BRONZE','SILVER','GOLD'][md]:'')+'<br>Gold '+M[0].toFixed(1)+' &middot; Silver '+M[1].toFixed(1)+' &middot; Bronze '+M[2].toFixed(1)+'</small></div><button class="go" data-tt="'+v+'"'+(S.en<10?' disabled':'')+'>RUN</button></div>'})});
 panel('TIME TRIALS','Pro Facility',h,p=>p.querySelectorAll('[data-tt]').forEach(b=>b.onclick=()=>{snd('confirm');go(raceScreen({ven:b.dataset.tt,tt:1}))}))}
/* ---- the Donut Cup ---- */
const CUP=[['kc',['waddles','tina','pepper']],['nfl',['chad','duchess','comet']],['final',['kenji','matilda','fluff']]];
function panCup(){S.cup=S.cup||{r:0,won:0};const C=S.cup,blocked=S.raced||S.fl.rest;let h='<p class="sub">Three heats against the bosses. Finish in the top 2 to move on. Win the final for '+fmt$(100000)+' and the Donut Cup. Each heat uses your race for the week. Finish 3rd or worse and you start over.</p>';
 if(C.won)h+='<p class="sub" style="color:#ffd86b">Donut Cup champion &times;'+C.won+'</p>';
 CUP.forEach(([v,f],i)=>{const st=i<C.r?'Cleared &#10003;':i===C.r?'Next heat':'Locked';h+='<div class="card'+(i===C.r?' boss':i<C.r?'':' dim')+'" style="display:block"><b style="font-weight:400">'+['HEAT 1','SEMI-FINAL','THE FINAL'][i]+'</b> <span style="float:right;font-size:.8em">'+st+'</span><small>'+VEN[v].n+'<br>'+f.map(b=>BOSS[b].n).join(' &middot; ')+'</small></div>'});
 h+='<button class="tag" data-cup="1" style="align-self:center;width:'+U(90)+'"'+(blocked?' disabled':'')+'>'+(blocked?'Raced this week':'Race '+['heat 1','the semi-final','THE FINAL'][C.r])+'</button>';
 panel('THE DONUT CUP','Donut Dome',h,p=>{const b=p.querySelector('[data-cup]');if(b)b.onclick=()=>{snd('confirm');const [v,f]=CUP[C.r];startRace({ven:v,field:f.slice(),cup:1})}})}
/* ---- the wardrobe ---- */
const TINTS=[null,'#d8352f','#ff7eb6','#ffd86b','#3aa84a','#2a6ad8','#7a2fe0','#1e1e24','#f6efe8'];
function panWardrobe(){S.tint=S.tint||{};let h='<img src="'+bigDonut()+'" style="width:'+U(64)+';align-self:center;image-rendering:pixelated"><p class="sub">Recolour Donut’s gear. Works on bandanas, silks, capes, booties and sweatbands.</p>';
 [['head','Head'],['body','Body'],['paws','Paws']].forEach(([s,n])=>{h+='<p class="hd">'+n.toUpperCase()+'</p><div class="row" style="justify-content:flex-start">'+TINTS.map((c,i)=>'<button class="chip'+((S.tint[s]||null)===c?' on':'')+'" data-ts="'+s+'" data-tc="'+i+'" style="min-width:'+U(9)+';'+(c?'background:'+c+';':'')+'">'+(c?'&nbsp;':'Default')+'</button>').join('')+'</div>'});
 const p=panel('WARDROBE','Donut Dome',h,p=>p.querySelectorAll('[data-ts]').forEach(b=>b.onclick=()=>{const s=b.dataset.ts,c=TINTS[+b.dataset.tc];if(c)S.tint[s]=c;else delete S.tint[s];snd('item');save();refresh(p,panWardrobe)}));return p}
/* ---------------- progression ---------------- */
const xpNeed=lv=>40+lv*18;
function addXP(n){S.xp+=Math.round(n*(perk(3,1)?1.15:1));const ups=[];while(S.lv<50&&S.xp>=xpNeed(S.lv)){S.xp-=xpNeed(S.lv);S.lv++;S.sp++;STATS.forEach(([k])=>S.st[k]=Math.max(S.st[k],Math.min(capOf(),S.st[k]+1)));ups.push(S.lv)}return ups}
const apMax=()=>3+(S.gym>=4?1:0)+(perk(5,0)?1:0);const pool=()=>S.gym>=4;const buddy=()=>S.gym>=2;const drillOK=()=>S.gym>=3&&S.drillW!==S.week;
const spa$=()=>[40,250,1500,6000][S.lg];
function trainDone(k,perf,quick,drill){const before=S.st[k],cap=capOf(),m=EQM[S.eq[k]||0]*(.75+S.mood/250)*(.55+.45*Math.max(0,1-S.st[k]/120))*(drill?2:1);
 const g=Math.max(0,Math.min(cap-S.st[k],Math.round(2.8*m*perf*10)/10));S.st[k]=Math.round((S.st[k]+g)*10)/10;S.ap--;S.en=clamp(S.en-(quick?14:18),0,100);S.mood=clamp(S.mood+(buddy()?4:-(quick?2:3)),0,100);if(drill)S.drillW=S.week;
 const ups=addXP(18+perf*10);save();const lines=['<b>+'+g.toFixed(1)+' '+SN[k][1]+'</b>'+(drill?' <em>(DRILL x2)</em>':''),'+'+Math.round(18+perf*10)+' XP'];if(buddy())lines.push('+4 Mood (training with Crumpet)');
 if(S.st[k]>=cap)lines.push('<em>'+SN[k][1]+' is maxed for '+GYM[S.gym].n+'</em>'+(GYM[S.gym+1]?'<br>Upgrade the gym to go higher':''));if(ups.length)lines.push('<em>LEVEL UP! Lv '+S.lv+'</em><br>+1 skill point &middot; +1 to every stat (up to '+cap+')');
 resultCard({title:quick?'QUICK SESSION':perf>=1.2?'AMAZING!':perf>=.9?'GREAT SESSION!':perf>=.6?'NICE WORK':'TOUGH ONE',stars:quick?0:perf>=1.2?3:perf>=.8?2:1,lines,sub:SN[k][1]+' '+Math.floor(before)+' &rarr; '+Math.floor(S.st[k]),btn:'Back to the gym',then:()=>afterAny()})}
function raceDone(ev,pl,time,riv){const L=LG[S.lg],boss=ev.boss,V=VEN[ev.ven];
 if(ev.scrim){S.scrimW=S.week;const ups=addXP(30);S.mood=clamp(S.mood+5,0,100);S.en=clamp(S.en-10,0,100);S.buff=null;save();
  resultCard({title:pl===1?'DONUT WINS!':'CRUMPET WINS?!',stars:pl===1?2:1,lines:['+30 XP','+5 Mood'].concat(ups.length?['<em>LEVEL UP! Lv '+S.lv+'</em>']:[]),sub:'Scrimmage with Crumpet &middot; '+time.toFixed(2)+'s',btn:'Back to the gym',then:()=>afterAny()});return}
 if(ev.tt){S.tt=S.tt||{};const T=S.tt[ev.ven]||{},M=TTM(ev.ven),m=time<=M[0]?3:time<=M[1]?2:time<=M[2]?1:0,old=T.m||0,pb=!T.b||time<T.b;let cash=0;for(let q=old+1;q<=m;q++)cash+=[0,500,1500,4000][q];
  S.tt[ev.ven]={b:pb?Math.round(time*100)/100:T.b,g:pb?(ev.rec||[]):T.g,m:Math.max(old,m)};S.money+=cash;const ups=addXP(20);S.en=clamp(S.en-10,0,100);S.buff=null;save();
  resultCard({title:m===3?'GOLD!':m===2?'SILVER!':m===1?'BRONZE':'NO MEDAL',stars:m,lines:[time.toFixed(2)+'s'+(pb?' <em>NEW BEST</em>':' (best '+T.b.toFixed(2)+'s)')].concat(cash?['<b>+'+fmt$(cash)+'</b> medal bonus']:[]).concat(['+20 XP'],ups.length?['<em>LEVEL UP! Lv '+S.lv+'</em>']:[]),sub:'Time trial &middot; '+VEN[ev.ven].n,btn:'Back to the gym',then:()=>afterAny()});return}
 if(ev.cup){S.raced=1;S.cup=S.cup||{r:0,won:0};const C=S.cup,ups=addXP(L.xp);S.en=clamp(S.en-28,0,100);S.buff=null;let title,lines=['+'+L.xp+' XP'],adv=pl<=2;
  if(adv){C.r++;if(C.r>=3){C.r=0;C.won=(C.won||0)+1;S.money+=100000;if(!S.own.includes('cupT'))S.own.push('cupT');title='DONUT CUP CHAMPION!';lines.unshift('<b>+'+fmt$(100000)+'</b>','Trophy: <em>The Donut Cup</em>')}else{title=ORD[pl-1]+': ON TO THE '+(C.r===1?'SEMIS':'FINAL');lines.unshift('Next week: '+['','the semi-final','THE FINAL'][C.r])}}
  else{C.r=0;title='KNOCKED OUT';lines.unshift('Finished '+ORD[pl-1]+'. The Cup starts over next week.')}if(ups.length)lines.push('<em>LEVEL UP! Lv '+S.lv+'</em>');S.mood=clamp(S.mood+(adv?10:-4),0,100);save();
  resultCard({title,stars:[3,2,1,0][pl-1],lines,sub:'The Donut Cup &middot; '+VEN[ev.ven].n+' &middot; '+time.toFixed(2)+'s',btn:'Continue',then:()=>afterAny()});return}
 if(ev.exhib){const lgB=LG.findIndex(l=>l.boss.some(b=>b[0]===boss)),LB=LG[Math.max(0,lgB)],purse=Math.round(LB.boss$*.25*[1,.5,.25,.1][pl-1]*purseMul()),xp=Math.round(LB.xp*.5*[1,.75,.55,.4][pl-1]);S.money+=purse;const ups=addXP(xp);S.en=clamp(S.en-15,0,100);S.mood=clamp(S.mood+(pl===1?8:0),0,100);S.buff=null;save();
  resultCard({title:pl===1?'REMATCH WON!':ORD[pl-1]+' PLACE',stars:[3,2,1,0][pl-1],lines:['<b>+'+fmt$(purse)+'</b> exhibition purse','+'+xp+' XP'].concat(ups.length?['<em>LEVEL UP! Lv '+S.lv+'</em>']:[]),sub:'Exhibition &middot; '+BOSS[boss].n+' &middot; '+time.toFixed(2)+'s',btn:'Back to the gym',then:()=>afterAny()});return}S.races++;S.raced=1;S.buff=null;
 let purse=Math.round((boss?L.boss$:L.purse)*[1,.5,.25,.1][pl-1]*(hasSk('fan')?1.2:1)*purseMul());S.money+=purse;
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
const HP0={abi:[20,86],hun:[32,87],gus:[12,104],dn:[42,98],cr:[54,110]},HUBPOS={1:HP0,d:HP0};
function hubScene(t,cast){at2(()=>{cx.translate(0,-12);const lv=S.gym,P=HUBPOS[lv===1?1:'d'];gymBg(lv,t);equip2(lv,t);hubExtras(t);const L=[];drawVisitors(t,L);
 L.push({y:P.abi[1],f:()=>ppl2('abi',P.abi[0],P.abi[1],t,'d')});L.push({y:P.hun[1],f:()=>ppl2('hunter',P.hun[0],P.hun[1],t,'d')});
 if(S.fl.gus)L.push({y:P.gus[1],f:()=>gus2(P.gus[0],P.gus[1],t,'r',cast&&cast.gusTalk)});
 const z=tm-HUBD.zt;if(z<1.6){const a=z/1.6*Math.PI*2,x=P.dn[0]+Math.cos(a)*18,y=P.dn[1]+Math.sin(a)*4;L.push({y,f:()=>gcorgi(x,y,{c:'red',st:'run',t:tm,dir:-Math.sin(a)>0?'r':'l',g:dGear()})})}
 else if(HUBD.drink&&tm-HUBD.drink<2.6){const k=tm-HUBD.drink,go2=k<.8?k/.8:k<1.8?1:1-(k-1.8)/.8,x=P.dn[0]+(BOWL[0]-9-P.dn[0])*ez(go2),y=P.dn[1]+(BOWL[1]-P.dn[1])*ez(go2),moving=k<.8||k>1.8;L.push({y,f:()=>gcorgi(x,y,{c:'red',st:moving?'run':'stand',t:tm,dir:k>1.8?'l':'r',g:dGear(),tongue:!moving})})}
 else L.push({y:P.dn[1],f:()=>gcorgi(P.dn[0],P.dn[1],{c:'red',st:Math.floor(t/5)%3===2?'stand':'sit',t,dir:'r',g:dGear(),tongue:Math.floor(t*1.3)%4<2})});
 const c=tm-HUBD.ct;L.push({y:P.cr[1],f:()=>crumpet(P.cr[0],P.cr[1],'l',t,c<.8?1:3,0)});
 L.sort((a,b)=>a.y-b.y).forEach(q=>q.f())})}
const HUB={enter(){MUS='crzHub'},ui(){hubUI()},
 tap(x,y){const P=HUBPOS[S.gym===1?1:'d'],wx=x/2,wy=y/2+12;if(hubTapExtra(wx,wy))return;if(Math.abs(wx-P.dn[0])<9&&wy<P.dn[1]+3&&wy>P.dn[1]-16){HUBD.zt=tm;snd('whoosh')}else if(Math.abs(wx-P.cr[0])<11&&wy<P.cr[1]+3&&wy>P.cr[1]-14){HUBD.ct=tm;snd('pop')}},
 draw(t){hubScene(t)}};
function hub(){go(HUB)}
function bar(lbl,v,c){return '<div class="mtr">'+lbl+'<i><b style="width:calc('+clamp(v,0,100)+'% - var(--u)*.8);--c:'+c+'"></b></i></div>'}
function hubUI(){const L=LG[S.lg],ap=apMax();ui.innerHTML='';
 const top=el('<div class="top"><div class="r1"><span style="display:flex;gap:var(--u)"><button class="xbtn" style="position:static">&#10005; Exit</button><button class="xbtn hbtn" style="position:static">?</button></span><span class="lg">WEEK '+S.week+' &middot; '+L.s+'</span><span class="mo">'+fmt$(S.money)+'</span></div>'+
  '<div class="meters">'+bar('ENERGY '+Math.round(S.en),S.en,S.en>30?'#8be28b':'#ff7e7e')+bar('MOOD '+Math.round(S.mood),S.mood,'#ff9ccb')+bar('LV '+S.lv,S.xp/xpNeed(S.lv)*100,'#ffd86b')+'</div>'+
  '<div class="aps">ACTIONS '+Array.from({length:ap},(_,i)=>'<span style="display:inline-block;width:'+U(2.6)+';height:'+U(2.6)+';border-radius:50%;background:'+(i<S.ap?'#ffd86b':'#3a2e5a')+'"></span>').join('')+'<span style="margin-left:auto">'+(S.lg===3?'WORLD RANK #'+rankOf():'')+'</span></div></div>');
 ui.appendChild(top);top.querySelector('.xbtn').onclick=()=>{snd('select');close()};top.querySelector('.hbtn').onclick=()=>{snd('select');panHelp()};
 const nxt=nextBoss(),rc=S.raced?'Raced this week':S.fl.rest?'Resting this week':nxt&&nxt.ok?'Boss race ready: '+BOSS[nxt.b].n:'Pick a race';
 const dock=el('<div class="dock"><button class="tile big" data-a="race">RACE DAY<small>'+rc+'</small></button>'+
  '<button class="tile" data-a="train">TRAIN<small>'+S.ap+' action'+(S.ap==1?'':'s')+' left</small></button><button class="tile" data-a="care">REST &amp; GIGS<small>Nap, play, earn</small></button>'+
  '<button class="tile" data-a="shop">SHOP<small>Gear, treats, equipment</small></button><button class="tile" data-a="gear">DONUT<small>Stats &amp; outfit</small></button>'+
  '<button class="tile" data-a="skill">SKILLS<small>Level '+S.lv+'</small>'+(S.sp?'<span class="bdg">'+S.sp+'</span>':'')+'</button><button class="tile" data-a="gym">GYM<small>'+GYM[S.gym].n+'</small></button>'+
  '<button class="tag pink" data-a="week" style="grid-column:1/3;justify-self:center;width:'+U(96)+'">End week &#9656;<small>Rest up, get paid, new week</small></button></div>');
 ui.appendChild(dock);dock.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{snd('select');({race:panRace,train:panTrain,care:panCare,shop:panShop,gear:panGear,skill:panSkill,gym:panGym,week:endWeek})[b.dataset.a]()});clearTimeout(hubUI.tt);hubUI.tt=setTimeout(tutCheck,450)}
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
  h+='<div class="card boss'+(done||ok?'':' dim')+'"><img class="ic" src="'+dogIcon(B.coat,B.gear,'b'+b[0])+'"><div class="bd">'+B.n+'<small>'+VEN[b[1]].n+'<br>'+(done?'Beaten &#10003;':cur?(ok?B.w:req+(S.lg<3?' ('+S.lp+' now)':' (#'+rankOf()+' now)')):'Locked')+'</small></div>'+(S.gym>=3?'<button class="go" style="background:#8a5a2a" data-sct="'+b[0]+'">SCOUT</button>':'')+(done?'':'<button class="go" data-b="'+i+'"'+(ok&&!blocked?'':' disabled')+'>RACE</button>')+'</div>'});
 if(S.gym>=2){const done=S.scrimW===S.week;h+='<p class="hd">PRACTICE</p><div class="card"><div class="bd">Scrimmage with Crumpet<small>Once a week. Doesn’t use your race. +30 XP, +5 Mood</small></div><button class="go" data-sc="1"'+(done||S.en<10?' disabled':'')+'>'+(done?'DONE':'GO')+'</button></div>'}
 if(S.gym>=4)h+='<div class="card"><div class="bd">Time trials<small>Race Donut’s ghost for medals</small></div><button class="go" data-ttp="1">OPEN</button></div>';
 if(S.gym>=5)h+='<div class="card boss"><div class="bd">THE DONUT CUP<small>'+(S.cup&&S.cup.r?'In progress: '+['','semi-final next','FINAL next'][S.cup.r]:'Three heats against the bosses. '+fmt$(100000)+' to the winner.')+'</small></div><button class="go" data-cupp="1">OPEN</button></div>';
 if(S.gym>=5){const beat=[];LG.forEach((l,li)=>l.boss.forEach((b,bi)=>{if(li<S.lg||(li===S.lg&&bi<S.boss)||S.fl.champ)beat.push(b)}));if(beat.length){h+='<p class="hd">REMATCHES &middot; DONUT DOME</p><p class="sub" style="text-align:left">Exhibition races: they don’t use your race for the week.</p>';
  beat.forEach(b=>{const B=BOSS[b[0]];h+='<div class="card"><img class="ic" src="'+dogIcon(B.coat,B.gear,'b'+b[0])+'"><div class="bd">'+B.n+'<small>'+VEN[b[1]].n+'</small></div><button class="go" data-x="'+b[0]+'|'+b[1]+'"'+(S.en<15?' disabled':'')+'>REMATCH</button></div>'})}}
 h+='<p class="hd">CIRCUIT RACES &middot; '+fmt$(L.purse)+' TO WIN</p>';L.ev.forEach(v=>{const V=VEN[v],b=S.best[v];h+='<div class="card"><img class="ic" src="'+venueIcon(v)+'"><div class="bd">'+V.n+'<small>'+(V.relay?'Relay with Crumpet! ':'')+'3 rivals'+(b?' &middot; Best: '+ORD[b-1]:'')+'</small></div><button class="go" data-v="'+v+'"'+(blocked?' disabled':'')+'>RACE</button></div>'});
 panel(L.n.toUpperCase(),S.lg===3?'World rank #'+rankOf():'League points: '+S.lp,h,p=>{p.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{snd('confirm');startRace({ven:b.dataset.v})});
  p.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{snd('confirm');const x=L.boss[+b.dataset.b];startRace({ven:x[1],boss:x[0]})});
  p.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{snd('confirm');const [bo,ve]=b.dataset.x.split('|');startRace({ven:ve,boss:bo,exhib:1})});
  p.querySelectorAll('[data-sct]').forEach(b=>b.onclick=()=>{snd('select');panScout(b.dataset.sct)});const sc=p.querySelector('[data-sc]');if(sc)sc.onclick=()=>{snd('confirm');go(raceScreen({ven:'park',scrim:1}))};
  const tt=p.querySelector('[data-ttp]');if(tt)tt.onclick=()=>{snd('select');p.remove();panTT()};const cu=p.querySelector('[data-cupp]');if(cu)cu.onclick=()=>{snd('select');p.remove();panCup()}})}
function venueIcon(v){return icon('v'+v,()=>{const A=venueArt(v);bg2(A,v)},28,22)}
function bg2(A,v){cx.drawImage(A.sky,0,-40);cx.drawImage(A.mid[0],-20,-122);cx.drawImage(A.gr,0,14)}
function startRace(ev){const run=()=>{if(ev.boss)preBoss(ev,()=>go(raceScreen(ev)));else go(raceScreen(ev))};if(S.gym>=3&&!ev.tt&&!ev.scrim&&!ev.tut)planPick(ev,run);else run()}

/* training */
function panTrain(){const cap=capOf();let h='<p class="sub">Actions left this week: '+S.ap+' &middot; Energy '+Math.round(S.en)+'<br>'+GYM[S.gym].n+': stats can reach <span style="color:#ffd86b">'+cap+'</span></p>';const can=S.ap>0&&S.en>=15,dr=drillOK();
 if(dr)h+='<div class="card boss" style="display:block"><b style="font-weight:400;color:#c2417a">COACH GUS’S WEEKLY DRILL</b><small>Tap DRILL on any workout: a tougher version for DOUBLE gains. Once a week.</small></div>';
 if(buddy())h+='<p class="sub" style="color:#ff9ccb">Crumpet is training with Donut: workouts give +4 Mood.</p><button class="tag" data-auto="1" style="align-self:center;width:'+U(96)+'"'+(can?'':' disabled')+'>Workout plan<small>Quick-train all '+S.ap+' actions on her lowest stats</small></button>';
 const nb=S.gym>=4&&nextBossId(),G0=nb?gaps(nb)[0]:null;if(G0&&G0.d<0)h+='<p class="sub" style="color:#7ee8fa">Sports scientist: train <b style="font-weight:400;color:#ffd86b">'+G0.n+'</b> next (vs '+BOSS[nb].n+': '+G0.d+')</p>';
 if(!S.ap)h+='<p class="sub" style="color:#ff9ccb">No actions left. End the week to keep training.</p>';else if(S.en<15)h+='<p class="sub" style="color:#ff7e7e">Donut is too tired to train. Rest first.</p>';
 TR.forEach(([k,n,d])=>{const t=S.eq[k]||0,mx=S.st[k]>=cap,lock=k==='cha'&&S.gym<5,ok=can&&!mx;
  h+='<div class="card'+(mx?' dim':'')+'"><img class="ic" src="'+trainIcon(k)+'"><div class="bd">'+n+'<small>'+SN[k][1]+' <span style="color:'+(mx?'#c2417a':'inherit')+'">'+Math.floor(S.st[k])+' / '+cap+(mx?' MAXED':'')+'</span>'+(t?' &middot; '+EQ[k][t-1]:'')+'<br>'+(mx?(GYM[S.gym+1]?'Upgrade to '+GYM[S.gym+1].n+' to go higher':'At the very top!'):lock?'Photo Shoot opens with the Donut Dome. Quick sessions only for now.':d)+'</small></div><div style="display:flex;flex-direction:column;gap:'+U(1.4)+'">'+
  (lock?'':'<button class="go" data-p="'+k+'"'+(ok?'':' disabled')+'>PLAY</button>')+(dr&&!lock?'<button class="go" style="background:#e8a020" data-d="'+k+'"'+(ok?'':' disabled')+'>DRILL</button>':'')+'<button class="go" style="background:#8a7aa8" data-q="'+k+'"'+(ok?'':' disabled')+'>QUICK</button></div></div>'});
 h+='<p class="sub">QUICK skips the minigame for a smaller gain.</p>';
 panel('TRAINING',null,h,p=>{const au=p.querySelector('[data-auto]');if(au)au.onclick=()=>{snd('confirm');p.remove();autoTrain()};p.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{snd('confirm');go(mgShell(MGS[b.dataset.p]))});p.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{snd('confirm');go(mgShell(MGS[b.dataset.d],1))});p.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{snd('confirm');p.remove();trainDone(b.dataset.q,.62,1)})})}
function trainIcon(k){return icon('t'+k,()=>{r(0,0,28,22,SN[k][2]);r(0,0,28,1,sh(SN[k][2],1.2));r(0,21,28,1,sh(SN[k][2],.8));const st={spd:'run',acc:'run',sta:'swim',agi:'jump',foc:'sit',cha:'sit'}[k];rdog(st==='sit'?14:12,19,{c:'red',st,ph:1,nt:1,jy:k==='agi'?2:0})},28,22)}

/* rest, play and side gigs */
function panCare(){const can=S.ap>0;let h='<p class="sub">Actions left: '+S.ap+'</p>';
 const card=(id,n,d,btn,dis)=>'<div class="card"><div class="bd">'+n+'<small>'+d+'</small></div><button class="go" data-c="'+id+'"'+(dis?' disabled':'')+'>'+btn+'</button></div>';
 const NP=pool()?60:40,SP=pool()?50:35;h+=card('nap','Nap on the couch','+'+NP+' Energy &middot; 1 action'+(pool()?' &middot; Recovery Pool bonus':''),'NAP',!can)+card('play','Play with Crumpet','+25 Mood, +10 Energy &middot; 1 action','PLAY',!can)+card('spa','Spa day','+'+SP+' Energy, +'+SP+' Mood &middot; no action &middot; '+fmt$(spa$()),'BOOK',S.money<spa$());
 if(S.gym>=4)h+=card('kitchen','The Nutrition Kitchen','Cook a race-day meal &middot; no action','COOK',0);
 h+='<p class="hd">SIDE GIGS &middot; 1 action, -15 energy</p>';GIGS.filter(g=>g[0]<=S.lg).forEach((g,i)=>{const pay=Math.round(g[2]*(hasSk('magnet')?1.3:1)),ok=eff().cha>=g[3];h+=card('g'+GIGS.indexOf(g),g[1],(ok?'Pays '+fmt$(pay)+' &middot; +1 Charm':'Needs '+g[3]+' Charm'),'GO',!can||!ok||S.en<15)});
 const p=panel('REST &amp; GIGS',null,h,p=>p.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const c=b.dataset.c;snd('coin');
  const back=()=>{hub();panCare();checkGifts()};
  if(c==='kitchen'){p.remove();panKitchen();return}
  if(c==='nap'){const NP=pool()?60:40;S.ap--;S.en=clamp(S.en+NP,0,100);save();vignette('nap',{lines:['+'+NP+' ENERGY']},back)}
  else if(c==='play'){S.ap--;S.mood=clamp(S.mood+25,0,100);S.en=clamp(S.en+10,0,100);S.fl.plays=(S.fl.plays||0)+1;save();vignette('play',{lines:['+25 MOOD','+10 ENERGY']},back)}
  else if(c==='spa'){const SP=pool()?50:35,pr=spa$();S.money-=pr;S.en=clamp(S.en+SP,0,100);S.mood=clamp(S.mood+SP,0,100);save();vignette('spa',{lines:['+'+SP+' ENERGY','+'+SP+' MOOD','-'+fmt$(pr)]},back)}
  else{const gi=+c.slice(1),g=GIGS[gi],pay=Math.round(g[2]*(hasSk('magnet')?1.3:1));S.ap--;S.en=clamp(S.en-15,0,100);S.money+=pay;S.st.cha=Math.max(S.st.cha,Math.min(capOf(),S.st.cha+1));S.mood=clamp(S.mood+5,0,100);save();
   vignette('gig',{gig:gi,title:g[1].toUpperCase().replace(/’/g,''),lines:['+'+fmt$(pay),'+1 CHARM','+5 MOOD','-15 ENERGY']},back)}}))}

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
  p.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const k=b.dataset.r,T2=TREAT[k];S.money-=Math.round(T2.p*(1+S.lg*1.5));if(T2.f)T2.f();if(T2.buff){S.buff=S.buff||{};for(const q in T2.buff)S.buff[q]=(S.buff[q]||0)+T2.buff[q]}save();vignette('snack',{title:T2.n.toUpperCase(),lines:[T2.d.toUpperCase().replace(/^IN YOUR NEXT RACE/,'')]},()=>{hub();panShop()})})});return p}

/* Donut: stats and outfit */
function panGear(){const E=eff();let h='<img src="'+bigDonut()+'" style="width:'+U(64)+';align-self:center;image-rendering:pixelated">';
 h+='<div class="stats">'+STATS.map(([k,n,c])=>{const b=Math.floor(S.st[k]),e=Math.floor(E[k]);return '<span>'+n+' <span style="float:right;color:'+c+'">'+e+(e!==b?'<small style="font-size:.8em;color:#8be28b"> +'+(e-b)+'</small>':'')+'</span><i><b style="width:'+clamp(b,0,100)+'%;--c:'+c+'"></b>'+(e>b?'<s style="left:'+clamp(b,0,100)+'%;width:'+clamp(e-b,0,100-b)+'%"></s>':'')+'</i></span>'}).join('')+'</div>';
 SLOTS.forEach(([s,n])=>{const L=S.own.filter(id=>GEAR[id]&&GEAR[id].sl===s);h+='<p class="hd">'+n.toUpperCase()+'</p><div class="row" style="justify-content:flex-start">'+(L.length?'':'<span class="sub">Nothing yet</span>')+L.map(id=>'<button class="chip'+(S.wear[s]===id?' on':'')+'" data-w="'+id+'">'+GEAR[id].n+'</button>').join('')+'</div>'});
 if(S.spon){const P=SPON[S.spon],w=S.wear[GEAR[P.it].sl]===P.it;h+='<p class="sub" style="margin-top:'+U(2)+'">Sponsor: '+P.n+' &middot; '+(w?'wearing their gear (full pay)':'<span style="color:#ff9ccb">wear their gear for full pay</span>')+'</p>'}
 if(S.gym>=5)h+='<button class="tag" data-wd="1" style="align-self:center;width:'+U(90)+';margin-top:'+U(2)+'">Open the wardrobe</button>';
 const p=panel('DONUT','Level '+S.lv+' &middot; '+S.wins+' wins in '+S.races+' races',h,p=>{p.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{const id=b.dataset.w,G=GEAR[id];S.wear[G.sl]=S.wear[G.sl]===id?null:id;snd('item');save();refresh(p,panGear)});const wd=p.querySelector('[data-wd]');if(wd)wd.onclick=()=>{snd('select');p.remove();panWardrobe()}});return p}
function bigDonut(){const k='big'+JSON.stringify(S.wear)+JSON.stringify(S.tint||{});if(ICN[k])return ICN[k];return ICN[k]=mkc(40,30,()=>rdog(16,26,{c:'red',st:'stand',g:dGear(),nt:1})).toDataURL()}

/* skills */
function panSkill(){let h='<p class="sub">Skill points: <span style="color:#ffd86b">'+S.sp+'</span><br>Earn one every level. Each tree unlocks top to bottom.</p><div class="tree">';
 SKT.forEach(([tn,c,L])=>{h+='<div class="col" style="--c:'+c+'"><p class="tn">'+tn.toUpperCase()+'</p>';L.forEach(([id,n,d,cost,lg],i)=>{const gate=lg&&S.gym<5,own=hasSk(id),can=!own&&!gate&&(i===0||hasSk(L[i-1][0]))&&S.sp>=cost;
  h+='<button class="sk'+(own?' own':can?' can':'')+'" data-s="'+id+'" data-c="'+cost+'"'+(can?'':' disabled')+(lg?' style="box-shadow:inset 0 0 0 '+U(.6)+' #ffd86b"':'')+'>'+n+'<b>'+d+'</b><b>'+(own?'LEARNED':gate?'NEEDS THE DONUT DOME':cost+' PT'+(cost>1?'S':''))+'</b></button>'});h+='</div>'});h+='</div>';
 const p=panel('SKILLS',null,h,p=>p.querySelectorAll('.sk.can').forEach(b=>b.onclick=()=>{S.sp-=+b.dataset.c;S.sk.push(b.dataset.s);snd('fanfare');save();refresh(p,panSkill)}));return p}

/* gym */
function panGym(){const n=GYM[S.gym+1];let h='<img src="'+gymThumb(S.gym)+'" style="width:'+U(90)+';align-self:center;image-rendering:pixelated;box-shadow:0 0 0 '+U(.8)+' #ffd86b">';
 h+='<p class="sub">'+GYM[S.gym].d+'<br>Stats can reach <span style="color:#ffd86b">'+GYM[S.gym].cap+'</span>'+(S.gym>=4?' &middot; 4 actions a week':'')+'</p>';
 if(n)h+='<p class="hd">NEXT UPGRADE</p><div class="card boss"><img class="ic" src="'+gymThumb(S.gym+1)+'"><div class="bd">'+n.n+'<small>Stat limit '+GYM[S.gym].cap+' &rarr; <b style="font-weight:400;color:#c2417a">'+n.cap+'</b><br>'+n.u.join('<br>')+'</small></div><button class="go" data-u="1"'+(S.money<n.p?' disabled':'')+'>'+fmt$(n.p)+'</button></div>';else h+='<p class="sub" style="color:#ffd86b">The Donut Dome is complete. Everything is unlocked.</p>';
 if(S.gym>=5)h+='<button class="tag" data-tr="1" style="align-self:center;width:'+U(96)+'">Visit the Trophy Room</button>';
 h+='<p class="hd">ALL GYMS</p>';for(let i=1;i<GYM.length;i++){const G=GYM[i],have=S.gym>=i;h+='<div class="card'+(have?'':' dim')+'" style="display:block"><b style="font-weight:400;color:'+(have?'#3a8a3a':'#8a7aa8')+'">'+(have?'&#10003; ':'&#128274; ')+G.n+'</b> <span style="float:right;font-size:.8em">limit '+G.cap+'</span><small>'+G.u.join('<br>')+'</small></div>'}
 h+='<p class="hd">EQUIPMENT</p><p class="sub" style="text-align:left">'+STATS.map(([k,nm])=>nm+': '+(S.eq[k]?EQ[k][S.eq[k]-1]:'none')).join('<br>')+'</p>';
 const p=panel('THE GYM',GYM[S.gym].n,h,p=>{const b=p.querySelector('[data-u]');if(b)b.onclick=()=>{S.money-=n.p;S.gym++;snd('fanfare');save();p.remove();gymUpgraded()};const tr=p.querySelector('[data-tr]');if(tr)tr.onclick=()=>{snd('select');p.remove();panTrophy()}});return p}
function gymThumb(lv){return icon('gy'+lv,()=>{cx.save();cx.translate(0,-40);at2(()=>gymBg(lv,0));cx.restore()},160,150)}

/* end of the week */
function endWeek(){const sp=S.spon?SPON[S.spon]:null;let pay=0;if(sp){const w=S.wear[GEAR[sp.it].sl]===sp.it;pay=Math.round(sp.pay*(w?1:.5)*(hasSk('magnet')?1.3:1)*sponMul());S.money+=pay}
 let merch=0;if(S.gym>=5){merch=Math.round(800+S.wins*150+eff().cha*60);S.money+=merch}S.week++;S.ap=apMax();S.raced=0;S.fl.rest=0;const en0=S.en;S.en=clamp(S.en+50+S.gym*3+(pool()?15:0)+(perk(2,0)?5:0),0,100);S.mood=clamp(S.mood+(68-S.mood)*.3,0,100);save();snd('chime');
 const lines=['Energy '+Math.round(en0)+' &rarr; '+Math.round(S.en)+(pool()?' (Recovery Pool)':''),'Mood '+Math.round(S.mood)];if(pay)lines.unshift('<b>+'+fmt$(pay)+'</b> from '+sp.n);if(merch)lines.unshift('<b>+'+fmt$(merch)+'</b> from the Merch Stand');
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
/* a venue at story scale: the crowd and the track, with our cast standing on it */
const VOY=72;
function venueScene(ven,cast,st){return t=>{cx.save();cx.scale(2,2);cx.translate(0,-VOY);venueDraw(ven,-8,t,st&&st.hype);
 if(st&&st.pod){const P=(x,y,w,h,c,n)=>{r(x,y,w,h,c);r(x,y,w,1,sh(c,1.25));r(x,y+h-1,w,1,sh(c,.75));ptxt(n,x+w/2,y+3,'#5a2148',1,'c')};P(18,183,14,15,'#c8c4d0','2');P(32,176,14,22,'#ffd86b','1');P(46,187,14,11,'#c87a3a','3')}
 venueFg(ven,-8);const L=(cast||[]).map(c=>({y:c.y,f:()=>{if(c.k==='dog')gcorgi(c.x,c.y,{c:c.c,g:c.g||{},st:c.st==='cheer'?'stand':c.st||'stand',t,dir:c.dir,tongue:c.tongue,jy:c.st==='cheer'?Math.round(Math.abs(Math.sin(t*5))*3):0});else if(c.k==='gus')gus2(c.x,c.y,t,c.dir);else ppl2(c.k,c.x,c.y,t,c.dir)}}));
 L.sort((a,b)=>a.y-b.y).forEach(q=>q.f());cx.restore();
 if(st&&st.pod){for(let i=0;i<30;i++){const x=(i*37+Math.floor(t*40)*(i%3+1))%160,y=(i*53+t*60*(1+i%4))%230;r(x,y,2,2,['#ffd86b','#ff7eb6','#7ee8fa','#8be28b'][i%4])}}}}
/* home, that night, on the back porch */
function homeScene(st){return t=>at2(()=>{cx.translate(0,-18);r(0,140,80,30,'#4e4e56');r(0,144,80,1,'#3a3a42');porch(t);const L=[{y:124,f:()=>p2('abi',30,122,t,'d',1)},{y:124,f:()=>p2('hunter',48,122,t,'d',1)},
  {y:134,f:()=>st.flop?crumpetLike(t):gcorgi(16,134,{c:'red',st:'sit',t,g:Object.assign(dGear(),{head:'crown'}),tongue:1})},{y:135,f:()=>crumpet(66,135,'l',t,3,0)}];
 L.sort((a,b)=>a.y-b.y).forEach(q=>q.f());/* the trophy on the porch floor between them */const tx=39,ty=134;r(tx-1,ty-8,4,4,'#ffd86b');r(tx-2,ty-8,6,1,'#ffe8a0');r(tx,ty-4,2,2,'#c89a20');r(tx-1,ty-2,4,2,'#c89a20');
 cx.globalCompositeOperation='lighter';disc(tx+1,ty-6,4,'#ffd86b',.15);cx.globalCompositeOperation='source-over'})}
function crumpetLike(t){/* Donut flopped across Abigail's feet */const x=28,y=128;r(x-6,y-4,13,4,'#e0903a');r(x-6,y-4,13,1,'#eaa456');r(x-5,y-1,10,1,'#fbf6ec');r(x+6,y-7,5,5,'#e0903a');r(x+9,y-5,3,2,'#fbf6ec');r(x+11,y-5,1,1,'#2a1a1a');r(x+8,y-6,2,1,'#2a1a1a');r(x+6,y-9,2,2,'#e0903a');r(x+9,y-9,2,2,'#e0903a');
 r(x+6,y-11,5,2,'#ffd86b');r(x+6,y-12,1,1,'#ffd86b');r(x+8,y-12,1,1,'#ffd86b');r(x+10,y-12,1,1,'#ffd86b')}
const gymSc=()=>t=>{HUB.draw(t)};

/* ---------------- story beats ---------------- */
function storyIntro(){const st={};MUS='cozy';
 talk([{n:'',t:'One quiet Sunday night...'},{n:'Abigail',t:'Hunter. Come look at Donut.'},{n:'Hunter',t:'Is she... watching TV?'},
  {n:'',t:'On the screen: the World Corgi Racing Championship. Tiny legs. Enormous speed.',a:()=>{scr.draw=tvClose()}},{n:'Abigail',t:'Donut. Are you watching corgi racing?',a:()=>{scr.draw=livingRoom(st);st.ear=1}},
  {n:'Donut',t:'*ears straight up* *butt wiggling at maximum power*',a:()=>{st.zoom=tm;snd('whoosh')}},{n:'Hunter',t:'Oh no. She thinks she can do that.'},
  {n:'Abigail',t:'Babe. I think she CAN do that.'},{n:'Hunter',t:'There’s an amateur race at the dog park this Saturday. First entry is free...'},
  {n:'Abigail',t:'Then it’s settled. Donut is going to be a racer!'},{n:'Crumpet',t:'*does not wake up*'}],
  ()=>{S.tutS=1;save();hub()},livingRoom(st))}
function preBoss(ev,then){MUS='tense';const W=bossWalkout(ev);talk(W.L,then,W.draw)}
function afterRace(ev,pl){const q=[];const B=ev.boss?BOSS[ev.boss]:null,win=pl===1;
 if(S.races===1)q.push(()=>talk([{n:'Abigail',t:win?'She WON?! Her very first race! Our girl is a RACER!':'Her very first race ever. Hunter, I’m so proud of her I could cry.'},{n:'Hunter',t:win?'Did you see her ears? They were FLAT. She was flying.':'Did you see her ears? Next week she’s gonna fly.'}],next));
 if(B){if(win)q.push(()=>talk([{n:B.h,t:{biscuit:'That’s okay Biscuit. You’re still the best at eating socks.',waddles:'Hmph. Sir Waddles shall return. Eventually. At his own pace.',tina:'She... she passed Tina? Nobody passes Tina.',loaf:'Big Mike respects that. The Loaf respects that.',pepper:'Pepper is going to be angry about this for a very long time.',
   chad:'Bro. BRO. That’s... okay that was actually sick. Respect.',duchess:'Well. Duchess has never been... second. How novel.',comet:'Hey, Kansas City! Give it up for the Missouri girl!',kenji:'Sato-san bows. Kenji bows. Donut... sniffs Kenji. That counts.',baguette:'Ze croissant was worth it. But zis dog... magnifique.',matilda:'Fair dinkum. She beat Matilda on SAND. Never seen it.',fluff:'...Well. Jolly good show, park dog.'}[ev.boss]}],next));
  else q.push(()=>talk([{n:S.fl.gus?'Coach Gus':'Abigail',t:pick(['We’ll get ’em next week. Back to work.','Close one. Train up and come back stronger.','That one stung. Good. Remember how it feels.'])}],next));
  if(!S.fl.gus)q.push(()=>cutGus(win,next));
  }
 if(win&&!S.spon&&S.lg===0&&S.wins>=3)q.push(()=>cutPupCup(ev.ven,next));
 if(win&&S.lg===2&&!S.fl.kib){S.fl.mjw=(S.fl.mjw||0)+1;if(S.fl.mjw>=2){S.fl.kib=1;q.push(()=>cutKibble(next))}}
 if(win&&S.lg===3&&!S.fl.cout&&!S.fl.champ){S.fl.cout=1;q.push(()=>cutCouture(next))}
 if(B&&win&&S.boss>=LG[S.lg].boss.length&&!S.fl.champ)q.push(()=>S.lg<3?promote():ending());
 let k=0;function next(){const f=q[k++];if(f)f();else afterAny()}next()}
function offer(id,lines){const P=SPON[id];talk(lines.concat([{n:'',t:P.n+': '+fmt$(P.pay)+' a week. Donut wears the '+GEAR[P.it].n+' for full pay.',c:[{l:'Sign the deal',f:()=>{S.spon=id;if(!S.own.includes(P.it))S.own.push(P.it);S.wear[GEAR[P.it].sl]=P.it;save();toast('New sponsor: '+P.n)}},{l:'No thanks',f:()=>{S.mood=clamp(S.mood+5,0,100);save()}}]}]),()=>afterAny(),gymSc())}
function meetGus(win){S.fl.gus=1;save();talk([{n:'',t:'Back home, someone is waiting by the gate. Low to the ground. Very long ears.'},
 {n:'Coach Gus',t:'Name’s Gus. Coach Gus. I raced the circuit back in ’87. Fastest basset hound in the Ozarks.'},{n:'Hunter',t:'Is a basset hound... fast?'},{n:'Coach Gus',t:'No. That’s what made it impressive.'},
 {n:'Coach Gus',t:win?'Your pup beat Biscuit on day one. Raw talent. Zero plan. That’s where I come in.':'Your pup’s got wheels. No plan. Biscuit ate her lunch today. That’s where I come in.'},
 {n:'Coach Gus',t:'Train smart. Rest when she’s tired. Buy her real equipment when you can. And for the love of kibble, watch the squirrels.'},{n:'Abigail',t:'Welcome to the team, Coach.'}],()=>afterAny(),gymSc())}
function promote(){const PC={v:{}};let PZ0=null;const from=S.lg;S.lg++;S.boss=0;S.lp=0;S.ap=apMax();save();const L=LG[S.lg];MUS='race';
 const lines={1:[{n:'Buzz',t:'Folks, the Amateur League has a new champion! DONUT is moving up to the MINOR LEAGUE!'},{n:'Coach Gus',t:'Ballparks. County fairs. Real crowds. Real money. Real squirrels.'},{n:'Abigail',t:'Minor league, here we come!'}],
  2:[{n:'Buzz',t:'She did it! Donut is headed to THE MAJOR LEAGUE! Stadiums! Halftime shows! Prime time!'},{n:'Hunter',t:'Abby. She’s gonna run at an NFL game.'},{n:'Abigail',t:'I need a bigger GO DONUT sign.'},{n:'Crumpet',t:'*stretches* *looks at the track* *looks at Donut* ...!'}],
  3:[{n:'Buzz',t:'Ladies and gentlemen... Donut has qualified for the GLOBAL RANKINGS! She enters the world at number one hundred!'},{n:'',t:'Across the ocean, in a palace, on a velvet cushion, Lord Fluffington watches the broadcast.',a:()=>{PZ0=scr.draw;scr.draw=t=>palace(PC,0,t)}},{n:'Sir Nigel Pomfrey',t:'A park dog. How quaint. Lord Fluffington has not lost in four years.'},{n:'',t:'Lord Fluffington yawns. Enormously.',a:()=>{PC.v.yawn=tm}},{n:'Coach Gus',t:'Then he’s due.',a:()=>{if(PZ0)scr.draw=PZ0}}]}[S.lg];
 talk(lines.concat([{n:'',t:'NOW ENTERING: '+L.n.toUpperCase()+'. New gear in the shop!'}]),()=>{S.week++;S.raced=0;save();weekStory()},venueScene(LG[from].boss.slice(-1)[0][1],[{k:'buzz',x:8,y:162,dir:'r'},{k:'dog',c:'red',g:dGear(),x:37,y:176,st:'cheer'},{k:'abi',x:60,y:184,dir:'l'},{k:'hunter',x:72,y:186,dir:'l'}],{hype:1,pod:1}))}
function weekStory(){const q=[];
 if(S.lg===1&&!S.fl.viv)q.push(()=>cutVivian(next));
 if(S.lg===2&&S.boss>=1&&!S.fl.inj){S.fl.inj=1;S.fl.rest=1;save();q.push(()=>cutInjury(()=>{if(!S.own.includes('bracelet'))S.own.push('bracelet');if(!S.wear.charm)S.wear.charm='bracelet';S.mood=100;save();next()}))}
 if(S.lg===2&&!S.fl.relay){S.fl.relay=1;save();q.push(()=>cutRelay(next))}
 if(S.gym>=4&&!S.fl.speedy)q.push(()=>loungeOffer(next));
 if(S.gym>=3&&S.week-(S.storyW||0)>=3&&(S.stories||0)<STORIES.length&&!q.length)q.push(()=>gusStory(next));
 let k=0;function next(){const f=q[k++];if(f)f();else afterAny()}next()}
function checkGifts(){if((S.fl.plays||0)>=3&&!S.own.includes('chew')&&on&&scr===HUB){S.own.push('chew');save();cutChew(()=>hub())}}
function champPhoto(h){try{const c=mkc(160,288,()=>homeScene({flop:0})(1));const p=mkc(120,120,(w,hh,g)=>g.drawImage(c,8,112,120,120,0,0,120,120));ALB.put('crzchamp',p)}catch(e){}}
function ending(){S.fl.champ=1;save();MUS='race';
 const K=cutScr((C,u,t)=>{cx.save();cx.scale(2,2);cx.translate(0,-VOY);venueDraw('final',-8,t,1);const b=C.b,L=[];
  const P=(x,y,w,h,c,n)=>{r(x,y,w,h,c);r(x,y,w,1,sh(c,1.25));r(x,y+h-1,w,1,sh(c,.75));ptxt(n,x+w/2,y+3,'#5a2148',1,'c')};P(18,183,14,15,'#c8c4d0','2');P(32,176,14,22,'#ffd86b','1');P(46,187,14,11,'#c87a3a','3');venueFg('final',-8);
  L.push({y:162,f:()=>ppl('buzz',8,162,t,'r')});
  const nx=b===2?tw(92,58,u,1.6):b>=3?58:92;if(b>=2)L.push({y:172,f:()=>{ppl('nigel',nx,172,t,'l',b===2&&u<1.6);pillow(nx-7,157);if(b<3||u<.2)crown2(nx-9,154)}});
  const fx=b===3?tw(25,31,u,.8):b>=4?31:25,fy=b===3?tw(183,190,u,.8):b>=4?190:183;L.push({y:fy,f:()=>gcorgi(fx,fy,{c:'fluff',g:{body:'royal'},st:b===3&&u>.8&&u<2?'lie':'stand',t,dir:'r'})});
  const crowned=b>=4||(b===3&&u>2);L.push({y:176,f:()=>{gcorgi(39,176,{c:'red',g:crowned?Object.assign(dGear(),{head:'crown'}):dGear(),st:'stand',t,tongue:1,jy:b<=1||b>=4?Math.round(Math.abs(Math.sin(t*5))*3):0,dir:'l'});
   if(b===3&&u>.8&&u<2){const k=ez((u-.8)/1.2);crown2(Math.round(49+(36-49)*k),Math.round(154+(162-154)*k-Math.sin(k*Math.PI)*14))}}});
  L.push({y:178,f:()=>p2('abi',62,178,t,'l')});L.push({y:180,f:()=>p2('hunter',72,180,t,'l')});if(b>=4)L.push({y:192,f:()=>gus2(64,192,t,'l',1)});castDraw(L);cx.restore();
  for(let i=0;i<30;i++){const x=(i*37+Math.floor(t*40)*(i%3+1))%160,y=(i*53+t*60*(1+i%4))%230;r(x,y,2,2,['#ffd86b','#ff7eb6','#7ee8fa','#8be28b'][i%4])}if(b===1||b===3&&u>2)at2(()=>flashes(u,8))});
 talk([{n:'Buzz',t:'She’s done it! DONUT! IS! THE! WORLD! CHAMPION!',a:bt(K,0)},{n:'',t:'The stadium in Newcastle shakes. Three fans in very large orange shirts are crying.',a:bt(K,1)},
  {n:'Sir Nigel Pomfrey',t:'Lord Fluffington... would like to present the crown.',a:bt(K,2)},
  {n:'',t:'Lord Fluffington walks over. Bows low. And sets the Champion’s Crown on Donut’s head.',a:bt(K,3,()=>after2(2,()=>snd('fanfare')))},{n:'Coach Gus',t:'Fastest basset in the Ozarks, ’87. Coach of the fastest corgi in the world. I can retire happy.',a:bt(K,4)}],()=>{
  const h={flop:0};MUS='sunset';talk([{n:'',t:'That night. Back home. The trophy sits on the porch between them.'},{n:'Hunter',t:'The fastest corgi in the whole world.'},{n:'Abigail',t:'And she still just wants to be on the couch with us.'},
   {n:'',t:'Donut waddles over... and flops right onto Abigail’s shoes. Just like the day she picked you.',a:()=>{h.flop=1;snd('bump')}},{n:'Crumpet',t:'*does not move*'},{n:'Abigail',t:'Good girl, Donut. Our good, good girl.'},
   {n:'',t:'CORGI RACERS: COMPLETE. Donut is the World Champion! A new photo is in your album, and you can keep racing anytime.',a:()=>champPhoto(h)}],()=>{if(!S.own.includes('crown'))S.own.push('crown');save();afterAny()},homeScene(h))},K.draw)}
const after2=(s2,f)=>setTimeout(f,s2*1000);
try{C4CAP.crzchamp='WORLD CHAMPION'}catch(e){}
/* ---------------- entry points ---------------- */
return {get on(){return on},open,close,mus,_S:()=>S,_go:go,_race:ev=>{mount();load();on=1;root.style.display='block';lastTs=performance.now();requestAnimationFrame(frame);go(raceScreen(ev))},_mg:k=>{mount();load();on=1;root.style.display='block';lastTs=performance.now();requestAnimationFrame(frame);go(mgShell(MGS[k]))},_dbg:{TTM,VEN,gymUpgraded,fanMeet,gusStory,loungeOffer,panScout,planPick,panTT,panCup,panWardrobe,autoTrain,startRace,HUB:()=>HUB,cutPupCup,cutVivian,cutKibble,cutCouture,cutGus,cutInjury,cutRelay,cutChew,bossWalkout,preBoss,FUN,vignette,scr:()=>scr,livingRoom,tvClose,hubScene,venueScene,homeScene,gcorgi,gus2,at2,gymBg,equip2,rdog,gus,mkc,venueArt,venueDraw,venueFg,obsDraw,disDraw,gymArt,S:()=>S,save,hub,raceScreen,MGS,go,talk,ending,promote}};
})();
