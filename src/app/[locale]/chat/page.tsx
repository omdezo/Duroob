'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { use } from 'react';
import { useSession } from 'next-auth/react';
import {
  Send, Sparkles, MapPin, CalendarDays, Wallet, Loader2,
  Shield, Smile, Copy, Check, ExternalLink, ChevronDown,
  Sun, Mountain, UtensilsCrossed,
} from 'lucide-react';
import { generateItinerary } from '@/lib/planner/itineraryEngine';
import { scorePlan, type TripScores } from '@/lib/planner/tripScorer';
import { usePlannerStore } from '@/store/plannerStore';
import type { PlannerInputs } from '@/types/planner';
import type { ItineraryPlan } from '@/types/itinerary';
import type { Region, Category } from '@/types/destination';
import Link from 'next/link';

const RA:Record<string,string>={muscat:'مسقط',dakhiliya:'الداخلية',sharqiya:'الشرقية',dhofar:'ظفار',batinah:'الباطنة',dhahira:'الظاهرة'};
interface Msg{id:string;role:'user'|'assistant';content:string;plan?:ItineraryPlan;scores?:TripScores;parsed?:Record<string,any>}

// Clean AI response text — strip JSON tool calls, code fences, etc.
function cleanText(raw: string): string {
  let t = raw;
  // Remove JSON tool call blocks
  t = t.replace(/```json[\s\S]*?```/g, '');
  t = t.replace(/```[\s\S]*?```/g, '');
  // Remove raw JSON objects that look like tool calls
  t = t.replace(/\{"tool"\s*:[\s\S]*?\}\s*/g, '');
  // Remove leftover backticks
  t = t.replace(/`{3,}/g, '');
  // Clean up excessive newlines
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

function lp(m:string):Partial<PlannerInputs>|null{const l=m.toLowerCase();const r:Partial<PlannerInputs>={};let o=false;const d=l.match(/(\d+)\s*(?:days?|أيام|يوم|ايام)/);if(d){r.durationDays=Math.min(Math.max(parseInt(d[1]),1),7)as any;o=true}if(/يومين|يومان/.test(l)){r.durationDays=2 as any;o=true}if(/خمس/.test(m)){r.durationDays=5 as any;o=true}if(/ثلاث/.test(m)){r.durationDays=3 as any;o=true}if(/اربع|أربع/.test(m)){r.durationDays=4 as any;o=true}const rm:Record<string,Region>={muscat:'muscat',مسقط:'muscat',salalah:'dhofar',صلالة:'dhofar',صلاله:'dhofar',dhofar:'dhofar',ظفار:'dhofar',nizwa:'dakhiliya',نزوى:'dakhiliya',نزوا:'dakhiliya',dakhiliya:'dakhiliya',الداخلية:'dakhiliya',sharqiya:'sharqiya',الشرقية:'sharqiya',batinah:'batinah',الباطنة:'batinah',dhahira:'dhahira',الظاهرة:'dhahira',sur:'sharqiya',صور:'sharqiya',sohar:'batinah',صحار:'batinah',نخل:'batinah'};const rg=[...new Set(Object.entries(rm).filter(([k])=>l.includes(k)||m.includes(k)).map(([,v])=>v))];if(rg.length){r.preferredRegions=rg;o=true}const cm:Record<string,Category>={beach:'beach',شاطئ:'beach',شواطئ:'beach',بحر:'beach',culture:'culture',ثقافة:'culture',تاريخ:'culture',قلعة:'culture',mountain:'mountain',جبل:'mountain',جبال:'mountain',desert:'desert',صحراء:'desert',food:'food',طعام:'food',أكل:'food',اكل:'food',nature:'nature',طبيعة:'nature',وادي:'nature'};const cs=[...new Set(Object.entries(cm).filter(([k])=>l.includes(k)||m.includes(k)).map(([,v])=>v))];if(cs.length){r.preferredCategories=cs;o=true}const b=l.match(/(\d+)\s*(?:omr|rial|ريال)/);if(b){r.customBudgetOmr=parseInt(b[1]);o=true}return o?r:null}
function bi(p:Partial<PlannerInputs>):PlannerInputs{return{durationDays:(p.durationDays??3)as any,budgetTier:p.budgetTier??'medium',customBudgetOmr:p.customBudgetOmr,travelMonth:(p.travelMonth??(new Date().getMonth()+1))as any,intensity:'balanced',preferredCategories:p.preferredCategories??[],preferredRegions:p.preferredRegions}}

export default function ChatPage({params}:{params:Promise<{locale:string}>}) {
  const {locale}=use(params);
  const ar=locale==='ar';
  const {data:session}=useSession();
  const sp=usePlannerStore(s=>s.setPlan);
  const name=session?.user?.name;

  const [msgs,setMsgs]=useState<Msg[]>([]);
  const [input,setInput]=useState('');
  const [busy,setBusy]=useState(false);
  const [copied,setCopied]=useState<string|null>(null);
  const endRef=useRef<HTMLDivElement>(null);
  const inputRef=useRef<HTMLInputElement>(null);
  const hasPlan=msgs.some(m=>m.plan);
  const empty=msgs.length===0;

  // Auto-scroll only if user is near bottom (within 300px)
  useEffect(()=>{
    const container = endRef.current?.parentElement;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;
    if (isNearBottom) endRef.current?.scrollIntoView({behavior:'smooth'});
  },[msgs,busy]);
  const dc=useCallback(async(id:string,t:string)=>{await navigator.clipboard.writeText(t).catch(()=>{});setCopied(id);setTimeout(()=>setCopied(null),1500)},[]);

  const send=useCallback(async(text?:string)=>{
    const msg=(text??input).trim();if(!msg||busy)return;
    const aid=`a${Date.now()}`;
    setMsgs(p=>[...p,{id:`u${Date.now()}`,role:'user',content:msg}]);
    setInput('');setBusy(true);
    const up=(patch:Partial<Msg>)=>setMsgs(p=>{const i=p.findIndex(m=>m.id===aid);const b:Msg={id:aid,role:'assistant',content:''};if(i===-1)return[...p,{...b,...patch}];const n=[...p];n[i]={...n[i],...patch};return n});
    try{
      const h=msgs.slice(-8).map(m=>({role:m.role,content:m.content}));
      const res=await fetch('/api/chat/sessions/local/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:msg,locale,history:h})});
      if(!res.ok||!res.body)throw new Error();
      const reader=res.body.getReader();const dec=new TextDecoder();let buf='';
      while(true){const{done,value}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});const lines=buf.split('\n');buf=lines.pop()??'';for(const ln of lines){if(!ln.startsWith('data: '))continue;try{const d=JSON.parse(ln.slice(6));if(d.content)up({content:d.content});if(d.durationDays!==undefined)up({parsed:d});if(d.result?.plan){up({plan:d.result.plan,scores:d.result.scores});sp(d.result.plan,d.result.scores,'chat')}}catch{}}}
    }catch{
      const parsed=lp(msg);
      if(parsed&&(parsed.durationDays||parsed.preferredRegions?.length)){
        const inp=bi(parsed);const plan=generateItinerary(inp);const scores=scorePlan(plan);sp(plan,scores,'chat');
        const stops=plan.days.reduce((s,d)=>s+d.stops.length,0);const regions=[...new Set(plan.days.map(d=>ar?(RA[d.region]||d.region):d.region))];
        up({content:ar?`رحلتك جاهزة! ${stops} محطة في ${regions.join(' و ')}`:`Your trip is ready! ${stops} stops across ${regions.join(' & ')}`,plan,scores,parsed:parsed as any});
      }else{up({content:ar?'مرحباً! جرب: "رحلة 3 أيام مسقط"':'Hi! Try: "3 days in Muscat"'});}
    }finally{setBusy(false);inputRef.current?.focus();}
  },[input,busy,msgs,locale,ar,sp]);

  const sug=ar?[
    {icon:<MapPin size={16}/>,t:'خطط رحلة',d:'3 أيام في مسقط',c:'bg-teal-500'},
    {icon:<Sun size={16}/>,t:'استكشف ظفار',d:'5 أيام طبيعة',c:'bg-amber-500'},
    {icon:<Mountain size={16}/>,t:'مغامرة جبلية',d:'جبال وأودية',c:'bg-emerald-500'},
    {icon:<UtensilsCrossed size={16}/>,t:'جولة طعام',d:'المطبخ العماني',c:'bg-rose-500'},
  ]:[
    {icon:<MapPin size={16}/>,t:'Plan a trip',d:'3 days in Muscat',c:'bg-teal-500'},
    {icon:<Sun size={16}/>,t:'Explore Dhofar',d:'5 day nature trip',c:'bg-amber-500'},
    {icon:<Mountain size={16}/>,t:'Mountain trek',d:'Hiking & wadis',c:'bg-emerald-500'},
    {icon:<UtensilsCrossed size={16}/>,t:'Food tour',d:'Omani cuisine',c:'bg-rose-500'},
  ];

  const chips=hasPlan
    ?(ar?['غير المنطقة','أضف أيام','قارن']:['Change region','Add days','Compare'])
    :(ar?['كيف الطقس؟','معلومات التأشيرة','الأماكن']:['Weather?','Visa info','Places?']);

  return (
    <div dir={ar?'rtl':'ltr'} className="flex flex-col h-[calc(100dvh-64px)]">

      {/* ════════ EMPTY STATE ════════ */}
      {empty?(
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={28} className="text-teal-500"/>
            <h1 className="text-3xl font-medium text-gray-800">
              {name?(ar?`${name}، أهلاً!`:`${name}, hello!`):(ar?'مرحباً!':'Hello!')}
            </h1>
          </div>

          <div className="w-full max-w-xl mt-6">
            <div className="flex items-center bg-white rounded-2xl border border-gray-200 shadow-lg focus-within:border-teal-400 focus-within:shadow-xl transition-all">
              <input ref={inputRef} type="text" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}
                placeholder={ar?'كيف أقدر أساعدك اليوم؟':'How can I help you today?'}
                className="flex-1 px-5 py-5 text-base text-gray-800 placeholder:text-gray-400 bg-transparent outline-none rounded-2xl" disabled={busy}
              />
              <button onClick={()=>send()} disabled={!input.trim()||busy}
                className="me-2 w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-20" aria-label="Send"
              >{busy?<Loader2 size={16} className="animate-spin"/>:<Send size={16} className={ar?'rotate-180':''}/>}</button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {sug.map(s=>(
              <button key={s.t} onClick={()=>send(s.d)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-full text-sm text-gray-600 hover:border-teal-300 hover:text-teal-700 hover:shadow-sm transition-all"
              >
                <span className={`w-6 h-6 ${s.c} rounded-md flex items-center justify-center text-white`}>{s.icon}</span>
                {s.t}
              </button>
            ))}
          </div>
        </div>
      ):(
      /* ════════ CONVERSATION ════════ */
      <>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-5 sm:px-8 py-6 space-y-6">
            {msgs.map(m=>(
              <div key={m.id}>
                {/* USER — right-aligned pill, no avatar */}
                {m.role==='user'&&(
                  <div className="flex justify-end mb-1">
                    <div className="bg-gray-100 text-gray-800 px-4 py-2.5 rounded-2xl rounded-ee-sm text-[14px] max-w-[75%]">
                      {m.content}
                    </div>
                  </div>
                )}

                {/* ASSISTANT — no bubble, just text flowing left, like Claude */}
                {m.role==='assistant'&&(
                  <div className="group relative">
                    {/* Text — plain, cleaned of JSON artifacts */}
                    {m.content&&cleanText(m.content)&&(
                      <div className="text-[15px] leading-[1.8] text-gray-700 whitespace-pre-line [&>p]:mb-2">
                        {cleanText(m.content)}
                      </div>
                    )}

                    {/* Copy btn — appears on hover at top right */}
                    {m.content&&cleanText(m.content)&&(
                      <button onClick={()=>dc(m.id,cleanText(m.content))}
                        className="absolute -top-1 end-0 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center" aria-label="Copy"
                      >{copied===m.id?<Check size={12} className="text-green-500"/>:<Copy size={12} className="text-gray-400"/>}</button>
                    )}

                    {/* Parsed chips */}
                    {m.parsed&&(
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {m.parsed.durationDays&&<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[11px] font-medium"><CalendarDays size={10}/>{m.parsed.durationDays} {ar?'أيام':'days'}</span>}
                        {m.parsed.preferredRegions?.map((r:string)=><span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[11px] font-medium"><MapPin size={10}/>{ar?(RA[r]||r):r}</span>)}
                        {m.parsed.customBudgetOmr&&<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[11px] font-medium"><Wallet size={10}/>{m.parsed.customBudgetOmr} OMR</span>}
                      </div>
                    )}

                    {/* Plan card */}
                    {m.plan&&m.scores&&(()=>{const p=m.plan!;const sc=m.scores!;const ts=p.days.reduce((s,d)=>s+d.stops.length,0);return(
                      <div className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden max-w-lg">
                        <div className="bg-gradient-to-r from-teal-600 to-emerald-500 px-5 py-4">
                          <p className="text-white font-bold text-lg">{ar?`رحلة ${p.days.length} أيام`:`${p.days.length}-Day Trip`}</p>
                          <p className="text-teal-100 text-sm mt-0.5">{p.costBreakdown.grandTotal} {ar?'ر.ع':'OMR'} · {ts} {ar?'محطة':'stops'} · {[...new Set(p.days.map(d=>d.region))].length} {ar?'مناطق':'regions'}</p>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {p.days.map(day=>(
                            <div key={day.dayNumber} className="px-5 py-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center">{day.dayNumber}</span>
                                <span className="text-sm font-medium text-gray-500">{ar?day.regionAr:day.region}</span>
                                <span className="text-xs text-gray-300 ms-auto">{day.totalKm} km</span>
                              </div>
                              <p className="text-sm text-gray-600 ps-8">{day.stops.map((s,i)=><span key={s.destination.id}>{i>0&&<span className="text-gray-300 mx-1.5">→</span>}{s.destination.name[locale as 'en'|'ar']??s.destination.name.en}</span>)}</p>
                            </div>
                          ))}
                        </div>
                        <div className="px-5 py-3 bg-gray-50 border-t flex items-center gap-4 text-sm">
                          <span className="text-teal-600 font-medium flex items-center gap-1"><Shield size={13}/>{sc.safety.toFixed(0)}</span>
                          <span className="text-amber-500 font-medium flex items-center gap-1"><Smile size={13}/>{sc.enjoyment.toFixed(0)}</span>
                          <span className={`ms-auto px-2.5 py-0.5 rounded-full text-xs font-bold ${sc.overall==='excellent'?'bg-green-100 text-green-700':sc.overall==='good'?'bg-yellow-100 text-yellow-700':'bg-orange-100 text-orange-700'}`}>
                            {ar?(sc.overall==='excellent'?'ممتازة':sc.overall==='good'?'جيدة':'مقبولة'):sc.overall}
                          </span>
                        </div>
                        <Link href={`/${locale}/planner`} className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-teal-600 hover:bg-teal-50 transition border-t border-gray-100">
                          <ExternalLink size={14}/>{ar?'عرض الخطة الكاملة':'View Full Itinerary'}
                        </Link>
                      </div>
                    )})()}

                    {/* Separator line between messages */}
                    <div className="border-b border-gray-100 mt-6"/>
                  </div>
                )}
              </div>
            ))}

            {busy&&(
              <div className="flex items-center gap-2 text-gray-400 text-sm py-2 animate-pulse">
                <Loader2 size={16} className="animate-spin text-teal-500"/>
                {ar?'دُروب يفكر...':'Duroob is thinking...'}
              </div>
            )}
            <div ref={endRef}/>
          </div>
        </div>

        {/* Chips + Input */}
        <div className="shrink-0 max-w-3xl mx-auto w-full px-5 sm:px-8 pb-4 pt-1">
          {!busy&&(
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2">
              {chips.map(c=><button key={c} onClick={()=>send(c)} className="px-3 py-1.5 bg-gray-50 hover:bg-teal-50 border border-gray-100 hover:border-teal-200 rounded-lg text-xs text-gray-500 hover:text-teal-600 transition whitespace-nowrap shrink-0">{c}</button>)}
            </div>
          )}
          <div className="flex items-center bg-white rounded-2xl border border-gray-200 shadow-sm focus-within:border-teal-400 focus-within:shadow-md transition-all">
            <input ref={inputRef} type="text" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
              placeholder={ar?'اكتب رسالتك...':'Type your message...'} className="flex-1 px-5 py-4 text-base text-gray-800 placeholder:text-gray-400 bg-transparent outline-none rounded-2xl" disabled={busy}
            />
            <button onClick={()=>send()} disabled={!input.trim()||busy}
              className="me-2 w-9 h-9 bg-teal-600 text-white rounded-xl flex items-center justify-center hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-20" aria-label="Send"
            >{busy?<Loader2 size={14} className="animate-spin"/>:<Send size={14} className={ar?'rotate-180':''}/>}</button>
          </div>
        </div>
      </>
      )}
    </div>
  );
}
