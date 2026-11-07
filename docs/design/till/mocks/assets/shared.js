/* Reclaim shared: the one status rule, and the data states. Pages load it before till.js; the Plan build inlines it.
   Rule in words: SPEC.md section 3. Pure until the DOM part at the bottom. */
const STATUS=(()=>{
 /* What the owner set, and how much selling counts as a lot. */
 const DEEP_SHARE=.05;
 /* m = median, h = half-width of the range, c = {soft,hard}. First match wins. */
 const kind=(m,h,c)=>{const lo=m-h;if(m<c.hard)return'sell';if(m<c.soft)return'dip';if(lo<c.hard)return'could';if(lo<c.soft)return'just';return'fits'};
 /* Depth by amount: pale when you dip or could, medium when you must sell, deep when you must sell over the stated share of liquid money. */
 const step=(k,x,liquid)=>k==='sell'?(liquid&&x>DEEP_SHARE*liquid?'r3':'r2'):(k==='dip'||k==='could')?'r1':'n';
 /* Green must be earned. Scores are low ends of the months compared. g1: beats 10 of the last 12 month-ends, and in the top 3 shown.
    g2: the top one, and at least twice last year's best. Under 12 month-ends: no green. */
 const greens=(scores,history)=>{const out=scores.map(()=>null);if(!history||history.length<12)return out;
  const s=[...history].sort((a,b)=>b-a),bar=s[1],top=s[0];
  scores.map((v,i)=>({v,i})).filter(o=>o.v!=null&&o.v>bar).sort((a,b)=>b.v-a.v).slice(0,3).forEach((o,k)=>{out[o.i]=k===0&&o.v>=2*top?'g2':'g1'});return out};
 /* Text and thin marks never use a pale step. */
 const mark=s=>s==='r1'?'r2':s==='r3'?'r3t':s==='g1'?'g2':s;
 return{DEEP_SHARE,kind,step,greens,mark}})();
if(typeof module!=='undefined')module.exports=STATUS;

if(typeof document!=='undefined'){
 /* Android Chrome holds :active back without a touch listener somewhere on the page. */
 document.addEventListener('touchstart',()=>{},{passive:true});
 /* Data states. In production the app sets these from as_of and fetch results; ?data= only shows them in the mock. */
 addEventListener('DOMContentLoaded',()=>{
  const d=new URLSearchParams(location.search).get('data'),page=document.body.dataset.page,top=document.querySelector('header.top');
  if(!d||!page||!top)return;
  const bar=(cls,html)=>{document.querySelector('.statebar')?.remove();const b=document.createElement('div');b.className='statebar '+cls;b.setAttribute('role','status');b.innerHTML=html;top.after(b);return b};
  const again='<button class="tlink" data-again>Try again</button>',q='<i class="m q" aria-hidden="true"></i>';
  const loading=()=>{bar('plain','<span>Updating. These are the 6:10 am figures.</span>');setTimeout(()=>{document.querySelector('.statebar')?.remove();const t=document.querySelector('.top .dt');if(t)t.textContent=t.textContent.replace(/updated .*/,'updated just now')},1200)};
  document.addEventListener('click',e=>{if(e.target.closest('[data-again]'))loading()});
  const dt=document.querySelector('.top .dt');
  if(d==='stale'){bar('a',`${q}<span>Last updated Sat 14 Nov, 6:10 am. These numbers may be old.</span>${again}`);if(dt)dt.textContent=dt.textContent.replace(/updated .*/,'updated Sat 6:10 am')}
  if(d==='error')bar('a',`${q}<span>Could not update. These are the 6:10 am figures.</span>${again}`);
  if(d==='loading')bar('plain','<span>Updating. These are the 6:10 am figures.</span>');
  /* No figures to show: a sentence and one way forward, never a spinner over money. Plan handles empty itself: its page still works. */
  const main=document.querySelector('main');
  const EMPTY={today:['Nothing has come in yet.','This page fills in after your first statement or SMS arrives.'],spend:['No spending yet this month.','Payments appear here after your next statement or SMS.'],bills:['No bills found yet.','A bill appears here once it has shown up in your statements.'],invest:['No investments found yet.','Holdings appear here after your first statement from a fund or broker.']};
  const fill=(h,p,btn)=>{main.className='';main.innerHTML=`<h1 class="a">${h}</h1><p class="sub">${p}</p>${btn?`<div class="wrap mt4"><button class="bigbtn" onclick="location.href=location.pathname+location.search.replace(/[?&]data=[^&]*/,'')">${btn}</button></div>`:''}`};
  if(page!=='plan'){
   if(d==='empty'&&EMPTY[page])fill(EMPTY[page][0],EMPTY[page][1],'Check again');
   if(d==='first')fill('Getting your numbers.','This takes a few seconds the first time.');
   if(d==='failed')fill('Could not load your numbers.','Nothing is lost. ','Try again');
  }
 });
}
