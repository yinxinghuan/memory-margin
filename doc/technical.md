# 《记忆余量》技术文档

当前本地改造版，2026-09-24。目标是验证可移植空间 RPG 技能；尚未发布。本轮历史实现说明已保存于 `rebuild-20260924/technical-history.md`，不能把历史 SVG 场景描述当作当前运行架构。

## 1. 技术栈

- TypeScript、React 18、Vite 8，构建 base 为 `./`。
- 空间层：RPGJS 5 beta、CanvasEngine 2.2、PixiJS 8；依赖版本以 package.json/lock 为准。
- React 负责 HUD、不可见点击热区、对白、地图、背包、资料查看和菜单；正式场景的人物、家具、墙地均是 RPGJS 图形事件，不再用 DOM/SVG 叠景。
- 本地 IndexedDB 存权威旅程，session-scoped browser storage 保存待完成提交和偏好。单旅程；不承诺跨设备存档。

## 2. 目录结构

- `src/story.ts`、`src/journey.ts`：题材规则、事实与事务提交、恢复。
- `src/world.ts`、`src/spatial/world.ts`：场景、出口、家具 footprint、碰撞与寻路。
- `src/spatial/rpg-space.ts`：RPGJS 启动、地图握手、图形素材预加载、移动与转场。
- `src/rpg-visuals.ts`、`src/scene-layers.json`：静态场景与 NPC 图形事件、纹理缓存、状态图、南墙局部可见性。
- `src/art.ts`、`src/npc-motion.ts`：角色尺寸/图集、距离步态、巡游与面向。
- `src/main.tsx`、`src/experience-shell.tsx`、`src/style.css`：交互层、05-terminal UI、地图/背包/菜单。
- `src/free-dialogue.ts`、`src/conversation.ts`、`src/conversation-history.ts`：真实自由输入、作者话题、成对历史；不拥有剧情权威。
- `src/architecture.tsx`：模块化墙门装配源，供离线烘焙和实验场景；正式玩法读取已烘焙独立层。
- `scripts/bake-scene-layers.tsx`、`crop-scene-layers.py`：完整原始层到独立引擎纹理；支持指定层 ID 或 --structure。
- `scripts/rebuild-architecture-projection.ts`：当前运行建筑的等比缩放审计来源，供 export-world 使用。
- `doc/rebuild-20260924/art/`：原始平台请求、父图、SHA、下载与视觉准入状态。
- `public/art/rebuild-20260924/`：新人物/墙门/地板/设备；其他仍使用中的旧资产必须逐项复核，不能把本轮来源扩称到它们。
- `_qa/rebuild-20260924/`：本轮独立验证证据，避免覆盖历史 QA。

## 3. 核心模块

### 叙事与保存
故事 reducer/旅程事务是唯一事实来源。门、物件和人物动作都携带当前场景、版本和实际位置；权限与距离通过后才提交。前端在权威转场成功后 restore 对应 RPGJS 地图；刷新恢复同一旅程。模型回复只入成对会话历史，不能直接传送、改库存或设置结局。

### 渲染与移动
当前三室注册 46 张独立静态纹理与 3 名 NPC；运行房间有 15/17 个事件。加载时预先缓存纹理，移动帧只更新人物、相机和局部前景几何。主角速度 82、步幅周期 56 世界单位；实际碰撞后路程驱动左右接触相与站姿。所有演员源格 256、脚线 243、可见高 216，显示格 84，约 71 世界单位可见高。NPC 横向/纵向巡游按各自 profile；职员原地转向，未宣称其未用方向具备完整步态。

相机跟随真实位置直接更新共享世界 transform，UI 附近目标位置快照最多约 12.5Hz。家具视觉框与落地 footprint 分开，NPC 的视觉/热点/碰撞/接近点共用动态位置。点击巡游 NPC 后用独立 approachingTarget 保持其等待并面向玩家，取消路径/手动移动后释放；不能让附近焦点清空取消正在接近的目标。门洞、activation、到达点由 world 统一定义。北墙→侧墙→人物→南墙；前景局部 stencil 保持门口人物可见，离开后恢复，不重新生成整墙纹理。

### UI 与输入
键盘、摇杆和点击寻路共用空间接口。点击热点只走近；底部实底行动按钮才查看/交谈/转场。门口不叠加遮住角色的重复文字牌。05-terminal 保持声音右上、摇杆与行动区间隔、行动文字右侧布局。

地图展示已到访房间的轮廓、门口、占地和路线；它是路线图，不标为实时精确定位。背包按目标、物品、线索、人物组织，资料可放大；未知人物不能提前列出。人物卡引用各自独立新肖像，不再使用旧拼图坐标。

作者话题按等待→回复→阅读停顿→选项显示。自由输入发送真实平台 game-chat 请求：500 字上限、25 秒超时、IME 防误发；失败保留草稿，关闭取消且忽略迟到响应。上下文只包含当前已介绍 NPC 的允许话题与有限历史；实际服务返回和 mock 生命周期分别取证。

### 音频与语言
首次操作开启背景音乐，静音开关控制音乐与提示音；脚步按真实位移间隔 28 世界单位触发，碰墙/暂停不生成假脚步。新旅程遵循明确 zh/en 覆盖，其次中文系统中文、其他系统英文；旧旅程保留自己的已保存语言。中文不改变虚构数字居住区及人物身份。

### 当前验证边界
34 项机械测试、构建、墙门等比审计、三房往返已通过；两尺寸地图/背包/资料与结局恢复已实测。桌面一分钟持续输入未观察到逐步退化，不等于 iPhone AlterU 验收。主角四向接触相已查看真实 renderer 帧；两条相反选择的路线各完成 23 次操作并刷新恢复。技能 ZIP 已在临时目录完成机械独立检查，但不是独立制作新游戏的视觉通过证明。全员动作最终签收、手机键盘与真实性能仍需要明确证据；自动化不证明玩家理解（comprehension unverified）。

## 4. 扩展点

- 新剧情：story/journey；新地点：world、TMX 导出与共享出口模型，不能让模型任意发坐标。
- 新美术：平台媒体 SDK、稳定 request ID、text/edit 明确来源；先原图准入，再处理/装配、真实 renderer 复拍。NPC 非对称服饰不直接镜像。
- 新墙门：architecture、door-wall-art 元数据、投影审计；先 bake，再 crop，再 build。原图与裁切输出分目录，重复裁切不得改变坐标。
- 调整 UI：experience-shell/main/style；沿用语义主题，新增数据来自已揭示权威事实。
- 新后端/多旅程/跨设备能力：另立需求和恢复合同，不能把当前浏览器存档宣称为云端能力。


## 连续话题更新（2026-09-24）
使用 src/conversation-flow.ts 对完整已提交问答做话题完成投影，稳定 topicKey 与回应一起保存；作者追问依赖 after，utility 不消耗。新增历史不再静默截断，界面分页与模型上下文窗口分开。存储适配、测试和边界见 conversation-lifecycle-20260924.md。


## 2026-09-26 地图导航改造
地图手势使用 `src/map-gesture.ts` 的纯模型与 `src/use-map-gesture.ts` 的 React 适配器。拖动只更新 RAF transform，结束时同步按钮缩放状态；支持累计阈值、双指切单指、取消、重新挂载和 resize。快捷前往通过现有旅程权威入口提交，沿已知且畅通的真实门路径检查，不绕过剧情条件。
本轮回归 40 项通过，构建通过。快捷前往后刷新位置保持；重复请求与陈旧版本有机械测试。手机尺寸浏览器检查与真实 iPhone 双指/持续拖动性能不是同一种证据，后者待试玩。

## 2026-09-26 互动面板状态一致性
`interaction-presentation.ts` 从已有事实生成物品当前描述，并通过原 domain resolver 查询操作前提（不提交、不改存档）。已读资料由统一 entity → document 映射提供正文和放大入口，覆盖回执、封签、记录、早餐、告示、服务说明、播放记录。内容面板不再使用接近前指导，也不根据“剧情动作为空”推断“没有可操作内容”。放大只读已揭示资料；C-09 查明后同步到放大记录。

## 2026-09-26 七区域正式地图
- `src/world.ts` 是七处场景、12 个门实体、12 条有向连接与碰撞的真源；新增区域仍走同一 RPGJS renderer。
- `src/exploration.ts` 定义四项生活观察/检测、双语材料和阶段提示。剧情效果经 `explorationRules` 进入原 reducer，不新增存档权威。
- `migrateStorySave` 只补缺失事实与地图节点；保留旧选择、当前地点、已到访地点和对话历史。
- `MemoryMap` 从 portals 广度搜索路线：未知地点可看名称/方向，只有沿途均已到访才可快捷前往；服务端同一规则再次校验。
- `scripts/export-room-maps.ts` 只导出当前世界 TMX，不会覆盖已准入美术；`bake-scene-layers.tsx` + `crop-scene-layers.py` 把现有平台素材装配为七处独立深度层。
- 新区域复用当前游戏平台素材；本轮没有新生图、没有读取旧街素材作为生成参考。
