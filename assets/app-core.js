const PLACES=window.APP_DATA.places;
const GUIDE_INTRO=window.APP_DATA.guideIntro;
const FESTIVAL_EVENTS=window.APP_DATA.festivalEvents;
const CRUISE_EVENTS=window.APP_DATA.cruiseEvents;
const DATA_LINKS=window.APP_DATA.dataLinks;

const LANG_NAME={en:'영어',ja:'일본어',zh:'중국어'};

const LANG_SPEECH={en:'en-US',ja:'ja-JP',zh:'zh-CN'};
const LANG_WORDS={en:['english','영어','영문'],ja:['japanese','일본어','日本語','일어'],zh:['chinese','중국어','中文','중문']};
const PLACE_ALIASES={
  '감천':['감천문화마을'], '태종대':['태종대'], '범어사':['범어사'], '용두산':['용두산공원'], 'un':['UN기념공원','UN평화기념관'],
  '부산박물관':['부산박물관문화체험관'], '청사포':['청사포항 다목적센터(청사랑)'], '누리마루':['누리마루APEC 하우스'],
  '시민공원':['부산시민공원'], '임시수도':['임시수도기념관'], '민주항쟁':['민주항쟁기념관'], '수영사적':['수영사적공원']
};

const LANG_SHORT={en:'EN',ja:'日',zh:'中'};
const WEEK={0:'일',1:'월',2:'화',3:'수',4:'목',5:'금',6:'토'};
const el=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const now=new Date();
const today=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
el('date').value=today; el('adminDate').value=today;
PLACES.forEach((p,i)=>{const o=document.createElement('option');o.value=i;o.textContent=`${p.name} · ${p.district}`;el('place').appendChild(o)});
const gamcheonIndex=Math.max(0,PLACES.findIndex(p=>p.name==='감천문화마을')); el('place').value=gamcheonIndex;
[...new Set(PLACES.map(p=>p.district))].sort().forEach(d=>{const o=document.createElement('option');o.value=d;o.textContent=d;el('district').appendChild(o)});

const state={
  selectedIndex:gamcheonIndex,tourLang:'zh',adminLang:'zh',selectedAlt:null,showGap:false,
  mapReady:false,tourMap:null,adminMap:null,tourMarkers:[],adminMarkers:[],tourLine:null,adminLine:null,altMarker:null,
  routeLine:null,routeMarkers:[],activeFeature:'transit',feedback:[],lastGuideText:''
};

function dist(a,b){const R=6371.0088,toRad=x=>x*Math.PI/180;const dLat=toRad(b.lat-a.lat),dLon=toRad(b.lon-a.lon);const q=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
function openRule(p,dateStr,timeStr){
  if(!dateStr||!timeStr)return {open:false,reason:'날짜·시간 미입력'};
  const parts=dateStr.split('-').map(Number), d=new Date(parts[0],parts[1]-1,parts[2]), weekday=WEEK[d.getDay()];
  const regular=(p.holiday||'').split(',').map(x=>x.trim());
  if(regular.includes(weekday))return {open:false,reason:`${weekday}요일 정기휴무`};
  const m=parts[1], summer=m>=4&&m<=10, start=summer?p.summer_start:p.winter_start, end=summer?p.summer_end:p.winter_end;
  if(timeStr<start||timeStr>end)return {open:false,reason:`운영시간 외 ${start}~${end}`};
  return {open:true,reason:`운영시간 내 ${start}~${end}`};
}
function markerStatus(p,lang,date,time){const op=openRule(p,date,time);if(!op.open)return 'closed';return p[lang]==='Y'?'ok':'bad'}
function nearestOptions(src,lang,date,time,limit=3){
  return PLACES.map((p,idx)=>({...p,idx,km:dist(src,p)}))
    .filter(p=>p.idx!==PLACES.indexOf(src)&&p[lang]==='Y'&&openRule(p,date,time).open)
    .sort((a,b)=>a.km-b.km).slice(0,limit);
}
function markerHtml(status,selected=false,alt=false,label=''){return `<div class="marker-pin ${status} ${selected?'selected':''} ${alt?'altpin':''}"><span>${label}</span></div>`}
function popupHtml(p,lang,date,time){
  const op=openRule(p,date,time),st=markerStatus(p,lang,date,time);
  return `<div class="popup-title">${p.name}</div><div class="popup-meta">${p.district} · ${LANG_NAME[lang]} ${st==='ok'?'지원':st==='bad'?'미지원':'운영 외'}<br>${op.reason}<br>${p.address}</div>`;
}
function loadLeaflet(){
  const css=document.createElement('link');css.rel='stylesheet';css.href='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(css);
  const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
  s.onload=initMaps;s.onerror=()=>mapLoadError('지도 라이브러리 연결에 실패했습니다.');document.head.appendChild(s);
  setTimeout(()=>{if(!window.L&&!state.mapReady)mapLoadError('네트워크에서 지도를 불러오지 못했습니다.')},5000);
}
function mapLoadError(msg){
  if(state.mapReady)return;state.mapReady='error';
  ['tourLoading','adminLoading'].forEach(id=>{el(id).innerHTML=`<div class="map-error"><b>${msg}</b><span>이 환경에서는 실제 지도를 표시할 수 없습니다. 인터넷 연결이 가능한 브라우저에서 다시 열면 OpenStreetMap 지도가 표시됩니다. 옆 패널의 데이터 판정·대체지 계산은 그대로 사용할 수 있습니다.</span></div>`;});
}
function initMaps(){
  if(!window.L)return mapLoadError('지도 초기화에 실패했습니다.');
  state.mapReady=true;['tourLoading','adminLoading'].forEach(id=>el(id).classList.add('hidden'));
  state.tourMap=L.map('tourMap',{zoomControl:true,preferCanvas:true}).setView([35.16,129.07],11);
  state.adminMap=L.map('adminMap',{zoomControl:true,preferCanvas:true}).setView([35.16,129.07],11);
  [state.tourMap,state.adminMap].forEach(m=>L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap contributors'}).addTo(m));
  renderTourMap(false);renderAdmin();
  setTimeout(()=>{state.tourMap.invalidateSize();state.adminMap.invalidateSize()},120);
}
function clearMapMarkers(arr,map,lineKey){
  if(!map)return;arr.forEach(m=>map.removeLayer(m));arr.length=0;
  if(state[lineKey]){map.removeLayer(state[lineKey]);state[lineKey]=null}
  if(lineKey==='tourLine'&&state.altMarker){map.removeLayer(state.altMarker);state.altMarker=null}
}
function renderTourMap(fit=false){
  if(state.mapReady!==true||!state.tourMap)return;
  const lang=state.tourLang,date=el('date').value,time=el('time').value;
  clearMapMarkers(state.tourMarkers,state.tourMap,'tourLine');
  const selected=PLACES[state.selectedIndex];
  PLACES.forEach((p,i)=>{
    const st=markerStatus(p,lang,date,time);
    const icon=L.divIcon({className:'',html:markerHtml(st,i===state.selectedIndex,false,LANG_SHORT[lang]),iconSize:i===state.selectedIndex?[36,36]:[30,30],iconAnchor:i===state.selectedIndex?[18,32]:[15,26]});
    const m=L.marker([p.lat,p.lon],{icon,zIndexOffset:i===state.selectedIndex?900:0}).bindPopup(popupHtml(p,lang,date,time));
    m.on('click',()=>{state.selectedIndex=i;el('place').value=i;state.selectedAlt=null;updateTour(false)});
    m.addTo(state.tourMap);state.tourMarkers.push(m);
  });
  const st=markerStatus(selected,lang,date,time),alts=st==='ok'?[]:nearestOptions(selected,lang,date,time,3);
  if(state.selectedAlt==null&&alts.length)state.selectedAlt=alts[0].idx;
  if(state.selectedAlt!=null){
    const alt=PLACES[state.selectedAlt];
    if(alt&&alt!==selected&&alt[lang]==='Y'&&openRule(alt,date,time).open){
      state.tourLine=L.polyline([[selected.lat,selected.lon],[alt.lat,alt.lon]],{color:'#0078ff',weight:3,dashArray:'7 7',opacity:.85}).addTo(state.tourMap);
      const altIcon=L.divIcon({className:'',html:markerHtml('ok',false,true,'↗'),iconSize:[34,34],iconAnchor:[17,30]});
      state.altMarker=L.marker([alt.lat,alt.lon],{icon:altIcon,zIndexOffset:850}).bindPopup(popupHtml(alt,lang,date,time)).addTo(state.tourMap);
      if(fit)state.tourMap.fitBounds(state.tourLine.getBounds(),{padding:[60,60],maxZoom:13});
    }
  }
  if(!state.tourLine&&fit)state.tourMap.setView([selected.lat,selected.lon],13);
  const selectedMarker=state.tourMarkers[state.selectedIndex]; if(selectedMarker)selectedMarker.openPopup();
  el('tourMapStatus').textContent=`${LANG_NAME[lang]} · ${PLACES.filter(p=>p[lang]==='Y').length}/23 지원정보`;
  el('tourMapOpen').textContent=`${PLACES.filter(p=>openRule(p,date,time).open).length}개소 운영 조건 충족`;
}
function updateTour(fit=false){
  state.selectedIndex=Number(el('place').value);
  const p=PLACES[state.selectedIndex],lang=state.tourLang,date=el('date').value,time=el('time').value,op=openRule(p,date,time),st=markerStatus(p,lang,date,time);
  const alts=st==='ok'?[]:nearestOptions(p,lang,date,time,3);
  if(alts.length&&!alts.some(a=>a.idx===state.selectedAlt))state.selectedAlt=alts[0].idx;
  if(!alts.length)state.selectedAlt=null;
  let title=st==='ok'?'공개데이터상 외국어 안내 지원':st==='bad'?'이 관광지는 해당 언어 지원정보 없음':'현재 입력 시간에는 운영하지 않음';
  let h=`<div class="status-card ${st}"><div class="status-title">${title}</div><div class="status-meta">${p.name} · ${LANG_NAME[lang]} · ${op.reason}</div></div>`;
  if(st!=='ok'){
    h+=`<div class="section-label">같은 시간대 가까운 대체 해설지</div><div class="alt-list">`;
    if(alts.length){
      alts.forEach((a,i)=>{h+=`<button type="button" class="alt ${state.selectedAlt===a.idx?'selected':''}" data-alt="${a.idx}"><span class="rank">${i+1}</span><span><b>${a.name}</b><small>${a.district} · ${LANG_NAME[lang]} 지원 · ${openRule(a,date,time).reason}</small></span><span class="dist">${a.km.toFixed(2)}km*</span></button>`})
    } else h+='<div class="tiny-note">현재 입력 조건에서 운영 중이며 해당 언어를 지원하는 대체 해설지를 찾지 못했습니다.</div>';
    h+='</div>';
  } else {
    h+='<div class="tiny-note">지원 Y/N은 등록정보이며 당일 해당 언어 해설사의 실제 근무를 보장하지 않습니다. 방문 전 예약 상태를 확인하세요.</div>';
  }
  h+=`<div class="actions"><a class="action blue" href="${p.reservation_url}" target="_blank" rel="noopener">Visit Busan 예약 확인</a><a class="action" href="tel:1330">1330 관광통역안내</a><button type="button" class="action" id="aiInfo">AI 공식정보 안내 예시</button><button type="button" class="action" id="resetMap">부산 전체 보기</button></div>`;
  el('result').innerHTML=h;
  document.querySelectorAll('[data-alt]').forEach(b=>b.addEventListener('click',()=>{state.selectedAlt=Number(b.dataset.alt);updateTour(true)}));
  el('aiInfo')?.addEventListener('click',showAi);
  el('resetMap')?.addEventListener('click',()=>{state.selectedAlt=null;el('compare').classList.remove('show');if(state.mapReady===true&&state.tourMap)state.tourMap.setView([35.16,129.07],11);renderTourMap(false)});
  if(state.selectedAlt!=null)showCompare();else el('compare').classList.remove('show');
  renderTourMap(fit);
  renderAllFeatures();
}
function showCompare(){
  const from=PLACES[state.selectedIndex],to=PLACES[state.selectedAlt];if(!to)return;
  const date=el('date').value,time=el('time').value,lang=state.tourLang;
  el('compareFrom').innerHTML=`<b>현재 · ${from.name}</b>${LANG_NAME[lang]}: ${from[lang]==='Y'?'지원':'미지원'}<br>${openRule(from,date,time).reason}<br>평균근무인원 ${from.staff}명`;
  el('compareTo').innerHTML=`<b>대안 · ${to.name}</b>${LANG_NAME[lang]}: ${to[lang]==='Y'?'지원':'미지원'}<br>${openRule(to,date,time).reason}<br>직선거리 ${dist(from,to).toFixed(2)}km*`;
  el('compare').classList.add('show');
}
function showAi(){setFeature('rag');const q=el('ragQuestion');if(q){q.focus();q.placeholder='공식 관광정보에서 궁금한 점을 입력하세요.'}}

function safeLocalGet(key){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch(e){return []}}
function safeLocalSet(key,val){try{localStorage.setItem(key,JSON.stringify(val))}catch(e){}}
state.feedback=safeLocalGet('bguide_feedback_v1');
function activeFestivals(date,district='all'){
  return FESTIVAL_EVENTS.filter(e=>date>=e.start&&date<=e.end&&(district==='all'||e.district==='all'||e.district===district));
}
function activeCruises(date){return CRUISE_EVENTS.filter(e=>e.date===date)}
function transitUrl(from,to){
  return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lon}&destination=${to.lat},${to.lon}&travelmode=transit`;
}
function featureAlt(){
  const p=PLACES[state.selectedIndex],lang=state.tourLang,date=el('date').value,time=el('time').value;
  if(state.selectedAlt!=null&&PLACES[state.selectedAlt])return PLACES[state.selectedAlt];
  const a=nearestOptions(p,lang,date,time,1)[0]; return a||null;
}
