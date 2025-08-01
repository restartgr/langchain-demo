import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { config } from "../config/index.js";

export async function basicChat(): Promise<void> {
  console.log("🤖 基础聊天演示开始...");

  try {
    // 初始化聊天模型
    const chat = new ChatOpenAI({
      openAIApiKey: config.openai.apiKey!,
      modelName: config.models.chat,
      temperature: config.app.temperature,
      maxTokens: config.app.maxTokens,
    });

    // 准备消息
    const messages: BaseMessage[] = [
      new SystemMessage("你是一个友好的AI助手，请用中文回答问题。"),
      new HumanMessage("你好！请简单介绍一下LangChain是什么？"),
    ];

    console.log("📤 发送消息: 你好！请简单介绍一下LangChain是什么？");

    // 发送消息并获取回复
    const response = await chat.invoke(messages);

    console.log("📥 AI回复:", response.content);

    // 继续对话
    messages.push(response);
    messages.push(new HumanMessage("能给我一个简单的使用例子吗？"));

    console.log("\n📤 发送消息: 能给我一个简单的使用例子吗？");

    const response2 = await chat.invoke(messages);
    console.log("📥 AI回复:", response2.content);
  } catch (error) {
    console.error(
      "❌ 基础聊天演示出错:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

// 允许单独运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  basicChat();
}
