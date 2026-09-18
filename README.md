# 记忆余量 · 空间叙事试验

普通人刚完成意识上传，在数字生活的第一天发现自己的一段语音记忆缺了结尾。玩家从居所、公共走廊走到记忆服务点，读三份有来源的记录，与三个人交谈，决定是否让出这段记忆的使用权，再回居所确认后果。

这是 `build-spatial-story-game` 的独立题材试验，当前可玩但尚未发布。地图和角色是程序绘制的诊断像素图；真人语音、正式美术、动态任务和跨设备账号存档均未完成。项目的需求、视觉、技术与证据边界见 `doc/`。原“断讯街区”求救信号故事已废弃。

## 本地运行

需要 Node 22。首次安装使用 `npm ci`，随后：

```sh
npm run assets
npm run dev
```

试玩入口 `http://127.0.0.1:5212/`。`npm run build` 检查 TypeScript 并生成 `dist/`；`npm test` 验证两种选择的权威状态和返回路线。更改 `src/world.ts` 后须重新运行 `npm run assets`，让真实地图和清单同时更新。

## 来源

游戏剧情、试验地图与像素诊断图为本项目原创。空间渲染使用 [RPG-JS](https://github.com/RSamaium/RPG-JS)（Samuel Ronce，MIT）；其他分发许可和完整 notice 见 `public/THIRD_PARTY_NOTICES.txt`。故事 reducer 的内部来源固定在 `src/vendor/story/ENGINE_SOURCE.json`。
