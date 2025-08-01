import { ChatZhipuAI } from "@langchain/community/chat_models/zhipuai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { config } from "../config/index.js";

// 智谱AI Embedding 类
class ZhipuAIEmbeddings {
  private apiKey: string;
  private model: string;
  private baseURL: string;

  constructor() {
    this.apiKey = config.zhipuai.apiKey!;
    this.model = config.models.embedding;
    this.baseURL = "https://open.bigmodel.cn/api/paas/v4/embeddings";
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    try {
      console.log(`🔤 正在为 ${texts.length} 个文档生成嵌入向量...`);

      const embeddings: number[][] = [];

      // 批量处理，每次处理一定数量的文本
      const batchSize = 10;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchEmbeddings = await this.getBatchEmbeddings(batch);
        embeddings.push(...batchEmbeddings);
      }

      console.log("✅ 文档嵌入向量生成完成");
      return embeddings;
    } catch (error) {
      console.error("❌ 文档嵌入生成失败:", error);
      // 如果API调用失败，fallback到mock嵌入
      console.log("🔄 使用Mock嵌入作为fallback...");
      return this.getMockEmbeddings(texts);
    }
  }

  async embedQuery(text: string): Promise<number[]> {
    try {
      console.log("🔍 正在为查询生成嵌入向量...");

      const embeddings = await this.getBatchEmbeddings([text]);
      console.log("✅ 查询嵌入向量生成完成");

      return embeddings[0];
    } catch (error) {
      console.error("❌ 查询嵌入生成失败:", error);
      // 如果API调用失败，fallback到mock嵌入
      console.log("🔄 使用Mock嵌入作为fallback...");
      return Array.from({ length: 1024 }, () => Math.random() - 0.5);
    }
  }

  private async getBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await fetch(this.baseURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `智谱AI Embedding API 请求失败: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`智谱AI Embedding API 错误: ${data.error.message}`);
    }

    return data.data.map((item: any) => item.embedding);
  }

  private getMockEmbeddings(texts: string[]): number[][] {
    console.log("⚠️ 使用Mock嵌入向量（用于演示）");
    return texts.map((text) =>
      Array.from({ length: 1024 }, () => Math.random() - 0.5)
    );
  }
}

export async function documentQA(): Promise<void> {
  console.log("📚 文档问答演示开始...");
  console.log("🔮 使用智谱AI GLM-4.5-Air模型 + Embedding-3嵌入模型");

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
          "LangChain支持多种语言模型，包括OpenAI GPT、Anthropic Claude、智谱AI GLM等。",
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
      new Document({
        pageContent:
          "智谱AI GLM-4.5-Air是一个高性能的大语言模型，支持对话、文本生成、代码编写等多种任务。",
        metadata: { source: "doc5.txt", type: "zhipuai" },
      }),
      new Document({
        pageContent:
          "Embedding向量嵌入技术将文本转换为数值向量，支持语义相似度计算和检索。",
        metadata: { source: "doc6.txt", type: "embedding" },
      }),
    ];

    console.log(`📄 准备了 ${documents.length} 个文档`);

    // 初始化智谱AI嵌入模型
    const embeddings = new ZhipuAIEmbeddings();

    // 创建向量存储
    console.log("🔄 正在创建向量存储...");
    const vectorStore = await MemoryVectorStore.fromDocuments(
      documents,
      embeddings
    );
    console.log("✅ 向量存储创建完成");

    // 初始化智谱AI聊天模型
    const chat = new ChatZhipuAI({
      zhipuAIApiKey: config.zhipuai.apiKey!,
      model: config.models.chat,
      temperature: config.app.temperature,
    });

    // 问答功能
    const askQuestion = async (question: string): Promise<void> => {
      console.log(`\n❓ 问题: ${question}`);

      // 检索相关文档
      const relevantDocs = await vectorStore.similaritySearch(question, 3);

      console.log(`🔍 找到 ${relevantDocs.length} 个相关文档片段`);

      // 显示检索到的文档
      relevantDocs.forEach((doc, index) => {
        console.log(
          `📄 文档${index + 1}: ${doc.pageContent.substring(0, 50)}... (来源: ${
            doc.metadata.source
          })`
        );
      });

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
    await askQuestion("智谱AI GLM-4.5-Air有什么特点？");
    await askQuestion("什么是Embedding向量嵌入？");

    // 演示语义搜索能力
    console.log("\n🎯 语义搜索演示");
    console.log("─".repeat(30));

    const semanticQueries = ["人工智能模型", "文本向量化", "智能代理工具"];

    for (const query of semanticQueries) {
      console.log(`\n🔍 语义搜索: "${query}"`);
      const results = await vectorStore.similaritySearch(query, 2);
      results.forEach((doc, index) => {
        console.log(
          `📄 结果${index + 1}: ${doc.pageContent} (来源: ${
            doc.metadata.source
          })`
        );
      });
    }

    // 演示使用fetch获取在线内容
    console.log("\n🌐 演示从网络获取内容...");
    await fetchAndAnswerFromURL(chat, vectorStore);
  } catch (error) {
    console.error(
      "❌ 文档问答演示出错:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

async function fetchAndAnswerFromURL(
  chat: ChatZhipuAI,
  vectorStore: MemoryVectorStore
): Promise<void> {
  try {
    // 使用fetch获取在线内容（示例：获取README内容）
    const httpResponse = await fetch(
      "https://raw.githubusercontent.com/langchain-ai/langchain/master/README.md"
    );

    if (!httpResponse.ok) {
      throw new Error(`HTTP error! status: ${httpResponse.status}`);
    }

    const content = await httpResponse.text();

    // 截取前1000个字符作为示例
    const truncatedContent = content.substring(0, 1000);

    console.log("📄 成功获取在线文档内容 (前1000字符)");

    // 创建在线文档对象并添加到向量存储
    const onlineDoc = new Document({
      pageContent: truncatedContent,
      metadata: { source: "langchain-readme", type: "online" },
    });

    // 将在线文档添加到向量存储
    await vectorStore.addDocuments([onlineDoc]);
    console.log("✅ 在线内容已添加到向量存储");

    // 基于新添加的在线内容进行问答
    console.log("\n🤔 基于在线内容的问答:");
    const onlineQuestion = "LangChain的GitHub仓库介绍了什么？";
    console.log(`❓ 问题: ${onlineQuestion}`);

    const relevantDocs = await vectorStore.similaritySearch(onlineQuestion, 2);
    const context = relevantDocs
      .map((doc) => `${doc.pageContent} (来源: ${doc.metadata.source})`)
      .join("\n\n");

    const messages = [
      new SystemMessage(`基于以下上下文信息回答用户问题：

${context}`),
      new HumanMessage(onlineQuestion),
    ];

    const aiResponse = await chat.invoke(messages);
    console.log(`💬 回答: ${aiResponse.content}`);
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
