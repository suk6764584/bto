function parseVoice(text){
  const lower=text.toLowerCase();let lang=null;Object.entries(LANG_WORDS).forEach(([k,words])=>{if(words.some(w=>lower.includes(w.toLowerCase())))lang=k});
  let idx=PLACES.findIndex(p=>lower.includes(p.name.toLowerCase()));
  if(idx<0){for(const [alias,names] of Object.entries(PLACE_ALIASES)){if(lower.includes(alias.toLowerCase())){idx=PLACES.findIndex(p=>names.includes(p.name));if(idx>=0)break}}}
  if(lang)setLang('tour',lang);if(idx>=0){state.selectedIndex=idx;el('place').value=idx;state.selectedAlt=null;updateTour(true)}
  return {lang,idx};
}
function startVoice(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){el('voiceStatus').textContent='이 브라우저는 STT를 지원하지 않습니다. Chrome/Edge에서 확인하세요.';return}
  const r=new SR();r.lang='ko-KR';r.interimResults=false;r.maxAlternatives=1;el('voiceAsk').classList.add('listening');el('voiceStatus').textContent='듣고 있습니다… 관광지와 필요한 언어를 말해 주세요.';
  r.onresult=e=>{const t=e.results[0][0].transcript;const parsed=parseVoice(t);el('voiceStatus').textContent=`“${t}” 인식${!parsed.lang&&parsed.idx<0?' · 장소/언어를 찾지 못했습니다.':''}`};r.onerror=e=>el('voiceStatus').textContent=`음성 인식 오류: ${e.error}`;r.onend=()=>el('voiceAsk').classList.remove('listening');r.start();
}
function renderSignalPanel(date,district){
  const festivals=activeFestivals(date,district),cruises=activeCruises(date);let h=`<h3>운영 주의 신호</h3><div class="signal-sub">공식 일정 존재 여부만 표시합니다. 관광객 수·언어 수요 확률로 변환하지 않습니다.</div>`;
  if(festivals.length)festivals.slice(0,4).forEach(e=>h+=`<div class="signal-item"><b>${e.name}<span class="signal-tag">축제·행사</span></b><small>${e.start}~${e.end}${e.district!=='all'?' · '+e.district:''}</small></div>`);else h+='<div class="signal-item"><small>선택일의 내장 Visit Busan 일정 중 활성 행사가 없습니다.</small></div>';
  if(cruises.length)cruises.forEach(e=>h+=`<div class="signal-item"><b>${e.name}<span class="signal-tag cruise">크루즈</span></b><small>${e.note}</small></div>`);
  h+=`<div class="signal-item"><b>2026 부산항 크루즈 운영 맥락<span class="signal-tag cruise">BPA</span></b><small>부산항만공사 발표 기준 2026년 420항차 예정, 이 중 중국발 173항차. 선택일의 최신 입항 스케줄은 체인포털에서 별도 확인합니다.</small><div class="inline-actions"><a class="mini-btn" href="${DATA_LINKS.events}" target="_blank" rel="noopener">Visit Busan 일정</a><a class="mini-btn" href="${DATA_LINKS.cruise}" target="_blank" rel="noopener">BPA 크루즈 스케줄</a></div></div>`;
  el('signalPanel').innerHTML=h;
}
function renderFeedbackAudit(){
  const box=el('feedbackAudit');if(!box)return;let h='<h3>현장 피드백 데이터 점검</h3><div class="signal-sub">사용자가 직접 남긴 기록만 집계합니다.</div>';
  if(!state.feedback.length){box.innerHTML=h+'<div class="signal-item"><small>아직 수집된 피드백이 없습니다.</small></div>';return}
  const recent=[...state.feedback].slice(-6).reverse();recent.forEach(r=>{const mismatch=(r.published==='Y'&&r.result==='no')||(r.published==='N'&&r.result==='yes');const label=r.result==='yes'?'안내 받음':r.result==='no'?'받지 못함':'확인 못함';h+=`<div class="audit-row"><b>${r.place} · ${LANG_NAME[r.lang]}</b><span class="${mismatch?'audit-alert':''}">${label}${mismatch?' · 재확인 후보':''}</span></div>`});box.innerHTML=h;
}

function adminNearest(p){
  return nearestOptions(p,state.adminLang,el('adminDate').value,el('adminTime').value,99)[0]||null;
}
function renderAdmin(){
  const lang=state.adminLang,date=el('adminDate').value,time=el('adminTime').value,d=el('district').value;
  const scope=PLACES.filter(p=>d==='all'||p.district===d), open=scope.filter(p=>openRule(p,date,time).open), support=open.filter(p=>p[lang]==='Y');
  const gaps=open.filter(p=>p[lang]==='N').map(p=>({p,n:adminNearest(p)})).sort((a,b)=>{
    const av=a.n?a.n.km:-1,bv=b.n?b.n.km:-1;return bv-av;
  });
  el('sumOpen').textContent=`${open.length}개`; el('sumSupport').textContent=`${support.length}개`; el('sumGap').textContent=`${gaps.length}개`;
  const distances=gaps.filter(x=>x.n).map(x=>x.n.km); el('sumLongest').textContent=distances.length?`${Math.max(...distances).toFixed(2)}km`:'-';
  const coverage=open.length?Math.round(support.length/open.length*100):0;el('sumCoverage').textContent=`${coverage}%`;el('coverageFill').style.width=`${coverage}%`;
  renderSignalPanel(date,d);renderFeedbackAudit();
  el('adminMapStatus').textContent=`${d==='all'?'부산 전체':d} · ${LANG_NAME[lang]} · 공백 ${gaps.length}`;
  el('gapList').innerHTML=gaps.length?gaps.map(x=>`<button type="button" class="gap-row" data-name="${x.p.name}"><span><b>${x.p.name}</b><small>${x.p.district} · 최근접 ${x.n?x.n.name:'대안 없음'}</small></span><span class="gap-km">${x.n?x.n.km.toFixed(2)+'km':'-'}</span></button>`).join(''):'<div style="padding:14px;font-size:12px;color:#697383">현재 조건에서 운영 중 안내 공백이 없습니다.</div>';
  document.querySelectorAll('.gap-row').forEach(b=>b.addEventListener('click',()=>selectAdminPlace(PLACES.find(p=>p.name===b.dataset.name))));
  renderAdminMap();
}
function renderAdminMap(){
  if(state.mapReady!==true||!state.adminMap)return;
  clearMapMarkers(state.adminMarkers,state.adminMap,'adminLine');el('adminMapInfo').classList.remove('show');
  const lang=state.adminLang,date=el('adminDate').value,time=el('adminTime').value,d=el('district').value;
  const pts=PLACES.filter(p=>d==='all'||p.district===d).filter(p=>!state.showGap||markerStatus(p,lang,date,time)==='bad');
  pts.forEach(p=>{
    const st=markerStatus(p,lang,date,time),icon=L.divIcon({className:'',html:markerHtml(st,false,false,LANG_SHORT[lang]),iconSize:[30,30],iconAnchor:[15,26]});
    const m=L.marker([p.lat,p.lon],{icon}).bindPopup(popupHtml(p,lang,date,time));m.on('click',()=>selectAdminPlace(p));m.addTo(state.adminMap);state.adminMarkers.push(m);
  });
  if(pts.length&&d!=='all')state.adminMap.fitBounds(L.latLngBounds(pts.map(p=>[p.lat,p.lon])),{padding:[45,45],maxZoom:13});
  else if(d==='all')state.adminMap.setView([35.16,129.07],11);
}
function selectAdminPlace(p){
  if(!p)return;const n=adminNearest(p),lang=state.adminLang,date=el('adminDate').value,time=el('adminTime').value;
  el('adminMapInfo').innerHTML=`<b>${p.name}</b><p>${LANG_NAME[lang]} ${p[lang]==='Y'?'지원':'미지원'} · ${openRule(p,date,time).reason}${n?`<br>최근접 운영 지원지: ${n.name} · ${n.km.toFixed(2)}km*`:''}</p>`;el('adminMapInfo').classList.add('show');
  document.querySelectorAll('.gap-row').forEach(r=>r.classList.toggle('active',r.dataset.name===p.name));
  if(state.mapReady===true&&state.adminMap){
    if(state.adminLine)state.adminMap.removeLayer(state.adminLine);
    if(n){state.adminLine=L.polyline([[p.lat,p.lon],[n.lat,n.lon]],{color:'#0078ff',weight:3,dashArray:'7 7'}).addTo(state.adminMap);state.adminMap.fitBounds(state.adminLine.getBounds(),{padding:[60,60],maxZoom:13})}
    else state.adminMap.setView([p.lat,p.lon],13);
  }
}
function setLang(group,lang){
  state[group+'Lang']=lang;
  document.querySelectorAll(`#${group==='tour'?'tourLangs':'adminLangs'} .chip`).forEach(b=>b.classList.toggle('on',b.dataset.lang===lang));
  if(group==='tour'){state.selectedAlt=null;clearRouteMap();updateTour(false)} else renderAdmin();
}
document.querySelectorAll('.feature-tab').forEach(b=>b.addEventListener('click',()=>setFeature(b.dataset.feature)));
el('voiceAsk').addEventListener('click',startVoice);
el('tourLangs').addEventListener('click',e=>{const b=e.target.closest('[data-lang]');if(b)setLang('tour',b.dataset.lang)});
el('adminLangs').addEventListener('click',e=>{const b=e.target.closest('[data-lang]');if(b)setLang('admin',b.dataset.lang)});
['place','date','time'].forEach(id=>el(id).addEventListener('change',()=>{state.selectedAlt=null;clearRouteMap();updateTour(false)}));
el('check').addEventListener('click',()=>updateTour(true));
['district','adminDate','adminTime'].forEach(id=>el(id).addEventListener('change',renderAdmin));
el('showAll').addEventListener('click',()=>{state.showGap=false;el('showAll').classList.add('on');el('showGap').classList.remove('on');renderAdmin()});
el('showGap').addEventListener('click',()=>{state.showGap=true;el('showGap').classList.add('on');el('showAll').classList.remove('on');renderAdmin()});
function switchTab(tour){
  el('tourView').classList.toggle('active',tour);el('adminView').classList.toggle('active',!tour);
  el('tabTour').classList.toggle('active',tour);el('tabAdmin').classList.toggle('active',!tour);
  el('tabTour').setAttribute('aria-selected',String(tour));el('tabAdmin').setAttribute('aria-selected',String(!tour));
  setTimeout(()=>{if(tour&&state.tourMap)state.tourMap.invalidateSize();if(!tour&&state.adminMap){state.adminMap.invalidateSize();renderAdmin()}},100);
}
el('tabTour').addEventListener('click',()=>switchTab(true));el('tabAdmin').addEventListener('click',()=>switchTab(false));
updateTour(false);renderAdmin();loadLeaflet();
