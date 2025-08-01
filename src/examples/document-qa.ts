import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { config } from "../config/index.js";
import type { APIResponse } from "../types/index.js";

export async function documentQA(): Promise<void> {
  console.log("📚 文档问答演示开始...");

  try {
    // 示例文档内容
    const documents = [
      new Document({
        pageContent:
          "LangChain是一个用于构建大语言模型应用的框架。它提供了链式调用、内存管理、工具集成等功能。",
        metadata: { source: "doc1.txt", type: "introduction" },
      }),
      new Document({
        pageContent:
          "LangChain支持多种语言模型，包括OpenAI GPT、Anthropic Claude、Google PaLM等。",
        metadata: { source: "doc2.txt", type: "models" },
      }),
      new Document({
        pageContent:
          "LangChain的核心概念包括：Chain（链）、Agent（代理）、Memory（内存）、Tool（工具）等。",
        metadata: { source: "doc3.txt", type: "concepts" },
      }),
      new Document({
        pageContent:
          "Vector Store向量存储用于存储和检索文档的向量表示，支持语义搜索功能。",
        metadata: { source: "doc4.txt", type: "vectorstore" },
      }),
    ];

    console.log(`📄 准备了 ${documents.length} 个文档`);

    // 初始化嵌入模型
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.openai.apiKey!,
      modelName: config.models.embedding,
    });

    // 创建向量存储
    console.log("🔄 正在创建向量存储...");
    const vectorStore = await MemoryVectorStore.fromDocuments(
      documents,
      embeddings
    );

    // 初始化聊天模型
    const chat = new ChatOpenAI({
      openAIApiKey: config.openai.apiKey!,
      modelName: config.models.chat,
      temperature: config.app.temperature,
      maxTokens: config.app.maxTokens,
    });

    // 问答功能
    const askQuestion = async (question: string): Promise<void> => {
      console.log(`\n❓ 问题: ${question}`);

      // 检索相关文档
      const relevantDocs = await vectorStore.similaritySearch(question, 2);

      console.log(`🔍 找到 ${relevantDocs.length} 个相关文档片段`);

      // 构建上下文
      const context = relevantDocs
        .map((doc) => `${doc.pageContent} (来源: ${doc.metadata.source})`)
        .join("\n\n");

      // 构建提示
      const messages = [
        new SystemMessage(`你是一个AI助手。基于以下上下文信息回答用户问题，请用中文回答。如果上下文中没有相关信息，请说明。

上下文信息：
${context}`),
        new HumanMessage(question),
      ];

      // 获取答案
      const response = await chat.invoke(messages);
      console.log(`💬 回答: ${response.content}`);
    };

    // 测试几个问题
    await askQuestion("什么是LangChain？");
    await askQuestion("LangChain支持哪些语言模型？");
    await askQuestion("什么是Vector Store？");
    await askQuestion("LangChain的核心概念有哪些？");

    // 演示使用fetch获取在线内容
    console.log("\n🌐 演示从网络获取内容...");
    await fetchAndAnswerFromURL();
  } catch (error) {
    console.error(
      "❌ 文档问答演示出错:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

async function fetchAndAnswerFromURL(): Promise<void> {
  try {
    // 使用fetch获取在线内容（示例：获取README内容）
    const response = await fetch(
      "https://raw.githubusercontent.com/langchain-ai/langchain/master/README.md"
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const content = await response.text();

    // 截取前1000个字符作为示例
    const truncatedContent = content.substring(0, 1000);

    console.log("📄 成功获取在线文档内容 (前1000字符)");

    // 这里可以进一步处理内容，比如创建Document对象并添加到向量存储
    const onlineDoc = new Document({
      pageContent: truncatedContent,
      metadata: { source: "langchain-readme", type: "online" },
    });

    console.log("✅ 在线内容处理完成");
  } catch (error) {
    console.error(
      "❌ 获取在线内容失败:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

// 允许单独运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  documentQA();
}
