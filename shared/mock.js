window.CLONDX_MOCK = {
  version: "0.1.1",
  build: "2026-10-08",
  inviteCode: "CX-8F2A",
  orgLink: "https://clondx.app/join/chengchuan?t=org_8841",
  orgName: "澄川律所",
  models: {
    fast: { name: "Hermes-Flash", endpoint: "统一端点", note: "快速 · 不唤醒云电脑", yuan: "0.004" },
    standard: { name: "Hermes-Standard", endpoint: "统一端点", note: "标准", yuan: "0.012" },
    reason: { name: "Hermes-Reason", endpoint: "统一端点", note: "推理", yuan: "0.028" }
  },
  personas: {
    developer: {
      key: "developer", label: "独立开发者", nickname: "林昭", phone: "13812342618", userId: "CXU-104829",
      employee: false, registrar: false, groupOwner: false, familyOwner: true, matched: true,
      joinedOrg: false, seat: "none", realname: "none"
    },
    employee: {
      key: "employee", label: "全职员工", nickname: "陈屿", phone: "13900001111", userId: "CXU-220184",
      employee: true, registrar: false, groupOwner: false, familyOwner: false, matched: false,
      joinedOrg: true, seat: "active", realname: "done"
    },
    registrar: {
      key: "registrar", label: "登记人", nickname: "周宁", phone: "13600002222", userId: "CXU-100001",
      employee: false, registrar: true, groupOwner: false, familyOwner: false, matched: false,
      joinedOrg: true, seat: "org", realname: "done"
    },
    pm: {
      key: "pm", label: "人类项目经理", nickname: "苏衡", phone: "13700003333", userId: "CXU-300882",
      employee: true, registrar: false, groupOwner: true, familyOwner: false, matched: false,
      joinedOrg: true, seat: "active", realname: "done"
    }
  },
  dimensions: [
    ["D1 交付年限", "独立交付过几个完整上线项目？", "影响图谱「交付」与半封闭匹配"],
    ["D2 技术深度", "你最近三年写得最深的一层是？", "影响技术栈矩阵与项目范围"],
    ["D3 协作", "带人评审和接需求，你更常做哪件？", "影响协作维与群内角色"],
    ["D4 业务域", "哪类业务你能直接对验收标准？", "影响任务可见性说明"],
    ["D5 可用时间", "未来四周每周能投入多少？", "影响匹配完成度里的档期"],
    ["D6 风险偏好", "托管里程碑未过时，你接受退款条款吗？", "影响天使客户项目"],
    ["D7 收入目标", "这笔奖金你更在意总额还是范围？", "写入意图商店，尚不驱动执行"]
  ],
  dimOptions: [
    ["0–1 个", "2–4 个", "5 个以上"],
    ["界面", "服务与数据", "架构与交付"],
    ["独立写完", "评审带人", "两边都做"],
    ["交易履约", "企业服务", "内部工具"],
    ["10 小时内", "10–25 小时", "25 小时以上"],
    ["接受", "要先看条款", "不接受"],
    ["看总额", "看版本和范围", "先攒信用"]
  ],
  radar: [
    { name: "架构", score: 72 },
    { name: "前端", score: 81 },
    { name: "后端", score: 76 },
    { name: "测试", score: 64 },
    { name: "交付", score: 70 },
    { name: "协作", score: 68 }
  ],
  stacks: ["TypeScript", "React", "Go", "PostgreSQL", "云原生"],
  vault: [
    { name: "履约状态机", verify: "待核验", from: "简历" },
    { name: "结算对账", verify: "待核验", from: "简历" },
    { name: "群内评审记录", verify: "未开通", from: "后期 Agent" }
  ],
  tasks: {
    closed: {
      id: "closed", openness: "封闭式", title: "结算中台热修", bonus: "¥18,000", version: "V1.2",
      scope: "结算对账热修", summary: "仅平台全职员工可见。员工身份进入，不重复签项目保密协议。",
      accept: "热修不得改发布面以外的账本；回滚可退该里程碑。",
      cta: "进入项目"
    },
    semi: {
      id: "semi", openness: "半封闭式", title: "邻里柜履约台", bonus: "¥46,000", version: "V1",
      scope: "前后端代码开发", summary: "只投递给已匹配的独立开发者。同意加入并签署项目保密协议后进群，无报名审核。",
      accept: "验收只认发布面。完成度口径来自核验轨迹，召回命中不加图谱分。",
      grade: "完成度 B · 来自核验通过，不是召回命中",
      cta: "同意加入"
    },
    open: {
      id: "open", openness: "全开放式", title: "校园跑腿小程序", bonus: "¥22,000", version: "V1",
      scope: "小程序与后台", summary: "所有用户可申请。审核通过并签署项目保密协议后进群。",
      accept: "首个里程碑为可下单闭环。不达标退该里程碑托管款。",
      cta: "申请参加"
    }
  },
  weights: { self: 38, others: 22, ai: 40, status: "待平台确认" },
  contacts: {
    friends: [{ name: "何麦", id: "CXU-551002", pending: true }, { name: "苏衡", id: "CXU-300882", pending: false }],
    phone: [
      { name: "阿梁", phone: "13800001001", state: "invite" },
      { name: "小周", phone: "13800001002", state: "add" },
      { name: "老韩", phone: "13800001003", state: "friend" }
    ],
    colleagues: [
      { name: "周宁", role: "登记人", id: "CXU-100001" },
      { name: "陈屿", role: "同事", id: "CXU-220184" },
      { name: "苏衡", role: "同事", id: "CXU-300882" }
    ]
  },
  topics: [
    { id: "t1", title: "今天先看哪件待办" },
    { id: "t2", title: "邻里柜验收标准怎么读" }
  ],
  audit: [
    { id: "a1", action: "intent", title: "准备写入草稿面", detail: "路径摘要 · 字节 1280 · 不记密钥", at: "09:12:01", order: 1 },
    { id: "a2", action: "harness_inject", title: "项目规则已注入本次启用", detail: "plane=draft · image_id=wuying-proj-gold · pack_version=7", at: "09:12:02", order: 2 },
    { id: "a3", action: "exec", title: "草稿面写入已执行", detail: "失败会再记一行。没有这条之前的 intent 不能开机", at: "09:12:06", order: 3 },
    { id: "a4", action: "route_decision", title: "路由决策", detail: "rule_id=RT-14 · upside_band=bounded · runtime=region · trainable=false · harness=Pi · critic_id=critic.default.v3", at: "09:12:01", filter: "route" },
    { id: "a5", action: "route_decision", title: "闲聊路由", detail: "rule_id=RT-02 · upside_band=chat · runtime=device · trainable=false · harness=none · culture_mode=off", at: "08:40:12", filter: "route" },
    { id: "a6", action: "runtime_stop", title: "停止打穿本 Turn", detail: "无影停本 Turn 进程树 · 不关整机", at: "09:18:44", filter: "route" },
    { id: "a7", action: "reward_event", title: "核验通过", detail: "reward_type=verifier_pass · verifier_id=v-publish · critic_id=critic.default.v3", at: "11:02:18", filter: "grade" },
    { id: "a8", action: "pack_edit", title: "编辑史 · 只改一条规则", detail: "假设：少一次返工 · 组件=rule · 核验分差 +0.4 · 成本差 -3% · screen_id=scr-19 · 裁决=待人确认。screen_id 不是验收尺子", at: "11:20:00", filter: "edit" },
    { id: "a9", action: "retain", title: "保留计数", detail: "原文 2 · 句柄 5 · 移出模型窗 1 · #pg-19:retain", at: "11:21:10", filter: "retain" },
    { id: "a10", action: "trace", title: "步骤迹", detail: "工具名 write_draft · 原因 清单已确认项 · 状态 待批准 · 参数只留摘要", at: "09:12:03", filter: "trace" },
    { id: "a11", action: "help_requested", title: "接管", detail: "需要你登录 · 人处理期间工具拒绝且不排队", at: "10:02:00", filter: "all" }
  ],
  exportManifest: [
    "数据域 resume / memory / behavior / capability",
    "Session Log",
    "意图商店条目",
    "技能节点",
    "评测维度说明",
    "embedding_model_id",
    "critic_id / critic_version / reward_fn_id / verifier_id",
    "不含项目隔离卷",
    "不含机构合规尺子",
    "含自己作群主的家庭群",
    "代码仓库域：未开通"
  ],
  sdlc: [
    ["PRD", "已完成"],
    ["前端设计文档", "已完成"],
    ["架构设计文档", "进行中"],
    ["前后端代码", "进行中"],
    ["测试", "待开始"],
    ["部署", "待开始"],
    ["运维", "待开始"],
    ["V2+ / 退役", "待开始"]
  ],
  fortune: "宜：把验收标准写成可核验的句子。忌：用闲聊当完成。娱乐内容，不构成医疗、法律或投资建议。",
  policy: "ClondX 按受托保管处理个人数据。隐私政策说明收集与使用；数据能否导出、删除和撤回授权，在数字大脑的数据所有权与行动授权里行使。隐私政策不等于数据所有权。"
};
