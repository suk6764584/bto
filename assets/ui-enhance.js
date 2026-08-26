(function(){
  // GitHub Pages에서 상대경로 CSS가 캐시/배포 타이밍 문제로 누락될 경우를 대비한 이중 fallback.
  const hasAppStyle=()=>{
    const h=document.querySelector('.app-header');
    if(!h)return false;
    const s=getComputedStyle(h);
    return s.position==='sticky' && parseInt(s.height,10)>=60;
  };
  function addCriticalFallback(){
    if(document.getElementById('bguide-critical-fallback'))return;
    const st=document.createElement('style');
    st.id='bguide-critical-fallback';
    st.textContent=`
      *{box-sizing:border-box}html,body{margin:0;background:#f5f8fc;color:#344055;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif}button,input,select{font:inherit}button{cursor:pointer}a{text-decoration:none;color:inherit}
      .app-header{height:68px;background:linear-gradient(90deg,#063f8f,#074d9e);color:#fff;position:sticky;top:0;z-index:1200;box-shadow:0 2px 10px rgba(0,31,79,.15)}
      .app-header-inner{height:100%;max-width:1680px;margin:auto;padding:0 24px;display:grid;grid-template-columns:minmax(360px,1fr) auto minmax(120px,.35fr);align-items:center;gap:18px}.brand{display:flex;align-items:center;gap:11px}.brand-symbol{width:40px;height:40px;border:1px solid rgba(255,255,255,.28);border-radius:12px;display:grid;place-items:center}.brand-copy strong{display:block;font-size:18px}.brand-copy small{display:block;color:#d6e6fb;font-size:10px;margin-top:2px}.top-nav{height:100%;display:flex}.top-nav button{border:0;background:transparent;color:#dce9fb;padding:0 24px;font-size:13px;font-weight:800}.top-nav button.active{color:#fff;background:rgba(255,255,255,.07)}.header-meta{justify-self:end;font-size:12px}
      .app-main{max-width:1680px;margin:auto;padding:14px 20px 36px}.view{display:none}.view.active{display:block}.top-summary{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}.summary-card{background:#fff;border:1px solid #dfe6ef;border-radius:13px;padding:12px 16px}.summary-title{font-size:13px;color:#142033}.summary-card p{margin:7px 0 0;font-size:11px;color:#758096}.steps,.data-badges,.admin-menu-chips{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:9px;font-size:11px}.steps i{font-style:normal;width:20px;height:20px;border-radius:50%;border:1px solid #dce4ee;display:inline-grid;place-items:center;margin-right:4px}
      .tour-layout{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(520px,.92fr);gap:12px;min-height:720px}.map-shell,.tour-side,.analysis-card,.feedback-audit,.signal-panel{background:#fff;border:1px solid #dfe6ef;border-radius:14px;overflow:hidden}.map-shell{position:relative}.map-shell #tourMap{height:720px;width:100%}.map-shell #adminMap{height:620px;width:100%}.tour-side{padding:13px;overflow:auto;max-height:720px}.filter-grid{display:grid;grid-template-columns:1.25fr .9fr .9fr .8fr;gap:8px}.field label{display:block;font-size:10px;font-weight:850;margin:0 0 5px 2px}.field select,.field input{width:100%;height:42px;border:1px solid #d8e0ea;border-radius:9px;padding:0 10px;background:#fff}.lang-chips{height:42px;display:flex;align-items:center;gap:4px;border:1px solid #d8e0ea;border-radius:9px;padding:4px}.chip{border:0;border-radius:7px;padding:7px 9px;background:#f4f6f9}.chip.on{background:#eaf3ff;color:#0867d8}.primary-check{width:100%;height:42px;margin-top:9px;border:0;border-radius:10px;background:#086be8;color:#fff;font-weight:900}.result{margin-top:10px}.status-card{border:1px solid #dfe6ef;border-radius:12px;padding:14px 15px}.status-card.bad{background:#fff0f1;border-color:#f2c4c7}.status-card.ok{background:#eaf8f1;border-color:#c9ead9}.status-title{font-size:18px;font-weight:900}.status-meta{font-size:11px;color:#68758a;margin-top:5px}.alt-list{display:flex;flex-direction:column;gap:6px}.alt{width:100%;border:1px solid #dfe6ef;background:#fff;border-radius:10px;padding:8px 9px;display:grid;grid-template-columns:28px 1fr auto;gap:9px;align-items:center;text-align:left}.rank{width:26px;height:26px;border-radius:50%;background:#0b8b52;color:#fff;display:grid;place-items:center;font-weight:900}.actions{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:9px}.action{border:0;border-radius:9px;min-height:43px;padding:7px;background:#086be8;color:#fff;font-weight:900}.quick-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}.quick-card{border:1px solid #dfe6ef;border-radius:10px;background:#fff;padding:10px;text-align:left}.feature-dock{margin-top:10px;border-top:1px solid #edf1f6;padding-top:10px}.feature-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.feature-tab{border:1px solid #dfe6ef;background:#fff;border-radius:8px;padding:8px}.feature-tab.on{background:#eef6ff;color:#075fc7}.feature-panel{display:none;margin-top:7px;border:1px solid #dfe6ef;border-radius:10px;padding:10px}.feature-panel.show{display:block}
      .admin-filters{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr)) auto;gap:8px;margin:12px 0}.admin-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px}.kpi{background:#fff;border:1px solid #dfe6ef;border-radius:12px;padding:12px}.admin-layout{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(520px,.95fr);gap:12px}.analysis-stack{display:flex;flex-direction:column;gap:10px}.analysis-card,.feedback-audit,.signal-panel{padding:12px}.analysis-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      @media(max-width:980px){.app-header{height:auto}.app-header-inner{grid-template-columns:1fr;padding:12px 14px}.top-nav{height:44px}.header-meta{display:none}.top-summary{grid-template-columns:1fr}.tour-layout,.admin-layout{grid-template-columns:1fr}.tour-side{max-height:none}.filter-grid{grid-template-columns:1fr 1fr}.admin-kpis{grid-template-columns:1fr 1fr}.map-shell #tourMap{height:58vh;min-height:430px}.actions{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(st);
  }
  function ensureAppStyles(){
    if(hasAppStyle())return;
    const cdn=document.createElement('link');
    cdn.rel='stylesheet';
    cdn.href='https://cdn.jsdelivr.net/gh/suk6764584/bto@main/assets/styles.css?v=20260826-1505';
    cdn.onload=()=>setTimeout(()=>{if(!hasAppStyle())addCriticalFallback()},80);
    cdn.onerror=addCriticalFallback;
    document.head.appendChild(cdn);
    setTimeout(()=>{if(!hasAppStyle())addCriticalFallback()},1800);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureAppStyles); else ensureAppStyles();

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
