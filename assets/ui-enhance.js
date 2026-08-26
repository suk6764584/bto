(function(){
  function enhanceResult(){
    const box=document.getElementById('result'); if(!box||!window.PLACES||!window.state)return;
    const p=PLACES[state.selectedIndex], lang=state.tourLang, op=openRule(p,document.getElementById('date').value,document.getElementById('time').value), st=markerStatus(p,lang,document.getElementById('date').value,document.getElementById('time').value);
    const title=box.querySelector('.status-title'), meta=box.querySelector('.status-meta');
    if(title){title.textContent=st==='ok'?`${p.name}에서 ${LANG_NAME[lang]} 안내 지원정보를 확인했습니다.`:st==='bad'?`${p.name}은 현재 ${LANG_NAME[lang]} 안내를 제공하지 않습니다.`:`${p.name}은 현재 입력 시간에 운영하지 않습니다.`}
    if(meta){meta.textContent=`이유: ${st==='bad'?LANG_NAME[lang]+' 지원정보 없음 · ':''}${op.reason}`}
    const actions=[...box.querySelectorAll('.actions .action')]; if(actions.length<4)return;
    const target=state.selectedAlt!=null&&PLACES[state.selectedAlt]?PLACES[state.selectedAlt]:p;
    actions[0].textContent='⌖ 길찾기'; actions[0].href=state.selectedAlt!=null?transitUrl(p,target):`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`;
    actions[1].textContent='♧ 해설 예약'; actions[1].href=target.reservation_url||p.reservation_url; actions[1].target='_blank'; actions[1].rel='noopener';
    actions[2].textContent='☎ 1330 연결'; actions[2].href='tel:1330';
    actions[3].textContent='◖ AI 해설 듣기'; actions[3].removeAttribute('href');
  }
  const result=document.getElementById('result'); if(result)new MutationObserver(enhanceResult).observe(result,{childList:true,subtree:true});
  setTimeout(enhanceResult,50);
})();
