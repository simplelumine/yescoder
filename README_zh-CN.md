<div align="center">
  <img src="logo.png" width="128" alt="YesCoder Logo" />
  <h1>YesCoder</h1>

  <p>
    <a href="https://marketplace.visualstudio.com/items?itemName=simplelumine.yescoder">
      <img src="https://img.shields.io/visual-studio-marketplace/v/simplelumine.yescoder?style=flat-square&label=Version" alt="Version" />
    </a>
    <a href="https://marketplace.visualstudio.com/items?itemName=simplelumine.yescoder">
      <img src="https://img.shields.io/visual-studio-marketplace/i/simplelumine.yescoder?style=flat-square&label=Installs" alt="Installs" />
    </a>
    <a href="./LICENSE.md">
      <img src="https://img.shields.io/github/license/simplelumine/yescoder?style=flat-square" alt="License" />
    </a>
  </p>

  <p>
    <a href="https://co.yes.vg">官方网站</a> •
    <a href="https://cotest.yes.vg">测试网站</a> •
    <a href="https://github.com/simplelumine/yescoder/issues">插件反馈</a> •
    <a href="https://discord.gg/AXxg7qM358">Discord</a> •
    <a href="https://t.me/yes_code">Telegram</a>
  </p>
  
  <p>
    <a href="./README.md">English Documentation</a>
  </p>
</div>

---

YesCode 在 VS Code 中的必备伴侣。直接在状态栏监控余额。

## 功能

- **余额监控**: 直接在状态栏关注您最关键的余额信息（团队、订阅或按量付费）。
- **一键 CLI 环境配置**: 快速生成配置命令，将您的本地终端环境接入 YesCode 的中转模型服务（支持 Gemini, Codex, Claude 等）。该助手能智能检测您的操作系统，提供正确的环境变量设置命令，方便您在终端直接调用 YesCode 资源。
- **反转显示模式**: 切换显示“剩余”百分比（默认）或“已用”百分比（反转），以满足您的偏好。
- **无缝账户支持**: 支持所有类型的 YesCode 账户，包括生产环境和特殊/测试账户，自动连接到正确的后端服务。
- **集中式命令菜单**: 点击状态栏即可打开包含所有核心扩展命令的菜单。
- **智能显示模式**: 自动检测最相关的余额进行显示，同时也支持手动锁定到特定模式。
- **详细提示信息**: 悬停在状态栏上可查看包含当前余额详细分类的迷你仪表盘。
- **安全 API 密钥存储**: 使用 VS Code 原生的 `SecretStorage` 安全存储您的 API 密钥。
- **自动刷新**: 每分钟自动刷新一次，保持余额数据最新。

## 设置

1.  从 VS Code 市场安装扩展。
2.  点击状态栏中的 "YesCode: Loading..." 项目打开菜单。
3.  选择 `设置 API 密钥` (Set API Key) 并在提示时输入您的 YesCode API 密钥。扩展程序将自动检测正确的环境。
4.  您的余额已激活。

## 配置

您可以在 VS Code 设置中或通过命令菜单配置 YesCoder。

- `yescode.reverseDisplay`: (布尔值) 控制余额显示方式。
  - `false` (默认): 显示 **剩余** 百分比 (例如：100% -> 0%)。
  - `true`: 显示 **已用** 百分比 (例如：0% -> 100%)。

## 命令

- **`YesCode: 一键 CLI 环境配置`**: 打开 CLI 设置助手。
- **`YesCode: 显示菜单`**: 从状态栏打开主命令菜单。
- **`YesCode: 刷新余额`**: 手动刷新您的余额信息。
- **`YesCode: 切换显示模式`**: 手动选择要显示的余额模式。
- **`YesCode: 设置 API 密钥`**: 安全存储您的 API 密钥。
- _(已弃用)_ **`YesCode: 切换供应商`**: 此命令已弃用。请使用网页端仪表盘切换供应商。

## 项目架构

本扩展采用清晰的特性驱动架构构建：

- `src/extension.ts`: 主激活文件，协调不同功能。
- `src/core/`: 包含命令注册和状态栏创建的核心逻辑。
- `src/monitor/`: 余额监控功能的所有逻辑。
- `src/providers/`: 供应商管理功能的所有逻辑。
- `src/setup/`: CLI 设置助手功能的所有逻辑。
- `src/api.ts`: 管理所有对 YesCode 的 API 调用，包括环境检测。
- `src/types.ts`: 定义所有共享数据结构。

## 开发

```bash
# 克隆仓库
git clone https://github.com/simplelumine/yescoder.git
cd yescoder

# 安装依赖
npm install

# 编译并监听变更
npm run watch

# 在 VS Code 中打开并按 F5 启动扩展开发主机。
```

## 致谢

特别感谢以下朋友的支持：

- 感谢 **好果汁 (YesCode CFO)** 提供测试环境与指导。
- 感谢 **YesCode CTO** 对项目名称的建议。
- 感谢 **喵酱 (YesCode User: 太阳照常升起)** 提供 API 文档参考。
- 感谢 **萝拉酱 (YesCode User: Aurora)** 参与测试并提供反馈。
- 感谢 **杰森酱 (YesCode User: Jason)** 针对功能改进提出的宝贵建议。

## 许可证

[MIT](./LICENSE.md)
