// /js/site.js
(async () => {
  try {
    // 如果 repo 不是根網域（例如 user.github.io/repo），相對路徑更安全
    const res = await fetch('./data/resume.json?v=' + Date.now()); // 加 v= 防快取
    const r = await res.json();

    const T = (sel, text) => { const el=document.querySelector(sel); if(el && text!=null) el.textContent=text; };
    const H = (sel, html) => { const el=document.querySelector(sel); if(el && html!=null) el.innerHTML=html; };

    // Hero / About
    T('#hero h1', `${r.title}｜${r.name}`);
    T('#hero .subtitle', r.summary);
    H('#about .container', `
      <h2>關於我</h2>
      <p>${r.company}${r.location ? `（${r.location}）`:""}。${r.summary}</p>
    `);

    // Stats（若存在）
    const statsWrap = document.querySelector('#stats .stats-grid');
    if (statsWrap && r.stats?.length) {
      statsWrap.innerHTML = r.stats.map(s => `<article class="stat"><h3>${s.num}</h3><p>${s.label}</p></article>`).join('');
    }

    // Experience
    const expWrap = document.querySelector('#experience .container');
    if (expWrap && r.experiences?.length) {
      expWrap.innerHTML = `<h2>經歷</h2>` + r.experiences.map(e => `
        <article class="exp-item">
          <header class="exp-header">
            <h3>${e.role}｜${e.org}</h3>
            <div class="meta">${e.start} – ${e.end}${e.city?` · ${e.city}`:""}</div>
          </header>
          <ul class="exp-resp">${e.bullets.map(b=>`<li>${b}</li>`).join('')}</ul>
          ${e.stack?.length ? `<ul class="exp-stack">${e.stack.map(s=>`<li>${s}</li>`).join('')}</ul>` : ''}
        </article>
      `).join('');
    }

    // Services
    const svcWrap = document.querySelector('#services .container');
    if (svcWrap && r.services?.length) {
      svcWrap.innerHTML = `<h2>服務方案</h2><ul>` + r.services.map(s=>`
        <li><strong>${s.icon} ${s.title}：</strong> ${s.desc}</li>
      `).join('') + `</ul>`;
    }

    // Contact
    H('#contact .container', `
      <h2>聯絡我</h2>
      <p>Email：<a href="mailto:${r.email}">${r.email}</a></p>
      ${r.linkedin ? `<p>LinkedIn：<a href="${r.linkedin}" target="_blank" rel="noopener">${r.linkedin.replace(/^https?:\/\//,'')}</a></p>` : ''}
      ${r.github ? `<p>GitHub：<a href="${r.github}" target="_blank" rel="noopener">${r.github.replace(/^https?:\/\//,'')}</a></p>` : ''}
    `);

    // SEO 基本（JS 版，方便預覽；真正 SEO 建議也放在 <head> 靜態 meta）
    document.title = `${r.name}｜${r.title}`;
    const meta = (name, attr='name') => {
      let m = document.querySelector(`meta[${attr}="${name}"]`);
      if(!m){ m = document.createElement('meta'); m.setAttribute(attr, name); document.head.appendChild(m); }
      return m;
    };
    meta('description').setAttribute('content', r.summary);
    meta('og:title','property').setAttribute('content', `${r.name}｜${r.title}`);
    meta('og:description','property').setAttribute('content', r.summary);
    if (r.ogImage) meta('og:image','property').setAttribute('content', r.ogImage);

  } catch (e) {
    console.error('載入履歷失敗：', e);
    // 可選：在頁面顯示備援訊息
  }
})();
