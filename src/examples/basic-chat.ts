import { ChatZhipuAI } from "@langchain/community/chat_models/zhipuai";
import {
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { config } from "../config/index.js";

export async function basicChat(): Promise<void> {
  console.log("🤖 基础聊天演示开始...");
  console.log("🔮 使用智谱AI GLM-4模型");

  try {
    // 初始化智谱AI聊天模型
    const chat = new ChatZhipuAI({
      zhipuAIApiKey: config.zhipuai.apiKey!,
      model: config.models.chat,
      temperature: config.app.temperature,
    });

    // 准备消息
    const messages: BaseMessage[] = [
      new SystemMessage("你是一个友好的AI助手，请用中文回答问题。"),
      new HumanMessage("你好！请简单介绍一下LangChain是什么？"),
    ];

    console.log("📤 发送消息: 你好！请简单介绍一下LangChain是什么？");

    // 发送消息并获取回复
    const response = await chat.invoke(messages);

    console.log("📥 GLM回复:", response.content);

    // 继续对话
    messages.push(response);
    messages.push(new HumanMessage("能给我一个简单的使用例子吗？"));

    console.log("\n📤 发送消息: 能给我一个简单的使用例子吗？");

    const response2 = await chat.invoke(messages);
    console.log("📥 GLM回复:", response2.content);

    // 测试流式响应
    console.log("\n📤 发送消息: 请用三句话总结人工智能的发展历程");
    messages.push(new HumanMessage("请用三句话总结人工智能的发展历程"));

    console.log("🌊 流式回复:");
    const stream = await chat.stream(messages);

    let streamContent = "";
    for await (const chunk of stream) {
      if (chunk.content) {
        process.stdout.write(chunk.content.toString());
        streamContent += chunk.content;
      }
    }
    console.log("\n");
  } catch (error) {
    console.error(
      "❌ 基础聊天演示出错:",
      error instanceof Error ? error.message : String(error)
    );
    if (error instanceof Error && error.message.includes("401")) {
      console.log("💡 提示: 请检查ZHIPUAI_API_KEY是否正确设置");
    }
  }
}

// 允许单独运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  basicChat();
}
