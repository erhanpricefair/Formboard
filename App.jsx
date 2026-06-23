import React from "react";
import { useState, useEffect } from "react";

const PRELOAD = {
  race: { track:"Warwick Farm", race_number:4, distance:1600, class:"BM72", going:"Soft (5)", prize_money:60000 },
  runners: [
    { no:1,  name:"HOT BANDIT",         barrier:5,  jockey:"Ramsbotham a(3)", trainer:"T L Pepper",          form:"0x823", weight:61.0, rating:90,  win_odds:6.30,   place_odds:1.60  },
    { no:2,  name:"TAZARAL",            barrier:1,  jockey:"Fitzgerald a(3)", trainer:"Annabel & Archibald", form:"0008x", weight:60.5, rating:34,  win_odds:37.70,  place_odds:16.10 },
    { no:4,  name:"TRAPALANDA",         barrier:2,  jockey:"Nock a(1.5)",     trainer:"Annabel & Archibald", form:"2664x", weight:60.0, rating:88,  win_odds:14.50,  place_odds:19.30 },
    { no:8,  name:"LENNOX",             barrier:4,  jockey:"Gibbons",         trainer:"Annabel & Archibald", form:"407x6", weight:59.0, rating:91,  win_odds:5.90,   place_odds:1.50  },
    { no:9,  name:"DANCES WITH HOOVES", barrier:10, jockey:"Stanley",         trainer:"C Crockett",          form:"5x396", weight:58.0, rating:91,  win_odds:7.80,   place_odds:2.10  },
    { no:10, name:"DEAL N DASH",        barrier:8,  jockey:"T Clark",         trainer:"B Baker",             form:"x436x", weight:58.0, rating:83,  win_odds:4.20,   place_odds:3.70  },
    { no:11, name:"CONCORDIA WIND",     barrier:9,  jockey:"Grima a(2)",      trainer:"C Waller",            form:"64x24", weight:57.5, rating:100, win_odds:4.70,   place_odds:1.40  },
    { no:12, name:"BARBRAY",            barrier:7,  jockey:"Schiller",        trainer:"C Waller",            form:"67x55", weight:56.5, rating:85,  win_odds:18.80,  place_odds:3.50  },
    { no:13, name:"MONKHANA",           barrier:3,  jockey:"Roper a(2)",      trainer:"D Wynen",             form:"93673", weight:56.5, rating:83,  win_odds:125.60, place_odds:null  },
    { no:14, name:"TANGLEWOOD JIMMY",   barrier:6,  jockey:"Llewellyn a(3)",  trainer:"T W Wilkes",          form:"12321", weight:56.0, rating:89,  win_odds:8.50,   place_odds:2.40  },
  ]
};

function detectGoing(g) {
  if(!g) return "good";
  const s=g.toLowerCase();
  if(s.includes("heavy")) return "heavy";
  if(s.includes("soft"))  return "soft";
  if(s.includes("good"))  return "good";
  if(s.includes("firm"))  return "firm";
  return "good";
}

function goingWeights(rg) {
  if(rg==="soft")  return {soft:1.0, heavy:0.2};
  if(rg==="heavy") return {soft:0.4, heavy:1.0};
  if(rg==="good")  return {soft:0.3, heavy:0.1};
  return {soft:0.1, heavy:0.0};
}

const BW = { rating:0.15,form:0.17,weight:0.09,barrier:0.08,trainerTier:0.11,jockeyTier:0.08,oddsSignal:0.10,trackAffinity:0.09,goingPref:0.10,distancePref:0.08 };
const BW_SUM = Object.values(BW).reduce((a,b)=>a+b,0);

function scoreForm(f){
  if(!f) return 0;
  const chars=f.replace(/x/gi,"").split("").reverse();
  if(!chars.length) return 0;
  const map={"1":10,"2":8,"3":6,"4":4,"5":3,"6":2,"7":1,"8":1,"9":0,"0":0};
  let s=0,w=1;
  for(const c of chars){s+=(map[c]??0)*w;w*=0.75;}
  return Math.min(s/12,1);
}
function scoreBarrier(b,n){return Math.max(0,1-Math.abs(b-n*0.4)/(n*0.5));}
function scoreTrainer(t){
  const s=(t||"").toLowerCase();
  if(s.includes("waller")) return 1.0;
  if(s.includes("archibald")||s.includes("annabel")) return 0.85;
  if(s.includes("crockett")) return 0.65;
  if(s.includes("baker")) return 0.60;
  if(s.includes("pepper")) return 0.55;
  if(s.includes("wilkes")) return 0.50;
  return 0.45;
}
function scoreJockey(j){
  const s=(j||"").toLowerCase();
  if(s.includes("schiller")||s.includes("clark")) return 0.90;
  if(s.includes("stanley")||s.includes("gibbons")) return 0.78;
  if(s.includes("grima")||s.includes("nock")) return 0.68;
  if(s.includes("a(3)")||s.includes("a(2)")||s.includes("a(1.5)")) return 0.62;
  return 0.55;
}
function scoreOdds(w){
  if(!w||isNaN(w)) return 0.3;
  if(w<=3) return 1.0; if(w<=5) return 0.85; if(w<=8) return 0.72;
  if(w<=12) return 0.55; if(w<=20) return 0.35; return 0.12;
}
function scoreWPR(wins,places,runs){
  if(!runs||runs===0) return null;
  const rate=(wins+places*0.6)/runs;
  const conf=Math.min(runs/5,1);
  const base=rate>=0.5?1.0:rate>=0.35?0.85:rate>=0.25?0.72:rate>=0.15?0.58:rate>=0.08?0.42:0.28;
  return base*conf+0.5*(1-conf);
}
function scoreWPRN(wins,places,runs){ const s=scoreWPR(wins,places,runs); return s===null?0.5:s; }

function scoreGoing(ex, rg){
  const gw=goingWeights(rg);
  const ss=scoreWPR(parseInt(ex.soft_wins)||0,parseInt(ex.soft_places)||0,parseInt(ex.soft_runs)||0);
  const hs=scoreWPR(parseInt(ex.heavy_wins)||0,parseInt(ex.heavy_places)||0,parseInt(ex.heavy_runs)||0);
  if(ss===null&&hs===null) return 0.5;
  let total=0,wsum=0;
  total+=(ss!==null?ss:0.5)*gw.soft; wsum+=gw.soft;
  total+=(hs!==null?hs:0.5)*gw.heavy; wsum+=gw.heavy;
  return wsum>0?total/wsum:0.5;
}

function analyze(runners,extraData,raceGoing){
  const rg=detectGoing(raceGoing);
  const maxR=Math.max(...runners.map(r=>r.rating||0));
  const wts=runners.map(r=>r.weight||0);
  const minW=Math.min(...wts),maxW=Math.max(...wts);
  const n=runners.length;
  const scored=runners.map(r=>{
    const ex=extraData?.[r.name]||{};
    const scores={
      rating:        maxR>0?r.rating/maxR:0.5,
      form:          scoreForm(r.form),
      weight:        maxW===minW?0.5:1-(r.weight-minW)/(maxW-minW),
      barrier:       scoreBarrier(r.barrier,n),
      trainerTier:   scoreTrainer(r.trainer),
      jockeyTier:    scoreJockey(r.jockey),
      oddsSignal:    scoreOdds(r.win_odds),
      trackAffinity: scoreWPRN(parseInt(ex.track_wins)||0,parseInt(ex.track_places)||0,parseInt(ex.track_runs)||0),
      goingPref:     scoreGoing(ex,rg),
      distancePref:  scoreWPRN(parseInt(ex.dist_wins)||0,parseInt(ex.dist_places)||0,parseInt(ex.dist_runs)||0),
    };
    const total=Object.entries(BW).reduce((s,[k,w])=>s+scores[k]*(w/BW_SUM),0);
    return{...r,scores,total,_ex:ex};
  });
  const sum=scored.reduce((s,r)=>s+r.total,0);
  return scored.map(r=>({...r,prob:r.total/sum})).sort((a,b)=>b.prob-a.prob);
}

function edgeTag(prob,odds){
  if(!odds||isNaN(odds)) return null;
  const e=prob-1/odds;
  if(e>0.06)  return{label:"VALUE", color:"#00e87a"};
  if(e>0.02)  return{label:"SLIGHT",color:"#f5c842"};
  if(e<-0.08) return{label:"AVOID", color:"#ff4d4d"};
  return        {label:"FAIR",  color:"#6b7f8f"};
}

function hasData(ex){ return ex&&Object.values(ex).some(v=>parseInt(v)>0); }

const C={bg:"#080c10",panel:"#0f1620",border:"#1a2535",accent:"#00c896",accentDim:"#004d3a",gold:"#f5c842",red:"#ff4d4d",text:"#dde6ef",muted:"#5a6f80",alt:"#0b1219",blue:"#4da6ff",purple:"#b07aff"};

const COLS=[
  {key:"track_wins",   group:"TRACK", sub:"W", color:C.blue},
  {key:"track_places", group:"TRACK", sub:"P", color:C.blue},
  {key:"track_runs",   group:"TRACK", sub:"R", color:C.blue},
  {key:"soft_wins",    group:"SOFT",  sub:"W", color:C.accent},
  {key:"soft_places",  group:"SOFT",  sub:"P", color:C.accent},
  {key:"soft_runs",    group:"SOFT",  sub:"R", color:C.accent},
  {key:"heavy_wins",   group:"HEAVY", sub:"W", color:C.purple},
  {key:"heavy_places", group:"HEAVY", sub:"P", color:C.purple},
  {key:"heavy_runs",   group:"HEAVY", sub:"R", color:C.purple},
  {key:"dist_wins",    group:"DIST",  sub:"W", color:C.gold},
  {key:"dist_places",  group:"DIST",  sub:"P", color:C.gold},
  {key:"dist_runs",    group:"DIST",  sub:"R", color:C.gold},
];
const CT=`1fr ${COLS.map(()=>"26px").join(" ")}`;

function Num({value,onChange}){
  return <input type="number" min="0" value={value===0?"":value} placeholder="0"
    onChange={e=>onChange(parseInt(e.target.value)||0)}
    style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,color:C.text,fontFamily:"inherit",fontSize:11,padding:"5px 2px",borderRadius:2,outline:"none",boxSizing:"border-box",textAlign:"center"}}/>;
}

export default function FormBoard(){
  const [runners]  = useState(PRELOAD.runners);
  const [race]     = useState(PRELOAD.race);
  const [extra,    setExtra]   = useState({});
  const [results,  setResults] = useState(null);
  const [tab,      setTab]     = useState("entry");
  const [json,     setJson]    = useState("");
  const [err,      setErr]     = useState("");
  const [cRace,    setCRace]   = useState(null);
  const [cRunners, setCRunners]= useState(null);

  const aRace = cRace || race;
  const aRunners = cRunners || runners;
  const rg = detectGoing(aRace.going||"");
  const gw = goingWeights(rg);

  useEffect(()=>{ setResults(analyze(PRELOAD.runners,{},PRELOAD.race.going)); },[]);

  function setField(name,field,val){ setExtra(p=>({...p,[name]:{...(p[name]||{}),[field]:val}})); }

  function runAnalysis(){ setResults(analyze(aRunners,extra,aRace.going||"")); setTab("results"); }

  function runCustom(){
    setErr("");
    try{
      const parsed=JSON.parse(json);
      const data=parsed.runners?parsed:{runners:parsed};
      if(!Array.isArray(data.runners)) throw new Error("No runners array");
      setCRunners(data.runners); setCRace(data.race||null); setExtra({});
      setResults(analyze(data.runners,{},data.race?.going||"")); setTab("entry");
    }catch(e){setErr(e.message);}
  }

  const top=results?.[0];

  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Courier New',monospace",color:C.text,paddingBottom:60}}>
      <div style={{background:C.panel,borderBottom:`1px solid ${C.border}`,padding:"14px 20px",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:10,color:C.accent,letterSpacing:4,fontWeight:900}}>FORM</span>
        <span style={{fontSize:18,fontWeight:900,letterSpacing:-1}}>BOARD</span>
        <span style={{marginLeft:"auto",fontSize:9,color:C.muted}}>v6 · SPLIT GOING</span>
      </div>

      <div style={{maxWidth:820,margin:"0 auto",padding:"0 8px"}}>

        <div style={{margin:"12px 0 0",background:C.panel,border:`1px solid ${C.accentDim}`,borderLeft:`3px solid ${C.accent}`,padding:"8px 12px",fontSize:11,display:"flex",flexWrap:"wrap",gap:"4px 14px",alignItems:"center"}}>
          <span style={{color:C.accent,fontWeight:700}}>{aRace.track?.toUpperCase()} R{aRace.race_number}</span>
          <span style={{color:C.muted}}>{aRace.distance}m · {aRace.class}</span>
          <span style={{color:C.gold,fontWeight:700}}>{aRace.going}</span>
          {aRace.prize_money&&<span style={{color:C.muted}}>${aRace.prize_money.toLocaleString()}</span>}
          <span style={{marginLeft:"auto",fontSize:8,color:C.muted}}>
            SOFT <span style={{color:C.accent}}>{(gw.soft*100).toFixed(0)}%</span> · HEAVY <span style={{color:C.purple}}>{(gw.heavy*100).toFixed(0)}%</span>
          </span>
        </div>

        <div style={{display:"flex",gap:0,marginTop:12,borderBottom:`1px solid ${C.border}`}}>
          {["entry","results","load"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?C.panel:"transparent",color:tab===t?C.accent:C.muted,border:"none",borderBottom:tab===t?`2px solid ${C.accent}`:"2px solid transparent",padding:"7px 12px",fontFamily:"inherit",fontSize:10,letterSpacing:1.5,cursor:"pointer",textTransform:"uppercase"}}>
              {t==="entry"?"DATA ENTRY":t==="results"?"RESULTS":"LOAD RACE"}
            </button>
          ))}
        </div>

        {tab==="entry"&&(
          <div style={{marginTop:10}}>
            <div style={{display:"grid",gridTemplateColumns:CT,gap:2,padding:"4px 4px 0"}}>
              <span></span>
              <span style={{gridColumn:"span 3",textAlign:"center",fontSize:8,color:C.blue,  borderBottom:`1px solid ${C.blue}`,  paddingBottom:2}}>TRACK</span>
              <span style={{gridColumn:"span 3",textAlign:"center",fontSize:8,color:C.accent,borderBottom:`1px solid ${C.accent}`,paddingBottom:2}}>SOFT</span>
              <span style={{gridColumn:"span 3",textAlign:"center",fontSize:8,color:C.purple,borderBottom:`1px solid ${C.purple}`,paddingBottom:2}}>HEAVY</span>
              <span style={{gridColumn:"span 3",textAlign:"center",fontSize:8,color:C.gold,  borderBottom:`1px solid ${C.gold}`,  paddingBottom:2}}>DIST</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:CT,gap:2,padding:"3px 4px 5px",fontSize:7}}>
              <span style={{color:C.muted}}>RUNNER</span>
              {COLS.map(c=><span key={c.key} style={{textAlign:"center",color:c.color,fontWeight:700}}>{c.sub}</span>)}
            </div>
            {aRunners.map((r,i)=>{
              const ex=extra[r.name]||{};
              const filled=hasData(ex);
              return(
                <div key={r.name} style={{display:"grid",gridTemplateColumns:CT,gap:2,padding:"6px 4px",background:i%2===0?C.panel:C.alt,borderBottom:`1px solid ${C.border}`,alignItems:"center",borderLeft:filled?`3px solid ${C.accent}`:`3px solid transparent`}}>
                  <div>
                    <div style={{fontSize:9,fontWeight:600,color:filled?C.text:"#8a9bb0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</div>
                    <div style={{fontSize:7,color:C.muted}}>F:{r.form}</div>
                  </div>
                  {COLS.map(c=><Num key={c.key} value={parseInt(ex[c.key])||0} onChange={v=>setField(r.name,c.key,v)}/>)}
                </div>
              );
            })}
            <div style={{display:"grid",gridTemplateColumns:CT,gap:2,padding:"3px 4px",fontSize:6,color:C.muted,marginTop:1}}>
              <span></span>
              {COLS.map(c=><span key={c.key} style={{textAlign:"center",color:c.color}}>{c.sub==="W"?"w":c.sub==="P"?"p":"r"}</span>)}
            </div>
            <div style={{marginTop:6,padding:"6px 4px",fontSize:8,color:C.muted,lineHeight:1.6}}>
              W=wins · P=2nd/3rd (60% credit) · R=runs · <span style={{color:C.accent}}>SOFT</span> and <span style={{color:C.purple}}>HEAVY</span> scored separately — soft weighted {(gw.soft*100).toFixed(0)}% vs heavy {(gw.heavy*100).toFixed(0)}% on this going.
            </div>
            <button onClick={runAnalysis} style={{marginTop:10,width:"100%",background:C.accent,color:"#000",border:"none",padding:"11px",fontFamily:"inherit",fontSize:11,fontWeight:700,letterSpacing:2,cursor:"pointer",borderRadius:3}}>RUN ANALYSIS →</button>
          </div>
        )}

        {tab==="results"&&results&&(
          <div style={{marginTop:12}}>
            {top&&(
              <div style={{background:C.panel,border:`1px solid ${C.accent}`,borderRadius:4,padding:"12px 14px",marginBottom:14}}>
                <div style={{fontSize:9,color:C.accent,letterSpacing:3,marginBottom:4}}>STAR TOP PICK</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                  <div>
                    <div style={{fontSize:16,fontWeight:900}}>{top.name} <span style={{fontSize:10,color:C.muted,fontWeight:400}}>(B{top.barrier})</span></div>
                    <div style={{fontSize:9,color:C.muted,marginTop:2}}>{top.trainer} · F:{top.form} · {top.weight}kg</div>
                    {hasData(top._ex)&&(
                      <div style={{fontSize:8,marginTop:3,lineHeight:1.7}}>
                        <span style={{color:C.blue}}>TRK {top._ex.track_wins||0}W {top._ex.track_places||0}P/{top._ex.track_runs||0}</span>
                        {" · "}
                        <span style={{color:C.accent}}>SFT {top._ex.soft_wins||0}W {top._ex.soft_places||0}P/{top._ex.soft_runs||0}</span>
                        {" · "}
                        <span style={{color:C.purple}}>HVY {top._ex.heavy_wins||0}W {top._ex.heavy_places||0}P/{top._ex.heavy_runs||0}</span>
                        {" · "}
                        <span style={{color:C.gold}}>DST {top._ex.dist_wins||0}W {top._ex.dist_places||0}P/{top._ex.dist_runs||0}</span>
                      </div>
                    )}
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:22,fontWeight:900,color:C.accent}}>{(top.prob*100).toFixed(1)}%</div>
                    <div style={{fontSize:10,color:C.muted}}>WIN ${top.win_odds}</div>
                  </div>
                </div>
                {(()=>{const t=edgeTag(top.prob,top.win_odds);return t?<div style={{marginTop:8,fontSize:9,fontWeight:700,letterSpacing:2,color:t.color,borderTop:`1px solid ${C.border}`,paddingTop:8}}>{t.label} — {((top.prob-1/top.win_odds)*100).toFixed(1)}% edge</div>:null;})()}
              </div>
            )}

            <div style={{fontSize:8,color:C.muted,letterSpacing:1,marginBottom:4,display:"grid",gridTemplateColumns:"20px 1fr 44px 46px 46px 52px",gap:4,padding:"0 6px"}}>
              <span></span><span>RUNNER</span><span style={{textAlign:"right"}}>PROB</span><span style={{textAlign:"right"}}>WIN</span><span style={{textAlign:"right"}}>PLC</span><span style={{textAlign:"right"}}>EDGE</span>
            </div>

            {results.map((r,i)=>{
              const tag=edgeTag(r.prob,r.win_odds);
              const d=hasData(r._ex);
              return(
                <div key={r.name} style={{display:"grid",gridTemplateColumns:"20px 1fr 44px 46px 46px 52px",gap:4,padding:"9px 6px",background:i%2===0?C.panel:C.alt,borderBottom:`1px solid ${C.border}`,alignItems:"center",borderLeft:d?`3px solid ${C.blue}`:`3px solid transparent`}}>
                  <span style={{fontSize:10,color:i===0?C.accent:C.muted,fontWeight:i===0?700:400}}>{i+1}</span>
                  <div>
                    <div style={{fontSize:11,fontWeight:i<3?700:400,color:i===0?C.text:"#b0bec5"}}>{r.name}</div>
                    <div style={{fontSize:8,color:C.muted}}>{r.trainer?.split(" ").slice(-1)[0]} · F:{r.form}</div>
                    {d&&(
                      <div style={{fontSize:7,marginTop:1}}>
                        <span style={{color:C.accent}}>S:{r._ex.soft_wins||0}W {r._ex.soft_places||0}P/{r._ex.soft_runs||0}</span>
                        {" "}
                        <span style={{color:C.purple}}>H:{r._ex.heavy_wins||0}W {r._ex.heavy_places||0}P/{r._ex.heavy_runs||0}</span>
                      </div>
                    )}
                  </div>
                  <span style={{textAlign:"right",fontSize:12,fontWeight:700,color:i===0?C.accent:C.text}}>{(r.prob*100).toFixed(1)}%</span>
                  <span style={{textAlign:"right",fontSize:11}}>${r.win_odds}</span>
                  <span style={{textAlign:"right",fontSize:11,color:C.muted}}>{r.place_odds?`$${r.place_odds}`:"-"}</span>
                  <span style={{textAlign:"right",fontSize:9,fontWeight:700,letterSpacing:1,color:tag?.color??C.muted}}>{tag?.label??"-"}</span>
                </div>
              );
            })}

            <div style={{marginTop:16,fontSize:9,color:C.muted,letterSpacing:1.5,marginBottom:8}}>SCORE BREAKDOWN — TOP 3</div>
            {results.slice(0,3).map((r,i)=>(
              <div key={r.name} style={{background:C.panel,border:`1px solid ${i===0?C.accentDim:C.border}`,borderRadius:4,padding:"10px 14px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:11,fontWeight:700,color:i===0?C.accent:C.text}}>{r.name}</span>
                  <span style={{fontSize:11,color:C.muted}}>{(r.prob*100).toFixed(1)}%</span>
                </div>
                {Object.entries(r.scores).map(([k,v])=>{
                  const isGoing=k==="goingPref", isTrack=k==="trackAffinity", isDist=k==="distancePref";
                  const pct=Math.min(v*100,100);
                  const col=pct>70?C.accent:pct>45?C.gold:C.red;
                  const lc=isGoing?C.accent:isTrack?C.blue:isDist?C.gold:C.muted;
                  return(
                    <div key={k} style={{marginBottom:5}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                        <span style={{fontSize:8,color:lc,letterSpacing:1}}>{k.replace(/([A-Z])/g," $1").toUpperCase()}</span>
                        <span style={{fontSize:8,color:C.muted}}>{pct.toFixed(0)}</span>
                      </div>
                      <div style={{flex:1,height:3,background:C.border,borderRadius:2}}>
                        <div style={{width:`${pct}%`,height:"100%",background:col,borderRadius:2}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {tab==="load"&&(
          <div style={{marginTop:12}}>
            <div style={{fontSize:10,color:C.muted,letterSpacing:1.5,marginBottom:6}}>PASTE NEW RACE JSON</div>
            <textarea value={json} onChange={e=>setJson(e.target.value)}
              placeholder='{ "race": { "track": "...", "race_number": 1, "distance": 1200, "class": "BM64", "going": "Soft (5)" }, "runners": [...] }'
              style={{width:"100%",height:180,background:C.panel,border:`1px solid ${C.border}`,color:C.text,fontFamily:"inherit",fontSize:11,padding:10,resize:"vertical",outline:"none",boxSizing:"border-box",borderRadius:4}}/>
            {err&&<div style={{color:C.red,fontSize:10,marginTop:4}}>Error: {err}</div>}
            <button onClick={runCustom} style={{marginTop:10,background:C.accent,color:"#000",border:"none",padding:"9px 20px",fontFamily:"inherit",fontSize:10,fontWeight:700,letterSpacing:2,cursor:"pointer",borderRadius:3}}>LOAD AND RUN</button>
          </div>
        )}

        <div style={{marginTop:14,padding:"8px 10px",background:C.panel,border:`1px solid ${C.border}`,borderRadius:4,fontSize:8,display:"flex",flexWrap:"wrap",gap:"3px 14px"}}>
          <span style={{color:"#00e87a"}}>VALUE over 6%</span>
          <span style={{color:"#f5c842"}}>SLIGHT 2-6%</span>
          <span style={{color:"#6b7f8f"}}>FAIR</span>
          <span style={{color:"#ff4d4d"}}>AVOID</span>
          <span style={{color:C.blue}}>data entered</span>
        </div>

      </div>
    </div>
  );
}
