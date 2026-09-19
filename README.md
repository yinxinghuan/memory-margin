# 记忆余量 · Memory Margin

普通人刚完成意识上传，在数字生活的第一天发现自己的一段语音记忆缺了结尾。玩家从居所、公共走廊走到记忆服务点，读有来源的记录，与三个人交谈，决定是否让出这段记忆的使用权；回居所后又发现私人声音在授权前被公开预览，必须决定如何处理。

这是一个完整可玩的首章。三处探索场景的地面、墙面、门扇、家具、人物、发布海报、环境音乐和关键事件音效均由 AlterU 平台媒体服务生成，再按同一空间布局分别装配；素材准入和拒绝记录见 `doc/art-admission.md`。本章以 C-09 账户作为后续悬念，完成条件、两次有后果的选择和章节回顾均已落地。真人配音、跨设备账号存档以及新玩家理解验证不属于本次发布范围；无新玩家复述证据前继续标记 `comprehension unverified`。项目的需求、视觉、技术与证据边界见 `doc/`。

## 本地运行

需要 Node 22。首次安装使用 `npm ci`，随后：

```sh
npm run assets
npm run dev
```

试玩入口 `http://127.0.0.1:5212/`；非正式剧情的大场景评审入口为 `http://127.0.0.1:5212/?large_scene=1`，用户新房间高保真入口为 `http://127.0.0.1:5212/?generated_room=1`，静态碰撞骨架入口为 `?generated_room=1&room_phase=shell`，真实平台任务逐槽位恢复入口为 `?generated_room=1&room_phase=live&reset_room_media=1`。`npm run build` 检查 TypeScript 并生成 `dist/`；`npm test` 验证两轮选择、返回路线、四向门槛触发、两段式互动焦点、客户端/权威接近边界、第五套主题映射、两场景氛围家具碰撞、大场景五区连通、生成房间功能点可达、媒体刷新恢复/失败隔离与旧档事实迁移。更改 `src/world.ts`、`src/art.ts`、`src/large-scene-world.ts`、`assets/large-scene-generation-plan.json` 或墙段装配后须重新运行 `npm run assets`，让真实地图、动态细节包、素材与投影比例清单同时更新；随后运行 `python ../.agents/skills/build-spatial-story-game/scripts/audit-projected-art.py assets/projection-audit.json --root .` 检查人物、墙面与物件比例，运行 `python ../.agents/skills/build-spatial-story-game/scripts/audit-hero-sheet.py assets/hero-v7-assembly.json --root .` 检查主角逐帧来源与锚点，并运行 `node ../.agents/skills/build-spatial-story-game/scripts/validate-world.mjs doc/world-manifest.json .` 检查门槛、激活区和转场落点。新素材生成速度和一次成型率见 `doc/asset-generation-benchmark.md`；从功能描述到高保真房间的 9分41秒实测及渐进进入、真实媒体回调复验见 `doc/generated-room-benchmark.md`。当前独立交付包为 `deliverables/build-spatial-story-game-v1.38-trial.zip`：v1.35 的隔离试验先暴露媒体客户端、附近回调、寻路和坐标锚点四项缺口；v1.36 已由同一独立题材复验四项修复，v1.37 加入主角 P0 准入门禁，v1.38 又固化完整高度侧墙、统一等比定位、门洞裁切和禁止短段各自缩放。独立项目仍因方向门、主角和标本池没有全部签收而诚实保持“整房高保真部分通过”。

## 来源

游戏剧情与平台生成素材的生产记录为本项目原创工作成果；诊断图不进入运行画面。空间渲染使用 [RPG-JS](https://github.com/RSamaium/RPG-JS)（Samuel Ronce，MIT）；其他分发许可和完整 notice 见 `public/THIRD_PARTY_NOTICES.txt`。故事 reducer 的内部来源固定在 `src/vendor/story/ENGINE_SOURCE.json`。
