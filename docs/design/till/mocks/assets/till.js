/* Till mock runtime: invented data only, no network. Charts are hand SVG in the mock; SPEC.md names production libraries. */
(function(){
const q=new URLSearchParams(location.search);
const theme=q.get('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
document.documentElement.dataset.theme=theme;
const page=document.body.dataset.page, H=document.documentElement;
const qs=q.get('theme')?('?theme='+q.get('theme')):'';
const NS='http://www.w3.org/2000/svg';
const inr=v=>'₹'+Math.round(v).toLocaleString('en-IN');
const css=n=>getComputedStyle(H).getPropertyValue(n).trim();

/* carry theme on links */
document.querySelectorAll('a[href$=".html"]').forEach(a=>a.href=a.getAttribute('href')+qs);

/* chrome */
if(page){
 const tabs=[['Today','home-mid.html','today'],['Spend','spend.html','spend'],['Bills','bills.html','bills'],['Invest','invest.html','invest'],['Plan','../plan2/mocks/plan.html','plan']];
 const nav=document.createElement('nav');nav.className='nav';nav.setAttribute('aria-label','Main');
 nav.innerHTML=`<div class="nav-brand"><svg class="mk" viewBox="0 0 24 24" aria-hidden="true"><path d="M5.3 22V3.7h13.4v9.6H5.3M12.2 13.3 20 22" fill="none" stroke="currentColor" stroke-width="2.6"/><rect x="9.6" y="6.8" width="5.2" height="3.4" fill="currentColor"/></svg><span class="wm">Reclaim</span></div>`+tabs.map(t=>`<a href="${t[1]+qs}"${t[2]===page?' aria-current="page"':''}>${t[0]}</a>`).join('');
 document.body.appendChild(nav);
}

/* sheets */
document.querySelectorAll('[data-sheet]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();document.getElementById(b.dataset.sheet).showModal()}));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d||e.target.classList.contains('close'))d.close()}));

/* The Line. Width is your balance, on one fixed scale. Colour has jobs: body is the state, bites are money going out (deeper for more),
   blue is money going to investing, green is salary coming in, red lines are the cushions, a diamond marks the crossing. SPEC.md section 3. */
const solid=STATUS.mark;
function river(ol){
 const rw=parseFloat(getComputedStyle(ol).getPropertyValue('--rw'))||84, scale=+ol.dataset.scale, C=+ol.dataset.cushion,HARD=+ol.dataset.hard||0,earned=ol.dataset.earned,GAP=2;
 const li=[...ol.children].filter(c=>c.tagName==='LI'), top=ol.getBoundingClientRect().top;
 const h=ol.getBoundingClientRect().height;
 const w=v=>Math.max(1.5,Math.min(v,scale)/scale*rw), px=v=>v/scale*rw;
 ol.querySelector('svg.river')?.remove();
 const lc=n=>getComputedStyle(ol).getPropertyValue(n).trim(); /* the panel has its own tokens */
 const uid=Math.random().toString(36).slice(2,6),pap=lc('--paper');
 const body=s=>lc(s==='past'?'--col-past':s==='col'?'--col':'--fill-'+s)||lc('--'+s);
 let out='',brk='',lineTop=null,lineBot=0;
 let prev={lo:+ol.dataset.start,hi:+ol.dataset.start};
 const rect=(x0,x1,y0,y1,f)=>x1>x0?`<rect x="${x0}" y="${y0}" width="${x1-x0}" height="${y1-y0}" fill="${f}"/>`:'';
 const mark=y=>{brk+=`M${rw-16} ${y+7}l7 -14M${rw-9} ${y+7}l7 -14`};
 if(prev.lo>scale)mark(14);
 const seen={},cross={};
 li.forEach(r=>{
  const b=r.getBoundingClientRect(),y0=b.top-top,y1=b.bottom-top,mid=y0+(y1-y0)/2;
  const lo=+r.dataset.lo,hi=+(r.dataset.hi||r.dataset.lo),t=r.dataset.t,med=(lo+hi)/2,k=STATUS.kind(med,0,{soft:C,hard:HARD});
  const s=t==='past'?(earned?'g0':'past'):k==='sell'?'r3':k==='dip'?'r1':earned?'g1':'col'; /* red starts at today, not in the money already spent */
  const past=t==='past'||t==='today',f=body(s),d=(prev.lo+prev.hi)/2-med;seen[s]=f;
  const toInvest=r.querySelector('a[href^="invest"]');
  let end=w(lo),edge=w(hi),extra='';
  if(d>0){ /* money out: the bite runs from the new balance back to the old one. Above the scale there is no edge to bite, so it shows at its true width on the column's end */
   let x0=edge+GAP,x1=Math.max(w(prev.hi),x0+2);
   if(hi>=scale){x1=rw;x0=Math.max(0,rw-Math.max(2,px(d)));end=edge=Math.max(0,x0-GAP)}
   const tone=t==='past'?'--bite0':toInvest?'--bite-inv':d<5000?'--bite1':d<20000?'--bite2':'--bite3';
   extra=rect(x0,x1,y0,y1,lc(tone));
  }else if(d<0&&!past){ /* money in: the old column stays, salary stacks on top of it */
   const x1=w(lo),x0=prev.lo>=scale?Math.max(0,rw-px(-d)):w(prev.hi);
   end=edge=Math.max(0,x0-GAP);extra=rect(x0,x1,y0,y1,lc('--in'));r.classList.add('in');
  }
  out+=rect(0,end,y0,y1,f);
  if(!past&&edge>end)out+=`<rect x="${end}" y="${y0}" width="${edge-end}" height="${y1-y0}" fill="url(#hs${uid}${s})"/>`; /* the hatched edge is the width of the ± */
  out+=extra;
  if(lo>scale&&prev.lo<=scale)mark(mid+(y1-mid)/2);
  if(t==='today')lineTop=y0;
  if(r.classList.contains('end'))lineBot=y1;
  /* first row from today where a cushion is crossed: by the median, or by the low end only */
  if(t!=='past'&&lineBot===0){
   if(!cross.soft&&lo<C)cross.soft={y:y0,sure:med<C};
   if(HARD&&!cross.hard&&lo<HARD)cross.hard={y:y0,sure:med<HARD};
  }
  prev={lo,hi};
 });
 const x=w(C),xh=w(HARD),low=Math.min(...li.filter(r=>r.dataset.t!=='past'&&r.dataset.lo&&!r.classList.contains('in')).map(r=>+r.dataset.lo)),showH=HARD&&low<HARD*1.5;
 const defs=Object.entries(seen).map(([s,f])=>`<pattern id="hs${uid}${s}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.4" height="5" fill="${f}"/></pattern>`).join('');
 const dia=(cx,c,col)=>{const cy=c.y+11;return `<path d="M${cx} ${cy-8}l8 8l-8 8l-8 -8Z" fill="${pap}"/><path d="M${cx} ${cy-5.5}l5.5 5.5l-5.5 5.5l-5.5 -5.5Z" fill="${c.sure?col:pap}" stroke="${col}" stroke-width="1.5"/>`};
 const rs=lc('--r2'),rh=lc('--r3t');
 let marks='';if(showH&&cross.hard)marks+=dia(xh,cross.hard,rh);if(cross.soft&&!(showH&&cross.hard&&cross.hard.y===cross.soft.y))marks+=dia(x,cross.soft,rs);
 const s=document.createElementNS(NS,'svg');s.setAttribute('class','river');s.setAttribute('width',rw+2);s.setAttribute('height',h);s.setAttribute('aria-hidden','true');
 s.innerHTML=`<defs>${defs}</defs>${out}<path d="${brk}" stroke="${pap}" stroke-width="3" fill="none"/>
 <line x1="${x}" x2="${x}" y1="${lineTop}" y2="${lineBot}" stroke="${pap}" stroke-width="4"/><line x1="${x}" x2="${x}" y1="${lineTop}" y2="${lineBot}" stroke="${rs}" stroke-width="2" stroke-dasharray="5 4"/>${showH?`<line x1="${xh}" x2="${xh}" y1="${lineTop}" y2="${lineBot}" stroke="${pap}" stroke-width="4"/><line x1="${xh}" x2="${xh}" y1="${lineTop}" y2="${lineBot}" stroke="${rh}" stroke-width="2"/>`:''}${marks}`;
 ol.prepend(s);
}
const drawRivers=()=>document.querySelectorAll('.stops').forEach(river);
drawRivers();addEventListener('resize',drawRivers);document.fonts&&document.fonts.ready.then(drawRivers);

const DIM=[31,28,31,30,31,30,31,31,30,31,30,31],MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function lcg(s){return()=>(s=(s*1664525+1013904223)>>>0)/4294967296}
const MARK={r1:'<i class="m crit"></i>',r2:'<i class="m crit"></i>',r3:'<i class="m crit"></i>',g1:'<i class="m safe"></i>',g2:'<i class="m safe"></i>',n:''};
/* against the owner's usual: how many variances away, with a rupee floor */
const zl=(now,med,v,floor)=>{const d=now-med,z=d/v;if(Math.abs(d)<floor)return'n';if(z>2)return'r3';if(z>1)return'r2';if(z>.75)return'r1';if(z<-2)return'g2';if(z<-1)return'g1';return'n'};
const ZW={r3:'Far above usual',r2:'Above usual',r1:'Near top of usual',n:'Usual',g1:'Below usual',g2:'Well below usual'};
const k=v=>v>=100000?(v/100000).toFixed(1).replace(/\.0$/,'')+' L':Math.round(v/1000)+'k';
const kk=v=>v>=1000?(v/1000).toFixed(v>=10000?0:1).replace(/\.0$/,'')+'k':String(Math.round(v));

/* a tap-to-read target: any [data-read] writes to the .read box named by data-to */
function reader(root){
 root.querySelectorAll('[data-read]').forEach(b=>b.addEventListener('click',e=>{
  if(b.tagName==='A')return;
  const t=document.getElementById(b.dataset.to);if(!t)return;
  t.innerHTML=b.dataset.read;t.hidden=false;t.className='read '+(b.dataset.st||'');
  root.querySelectorAll('[aria-pressed]').forEach(x=>{if(x.dataset.to===b.dataset.to)x.setAttribute('aria-pressed','false')});
  if(b.hasAttribute('aria-pressed'))b.setAttribute('aria-pressed','true');
 }));
}

/* strip: each dot is one earlier month, the larger mark is this month, in its state */
function strip(el){
 const v=el.dataset.v.split(',').map(Number),now=+el.dataset.now,max=+el.dataset.max,s=el.dataset.st||'n',W=320;
 const x=a=>6+a/max*(W-12);
 const h=document.createElement('div');h.style.cssText='position:relative;height:22px;margin-top:4px;background:linear-gradient(var(--rule),var(--rule)) 0 50%/100% 1px no-repeat';
 const dot=(a,c)=>{const d=document.createElement('i');d.style.cssText=`position:absolute;top:50%;left:${x(a)/W*100}%;${c}`;h.appendChild(d)};
 v.forEach(a=>dot(a,'width:8px;height:8px;border-radius:50%;transform:translate(-50%,-50%);background:var(--t3)'));
 const col=s==='n'?'var(--ink)':`var(--${s==='r3'?'r3':solid(s)})`;
 if(s[0]==='r')dot(now,`width:14px;height:14px;transform:translate(-50%,-50%) rotate(45deg);background:${col};box-shadow:0 0 0 2px var(--paper)`);
 else dot(now,`width:16px;height:16px;border-radius:50%;transform:translate(-50%,-50%);background:${col};box-shadow:0 0 0 2px var(--paper)`);
 el.appendChild(h);
}
document.querySelectorAll('.strip').forEach(strip);

/* 12-month bars: ordinary months in ink, unusual ones in their state, forecast part hatched */
function bars(el){
 const v=el.dataset.v.split(',').map(s=>s.split('-').map(Number)),l=el.dataset.l.split(','),st=(el.dataset.st||'').split(',');
 const W=el.clientWidth||340,H0=92,bw=W/v.length,max=Math.max(...v.map(a=>a[a.length-1]));const id='b'+Math.random().toString(36).slice(2,6);
 const fill=i=>st[i]?`var(--${st[i]==='r2'?'r2f':st[i]==='g2'?'g2f':st[i]})`:'var(--t3)';
 let o=`<svg class="chart" viewBox="0 0 ${W} ${H0+20}" role="img" aria-label="${el.dataset.label||''}"><defs><pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="5" fill="var(--ink2)"/></pattern></defs>`;
 const y=a=>H0-a/max*(H0-20);
 v.forEach((a,i)=>{const x=i*bw+bw*.17,w=bw*.66;
  o+=`<rect x="${x}" y="${y(a[0])}" width="${w}" height="${H0-y(a[0])}" fill="${fill(i)}"/>`;
  if(a.length>1)o+=`<rect x="${x}" y="${y(a[1])}" width="${w}" height="${y(a[0])-y(a[1])}" fill="url(#${id})"/>`;
  o+=`<text x="${x+w/2}" y="${H0+15}" text-anchor="middle">${l[i]}</text>`;
 });
 (el.dataset.mark||'').split(',').filter(Boolean).forEach(s=>{const [i,t]=s.split(':');const a=v[+i];const x=+i*bw+bw/2;
  o+=`<text class="fig" x="${Math.min(x,W-2)}" y="${y(a[a.length-1])-5}" text-anchor="${+i>v.length-3?'end':'middle'}">${t}</text>`});
 el.innerHTML=o+'</svg>';
}
const drawBars=()=>document.querySelectorAll('.bars').forEach(bars);drawBars();addEventListener('resize',drawBars);

/* pace: cumulative spend against the usual range of the same day in earlier months. Tap to read a day. */
function pace(el){
 const W=el.clientWidth||340,H0=170,L=4,R=W-4,T=14,B=H0-22,D=30,max=90000;
 const x=d=>L+(d-1)/(D-1)*(R-L),y=v=>B-v/max*(B-T);
 const lo=d=>55000*Math.pow(d/30,.92),hi=d=>80000*Math.pow(d/30,.9);
 const A=[1400,2600,4100,7900,9100,11000,14600,18800,20100,22200,26000,28100,31500,38800,41600,44444];
 let band='M';for(let d=1;d<=30;d++)band+=`${x(d)} ${y(hi(d))}L`;for(let d=30;d>=1;d--)band+=`${x(d)} ${y(lo(d))}${d>1?'L':'Z'}`;
 const fl=`M${x(16)} ${y(44444)}L${x(30)} ${y(71000)}L${x(30)} ${y(61000)}Z`;
 const id='p'+Math.random().toString(36).slice(2,6);
 el.innerHTML=`<svg class="chart" viewBox="0 0 ${W} ${H0}" role="img" aria-label="Spending so far this month inside the usual range, forecast ending near 66 thousand rupees, give or take 5 thousand">
 <defs><pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="5" fill="var(--ink)"/></pattern></defs>
 <path d="${band}" fill="var(--t2)" opacity=".5"/>
 <path d="${fl}" fill="url(#${id})"/>
 <path d="M${A.map((a,i)=>x(i+1)+' '+y(a)).join('L')}" fill="none" stroke="var(--ink)" stroke-width="2.5"/>
 <circle class="dot" cx="${x(16)}" cy="${y(44444)}" r="5" fill="var(--paper)" stroke="var(--ink)" stroke-width="3"/>
 <text x="${x(16)-8}" y="${y(44444)-12}" text-anchor="end" class="fig">₹44,444 today</text>
 <text class="fig" x="${R}" y="${y(80000)-2}" text-anchor="end">₹66k ±5k</text>
 <text x="${x(30)}" y="${y(lo(26))+26}" text-anchor="end">Grey band: your usual range</text>
 <line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--rule)"/>
 ${[1,10,20,30].map(d=>`<text x="${x(d)}" y="${H0-6}" text-anchor="${d===1?'start':d===30?'end':'middle'}">${d} Nov</text>`).join('')}
 </svg>`;
 const svg=el.querySelector('svg'),dot=svg.querySelector('.dot'),rd=document.getElementById(el.dataset.to);
 svg.addEventListener('pointerdown',e=>{const r=svg.getBoundingClientRect(),d=Math.max(1,Math.min(30,Math.round(1+((e.clientX-r.left)/r.width*W-L)/(R-L)*29)));
  rd.hidden=false;const u=`usual by then ₹${k(lo(d))}–${k(hi(d))}`;
  if(d<=16){dot.setAttribute('cx',x(d));dot.setAttribute('cy',y(A[d-1]));rd.innerHTML=`${d} Nov: <span class="n">${inr(A[d-1])}</span> spent, ${u}.`}
  else{const f=44444+(d-16)/14*22000,v=Math.max(1,Math.ceil((d-16)/14*5));dot.setAttribute('cx',x(d));dot.setAttribute('cy',y(f));rd.innerHTML=`${d} Nov, forecast: <span class="n">₹${k(f)} ±${v}k</span>, ${u}.`}
 });
}
const drawPace=()=>document.querySelectorAll('.pace').forEach(pace);drawPace();addEventListener('resize',drawPace);

/* due-date strip: shape says paid or not, colour says the state */
function due(el){
 const it=JSON.parse(el.dataset.items),today=+el.dataset.today,W=el.clientWidth||340,x=d=>8+(d-1)/29*(W-16);
 let o=`<svg class="chart" viewBox="0 0 ${W} 62" role="img" aria-label="Bills across the month, one late, four still to come"><line x1="8" x2="${W-8}" y1="30" y2="30" stroke="var(--rule)" stroke-width="2"/>`;
 it.forEach(i=>{const c=i[2]==='n'?'var(--ink)':`var(--${solid(i[2])})`,h=Math.max(5,Math.sqrt(i[1]/44)*20),paid=i[3];
  o+=`<rect x="${x(i[0])-4}" y="${30-h}" width="8" height="${2*h}" ${paid?`fill="${c}"`:`fill="var(--paper)" stroke="${c}" stroke-width="2"`}/>`});
 o+=`<line x1="${x(today)}" x2="${x(today)}" y1="2" y2="50" stroke="var(--ink)" stroke-width="2"/><text x="${x(today)}" y="60" text-anchor="middle" class="strong">Today</text>
 <text x="8" y="60">1</text><text x="${W-8}" y="60" text-anchor="end">30 Nov</text></svg>`;
 el.innerHTML=o;
}
const drawDue=()=>document.querySelectorAll('.due').forEach(due);drawDue();addEventListener('resize',drawDue);

/* small 12-month bars inside a bill row */
document.querySelectorAll('.micro').forEach(el=>{
 const v=el.dataset.v.split(',').map(Number),max=Math.max(...v),s=el.dataset.st;
 el.innerHTML=`<svg width="96" height="26" viewBox="0 0 96 26" aria-hidden="true">${v.map((a,i)=>`<rect x="${i*8}" y="${26-a/max*24}" width="6" height="${a/max*24}" fill="var(${i===v.length-1?(s?'--'+s:'--ink'):'--t2'})"/>`).join('')}</svg>`;
});

/* months of spending; usual ₹64k ±6k. Above 70 critical, below 58 safe. November is so far. */
const SPENDM=[55,58,62,71,66,60,64,69,63,67,44.444,null];
const spendState=(m,v)=>m===10?'n':zl(v,64,6,2);
const INV=[ // day-of-year based, invented
 ...[0,1,2,3,4,5,6,7,8,9,10].map(m=>[m,3,22222,'I']),
 ...[0,1,2,3,4,5,6,7,8,9].map(m=>[m,20,11111,'I']),
 ...[0,1,2,3,4,5,6,7,8,9,10].map(m=>[m,10,11111,'U']),
 [2,23,44444,'I'],[4,14,66666,'I'],[9,12,22222,'I'],[3,10,33333,'U'],[7,20,22228,'U']];
function invMonth(m){return INV.filter(a=>a[0]===m).reduce((s,a)=>s+a[2],0)}

/* month tiles: each is a real target. Spend tiles carry state; invest tiles only amount, never state. */
function tiles(el){
 const kind=el.dataset.kind,upto=10,onpick=el.dataset.pick;
 const inv=kind==='invest';
 el.className='tiles';
 el.innerHTML=MON.map((mn,m)=>{
  if(m>upto)return `<div class="cell fut"><small>${mn}</small></div>`;
  if(inv){const v=invMonth(m),s=v<50000?'i1':v<70000?'i2':v<100000?'i3':'i4';
   return `<a class="cell" data-s="${s}" href="invest.html#year" aria-label="${mn}: ${inr(v)} put in"><small>${mn}</small>${kk(v)}</a>`}
  const v=SPENDM[m],st=spendState(m,v),s=st==='n'?(m===10?'t1':v<62?'t1':'t2'):st;
  const lab=`${mn}: ₹${Math.round(v)}k${m===10?' so far':''}, ${ZW[st].toLowerCase()}`;
  const inner=`<small>${mn}</small>${Math.round(v)}k${MARK[st]}`;
  return onpick?`<button class="cell" data-s="${s}" data-month="${m}" aria-pressed="${m===10}" aria-label="${lab}">${inner}</button>`:`<a class="cell" data-s="${s}" href="spend.html?m=${m}#month" aria-label="${lab}">${inner}</a>`;
 }).join('');
}
document.querySelectorAll('[data-tiles]').forEach(tiles);

/* month calendar: 7 columns, so cells are always wide enough to tap */
function calData(m){
 const r=lcg(1111+m*97),n=m===10?16:DIM[m],out=[];let t=0;
 for(let d=1;d<=n;d++){const wd=new Date(2026,m,d).getDay(),u=r(),we=(wd===0||wd===6)?2.2:1;const v=u<.1?0:(Math.pow(r(),1.7)*2600*we+150);out.push(v);t+=v}
 const tgt=(SPENDM[m]||0)*1000,f=tgt/t;return out.map(v=>Math.round(v*f/10)*10);
}
/* the day's two biggest purchases: invented, stable for a given day */
const SHOPS=['Amazon','Swiggy','Star Bazaar','Zepto','Barbeque Corner','Cafes','Zomato','Movies','Auto rides'];
function topTwo(m,i,v){const r=lcg(7001+m*131+i*17),a=Math.floor(r()*SHOPS.length),b=(a+1+Math.floor(r()*(SHOPS.length-1)))%SHOPS.length,x=.42+r()*.2,y=.14+r()*.14,R=n=>Math.round(v*n/10)*10;return[[SHOPS[a],R(x)],[SHOPS[b],R(y)]]}
const twoTxt=t=>t.map(p=>p[0]+' '+inr(p[1])).join(', ');
function cal(el){
 const m=+el.dataset.m,d=calData(m),first=(new Date(2026,m,1).getDay()+6)%7,to=el.dataset.to,DN=['M','T','W','T','F','S','S'];
 let o=DN.map(x=>`<div class="wd">${x}</div>`).join('')+'<div></div>'.repeat(first);
 for(let i=1;i<=DIM[m];i++){
  const v=d[i-1],wd=WD[new Date(2026,m,i).getDay()];
  if(v===undefined){o+=`<div class="cell fut"><span class="dn">${i}</span></div>`;continue}
  const st=v>=10000?'r3':v>=6000?'r2':v===0?'g1':'n',s=st!=='n'?st:v<1000?'t1':v<2500?'t2':v<4000?'t3':'t4';
  const msg=`<b>${wd} ${i} ${MON[m]}: ${v?inr(v):'nothing spent'}</b>${st==='r3'?'. Very heavy day, over ₹10,000.':st==='r2'?'. Heavy day, over ₹6,000.':st==='g1'?'. A no-spend day.':'.'}${v?' Biggest: '+twoTxt(topTwo(m,i,v))+'.':''}`;
  o+=`<button class="cell" data-s="${s}" data-to="${to}" data-st="${st[0]==='r'?'crit':st[0]==='g'?'safe':''}" aria-pressed="false" data-read="${msg.replace(/"/g,'&quot;')}" aria-label="${wd} ${i} ${MON[m]}, ${v?inr(v):'nothing'}"><span class="dn">${i}</span>${v?kk(v):''}${MARK[st]}</button>`;
 }
 el.className='cal';el.innerHTML=o;reader(el);
 const li=document.getElementById(el.dataset.list);
 if(li)li.innerHTML=d.map((v,i)=>({v,i})).filter(a=>a.v>0).sort((a,b)=>b.v-a.v).slice(0,5).map(a=>`<tr><td><b>${WD[new Date(2026,m,a.i+1).getDay()]} ${a.i+1} ${MON[m]}</b><small>${twoTxt(topTwo(m,a.i+1,a.v))}</small></td><td class="num"><span class="n">${inr(a.v)}</span></td></tr>`).join('');
}
const calEl=document.querySelector('[data-cal]');
if(calEl){
 const start=q.get('m')!==null?+q.get('m'):10;
 calEl.dataset.m=start;cal(calEl);
 const title=document.getElementById('calt');
 const setT=m=>{if(title)title.textContent=`${['January','February','March','April','May','June','July','August','September','October','November'][m]}, day by day`};setT(start);
 document.querySelectorAll('[data-month]').forEach(b=>{b.setAttribute('aria-pressed',String(+b.dataset.month===start));
  b.addEventListener('click',()=>{document.querySelectorAll('[data-month]').forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');calEl.dataset.m=b.dataset.month;cal(calEl);setT(+b.dataset.month);
  const t=document.getElementById(calEl.dataset.to);t.hidden=true})});
 if(location.hash==='#month')document.getElementById('month')?.scrollIntoView();
}

/* category against its own usual */
function rng(el){
 const items=JSON.parse(el.dataset.items),max=+el.dataset.max,to=el.dataset.to,p=a=>Math.min(a,max)/max*100;
 el.innerHTML=items.map(i=>{const [n,now,med,v]=i,st=zl(now,med,v,2000);
  const msg=`<b>${n}: ${inr(now)}</b>. Usual by now ₹${k(med)} ±${k(v)}. ${ZW[st]}.`;
  return `<button class="rng" data-to="${to}" data-st="${st[0]==='r'?'crit':st[0]==='g'?'safe':''}" data-read="${msg}"><span class="row"><b class="icb">${TillIcons.html({name:n,group:n})}${n}</b><span class="val">${st==='n'?'':`<span class="sc ${st}"><i class="m"></i>${ZW[st].replace(' usual','')}</span>`}<span class="n">${inr(now)}</span></span></span>
  <span class="track"><span class="u" style="left:${p(med-v)}%;width:${p(med+v)-p(med-v)}%"></span><span class="med" style="left:${p(med)}%"></span><span class="now" data-s="${st}" style="left:${p(now)}%"></span></span></button>`}).join('');
 reader(el);
}
document.querySelectorAll('[data-rng]').forEach(rng);

/* category by month matrix: each row judged against that category's own usual */
function mx(el){
 const months=el.dataset.m.split(','),rows=JSON.parse(el.dataset.rows),to=el.dataset.to;
 let o=`<div class="mx-head">${months.map(x=>`<span>${x}</span>`).join('')}</div>`;
 rows.forEach(([n,vals,var_])=>{const so=[...vals].sort((a,b)=>a-b),med=(so[2]+so[3])/2;
  o+=`<div class="mx-row"><b class="icb">${TillIcons.html({name:n,group:n},'s')}${n}</b><div class="mx-cells">`+vals.map((v,i)=>{const st=zl(v,med,var_,2),s=st!=='n'?st:v>=med?'t2':'t1';
   return `<button class="cell" data-s="${s}" data-to="${to}" data-st="${st[0]==='r'?'crit':st[0]==='g'?'safe':''}" aria-pressed="false" data-read="<b>${n}, ${months[i]}: ₹${v}k</b>. Its usual is ₹${med}k ±${var_}k. ${ZW[st]}." aria-label="${n}, ${months[i]}, ${v} thousand">${v}k${MARK[st]}</button>`}).join('')+`</div></div>`});
 el.innerHTML=o;reader(el);
}
document.querySelectorAll('[data-mx]').forEach(mx);

/* treemap: area is money, grouped by category with a gap, so merchants and categories read together */
function layout(items,x,y,w,h){ // squarified
 const tot=items.reduce((s,i)=>s+i.v,0),res=[];let rest=[...items].sort((a,b)=>b.v-a.v),X=x,Y=y,W=w,H=h,left=tot;
 while(rest.length){
  const horiz=W>=H,side=horiz?H:W,sc=(W*H)/left;let row=[],best=1e9;
  for(const it of rest){const r=[...row,it],s=r.reduce((a,b)=>a+b.v,0)*sc,len=s/side;
   const worst=Math.max(...r.map(a=>{const t=a.v*sc/len;return Math.max(len/t,t/len)}));
   if(worst>best)break;best=worst;row=r}
  const s=row.reduce((a,b)=>a+b.v,0)*sc,len=s/side;let o=0;
  row.forEach(a=>{const t=a.v*sc/len;res.push(horiz?{...a,x:X,y:Y+o,w:len,h:t}:{...a,x:X+o,y:Y,w:t,h:len});o+=t});
  if(horiz){X+=len;W-=len}else{Y+=len;H-=len}
  left-=row.reduce((a,b)=>a+b.v,0);rest=rest.slice(row.length);
 }
 return res;
}
function tm(el){
 const G=JSON.parse(el.dataset.groups),to=el.dataset.to,W=el.clientWidth,H=el.clientHeight;
 const top=layout(G.map(g=>({n:g[0],v:g[1].reduce((s,i)=>s+i[1],0),kids:g[1]})),0,0,W,H);
 let o='';
 top.forEach((g,gi)=>{layout(g.kids.map(i=>({n:i[0],v:i[1],st:i[2],sub:i[3]})),g.x+1.5,g.y+1.5,g.w-3,g.h-3).forEach(b=>{
   const cl=b.st==='unk'?'unk':(b.st||''),wide=b.h>=86&&b.w>=74,tone=b.v>=5000?'3':b.v>=3500?'2':'1';
   const msg=`<b>${b.n}: ${inr(b.v)}</b>. ${b.sub}`;
   /* the icon only shows when name and icon both fit on the line; merged, unnamed or small blocks go without */
   const hasM=cl[0]==='r'||cl==='unk',fits=cl!=='unk'&&b.w-(cl==='r1'?20:16)-(hasM?18:0)-24>=b.n.length*7.8,merged=b.n.includes(',');
   const ic=fits&&!merged?TillIcons.html({name:b.n,group:g.n},'s'):'';
   const body=`<b${ic?' class="icb"':''}>${ic}${b.n}</b><span class="n">${b.v>=10000?'₹'+k(b.v):inr(b.v)}</span>${wide?`<small>${g.n}</small>`:''}`;
   o+=`<button class="${cl}" data-t="${tone}" data-to="${to}" data-st="${cl[0]==='r'?'crit':''}" aria-pressed="false" data-read="${msg}" style="left:${b.x}px;top:${b.y}px;width:${b.w-1}px;height:${b.h-1}px">${body}${cl[0]==='r'?'<i class="m crit"></i>':''}${cl==='unk'?'<i class="m q"></i>':''}</button>`})});
 el.innerHTML=o;reader(el);
}
const drawTm=()=>document.querySelectorAll('[data-tm]').forEach(tm);drawTm();addEventListener('resize',drawTm);

/* invest year: India above the line, US below, by week. Events on the matching side. */
const yrEl=document.getElementById('yr');
if(yrEl){
 const EV=JSON.parse(yrEl.dataset.events);
 const W=yrEl.clientWidth||340,PT=48,UP=78,DN=60,AX=20,PB=48,H0=PT+UP+AX+DN+PB,y0=PT+UP,y1=y0+AX;
 const doy=(m,d)=>Math.round((Date.UTC(2026,m,d)-Date.UTC(2026,0,1))/864e5),xd=d=>2+d/364*(W-4);
 const wk=Array.from({length:53},()=>[0,0]);INV.forEach(([m,d,v,s])=>{const w=Math.floor(doy(m,d)/7);wk[w][s==='I'?0:1]+=v});
 const max=Math.max(...wk.map(a=>Math.max(a[0],a[1]))),hU=v=>v/max*UP,hD=v=>v/max*UP; // one scale both sides
 const end=doy(10,16),xE=xd(end);
 const tone=v=>v>=40000?'--i4':v>=20000?'--i3':'--i2';
 let up='',dn='';
 wk.forEach((a,i)=>{const d0=i*7,x0=xd(d0),wd=xd(d0+7)-x0;if(d0>end)return;
  if(a[0])up+=`<rect x="${x0}" y="${y0-hU(a[0])}" width="${wd}" height="${hU(a[0])}" fill="var(${tone(a[0])})"/>`;
  if(a[1])dn+=`<rect x="${x0}" y="${y1}" width="${wd}" height="${Math.min(DN,hD(a[1]))}" fill="var(${tone(a[1])})"/>`});
 const mk=MON.map((m,i)=>`<text x="${xd(doy(i,1))+1}" y="${y0+14}">${m[0]}</text>`).join('');
 // lay pins out so targets never overlap; a leader line keeps the true date
 const place=(a)=>{const s=a.sort((p,q)=>p.x-q.x);for(let i=1;i<s.length;i++)if(s[i].px-s[i-1].px<50)s[i].px=s[i-1].px+50;return s};
 const ev=EV.map((e,i)=>({...e,i,x:xd(doy(e.m,e.d)),px:xd(doy(e.m,e.d))}));
 const IN=place(ev.filter(e=>e.side==='I').map(e=>({...e,px:Math.max(24,e.px)}))),US=place(ev.filter(e=>e.side==='U').map(e=>({...e,px:Math.max(24,e.px)})));
 const lead=(e,top)=>top?`<path d="M${e.px} ${PT-6}L${e.x} ${PT+6}V${y0}" fill="none" stroke="var(--ink2)" stroke-width="1.2" stroke-dasharray="3 2"/>`:`<path d="M${e.px} ${H0-PB+6}L${e.x} ${H0-PB-6}V${y1}" fill="none" stroke="var(--ink2)" stroke-width="1.2" stroke-dasharray="3 2"/>`;
 yrEl.innerHTML=`<svg viewBox="0 0 ${W} ${H0}" role="img" aria-label="Money put in each week of 2026, India above the line, US below, with six market events. A list is available below.">
  <rect x="${xE}" y="${PT}" width="${W-xE}" height="${UP+AX+DN}" fill="var(--band)" opacity=".6"/>
  ${[...IN.map(e=>lead(e,true)),...US.map(e=>lead(e,false))].join('')}
  ${up}${dn}
  ${mk}
  <text x="${W-2}" y="${PT+12}" text-anchor="end">India</text><text x="${W-2}" y="${H0-PB-4}" text-anchor="end">US</text>
  <line x1="${xE}" x2="${xE}" y1="${PT}" y2="${H0-PB}" stroke="var(--ink)" stroke-width="1.5"/>
  </svg>`+[...IN,...US].map(e=>`<button class="pin" data-ev="${e.i}" aria-pressed="false" aria-label="${e.t}" style="left:${e.px/W*100}%;${e.side==='I'?'top:0':'bottom:0'}"><span>${e.i+1}</span></button>`).join('');
 const card=document.getElementById('evt');
 const inr2=v=>v?inr(v):'nothing';
 const after=(e)=>{const a=doy(e.m,e.d);let v=0;INV.forEach(([m,d,x])=>{const t=doy(m,d);if(t>=a&&t<=a+14)v+=x});return v};
 const show=i=>{const e=EV[i];card.innerHTML=`<small>${e.date}, ${e.side==='I'?'India':'US'}</small><b>${e.t}</b><p>${e.x}</p><p>You put in <span class="n">${inr2(after(e))}</span> in the two weeks from that day.</p>`;
  yrEl.querySelectorAll('.pin').forEach(p=>p.setAttribute('aria-pressed',String(+p.dataset.ev===i)))};
 yrEl.querySelectorAll('.pin').forEach(p=>p.addEventListener('click',()=>show(+p.dataset.ev)));
 show(+(yrEl.dataset.open||0));
 const svg=yrEl.querySelector('svg'),rd=document.getElementById('yrread');
 svg.addEventListener('pointerdown',e=>{const r=svg.getBoundingClientRect(),X=(e.clientX-r.left)/r.width*W,d=Math.min(end,Math.max(0,Math.round((X-2)/(W-4)*364))),w=Math.floor(d/7),dt=new Date(Date.UTC(2026,0,1+w*7));
  rd.hidden=false;rd.innerHTML=`Week of ${dt.getUTCDate()} ${MON[dt.getUTCMonth()]}: India <span class="n">${inr(wk[w][0])}</span>, US <span class="n">${inr(wk[w][1])}</span>.`});
}

/* names: tap a suggestion, see what changed, undo */
const nm=document.getElementById('names');
if(nm){
 const set=s=>{nm.dataset.s=s;document.querySelectorAll('[data-state]').forEach(e=>e.hidden=e.dataset.state!==s)};
 document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>set(b.dataset.go)));
 set(q.get('state')||'a');
}
TillIcons.hydrate();
})();
