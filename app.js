"use strict";
const KEY="deanfit-v1";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const iso=d=>{const z=new Date(d);z.setMinutes(z.getMinutes()-z.getTimezoneOffset());return z.toISOString().slice(0,10)};
const today=()=>iso(new Date());
const fmtD=s=>{const [y,m,d]=s.split("-");return `${d}/${m}/${y}`};
const r1=n=>Math.round(n*10)/10;
let S=load();
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.days)return s}catch(e){}
 return {settings:{...DEFAULTS},days:{[DEFAULTS.startDate]:{weight:DEFAULTS.startWeight}},sessions:{},photos:[],custom:[]}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast("Storage full: export a backup and remove some photos")}}
function day(d=today()){return S.days[d]||(S.days[d]={})}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove("show"),1600)}
const T=()=>S.settings;
function totals(d){const f=(S.days[d]||{}).food||[];return f.reduce((a,x)=>({k:a.k+x.k*x.s,p:a.p+x.p*x.s,c:a.c+x.c*x.s,f:a.f+x.f*x.s}),{k:0,p:0,c:0,f:0})}
function weekNo(d=today()){return Math.max(1,Math.floor((new Date(d)-new Date(T().startDate))/864e5/7)+1)}
function dow(d=today()){const x=new Date(d+"T12:00").getDay();return x===0?7:x}
function latestWeight(){const ks=Object.keys(S.days).filter(k=>S.days[k].weight).sort();return ks.length?S.days[ks[ks.length-1]].weight:T().startWeight}
function weightSeries(){return Object.keys(S.days).filter(k=>S.days[k].weight).sort().map(k=>({d:k,w:+S.days[k].weight}))}
function avg7(series,i){const s=series.slice(Math.max(0,i-6),i+1);return s.reduce((a,x)=>a+x.w,0)/s.length}
function phase(w){return PHASES.find(p=>w>=p.w[0]&&w<=p.w[1])}
function isDeload(w){return w===6||w===12}
function setsFor(n,w){return isDeload(w)?Math.max(1,Math.ceil(n/2)):n}

function ring(pct,color,center,sub){const r=44,c=2*Math.PI*r,p=Math.max(0,Math.min(1,pct));
 return `<svg viewBox="0 0 110 110"><circle cx="55" cy="55" r="${r}" fill="none" stroke="#2a323d" stroke-width="11"/>
 <circle cx="55" cy="55" r="${r}" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-p)}" transform="rotate(-90 55 55)"/>
 <text x="55" y="54" text-anchor="middle" fill="#e9eef4" font-size="19" font-weight="800">${center}</text>
 <text x="55" y="72" text-anchor="middle" fill="#8b98a8" font-size="10">${sub}</text></svg>`}
function bar(v,t,color){return `<div class="bar"><i style="width:${Math.min(100,v/t*100)}%;background:${v>=t?"#22d3a6":color}"></i></div>`}
function lineChart(pts,opts={}){ // pts:[{x:label,y,y2}]
 if(pts.length<1)return `<p class="mut">No entries yet.</p>`;
 const W=600,H=220,P=34;const ys=pts.flatMap(p=>[p.y,p.y2].filter(v=>v!=null)).concat(opts.lines||[]);
 let mn=Math.min(...ys),mx=Math.max(...ys);if(mx-mn<2){mn-=1;mx+=1}
 const X=i=>P+(pts.length===1?(W-2*P)/2:i*(W-2*P)/(pts.length-1)),Y=v=>H-P-(v-mn)/(mx-mn)*(H-2*P);
 const path=k=>pts.map((p,i)=>p[k]==null?"":`${X(i)},${Y(p[k])}`).filter(Boolean).join(" ");
 let g="";for(let i=0;i<=3;i++){const v=mn+(mx-mn)*i/3;g+=`<line x1="${P}" x2="${W-10}" y1="${Y(v)}" y2="${Y(v)}" stroke="#2a323d"/><text x="4" y="${Y(v)+4}" fill="#8b98a8" font-size="11">${r1(v)}</text>`}
 (opts.lines||[]).forEach(v=>{g+=`<line x1="${P}" x2="${W-10}" y1="${Y(v)}" y2="${Y(v)}" stroke="#ffb020" stroke-dasharray="5 5"/><text x="${W-12}" y="${Y(v)-4}" text-anchor="end" fill="#ffb020" font-size="11">${v}</text>`});
 const step=Math.max(1,Math.ceil(pts.length/5));pts.forEach((p,i)=>{if(i%step===0||i===pts.length-1)g+=`<text x="${X(i)}" y="${H-10}" text-anchor="middle" fill="#8b98a8" font-size="11">${p.x}</text>`});
 const dots=pts.map((p,i)=>`<circle cx="${X(i)}" cy="${Y(p.y)}" r="3.5" fill="#3ba7ff"/>`).join("");
 return `<div class="chart"><svg viewBox="0 0 ${W} ${H}">${g}<polyline points="${path("y")}" fill="none" stroke="#3ba7ff" stroke-width="2.5"/>${pts.some(p=>p.y2!=null)?`<polyline points="${path("y2")}" fill="none" stroke="#22d3a6" stroke-width="3"/>`:""}${dots}</svg></div>`}

// ---------- streaks & weekly
function streak(test){let n=0,d=new Date();if(!test(iso(d)))d.setDate(d.getDate()-1);while(test(iso(d))){n++;d.setDate(d.getDate()-1)}return n}
const loggedFood=d=>((S.days[d]||{}).food||[]).length>0;
const hitProtein=d=>totals(d).p>=T().protein;
function sessionsOn(d){return Object.values(S.sessions).filter(s=>s.date===d&&s.done)}
function weekly(){const out={k:0,p:0,w:0,n:0,sl:0,sln:0,ses:0};const now=new Date();for(let i=0;i<7;i++){const d=new Date(now);d.setDate(d.getDate()-i);const k=iso(d);const t=totals(k);if(loggedFood(k)){out.k+=t.k;out.p+=t.p;out.n++}const x=S.days[k]||{};out.w+=x.water||0;if(x.sleep){out.sl+=+x.sleep;out.sln++}out.ses+=sessionsOn(k).length}
 const ws=weightSeries();const recent=ws.filter(p=>(new Date(today())-new Date(p.d))/864e5<=7),before=ws.filter(p=>{const a=(new Date(today())-new Date(p.d))/864e5;return a>7&&a<=14});
 const av=a=>a.length?a.reduce((s,x)=>s+x.w,0)/a.length:null;out.wavg=av(recent);out.wprev=av(before);return out}

// ---------- views
const V={};
V.home=()=>{const d=today(),t=totals(d),x=day(d),s=T(),w=weekNo(),lw=latestWeight();
 const wp=(lw-s.startWeight)/(s.goalLo-s.startWeight);const sched=WEEK_SCHEDULE[dow()];
 const tw=typeof sched==="number"?DAYS[sched-1]:null;const done=tw&&S.sessions[d+"|"+tw.id]?.done;
 return `<div class="card"><div class="rings">
 <div class="ring">${ring(t.k/s.kcal,"#ff7a45",Math.round(t.k),"of "+s.kcal+" kcal")}<div class="lbl">🔥 Calories</div></div>
 <div class="ring">${ring((x.water||0)/s.water,"#3ba7ff",r1((x.water||0)/1000)+"L","of "+r1(s.water/1000)+" L")}<div class="lbl">💧 Water</div></div>
 <div class="ring">${ring(wp,"#22d3a6",lw.toFixed(1),"goal "+s.goalLo+"-"+s.goalHi+" kg")}<div class="lbl">⚖️ Weight</div></div></div>
 <div style="margin-top:12px">
 <div class="mrow">Protein ${bar(t.p,s.protein,"#ff5d73")}<b>${Math.round(t.p)}/${s.protein} g</b></div>
 <div class="mrow">Carbs ${bar(t.c,s.carbs,"#ffb020")}<b>${Math.round(t.c)}/${s.carbs} g</b></div>
 <div class="mrow">Fat ${bar(t.f,s.fat,"#b48cff")}<b>${Math.round(t.f)}/${s.fat} g</b></div></div>
 <div class="grid3" style="margin-top:12px"><button class="btn p" onclick="addWater(250)">💧 +250 ml</button><button class="btn" onclick="go('progress')">⚖️ Weigh-in</button><button class="btn" onclick="go('food')">🍽️ Log meal</button></div></div>
 <div class="card"><div class="exh"><h2 style="margin:0">Today: ${tw?esc(tw.name):esc(sched)}</h2><span class="pill">Week ${w}${w<=12?" of 12":""}</span></div>
 <p class="mut">${esc(phase(w).t)}${isDeload(w)?" (deload: about half the sets)":""}. ${esc(phase(w).d)}</p>
 ${tw?`<p class="mut">${tw.ex.map(e=>esc(e[0])).join(" · ")}</p><button class="btn ${done?"":"p"}" style="width:100%" onclick="openTrain(${tw.id})">${done?"✅ Session complete, view":"Start session"}</button>`:`<p class="mut">Keep it light. Next training: ${esc(nextTraining())}</p>`}
 </div>
 <div class="card"><h2>Streaks</h2><div class="grid3" style="text-align:center">
 <div><div class="big">${streak(loggedFood)}</div><div class="mut">days food logged</div></div>
 <div><div class="big">${streak(hitProtein)}</div><div class="mut">days protein hit</div></div>
 <div><div class="big">${streak(d=>((S.days[d]||{}).water||0)>=s.water)}</div><div class="mut">days water hit</div></div></div></div>`};
function nextTraining(){for(let i=1;i<=7;i++){const d=new Date();d.setDate(d.getDate()+i);const s=WEEK_SCHEDULE[dow(iso(d))];if(typeof s==="number")return d.toLocaleDateString("en-AU",{weekday:"long"})+", "+DAYS[s-1].name}return""}
window.addWater=ml=>{const x=day();x.water=(x.water||0)+ml;save();toast("💧 +"+ml+" ml");render()};

// Training
let tr={day:null,week:null,hist:null};
window.openTrain=id=>{tr.day=id;go("train")};
function lastFor(name,beforeKey){const ss=Object.entries(S.sessions).filter(([k,s])=>k!==beforeKey&&s.sets&&s.sets[name]&&s.sets[name].some(x=>x.kg)).sort((a,b)=>a[1].date<b[1].date?1:-1);return ss.length?ss[0][1]:null}
function bestFor(name,excludeKey){let b=0;Object.entries(S.sessions).forEach(([k,s])=>{if(k===excludeKey)return;(s.sets?.[name]||[]).forEach(x=>{if(+x.kg>b)b=+x.kg})});return b}
V.train=()=>{const w=tr.week||weekNo();const sched=WEEK_SCHEDULE[dow()];const id=tr.day||(typeof sched==="number"?sched:1);tr.day=id;
 const D=DAYS[id-1],key=today()+"|"+id,ses=S.sessions[key]||{date:today(),day:id,week:w,sets:{}};
 let h=`<div class="card"><div class="seg">${[...Array(12)].map((_,i)=>`<button class="${w===i+1?"on":""}" onclick="tr.week=${i+1};render()">W${i+1}${isDeload(i+1)?"·D":""}</button>`).join("")}</div>
 <p class="mut">${esc(phase(w).t)}: ${esc(phase(w).d)}</p>
 <div class="seg">${DAYS.map(x=>`<button class="${x.id===id?"on":""}" onclick="tr.day=${x.id};render()">Day ${x.id} · ${x.short}</button>`).join("")}</div></div>
 <div class="card"><div class="exh"><h2 style="margin:0">${esc(D.name)}</h2><span class="pill">${fmtD(today())}</span></div>
 <p class="mut">Warm up 5 min + 2-3 ramp-up sets. Leave 1-2 reps in the tank. Hit the top of the rep range on all sets → add weight next time.</p>`;
 D.ex.forEach(([n,sets,reps])=>{const ns=setsFor(sets,w),last=lastFor(n,key),best=bestFor(n,key),cur=ses.sets[n]||[];
  const pb=cur.some(x=>+x.kg>0&&+x.kg>best)&&best>0;
  h+=`<div class="ex"><div class="exh"><b>${esc(n)}${pb?'<span class="badge">PB</span>':""}</b><button class="btn sm" onclick="tr.hist='${esc(n).replace(/'/g,"\\'")}';render()">📈</button></div>
  <div class="mut">Target ${ns} x ${esc(reps)}${last?` · Last ${fmtD(last.date)}: ${last.sets[n].filter(x=>x.kg).map(x=>`${x.kg}×${x.reps||"?"}`).join(", ")}`:""}${best?` · Best ${best} kg`:""}</div>`;
  for(let i=0;i<ns;i++){const v=cur[i]||{};const ph=last?.sets[n]?.[i]||{};
   h+=`<div class="setrow"><span>S${i+1}</span><input inputmode="decimal" placeholder="${ph.kg?ph.kg+" kg":"kg"}" value="${v.kg??""}" onchange="setVal('${key}',${id},${w},${JSON.stringify(n).replace(/"/g,"&quot;")},${i},'kg',this.value)"><input inputmode="numeric" placeholder="${ph.reps?ph.reps+" reps":"reps"}" value="${v.reps??""}" onchange="setVal('${key}',${id},${w},${JSON.stringify(n).replace(/"/g,"&quot;")},${i},'reps',this.value)"></div>`}
  if(tr.hist===n){const pts=Object.values(S.sessions).filter(s=>s.sets?.[n]?.some(x=>x.kg)).sort((a,b)=>a.date<b.date?-1:1).map(s=>({x:fmtD(s.date).slice(0,5),y:Math.max(...s.sets[n].map(x=>+x.kg||0))}));
   h+=`<h3>History · top set kg</h3>${lineChart(pts)}`}
  h+=`</div>`});
 h+=`<button class="btn ${ses.done?"":"p"}" style="width:100%;margin-top:10px" onclick="completeSession('${key}',${id},${w})">${ses.done?"✅ Completed (tap to undo)":"Mark session complete"}</button></div>`;
 return h};
window.setVal=(key,id,w,n,i,f,v)=>{const s=S.sessions[key]||(S.sessions[key]={date:key.split("|")[0],day:id,week:w,sets:{}});const a=s.sets[n]||(s.sets[n]=[]);a[i]=a[i]||{};a[i][f]=v===""?"":+v;save();
 if(f==="kg"&&+v>bestFor(n,key)&&bestFor(n,key)>0){toast("🏆 New PB: "+v+" kg");render()}};
window.completeSession=(key,id,w)=>{const s=S.sessions[key]||(S.sessions[key]={date:key.split("|")[0],day:id,week:w,sets:{}});s.done=!s.done;save();toast(s.done?"💪 Session complete":"Marked not complete");render()};

// Food
let fd={tab:"log",q:""};
function library(){return [...FOODS.map(f=>({n:f[0],sv:f[1],k:f[2],p:f[3],c:f[4],f:f[5],al:f[6]||""})),...RECIPES.map(r=>({n:r.n,sv:"1 serve (recipe)",k:r.k,p:r.p,c:r.c,f:r.f,al:""})),...(S.custom||[])]}
V.food=()=>{let h=`<div class="card"><div class="seg">${[["log","📝 Log"],["plans","📅 Meal plans"],["recipes","👨‍🍳 Recipes"]].map(([k,l])=>`<button class="${fd.tab===k?"on":""}" onclick="fd.tab='${k}';render()">${l}</button>`).join("")}</div></div>`;
 if(fd.tab==="log"){const d=today(),f=day(d).food||[],t=totals(d),s=T();
  h+=`<div class="card"><h2>Today · ${Math.round(t.k)} / ${s.kcal} kcal</h2>
  <div class="mrow">Protein ${bar(t.p,s.protein,"#ff5d73")}<b>${Math.round(t.p)}/${s.protein} g</b></div>
  <div class="list">${f.map((x,i)=>`<div class="it"><div><b>${esc(x.n)}</b> <span class="mut">× ${x.s} · ${esc(x.m||"")}</span><div class="mut">${Math.round(x.k*x.s)} kcal · ${r1(x.p*x.s)} P · ${r1(x.c*x.s)} C · ${r1(x.f*x.s)} F</div></div><button class="x" onclick="delFood(${i})">✕</button></div>`).join("")||'<p class="mut">Nothing logged yet today.</p>'}</div></div>
  <div class="card"><h2>Quick add</h2><label>Type what you ate, e.g. "shake, 2 eggs, 1 toast, chicken rice bowl"</label><div class="grid2" style="grid-template-columns:1fr auto"><input id="qt" placeholder="2 eggs, 1 toast"><button class="btn p" onclick="quickParse()">Add</button></div>
  <label>Meal</label><select id="meal">${["Post-workout","Morning snack","Lunch","Afternoon snack","Dinner","Evening","Pre-workout"].map(m=>`<option>${m}</option>`).join("")}</select>
  <label>Search library (${library().length} items, estimates)</label><input id="fq" placeholder="Search foods & recipes" value="${esc(fd.q)}" oninput="fd.q=this.value;document.getElementById('lib').innerHTML=libList()">
  <div class="list" id="lib">${libList()}</div></div>
  <div class="card"><details><summary>➕ Custom food</summary><div class="grid2"><div><label>Name</label><input id="cn"></div><div><label>Servings</label><input id="cs" inputmode="decimal" value="1"></div>
  <div><label>kcal</label><input id="ck" inputmode="decimal"></div><div><label>Protein g</label><input id="cp" inputmode="decimal"></div><div><label>Carbs g</label><input id="cc" inputmode="decimal"></div><div><label>Fat g</label><input id="cf" inputmode="decimal"></div></div>
  <label><input type="checkbox" id="csave" style="width:auto;min-height:0"> Save to my library</label><button class="btn p" style="width:100%;margin-top:8px" onclick="addCustom()">Add custom food</button></details></div>
  <p class="mut">Nutrition values are typical estimates per serving. Check labels for exact numbers.</p>`}
 if(fd.tab==="plans"){h+=MEAL_PLANS.map(p=>{const tk=p.items.reduce((a,x)=>a+x[3],0),tp=p.items.reduce((a,x)=>a+x[4],0);return `<div class="card"><h2>${esc(p.n)}</h2><p class="mut">About ${tk} kcal · ${tp} g protein (estimates). Top up with extra rice, toast or nuts to reach ${T().kcal}.</p><table>${p.items.map(x=>`<tr><td>${x[0]} <b>${esc(x[1])}</b><br><span class="mut">${esc(x[2])}</span></td><td>${x[3]} kcal<br><span class="mut">${x[4]} g P</span></td></tr>`).join("")}</table><button class="btn sm" style="margin-top:10px" onclick="logPlan(${MEAL_PLANS.indexOf(p)})">Log whole day</button></div>`}).join("")}
 if(fd.tab==="recipes"){h+=RECIPES.map((r,i)=>`<div class="card"><details><summary>${esc(r.n)} <span class="mut">· ${r.k} kcal · ${r.p} g P</span></summary><p class="mut">Per serve (estimate): ${r.k} kcal · ${r.p} P · ${r.c} C · ${r.f} F</p><h3>Ingredients</h3><ul>${r.ing.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><h3>Method</h3><ol>${r.m.map(x=>`<li>${esc(x)}</li>`).join("")}</ol><button class="btn p sm" onclick="logRecipe(${i})">Log 1 serve</button></details></div>`).join("")}
 return h};
window.libList=()=>{const q=fd.q.toLowerCase().trim();const L=library().filter(x=>!q||x.n.toLowerCase().includes(q)||x.al.includes(q)).slice(0,q?40:12);
 return L.map(x=>`<div class="it"><div><b>${esc(x.n)}</b><div class="mut">${esc(x.sv)} · ${x.k} kcal · ${x.p} g P</div></div><div style="display:flex;gap:4px"><button class="btn sm" onclick='addLib(${JSON.stringify(x.n).replace(/'/g,"&#39;")},0.5)'>½</button><button class="btn sm p" onclick='addLib(${JSON.stringify(x.n).replace(/'/g,"&#39;")},1)'>+1</button></div></div>`).join("")+(q?"":`<p class="mut">Search to see all items.</p>`)};
function pushFood(x,s){const d=day();(d.food||(d.food=[])).push({n:x.n,k:+x.k,p:+x.p,c:+x.c,f:+x.f,s:+s,m:$("#meal")?.value||""});save()}
window.addLib=(n,s)=>{const x=library().find(y=>y.n===n);pushFood(x,s);toast("Added "+n);render()};
window.delFood=i=>{day().food.splice(i,1);save();render()};
window.logRecipe=i=>{const r=RECIPES[i];pushFood({n:r.n,k:r.k,p:r.p,c:r.c,f:r.f},1);toast("Logged "+r.n)};
window.logPlan=i=>{MEAL_PLANS[i].items.forEach(x=>{const lib=library().find(y=>y.n.toLowerCase().startsWith(x[2].toLowerCase()));const d=day();(d.food||(d.food=[])).push(lib?{n:lib.n,k:lib.k,p:lib.p,c:lib.c,f:lib.f,s:1,m:x[1]}:{n:x[2],k:x[3],p:x[4],c:0,f:0,s:1,m:x[1]})});save();toast("Logged "+MEAL_PLANS[i].n);fd.tab="log";render()};
window.addCustom=()=>{const x={n:$("#cn").value.trim()||"Custom food",k:+$("#ck").value||0,p:+$("#cp").value||0,c:+$("#cc").value||0,f:+$("#cf").value||0};
 if($("#csave").checked){S.custom=S.custom||[];S.custom.push({...x,sv:"1 serve",al:""})}pushFood(x,+$("#cs").value||1);toast("Added "+x.n);render()};
window.quickParse=()=>{const txt=$("#qt").value;if(!txt.trim())return;const L=library();const miss=[];let n=0;
 txt.split(/,|\band\b|\+/i).map(s=>s.trim().toLowerCase()).filter(Boolean).forEach(part=>{const m=part.match(/^(\d+(?:\.\d+)?|half|a|an|one|two|three)?\s*(?:x\s*)?(.*)$/);const words={half:.5,a:1,an:1,one:1,two:2,three:3};
  let qty=m[1]?(words[m[1]]??+m[1]):1;let name=m[2].replace(/s$/,"").trim();
  let best=null,score=0;L.forEach(x=>{const cands=[x.n.toLowerCase(),...x.al.split(",").map(a=>a.trim()).filter(Boolean)];cands.forEach(c=>{let sc=0;if(c===name||c===name+"s")sc=100;else if(c.startsWith(name))sc=60;else if(c.includes(name))sc=40;else{const w=name.split(" ").filter(w=>w.length>2&&c.includes(w)).length;sc=w*15}if(sc>score){score=sc;best=x}})});
  if(best&&score>=15){pushFood(best,qty);n++}else miss.push(part)});
 toast(`Added ${n} item${n===1?"":"s"}${miss.length?" · not found: "+miss.join(", "):""}`);render()};

// Progress
V.progress=()=>{const d=today(),x=day(d),ws=weightSeries(),s=T(),wk=weekly();
 const pts=ws.map((p,i)=>({x:fmtD(p.d).slice(0,5),y:p.w,y2:r1(avg7(ws,i))}));
 const days=[];for(let i=0;i<21;i++){const dd=new Date();dd.setDate(dd.getDate()-i);days.push(iso(dd))}
 return `<div class="card"><h2>Today's check-in</h2><div class="grid2"><div><label>Weight (kg)</label><input id="wi" inputmode="decimal" value="${x.weight??""}" placeholder="${latestWeight()}"></div><div><label>Sleep (hours)</label><input id="sl" inputmode="decimal" value="${x.sleep??""}" placeholder="7.5"></div></div>
 <label>Date</label><input type="date" id="wd" value="${d}"><button class="btn p" style="width:100%;margin-top:10px" onclick="saveCheckin()">Save</button>
 <p class="mut">Weigh in after the toilet, before food. Watch the 7-entry average, not single days.</p></div>
 <div class="card"><h2>Weight · ${latestWeight().toFixed(1)} kg</h2><p class="mut"><span style="color:#3ba7ff">● daily</span> &nbsp; <span style="color:#22d3a6">● 7-entry average</span> &nbsp; <span style="color:#ffb020">- - goal</span></p>${lineChart(pts,{lines:[s.goalLo,s.goalHi]})}
 <p class="mut">${r1(latestWeight()-s.startWeight)>=0?"+":""}${r1(latestWeight()-s.startWeight)} kg since ${fmtD(s.startDate)} · ${r1(Math.max(0,s.goalLo-latestWeight()))} kg to ${s.goalLo}</p></div>
 <div class="card"><h2>This week</h2><table>
 <tr><td>Avg calories (logged days)</td><td>${wk.n?Math.round(wk.k/wk.n):"–"} / ${s.kcal}</td></tr>
 <tr><td>Avg protein</td><td>${wk.n?Math.round(wk.p/wk.n):"–"} / ${s.protein} g</td></tr>
 <tr><td>Avg water</td><td>${r1(wk.w/7/1000)} L / day</td></tr>
 <tr><td>Avg sleep</td><td>${wk.sln?r1(wk.sl/wk.sln)+" h":"–"}</td></tr>
 <tr><td>Sessions completed</td><td>${wk.ses} / 4</td></tr>
 <tr><td>Weight avg vs last week</td><td>${wk.wavg?wk.wavg.toFixed(1)+" kg":"–"}${wk.wavg&&wk.wprev?` (${wk.wavg-wk.wprev>=0?"+":""}${r1(wk.wavg-wk.wprev)})`:""}</td></tr></table>
 <p class="mut">Aim for +0.25 to 0.5 kg a week. Not gaining after 2 weeks: add 200 kcal in Settings. Gaining faster: drop 200.</p></div>
 <div class="card"><h2>History</h2><table><tr><th>Date</th><th>kcal</th><th>P</th><th>Water</th><th>kg</th><th>Sleep</th><th>Train</th></tr>
 ${days.map(k=>{const y=S.days[k]||{},t=totals(k),ss=sessionsOn(k);return `<tr><td>${fmtD(k).slice(0,5)}</td><td style="color:${t.k>=s.kcal?"#22d3a6":"inherit"}">${t.k?Math.round(t.k):"·"}</td><td>${t.p?Math.round(t.p):"·"}</td><td>${y.water?r1(y.water/1000)+"L":"·"}</td><td>${y.weight??"·"}</td><td>${y.sleep??"·"}</td><td>${ss.map(z=>"D"+z.day).join(" ")||"·"}</td></tr>`}).join("")}</table></div>
 <div class="card"><h2>Progress photos</h2><p class="mut">Stored only on this phone. Same light, front and side, once a month.</p>
 <input type="file" accept="image/*" capture="environment" onchange="addPhoto(this)"><div class="photos" style="margin-top:10px">${(S.photos||[]).slice().reverse().map((p,i)=>`<div><img src="${p.src}" alt=""><div class="mut">${fmtD(p.d)}</div></div>`).join("")}</div></div>`};
window.saveCheckin=()=>{const d=$("#wd").value||today();const x=day(d);const w=$("#wi").value,sl=$("#sl").value;if(w)x.weight=+w;if(sl)x.sleep=+sl;save();toast("Saved");render()};
window.addPhoto=inp=>{const f=inp.files[0];if(!f)return;const img=new Image();img.onload=()=>{const c=document.createElement("canvas"),sc=Math.min(1,720/img.width);c.width=img.width*sc;c.height=img.height*sc;c.getContext("2d").drawImage(img,0,0,c.width,c.height);(S.photos=S.photos||[]).push({d:today(),src:c.toDataURL("image/jpeg",.7)});save();toast("Photo saved");render()};img.src=URL.createObjectURL(f)};

// Settings
V.settings=()=>{const s=T();const f=(k,l)=>`<div><label>${l}</label><input inputmode="decimal" id="s_${k}" value="${s[k]}"></div>`;
 return `<div class="card"><h2>Daily targets</h2><div class="grid2">${f("kcal","Calories (kcal)")}${f("protein","Protein (g)")}${f("carbs","Carbs (g)")}${f("fat","Fat (g)")}${f("water","Water (ml)")}${f("startWeight","Start weight (kg)")}${f("goalLo","Goal low (kg)")}${f("goalHi","Goal high (kg)")}</div>
 <label>Program start date (week 1)</label><input type="date" id="s_startDate" value="${s.startDate}">
 <button class="btn p" style="width:100%;margin-top:12px" onclick="saveSettings()">Save targets</button>
 <p class="mut">Based on 47 y, 171 cm, 76 kg: maintenance about 2,550 kcal + 300 surplus. Water about 3 L, more on hot days.</p></div>
 <div class="card"><h2>Backup</h2><p class="mut">Your data lives only on this device. Export a backup weekly (save it to Files / Google Drive). Import restores it on any phone.</p>
 <div class="grid2"><button class="btn p" onclick="exportData()">⬇️ Export backup</button><label class="btn" style="margin:0;text-align:center;color:var(--text);font-size:15px;display:flex;align-items:center;justify-content:center">⬆️ Import<input type="file" accept="application/json,.json" style="display:none" onchange="importData(this)"></label></div></div>
 <div class="card"><h2>Reminders</h2><p class="mut">Web apps can't reliably send alarms on iPhone. Set phone reminders instead: 5:45am train, 7:15am shake + creatine, water every 2 hours, 9:30pm bed.</p></div>
 <div class="card"><h2>Install on your phone</h2><p class="mut">iPhone: open in Safari → Share → Add to Home Screen. Android: Chrome menu → Install app / Add to Home screen. Works offline after first load.</p></div>
 <div class="card"><button class="btn d" style="width:100%" onclick="resetAll()">Reset all data</button></div>`};
window.saveSettings=()=>{const s=T();["kcal","protein","carbs","fat","water","startWeight","goalLo","goalHi"].forEach(k=>{const v=+$("#s_"+k).value;if(v)s[k]=v});s.startDate=$("#s_startDate").value||s.startDate;save();toast("Targets saved")};
window.exportData=()=>{const b=new Blob([JSON.stringify(S,null,1)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`deanfit-backup-${today()}.json`;a.click();toast("Backup exported")};
window.importData=inp=>{const f=inp.files[0];if(!f)return;f.text().then(t=>{try{const d=JSON.parse(t);if(!d.days||!d.settings)throw 0;if(confirm("Replace all current data with this backup?")){S=d;save();toast("Backup restored");render()}}catch(e){alert("That file isn't a DeanFit backup.")}})};
window.resetAll=()=>{if(confirm("Delete ALL data on this device? Export a backup first.")&&confirm("Really delete everything?")){localStorage.removeItem(KEY);S=load();render();toast("Reset")}};

// router
let view="home";
window.go=v=>{view=v;location.hash=v;render();scrollTo(0,0)};
function render(){if(!V[view])view="home";$("#main").innerHTML=V[view]();document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.v===view));
 $("#hdrsub").textContent=new Date().toLocaleDateString("en-AU",{weekday:"short",day:"numeric",month:"short"})+" · Week "+weekNo()}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>go(b.dataset.v));
view=(location.hash||"#home").slice(1).split("?")[0];
window.addEventListener("hashchange",()=>{const v=location.hash.slice(1);if(v!==view&&V[v]){view=v;render()}});
render();
if("serviceWorker" in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("sw.js");
