# 《记忆余量》空间叙事试验 · 技术文档

## 1. 技术栈

React 18、TypeScript、Vite 8；RPG-JS 5 beta / CanvasEngine 负责真实角色与地图，DOM/CSS 负责 HUD、独立物件、交互热点、档案和只读放大。三张 Tiled 地图由同一 `world` 清单导出，`base: './'`。当前是本地单人作者切片，没有正式后台、多人共享世界或线上发布。

场景和角色图为 `scripts/export-world.ts` 生成的诊断像素图，不是最终美术。语音缺页目前通过文字与波形空位表达；真人配音、完整音效和美术准入尚未完成，不能宣称声音验收通过。

## 2. 目录结构

- `src/world.ts`：稳定场景、实体、接近点、障碍和双向转场的唯一空间清单。
- `src/story.ts`：转生者的固定作者章节、条件、事实、资料、两种选择、回访文本和目标。
- `src/journey.ts`：把客户端请求校验后交给叙事 reducer，成功时由权威结果决定场景和落点。
- `src/storage.ts` / `src/pending-journey.ts`：按部署 session 隔离的 IndexedDB head、幂等行动回执和待确认行动恢复。
- `src/spatial/`：从技能包装配的碰撞、寻路、距离步态、RPG-JS 适配和存储命名空间。
- `src/main.tsx` / `src/style.css`：地图操作、双语界面、人物首次可见、资料放大、三来源对照、选择确认和窄屏布局。
- `src/art.ts`、`scripts/export-world.ts`、`public/art/`、`public/map/`：当前诊断图集、地图与同源导出。
- `doc/world-manifest.json`：从实际 `world` 导出的场景/目标/转场/素材清单，供技能校验器检查。
- `_qa/memory-margin.test.ts`：保留和借出两条权威路径及错误动作不消耗版本。

## 3. 核心模块

**状态和行动。** `StorySave` 是剧情事实唯一权威；空间层不另存一套剧情。`Head` 组合 StorySave、场景、位置和版本。物件行动必须来自当前场景的实体动作清单，且请求落点可行、靠近该实体。成功行动写入 IndexedDB 的同一事务；相同 ID 返回历史回执，恢复时再读取最新 head，避免旧回执覆盖后续进度。只读资料放大和未提交的推理候选不改变权威状态。

**地图和渲染。** `world.ts` 的尺寸为 384×512，角色碰撞脚底占地 9×15，步进 4。`scripts/export-world.ts` 依同一清单生成 Tiled 碰撞层和 manifest。`createRpgSpace` 在真实 RPG-JS 中移动与转场；前端只在权威 action 成功后调用 `restore(scene, position)`。地图裁切使用 `overflow: clip`，防止浏览器聚焦热点时将引擎 canvas 和背景一同内部滚动。

**适配和输入。** 键盘 WASD/方向键、触屏摇杆及点击地面寻路共用空间适配器。点击物件先走到接近点，再开放明确操作。普通列表和资料按钮用 click；对话及资料面板可滚动。390×844 与 320×568 采用不同可用地图高度，普通 UI 自身重排；平台内构图不为外部访客栏留空。

**语言和声音。** 固定作者文案通过 `t(locale, zh, en)` 在中文/英文间切换。当前没有合成语音或录音文件，也没有完整音效实现；缺页信息同时以文字和波形呈现，静音仍可理解。生成模型未接入本试验切片；未来模型只能提议已准备的实体行动，不直接增发房间或事实。

## 4. 扩展点

- 改剧情和人物：改 `src/story.ts` 的作者规则、首次登场文案与双语文本，再核对 `src/main.tsx` 中已见人物展示。
- 加场景、门或物件：先改 `src/world.ts`，再更新对应 `src/story.ts` 动作；运行 `npm run assets` 重新生成 Tiled 地图和 manifest，随后在真实 renderer 验证往返与落点。
- 换美术和图集：替换 `scripts/export-world.ts` 的试验绘制流程与 `src/art.ts` 的锁定规格；背景只保留静态环境，状态物件独立。真实资产进入前按技能包的尺寸、alpha、主体 bbox 和手机画面准入。
- 调 UI 风格：改 `src/style.css` 和 `src/main.tsx` 中语义层，保留权威 action、触控尺寸、焦点、双语与只读放大合同。
- 加生成任务或正式后台：先把生成字段限定在已建实体与事实槽内，并给出失败恢复；正式发布需另建平台 session、身份与服务端 head，不把本地 IndexedDB 当成跨设备存档。

## 当前验证边界

`npm run build`、`npm test`、技能包的 `validate-world` 与 `verify-space` 已通过；真实浏览器已完成居所 → 走廊 → 服务点 → 选择保留 → 原路返回 → 刷新 → 回访，并在独立测试 origin 验证错误假设可改选、借出二次确认、借出后的返家回访。390×844 与 320×568 已检查纵横溢出、地图裁切与窄屏条款滚动。仍需新玩家试读；`comprehension unverified`，自动路线不能证明玩家已经理解世界观。试玩中的代码类型适配把冻结 StoryCartridge 的三项固定 stat 元组改为数组，使本切片可合法使用零数值 HUD；此变更已回写技能试用记录，不能默认为所有旧游戏已支持零数值。
