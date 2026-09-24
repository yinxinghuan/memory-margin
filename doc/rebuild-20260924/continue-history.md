# 《记忆余量》2026-09-24 技能复验：进行中

目标：用最新技能完成第二款记忆题材探索 RPG，并以真实失败补全技能。保留未提交修改；本轮没有提交或发布。

## 已完成
- 自由输入接真实 game-chat；超时、失败草稿、关闭取消、成对历史已验证，模型不改剧情事实。
- 新旅程中文系统中文，其他系统英文；旧档保留原语言。
- 主角与三名 NPC 已默认使用本轮平台 GPT 新图集。四人共享 256 格、243 脚点、216 可见像素高、84 世界格，约 71 世界单位可见高。身份根图纯文本；动作/肖像只引用各自本轮根图或站姿；不读取旧游戏图片。
- 角色称呼 Mara / Elias / Imani，中英文同步，故事仍是虚构数字居住区。
- 空间层已迁入 RPGJS：46 张独立静态纹理 + 3 名 NPC 事件。真实房间有 15/17 个事件，单 canvas，0 DOM 人物、0 DOM 场景。React 保留 UI/剧情/存档/不可见交互热区。
- 新地板/记忆设备进入居所。墙门和多数家具仍旧素材，不宣称整套美术通过。
- build 与 34 项测试通过；四个门真实往返、两尺寸对话生命周期通过。
- 桌面 Chrome 60 秒持续输入：四个 15 秒区间 p95 约 16.7–16.8ms、无 >50ms 帧、无页面异常，节点未持续增长。这不是 iPhone AlterU 实测结论。

## 当前正在解决
前景墙已增加 Pixi 局部 stencil，390×844 与 320×568 南门截图确认上半身不再被墙和文字牌遮挡，远离后墙体恢复。删除遮住身体的重复出口文字/方形点，目的地保留在底部行动按钮。旧门素材本身仍未通过重制验收。观察脚本 `_qa/probe-foreground.mjs` 的隐藏操作只在 QA 页面，不进产品。

## 下一步
1. 完成南门/前景遮挡复验；重新生成正侧门和厚墙，禁止旧门叶非等比拉伸。
2. 全体人物同场动作、停止、朝向、肖像两尺寸视觉签收；原失败帧已在 JSON 标 rejected。
3. 地图、主题背包、资料/人物放大、完整分支/恢复；连续移动与多次换房，iPhone 待真实设备测试。
4. 更新共享技能/可复用构件/独立交付包，发布前门禁通过后才替换线上。

## 工具与证据
- 本轮美术请求累计 41 个，记录在 `doc/rebuild-20260924/art/`；已成功请求不可重复生成。model=gpt-image-2.5-sunburst, high。
- 人物装配：`scripts/assemble-rebuild-hero.py`、`assemble-rebuild-cast.py`，完整帧去底/等比对齐；职员胸牌不镜像。
- 场景烘焙 `scripts/bake-scene-layers.tsx` 写 doc 下原始层；`crop-scene-layers.py` 只写 public 下裁切输出。旧 destructive jobs 会明确失败，必须先重烘焙，不能再次裁旧输出。
- 实际 renderer `src/rpg-visuals.ts` + `src/spatial/rpg-space.ts`，布局源 `src/architecture.tsx`，运行层索引 `src/scene-layers.json`。
- 新证据在 `_qa/rebuild-20260924/`；不覆盖旧用户 QA 图片。
- 本地 preview5213；Node=/Users/yin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin，Python PIL=/Users/yin/miniconda3/bin/python3。

新门墙纯文本批次（rebuild-doors-walls.ts）：正面门因下端收窄、把手投影不符而 rejected；侧向门叶与独立墙面为 candidate，尚未装配，不得引用为整房通过。本轮共享技能追加 renderer-skill-addendum.md 的迁移门禁；交付 ZIP 尚未更新。

320×568 小屏状态检查通过，但测试使用键盘移动 + synthetic hotspot dispatch，不能称为完整触屏路线验收。390×844 使用实际热点点击。两者证据分别在 engine-route 与 engine-route-320。底墙恢复截图为 home-return-to-home。

## 门墙新进度（本节覆盖上面的候选未集成状态）
新正面门 v2、侧门叶和新墙已集成三室，旧侧门框也已移除。详细尺寸、来源、碰撞与验证在 wall-door-assembly-review.md。最新画面 door-wall-final（390）与 door-wall-final-320；--structure 可单独重烘焙建筑，先 bake 再 crop，再 build。41 次请求，最初正面门仍 rejected。现在继续完整人物/家具/地图背包与剧情收口，不要重复生成已下载素材。尚未发布。

## 最新续做收口（覆盖前文过期下一步）
- 两条完整 UI 主线均通过：lend → trace、keep → stop，各 23 次剧情提交，最后回访、结局与刷新恢复。使用 synthetic hotspot 选择 + 真实 RPGJS 移动 + 实际行动/确认按钮，无进度种子。证据 playthrough/results.json、playthrough-keep-stop/results.json；不是完整手机触控认证。
- 真实失败：第 17 步再次接近巡游 Mara 路线被其移动碰撞阻挡。main.tsx 新增独立 approachingTarget；寻路期间目标停下等候/面向，取消后释放。两路线复测通过；其他动态阻挡仍有独立验证边界。
- 主角四向实景接触相目检：hero-final/runtime-distinct-poses.png。原来每隔两帧抽样恰好只剩中心相是假阴性，已按实际 pose 取样。不等于全体 NPC/真实 iPhone 动作签收。
- 地图改为共享 world 布局的房间缩略平面（未知房间隐藏内部），主题背包姓名/身份分行；两尺寸地图、背包四分区、档案已检。shell/ 保存最终证据。
- 共享技能补充了目标接近等待/取消合同及步态采样风险。最新审核包 doc/skill-handoff/build-spatial-story-game-20260924-memory-review.zip（88 文件），临时解压机械检测全部通过；明确 review-not-final-delivery，不能声称同事 agent 独立出图质量已通过。
- 当前仍未发布。后续：全体 NPC 动作/取消接近恢复巡游实景复验；家具旧素材来源与准入汇总；技能通用静态层工具边界；发布门禁和真实 iPhone 复测。
