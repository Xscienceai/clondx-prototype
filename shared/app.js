/* ClondX 骨牌1 双端原型引擎。平台差异看 body[data-platform]。 */
(function () {
  const MOCK = window.CLONDX_MOCK;
  const P = document.body.dataset.platform || "mac";
  let S = null;
  let turnToken = 0;
  let toastTimer = 0;

  const ICONS = {
    graph: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 19V5M4 19h16"/><path d="M7 15l4-6 3 3 5-7"/></svg>',
    bill: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 10h16"/></svg>',
    gear: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/></svg>',
    brain: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 18a4 4 0 0 1-3-6 4 4 0 0 1 4-6 4 4 0 0 1 7 2 3 3 0 0 1 1 6"/></svg>',
    intent: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3l2.2 6.2H21l-5.2 3.8 2 6.2L12 16.2 6.2 19.2l2-6.2L3 9.2h6.8z"/></svg>',
    share: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 11l8-4M8 13l8 4"/></svg>',
    lock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
  };

  function defaultState() {
    return {
      authed: false, onboarded: false, isNew: true, persona: "developer",
      realname: "none", nickname: "", avatarMode: "letter", photo: "",
      phoneDraft: "", codeDraft: "", codeSent: false, nickDraft: "",
      draft: "", chip: "fast", turn: "idle", turnThread: "", queue: [],
      takeover: false, drawer: false, drawerEdit: false, searchOpen: false, searchQ: "",
      worklistConfirmed: true, rulesOk: true, planAccepted: true,
      execHost: "wuying", localOnline: true, draftLeftBehind: false,
      joined: { semi: false, open: false, closed: false },
      openReview: "none", nda: { semi: false, open: false }, ndaTick: false, projectKind: "semi",
      joinedOrg: null, seat: null, familyTranscript: true, familyGone: false,
      inCall: false, callThread: "", scoutDone: false, showScout: false,
      frictionShared: false, showFriction: false, showAway: false,
      criticCover: false, acceptance: "", fortuneDnd: false, fortuneAsked: false,
      deleted: false, exportReady: false, posture: "auto",
      act: { read: "allow", write: "approve", send: "approve" },
      topics: [], activeTopic: null, bags: {}, auditExtra: [],
      friendState: "pending", connectors: { github: false, hf: false },
      pc: "sleeping", q: 0, answers: [null, null, null, null, null, null, null],
      parsing: false, parsed: false,
      resume: { name: "", years: "8 年", stack: "TypeScript / Go", project: "社区履约后台" },
      readHuman: false, recalled: false, agentLocked: false,
      sheet: null, infoThread: "", workOpen: true, composeThread: "ask",
      listening: false, intentDraft: "", intents: ["先接一单范围写清的履约项目"],
      afterRealname: "", onlyEmpty: false, hideOpen: false, muted: {}
    };
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function now() {
    const d = new Date();
    return d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  function toast(text) {
    const el = document.getElementById("toast");
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }
  function save() {
    try { sessionStorage.setItem("clondx-vse", JSON.stringify(S)); } catch (e) { /* 原型可无存储 */ }
  }
  function load() {
    S = defaultState();
    try {
      const raw = sessionStorage.getItem("clondx-vse");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      S = Object.assign(defaultState(), parsed);
      S.joined = Object.assign(defaultState().joined, parsed.joined || {});
      S.nda = Object.assign(defaultState().nda, parsed.nda || {});
      S.act = Object.assign(defaultState().act, parsed.act || {});
      S.bags = parsed.bags || {};
      S.connectors = Object.assign(defaultState().connectors, parsed.connectors || {});
      S.resume = Object.assign(defaultState().resume, parsed.resume || {});
      S.answers = parsed.answers || defaultState().answers;
    } catch (e) { S = defaultState(); }
  }
  function who() {
    const p = MOCK.personas[S.persona] || MOCK.personas.developer;
    return Object.assign({}, p, {
      nickname: S.nickname || p.nickname,
      joinedOrg: S.joinedOrg === null ? p.joinedOrg : S.joinedOrg,
      seat: S.seat === null ? p.seat : S.seat
    });
  }
  function phoneMask() {
    const p = who().phone;
    return p.slice(0, 3) + "****" + p.slice(-4);
  }
  function parseHash() {
    const raw = (location.hash || "#pg-01").replace(/^#/, "");
    const parts = raw.split(":");
    return { raw, page: parts[0] || "pg-01", a: parts[1] || "", b: parts[2] || "" };
  }
  function go(hash) {
    if (!hash.startsWith("#")) hash = "#" + hash;
    S.sheet = null;
    if (hash !== "#pg-17") S.drawer = false;
    save();
    if (location.hash === hash) render();
    else location.hash = hash;
  }
  function bag(key) {
    if (!S.bags[key]) S.bags[key] = [];
    return S.bags[key];
  }

  function normalize(r) {
    let next = null;
    if (!S.authed && !["pg-01", "pg-02"].includes(r.page)) next = "#pg-02";
    else if (S.authed && !S.onboarded && !["pg-01", "pg-02", "pg-04", "pg-05", "pg-06", "pg-22"].includes(r.page)) next = "#pg-04";
    if (next && location.hash !== next) return next;
    return null;
  }

  function tabOf(r) {
    if (r.page === "pg-13" || r.page === "pg-12") return "chat";
    if (r.page === "pg-23") return "contacts";
    if (r.page === "pg-24" || r.page === "pg-14" || r.page === "pg-15") return "tasks";
    return "";
  }
  function wantsBar(r) {
    if (!S.authed || !S.onboarded) return false;
    return !["pg-01", "pg-02"].includes(r.page);
  }
  function isFill(r) {
    if (r.page === "pg-17" && !r.a) return true;
    if (r.page === "pg-17" && r.a === "profile") return true;
    if (r.page !== "pg-13") return false;
    if (!r.a || r.a === "ask" || r.a === "scout" || r.a === "topic") return true;
    if (r.a === "inbox") return P === "mac";
    return true;
  }

  function dabai(sm) {
    return `<div class="dabai ${sm ? "sm" : ""}" aria-hidden="true"><i class="eye l"></i><i class="eye r"></i></div>`;
  }
  function avatarHTML(name, size) {
    const me = who();
    if ((!name || name === me.nickname) && S.avatarMode === "photo" && S.photo) {
      return `<span class="avatar ${size || ""}"><img alt="" src="${S.photo}" /></span>`;
    }
    return `<span class="avatar ${size || ""}">${esc((name || "林").slice(0, 1))}</span>`;
  }
  function avatarBtn() {
    const me = who();
    const inner = S.avatarMode === "photo" && S.photo ? `<img alt="" src="${S.photo}" />` : esc(me.nickname.slice(0, 1));
    return `<button class="avatar-btn" data-act="open-drawer" aria-label="个人资料">${inner}</button>`;
  }

  function appbar(tab) {
    const r = parseHash();
    const right = r.page === "pg-13" && r.a !== "ask" && r.a !== "scout" && r.a !== "topic" && r.a
      ? `<button class="icon-btn wide" data-act="to-ask">提问</button>`
      : `<button class="icon-btn wide" data-go="#pg-13:inbox">会话</button>`;
    const tabs = ["chat:聊天", "contacts:通讯录", "tasks:任务"].map((pair) => {
      const [id, label] = pair.split(":");
      return `<button type="button" class="${tab === id ? "on" : ""}" data-act="tab" data-id="${id}">${label}</button>`;
    }).join("");
    return `<header class="appbar">${avatarBtn()}<div class="spacer"></div><nav class="tabs">${tabs}</nav><div class="spacer"></div>${right}</header>`;
  }

  function frame(body, opts) {
    const bar = opts.bar ? appbar(opts.tab) : "";
    const scrim = S.drawer ? `<div class="scrim-live" data-act="close-drawer"></div>` : "";
    const drawer = S.drawer ? drawerHTML() : "";
    const top = P === "mac"
      ? `<div class="titlebar"><div class="lights" aria-hidden="true"><i></i><i></i><i></i></div><em>ClondX</em></div>`
      : `<div class="statusbar"><span>9:41</span><div class="notch"></div><span>5G</span></div>`;
    const bot = P === "ios" ? `<div class="home-ind"><i></i></div>` : "";
    const stageCls = `stage${opts.white ? " white" : ""}${opts.fill ? " fill" : ""}`;
    return `${top}<div class="shell">${bar}<div class="${stageCls}">${body}</div>${scrim}${drawer}${sheetHTML()}</div>${bot}`;
  }

  function menuBtn(hash, icon, label) {
    return `<button class="menu-item" data-go="${hash}">${icon}<span>${label}</span></button>`;
  }
  function drawerHTML() {
    const me = who();
    const topics = allTopics().filter((t) => !S.searchQ || t.title.includes(S.searchQ));
    const recent = topics.length
      ? topics.map((t) => `<button class="menu-item" data-act="open-topic" data-id="${t.id}">${esc(t.title)}</button>`).join("")
      : `<p class="sub">没有匹配的提问</p>`;
    const search = S.searchOpen
      ? `<input data-field="search" value="${esc(S.searchQ)}" placeholder="按标题过滤" />`
      : "";
    const home = `
      <button class="profile-card" data-act="edit-profile">
        ${avatarHTML(me.nickname, "lg")}
        <span class="grow"><b>${esc(me.nickname)}</b><em>${phoneMask()}</em><em class="mono">${esc(me.userId)}</em></span>
        <span>›</span>
      </button>
      <div style="height:8px"></div>
      ${menuBtn("#pg-17:skills", ICONS.graph, "技能图谱")}
      ${menuBtn("#pg-18", ICONS.bill, "收入与账单")}
      <button class="menu-item" data-go="#pg-21">${ICONS.gear}<span class="grow">设置</span><span class="tag">${{ none: "未认证", pending: "审核中", done: "已认证" }[S.realname]}</span></button>
      ${menuBtn("#pg-17:brain", ICONS.brain, "数字大脑")}
      ${menuBtn("#pg-17:intent", ICONS.intent, "意图商店")}
      ${menuBtn("#pg-17:share", ICONS.share, "分享给朋友")}
      ${menuBtn("#pg-17:privacy", ICONS.lock, "隐私政策")}
      <div class="recent-title">最近</div>
      ${recent}
      <div style="height:8px"></div>
      <button class="logout" data-act="logout">退出登录</button>
      <div class="brand-foot" style="margin-top:16px">${dabai(true)}<span>ClondX 0.1.1</span></div>`;
    const edit = `
      <div class="backline"><button data-act="drawer-home">‹ 资料</button><b>编辑资料</b></div>
      <div class="panel">
        <label class="f">昵称<input data-field="nick" value="${esc(S.nickDraft || me.nickname)}" maxlength="16" /></label>
        <p class="sub">2–16 字。手机号与用户 ID 只读。</p>
        <p class="kv"><span>手机号</span><b>${phoneMask()}</b></p>
        <p class="kv"><span>用户 ID</span><b class="mono">${esc(me.userId)}</b></p>
        <button class="btn ghost block" data-act="copy-id">复制用户 ID</button>
        <div class="row-btns" style="margin-top:8px">
          <label class="btn ghost" style="text-align:center">相册 / 拍照<input id="avatar-file" type="file" accept="image/*" class="hidden" /></label>
          <button class="btn ghost" data-act="letter-avatar">字母头像</button>
        </div>
        <button class="btn block" style="margin-top:8px" data-act="save-profile">保存</button>
      </div>`;
    return `<aside class="drawer ${S.drawer ? "open" : ""}" aria-label="个人资料">
      <div class="drawer-top"><button class="icon-btn" data-act="close-drawer">✕</button><button class="icon-btn" data-act="toggle-search" aria-label="搜索">⌕</button></div>
      <div class="drawer-scroll">${search}${S.drawerEdit ? edit : home}</div>
    </aside>`;
  }

  function allTopics() {
    const extra = S.topics || [];
    const ids = new Set(extra.map((t) => t.id));
    return extra.concat(MOCK.topics.filter((t) => !ids.has(t.id)));
  }

  function sheetHTML() {
    if (S.sheet === "invite") {
      return `<div class="sheet"><b>邀请 ${esc(S.inviteName || "")}</b><p class="sub">邀请码 ${MOCK.inviteCode}，与「分享给朋友」同一套账。</p>
        <button class="btn block" data-act="share-via" data-id="短信">发送短信</button>
        <button class="btn ghost block" data-act="share-via" data-id="WhatsApp">WhatsApp</button>
        <button class="btn ghost block" data-act="share-via" data-id="更多">更多选项</button>
        <button class="btn ghost block" data-act="close-sheet">取消</button></div>`;
    }
    if (S.sheet === "add") {
      return `<div class="sheet"><b>添加 Agent</b><p>授权后，对方消息会带身份与核验状态。人格不能被一条消息改写。这不是加人。</p>
        <button class="btn ghost block" data-act="agent-later">面试 Agent · 后期 · 未开通</button>
        <button class="btn ghost block" data-act="agent-later">评测 Agent · 后期 · 未开通</button>
        <button class="btn ghost block" data-act="close-sheet">取消</button></div>`;
    }
    if (S.sheet === "attach") {
      return `<div class="sheet"><b>附件</b>
        <button class="btn block" data-act="add-file">照片</button>
        <button class="btn ghost block" data-act="add-file">文件</button>
        <button class="btn ghost block" data-act="close-sheet">取消</button></div>`;
    }
    if (S.sheet === "info") return infoSheet();
    return "";
  }

  function infoSheet() {
    const id = S.infoThread;
    const meta = threadMeta(id);
    const me = who();
    let body = "";
    if (id === "family") {
      body = `<p>群主 · ${me.familyOwner ? me.nickname : "林昭"}</p><p>数据在群主账户 · 已链接群主云电脑</p><p class="mono">group_id GRP-HOME-19</p>
        ${me.familyOwner ? `<button class="btn ghost block" data-act="toggle-transcript">${S.familyTranscript ? "不自动转录" : "恢复自动转录"}</button>
        <button class="btn ghost block" data-act="dissolve-family">解散群聊</button>` : `<p class="sub">成员只读。${S.familyTranscript ? "接通后会转录。" : "群主已关闭转录。"}</p>`}
        <p class="sub">没有项目机，没有五件套，没有项目经理 Agent。</p>`;
    } else if (id === "project") {
      const host = S.execHost === "wuying" ? "阿里云无影" : "已链接 林昭的电脑";
      const vol = S.execHost === "wuying" ? "云端" : "本地";
      body = `<p>群主 · 人类项目经理 · 苏衡</p><p>执行面 · ${host}</p><p>项目卷 · 甲方 · ${vol}</p>
        <p class="mono">group_id GRP-PRJ-邻里柜</p>
        ${me.groupOwner ? `<div class="row-btns"><button class="btn ${S.execHost === "wuying" ? "" : "ghost"}" data-act="set-host" data-id="wuying">阿里云无影</button>
          <button class="btn ${S.execHost === "local" ? "" : "ghost"}" data-act="set-host" data-id="local">链接林昭的电脑</button></div>
          <button class="btn ghost block" data-act="toggle-offline">${S.localOnline ? "模拟电脑离线" : "模拟电脑恢复"}</button>` : `<p class="sub">成员不能改执行面，也不能各链各的电脑。</p>`}
        ${S.draftLeftBehind ? `<p class="kicker">草稿仍在上一台</p>` : ""}
        <p class="sub">项目群不能自行解散。没有关闭转录的开关。不画远程桌面。</p>`;
    } else if (id === "company") {
      body = `<p>澄川行政群</p><p class="mono">group_id GRP-ORG-03</p><p>成员脸是二级工作分身，不是个人号。</p><p class="sub">公司行政群始终转录，没有关闭开关。数据在机构账号，不是法人盘已开通。</p>`;
    } else body = `<p>${esc(meta.title)}</p>`;
    return `<div class="sheet"><b>群资料</b>${body}<button class="btn ghost block" data-act="close-sheet">关闭</button></div>`;
  }

  function threadMeta(id) {
    const titles = {
      digest: ["群动态", "个人", "群聊总结 · 不是第五人格", false],
      fortune: ["每日运势", "生活", "挂在生活分身下", false],
      human: ["苏衡", "个人", "人聊", false],
      family: ["林家", "生活", "家庭群", true],
      company: ["澄川行政群", "机构", "经澄川律所的二级工作分身", true],
      order: ["个人接单分身", "个人·接单", "工作空间下的子会话", false],
      project: [projectTitle(), "项目", "全员同一工作环境", true],
      learn: ["学习分身", "学习", "本机只做检索", false],
      life: ["生活分身", "生活", "生活", false]
    };
    const row = titles[id] || ["会话", "个人", "", false];
    return { id, title: row[0], space: row[1], sub: row[2], phone: row[3], group: row[3], kind: id };
  }
  function projectTitle() {
    return (MOCK.tasks[S.projectKind] || MOCK.tasks.semi).title;
  }
  function canSeeProject() {
    const me = who();
    if (me.groupOwner) return true;
    return !!(S.joined.semi || S.joined.open || S.joined.closed);
  }
  function canSeeCompany() {
    const me = who();
    return me.registrar || me.seat === "active";
  }
  function listPending() {
    const r = parseHash();
    if (r.a === "worklist_pending") return true;
    return !S.worklistConfirmed;
  }

  function composer(showChips) {
    const m = MOCK.models[S.chip];
    const running = S.turn === "thinking" || S.turn === "running";
    const chips = showChips ? `<div class="chipbar">
      ${["fast:快速", "standard:标准", "reason:推理"].map((pair) => {
        const [id, label] = pair.split(":");
        return `<button type="button" class="${S.chip === id ? "on" : ""}" data-act="chip" data-id="${id}">${label}</button>`;
      }).join("")}
      <span class="sub">${esc(m.note)} · ${esc(m.endpoint)}</span></div>` : "";
    const queue = S.queue.length ? `<div class="queue-note">将在本步结束后执行 · 已排队 ${S.queue.length} 条。发送不会取消当前这一步。</div>` : "";
    const held = S.heldNotice ? `<div class="queue-note">已停止。排队的话不会自动发出，补充完整后再发送。</div>` : "";
    const listen = S.listening ? `<div class="listen">正在听写… 松手后写入输入框，可改再发</div>` : "";
    const primary = running
      ? `<button class="round stop" data-act="stop" aria-label="停止">停</button>`
      : (S.draft.trim()
        ? `<button class="round" data-act="send" aria-label="发送">↑</button>`
        : `<button class="round" data-act="voice" aria-label="语音转写">麦</button>`);
    const queueSend = running && S.draft.trim() ? `<button class="btn ghost" data-act="send">排队</button>` : "";
    return `<footer class="composer">${chips}${queue}${held}${listen}
      <div class="box">
        <button class="icon-btn" data-act="open-attach" aria-label="附件">+</button>
        <textarea data-field="draft" rows="1" placeholder="${showChips ? "问主人格。快速档不唤醒云电脑" : "输入"}">${esc(S.draft)}</textarea>
        ${queueSend}${primary}
      </div></footer>`;
  }

  function renderMsg(m) {
    if (m.role === "system") return `<div class="msg mid"><div class="sys-pill">${esc(m.text)}</div></div>`;
    if (m.role === "card") return `<div class="msg agent">${cardHTML(m)}<div class="time">${esc(m.time || "")}</div></div>`;
    if (m.role === "user") {
      const recall = m.recallable ? `<button class="btn ghost" data-act="recall" style="margin-top:6px">撤回</button>` : "";
      const locked = m.locked ? `<p class="sub">已 @ 主人格，不能撤回</p>` : "";
      return `<div class="msg user"><div class="bubble">${esc(m.text)}</div>${recall}${locked}<div class="time">${esc(m.time || "")}</div></div>`;
    }
    if (m.role === "in") return `<div class="msg agent"><div class="bubble other">${esc(m.text)}</div><div class="time">${esc(m.time || "")}</div></div>`;
    const source = m.source ? `<div class="sub">${esc(m.source)}</div>` : "";
    const local = m.local ? `<div class="sub">本次在本机</div>` : "";
    return `<div class="msg agent"><article class="im-card"><p>${esc(m.text)}</p>${source}${local}</article>
      <div class="cost">${esc(m.cost || "")}</div><div class="gb">${esc(m.gb || "")}</div><div class="time">${esc(m.time || "")}</div></div>`;
  }

  function cardHTML(m) {
    if (m.kind === "approve" && m.status === "pending") {
      const film = P === "mac" ? `<div class="film"><div class="sub">改动短片 · 与 diff 并排</div><div class="film-frames"><span></span><span></span><span></span></div><p class="sub">不直播桌面。</p></div>` : "";
      return `<article class="im-card"><h3>需要你批准</h3><p>工具 write_draft · 原因 清单已确认项 · 状态 待批准</p>
        <div class="diff"><div class="del">- 直接写发布面</div><div class="add">+ 先写入草稿面，发布另走批准</div></div>${film}
        <p class="sub">超时会取消，不会静默同意。通过之后仍先写审计再执行。</p>
        <div class="row-btns"><button class="btn" data-act="approve" data-id="${m.id}">批准</button>
          <button class="btn ghost" data-act="reject" data-id="${m.id}">拒绝</button></div>
        <button class="btn ghost block" data-act="approve-timeout" data-id="${m.id}">模拟超时取消</button></article>`;
    }
    if (m.kind === "worklist") return worklistHTML();
    const blocks = {
      approve: "已处理",
      takeover: "需要你登录",
      cron: "已连续失败，先不跑了",
      fuse: "该智能体行为异常，已暂停对话",
      scout: "要不要接着办",
      friction: "要不要记进项目经验",
      fortune: "今日运势",
      minutes: "会议纪要"
    };
    let extra = "";
    if (m.kind === "takeover" && S.takeover) extra = `<button class="btn block" data-act="release-takeover">我已登录，交还</button>`;
    if (m.kind === "scout" && !S.scoutDone) extra = `<div class="row-btns"><button class="btn" data-act="scout" data-id="yes">接着办</button><button class="btn ghost" data-act="scout" data-id="no">先不用</button></div>`;
    if (m.kind === "friction" && !S.frictionShared) extra = `<div class="row-btns"><button class="btn" data-act="friction" data-id="yes">分享</button><button class="btn ghost" data-act="friction" data-id="no">先不用</button></div>`;
    if (m.kind === "fortune" && !S.fortuneDnd) extra = `<button class="btn ghost block" data-act="fortune-dnd">免打扰，停每日推送</button>`;
    return `<article class="im-card"><h3>${esc(m.title || blocks[m.kind] || "卡片")}</h3><p>${esc(m.text || "")}</p>${m.extra || ""}${extra}</article>`;
  }

  function worklistHTML() {
    const pending = listPending();
    const rows = MOCK.sdlc.map(([name, state]) => `<div class="checkline"><span>${name}</span><span class="tag">${pending ? "待确认" : state}</span></div>`).join("");
    const away = (parseHash().a === "away" || S.showAway) && !pending && S.planAccepted
      ? `<p class="kicker">你离开后已做到这里 · 测试用例已补 4 条。写仓仍待批准。</p>` : "";
    const btn = pending && who().groupOwner ? `<button class="btn block" data-act="confirm-list">确认后发到群里</button>` : "";
    const host = S.execHost === "wuying" ? "sleeping · 阿里云无影" : "已链接 林昭的电脑";
    const enable = !S.planAccepted ? "未启用写码" : "本次启用 Pi · 已确认计划，用项目规则写码";
    return `<article class="im-card"><h3>SDLC 工作清单</h3><p>${pending ? "待群主确认" : "群主已确认 · 苏衡"}</p>
      <p class="sub">${host} · ${enable}</p>${away}${rows}
      <p class="sub">清单不是验收，也不是放款依据。没有看板。</p>${btn}</article>`;
  }

  function seedThread(id) {
    if (id === "digest") {
      return [
        { role: "card", kind: "cron", text: "连续失败 10 次后已停。最短间隔 15 分钟，启用中最多 20 条。用量已入账，不再空转。", time: "08:31" },
        { role: "card", kind: "note", title: "重要且紧急", text: "邻里柜有一张还没批的写入。", time: "08:31" },
        { role: "card", kind: "note", title: "重要不紧急", text: "校园跑腿的验收标准可以先读。", time: "08:31" },
        { role: "card", kind: "note", title: "紧急不重要", text: "林家有一场会议。", time: "08:31" },
        { role: "card", kind: "note", title: "闲聊已折叠", text: "表情和闲聊没有收进要点。已撤回的消息也不收。", time: "08:31" },
        { role: "card", kind: "note", title: "公司与项目", text: "行政群和项目群的要点停在这一块，不写进生活分身。", time: "08:31" },
        { role: "agent", text: "可以说「现在回顾」。我不会把总结刷回原来的群。", gb: "gb_digest · 已核验 · 责任方 平台", cost: "0.006 元 · 群聊总结 · 可退", time: "08:31" }
      ];
    }
    if (id === "fortune") {
      return [{ role: "card", kind: "fortune", title: "今日运势", text: MOCK.fortune, time: "08:00" }];
    }
    if (id === "human") {
      const mine = S.recalled
        ? { role: "system", text: "你撤回了一条消息" }
        : { role: "user", text: "今晚的范围我划一下", time: "15:02", recallable: !S.readHuman, locked: false };
      return [
        { role: "in", text: "我先看清单，你别在群里改发布面。", time: "14:58" },
        mine,
        { role: "user", text: "@主人格 帮我记一下范围", time: "15:10", locked: true }
      ];
    }
    if (id === "family") {
      const rows = [
        { role: "in", text: "周末回不回家吃饭？", time: "12:04" },
        { role: "system", text: S.familyTranscript ? "接通后默认转录" : "群主已关闭转录" }
      ];
      if (bag("minutes:family").length === 0 && parseHash().a === "minutes") {
        rows.push({ role: "card", kind: "minutes", title: "会议纪要", text: "家里商量了周末聚餐。这不是核验，也不进奖励。", time: "12:40" });
      }
      return rows;
    }
    if (id === "company") {
      return [
        { role: "system", text: "成员显示为澄川律所的二级工作分身" },
        { role: "agent", text: "行政群只处理所内通知。个人接单不要发到这里。", gb: "gb_seat_chen · 已核验 · 责任方 澄川律所", cost: "平台承担 · 不进开发者用量", time: "11:12" }
      ];
    }
    if (id === "order") {
      return [{ role: "agent", text: "这里是个人接单。公司线程里的内容不会流到这个会话。", gb: "gb_order · 已核验 · 责任方 本人", cost: costLine(), time: "10:00" }];
    }
    if (id === "learn") {
      const recall = parseHash().a === "recall" || S.showFriction
        ? [{ role: "card", kind: "note", title: "来源", text: "预检后命中 1 条：邻里柜验收标准。闲聊和运势不会召回。命中不加图谱分。" }]
        : [];
      return recall.concat([{ role: "agent", text: "履约状态要等人确认，切片才能变成规则。", source: "来源 · 个人学习笔记 · 履约状态机", local: true, gb: "gb_learn · 已核验 · 责任方 本人", cost: costLine(), time: "09:40" }]);
    }
    if (id === "life") return [{ role: "agent", text: "生活空间。公司要点不会写到这里。", gb: "gb_life · 已核验 · 责任方 本人", cost: costLine(), time: "09:00" }];
    if (id === "project") return projectSeed();
    return [];
  }

  function projectSeed() {
    const task = MOCK.tasks[S.projectKind] || MOCK.tasks.semi;
    const rules = S.rulesOk ? "项目规则已同步" : "这次还不能开工";
    const host = S.execHost === "wuying" ? "执行面：阿里云无影" : "执行面：已链接 林昭的电脑";
    const offline = S.execHost === "local" && !S.localOnline ? [{ role: "system", text: "电脑不在线。不会自动改回无影。" }] : [];
    const behind = S.draftLeftBehind ? [{ role: "system", text: "草稿仍在上一台" }] : [];
    const plan = S.planAccepted ? "实施计划已接受。没有这份接受，就不能对草稿大写。" : "实施计划还没被接受。";
    const friction = (parseHash().a === "friction" || S.showFriction)
      ? [{ role: "card", kind: "friction", text: "这一步被打断过。要不要记进项目经验？默认只给你自己，不会自动改验收尺子。", time: "16:02" }]
      : [];
    return [
      { role: "system", text: `已同步建群以来的资料与聊天 · ${host} · 全员同一工作环境 · ${rules} · ${listPending() ? "待群主确认" : "群主已确认 SDLC 清单"}` },
      ...offline, ...behind,
      { role: "card", kind: "note", title: "意图", text: task.summary },
      { role: "card", kind: "note", title: "验收标准", text: "只有发布面算里程碑。退款看这一层，不看草稿。" },
      { role: "card", kind: "note", title: "实施计划", text: plan },
      { role: "card", kind: "worklist" },
      { role: "card", kind: "note", title: "已交给本次启用", text: "定向派给这一次启用的写码器。不把全文广播给群里每个智能体。" },
      ...friction,
      { role: "card", kind: "fuse", text: "消息板模式若连续 3 次，会暂停对话。这是示例卡，防御段不在资料页里编辑。", time: "09:20" },
      { role: "agent", text: "我是这个项目的项目经理。清单要等群主确认才算群里的进度。我不能自己放款，也不能自己接受分诊。", gb: "gb_pm_linli · 已核验 · 责任方 平台", cost: "平台承担 · 不进开发者用量", time: "09:16" }
    ];
  }

  function messagesFor(id) {
    return seedThread(id).concat(bag("thread:" + id), bag("minutes:" + id));
  }

  function inboxRows() {
    const rows = [
      ["digest", "群动态", "要点按重要和紧急排好", "置顶"],
      ["fortune", "每日运势", S.fortuneDnd ? "已免打扰" : "今天 08:00 已推送", ""],
      ["human", "苏衡", S.recalled ? "你撤回了一条消息" : "今晚的范围我划一下", "1"],
      ["order", "个人接单分身", "个人·接单", ""],
      ["learn", "学习分身", "来源在气泡下", ""]
    ];
    if (!S.familyGone) rows.splice(3, 0, ["family", "林家", S.familyTranscript ? "家庭群" : "群主已关闭转录", ""]);
    if (canSeeCompany()) rows.push(["company", "澄川行政群", "经二级工作分身", ""]);
    if (canSeeProject()) rows.push(["project", projectTitle(), listPending() ? "待群主确认" : "项目规则已同步", ""]);
    return rows;
  }
  function inboxList(active) {
    const items = inboxRows().map(([id, title, preview, flag]) => {
      const pin = flag === "置顶" ? `<span class="pin">置顶</span>` : "";
      const badge = flag && flag !== "置顶" ? `<span class="badge">${flag}</span>` : "";
      return `<button class="inbox-item ${active === id ? "on" : ""}" data-go="#pg-13:thread:${id}">${avatarHTML(title)}<span class="grow"><b>${esc(title)}</b><em>${esc(preview)}</em></span>${pin}${badge}</button>`;
    }).join("");
    return `${items}<button class="btn ghost block" data-go="#pg-12">更早的提问在「最近」</button>`;
  }

  function renderAsk(forceScout) {
    S.composeThread = S.activeTopic ? "topic:" + S.activeTopic : "ask";
    const m = MOCK.models[S.chip];
    const topic = allTopics().find((t) => t.id === S.activeTopic);
    const msgs = S.activeTopic ? bag("topic:" + S.activeTopic) : [];
    const scout = (forceScout || (S.showScout && !S.scoutDone)) && !S.activeTopic
      ? renderMsg({ role: "card", kind: "scout", text: "客户反馈里有一条验收疑问还没回。只读调查不会发消息、不会写仓、不会花钱，也不会唤醒项目机。", time: now() })
      : "";
    const hero = !S.activeTopic ? `<div class="ask-hero">${dabai(false)}<strong>今天想推进哪一件</strong><div class="endpoint">${esc(m.endpoint)} · ${esc(m.name)}</div><p class="sub">主人格负责拆开和叫人，不自己跑项目机。</p></div>` : "";
    const title = topic ? `<div class="thread-bar"><button class="icon-btn wide" data-act="to-ask">新提问</button><div class="who"><b>${esc(topic.title)}</b><span>只带这个话题，不塞全部记录</span></div></div>` : "";
    const body = S.activeTopic ? `<div class="msgs">${msgs.map(renderMsg).join("")}</div>` : `<div class="msgs">${scout}</div>`;
    return `<section class="ask">${title}${hero}${S.activeTopic ? "" : ""}${body}${composer(true)}</section>`;
  }

  function renderInbox() {
    if (P === "mac") {
      return `<div class="split mac"><div class="listpane">${inboxList("")}</div><div class="ask"><div class="ask-hero"><strong>选择一个会话</strong><p class="sub">提问从左上「聊天」或右侧「提问」进入，不垫在列表底部。</p></div></div></div>`;
    }
    return `<div class="page white" style="background:#fff"><h1>会话</h1><p class="sub">群动态置顶在列表里，不占提问首页。</p>${inboxList("")}</div>`;
  }

  function renderThread(id) {
    const meta = threadMeta(id);
    S.composeThread = "thread:" + id;
    const back = P === "ios" ? `<button class="icon-btn" data-go="#pg-13:inbox">‹</button>` : "";
    const phone = meta.phone ? `<button class="icon-btn wide" data-act="start-call" data-id="${id}">电话</button>` : "";
    const info = meta.group ? `<button class="icon-btn wide" data-act="open-info" data-id="${id}">资料</button>` : "";
    const state = id === "project" ? (S.turn === "idle" ? "sleeping" : S.turn) : (S.turnThread.endsWith(id) ? S.turn : "");
    const calling = (S.inCall && S.callThread === id) || (parseHash().a === "call" && id === "family");
    const call = calling
      ? `<div class="callbar"><span>${transcriptOn(id) ? "正在转录" : "群主已关闭转录"}</span><button class="btn" data-act="hangup">挂断</button></div>`
      : "";
    const dnd = id === "fortune" ? `<button class="btn ghost" data-act="fortune-dnd">${S.fortuneDnd ? "恢复每日推送" : "免打扰"}</button>` : "";
    const read = id === "human" ? `<button class="btn ghost" data-act="mark-read">${S.readHuman ? "对方已读" : "标为已读"}</button>` : "";
    const main = `<section class="thread"><header class="thread-bar">${back}${avatarHTML(meta.title, "sm")}<div class="who"><b>${esc(meta.title)}</b><span>${esc(meta.space)} · ${esc(meta.sub)}${state ? " · " + esc(state) : ""}</span></div>${dnd}${read}${phone}${info}</header>${call}<div class="msgs">${messagesFor(id).map(renderMsg).join("")}</div>${composer(false)}</section>`;
    if (P === "mac") return `<div class="split mac"><div class="listpane">${inboxList(id)}</div><div>${main}</div></div>`;
    return main;
  }
  function transcriptOn(id) {
    if (id === "family") {
      if (parseHash().a === "call_off") return false;
      return S.familyTranscript;
    }
    return id === "project" || id === "company";
  }

  function page13(r) {
    if (r.page === "pg-17" && !r.a) {
      S.drawer = true;
      return renderAsk(false);
    }
    const mode = r.a || "ask";
    if (mode === "inbox") return renderInbox();
    if (mode === "thread") return renderThread(r.b || "digest");
    if (mode === "topic") {
      S.activeTopic = r.b;
      return renderAsk(false);
    }
    if (mode === "scout") return renderAsk(true);
    const alias = { away: "project", worklist_pending: "project", dispatch: "project", friction: "project", recall: "learn", call: "family", minutes: "family", call_off: "family" };
    if (alias[mode]) return renderThread(alias[mode]);
    S.activeTopic = null;
    return renderAsk(false);
  }

  function coldFoot() {
    return `<div class="brand-foot">${dabai(true)}<span>ClondX 0.1.1</span></div>`;
  }
  function pageSplash() {
    return `<section class="cold"><div class="earth" data-act="splash-next">${earthSVG()}</div>
      <h1 style="margin:18px 0 0">一键触控地球</h1><p class="hint">物理空间与数字空间叠在同一颗地球上</p>
      <button class="btn" data-act="splash-next">轻触进入</button><div style="flex:1"></div>${coldFoot()}</section>`;
  }
  function earthSVG() {
    return `<svg viewBox="0 0 168 168" aria-label="双空间地球"><circle cx="84" cy="84" r="70" fill="#fff" stroke="#3E4A32" stroke-width="2"/>
      <path d="M30 90c18-8 28 10 48 6 16-4 22-22 40-18" fill="none" stroke="#3E4A32" stroke-width="2"/>
      <path d="M36 70c20 6 24 18 40 14 18-4 20 16 36 12" fill="none" stroke="#3B8C63" stroke-width="2"/>
      <circle cx="84" cy="84" r="78" fill="none" stroke="#E8F3EC" stroke-width="6"/>
      <path d="M84 10v148M14 84h140M28 40c30 16 82 16 112 0M28 128c30-16 82-16 112 0" fill="none" stroke="#3B8C63" stroke-width="1" opacity=".7"/></svg>`;
  }
  function pageLogin() {
    const personas = Object.values(MOCK.personas).map((p) => `<button type="button" class="${S.persona === p.key ? "on" : ""}" data-act="set-persona" data-id="${p.key}">${p.label}</button>`).join("");
    return `<section class="cold"><div class="dabai"><i class="eye l"></i><i class="eye r"></i></div>
      <h1 style="margin:12px 0">手机号登录</h1><p class="sub">未注册会直接注册。不进入实名页。</p>
      <div class="form">
        <div class="chipbar">${personas}</div>
        <p class="sub">原型演示身份。产品里没有个人与机构账号切换。</p>
        <div class="chipbar"><button type="button" class="${S.isNew ? "on" : ""}" data-act="set-new" data-id="1">新用户</button><button type="button" class="${S.isNew ? "" : "on"}" data-act="set-new" data-id="0">老用户</button></div>
        <label class="f">手机号<input data-field="phone" inputmode="numeric" placeholder="11 位手机号" value="${esc(S.phoneDraft)}" /></label>
        <label class="f">验证码<input data-field="code" inputmode="numeric" placeholder="4 位" value="${esc(S.codeDraft)}" /></label>
        <button class="btn ghost" data-act="send-code">${S.codeSent ? "重新发送" : "获取验证码"}</button>
        <button class="btn block" data-act="login">登录</button>
      </div><div style="flex:1"></div>${coldFoot()}</section>`;
  }
  function pagePortrait() {
    const i = S.q;
    const dim = MOCK.dimensions[i];
    const opts = MOCK.dimOptions[i].map((label, idx) => `<button type="button" class="${S.answers[i] === idx ? "on" : ""}" data-act="portrait-pick" data-id="${idx}">${esc(label)}</button>`).join("");
    return `<section class="page white"><p class="kicker">画像 ${i + 1} / 7</p><h1>${esc(dim[0])}</h1><p>${esc(dim[1])}</p><p class="sub">${esc(dim[2])}</p><div class="choices">${opts}</div>
      <div class="row-btns"><button class="btn ghost" data-act="portrait-skip">稍后补全</button><button class="btn" data-act="portrait-next">${i === 6 ? "去上传简历" : "下一题"}</button></div></section>`;
  }
  function pageResume() {
    if (!S.parsed) {
      return `<section class="page white"><h1>上传简历</h1><p class="sub">PDF / Word。正式环境解析不超过 30 秒，原型会很快给出校对稿。</p>
        <div class="panel"><b>${S.parsing ? "正在解析…" : "把简历放在这里"}</b><p class="sub">原型不读取真实文件。</p>
        <button class="btn block" data-act="resume-parse" ${S.parsing ? "disabled" : ""}>开始解析</button></div></section>`;
    }
    const f = S.resume;
    return `<section class="page white"><h1>核对提取结果</h1><p class="sub">可以改错。确认后才进入图谱。</p>
      <label class="f">姓名<input data-field="resume" data-k="name" value="${esc(f.name)}" /></label>
      <label class="f">年限<input data-field="resume" data-k="years" value="${esc(f.years)}" /></label>
      <label class="f">技术栈<input data-field="resume" data-k="stack" value="${esc(f.stack)}" /></label>
      <label class="f">代表项目<input data-field="resume" data-k="project" value="${esc(f.project)}" /></label>
      <button class="btn block" data-act="resume-confirm">确认并查看图谱</button></section>`;
  }
  function radarSVG() {
    const cx = 110, cy = 110, R = 72;
    let rings = "";
    for (let k = 1; k <= 3; k++) {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 3;
        pts.push((cx + Math.cos(a) * R * k / 3).toFixed(1) + "," + (cy + Math.sin(a) * R * k / 3).toFixed(1));
      }
      rings += `<polygon points="${pts.join(" ")}" fill="none" stroke="#e6e4dc"/>`;
    }
    const pts = [];
    let texts = "";
    MOCK.radar.forEach((d, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 3;
      const covered = S.criticCover && d.name === "协作";
      const sc = covered ? 8 : d.score;
      pts.push((cx + Math.cos(a) * R * sc / 100).toFixed(1) + "," + (cy + Math.sin(a) * R * sc / 100).toFixed(1));
      const lx = cx + Math.cos(a) * (R + 22);
      const ly = cy + Math.sin(a) * (R + 16);
      texts += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="10" text-anchor="middle" fill="${covered ? "#246B47" : "#333"}">${covered ? "协作 已覆盖" : d.name + " " + d.score}</text>`;
    });
    return `<svg viewBox="0 0 220 220" width="220" height="220">${rings}<polygon points="${pts.join(" ")}" fill="rgba(59,140,99,.25)" stroke="#3B8C63" stroke-width="2"/>${texts}</svg>`;
  }
  function pageGraph() {
    const back = S.onboarded ? `<button data-go="#pg-17">‹ 资料</button>` : "";
    return `<section class="page"><div class="backline">${back}<h1>能力图谱</h1></div>
      <p class="sub">这是简历基线。和 Agent 协作之后才会更新。覆盖平台分数时，匹配仍看得到你的覆盖。</p>
      <div class="radar-wrap"><div>${radarSVG()}</div><div><div class="matrix">${MOCK.stacks.map((s) => `<span>${s}</span>`).join("")}</div>
        <p class="sub" style="margin-top:8px">至少五个技术栈。NPS 记在这张图上，不另开报告页。</p>
        <button class="btn ghost" data-act="cover-dim">${S.criticCover ? "恢复「协作」平台分" : "覆盖「协作」这一维"}</button>
        <button class="btn ghost" data-act="nps">推荐给同行 · NPS</button></div></div>
      ${S.onboarded ? `<button class="btn ghost" data-go="#pg-22">能力仓库</button><button class="btn ghost" data-go="#pg-20">技能包市场 · 稍后</button>` : `<button class="btn block" data-go="#pg-22">查看能力仓库</button>`}
    </section>`;
  }
  function pageVault() {
    const back = S.onboarded ? "#pg-06" : "#pg-06";
    const items = MOCK.vault.map((v) => `<div class="checkline"><span>${esc(v.name)} · ${esc(v.from)}</span><span class="tag">${esc(v.verify)}</span></div>`).join("");
    const cta = S.onboarded ? "" : `<button class="btn block" data-act="finish-onboard">进入聊天</button>`;
    return `<section class="page"><div class="backline"><button data-go="${back}">‹ 图谱</button><h1>能力仓库</h1></div>
      <p class="sub">简历写进来的能力多数还待核验。后期和面试或评测 Agent 对话后才会核验。</p>${items}
      <label class="f">我的验收标准<textarea data-field="accept">${esc(S.acceptance)}</textarea></label>
      <button class="btn ghost" data-act="save-accept">保存验收标准</button>
      <p class="sub">会随导出包带走，并带上 critic_id。</p>${cta}</section>`;
  }

  function visibleTasks() {
    if (S.onlyEmpty) return [];
    const me = who();
    const list = [];
    if (me.employee) list.push(MOCK.tasks.closed);
    if (me.matched || me.groupOwner || S.joined.semi) list.push(MOCK.tasks.semi);
    if (!S.hideOpen) list.push(MOCK.tasks.open);
    return list;
  }
  function pageTasks(segment) {
    const mine = [];
    if (S.joined.semi) mine.push(MOCK.tasks.semi.title);
    if (S.joined.open) mine.push(MOCK.tasks.open.title);
    if (S.joined.closed) mine.push(MOCK.tasks.closed.title);
    if (who().groupOwner) mine.push(MOCK.tasks.semi.title + " · 你是群主");
    const mineHtml = mine.length ? mine.map((t) => `<button class="task" data-go="#pg-13:thread:project"><b>${esc(t)}</b><em>进行中 · 进群继续</em></button>`).join("") : `<p class="sub">你还没有进行中的任务。</p>`;
    const cards = visibleTasks().map((t) => `<button class="task" data-go="#pg-15:${t.id}"><span class="kicker">${t.openness}</span><b>${esc(t.title)}</b><em>${esc(t.bonus)} · ${esc(t.version)} · ${esc(t.scope)}</em></button>`).join("") || `<p>暂无对你开放的任务</p>`;
    const seg = segment || "mine";
    return `<section class="page white"><h1>任务</h1><div class="chipbar">
      <button class="${seg === "mine" ? "on" : ""}" data-go="#pg-24">我的任务</button>
      <button class="${seg === "platform" ? "on" : ""}" data-go="#pg-14">平台项目</button></div>
      ${seg === "mine" ? mineHtml : cards}
      <p class="sub">没有悬赏，也不能在这里发需求。</p></section>`;
  }
  function pageDetail(id) {
    const t = MOCK.tasks[id];
    if (!t) return `<section class="page"><p>找不到这个任务。</p></section>`;
    let action = "";
    if (id === "closed") action = `<button class="btn block" data-act="task-go" data-id="closed">进入项目</button>`;
    else if (id === "semi") {
      action = S.joined.semi ? `<button class="btn block" data-go="#pg-13:thread:project">进入项目群</button>` : `<p class="sub">同意加入后签署保密协议，没有报名审核。</p><button class="btn block" data-act="task-go" data-id="semi">同意加入</button>`;
    } else if (S.openReview === "none" && !S.joined.open) action = `<button class="btn block" data-act="apply-open">申请参加</button>`;
    else if (S.openReview === "pending") action = `<p>审核中。</p><div class="row-btns"><button class="btn" data-act="review" data-id="pass">原型：审核通过</button><button class="btn ghost" data-act="review" data-id="reject">原型：拒绝</button></div>`;
    else if (S.openReview === "reject") action = `<p>未通过：范围和你的图谱暂时对不上。</p>`;
    else action = S.joined.open ? `<button class="btn block" data-go="#pg-13:thread:project">进入项目群</button>` : `<button class="btn block" data-act="task-go" data-id="open">去签保密协议</button>`;
    const grade = t.grade ? `<p class="sub">${esc(t.grade)}</p>` : "";
    const weights = (S.joined[id] || (id === "semi" && who().groupOwner)) ? `<div class="panel"><b>已完成权重</b><div class="kv"><span>你</span><span>${MOCK.weights.self}%</span></div><div class="kv"><span>其他成员</span><span>${MOCK.weights.others}%</span></div><div class="kv"><span>AI · 归平台</span><span>${MOCK.weights.ai}%</span></div><p class="kicker">${MOCK.weights.status}</p><p class="sub">平台确认前不到账。AI 成本不进你的用量。</p></div>` : "";
    return `<section class="page"><div class="backline"><button data-go="#pg-14">‹ 平台项目</button><h1>${esc(t.title)}</h1></div>
      <p class="kicker">${t.openness}</p><p>奖金 ${esc(t.bonus)} · ${esc(t.version)} · ${esc(t.scope)}</p><p>${esc(t.summary)}</p><p>${esc(t.accept)}</p>${grade}
      <p class="sub">交付保障：这一里程碑不达标，就退这一笔托管款。</p>${weights}${action}</section>`;
  }
  function pageNda(id) {
    const t = MOCK.tasks[id] || MOCK.tasks.semi;
    return `<section class="page"><div class="backline"><button data-go="#pg-15:${id}">‹ 任务</button><h1>项目保密协议</h1></div>
      <div class="panel"><p>项目：${esc(t.title)}。未签署不能进群。签署记录进审计。协议和这个项目绑定。</p>
        <p>进群后可以读到从建群到你加入时的资料、聊天和五件套。</p></div>
      <button class="choices" data-act="nda-tick"><span class="${S.ndaTick ? "on" : ""}">${S.ndaTick ? "已勾选" : "勾选"} 我已阅读并同意</span></button>
      <button class="btn block" data-act="nda-sign" data-id="${id}" ${S.ndaTick ? "" : "disabled"}>签署并进群</button></section>`;
  }

  function pageContacts() {
    const me = who();
    const workKids = `<button class="contact indent" data-go="#pg-13:thread:order">${avatarHTML("接")}<span class="grow"><b>个人接单分身</b><em>不可删除</em></span></button>`
      + (me.seat === "active" ? `<button class="contact indent" data-go="#pg-13:thread:company">${avatarHTML("澄")}<span class="grow"><b>${esc(MOCK.orgName)}的二级工作分身</b><em>与个人接单同级</em></span></button>` : "");
    const agents = `
      <button class="contact" data-go="#pg-13:ask">${avatarHTML(me.nickname)}<span class="grow"><b>主人格</b><em>Hermes</em></span></button>
      <button class="contact indent" data-go="#pg-13:thread:digest">${avatarHTML("总")}<span class="grow"><b>群聊总结</b><em>工具 · 挂在主人格下</em></span></button>
      <button class="contact" data-act="toggle-work">${avatarHTML("工")}<span class="grow"><b>工作分身</b><em>${S.workOpen ? "收起" : "展开"}</em></span></button>
      ${S.workOpen ? workKids : ""}
      <button class="contact" data-go="#pg-13:thread:life">${avatarHTML("活")}<span class="grow"><b>生活分身</b></span></button>
      <button class="contact indent" data-go="#pg-13:thread:fortune">${avatarHTML("运")}<span class="grow"><b>每日运势</b><em>不可删除</em></span></button>
      <button class="contact" data-go="#pg-13:thread:learn">${avatarHTML("学")}<span class="grow"><b>学习分身</b></span></button>`;
    const friends = S.friendState === "accepted"
      ? `<div class="recent-title">H</div><button class="contact on">${avatarHTML("何")}<span class="grow"><b>何麦</b><em>好友</em></span></button>`
      : "";
    const su = `<div class="recent-title">S</div><button class="contact" data-go="#pg-13:thread:human">${avatarHTML("苏")}<span class="grow"><b>苏衡</b></span></button>`;
    const org = me.joinedOrg ? `<div class="recent-title">${esc(MOCK.orgName)}</div><p class="sub">同事的个人账号，不是群聊。</p>${MOCK.contacts.colleagues.map((c) => `<button class="contact">${avatarHTML(c.name)}<span class="grow"><b>${esc(c.name)}</b><em>${esc(c.role)} · ${esc(c.id)}</em></span></button>`).join("")}` : "";
    return `<section class="page white"><div class="backline"><h1>通讯录</h1><button class="icon-btn" data-act="open-add" aria-label="添加 Agent">+</button></div>
      <button class="row" data-go="#pg-23:newfriends"><b>新朋友</b></button>
      <button class="row" data-go="#pg-23:phone"><b>手机联系人</b></button>
      <div class="contact-layout"><div><div class="recent-title">我的 Agent</div>${agents}<div class="recent-title">我的好友</div>${friends}${su}${org}</div>
      <div class="letter-rail">H<br/>S</div></div></section>`;
  }
  function pageNewFriends() {
    const pending = S.friendState === "pending" ? `<div class="panel"><b>何麦</b><p class="sub">请求加你为好友。这里只处理人，不处理 Agent。</p><div class="row-btns"><button class="btn" data-act="friend" data-id="yes">同意</button><button class="btn ghost" data-act="friend" data-id="no">忽略</button></div></div>` : `<p class="sub">没有待处理的申请。</p>`;
    return `<section class="page"><div class="backline"><button data-go="#pg-23">‹ 通讯录</button><h1>新朋友</h1></div>${pending}</section>`;
  }
  function pagePhone() {
    const rows = MOCK.contacts.phone.map((c) => {
      const label = c.state === "friend" ? "已添加" : c.state === "add" ? "添加" : "邀请";
      const act = c.state === "invite" ? `data-act="invite" data-id="${esc(c.name)}"` : `data-act="phone-add" data-id="${esc(c.name)}"`;
      return `<div class="row"><span class="grow"><b>${esc(c.name)}</b><em>${esc(c.phone)}</em></span><button class="btn ghost" ${act}>${label}</button></div>`;
    }).join("");
    return `<section class="page"><div class="backline"><button data-go="#pg-23">‹ 通讯录</button><h1>手机联系人</h1></div><p class="sub">原型视为已授权。右上刷新只是重读这份名单。</p><button class="btn ghost" data-act="noop">刷新</button>${rows}</section>`;
  }

  function pageSettings() {
    const label = { none: "未认证", pending: "审核中", done: "已认证" }[S.realname] || "未认证";
    return `<section class="page"><div class="backline"><button data-go="#pg-17">‹ 资料</button><h1>设置</h1></div>
      <button class="row" data-act="lang"><span class="grow"><b>语言选择</b></span><span>简体中文</span></button>
      <button class="row" data-go="#pg-03"><span class="grow"><b>实名认证</b></span><span class="tag">${label}</span></button>
      <button class="row" data-act="password"><span class="grow"><b>修改密码</b></span><span>›</span></button>
      <button class="row" data-act="theme"><span class="grow"><b>外观</b></span><span>浅色</span></button>
      <label class="row">时区<select data-field="tz"><option ${S.tz === "Asia/Shanghai" ? "" : ""}>Asia/Shanghai</option></select></label>
      <p class="sub">设置里只有账号壳。主权相关都在数字大脑。</p></section>`;
  }
  function pageRealname() {
    const me = who();
    return `<section class="page"><div class="backline"><button data-go="#pg-21">‹ 设置</button><h1>实名认证</h1></div>
      <p>仅用于合规与结算。当前：${{ none: "未认证", pending: "审核中", done: "已认证" }[S.realname]}</p>
      <div class="panel">${me.registrar ? "登记人走营业执照。" : "个人走身份证。"}原型不上传真实证件。</div>
      ${S.realname === "done" ? `<p class="kicker">已认证</p>` : `<button class="btn block" data-act="realname-submit">提交审核</button>`}
      ${S.realname === "pending" ? `<button class="btn ghost block" data-act="realname-pass">原型：审核通过</button>` : ""}</section>`;
  }
  function pageSkills() {
    return `<section class="page"><div class="backline"><button data-go="#pg-17">‹ 资料</button><h1>技能图谱</h1></div>
      <button class="row" data-go="#pg-06"><b>查看图谱</b></button>
      <button class="row" data-go="#pg-22"><b>能力仓库</b></button>
      <button class="row" data-go="#pg-05"><b>上传简历</b></button>
      <div class="panel"><b>应用连接器</b>
        <div class="kv"><span>GitHub</span><button class="btn ghost" data-act="connector" data-id="github">${S.connectors.github ? "已授权" : "授权"}</button></div>
        <div class="kv"><span>Hugging Face</span><button class="btn ghost" data-act="connector" data-id="hf">${S.connectors.hf ? "已授权" : "授权"}</button></div>
        <p class="sub">这不是设备护照，也不暴露 MCP。</p></div></section>`;
  }
  function pageBrain() {
    const items = [["#pg-06", "能力视图"], ["#pg-17:own", "数据所有权"], ["#pg-17:act", "Agent 行动授权"], ["#pg-17:memory", "记忆与人格"], ["#pg-19", "审计"], ["#pg-17:pc", "我的云电脑"], ["#pg-17:device", "设备连接器"], ["#pg-17:space", "空间与身份"]];
    return `<section class="page"><div class="backline"><button data-go="#pg-17">‹ 资料</button><h1>数字大脑</h1></div><p>个人主权 AI 的基座。</p>
      ${items.map(([h, n]) => `<button class="row" data-go="${h}"><b>${n}</b></button>`).join("")}</section>`;
  }
  function pageOwn() {
    const manifest = MOCK.exportManifest.map((line) => `<div class="checkline"><span>${esc(line)}</span></div>`).join("");
    return `<section class="page"><div class="backline"><button data-go="#pg-17:brain">‹ 数字大脑</button><h1>数据所有权</h1></div>
      <p>知情、导出、删除在这里。后训练授权：未开通。</p>
      <button class="btn ghost" disabled>不能在这里打开训练</button>
      <h2>导出目录</h2>${manifest}
      ${S.exportReady ? `<p class="kicker">打包中 · 预计 48 小时内下载 · EXP-20261008</p>` : `<button class="btn block" data-act="export">申请导出</button>`}
      ${S.deleted ? `<p class="kicker">删除已受理 · 30 日内完成 · 证明 DEL-20261008</p>` : `<button class="btn ghost block" data-act="delete-data">申请删除</button>`}
      <p class="sub">个人包不含项目卷，不含二级工作分身和客户的对话。自己当群主的家庭群会包含在内。</p></section>`;
  }
  function pageAct() {
    const posture = ["strict:Strict", "auto:Auto", "dangerous:Dangerous"].map((pair) => {
      const [id, label] = pair.split(":");
      return `<button class="${S.posture === id ? "on" : ""}" data-act="posture" data-id="${id}">${label}</button>`;
    }).join("");
    function choices(key, locked) {
      if (locked) return `<p class="kicker">必须你亲自做</p>`;
      return ["allow:允许自己做", "approve:先批准", "forbid:禁止"].map((pair) => {
        const [id, label] = pair.split(":");
        return `<button class="${S.act[key] === id ? "on" : ""}" data-act="act" data-key="${key}" data-id="${id}">${label}</button>`;
      }).join("");
    }
    return `<section class="page"><div class="backline"><button data-go="#pg-17:brain">‹ 数字大脑</button><h1>Agent 行动授权</h1></div>
      <div class="chipbar">${posture}</div><p class="sub">三句话只能比姿态更紧。</p>
      <div class="panel"><b>阅读</b><div class="chipbar">${choices("read")}</div></div>
      <div class="panel"><b>写入</b><div class="chipbar">${choices("write")}</div></div>
      <div class="panel"><b>对外发送</b><div class="chipbar">${choices("send")}</div></div>
      <div class="panel"><b>改密码</b>${choices("password", true)}</div>
      <div class="panel"><b>超过上限的支付</b>${choices("pay", true)}</div>
      <div class="panel"><b>发布</b>${choices("publish", true)}</div></section>`;
  }
  function pageMemory() {
    return `<section class="page"><div class="backline"><button data-go="#pg-17:brain">‹ 数字大脑</button><h1>记忆与人格</h1></div>
      <p>目标尚未驱动执行。主人格只能把已提交的意图读出来。</p>
      <p>评测维度和「我的验收标准」是验收尺子。平台缺省可以覆盖。机构合规项不在这页改。</p>
      <p>人格是只读注入。一条聊天不能改写它。技能可以蒸馏，身份不能蒸馏。</p>
      <p class="sub">后训练不在这页。长上下文用来装配这个话题的记忆，不代表要生成很长的回复。</p>
      <button class="btn ghost" disabled>不能在这里开训</button></section>`;
  }
  function pagePc() {
    const me = who();
    const groups = me.familyOwner && !S.familyGone ? `<p>已链接的群：林家</p>` : `<p class="sub">没有把家庭群链到这台个人云电脑。</p>`;
    return `<section class="page"><div class="backline"><button data-go="#pg-17:brain">‹ 数字大脑</button><h1>我的云电脑</h1></div>
      <p>个人机 · ${S.pc === "sleeping" ? "休眠" : "已唤醒"} · image_kind=personal</p>
      <p class="sub">这里不列项目机，也不把项目链接的那台电脑当成你的盘。不画桌面。</p>
      ${groups}
      <button class="btn block" data-act="wake-pc">${S.pc === "sleeping" ? "唤醒" : "休眠"}</button></section>`;
  }
  function pageDevice() {
    const local = P === "mac" ? "这台 Mac" : "这台 iPhone";
    return `<section class="page"><div class="backline"><button data-go="#pg-17:brain">‹ 数字大脑</button><h1>设备连接器</h1></div>
      <p class="sub">护照目录。本版只有本机和平板。</p>
      <div class="row"><span class="grow"><b>${local}</b><em>已配对 · 护照 · 个人空间</em></span></div>
      <div class="row"><span class="grow"><b>iPad</b><em>已配对 · 护照 · 个人空间</em></span></div>
      <p class="sub">没有 NAS，没有 U 盘，没有网盘，不暴露 MCP。导出仍在数据所有权里下载。</p></section>`;
  }
  function pageSpace() {
    const me = who();
    if (me.registrar) {
      return `<section class="page"><div class="backline"><button data-go="#pg-17:brain">‹ 数字大脑</button><h1>空间与身份</h1></div>
        <p class="kicker">法人持有 / 驻留未开通</p><p>${esc(MOCK.orgName)} 的机构用户由你持有。没有「切回个人账号」。</p>
        <div class="panel mono">${esc(MOCK.orgLink)}</div>
        <button class="btn block" data-act="copy-link">复制加入链接</button>
        <button class="btn ghost" data-go="#pg-17:join">预览员工接受页</button>
        <p class="sub">这不是拉新邀请码 ${MOCK.inviteCode}。</p></section>`;
    }
    const seat = me.seat;
    const seatText = { none: "未申请", pending: "审核中", active: "已开通", org: "机构用户" }[seat] || seat;
    return `<section class="page"><div class="backline"><button data-go="#pg-17:brain">‹ 数字大脑</button><h1>空间与身份</h1></div>
      <p>没有切换机构或个人账号的开关。四个分身不会因为加入公司消失。</p>
      ${me.joinedOrg ? `<div class="panel"><b>已加入 ${esc(MOCK.orgName)}</b><p>二级工作分身：${seatText}</p>
        ${seat === "none" ? `<button class="btn block" data-act="seat-apply">向平台申请二级工作分身</button>` : ""}
        ${seat === "pending" ? `<button class="btn ghost block" data-act="seat-pass">原型：平台批准</button>` : ""}
        ${seat === "active" ? `<p class="sub">已出现在通讯录，挂在工作分身下。</p>` : ""}</div>` : `<p class="sub">还没有加入公司。等登记人的加入链接，接受之后通讯录才出现该公司。</p><button class="btn ghost" data-go="#pg-17:join">查看一份加入邀请</button>`}</section>`;
  }
  function pageJoin() {
    const me = who();
    return `<section class="page"><h1>加入${esc(MOCK.orgName)}</h1>
      <div class="panel"><p>周宁（个人账号）邀请你加入${esc(MOCK.orgName)}。</p><p class="sub">接受之后，通讯录出现同事名单。这不是进公司行政群，也不是换成机构账号。</p></div>
      ${me.joinedOrg ? `<p class="kicker">你已接受</p>` : `<div class="row-btns"><button class="btn" data-act="org-accept">接受</button><button class="btn ghost" data-act="org-decline">拒绝</button></div>`}</section>`;
  }
  function pageIntent() {
    const list = S.intents.map((t) => `<div class="checkline"><span>${esc(t)}</span><span class="tag">尚未驱动执行</span></div>`).join("");
    return `<section class="page"><div class="backline"><button data-go="#pg-17">‹ 资料</button><h1>意图商店</h1></div>
      <p>目标尚未驱动执行。已提交的还可以再提一次。</p>${list}
      <label class="f">再写一条<input data-field="intent" value="${esc(S.intentDraft)}" /></label>
      <button class="btn block" data-act="add-intent">提交</button></section>`;
  }
  function pageShare() {
    const rows = [["何麦", "已注册"], ["阿梁", "已下单"], ["老韩", "已成交"]].map(([n, s]) => `<div class="checkline"><span>${n}</span><span class="tag">${s}</span></div>`).join("");
    return `<section class="page"><div class="backline"><button data-go="#pg-17">‹ 资料</button><h1>分享给朋友</h1></div>
      <p>邀请码 <b class="mono">${MOCK.inviteCode}</b> · 绑在 ${esc(who().userId)}</p>
      <p class="sub">好友注册得到小额积分。软件订单成交后得到奖金。不填企业线索。</p>
      <button class="btn block" data-act="share-via" data-id="系统分享">系统分享</button>
      <button class="btn ghost" data-act="copy-code">复制邀请码</button>
      <h2>已邀请</h2>${rows}</section>`;
  }
  function pagePrivacy() {
    return `<section class="page"><div class="backline"><button data-go="#pg-17">‹ 资料</button><h1>隐私政策</h1></div><p>${esc(MOCK.policy)}</p></section>`;
  }
  function pageBill(seg) {
    const cur = seg || "usage";
    const tabs = [["usage", "用量"], ["sub", "订阅"], ["income", "项目收入"], ["invite", "邀请奖励"]].map(([id, label]) => `<button class="${cur === id ? "on" : ""}" data-go="#pg-18:${id}">${label}</button>`).join("");
    let body = "";
    if (cur === "usage") body = `<div class="panel"><div class="kv"><span>今日聊天</span><span>0.042 元</span></div><div class="kv"><span>每日运势</span><span>0.002 元</span></div><p class="sub">项目机上的 AI 成本由平台承担，不出现在这里。</p></div>`;
    if (cur === "sub") body = `<div class="panel"><p>面试 Agent · 未开通</p><p class="sub">未开通不是故障。每日运势免费，没有订阅卡。年费和用量、项目托管是三本账。</p></div>`;
    if (cur === "income") body = `<div class="panel"><b>邻里柜 · 待平台确认</b><div class="kv"><span>你的份额</span><span>38%</span></div><div class="kv"><span>其他成员</span><span>22%</span></div><div class="kv"><span>AI 归平台</span><span>40%</span></div><p class="sub">确认前不到账。平台若退回，会重算后再确认一次。</p></div>`;
    if (cur === "invite") body = `<div class="panel"><div class="kv"><span>注册积分</span><span>20 · 已入账</span></div><div class="kv"><span>成交奖金</span><span>待成交</span></div><button class="btn ghost" data-go="#pg-17:share">去邀请</button></div>`;
    return `<section class="page"><div class="backline"><button data-go="#pg-17">‹ 资料</button><h1>收入与账单</h1></div><div class="chipbar">${tabs}</div>${body}</section>`;
  }
  function pageAudit(filter) {
    const all = S.auditExtra.concat(MOCK.audit);
    const rows = all.filter((row) => !filter || filter === "all" || row.filter === filter || row.action === filter || (filter === "inject" && row.action === "harness_inject")).map((row) => `<article class="panel"><b>${esc(row.title)}</b><p class="mono">${esc(row.detail)}</p><p class="sub">${esc(row.action)} · ${esc(row.at || "")}</p></article>`).join("");
    const tabs = [["", "全部"], ["route", "路由"], ["inject", "注入"], ["edit", "编辑史"], ["grade", "奖励"], ["trace", "步骤迹"], ["retain", "保留"]].map(([id, label]) => `<button class="${(filter || "") === id ? "on" : ""}" data-go="#pg-19${id ? ":" + id : ""}">${label}</button>`).join("");
    return `<section class="page"><div class="backline"><button data-go="#pg-17:brain">‹ 数字大脑</button><h1>审计</h1></div><div class="chipbar">${tabs}</div>
      <p class="sub">先有 intent 才能执行。闲聊 trainable=false。screen_id 不是验收尺子。密钥和文件正文不进日志。</p>${rows}</section>`;
  }
  function pageHistory() {
    const list = allTopics().map((t) => `<button class="row" data-act="open-topic" data-id="${t.id}"><b>${esc(t.title)}</b></button>`).join("");
    return `<section class="page"><div class="backline"><button data-go="#pg-13:inbox">‹ 会话</button><h1>会话历史</h1></div><p class="sub">不是首页。主人格话题也在资料页「最近」。</p>${list}</section>`;
  }
  function pageGone(title, text) {
    return `<section class="page"><h1>${title}</h1><p>${text}</p><button class="btn" data-go="#pg-13:ask">回聊天</button></section>`;
  }
  function pageMarket() {
    return pageGone("技能包市场", "P1。不在本版主闭环里。程序技能包不是能力图谱上的雷达。");
  }
  function pageBounty() {
    return `<section class="page"><h1>没有独立悬赏页</h1><p>邀请在「分享给朋友」和手机联系人。钱在收入与账单的邀请奖励。</p><button class="btn" data-go="#pg-17:share">去分享</button></section>`;
  }

  function dispatch(r) {
    if (["pg-07", "pg-08", "pg-09", "pg-10", "pg-11"].includes(r.page)) return pageGone("这一页不在本版", "实战场和独立训练页已删除。以后在通讯录加好友，对话仍发生在聊天里。");
    if (r.page === "pg-01") return pageSplash();
    if (r.page === "pg-02") return pageLogin();
    if (r.page === "pg-03") return pageRealname();
    if (r.page === "pg-04") return pagePortrait();
    if (r.page === "pg-05") return pageResume();
    if (r.page === "pg-06") return pageGraph();
    if (r.page === "pg-12") return pageHistory();
    if (r.page === "pg-13" || (r.page === "pg-17" && !r.a)) return page13(r);
    if (r.page === "pg-14") return pageTasks("platform");
    if (r.page === "pg-15" && r.a === "nda") return pageNda(r.b || "semi");
    if (r.page === "pg-15") return pageDetail(r.a || "semi");
    if (r.page === "pg-16") return pageBounty();
    if (r.page === "pg-18") return pageBill(r.a || "usage");
    if (r.page === "pg-19") return pageAudit(r.a || "");
    if (r.page === "pg-20") return pageMarket();
    if (r.page === "pg-21") return pageSettings();
    if (r.page === "pg-22") return pageVault();
    if (r.page === "pg-23" && r.a === "newfriends") return pageNewFriends();
    if (r.page === "pg-23" && r.a === "phone") return pagePhone();
    if (r.page === "pg-23") return pageContacts();
    if (r.page === "pg-24") return pageTasks(r.a === "platform" ? "platform" : "mine");
    if (r.page === "pg-17" && r.a === "skills") return pageSkills();
    if (r.page === "pg-17" && r.a === "brain") return pageBrain();
    if (r.page === "pg-17" && r.a === "own") return pageOwn();
    if (r.page === "pg-17" && r.a === "act") return pageAct();
    if (r.page === "pg-17" && r.a === "memory") return pageMemory();
    if (r.page === "pg-17" && r.a === "pc") return pagePc();
    if (r.page === "pg-17" && r.a === "device") return pageDevice();
    if (r.page === "pg-17" && r.a === "space") return pageSpace();
    if (r.page === "pg-17" && r.a === "space_org") { S.persona = "registrar"; return pageSpace(); }
    if (r.page === "pg-17" && r.a === "join") return pageJoin();
    if (r.page === "pg-17" && r.a === "intent") return pageIntent();
    if (r.page === "pg-17" && r.a === "share") return pageShare();
    if (r.page === "pg-17" && r.a === "privacy") return pagePrivacy();
    if (r.page === "pg-17" && r.a === "profile") { S.drawer = true; S.drawerEdit = true; return renderAsk(false); }
    return pageGone("没有这一页", "从聊天、通讯录或任务继续。");
  }

  function render() {
    const jump = normalize(parseHash());
    if (jump) { location.hash = jump; return; }
    const r = parseHash();
    const html = dispatch(r);
    const fill = isFill(r) || (r.page === "pg-17" && r.a === "profile");
    document.getElementById("app").innerHTML = frame(html, { bar: wantsBar(r), tab: tabOf(r), fill, white: !fill && r.page !== "pg-13" });
    const search = document.querySelector("[data-field=search]");
    if (search && S.searchOpen) search.focus();
    save();
  }

  function costLine() {
    const m = MOCK.models[S.chip] || MOCK.models.fast;
    return m.yuan + " 元 · " + m.name + " · 可退";
  }
  function pushAudit(action, title, detail) {
    S.auditExtra.push({ action, title, detail, at: now(), filter: action.indexOf("route") >= 0 ? "route" : action });
  }
  function agent(text, gb, extra) {
    return Object.assign({ role: "agent", text, time: now(), gb: gb || "gb_hermes · 已核验 · 责任方 本人", cost: costLine() }, extra || {});
  }

  function sendCurrent() {
    const text = S.draft.trim();
    if (!text) return;
    S.heldNotice = false;
    const key = S.composeThread || "ask";
    if (S.turn === "thinking" || S.turn === "running") {
      S.queue.push({ key, text, held: false });
      S.draft = "";
      toast("将在本步结束后执行");
      render();
      return;
    }
    S.draft = "";
    let store = key;
    if (key === "ask") {
      const topicId = "t" + Date.now();
      S.topics.unshift({ id: topicId, title: text.slice(0, 16) });
      S.activeTopic = topicId;
      store = "topic:" + topicId;
      S.composeThread = store;
    }
    bag(store).push({ role: "user", text, time: now() });
    if (key === "ask" && location.hash !== "#pg-13:topic:" + S.activeTopic) location.hash = "#pg-13:topic:" + S.activeTopic;
    if (key.indexOf("human") >= 0 || store.indexOf("human") >= 0) {
      if (text.indexOf("@") >= 0) S.agentLocked = true;
      render();
      return;
    }
    if (S.takeover) {
      bag(store).push({ role: "card", kind: "note", title: "工具已拒绝", text: "你正在登录。这句话不排队，也不会替你操作。", time: now() });
      render();
      return;
    }
    const decision = classify(store, text);
    if (decision.approve) {
      const id = "ap" + Date.now();
      S.turn = "running";
      S.turnThread = store;
      bag(store).push({ role: "card", kind: "approve", id, status: "pending", time: now() });
      render();
      return;
    }
    if (decision.takeover) {
      S.takeover = true;
      S.turn = "idle";
      bag(store).push({ role: "card", kind: "takeover", text: "登录墙或验证码要你来。在这期间工具会拒绝，不排队。没有远程桌面。", time: now() });
      pushAudit("help_requested", "需要你登录", "人处理期间工具拒绝");
      render();
      return;
    }
    if (decision.cards) {
      decision.cards.forEach((c) => bag(store).push(Object.assign({ role: "card", time: now() }, c)));
      render();
      return;
    }
    beginTurn(store, text, decision.reply);
  }

  function classify(store, text) {
    const thread = store.startsWith("thread:") ? store.slice(7) : "";
    if (thread === "project" && !S.rulesOk) return { cards: [{ kind: "note", title: "这次还不能开工", text: "规则包还没通过校验。通过了也不等于可以写草稿。" }] };
    if (thread === "company" && text.indexOf("个人接单") >= 0) return { cards: [{ kind: "note", title: "越权", text: "公司线程不能交给个人接单分身。请交给该公司的二级工作分身。" }] };
    if (thread === "company" && text.indexOf("运势") >= 0) return { cards: [{ kind: "note", title: "越权", text: "每日运势只在生活空间。" }] };
    if (thread === "project" && /登录|验证码/.test(text)) return { takeover: true };
    if (thread === "project" && S.execHost === "local" && !S.localOnline && /写|安装|删除|草稿/.test(text)) {
      return { cards: [{ kind: "note", title: "电脑不在线", text: "写码先停着。不会自动改回阿里云无影。" }] };
    }
    if (thread === "project" && /写|安装|删除|草稿|shell/.test(text)) {
      if (!S.planAccepted) return { cards: [{ kind: "note", title: "还不能写入草稿", text: "没有被接受的实施计划。可以继续问，不能批量改文件、装包或跑危险命令。" }] };
      return { approve: true };
    }
    return { reply: replyFor(thread, store, text) };
  }
  function replyFor(thread, store, text) {
    if (thread === "learn") {
      if (text.indexOf("空清单") >= 0 || text.indexOf("不能代办") >= 0) return agent("这次还不能代办。", "gb_learn · 已核验 · 责任方 本人", { local: true });
      return agent("按你的笔记，履约要先有人确认的验收句。", "gb_learn · 已核验 · 责任方 本人", { local: true, source: "来源 · 个人学习笔记 · 履约状态机" });
    }
    if (thread === "fortune") {
      if (S.fortuneAsked) return agent("今天已经给过运势。我可以解释上一张卡，不会另开第二天。", "gb_fortune · 已核验 · 责任方 平台");
      S.fortuneAsked = true;
      return { role: "card", kind: "fortune", title: "今日运势", text: MOCK.fortune, time: now() };
    }
    if (thread === "digest") return agent("现在回顾：一张批准卡还开着，家庭会议只留了一行，公司要点没有进生活盘。", "gb_digest · 已核验 · 责任方 平台");
    if (thread === "order") return agent("这单记在个人接单下面，不会写进公司或生活盘。", "gb_order · 已核验 · 责任方 本人");
    if (thread === "project") return agent("我先记在清单上。真要改文件，会停在批准卡。主人格不会自己跑这台项目机。", "gb_pm_linli · 已核验 · 责任方 平台", { cost: "平台承担 · 不进开发者用量" });
    if (thread === "company") return agent("已由澄川律所的二级工作分身收下。群里不会出现你的个人昵称。", "gb_seat · 已核验 · 责任方 澄川律所", { cost: "平台承担 · 不进开发者用量" });
    if (text.indexOf("目标") >= 0 || text.indexOf("意图") >= 0) return agent("你提交过：" + (S.intents[0] || "还没有意图") + "。目标尚未驱动执行，我只读出来。", "gb_hermes · 已核验 · 责任方 本人");
    if (S.chip === "fast") return agent("我在聊天档回答，不唤醒云电脑。你刚才说：「" + text.slice(0, 42) + "」。", "gb_hermes · 已核验 · 责任方 本人");
    return agent("已用 " + MOCK.models[S.chip].name + " 接住。要写草稿时我会先出示 diff。", "gb_hermes · 已核验 · 责任方 本人");
  }
  function beginTurn(store, text, reply) {
    const token = ++turnToken;
    S.turn = "thinking";
    S.turnThread = store;
    render();
    setTimeout(() => {
      if (token !== turnToken || S.turn === "aborted") return;
      S.turn = "running";
      render();
      setTimeout(() => {
        if (token !== turnToken || S.turn === "aborted") return;
        bag(store).push(reply);
        S.turn = "finished";
        render();
        setTimeout(() => {
          if (token !== turnToken) return;
          S.turn = "idle";
          render();
          maybeFlush();
        }, 400);
      }, 700);
    }, 500);
  }
  function maybeFlush() {
    if (S.turn === "thinking" || S.turn === "running" || !S.queue.length) return;
    const next = S.queue.shift();
    S.draft = next.text;
    S.composeThread = next.key;
    if (next.key.indexOf("topic:") === 0) S.activeTopic = next.key.slice(6);
    sendCurrent();
  }
  function stopTurn() {
    if (S.turn !== "thinking" && S.turn !== "running") return;
    turnToken++;
    const key = S.turnThread || S.composeThread;
    S.queue = [];
    S.heldNotice = true;
    if (key) bag(key).push({ role: "card", kind: "note", title: "已停止", text: "已停止。补充完整后再发送。排队的话不会自动执行。", time: now() });
    pushAudit("runtime_stop", "停止打穿本 Turn", S.execHost === "local" ? "只停本 Turn 进程树，不关用户整机" : "无影停本 Turn，不关整机");
    S.turn = "idle";
    toast("已停止");
    render();
  }
  function findApprove(id) {
    const lists = Object.keys(S.bags);
    for (let i = 0; i < lists.length; i++) {
      const hit = S.bags[lists[i]].find((m) => m.id === id);
      if (hit) return hit;
    }
    return null;
  }

  function requireRealname(next) {
    if (S.realname === "done") { go(next); return; }
    S.afterRealname = next;
    toast(S.realname === "pending" ? "实名还在审核" : "进平台项目前需要实名");
    go("#pg-03");
  }

  function resetPersona(persona) {
    const keepDock = true;
    S = defaultState();
    S.persona = persona || "developer";
    S.realname = who().realname;
    if (!keepDock) return;
  }
  function bootReturning(persona) {
    resetPersona(persona);
    S.authed = true;
    S.onboarded = true;
    S.isNew = false;
    S.showScout = true;
    S.realname = (MOCK.personas[persona] || MOCK.personas.developer).realname;
    if (persona === "pm") { S.joined.semi = true; S.projectKind = "semi"; }
    if (persona === "employee") { S.joined.closed = true; S.projectKind = "closed"; S.realname = "done"; }
    if (persona === "registrar") S.realname = "done";
  }

  function onClick(e) {
    const el = e.target.closest("[data-act],[data-go]");
    if (!el) return;
    if (el.dataset.go && !el.dataset.act) { go(el.dataset.go); return; }
    const act = el.dataset.act;
    const id = el.dataset.id;
    if (act === "splash-next") {
      go(S.authed && S.onboarded ? "#pg-13:ask" : "#pg-02");
      return;
    }
    if (act === "set-persona") { S.persona = id; S.realname = MOCK.personas[id].realname; render(); return; }
    if (act === "set-new") { S.isNew = id === "1"; render(); return; }
    if (act === "send-code") { S.codeSent = true; toast("验证码已发出，原型填任意 4 位"); render(); return; }
    if (act === "login") {
      if (!/^1\d{10}$/.test(S.phoneDraft)) { toast("请填 11 位手机号"); return; }
      if (!/^\d{4}$/.test(S.codeDraft)) { toast("请填 4 位验证码"); return; }
      S.authed = true;
      S.realname = who().realname;
      if (S.isNew) { S.onboarded = false; go("#pg-04"); }
      else { S.onboarded = true; S.showScout = true; go("#pg-13:ask"); }
      return;
    }
    if (act === "portrait-pick") { S.answers[S.q] = Number(id); render(); return; }
    if (act === "portrait-next") {
      if (S.answers[S.q] === null) { toast("先选一个"); return; }
      if (S.q >= 6) go("#pg-05");
      else { S.q += 1; render(); }
      return;
    }
    if (act === "portrait-skip") { go("#pg-05"); return; }
    if (act === "resume-parse") {
      S.parsing = true; render();
      setTimeout(() => { S.parsing = false; S.parsed = true; S.resume.name = who().nickname; render(); }, 900);
      return;
    }
    if (act === "resume-confirm") { go("#pg-06"); return; }
    if (act === "cover-dim") { S.criticCover = !S.criticCover; toast(S.criticCover ? "已覆盖协作维，界面上看得见" : "已恢复平台分"); render(); return; }
    if (act === "nps") { toast("已记下。本版只留入口"); return; }
    if (act === "finish-onboard") { S.onboarded = true; go("#pg-13:ask"); return; }
    if (act === "save-accept") { toast(S.acceptance.trim() ? "验收标准已挂上" : "先写一句"); return; }
    if (act === "tab") {
      if (id === "chat") { S.activeTopic = null; go("#pg-13:ask"); }
      if (id === "contacts") go("#pg-23");
      if (id === "tasks") go("#pg-24");
      return;
    }
    if (act === "to-ask") { S.activeTopic = null; go("#pg-13:ask"); return; }
    if (act === "open-drawer") { S.drawer = true; S.drawerEdit = false; render(); return; }
    if (act === "close-drawer") { S.drawer = false; S.drawerEdit = false; render(); return; }
    if (act === "toggle-search") { S.searchOpen = !S.searchOpen; render(); return; }
    if (act === "edit-profile") { S.drawerEdit = true; S.nickDraft = who().nickname; render(); return; }
    if (act === "drawer-home") { S.drawerEdit = false; render(); return; }
    if (act === "save-profile") {
      const name = (S.nickDraft || "").trim();
      if (name.length < 2 || name.length > 16) { toast("昵称要 2–16 字"); return; }
      S.nickname = name; S.drawerEdit = false; toast("已保存"); render(); return;
    }
    if (act === "letter-avatar") { S.avatarMode = "letter"; S.photo = ""; render(); return; }
    if (act === "copy-id") { toast("已复制 " + who().userId); return; }
    if (act === "logout") { S.authed = false; S.drawer = false; go("#pg-02"); return; }
    if (act === "open-topic") { S.drawer = false; S.activeTopic = id; go("#pg-13:topic:" + id); return; }
    if (act === "chip") { S.chip = id; render(); return; }
    if (act === "send") { sendCurrent(); return; }
    if (act === "stop") { stopTurn(); return; }
    if (act === "voice") return;
    if (act === "open-attach") { S.sheet = "attach"; render(); return; }
    if (act === "add-file") { S.draft = (S.draft ? S.draft + " " : "") + "已附加 验收标准.pdf"; S.sheet = null; render(); return; }
    if (act === "close-sheet") { S.sheet = null; render(); return; }
    if (act === "approve" || act === "reject" || act === "approve-timeout") {
      const card = findApprove(id);
      if (!card) return;
      S.turn = "idle";
      if (act === "approve") {
        card.status = "done"; card.kind = "note"; card.title = "已批准"; card.text = "审计已先写下 intent，然后才执行。失败会再记一行，不会退到裸跑。";
        pushAudit("intent", "准备写入草稿面", "路径摘要 · 不记密钥 · 早于执行");
        pushAudit("exec", "草稿面写入", "发生在 intent 之后");
        toast("已先审计再执行");
      maybeFlush();
      } else if (act === "reject") {
        card.status = "done"; card.kind = "note"; card.title = "已拒绝"; card.text = "失败封闭，没有改到发布面。";
      } else {
        card.status = "done"; card.kind = "note"; card.title = "批准已超时取消"; card.text = "同一次运行里的阻塞步超时了，不会静默同意。";
      }
      render();
      return;
    }
    if (act === "release-takeover") { S.takeover = false; pushAudit("control_released", "交还", "工具恢复"); toast("方向盘已交还"); render(); return; }
    if (act === "recall") {
      if (S.readHuman || S.agentLocked) { toast("已读、超时，或已经交给智能体的，不能撤回"); return; }
      S.recalled = true; toast("已撤回"); render(); return;
    }
    if (act === "mark-read") { S.readHuman = true; toast("对方已读，不能再撤回"); render(); return; }
    if (act === "start-call") {
      if (id === "ask" || id === "fortune" || id === "order") { toast("这里没有电话"); return; }
      S.inCall = true; S.callThread = id; render(); return;
    }
    if (act === "hangup") {
      const idCall = S.callThread || (parseHash().a === "call" ? "family" : "");
      S.inCall = false;
      S.callThread = "";
      if (!idCall) { render(); return; }
      if (transcriptOn(idCall)) bag("minutes:" + idCall).push({ role: "card", kind: "minutes", title: "会议纪要", text: "纪要留在本群，不是新的会议助手。群动态只收一行。", time: now() });
      else bag("thread:" + idCall).push({ role: "system", text: "这次没有逐字稿，也没有纪要" });
      go("#pg-13:thread:" + idCall); return;
    }
    if (act === "open-info") { S.infoThread = id; S.sheet = "info"; render(); return; }
    if (act === "toggle-transcript") {
      if (!who().familyOwner) return;
      S.familyTranscript = !S.familyTranscript; render(); return;
    }
    if (act === "dissolve-family") { S.familyGone = true; S.sheet = null; toast("群已解散，记录随群主账户"); go("#pg-13:inbox"); return; }
    if (act === "set-host") {
      if (!who().groupOwner) { toast("只有群主能改"); return; }
      if (S.execHost !== id) { S.execHost = id; S.draftLeftBehind = true; toast("未发布草稿仍在上一台"); }
      render(); return;
    }
    if (act === "toggle-offline") { S.localOnline = !S.localOnline; render(); return; }
    if (act === "confirm-list") { S.worklistConfirmed = true; toast("清单已进群"); go("#pg-13:thread:project"); return; }
    if (act === "scout") {
      S.scoutDone = true;
      if (id === "yes") toast("已开新授权。只读调查本身不写仓");
      render(); return;
    }
    if (act === "friction") { S.frictionShared = id === "yes"; toast(id === "yes" ? "先记成私人项目经验，还不是规则" : "这次不记"); render(); return; }
    if (act === "fortune-dnd") { S.fortuneDnd = !S.fortuneDnd; toast(S.fortuneDnd ? "已停每日推送，人还在通讯录里" : "已恢复推送"); render(); return; }
    if (act === "toggle-work") { S.workOpen = !S.workOpen; render(); return; }
    if (act === "open-add") { S.sheet = "add"; render(); return; }
    if (act === "agent-later") { toast("未开通，不是故障"); return; }
    if (act === "friend") { S.friendState = id === "yes" ? "accepted" : "ignored"; render(); return; }
    if (act === "invite") { S.inviteName = id; S.sheet = "invite"; render(); return; }
    if (act === "phone-add") { toast(id + " 已在好友里或待你添加"); return; }
    if (act === "share-via") { S.sheet = null; toast("已通过" + id + "发出邀请码 " + MOCK.inviteCode); render(); return; }
    if (act === "copy-code") { toast("已复制 " + MOCK.inviteCode); return; }
    if (act === "copy-link") { toast("已复制加入链接"); return; }
    if (act === "org-accept") {
      if (who().registrar) { toast("登记人不必接受自己的链接"); return; }
      S.joinedOrg = true; toast("通讯录已出现" + MOCK.orgName); go("#pg-23"); return;
    }
    if (act === "org-decline") { toast("未加入"); go("#pg-13:ask"); return; }
    if (act === "seat-apply") {
      if (!who().joinedOrg) { toast("先接受加入链接"); return; }
      S.seat = "pending"; render(); return;
    }
    if (act === "seat-pass") { S.seat = "active"; toast("二级工作分身已在通讯录"); render(); return; }
    if (act === "task-go") {
      if (id === "closed" && !who().employee) { toast("封闭式只对全职员工开放"); return; }
      const next = id === "closed" ? "#pg-13:thread:project" : "#pg-15:nda:" + id;
      if (id === "closed") {
        if (S.realname !== "done") { requireRealname("#pg-15:closed"); return; }
        S.joined.closed = true; S.projectKind = "closed"; go("#pg-13:thread:project"); return;
      }
      if (S.realname !== "done") { requireRealname(next); return; }
      go(next); return;
    }
    if (act === "apply-open") {
      if (S.realname !== "done") { requireRealname("#pg-15:open"); return; }
      S.openReview = "pending"; render(); return;
    }
    if (act === "review") { S.openReview = id === "pass" ? "pass" : "reject"; render(); return; }
    if (act === "nda-tick") { S.ndaTick = !S.ndaTick; render(); return; }
    if (act === "nda-sign") {
      if (!S.ndaTick) return;
      S.nda[id] = true; S.joined[id] = true; S.projectKind = id; S.ndaTick = false;
      toast("已进群，建群以来的记录已同步"); go("#pg-13:thread:project"); return;
    }
    if (act === "realname-submit") { S.realname = "pending"; render(); return; }
    if (act === "realname-pass") {
      S.realname = "done";
      const next = S.afterRealname; S.afterRealname = "";
      toast("已认证");
      if (next && next !== "#stay") go(next); else render();
      return;
    }
    if (act === "export") { S.exportReady = true; render(); return; }
    if (act === "delete-data") { S.deleted = true; render(); return; }
    if (act === "posture") { S.posture = id; render(); return; }
    if (act === "act") {
      const key = el.dataset.key;
      if (["password", "pay", "publish"].includes(key)) { toast("这项必须你亲自做"); return; }
      S.act[key] = id; render(); return;
    }
    if (act === "connector") { S.connectors[id] = !S.connectors[id]; render(); return; }
    if (act === "wake-pc") { S.pc = S.pc === "sleeping" ? "awake" : "sleeping"; render(); return; }
    if (act === "add-intent") {
      const t = S.intentDraft.trim();
      if (!t) return;
      S.intents.unshift(t); S.intentDraft = ""; toast("已提交。还不会驱动执行"); render(); return;
    }
    if (act === "lang") { toast("本版只有简体中文"); return; }
    if (act === "password") { toast("密码已更新（原型）"); return; }
    if (act === "theme") { toast("本版外观为浅色"); return; }
    if (act === "noop") { toast("已重读本机通讯录"); return; }
  }

  function onInput(e) {
    const t = e.target;
    if (t.dataset.field === "draft") {
      S.draft = t.value;
      const primary = t.parentElement && t.parentElement.querySelector(".round");
      if (primary && S.turn !== "thinking" && S.turn !== "running") {
        const ready = S.draft.trim().length > 0;
        primary.dataset.act = ready ? "send" : "voice";
        primary.setAttribute("aria-label", ready ? "发送" : "语音转写");
        primary.textContent = ready ? "↑" : "麦";
      }
    }
    else if (t.dataset.field === "phone") S.phoneDraft = t.value;
    else if (t.dataset.field === "code") S.codeDraft = t.value;
    else if (t.dataset.field === "nick") S.nickDraft = t.value;
    else if (t.dataset.field === "accept") S.acceptance = t.value;
    else if (t.dataset.field === "intent") S.intentDraft = t.value;
    else if (t.dataset.field === "resume") S.resume[t.dataset.k] = t.value;
    else if (t.dataset.field === "search") { S.searchQ = t.value; render(); }
    else if (t.dataset.field === "tz") { toast("时区按 " + t.value + " 计算运势"); }
  }
  function onKey(e) {
    if (e.key === "Escape" && S.drawer) { S.drawer = false; render(); }
    if (e.key === "Enter" && !e.shiftKey && e.target.dataset && e.target.dataset.field === "draft") {
      e.preventDefault();
      sendCurrent();
    }
  }
  function onPointerDown(e) {
    if (!e.target.closest("[data-act=voice]")) return;
    S.listening = true;
    render();
  }
  function onPointerUp() {
    if (!S.listening) return;
    S.listening = false;
    S.draft = (S.draft ? S.draft + " " : "") + "帮我看一下今天还没收口的验收";
    render();
  }

  function scene(name) {
    const goAsk = () => go("#pg-13:ask");
    if (name === "splash") { sessionStorage.removeItem("clondx-vse"); S = defaultState(); location.hash = "#pg-01"; render(); return; }
    if (name === "returning") { bootReturning("developer"); goAsk(); return; }
    if (name === "inbox") { bootReturning("developer"); go("#pg-13:inbox"); return; }
    if (name === "approve") {
      bootReturning("developer"); S.joined.semi = true; S.projectKind = "semi";
      bag("thread:project").push({ role: "card", kind: "approve", id: "demo-ap", status: "pending", time: now() });
      go("#pg-13:thread:project"); return;
    }
    if (name === "takeover") {
      bootReturning("developer"); S.joined.semi = true; S.takeover = true;
      bag("thread:project").push({ role: "card", kind: "takeover", text: "需要你登录。处理期间工具拒绝，不排队。", time: now() });
      go("#pg-13:thread:project"); return;
    }
    if (name === "project") { bootReturning("pm"); go("#pg-13:thread:project"); return; }
    if (name === "pending") { bootReturning("pm"); S.worklistConfirmed = false; go("#pg-13:worklist_pending"); return; }
    if (name === "rules") { bootReturning("pm"); S.rulesOk = false; go("#pg-13:thread:project"); return; }
    if (name === "away") { bootReturning("pm"); S.showAway = true; go("#pg-13:away"); return; }
    if (name === "call") { bootReturning("developer"); S.inCall = true; S.callThread = "family"; go("#pg-13:thread:family"); return; }
    if (name === "tasks") { bootReturning("developer"); go("#pg-14"); return; }
    if (name === "employee") { bootReturning("employee"); go("#pg-14"); return; }
    if (name === "registrar") { bootReturning("registrar"); go("#pg-17:space"); return; }
    if (name === "audit") { bootReturning("developer"); go("#pg-19:route"); return; }
    if (name === "noplan") { bootReturning("pm"); S.planAccepted = false; go("#pg-13:thread:project"); return; }
  }
  function renderDock() {
    const items = [["冷启动", "splash"], ["老用户提问", "returning"], ["会话列表", "inbox"], ["批准卡", "approve"], ["接管卡", "takeover"], ["项目群", "project"], ["待群主确认", "pending"], ["规则未通过", "rules"], ["无计划", "noplan"], ["离开后续跑", "away"], ["群电话", "call"], ["任务三档", "tasks"], ["员工封闭任务", "employee"], ["登记人", "registrar"], ["审计路由", "audit"]];
    document.getElementById("dock").innerHTML = `<b>原型场景</b>${items.map(([label, id]) => `<button type="button" data-scene="${id}">${label}</button>`).join("")}<p>只用于验收跳转。产品菜单里没有这一层。</p>`;
    document.getElementById("dock").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-scene]");
      if (btn) scene(btn.dataset.scene);
    });
  }

  function boot() {
    load();
    renderDock();
    document.addEventListener("click", onClick);
    document.addEventListener("input", onInput);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("change", (e) => {
      if (e.target.id !== "avatar-file" || !e.target.files[0]) return;
      const reader = new FileReader();
      reader.onload = () => { S.photo = reader.result; S.avatarMode = "photo"; render(); };
      reader.readAsDataURL(e.target.files[0]);
    });
    window.addEventListener("hashchange", render);
    if (!location.hash) location.hash = "#pg-01";
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  window.CLONDX = { scene };
})();
