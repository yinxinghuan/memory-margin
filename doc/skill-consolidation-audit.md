# 空间叙事技能沉淀综合审计

审计对象：`/Users/yin/code/games/.agents/skills/build-spatial-story-game`。本表按本轮实际返工逐项检查，不把“项目里修好了”自动等同于“技能已经可交接”。

## 已进入技能的能力

| 本轮暴露的问题 | 技能中的稳定位置 | 可执行或离线证据 | 结论 |
|---|---|---|---|
| 接收方不能依赖打开旧游戏才知道正确视角 | `references/modular-orthographic-scene.md`、`assets/orthographic-b/*` | 包内 scene / actor / props / assembled doorway 参考图及固定 SHA | 已沉淀 |
| 地板与墙必须是独立素材，整房图不能顶替地图 | `SKILL.md` 制作顺序、`modular-orthographic-scene.md`、`wall-door-assembly.md` | world manifest 与真实 renderer 双验收 | 已沉淀 |
| 顶部由侧墙盖北墙、底部由南墙盖侧墙；角部不能靠异常高光拼接 | `wall-door-assembly.md` 的“不对称墙角层级”和“侧墙接缝复验” | `assets/wall-assembly.mjs`；package check 验证 renderLayer、北墙不外伸、南墙外伸 | 已沉淀 |
| 主角、NPC、门、家具、地砖与小物比例成组协调 | `art-admission-gate.md` | `scripts/audit-projected-art.py`；package check 覆盖成人身高、拉伸墙/物件和家具比例拒绝 | 已沉淀 |
| 主角四向走路是最高优先级素材，不能只看站立图或局部拼腿 | `protagonist-asset-gate.md`、`art-admission-gate.md`、`mobile-motion.md` | `audit-hero-sheet.py` 检查逐帧 request/task/SHA、完整身体操作、脚底/头部/高度漂移；真实 renderer 连续帧仍为视觉门禁 | 已沉淀 |
| 家具必须是同场景正投；允许少量绕竖轴约 45° 的斜视正投 | `art-admission-gate.md`、`environment-density.md` | 最终合成画面逐件检查两组平行边、远端不缩窄 | 已沉淀，视觉判断不可只靠脚本 |
| 桌上物件必须接触桌面，桌子改比例后同步重算 | `art-admission-gate.md`、`environment-density.md` | 支撑面、接触点、脚点及两手机尺寸截图门禁 | 已沉淀 |
| 探索镜头需要适度推进，不能默认完整地图 contain | `viewport-and-closeups.md` | 总览/推进对照、两方向跟随、点击反变换验证 | 已沉淀 |
| 特写图不受地图投影限制，但不能混入可行走地图 | `modular-orthographic-scene.md`、`viewport-and-closeups.md` | 特写关闭原位置、状态一致和刷新持久化验收 | 已沉淀 |
| 门的外观、四方向门洞、门槛、触发点和返回落点必须统一 | `wall-door-assembly.md`、`acceptance.md` | `validate-world.mjs`；package check 覆盖 approach、threshold、activation、arrival | 已沉淀 |
| 靠近后先出现行动按钮，玩家主动点击后才展开内容 | `exploration-interaction.md`、`assets/nearby-interaction.mjs` | package check 的 two-stage interaction；包内 near/open/side-door 截图 | 已沉淀 |
| 六套 UI 必须是稳定目录，第 5 套为 `05-terminal` | `ui-theme-catalog.md`、`assets/ui-theme-tokens.css` | package check 验证六个稳定 ID、终端色值与 reading 字体角色 | 已沉淀 |
| 第 5 套中的摇杆仍应一眼像可拖动控件 | `ui-theme-catalog.md` 第 5 套结构要求 | `direct-control` 语义角色、圆形轨道与活动把手要求 | 已沉淀 |
| 房间不能只有关键物件；家具、物件和使用痕迹要组成工作关系 | `environment-density.md` | 代表房间 + 不同用途第二场景、路线与支撑物复验 | 已沉淀 |
| 默认使用独立家具/物件，而不是全部烘进地板 | `environment-density.md` | 独立 placement、footprint、support 合同；整图仅作研究候选 | 已沉淀 |
| 大场景需要多区、地标、家具群和横纵镜头移动 | `large-scene-layout.md` | 区域可达、主/绕行路线、多位置真实截图 | 已沉淀 |
| 素材生成能力必须与拼装能力分开计时和验收 | `SKILL.md`、`large-scene-layout.md` | 记录并行数、墙钟、单件耗时、首轮准入率、纠正轮数 | 已沉淀 |
| 偏离最初提示但能承担更合适空间角色的素材可以重新定义 | `large-scene-layout.md` | 要求用户确认并同步名称、摆放、碰撞和文档 | 已沉淀 |
| 正式声画资源必须由平台媒体服务产生 | `SKILL.md` 范围规则、`modular-orthographic-scene.md` | 依赖 `alteru-media-service` 的 session/request/task、SHA 与 QA 合同 | 已沉淀 |
| 高保真版本不能遗漏背景音乐；静默必须是明确创意选择 | `release-completeness.md`、`acceptance.md` | 音乐/SFX 平台账本；本地与双线上地址检查真实解码、播放时间推进和静音恢复 | 已沉淀 |
| “可玩”不能代替章节、美术、声画、海报和发布状态全部收口 | `release-completeness.md`、`production-evidence.md` | 完成条件、运行素材 accepted、文档状态、双部署 bundle、目录与海报逐层复验 | 已沉淀 |
| 新房间先交付可进入虚空，再逐项替换高保真视觉 | `progressive-room-delivery.md` | `validate-progressive-room.mjs` + `progressive-room-contract.json`；当前项目真实四槽位合同通过 | 已沉淀 |
| 虚空状态提示“世界正在加载 / 可以先四处看看” | `SKILL.md`、`progressive-room-delivery.md` | 两手机尺寸浏览器截图和 `role=status` 断言 | 已沉淀 |
| 玩家界面不能暴露坐标、碰撞、队列、后台素材、画布尺寸或测速 | `acceptance.md`、`ui-theme-catalog.md`、`progressive-room-delivery.md` | 新校验器主动拒绝中英文实现词；当前截图脚本也做 DOM 禁词检查 | 已沉淀 |
| 生成成功、测试通过不能代替最终合成画面检查 | `final-visual-gate.md` | 两轮同状态截图、P0/P1 修复后重新逐件签收 | 已沉淀 |
| 接近旧街体验必须包含真实地图、目标/物品/线索/人物背包、菜单和持续 NPC 对话 | `reference-experience-parity.md`、`SKILL.md`、`acceptance.md` | 项目 `experience-parity.test.ts` + 两手机真实路线、背包、重复对话截图；包校验检查合同存在 | 已沉淀 |
| 声音属于顶部全局工具；底部主操作从空心不可用态切换到实底可执行态，并与摇杆留净空 | `ui-theme-catalog.md`、`exploration-interaction.md` | 两手机脚本检查按钮层级、背景、14px 净空和文字右对齐 | 已沉淀 |
| 新旅程不能把玩家直接丢进地图；需要处境、首个目标和操作桥接，恢复时不重播 | `reference-experience-parity.md`、`acceptance.md` | 两手机开场截图 + 从“开始探索”进入真实世界；Story Session version 0 才显示 | 已沉淀 |
| NPC 需要巡游、端点停顿、接近后停止并面向玩家 | `reference-experience-parity.md`、`acceptance.md` | `npc-motion.test.ts` + 两手机真实 renderer 位置变化/注意范围截图 | 已沉淀 |
| 动态 NPC 的画面、碰撞、接近点、热点和权威 action-range 必须共用位置 | `reference-experience-parity.md`、`SKILL.md`、`acceptance.md` | 项目运行时共享 entity 投影；脚本验证接近后行动键与朝向同时成立 | 已沉淀 |
| 对话必须按玩家发言、等待、NPC 回应、阅读、下一轮选项的时间顺序展开 | `reference-experience-parity.md`、`acceptance.md` | `experience-parity.test.ts` + 两手机五阶段浏览器断言与截图 | 已沉淀 |
| “功能完整”必须逐项声明开场、NPC 生活、历史、存档、声音和结局是否达到参考层级 | `reference-experience-parity.md` 的“参考层级声明” | `reference-experience-gap-audit.md` 完整差异矩阵；包校验检查声明存在 | 已沉淀 |

## 本次审计新增的机械保护

新增 `scripts/validate-progressive-room.mjs`。它检查：

- 虚空状态确实可进入；
- shell 与 complete 的出生点、出口 ID/锚点、槽位 ID和 footprint 完全一致；
- 玩家提示非空；
- 玩家提示不包含实现信息。

当前项目的 `scripts/export-progressive-room-contract.ts` 从真实 `auditRoomWorld` 和 `auditPlacements` 导出合同，`npm run validate:progressive-room` 已通过：`4` 个槽位、`1` 个出口。

技能包的独立回归增加三项：合法渐进房间通过、完成态 footprint 漂移被拒绝、玩家文案泄露内部信息被拒绝。

## 交接证明进度

原审计列出的两项当前进度：

1. **已完成：真实媒体回调。** `room_phase=live` 已接四个实际平台任务；浏览器证据覆盖骨架先进入、逐槽位替换、刷新立即恢复、玩家文案去内部信息。项目 3 项任务状态测试覆盖单件失败保留占位；技能新增 `assets/progressive-media-runtime.mjs`，交付包回归验证 accepted 恢复、终止失败隔离和刷新不重复读取。
2. **已完成：隔离接收方复验。** 同事 agent 只读取交付 ZIP，在“潮汐观测温室”新题材中从零完成空间壳、渐进房间、互动闭环、主题 UI、构建与两手机浏览器 QA。v1.35 首轮主动发现四项真实缺口：媒体客户端不自包含、附近回调没有传 position、缺少零依赖避障寻路、坐标锚点不明确。v1.36 修复后，同一隔离项目直接调用包内媒体客户端创建并恢复五类 AlterU 任务，验证失败后新 request、正式素材逐件准入、附近回调、包内寻路和 `coordinateAnchor: "foot"`。四项均通过；方向错误的门仍按门禁拒绝，整房因主角/标本池/方向门未全部签收而保持部分通过。

综合结论：本轮规则、真实媒体恢复和隔离接收方复验都已有证据。v1.37 加入主角 P0 准入门禁；v1.38 固化完整高度侧墙与门洞裁切；v1.39 增加高保真章节收口、音乐/音效、海报与线上真实播放门禁；v1.40 固化全局声音工具与底部情境操作的分区，并加入地图、背包、菜单与持续 NPC 对话合同；v1.41 继续补齐新旅程开场、NPC 环境活动与注意面向、动态人物共享几何，以及分阶段对话的时间合同。《记忆余量》已在真实 renderer 验证这些补项；隔离接收方此前验证了包自包含、真实媒体恢复、附近交互、寻路和脚点坐标合同。交付包已具备团队使用所需内容，但成熟度报告继续把“独立机制通过”与“隔离接收方完整高保真独立通过”分开：后者仍缺主角、方向门、整房全部签收以及 v1.41 新增开场/NPC/对话完整性的冷启动复验，不能宣称任意同事 agent 会一次自动产出合格美术与交互。
