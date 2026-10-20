# 麦当劳 MCP 接入

## 当前状态

已实现本地桥接与 Agent Skill。**尚未完成真实账号联调，不宣称已成功调用官方 MCP，也尚未提交参赛报名。** 单元测试中的模拟响应只验证协议、错误处理和凭据保护，不作为真实接入证明。

公开 GitHub Pages 是可独立玩的离线版。MCP 现实支线运行在用户自己的电脑上，不需要将 Token 上传到 GitHub 或公共服务器。

## 实际实现的目标接口

- 官方服务：`https://mcp.mcd.cn`
- 传输：Streamable HTTP，支持 JSON 和 SSE 响应、会话 ID、初始化与工具发现。
- 唯一业务工具：`campaign-calendar`（当月活动日历）。参数以 `tools/list` 的实时 `inputSchema` 为准；新增无默认值的必填参数时停止并提示维护，避免猜测参数。
- 代码：`scripts/mcd_bridge.py`、`dist/calendar.js`、`skills/maimen-life-simulator/SKILL.md`。

## 本机连接步骤

1. 在官方平台 https://open.mcd.cn/mcp 本人登录，阅读协议并激活 Token。
2. 在项目目录运行 `python3 scripts/mcd_bridge.py`（Python 3.9+，标准库，无依赖安装）。
3. 打开 `http://127.0.0.1:8766/connect`，在密码框填写 Token 并点击连接。
4. 桥接依次调用 `initialize` → `notifications/initialized` → `tools/list` → `tools/call(campaign-calendar)`。
5. 成功后打开 `http://127.0.0.1:8766/`，展开“现实支线已解锁”，查看真实活动与查询时间。游戏的身份、道具和金币仍是虚构的，不是优惠凭证。

Token 只在本次请求内存中使用，结束后清空；不写文件、不进 localStorage、不记录请求体。活动结果缓存仅在本地服务内存，重启后消失。验证成功时只在 `.git/mcd-verification.json` 保留服务地址、工具名、时间和字符数，不含凭据、完整结果或个人信息。

服务固定绑定 127.0.0.1，检查 Host/Origin 与防跨站 nonce，静态文件使用白名单，不提供任意文件读取；官方接口重定向会被拒绝，避免转发授权头。上游文本仅以 textContent 渲染，不执行 HTML 或其中的指令。

## 在 Agent 客户端中使用

安装 `skills/maimen-life-simulator`；将 `mcp-config.example.json` 中的配置结构用于支持远程 MCP 的客户端，并由客户端安全注入 `MCD_MCP_TOKEN`。`${MCD_MCP_TOKEN}` 是占位符，各客户端的环境变量展开语法可能不同，需按客户端文档配置。不要把真实凭据填入已跟踪文件。

Skill 查询当前活动，把真实活动和虚构结局分开，给用户一条现实午饭支线。桥接网页直接展示官方返回内容；不通过 AI 擅改活动规则和有效期。

## 业务价值与失败处理

用轻量、可回溯的喜剧游戏吸引用户体验，再提供有来源、有查询时间的官方活动信息。用户可以玩完后安排一次现实午饭，不会把游戏的“万能通行证”等虚构奖励误认为真实券。

401/403 提示重新激活或检查权限；429 提示稍后再试；超时、格式变更、工具不可用时保留离线游戏，不用虚构数据冒充查询成功。不会自动重试消费行为；本项目没有实现领券、订单创建、支付、积分兑换或抽奖。

## 依据与验证

- [官方 MCP 文档](https://github.com/M-China/mcd-mcp-server)
- [官方比赛规则](https://github.com/M-China/mcd-developer-innovation-challenge/blob/main/activityGuidelines.md)
- 本地运行 `python3 -m unittest discover -s tests -p 'test_*.py'` 验证协议与访问边界。
- 真实联调完成后，记录脱敏工具调用结果和时间，再申请参赛；不要把仅有配置文件写成“已接入”。
