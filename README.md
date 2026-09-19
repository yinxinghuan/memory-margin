# 记忆余量 · Memory Margin

普通人刚完成意识上传，在数字生活的第一天发现自己的一段语音记忆缺了结尾。玩家从居所、公共走廊走到记忆服务点，读有来源的记录，与三个人交谈，决定是否让出这段记忆的使用权；回居所后又发现私人声音在授权前被公开预览，必须决定如何处理。

这是一个完整可玩的首章。三处探索场景的地面、墙面、门扇、家具、人物、发布海报、环境音乐和关键事件音效均由 AlterU 平台媒体服务生成，再按同一空间布局分别装配；素材准入和拒绝记录见 `doc/art-admission.md`。本章以 C-09 账户作为后续悬念，完成条件、两次有后果的选择和章节回顾均已落地。真人配音、跨设备账号存档以及新玩家理解验证不属于本次发布范围；无新玩家复述证据前继续标记 `comprehension unverified`。项目的需求、视觉、技术与证据边界见 `doc/`。

## 本地运行

需要 Node 22。首次安装使用 `npm ci`，随后：

```sh
npm run assets
npm run dev
```

本地入口为 `http://127.0.0.1:5212/`；非剧情的大场景评审入口为 `?large_scene=1`，新房间高保真入口为 `?generated_room=1`，静态碰撞骨架入口为 `?generated_room=1&room_phase=shell`，真实平台任务逐槽位恢复入口为 `?generated_room=1&room_phase=live&reset_room_media=1`。

`npm run build` 生成 `dist/`；`npm test` 验证剧情、往返、四向门、互动、比例、氛围、大场景、生成房间与存档迁移。发布检查还会在真实浏览器验证两种手机尺寸、首次操作启动环境音乐、静音切换、发布素材响应和外部访客栏。最终交接包为 `deliverables/build-spatial-story-game-v1.40-handoff.zip`，配套报告为 `deliverables/skill-package-check-v1.40.json`。隔离接收方已经验证包自包含、真实媒体恢复、附近交互、寻路和脚点坐标；完整高保真冷启动仍须在每个新项目执行主角、方向门、整房与声画门禁。

## 来源

游戏剧情与平台生成素材的生产记录为本项目原创工作成果；诊断图不进入运行画面。空间渲染使用 [RPG-JS](https://github.com/RSamaium/RPG-JS)（Samuel Ronce，MIT）；其他分发许可和完整 notice 见 `public/THIRD_PARTY_NOTICES.txt`。故事 reducer 的内部来源固定在 `src/vendor/story/ENGINE_SOURCE.json`。
