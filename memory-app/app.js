/* ================== 設定與資料模型 ================== */
// localStorage 存多清單結構（文字資料）；圖片改存 IndexedDB（避免容量不足）
const LS_KEY = 'mem_multi_lists_v2';
const SORT_MODE_KEY = 'mem_sort_mode'; // 'auto' | 'manual'

let lists = loadLists();
let current = null;                              // null = 首頁；否則為清單名稱（標籤）
let sortMode = localStorage.getItem(SORT_MODE_KEY) || 'auto';

/* ================== 輔助工具 ================== */
const $ = (q)=>document.querySelector(q);
function uuid(){ return (crypto.randomUUID && crypto.randomUUID()) || String(Date.now())+Math.random().toString(16).slice(2); }
function colorFor(text){
  let h=0; for(let i=0;i<text.length;i++){ h=(h*31+text.charCodeAt(i))>>>0; }
  const hue = h % 360; return `hsl(${hue} 70% 45%)`;
}
function saveLists(){ localStorage.setItem(LS_KEY, JSON.stringify(lists)); }
function loadLists(){
  try{
    const data = JSON.parse(localStorage.getItem(LS_KEY));
    if (data && typeof data === 'object') return data;
  }catch{}
  return { '超市': { items:[], staples:[] }, '藥局': { items:[], staples:[] } };
}
async function fileToBlob(file, max=800, quality=0.72){
  if(!file) return null;
  const data = await new Promise((res,rej)=>{
    const fr = new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(file);
  });
  return await new Promise((res)=>{
    const img = new Image(); img.onload=()=>{
      let {width:w,height:h}=img, nw=w, nh=h;
      if(Math.max(w,h)>max){ if(w>=h){nw=max; nh=Math.round(h*(max/w));} else {nh=max; nw=Math.round(w*(max/h));} }
      const c=document.createElement('canvas'); c.width=nw; c.height=nh;
      const ctx=c.getContext('2d'); ctx.drawImage(img,0,0,nw,nh);
      c.toBlob((blob)=>res(blob),'image/jpeg',quality);
    }; img.src=data;
  });
}

/* ================== IndexedDB：只存圖片 Blob ================== */
const DB_NAME = 'memory-images';
const DB_STORE = 'images';
let idb;

// 開啟 DB
(function openIDB(){
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = (e)=>{
    const db = e.target.result;
    if(!db.objectStoreNames.contains(DB_STORE)){
      db.createObjectStore(DB_STORE); // key 為 item.id
    }
  };
  req.onsuccess = ()=>{ idb = req.result; };
  req.onerror = ()=>{ console.warn('IndexedDB 無法開啟，圖片將不會保存到磁碟。', req.error); };
})();

// 存圖片
function idbSaveImage(id, blob){
  return new Promise((res,rej)=>{
    if(!idb || !blob){ res(); return; }
    const tx = idb.transaction(DB_STORE,'readwrite');
    tx.objectStore(DB_STORE).put(blob, id);
    tx.oncomplete = ()=>res();
    tx.onerror = ()=>rej(tx.error);
  });
}
// 讀圖片為 ObjectURL
function idbGetImageURL(id){
  return new Promise((res)=>{
    if(!idb){ res(''); return; }
    const tx = idb.transaction(DB_STORE,'readonly');
    const req = tx.objectStore(DB_STORE).get(id);
    req.onsuccess = ()=>{
      if(req.result){ res(URL.createObjectURL(req.result)); }
      else res('');
    };
    req.onerror = ()=>res('');
  });
}
// 刪圖片
function idbDeleteImage(id){
  return new Promise((res)=>{
    if(!idb){ res(); return; }
    const tx = idb.transaction(DB_STORE,'readwrite');
    tx.objectStore(DB_STORE).delete(id);
    tx.oncomplete = ()=>res();
    tx.onerror = ()=>res();
  });
}

/* ================== 首頁（標籤牆） ================== */
const tagGrid = $('#tagGrid');

function renderHome(){
  $('#title').textContent = '🏷️ 標籤首頁';
  $('#home').hidden = false;
  $('#listPage').hidden = true;
  $('#toolbarHome').hidden = false;
  $('#toolbarList').hidden = true;

  tagGrid.innerHTML = '';
  const names = Object.keys(lists);
  if(names.length===0){
    tagGrid.innerHTML = '<div class="muted">還沒有標籤，點上方「＋ 新增標籤」新增一個吧！</div>';
    return;
  }
  names.forEach(name=>{
    const card = document.createElement('div');
    card.className = 'tagcard';
    card.style.borderLeft = `6px solid ${colorFor(name)}`;

    const row = document.createElement('div'); row.className='row';
    const h3 = document.createElement('h3'); h3.textContent = name;
    const menu = document.createElement('button'); menu.className='tagmenu'; menu.textContent='⋯'; menu.title='管理';
    row.appendChild(h3); row.appendChild(menu);

    const sub = document.createElement('div'); sub.className='muted';
    const total = lists[name].items.length;
    const undone = lists[name].items.filter(i=>!i.checked).length;
    sub.textContent = total ? `未買 ${undone}/${total}` : '尚無項目';

    // 進入清單
    card.addEventListener('click', (e)=>{ if(e.target===menu) return; current = name; renderList(); });

    // 長按/⋯ 管理
    let pressTimer=null;
    const showManage = ()=>{
      const choice = prompt(`管理標籤「${name}」\n輸入代號執行：\n1 = 改名\n2 = 刪除\n（取消=不操作）`);
      if(choice==='1'){
        const nn = prompt('新名稱：', name);
        if(nn && nn.trim()){
          const n = nn.trim();
          if(lists[n] && n!==name){ alert('已存在同名標籤'); return; }
          if(n===name) return;
          lists[n] = lists[name]; delete lists[name]; saveLists(); renderHome();
        }
      }else if(choice==='2'){
        if(confirm(`刪除標籤「${name}」及其清單？`)){
          // 刪除清單內圖片
          Promise.all((lists[name].items||[]).map(it=>idbDeleteImage(it.id))).finally(()=>{
            delete lists[name]; saveLists(); renderHome();
          });
        }
      }
    };
    menu.addEventListener('click', showManage);
    card.addEventListener('pointerdown', ()=>{ pressTimer=setTimeout(showManage,600); });
    card.addEventListener('pointerup', ()=>clearTimeout(pressTimer));
    card.addEventListener('pointerleave', ()=>clearTimeout(pressTimer));

    card.appendChild(row);
    card.appendChild(sub);
    tagGrid.appendChild(card);
  });
}

// 新增標籤
$('#addListBtn').addEventListener('click', ()=>{
  const name = prompt('新標籤名稱（例如：超市、藥局、五金）：');
  if(!name) return;
  const n = name.trim(); if(!n) return;
  if(lists[n]) return alert('已存在相同名稱');
  lists[n] = { items:[], staples:[] };
  saveLists(); renderHome();
});

// 全部匯出（跨標籤，僅文字資料；圖片不含在內）
$('#exportAllBtn').addEventListener('click', ()=>{
  const json = JSON.stringify(lists, null, 2);
  const bytes = new TextEncoder().encode(json);
  const blob  = new Blob([bytes], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='all-lists.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
});

// 全部匯入（合併）
$('#importAllBtn').addEventListener('click', ()=>{
  const input = document.createElement('input'); input.type='file'; input.accept='application/json';
  input.onchange = async ()=>{
    const f = input.files?.[0]; if(!f) return;
    try{
      const text = await f.text(); const data = JSON.parse(text);
      if(data && typeof data==='object'){
        // 簡單覆蓋（若要合併可再做 key 合併）
        lists = data; saveLists(); renderHome();
      }else alert('格式不正確');
    }catch{ alert('無法解析檔案'); }
  }; input.click();
});


/* ================== 清單頁 ================== */
const itemList = $('#itemList');
const searchEl = $('#search');

function renderList(){
  if(!current || !lists[current]){ current=null; return renderHome(); }

  $('#title').textContent = `📝 ${current}`;
  $('#home').hidden = true;
  $('#listPage').hidden = false;
  $('#toolbarHome').hidden = true;
  $('#toolbarList').hidden = false;

  const q = (searchEl.value||'').toLowerCase().trim();
  const showBought = $('#toggleBought').checked;
  const src = lists[current].items;

  // 排序（手動：order；自動：未買優先、近期優先）
  const base = src.slice();
  if(sortMode==='manual'){
    base.sort((a,b)=> (a.order??0)-(b.order??0));
  }else{
    base.sort((a,b)=> Number(a.checked)-Number(b.checked) || b.createdAt - a.createdAt);
  }

  const filtered = base.filter(it=>{
    if(!showBought && it.checked) return false;
    if(!q) return true;
    return (it.title||'').toLowerCase().includes(q) || (it.note||'').toLowerCase().includes(q);
  });

  $('#empty').hidden = filtered.length>0;

  itemList.innerHTML = '';
  filtered.forEach(async (it)=>{
    const card = document.createElement('div');
    card.className='card'; card.dataset.id = it.id;

    const img = document.createElement('img');
    img.className='thumb'; img.alt = it.title||'';
    // 從 IndexedDB 讀圖
    idbGetImageURL(it.id).then(url=>{ img.src = url || ''; });
    card.appendChild(img);

    const text = document.createElement('div');
    const t = document.createElement('p'); t.className='title'; t.textContent = it.title||'(未命名)';
    const n = document.createElement('p'); n.className='note'; n.textContent = it.note||'';
    text.appendChild(t); text.appendChild(n);
    card.appendChild(text);

    const act = document.createElement('div'); act.className='actions';

    const lbl = document.createElement('label'); lbl.className='chk';
    const chk = document.createElement('input'); chk.type='checkbox'; chk.checked=!!it.checked;
    chk.addEventListener('change',()=>{ it.checked = chk.checked; saveLists(); renderList(); });
    const sp = document.createElement('span'); sp.textContent='已買';
    lbl.appendChild(chk); lbl.appendChild(sp);

    const edit = document.createElement('button'); edit.className='btn'; edit.textContent='編輯';
    edit.addEventListener('click', ()=>{
      const nt = prompt('品項名稱', it.title||''); if(nt===null) return;
      const nn = prompt('備註', it.note||'');
      it.title = (nt||'').trim(); it.note = (nn||'').trim();
      saveLists(); renderList();
    });

    const photo = document.createElement('button'); photo.className='btn'; photo.textContent='照片';
    photo.addEventListener('click', async ()=>{
      const input=document.createElement('input'); input.type='file'; input.accept='image/*'; input.capture='environment';
      input.onchange = async ()=>{
        const f = input.files?.[0];
        if(f){
          const blob = await fileToBlob(f);
          await idbSaveImage(it.id, blob);
          renderList();
        }
      };
      input.click();
    });

    const del = document.createElement('button'); del.className='btn'; del.textContent='刪除';
    del.addEventListener('click', ()=>{
      if(confirm(`刪除「${it.title||'未命名'}」？`)){
        lists[current].items = lists[current].items.filter(x=>x.id!==it.id);
        saveLists();
        idbDeleteImage(it.id).finally(()=> renderList());
      }
    });

    act.appendChild(lbl); act.appendChild(edit); act.appendChild(photo); act.appendChild(del);
    card.appendChild(act);

    if(it.checked){ card.style.opacity=.6; t.style.textDecoration='line-through'; }

    itemList.appendChild(card);
  });

  if(sortMode==='manual') enableDragSort();
  enableSwipeGestures();
}

// 新增項目
$('#addForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(!current) return;
  const title = $('#titleInput').value.trim();
  const note  = $('#noteInput').value.trim();
  const file  = $('#photoInput').files[0];
  if(!title && !file){ return alert('至少輸入名稱或選一張照片'); }

  const it = { id: uuid(), title, note, checked:false, createdAt: Date.now() };
  if(sortMode==='manual'){
    const arr = lists[current].items;
    const max = arr.reduce((m,x)=>Math.max(m, x.order||0), 0);
    it.order = max + 1;
  }
  lists[current].items.unshift(it);
  saveLists();

  if(file){
    try{
      const blob = await fileToBlob(file);
      await idbSaveImage(it.id, blob);
    }catch(e){ console.warn('存圖失敗：', e); }
  }

  $('#titleInput').value=''; $('#noteInput').value=''; $('#photoInput').value='';
  renderList();
});

// 工具列事件
$('#backBtn').addEventListener('click', ()=>{ current=null; renderHome(); });
$('#search').addEventListener('input', renderList);
$('#toggleBought').addEventListener('change', renderList);

// 排序模式
function ensureOrder(){
  const arr = lists[current]?.items || [];
  if(!arr.length) return;
  let changed=false;
  arr.forEach((it,i)=>{ if(typeof it.order!=='number'){ it.order=i+1; changed=true; }});
  if(changed) saveLists();
}
function updateSortModeBtn(){
  $('#sortModeBtn').textContent = sortMode==='manual' ? '排序：手動' : '排序：自動';
}
$('#sortModeBtn').addEventListener('click', ()=>{
  sortMode = (sortMode==='auto') ? 'manual' : 'auto';
  localStorage.setItem(SORT_MODE_KEY, sortMode);
  if(sortMode==='manual') ensureOrder();
  updateSortModeBtn(); renderList();
});
updateSortModeBtn();


/* =============== 拖曳排序（手動模式） =============== */
function enableDragSort(){
  const list = document.querySelector('.list'); if(!list) return;
  const cards = list.querySelectorAll('.card');
  cards.forEach(card=>{
    card.setAttribute('draggable','true');
    card.addEventListener('dragstart', onDragStart);
    card.addEventListener('dragend', onDragEnd);
    card.addEventListener('dragover', onDragOver);
    card.addEventListener('drop', onDrop);
  });

  let draggingId = null;
  function onDragStart(e){
    draggingId = this.dataset.id;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragEnd(){
    this.classList.remove('dragging');
    list.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));
    draggingId = null;
  }
  function onDragOver(e){
    e.preventDefault();
    this.classList.add('drop-target');
  }
  function onDrop(e){
    e.preventDefault();
    list.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));
    const targetId = this.dataset.id;
    if(!draggingId || !targetId || draggingId===targetId) return;

    const arr = lists[current].items.slice().sort((a,b)=>(a.order??0)-(b.order??0)).map(x=>x.id);
    const from = arr.indexOf(draggingId);
    const to   = arr.indexOf(targetId);
    if(from<0 || to<0) return;

    arr.splice(to, 0, arr.splice(from,1)[0]);
    arr.forEach((id, idx)=>{
      const obj = lists[current].items.find(x=>x.id===id);
      if(obj) obj.order = idx + 1;
    });
    saveLists(); renderList();
  }
}

/* =============== 左刪右完成（滑動手勢） =============== */
function enableSwipeGestures(){
  const cards = document.querySelectorAll('.list .card');
  cards.forEach(card=>{
    if(card._swipeBound) return;
    card._swipeBound = true;

    let startX=0, startY=0, dx=0, dy=0, active=false;
    const threshold = 80;
    const id = card.dataset.id;

    card.addEventListener('pointerdown', (e)=>{
      active = true; startX = e.clientX; startY = e.clientY; dx=dy=0;
      card.setPointerCapture(e.pointerId);
      card.classList.add('swiping','swipe-hint');
    });
    card.addEventListener('pointermove', (e)=>{
      if(!active) return;
      dx = e.clientX - startX; dy = e.clientY - startY;
      if(Math.abs(dy) > 20){ cancel(); return; }
      card.style.transform = `translateX(${dx}px)`;
      card.style.opacity = `${Math.max(0.4, 1 - Math.abs(dx)/400)}`;
    });
    card.addEventListener('pointerup', onEnd);
    card.addEventListener('pointercancel', onEnd);

    function onEnd(){
      if(!active) return;
      active = false;
      card.classList.remove('swiping','swipe-hint');
      card.style.transition = 'transform .18s ease, opacity .18s ease';

      if(dx > threshold){
        const it = lists[current].items.find(x=>x.id===id);
        if(it){ it.checked = !it.checked; saveLists(); }
        card.style.transform = 'translateX(100%)'; card.style.opacity='0';
        setTimeout(()=>{ card.style.transition=''; card.style.transform=''; card.style.opacity=''; renderList(); }, 160);
      }else if(dx < -threshold){
        const it = lists[current].items.find(x=>x.id===id);
        if(it && confirm(`刪除「${it.title||'未命名'}」？`)){
          lists[current].items = lists[current].items.filter(x=>x.id!==id); saveLists();
          idbDeleteImage(id).finally(()=>{
            card.style.transform = 'translateX(-100%)'; card.style.opacity='0';
            setTimeout(()=>{ card.style.transition=''; renderList(); }, 160);
          });
        }else{
          card.style.transform = ''; card.style.opacity='';
          setTimeout(()=>{ card.style.transition=''; }, 180);
        }
      }else{
        card.style.transform = ''; card.style.opacity='';
        setTimeout(()=>{ card.style.transition=''; }, 180);
      }
    }
    function cancel(){
      active=false; card.classList.remove('swiping','swipe-hint');
      card.style.transform=''; card.style.opacity='';
    }
  });
}

/* =============== 單清單：檔案匯出/匯入（JSON；文字資料） =============== */
$('#exportBtn').addEventListener('click', ()=>{
  if(!current) return;
  const json = JSON.stringify(lists[current], null, 2);
  const bytes = new TextEncoder().encode(json);
  const blob  = new Blob([bytes], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`${current}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
});

$('#importBtn').addEventListener('click', ()=>{
  if(!current) return;
  const input = document.createElement('input'); input.type='file'; input.accept='application/json';
  input.onchange = async ()=>{
    const f = input.files?.[0]; if(!f) return;
    try{
      const text = await f.text(); const data = JSON.parse(text);
      if(data && Array.isArray(data.items)){
        const exist = lists[current].items;
        const keyOf = o=>`${(o.title||'').trim()}::${(o.note||'').trim()}`;
        const map = new Map(exist.map(x=>[keyOf(x), x]));
        data.items.forEach(o=>{
          const k = keyOf(o);
          if(!map.has(k)) map.set(k, { id:uuid(), title:o.title||'', note:o.note||'', checked:!!o.checked, createdAt:Date.now() });
          // 不匯入照片（避免 JSON 超大；照片請進 App 內補）
        });
        lists[current].items = Array.from(map.values());
        saveLists(); renderList(); alert('已匯入並合併（不包含照片）');
      }else alert('格式不正確：需要 {"items":[...]}');
    }catch{ alert('無法解析檔案'); }
  }; input.click();
});

/* =============== 日曆整合（.ics 匯出） =============== */
$('#icsBtn').addEventListener('click', ()=>{
  if(!current) return;
  const when = prompt('輸入提醒時間（格式：YYYY-MM-DD HH:mm，例如 2025-09-20 10:00）：');
  if(!when) return;
  const weekly = confirm('是否要設定為「每週重複」提醒？確定＝每週；取消＝單次');

  const undone = lists[current].items.filter(x=>!x.checked).map(x=>`• ${x.title}${x.note?`（${x.note}）`:''}`).join('\\n');
  const desc = undone || '（目前清單為空）';

  const dt = parseLocal(when); if(!dt){ alert('時間格式不正確'); return; }
  const dtstamp = toICSDate(new Date());
  const dtstart = toICSDate(dt);

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Memory Lists//zh-Hant//',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uuid()}@memorylists`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `SUMMARY:${escapeICS(`採買提醒：${current}`)}`,
    `DESCRIPTION:${escapeICS(desc)}`,
  ];
  if(weekly) ics.push('RRULE:FREQ=WEEKLY');
  ics.push('END:VEVENT','END:VCALENDAR');
  ics = ics.join('\r\n');

  const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`${current}.ics`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

function parseLocal(s){
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
  if(!m) return null;
  const [_,y,mo,d,h,mi] = m;
  return new Date(Number(y), Number(mo)-1, Number(d), Number(h), Number(mi), 0);
}
function toICSDate(d){
  const pad = n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}
function escapeICS(s){
  return String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
}

/* ================== 啟動點 ================== */
if(current===null) renderHome();
