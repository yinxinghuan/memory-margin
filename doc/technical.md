# 《记忆余量》技术文档

## 1. 技术栈

React 18、TypeScript、Vite 8；RPG-JS 5 beta / CanvasEngine 负责真实角色与地图，DOM/CSS 负责 HUD、独立物件、交互热点、档案和只读放大。三张 Tiled 地图由同一 `world` 清单导出，`base: './'`。当前是本地单人作者切片，没有正式后台、多人共享世界或线上发布。

正式运行画面从 `assets/platform-media.json` 与专项平台账本登记的媒体服务结果导出：三张纯地面、三面北墙、三张场景专用连续侧墙、南墙材质、独立门扇、桌、地毯、人物、物件和特写肖像。纯色背景的物件经过有来源哈希的透明化准备，记录在 `assets/platform-processed.json`。当前主角由完整身体平台单姿态源图装配，逐帧 request/task/SHA、允许操作与视觉签收证据记录在 `assets/hero-v7-assembly.json`；禁止局部肢体反射，右向只对左向完整帧镜像。被拒绝的候选留在原始目录，不进入运行画面。语音缺页通过文字、波形空位和平台生成的裂隙事件音效表达；本章不使用真人配音。

## 2. 目录结构

- `src/world.ts`：稳定场景、实体、接近点、门槛/激活区、障碍和双向转场的唯一空间清单。
- `src/story.ts`：转生者的固定作者章节、条件、事实、两轮选择、回访文本、目标和新增事实默认值。
- `src/journey.ts`：把客户端请求校验后交给叙事 reducer，成功时由权威结果决定场景和落点。
- `src/storage.ts` / `src/pending-journey.ts`：按部署 session 隔离的 IndexedDB head、幂等行动回执和待确认行动恢复。
- `src/spatial/`：从技能包装配的碰撞、寻路、距离步态、RPG-JS 适配和存储命名空间。
- `src/main.tsx` / `src/style.css`：地图操作、双语界面、人物首次可见、资料放大、三来源对照、两次选择确认、预览屏状态和窄屏布局。根节点以 `data-spatial-ui-theme="05-terminal"` 记录用户选择；样式把技能中同名 token 映射到 HUD、底部行动、互动层、档案和资料查看器，长篇阅读单独使用系统无衬线字体。
- `src/architecture.tsx`：消费 `world.ts` 的房间几何，分别绘制独立地面、墙段、真实门洞/门扇、家具和前景南墙。墙段开口与热点同源，前景墙随人物位置开局部可见窗。
- `src/atmosphere.ts`：居所与服务点的非关键家具、使用痕迹、源图裁切、显示矩形和落地碰撞。`props` 为默认独立放置方案，`baseline` 与 `ground` 只用于对照证据。
- `assets/large-scene-generation-plan.json`、`scripts/build-large-scene-pack.ts`、`src/generated/large-scene-detail-pack.ts`：大场景制作阶段的动态细节包。语义槽位与逐格准入目录经平台任务 / SHA 校验后确定性装配，支持显式回退测试。
- `src/large-scene-world.ts`、`src/large-scene-review.tsx`：非正式剧情的大场景试验数据与界面。独立 768×768 世界、15 件基础家具、12 个动态细节、区域起点、RPG-JS 行走层、镜头跟随和前后遮挡；通过 `?large_scene=1` 进入。
- `src/generated-room-world.ts`、`src/generated-room-review.tsx`：用户新功能房间端到端计时样本。只复用通用建筑、人物和输入层，运行新生成地面与三类设备；`?generated_room=1` 是直接高保真状态，`room_phase=shell` 是静态骨架，`room_phase=live` 从真实平台任务逐槽位恢复素材。三态共享同一碰撞清单和放置坐标。
- `src/progressive-room-media.ts`：保存四个已接受任务的稳定 task/request 身份，按槽位恢复状态、持久化成功结果、隔离终止失败。开发和预览环境通过 Vite 的 `/__alteru_media__` 同源代理读取状态；正式平台域名直连媒体服务。
- `scripts/export-progressive-room-contract.ts`：从真实生成房间布局导出 shell/complete 共享空间合同，供共享技能的 `validate-progressive-room.mjs` 检查出生点、出口、槽位、占地与玩家文案。
- `scripts/benchmark-user-room-*.ts`、`scripts/prepare-generated-room-assets.py`：记录新房间媒体生成、失败重试、纠正轮和确定性透明化；原始任务、耗时与 SHA 保存在 `assets/benchmark/generated-room/`。
- `_qa/progressive-room-media.test.ts`、`_qa/capture-generated-room-live.mjs`：前者验证逐槽位回填、刷新恢复和失败隔离；后者用真实任务在两种手机视口记录骨架可操作、完成与刷新恢复时间。
- `src/art.ts`、`scripts/generate-platform-art.ts`、`scripts/prepare-platform-atlas.py`、`scripts/assemble-cast.py`、`scripts/export-world.ts`：常规平台素材请求与来源记录、确定性透明化、NPC 装配、人物图集绑定、地图及素材导出。
- `scripts/generate-hero-v7.ts`、`scripts/assemble-hero-v7.py`、`assets/benchmark/hero-v7/platform-ledger.json`、`assets/hero-v7-assembly.json`：主角及人物测试房侧墙的专项平台生成、失败重试、完整身体逐帧装配和来源账本。装配器只做抠背景、全身等比缩放、脚底/头部对齐与完整帧镜像。
- `assets/projection-audit.json`：从真实显示参数整理的人物、墙面、家具与小物件投影比例清单，交给技能包 `audit-projected-art.py` 检查。
- `assets/platform/`、`assets/processed/`、`public/art/`、`public/map/`：原始候选、准入处理图、正式运行文件和 Tiled 地图。
- `doc/world-manifest.json`：从实际 `world` 导出的场景/目标/转场/素材清单，供技能校验器检查。
- `_qa/memory-margin.test.ts`：保留/借出、停止/追查预览的权威路径、错误动作不消耗版本与旧档事实兼容。

## 3. 核心模块

**状态和行动。** `StorySave` 是剧情事实唯一权威；空间层不另存一套剧情。`Head` 组合 StorySave、场景、位置和版本。物件行动必须来自当前场景的实体动作清单，且请求落点可行、靠近该实体。成功行动写入 IndexedDB 的同一事务；相同 ID 返回历史回执，恢复时再读取最新 head，避免旧回执覆盖后续进度。新事实采用补默认值迁移：旧旅程保留第一轮选择、位置、版本与历史回执，缺失的第二轮事实补为未发生；迁移在读取 head 和新行动入站时均执行。只读资料放大和未提交的推理候选不改变权威状态。

**地图和渲染。** `world.ts` 的尺寸为 384×512，角色碰撞脚底占地 9×15，步进 4。三图现有 16 个可接近目标，第二轮复用原地图并新增生活物件与窗口预览屏。每扇门的同一实体记录包含 `side / visual / approach / threshold / activation`，每条 portal 明确指向目标门；墙洞区间、热点、门槛触发和转场到达不再各写一套坐标。交互用角色脚点落入 activation 判断，approach、threshold 和 portal arrival 都由自动化验证。`scripts/export-world.ts` 依同一清单生成 Tiled 碰撞层、world manifest 和 `projection-audit.json`。`architectureInstances()` 从门洞区间中减去完整墙边得到墙段；先绘北墙，再绘场景专用侧墙；北墙图源按世界宽等比裁切，再绘顶沿/立面/墙脚和落影。居所、走廊、服务点分别消费 256×1536 的 `home/hall/service-side-wall-v7`，整张按完整外墙高度等比定位，门洞只裁掉对应可见区，右侧使用整图水平镜像，避免分段缩放和接缝漂移。侧墙厚度为 18 世界单位。南墙按段等比裁切并最后在人物前景层绘制；顶部侧墙遮住北墙端头，底部南墙外伸覆盖侧墙端头。北/南门使用直立的 open doorway 图集；东西侧门将方向专用的短过门石拆成背景的地面/远端墙截面与前景的近端墙截面，过门石不旋转；`door-side-leaf-v5` 只含可移动木门扇，不再携带固定门框，并只在向当前房间打开的一侧出现，按角色脚点在背景/前景层切换。桌子和地毯保持透明边界。主角 v7 候选与三名 NPC 共享 256×256 源格、60×60 世界显示格和 y=233 脚点，普通成人可见高度约 45–47；主角第三列不再局部反射腿部。居所使用 `home-worktable-v5`，服务点使用 `service-console-v6`；两种桌子都有矩形顶面，以源图 [72,72,368,372] 裁切等比显示。服务终端 v6 保留合格几何并改成深石墨、黄铜、青色记忆波形与晶片槽。九格小物件按正方形单格显示，与其矩形热点分开；四件桌上物件的可见底部依缩小后的桌面上表面重新定位，交互接近点保留在桌前可行走区域。非关键氛围资产由 `atmosphere.ts` 逐件裁切和放置；家具显示矩形与碰撞消费同一记录。服务点左侧把 `service-memory-archive-v5`、主终端和朝向终端的 `service-memory-chair-v2` 收成记忆接入工位；右侧把主终端和 `service-maintenance-console-v4` 收成处理 / 检修工位；中央通道保持空。正面长椅、正面柜、梯形座椅、假字和照片式候选全部拒绝。`camera.ts` 把背景、家具、人物、热点和引擎 Canvas 放进同一个 384×512 世界层，按 1.05–1.22 倍等比缩放并跟随脚点；点击地面先用相同平移和缩放反算世界坐标。镜头只负责显示，不修改权威位置、碰撞或存档。`createRpgSpace` 在真实 RPG-JS 中移动与转场；前端只在权威 action 成功后调用 `restore(scene, position)`。地图裁切使用 `overflow: clip`，防止浏览器聚焦热点时将引擎 canvas 和背景一同内部滚动。预览屏的亮起、熄灭和账户标记只消费权威事实。

**适配和输入。** 键盘 WASD/方向键、触屏摇杆及点击地面寻路共用空间适配器。`nearby-interaction.ts` 从当前场景已揭示实体中选稳定目标：用户点击的可用目标优先，旧目标在 8 世界单位迟滞带内保留。地图热点只调用 `walkTo(approach)`；底部 `.mm-primary` 才根据目标类型打开人物/物件面板或执行门转场。客户端显示可互动与 `journey.ts` 接受权威行动共同调用 `world.ts` 的 `entityNear()`，不再维护不同半径；边界内/外都有自动化检查。打开的面板保存原目标 ID，附近目标变化不会换内容；移动、点空地、关闭或再次按行动按钮退出。实体面板是地图上方的局部 overlay，不改世界层尺寸；档案、人物索引等全局页面仍使用模态暗幕。普通列表和资料按钮用 click；对话及资料面板可滚动。根容器固定为 100dvh，浏览器聚焦热点不能在 320×568 把顶部 HUD 滚出视口。普通 UI 自身重排；平台内构图不为外部访客栏留空。

**语言和声音。** 固定作者文案通过 `t(locale, zh, en)` 在中文/英文间切换。`src/sound.ts` 在首次 pointer/keyboard 手势后启动 `public/audio/memory-margin-ambient.mp3` 的低音量循环，用 `memory-fracture.mp3` 表达首次裂隙，并以 Web Audio 合成短促 UI 反馈。静音会暂停媒体音频；再次开启从当前环境音乐位置继续。媒体来源、任务、SHA 与响度记录在 `assets/benchmark/audio/ledger.json`。缺页信息同时以文字和波形呈现，静音仍可理解。

## 4. 扩展点

- 改剧情和人物：改 `src/story.ts` 的作者规则、首次登场文案与双语文本，再核对 `src/main.tsx` 中已见人物展示。
- 加场景、门或物件：先改 `src/world.ts`。新增门必须在同一记录填写方向、视觉开口、approach、threshold、activation，并让 portal 的 target 指向目标门；再更新 `src/story.ts` 动作。运行 `npm run assets` 重新生成 Tiled 地图和 manifest，运行技能的 `validate-world.mjs`，随后在真实 renderer 把人物走到门槛并验证双向往返。
- 换美术和图集：常规物件从 `scripts/generate-platform-art.ts` 新增稳定请求，逐张准入后由 `scripts/prepare-platform-atlas.py` 准备透明物件、`scripts/assemble-cast.py` 装配 NPC。主角必须走 `generate-hero-v7.ts` / `assemble-hero-v7.py` 同类的完整身体逐帧流程并生成 `hero-v7-assembly.json`，随后同时运行投影比例检查与 `audit-hero-sheet.py`。再改 `scripts/export-world.ts` 的导出名单、`src/architecture.tsx` 的模块装配或 `src/art.ts` 的人物尺寸。地面、墙、门、家具分源；状态物件独立。
- 调整大场景试验：基础家具在 `src/large-scene-world.ts` 修改；动态补景先改 `assets/large-scene-generation-plan.json` 的目录、语义槽位和碰撞，再运行 `npm run assets` 生成 TypeScript 装配与 `public/map/large-review.tmx`。在 `src/large-scene-review.tsx` 修改相机、墙地拼装和 QA 标签；随后执行 `_qa/large-scene.test.ts` 与真实浏览器截图。用 `ALTERU_DETAIL_PACK_FORCE_FALLBACK=1 node --import tsx scripts/build-large-scene-pack.ts` 验证回退，完成后必须再无该变量运行一次恢复正式输出。
- 调 UI 风格：改 `src/style.css` 和 `src/main.tsx` 中语义层，保留权威 action、触控尺寸、焦点、双语与只读放大合同。
- 加生成任务或正式后台：先把生成字段限定在已建实体与事实槽内，并给出失败恢复；正式发布需另建平台 session、身份与服务端 head，不把本地 IndexedDB 当成跨设备存档。

## 当前验证边界

此前的剧情与空间自动化、往返试玩仍有效，但旧版美术准入结论撤回。当前版的墙/人物投影比例脚本、主角图集机械门禁和门几何清单检查已通过；人物测试房在 390×844 与 320×568 使用三张场景专用连续侧墙重新截图，左右墙无分段缩放和异常亮缝。主角 v5 的两格局部反射腿部已撤回，v7 用完整身体平台帧替换，并结合四方向连续帧 contact sheet 与真实地图运行画面改为 `accepted`。独立家具、服务点近未来工作关系、四方向门、`05-terminal` 两段式互动、首次操作启动环境音乐和静音恢复均已在真实浏览器复验；实体手机与新玩家理解仍未验证，`comprehension unverified`。
