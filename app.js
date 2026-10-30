'use strict';

// FRED 시계열과 Yahoo Finance 일봉 데이터를 직접 받아 요약·차트를 그립니다.
const PROXY_BASE = 'https://fomc.mcraft-tiger-574.workers.dev';
const $ = id => document.getElementById(id);
const blank = '—';

const rows = [
  ['기준금리', [
    {id:'fedupper',name:'기준금리 (Upper-Limit)',source:'fred',ticker:'DFEDTARU',unit:'%',decimals:2},
    {id:'fedlower',name:'기준금리 (Lower-Limit)',source:'fred',ticker:'DFEDTARL',unit:'%',decimals:2}
  ]],
  ['국채금리', [
    {id:'us2y',name:'2년물 국채금리',source:'treasury',treasuryField:'BC_2YEAR',unit:'%',decimals:3},
    {id:'us10y',name:'10년물 국채금리',source:'treasury',treasuryField:'BC_10YEAR',unit:'%',decimals:3},
    {id:'us30y',name:'30년물 국채금리',source:'treasury',treasuryField:'BC_30YEAR',unit:'%',decimals:3}
  ]],
  ['기대 인플레이션', [
    {id:'t1yie',name:'1년 기대 인플레이션',source:'fred',ticker:'EXPINF1YR',unit:'%',decimals:2},
    {id:'t5yie',name:'5년 기대 인플레이션',source:'fred',ticker:'T5YIE',unit:'%',decimals:2},
    {id:'t10yie',name:'10년 기대 인플레이션',source:'fred',ticker:'T10YIE',unit:'%',decimals:2},
    {id:'t5yifr',name:'5년 후 5년 기대 인플레이션',source:'fred',ticker:'T5YIFR',unit:'%',decimals:2}
  ]],
  ['PCE', [
    {id:'pce',name:'PCE',source:'fred',ticker:'DPCERV1Q225SBEA',unit:'%',decimals:2,rateSeries:'publishedRate',frequency:'quarterly',basisShort:'SAAR',basisDescription:'전분기 대비 연율(SAAR)'},
    {id:'corepce',name:'근원 PCE',source:'fred',ticker:'DPCCRV1Q225SBEA',unit:'%',decimals:2,rateSeries:'publishedRate',frequency:'quarterly',basisShort:'SAAR',basisDescription:'전분기 대비 연율(SAAR)'}
  ]],
  ['CPI', [
    {id:'cpi',name:'CPI',source:'fred',ticker:'CPIAUCNS',unit:'%',decimals:1,rateSeries:'yearOverYear',basisShort:'전년동월',basisDescription:'전년 동월 대비 · 비계절조정'},
    {id:'corecpi',name:'근원 CPI',source:'fred',ticker:'CPILFENS',unit:'%',decimals:1,rateSeries:'yearOverYear',basisShort:'전년동월',basisDescription:'전년 동월 대비 · 비계절조정'}
  ]],
  ['PPI', [
    {id:'ppi',name:'PPI',source:'fred',ticker:'PPIFIS',unit:'%',decimals:2,rateSeries:'monthOverMonth',basisShort:'전월',basisDescription:'전월 대비 · 계절조정'},
    {id:'coreppi',name:'근원 PPI',source:'fred',ticker:'PPIFES',unit:'%',decimals:2,rateSeries:'monthOverMonth',basisShort:'전월',basisDescription:'식품·에너지 제외 · 전월 대비 · 계절조정'}
  ]],
  ['고용', [
    {id:'unrate',name:'실업률',source:'fred',ticker:'UNRATE',unit:'%',decimals:2},
    {id:'payems',name:'비농업 고용자 수',source:'fred',ticker:'PAYEMS',unit:'천 명',decimals:0,scale:0.001,displayUnit:'백만 명'}
  ]],
  ['시간당 평균 임금', [
    {id:'wage',name:'시간당 평균 임금',source:'fred',ticker:'CES0500000003',unit:'달러',decimals:2},
    {id:'wageyoy',name:'전년 대비 상승률 (Average Hourly Earnings)',source:'fred',ticker:'CES0500000003',unit:'%',decimals:2,rateSeries:'yearOverYear',basisShort:'전년 대비',basisDescription:'Average Hourly Earnings · 전년 대비'}
  ]],
  ['실업수당 청구건수', [
    {id:'icsa',name:'신규 실업수당 청구건수',source:'fred',ticker:'ICSA',unit:'건',decimals:0},
    {id:'ccsa',name:'계속 실업수당 청구건수',source:'fred',ticker:'CCSA',unit:'건',decimals:0}
  ]],
  ['구인·참가율', [
    {id:'jolts',name:'JOLTS 구인건수',source:'fred',ticker:'JTSJOL',unit:'천 건',decimals:0},
    {id:'civpart',name:'경제활동 참가율',source:'fred',ticker:'CIVPART',unit:'%',decimals:2}
  ]],
  ['GDP', [
    {id:'gdp',name:'GDP',source:'fred',ticker:'GDP',unit:'십억 달러',decimals:0,scale:0.001,displayUnit:'조 달러'},
    {id:'gdpgrowth',name:'GDP 성장률',source:'fred',ticker:'A191RL1Q225SBEA',unit:'%',decimals:2}
  ]],
  ['산업', [
    {id:'indpro',name:'산업생산지수',source:'fred',ticker:'INDPRO',unit:'지수',decimals:2},
    {id:'tcu',name:'산업 가동률',source:'fred',ticker:'TCU',unit:'%',decimals:2}
  ]],
  ['소비·심리', [
    {id:'rsafs',name:'소매판매',source:'fred',ticker:'RSAFS',unit:'백만 달러',decimals:0,scale:0.001,displayUnit:'십억 달러'},
    {id:'retailmom',name:'소매판매 전월 대비',source:'fred',ticker:'MARTSMPCSM44X72USS',unit:'%',decimals:2,rateSeries:'publishedRate',basisShort:'전월 대비',basisDescription:'미국 Census Bureau · 계절조정 · 전월 대비'},
    {id:'income',name:'개인소득',source:'fred',ticker:'PI',unit:'십억 달러',decimals:0,scale:0.001,displayUnit:'조 달러'},
    {id:'umcsent',name:'미시간대 소비자심리지수',source:'fred',ticker:'UMCSENT',unit:'지수',decimals:1}
  ]],
  ['달러·금리선물', [
    {id:'dxy',name:'달러 인덱스',source:'yahoo',ticker:'DX-Y.NYB',unit:'지수',decimals:2},
    {id:'fedfuture',name:'기준금리 선물 내재금리',source:'yahoo',ticker:'ZQ=F',unit:'%',decimals:2,transform:v=>100-v}
  ]],
  ['국제 유가', [
    {id:'wti',name:'WTI 유가',source:'fred',ticker:'DCOILWTICO',unit:'달러/배럴',decimals:2,basisDescription:'미국 에너지정보청(EIA) · 일일 현물가격 · 달러/배럴'},
    {id:'brent',name:'브렌트유 유가',source:'fred',ticker:'DCOILBRENTEU',unit:'달러/배럴',decimals:2,basisDescription:'미국 에너지정보청(EIA) · 일일 현물가격 · 달러/배럴'}
  ]],
];
const all = rows.flatMap((row, rowIndex) => row[1].map(item => ({...item,group:row[0],rowIndex})));
const charts = new Map();
const chartCards = new Map();

function fmt(value, decimals=2) {
  if (!Number.isFinite(value)) return blank;
  return value.toLocaleString('ko-KR',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
}
function shownValue(item,value) {
  const n = value;
  const unit = item.displayUnit || item.unit;
  return `${fmt(n,item.decimals)}${unit==='%'?'%':unit==='지수'?'':` ${unit}`}`;
}
function signed(value,decimals=2) {
  if (!Number.isFinite(value)) return blank;
  return `${value>0?'+':''}${fmt(value,decimals)}`;
}
function dateLabel(date) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('ko-KR',{timeZone:'UTC',year:'numeric',month:'2-digit',day:'2-digit'});
}
function itemDateLabel(item,date) {
  if(item.frequency==='quarterly') {
    const d=new Date(`${date}T00:00:00Z`);
    return `${d.getUTCFullYear()}년 ${Math.floor(d.getUTCMonth()/3)+1}분기`;
  }
  return dateLabel(date);
}
function deriveRateSeries(item,rawValues) {
  const monthKey=date=>date.slice(0,7);
  const byMonth=new Map(rawValues.map(v=>[monthKey(v.date),v]));
  if(item.rateSeries==='yearOverYear') {
    return rawValues.map(v=>{
      const d=new Date(`${v.date}T00:00:00Z`); d.setUTCFullYear(d.getUTCFullYear()-1);
      const prior=byMonth.get(monthKey(d.toISOString().slice(0,10)));
      if(!prior || prior.value===0) return null;
      return {...v,value:(v.value/prior.value-1)*100};
    }).filter(Boolean);
  }
  if(item.rateSeries==='monthOverMonth') {
    return rawValues.map(v=>{
      const d=new Date(`${v.date}T00:00:00Z`); d.setUTCMonth(d.getUTCMonth()-1);
      const prior=byMonth.get(monthKey(d.toISOString().slice(0,10)));
      if(!prior || prior.value===0) return null;
      return {...v,value:Number(((v.value/prior.value-1)*100).toFixed(1))};
    }).filter(Boolean);
  }
  // DPCERV1Q225SBEA / DPCCRV1Q225SBEA are already published quarterly
  // percent-change-at-annual-rate series. Do not average monthly values or
  // annualize them a second time; each FRED observation is one quarter's rate.
  if(item.rateSeries==='publishedRate') return rawValues;
  if(item.frequency==='quarterly') {
    const quarters=new Map();
    rawValues.forEach(v=>{
      const d=new Date(`${v.date}T00:00:00Z`);
      const year=d.getUTCFullYear(), quarter=Math.floor(d.getUTCMonth()/3)+1;
      const key=`${year}-Q${quarter}`;
      if(!quarters.has(key)) quarters.set(key,{year,quarter,values:[]});
      quarters.get(key).values.push(v.value);
    });
    const averages=[...quarters.values()].filter(q=>q.values.length===3).sort((a,b)=>a.year-b.year||a.quarter-b.quarter).map(q=>({...q,average:q.values.reduce((a,b)=>a+b,0)/3}));
    return averages.slice(1).map((q,i)=>{
      const previous=averages[i].average;
      const month=String(q.quarter*3).padStart(2,'0');
      const date=`${q.year}-${month}-01`;
      return {date,time:Math.floor(Date.parse(`${date}T00:00:00Z`)/1000),value:(Math.pow(q.average/previous,4)-1)*100};
    });
  }
  return rawValues;
}
function proxyUrl(target) { return `${PROXY_BASE}/?url=${encodeURIComponent(target)}`; }

function makeSummary() {
  const root=$('summaryRows'); root.innerHTML='';
  rows.forEach(([group,items])=>{
    // 소비·심리는 [소매판매, 전월 대비], [개인소득, 소비자심리] 두 줄로 구성합니다.
    const chunks=group==='소비·심리'?[items.slice(0,2),items.slice(2)]:[items];
    chunks.forEach(chunk=>{
      const line=document.createElement('div'); line.className='summary-row';
      const metrics=document.createElement('div');
      metrics.className=`metrics ${chunk.length===1?'single':chunk.length===2?'double':chunk.length===4?'quadruple':'triple'}${group==='실업수당 청구건수'?' claims-metrics':''}${group==='소비·심리'?' consumer-metrics':''}${group==='국제 유가'?' oil-metrics':''}`;
      chunk.forEach(item=>{
        const chip=document.createElement('article'); chip.className='metric'; chip.dataset.summaryId=item.id;
        const top=document.createElement('div'); top.className='metric-top';
        const name=document.createElement('span'); name.className='metric-name'; name.textContent=item.name;
        const source=document.createElement('span'); source.className='metric-source'; source.textContent=item.basisShort || (item.source==='fred'?'FRED':item.ticker);
        top.append(name,source);
        const value=document.createElement('strong'); value.className='metric-value'; value.textContent='불러오는 중…';
        const change=document.createElement('span'); change.className='metric-change neutral'; change.textContent='—';
        chip.append(top,value,change); metrics.append(chip);
      });
      line.append(metrics); root.append(line);
    });
  });
}

function makeCharts() {
  const root=$('charts'); root.innerHTML='';
  rows.forEach(([group,items],index)=>{
    const section=document.createElement('section'); section.className='chart-group';
    const heading=document.createElement('div'); heading.className='section-heading group-heading';
    heading.innerHTML=`<div><span class="eyebrow">INDICATOR GROUP ${String(index+1).padStart(2,'0')}</span><h2>${group}</h2></div>`;
    const grid=document.createElement('div'); grid.className=`chart-grid${group==='실업수당 청구건수'?' claims-grid':''}${group==='소비·심리'?' consumer-grid':''}${group==='국제 유가'?' oil-grid':''}`;
    items.forEach(item=>{
      const card=document.createElement('article'); card.className='chart-card';
      const head=document.createElement('div'); head.className='chart-head';
      const title=document.createElement('b'); title.textContent=item.name;
      const link=document.createElement('a');
      link.href=item.source==='fred'?`https://fred.stlouisfed.org/series/${item.ticker}`:`https://finance.yahoo.com/quote/${encodeURIComponent(item.ticker)}/`;
      link.target='_blank'; link.rel='noopener noreferrer'; link.textContent='원자료 ↗';
      head.append(title,link);
      const quote=document.createElement('div'); quote.className='chart-quote';
      quote.innerHTML='<strong class="chart-latest">—</strong><span class="chart-change neutral">데이터 조회 중</span><small class="chart-date"></small>';
      const area=document.createElement('div'); area.className='chart-area'; area.id=`chart-${item.id}`;
      const foot=document.createElement('div'); foot.className='chart-foot'; foot.textContent=item.source==='treasury'?`미국 재무부 일일 국채수익률 · ${item.treasuryField}`:`${item.ticker} · ${item.source==='fred'?'FRED':'Yahoo Finance'}`;
      card.append(head,quote,area,foot); grid.append(card); chartCards.set(item.id,card);
    });
    section.append(heading,grid); root.append(section);
  });
}

async function fetchFred(item) {
  // FRED 전용 Worker 경로를 사용합니다. 전체 URL 허용목록 검사로 인한 403을 피합니다.
  const endpoint=`${PROXY_BASE}/fred.csv?series=${encodeURIComponent(item.ticker)}&start=2015-01-01`;
  const response=await fetch(endpoint,{cache:'no-store',headers:{'Accept':'text/csv,text/plain,*/*'}});
  if(!response.ok){
    let detail='';
    try{detail=(await response.text()).slice(0,220);}catch{}
    throw new Error(`FRED 데이터 연결 HTTP ${response.status}${detail?`: ${detail}`:''}`);
  }
  const csv=(await response.text()).replace(/^\uFEFF/,'').trim();
  if(!/^observation_date,/i.test(csv)) {
    let detail=csv.slice(0,260).replace(/\s+/g,' ');
    try { const payload=JSON.parse(csv); detail=payload.error || payload.message || payload.detail || JSON.stringify(payload).slice(0,220); } catch {}
    throw new Error(`FRED CSV 형식이 아닙니다: ${detail || '빈 응답'} · Worker의 /fred.csv 경로 및 배포 버전을 확인하세요`);
  }
  const values=csv.split(/\r?\n/).slice(1).map(line=>{
    const parts=line.split(','); const date=(parts[0]||'').trim(); const raw=(parts[1]||'').trim();
    const value=raw==='.'||raw===''?NaN:Number(raw);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(value)) return null;
    const normalized=value; // ICSA·CCSA는 이미 건 단위 원자료이므로 추가로 1,000으로 나누지 않습니다.
    return {time:Math.floor(Date.parse(`${date}T00:00:00Z`)/1000),value:item.transform?item.transform(normalized):normalized,date};
  }).filter(Boolean);
  if(values.length<2) throw new Error('FRED 관측값 부족');
  const derived=item.rateSeries?deriveRateSeries(item,values):values;
  if(derived.length<2) throw new Error(`${item.name} 변환 후 관측값 부족`);
  return derived;
}

async function fetchTreasury(item) {
  // 장전 체크리스트와 동일한 미국 재무부 공식 일일 수익률 자료를 사용합니다.
  const year = new Date().getFullYear();
  const target = `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=${year}`;
  const response = await fetch(proxyUrl(target), {cache:'no-store', headers:{'Accept':'application/xml,text/xml,*/*'}});
  if (!response.ok) {
    let detail=''; try { detail=(await response.text()).slice(0,180); } catch {}
    throw new Error(`미국 재무부 데이터 HTTP ${response.status}${detail?`: ${detail}`:''}`);
  }
  const xml = await response.text();
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('미국 재무부 XML 응답을 해석하지 못했습니다');
  const entries = [...doc.getElementsByTagName('entry')];
  const values = entries.map(entry => {
    const dateNode = entry.getElementsByTagName('d:NEW_DATE')[0] || entry.getElementsByTagName('NEW_DATE')[0] || [...entry.getElementsByTagName('*')].find(node => node.localName === 'NEW_DATE');
    const valueNode = [...entry.getElementsByTagName('*')].find(node => node.localName === item.treasuryField);
    const date = (dateNode?.textContent || '').trim().slice(0,10);
    const value = Number((valueNode?.textContent || '').trim());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(value) || value <= 0) return null;
    return {date, time:Math.floor(Date.parse(`${date}T00:00:00Z`)/1000), value};
  }).filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date));
  if (values.length < 2) throw new Error(`${item.name} 미국 재무부 관측값 부족`);
  return values;
}

async function fetchYahoo(item) {
  const target=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.ticker)}?range=5y&interval=1d&events=div%2Csplits`;
  const response=await fetch(proxyUrl(target),{cache:'no-store',headers:{'Accept':'application/json,*/*'}});
  if(!response.ok){let detail='';try{detail=(await response.text()).slice(0,180);}catch{}throw new Error(`데이터 프록시 HTTP ${response.status}${detail?`: ${detail}`:''}`);}
  const json=await response.json(); const result=json?.chart?.result?.[0];
  if(!result) throw new Error(json?.chart?.error?.description||'Yahoo 시계열 없음');
  const timestamps=result.timestamp||[]; const closes=result.indicators?.quote?.[0]?.close||[];
  const values=[];
  timestamps.forEach((time,i)=>{
    const raw=closes[i]; if(raw===null||raw===undefined||!Number.isFinite(Number(raw))) return;
    const value=item.transform?item.transform(Number(raw)):Number(raw);
    values.push({time,value,date:new Date(time*1000).toISOString().slice(0,10)});
  });
  if(values.length<2) throw new Error('Yahoo 관측값 부족');
  return values;
}

function renderItem(item,values) {
  const last=values[values.length-1],prev=values[values.length-2];
  const deltaRaw=last.value-prev.value;
  const delta=deltaRaw;
  const pct=prev.value!==0?deltaRaw/Math.abs(prev.value)*100:null;
  const card=chartCards.get(item.id);
  const summary=document.querySelector(`[data-summary-id="${item.id}"]`);
  if(summary){
    summary.querySelector('.metric-value').textContent=shownValue(item,last.value);
    const change=summary.querySelector('.metric-change');
    const unit=item.unit==='%'?'%p':item.displayUnit?` ${item.displayUnit}`:item.unit==='지수'?'':` ${item.unit}`;
    const relativeChange=item.rateSeries?'':` · ${pct===null?blank:`${pct>0?'+':''}${fmt(pct,2)}%`}`;
    change.textContent=`${signed(delta,item.decimals)}${unit}${relativeChange} · ${itemDateLabel(item,last.date)}`;
    change.className=`metric-change ${delta>0?'up':delta<0?'down':'neutral'}`;
  }
  if(!card) throw new Error(`차트 카드 요소를 찾을 수 없습니다: ${item.id}`);
  const latestEl=card.querySelector('.chart-latest');
  const changeEl=card.querySelector('.chart-change');
  const dateEl=card.querySelector('.chart-date');
  const footEl=card.querySelector('.chart-foot');
  if(!latestEl || !changeEl || !dateEl || !footEl) throw new Error(`차트 내부 요소가 누락되었습니다: ${item.id}`);
  latestEl.textContent=shownValue(item,last.value);
  const relativeChange=item.rateSeries?'':` · ${pct===null?blank:`${pct>0?'+':''}${fmt(pct,2)}%`}`;
  changeEl.textContent=`${signed(delta,item.decimals)}${item.unit==='%'?'%p':item.displayUnit?` ${item.displayUnit}`:item.unit==='지수'?'':` ${item.unit}`}${relativeChange}`;
  changeEl.className=`chart-change ${delta>0?'up':delta<0?'down':'neutral'}`;
  dateEl.textContent=`최근 관측일 ${itemDateLabel(item,last.date)} · 직전 관측 대비`;
  const area=$(`chart-${item.id}`);
  if(!area) throw new Error(`차트 영역을 찾을 수 없습니다: ${item.id}`);
  area.innerHTML='';
  if(!window.LightweightCharts){area.textContent='차트 라이브러리를 불러오지 못했습니다.';return;}
  const chart=LightweightCharts.createChart(area,{
    width:area.clientWidth||320,height:220,
    layout:{background:{type:'solid',color:'#ffffff'},textColor:'#8995a6',fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif',fontSize:10},
    grid:{vertLines:{color:'#f0f3f7'},horzLines:{color:'#f0f3f7'}},
    rightPriceScale:{borderColor:'#e6eaf1',scaleMargins:{top:.12,bottom:.12}},
    timeScale:{borderColor:'#e6eaf1',timeVisible:false,rightOffset:2,barSpacing:7,minBarSpacing:.5},
    localization:{locale:'ko-KR',priceFormatter:v=>fmt(v,item.decimals)}
  });
  const series=chart.addLineSeries({color:delta>=0?'#d84a4a':'#3478d4',lineWidth:2,priceLineVisible:false,lastValueVisible:true,crosshairMarkerVisible:true});
  series.setData(values.map(v=>({time:v.time,value:v.value}))); 
  chart.timeScale().fitContent(); charts.set(item.id,{chart,area});
  footEl.textContent=`${item.ticker} · ${item.basisDescription || '원자료'} · ${values.length.toLocaleString('ko-KR')}개 관측값 · ${itemDateLabel(item,values[0].date)} ~ ${itemDateLabel(item,last.date)}`;
}

async function refreshAll() {
  const button=$('refresh'); button.disabled=true;
  $('status').textContent='지표 데이터 불러오는 중…'; $('updated').textContent='업데이트 중';
  let success=0,fail=0,cursor=0;
  const queue=[...all];
  async function worker(){
    while(cursor<queue.length){
      const item=queue[cursor++];
      try{const values=item.source==='fred'?await fetchFred(item):item.source==='treasury'?await fetchTreasury(item):await fetchYahoo(item);renderItem(item,values);success++;}
      catch(error){
        fail++;
        const message=String(error?.message||error);
        const summary=document.querySelector(`[data-summary-id="${item.id}"]`);
        if(summary){
          const valueEl=summary.querySelector('.metric-value');
          const changeEl=summary.querySelector('.metric-change');
          if(valueEl) valueEl.textContent='자료 없음';
          if(changeEl){changeEl.textContent=message;changeEl.className='metric-change neutral';}
        }
        const area=$(`chart-${item.id}`);
        if(area) area.innerHTML=`<div class="chart-error">${item.name} 그래프를 불러오지 못했습니다.<small>${message.slice(0,160)}</small></div>`;
      }
    }
  }
  await Promise.all([worker(),worker(),worker(),worker(),worker(),worker()]);
  $('updated').textContent=`${new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})} 갱신`;
  $('status').textContent=fail?`정상 ${success}개 · 확인 필요 ${fail}개`:`${success}개 지표 연결 완료`;
  $('status').classList.toggle('error-note',fail>0); button.disabled=false; resizeCharts();
}
function resizeCharts(){for(const {chart,area} of charts.values()){if(area.clientWidth>0)chart.applyOptions({width:area.clientWidth,height:220});}}

makeSummary(); makeCharts(); $('refresh').addEventListener('click',refreshAll);
window.addEventListener('resize',()=>{clearTimeout(window.__fomcResize);window.__fomcResize=setTimeout(resizeCharts,120);});
refreshAll();
