import { ChatZhipuAI } from "@langchain/community/chat_models/zhipuai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { config } from "../config/index.js";

// 辅助函数，将MessageContent转换为字符串
function getTextContent(content: any): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item === "string" ? item : item.text || ""))
      .join("");
  }
  return content?.text || String(content) || "";
}

export async function chainExample(): Promise<void> {
  console.log("⛓️ 链式调用演示开始...");
  console.log("🔮 使用智谱AI GLM-4.5-Air模型");

  try {
    // 初始化智谱AI聊天模型
    const llm = new ChatZhipuAI({
      zhipuAIApiKey: config.zhipuai.apiKey!,
      model: config.models.chat,
      temperature: config.app.temperature,
    });

    console.log("\n1. 简单链演示");
    console.log("─".repeat(30));

    // 创建提示模板
    const promptTemplate = ChatPromptTemplate.fromTemplate(`
你是一个专业的翻译助手。请将以下文本翻译成{target_language}，并保持原意不变：

原文：{text}

翻译：`);

    // 创建简单链
    const translateChain = promptTemplate.pipe(llm);

    // 测试翻译链
    const translationResult = await translateChain.invoke({
      text: "LangChain is a framework for developing applications powered by language models.",
      target_language: "中文",
    });

    console.log("🔤 翻译结果:", getTextContent(translationResult.content));

    console.log("\n2. 手动顺序链演示（推荐方式）");
    console.log("─".repeat(30));

    // 创建第一个链：生成故事大纲
    const outlinePrompt = ChatPromptTemplate.fromTemplate(`
请根据以下主题创建一个简短的故事大纲：

主题：{topic}

故事大纲：`);

    // 创建第二个链：扩展故事
    const storyPrompt = ChatPromptTemplate.fromTemplate(`
基于以下故事大纲，写一个详细的短故事（200字左右）：

大纲：{outline}

故事：`);

    // 创建第三个链：总结故事
    const summaryPrompt = ChatPromptTemplate.fromTemplate(`
请为以下故事写一个简短的总结（50字以内）：

故事：{story}

总结：`);

    // 手动链式调用方式（更清晰和可控）
    const manualSequentialDemo = async (topic: string) => {
      console.log("📝 开始链式创作故事...");

      // 第一步：生成大纲
      const outlineResult = await outlinePrompt.pipe(llm).invoke({ topic });
      const outline = getTextContent(outlineResult.content);
      console.log("✅ 大纲生成完成");

      // 第二步：基于大纲写故事
      const storyResult = await storyPrompt.pipe(llm).invoke({ outline });
      const story = getTextContent(storyResult.content);
      console.log("✅ 故事创作完成");

      // 第三步：总结故事
      const summaryResult = await summaryPrompt.pipe(llm).invoke({ story });
      const summary = getTextContent(summaryResult.content);
      console.log("✅ 故事总结完成");

      console.log("\n📖 链式创作结果:");
      console.log("─".repeat(20));
      console.log("💡 故事大纲:", outline.trim());
      console.log("\n📚 完整故事:", story.trim());
      console.log("\n📋 故事总结:", summary.trim());

      return { outline, story, summary };
    };

    await manualSequentialDemo("一只会说话的猫咪和它的冒险");

    console.log("\n3. 并行链演示");
    console.log("─".repeat(30));

    // 演示并行处理多个任务
    const parallelDemo = async () => {
      const topics = ["勇敢的小老鼠", "魔法森林", "时光旅行者"];

      console.log("🔄 并行生成多个故事大纲...");

      // 并行调用
      const outlinePromises = topics.map((topic) =>
        outlinePrompt.pipe(llm).invoke({ topic })
      );

      const results = await Promise.all(outlinePromises);

      results.forEach((result, index) => {
        console.log(`📖 主题"${topics[index]}"的大纲:`);
        console.log(getTextContent(result.content).trim());
        console.log("");
      });
    };

    await parallelDemo();

    console.log("\n4. 条件链演示");
    console.log("─".repeat(30));

    // 演示条件性的链调用
    const analyzeAndRespond = async (userInput: string): Promise<void> => {
      console.log(`🔍 分析用户输入: "${userInput}"`);

      // 第一步：分析输入类型
      const analysisPrompt = ChatPromptTemplate.fromTemplate(`
请分析以下用户输入属于什么类型，只回答类型名称（问题、请求、抱怨、赞美、其他）：

用户输入：{input}

类型：`);

      const analysisChain = analysisPrompt.pipe(llm);
      const analysisResult = await analysisChain.invoke({ input: userInput });
      const inputType = getTextContent(analysisResult.content).trim();

      console.log(`📊 输入类型: ${inputType}`);

      // 根据类型选择不同的响应策略
      let responsePrompt: ChatPromptTemplate;

      if (inputType.includes("问题")) {
        responsePrompt = ChatPromptTemplate.fromTemplate(`
用户问了一个问题，请提供有帮助的答案：

问题：{input}

答案：`);
      } else if (inputType.includes("抱怨")) {
        responsePrompt = ChatPromptTemplate.fromTemplate(`
用户表达了抱怨，请以同理心回应并提供建设性建议：

抱怨：{input}

回应：`);
      } else if (inputType.includes("赞美")) {
        responsePrompt = ChatPromptTemplate.fromTemplate(`
用户表达了赞美，请礼貌地表示感谢：

赞美：{input}

回应：`);
      } else {
        responsePrompt = ChatPromptTemplate.fromTemplate(`
请对用户的输入给出合适的回应：

输入：{input}

回应：`);
      }

      const responseChain = responsePrompt.pipe(llm);
      const response = await responseChain.invoke({ input: userInput });
      console.log(`💬 GLM回应: ${getTextContent(response.content).trim()}`);
    };

    // 测试不同类型的输入
    const testInputs = [
      "LangChain是什么？",
      "这个软件太难用了！",
      "这个演示做得真不错！",
      "今天天气真好。",
    ];

    for (const input of testInputs) {
      await analyzeAndRespond(input);
      console.log("");
    }
  } catch (error) {
    console.error(
      "❌ 链式调用演示出错:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

// 允许单独运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  chainExample();
}
