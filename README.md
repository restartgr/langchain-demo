# LangChain Demo

一个使用 TypeScript 和 LangChain 构建的综合演示项目，展示了各种AI应用场景的实现。

**🔮 使用智谱AI GLM-4模型 - 免费体验AI的强大能力！**

## 🚀 功能特性

- **基础聊天**: 展示与智谱AI GLM-4模型的基本对话功能
- **文档问答**: 基于向量存储的文档检索问答系统
- **工具使用**: AI代理使用自定义工具（计算器、天气查询、网络搜索）
- **链式调用**: 演示复杂的工作流链式处理
- **TypeScript支持**: 完整的类型定义和类型安全
- **使用Fetch**: 使用原生fetch API替代axios进行网络请求
- **智谱AI集成**: 使用智谱AI的GLM-4模型，享受免费体验额度

## 📋 依赖要求

- Node.js >= 18
- npm 或 yarn
- 智谱AI API密钥（免费申请）

## 🛠️ 安装和设置

1. 克隆仓库:
```bash
git clone git@github.com:restartgr/langchain-demo.git
cd langchain-demo
```

2. 安装依赖:
```bash
npm install
```

3. 配置环境变量:
```bash
# 创建 .env 文件
touch .env

# 编辑 .env 文件，添加你的智谱AI API密钥
echo "ZHIPUAI_API_KEY=your_zhipuai_api_key_here" > .env
```

4. 申请智谱AI API密钥:
   - 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
   - 注册账号并实名认证
   - 获取免费的API密钥
   - 将密钥添加到 `.env` 文件中

## 🎯 使用方法

### 运行所有演示
```bash
npm run dev
```

### 单独运行各个演示
```bash
# 基础聊天演示
npm run chat

# 文档问答演示
npm run qa

# 工具使用演示
npm run tools

# 链式调用演示
npm run chain
```

### 构建项目
```bash
npm run build
npm start
```

## 📁 项目结构

```
src/
├── config/           # 配置文件
│   └── index.ts      # 智谱AI配置
├── examples/         # 演示示例
│   ├── basic-chat.ts      # 基础聊天
│   ├── document-qa.ts     # 文档问答
│   ├── tool-usage.ts      # 工具使用
│   └── chain-example.ts   # 链式调用
├── types/            # TypeScript 类型定义
│   └── index.ts
└── index.ts          # 主入口文件
```

## 🔧 演示内容详解

### 1. 基础聊天 (basic-chat.ts)
- 展示与智谱AI GLM-4模型的基本对话
- 支持多轮对话和上下文保持
- 演示消息历史管理
- 支持流式响应

### 2. 文档问答 (document-qa.ts)
- 文档向量化和存储（使用Mock嵌入）
- 基于语义相似性的文档检索
- 使用fetch从网络获取文档内容
- 上下文感知的问答生成

### 3. 工具使用 (tool-usage.ts)
- 自定义工具定义（计算器、天气查询、网络搜索）
- AI代理智能选择和调用工具
- 使用fetch进行网络API调用
- 多工具协作完成复杂任务

### 4. 链式调用 (chain-example.ts)
- LLM链的创建和使用
- 顺序链处理复杂工作流
- 条件链根据输入类型选择处理策略
- 多步骤任务的自动化处理

## 🌐 网络请求

项目使用原生的 `fetch` API 进行所有网络请求，包括：
- 智谱AI API 调用（通过LangChain封装）
- GitHub API搜索（工具使用演示）
- 获取在线文档内容（文档问答演示）

## 🔑 环境变量

在 `.env` 文件中设置以下变量：

```env
# 必需 - 智谱AI API密钥
ZHIPUAI_API_KEY=your_zhipuai_api_key_here

# 可选 - 智谱AI API基础URL（通常不需要修改）
# ZHIPUAI_API_BASE=https://open.bigmodel.cn/api/paas/v4/
```

## 💰 费用说明

- **智谱AI GLM-4**: 新用户有免费体验额度
- **API调用**: 根据智谱AI的定价策略收费
- **网络请求**: GitHub API等免费服务

## 📚 技术栈

- **LangChain**: AI应用开发框架
- **TypeScript**: 类型安全的JavaScript
- **智谱AI GLM-4**: 智谱AI的大语言模型
- **Vector Store**: 向量数据库（使用内存存储）
- **Fetch API**: 网络请求

## 🎉 开始体验

1. 按照上述步骤完成安装和配置
2. 运行 `npm run chat` 开始与GLM-4对话
3. 尝试其他演示功能，体验AI的强大能力

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## �� 许可证

MIT License 