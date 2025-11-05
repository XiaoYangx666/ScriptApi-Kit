## 🌟 ScriptApi-Kit

基岩版 ScriptApi 的轻量实用工具。

### 主要功能

-   使用 rollup 打包第三方库
-   行为包/资源包一键打包为 mcpack/mcaddon
-   快速新建模板项目
-   一键更新与切换依赖版本
-   复制包到游戏目录
-   监听更改...

### 📦 安装

```bash
npm i sapi-kit
```

---

### 🚀 快速开始

先全局安装:

```bash
npm i -g sapi-kit
```

再在项目目录中执行

```bash
sapi-kit init
```

---

### 🛠️ 手动配置

如不使用模板，请确保满足以下要求：

1. **项目结构**
   源码放在 `src/` 目录下，入口文件为 `main.ts` 或 `main.js`。

2. **配置文件**

    - 创建 [`sapi-kit.config.mjs`](https://gitee.com/ykxyx666_admin/sapi-kit_template/blob/master/sapi-kit.config.mjs)
    - 创建 [`tsconfig.json`](https://gitee.com/ykxyx666_admin/sapi-kit_template/blob/master/tsconfig.json)

注:配置文件请参考[模板包](https://gitee.com/ykxyx666_admin/sapi-kit_template)。

配置完成后，即可开始使用命令。

---

### 📚 可用命令

| 命令     | 功能说明                    |
| -------- | --------------------------- |
| `build`  | 构建行为包                  |
| `pack`   | 打包 mcpack/mcaddon         |
| `dev`    | 启动监听模式                |
| `copy`   | 复制行为包/资源包到游戏目录 |
| `update` | 更新配置/依赖资源           |
| `init`   | 一键初始化项目              |
| `check`  | 检查配置文件是否正确        |

---

如需更多说明，请查看模板仓库中的示例项目和文档。
欢迎使用与反馈！
