function renderTransitFeature(){
  const box=el('featureTransit'),from=PLACES[state.selectedIndex],to=featureAlt();
  box.innerHTML=`<div class="feature-title">대중교통을 반영한 대체 해설지 이동</div><div class="feature-desc">대체지까지의 실제 버스·지하철 경로는 지도 서비스로 넘기고, 실서비스에서는 부산버스정보시스템 API의 정류소·노선·도착예정 정보를 결합합니다.</div>`;
  if(!to||to===from){box.innerHTML+=`<div class="transit-card"><div class="tiny-note">현재 조건에서 연결할 대체 해설지가 없습니다. 다른 언어·시간을 선택하거나 ‘언어지원 동선’을 이용하세요.</div></div>`;return}
  const km=dist(from,to).toFixed(2);
  box.innerHTML+=`<div class="transit-card"><div class="transit-row"><span>출발</span><b>${from.name}</b></div><div class="transit-row"><span>대체 해설지</span><b>${to.name}</b></div><div class="transit-row"><span>공개 좌표 직선거리</span><b>${km}km*</b></div><div class="inline-actions"><a class="mini-btn blue" href="${transitUrl(from,to)}" target="_blank" rel="noopener">대중교통 길찾기 열기</a><a class="mini-btn" href="${DATA_LINKS.bims}" target="_blank" rel="noopener">부산버스 실시간</a><a class="mini-btn" href="${DATA_LINKS.bus}" target="_blank" rel="noopener">버스 OpenAPI</a></div><div class="micro-source">PoC는 API 키 없이도 실제 길찾기로 연결합니다. 버스 정류소·실시간 도착예정은 <a href="${DATA_LINKS.bus}" target="_blank" rel="noopener">부산광역시 부산버스정보시스템 OpenAPI</a> 연계 지점으로 분리했습니다.</div></div>`;
}
function guideGeneric(p,lang){
  const intro=GUIDE_INTRO[p.name]?.[lang];
  const hours=`${p.summer_start}~${p.summer_end}`;
  const support=[['English','en'],['日本語','ja'],['中文','zh']].filter(x=>p[x[1]]==='Y').map(x=>x[0]).join(' · ');
  if(lang==='en')return `${intro||p.name+' is one of Busan\'s public cultural-tourism guide locations.'} The published guide-house data lists the address as ${p.address}, guide hours as ${hours}, and registered foreign-language support as ${support||'none of the three listed languages'}. On-site availability may vary, so please confirm before visiting.`;
  if(lang==='ja')return `${intro||p.name+'は釜山の文化観光解説拠点の一つです。'} 公開データ上の住所は「${p.address}」、案内時間は${hours}、登録されている外国語対応は${support||'3言語とも登録なし'}です。実際の当日対応は変動するため、訪問前に確認してください。`;
  return `${intro||p.name+'是釜山文化旅游解说服务点之一。'} 公开数据中的地址为“${p.address}”，解说服务时间为${hours}，登记的外语支持为${support||'三种语言均未登记'}。当天实际服务可能变化，建议到访前再次确认。`;
}
function guideAnswer(p,lang,q){
  const qq=(q||'').toLowerCase();
  if(/시간|운영|open|hour|時間|几点|时间/.test(qq)){
    if(lang==='en')return `${p.name}: published guide hours are ${p.summer_start}–${p.summer_end}. Regular holiday information: ${p.holiday}.`;
    if(lang==='ja')return `${p.name}の公開案内時間は${p.summer_start}〜${p.summer_end}です。定休日情報は「${p.holiday}」です。`;
    return `${p.name}公开的解说服务时间为${p.summer_start}至${p.summer_end}，休息日信息为“${p.holiday}”。`;
  }
  if(/언어|language|英語|日本語|中文|语言/.test(qq)){
    const yes=[['English','en'],['日本語','ja'],['中文','zh']].filter(x=>p[x[1]]==='Y').map(x=>x[0]).join(' · ')||'-';
    if(lang==='en')return `Registered foreign-language support for ${p.name}: ${yes}. This is a published capability flag, not a guarantee that a specific interpreter is on duty today.`;
    if(lang==='ja')return `${p.name}の公開データ上の外国語対応は「${yes}」です。これは登録情報であり、当日の担当者勤務を保証するものではありません。`;
    return `${p.name}公开数据中登记的外语支持为“${yes}”。这是登记信息，并不保证当天一定有对应语言的解说员在岗。`;
  }
  return guideGeneric(p,lang);
}
function speakText(text,lang){
  if(!('speechSynthesis' in window)){el('voiceStatus').textContent='이 브라우저에서는 음성합성(TTS)을 지원하지 않습니다.';return}
  speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text.replace(/<[^>]*>/g,''));u.lang=LANG_SPEECH[lang]||'ko-KR';u.rate=.95;speechSynthesis.speak(u);el('voiceStatus').textContent='🔊 안내를 음성으로 재생 중입니다.';
}
function renderRagFeature(){
  const p=PLACES[state.selectedIndex],lang=state.tourLang;
  el('featureRag').innerHTML=`<div class="feature-title">공식 관광정보 RAG 다국어 해설 + TTS</div><div class="feature-desc">PoC는 검증된 공식 구조화 정보와 사전 검증 요약을 검색해 답변합니다. 실서비스에서는 한국관광공사 TourAPI를 검색 원천으로 연결합니다.</div><div class="rag-input"><input id="ragQuestion" aria-label="공식정보 질문" placeholder="예: 운영시간이 궁금해요 / Tell me about this place"><button type="button" id="ragAsk" class="mini-btn blue">공식정보 검색</button></div><div id="ragResult" class="rag-result"><div class="tiny-note">질문을 입력하거나 바로 ‘공식정보 검색’을 누르면 ${p.name} 정보를 ${LANG_NAME[lang]}로 안내합니다.</div></div>`;
  el('ragAsk').addEventListener('click',()=>{
    const q=el('ragQuestion').value,answer=guideAnswer(PLACES[state.selectedIndex],state.tourLang,q);state.lastGuideText=answer;
    el('ragResult').innerHTML=`<div class="rag-answer">${answer}</div><div class="inline-actions"><button type="button" id="ragSpeak" class="mini-btn green">🔊 음성으로 듣기</button><a class="mini-btn" href="${DATA_LINKS.tour}" target="_blank" rel="noopener">TourAPI 원천</a></div><div class="rag-source">현재 PoC 사실필드: 부산관광공사 공개데이터 · 예약/운영 재확인: Visit Busan · 배포 단계 검색원천: 한국관광공사 TourAPI</div>`;
    el('ragSpeak').addEventListener('click',()=>speakText(state.lastGuideText,state.tourLang));
  });
}
function clearRouteMap(){
  if(state.mapReady&&state.tourMap){if(state.routeLine){state.tourMap.removeLayer(state.routeLine);state.routeLine=null}state.routeMarkers.forEach(m=>state.tourMap.removeLayer(m));state.routeMarkers=[]}
}
function makeLanguageRoute(maxStops){
  const start=PLACES[state.selectedIndex],lang=state.tourLang,date=el('date').value,time=el('time').value;
  let candidates=PLACES.map((p,idx)=>({...p,idx})).filter(p=>p[lang]==='Y'&&openRule(p,date,time).open);
  const route=[]; let cursor=start;
  if(start[lang]==='Y'&&openRule(start,date,time).open){route.push({...start,idx:state.selectedIndex,km:0});candidates=candidates.filter(x=>x.idx!==state.selectedIndex)}
  while(route.length<maxStops&&candidates.length){candidates.sort((a,b)=>dist(cursor,a)-dist(cursor,b));const next=candidates.shift();next.km=dist(cursor,next);route.push(next);cursor=next}
  return route;
}
function drawLanguageRoute(route){
  clearRouteMap();if(!state.mapReady||!state.tourMap||!route.length)return;
  const start=PLACES[state.selectedIndex],coords=[[start.lat,start.lon],...route.filter(r=>r.name!==start.name).map(r=>[r.lat,r.lon])];
  if(coords.length>1){state.routeLine=L.polyline(coords,{color:'#5c48d8',weight:4,opacity:.82}).addTo(state.tourMap);state.tourMap.fitBounds(state.routeLine.getBounds(),{padding:[55,55],maxZoom:12})}
  route.forEach((r,i)=>{const ic=L.divIcon({className:'',html:`<div style="width:30px;height:30px;border-radius:10px;background:#5c48d8;color:#fff;display:grid;place-items:center;font-weight:900;border:2px solid white;box-shadow:0 3px 9px rgba(0,0,0,.2)">${i+1}</div>`,iconSize:[30,30],iconAnchor:[15,26]});const m=L.marker([r.lat,r.lon],{icon:ic,zIndexOffset:950}).bindPopup(`<b>${i+1}. ${r.name}</b><br>${LANG_NAME[state.tourLang]} 지원`);m.addTo(state.tourMap);state.routeMarkers.push(m)})
}
function renderRouteFeature(){
  el('featureRoute').innerHTML=`<div class="feature-title">언어지원 중심 여행 동선 재구성</div><div class="feature-desc">현재 시간에 선택 언어를 지원하는 해설지를 거리순으로 연결합니다. 일반 관광추천이 아니라 ‘사람 해설을 받을 수 있는 동선’에 집중합니다.</div><div class="route-controls"><select id="routeStops" aria-label="방문 지점 수"><option value="2">2개 해설지</option><option value="3" selected>3개 해설지</option><option value="4">4개 해설지</option></select><button type="button" id="makeRoute" class="mini-btn blue">동선 만들기</button></div><div id="routeResult" class="route-result" style="margin-top:8px"><div class="tiny-note">언어·날짜·시간 조건을 바꾸면 동선 후보도 다시 계산됩니다.</div></div>`;
  el('makeRoute').addEventListener('click',()=>{const route=makeLanguageRoute(Number(el('routeStops').value));if(!route.length){el('routeResult').innerHTML='<div class="tiny-note">현재 조건에서 운영 중인 언어지원 해설지를 찾지 못했습니다.</div>';clearRouteMap();return}let total=0;let h='';route.forEach((r,i)=>{total+=r.km||0;h+=`<div class="route-stop"><span class="route-num">${i+1}</span><span><b>${r.name}</b><small>${r.district} · ${LANG_NAME[state.tourLang]} 지원 · ${openRule(r,el('date').value,el('time').value).reason}</small></span><span class="route-km">${i===0&&r.name===PLACES[state.selectedIndex].name?'현재지':(r.km||0).toFixed(2)+'km*'}</span></div>`});el('routeResult').innerHTML=h+`<div class="micro-source">구간 직선거리 합계 약 ${total.toFixed(2)}km*. 실제 이동시간은 대중교통 길찾기에서 확인합니다.</div>`;drawLanguageRoute(route)})
}
function submitFeedback(result){
  const p=PLACES[state.selectedIndex],lang=state.tourLang,record={id:Date.now(),place:p.name,lang,date:el('date').value,time:el('time').value,result,published:p[lang],created:new Date().toISOString()};state.feedback.push(record);safeLocalSet('bguide_feedback_v1',state.feedback);
  const mismatch=(record.published==='Y'&&result==='no')||(record.published==='N'&&result==='yes');
  el('feedbackResult').innerHTML=`${mismatch?'⚠ 공개데이터와 실제 이용 경험이 달라 <b>데이터 재확인 후보</b>로 기록했습니다.':'피드백을 기록했습니다.'} <span style="color:#697383">현재 브라우저 누적 ${state.feedback.length}건</span>`;el('feedbackResult').classList.add('show');renderFeedbackAudit();
}
function renderFeedbackFeature(){
  const p=PLACES[state.selectedIndex];
  el('featureFeedback').innerHTML=`<div class="feature-title">현장 이용 피드백 → 데이터 품질 개선</div><div class="feature-desc">실제 방문 결과가 공개데이터와 달랐는지 최소 입력으로 남깁니다. 초기 PoC에는 기존 피드백 통계를 임의로 만들지 않습니다.</div><div class="feedback-choices"><button type="button" class="feedback-btn yes" data-fb="yes">👍 안내 받음</button><button type="button" class="feedback-btn no" data-fb="no">👎 받지 못함</button><button type="button" class="feedback-btn" data-fb="unknown">확인 못함</button></div><div id="feedbackResult" class="feedback-result"></div><div class="micro-source">${p.name} · ${LANG_NAME[state.tourLang]} · 공개데이터 등록값 ${p[state.tourLang]}</div>`;
  el('featureFeedback').querySelectorAll('[data-fb]').forEach(b=>b.addEventListener('click',()=>submitFeedback(b.dataset.fb)));
}
function setFeature(name){
  state.activeFeature=name;document.querySelectorAll('.feature-tab').forEach(b=>b.classList.toggle('on',b.dataset.feature===name));['Transit','Rag','Route','Feedback'].forEach(n=>el('feature'+n).classList.toggle('show',n.toLowerCase()===name));
  if(name==='transit')renderTransitFeature();if(name==='rag')renderRagFeature();if(name==='route')renderRouteFeature();if(name==='feedback')renderFeedbackFeature();
}
function renderAllFeatures(){renderTransitFeature();renderRagFeature();renderRouteFeature();renderFeedbackFeature();setFeature(state.activeFeature)}
