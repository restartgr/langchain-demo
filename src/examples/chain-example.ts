import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";
import { SequentialChain } from "langchain/chains";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { config } from "../config/index.js";

export async function chainExample(): Promise<void> {
  console.log("⛓️ 链式调用演示开始...");

  try {
    // 初始化聊天模型
    const llm = new ChatOpenAI({
      openAIApiKey: config.openai.apiKey!,
      modelName: config.models.chat,
      temperature: config.app.temperature,
      maxTokens: config.app.maxTokens,
    });

    console.log("\n1. 简单LLM链演示");
    console.log("─".repeat(30));

    // 创建提示模板
    const promptTemplate = PromptTemplate.fromTemplate(`
你是一个专业的翻译助手。请将以下文本翻译成{target_language}，并保持原意不变：

原文：{text}

翻译：`);

    // 创建LLM链
    const translateChain = new LLMChain({
      llm,
      prompt: promptTemplate,
      outputKey: "translation",
    });

    // 测试翻译链
    const translationResult = await translateChain.call({
      text: "LangChain is a framework for developing applications powered by language models.",
      target_language: "中文",
    });

    console.log("🔤 翻译结果:", translationResult.translation);

    console.log("\n2. 顺序链演示");
    console.log("─".repeat(30));

    // 创建第一个链：生成故事大纲
    const outlinePrompt = PromptTemplate.fromTemplate(`
请根据以下主题创建一个简短的故事大纲：

主题：{topic}

故事大纲：`);

    const outlineChain = new LLMChain({
      llm,
      prompt: outlinePrompt,
      outputKey: "outline",
    });

    // 创建第二个链：扩展故事
    const storyPrompt = PromptTemplate.fromTemplate(`
基于以下故事大纲，写一个详细的短故事（200字左右）：

大纲：{outline}

故事：`);

    const storyChain = new LLMChain({
      llm,
      prompt: storyPrompt,
      outputKey: "story",
    });

    // 创建第三个链：总结故事
    const summaryPrompt = PromptTemplate.fromTemplate(`
请为以下故事写一个简短的总结（50字以内）：

故事：{story}

总结：`);

    const summaryChain = new LLMChain({
      llm,
      prompt: summaryPrompt,
      outputKey: "summary",
    });

    // 创建顺序链
    const sequentialChain = new SequentialChain({
      chains: [outlineChain, storyChain, summaryChain],
      inputVariables: ["topic"],
      outputVariables: ["outline", "story", "summary"],
      verbose: true,
    });

    console.log("📝 开始创作故事...");
    const storyResult = await sequentialChain.call({
      topic: "一只会说话的猫咪和它的冒险",
    });

    console.log("\n📖 创作结果:");
    console.log("─".repeat(20));
    console.log("💡 故事大纲:", storyResult.outline.trim());
    console.log("\n📚 完整故事:", storyResult.story.trim());
    console.log("\n📋 故事总结:", storyResult.summary.trim());

    console.log("\n3. 条件链演示");
    console.log("─".repeat(30));

    // 演示条件性的链调用
    const analyzeAndRespond = async (userInput: string): Promise<void> => {
      console.log(`🔍 分析用户输入: "${userInput}"`);

      // 第一步：分析输入类型
      const analysisPrompt = PromptTemplate.fromTemplate(`
请分析以下用户输入属于什么类型，只回答类型名称（问题、请求、抱怨、赞美、其他）：

用户输入：{input}

类型：`);

      const analysisChain = new LLMChain({
        llm,
        prompt: analysisPrompt,
      });

      const analysisResult = await analysisChain.call({ input: userInput });
      const inputType = analysisResult.text.trim();

      console.log(`📊 输入类型: ${inputType}`);

      // 根据类型选择不同的响应策略
      let responsePrompt: PromptTemplate;

      if (inputType.includes("问题")) {
        responsePrompt = PromptTemplate.fromTemplate(`
用户问了一个问题，请提供有帮助的答案：

问题：{input}

答案：`);
      } else if (inputType.includes("抱怨")) {
        responsePrompt = PromptTemplate.fromTemplate(`
用户表达了抱怨，请以同理心回应并提供建设性建议：

抱怨：{input}

回应：`);
      } else if (inputType.includes("赞美")) {
        responsePrompt = PromptTemplate.fromTemplate(`
用户表达了赞美，请礼貌地表示感谢：

赞美：{input}

回应：`);
      } else {
        responsePrompt = PromptTemplate.fromTemplate(`
请对用户的输入给出合适的回应：

输入：{input}

回应：`);
      }

      const responseChain = new LLMChain({
        llm,
        prompt: responsePrompt,
      });

      const response = await responseChain.call({ input: userInput });
      console.log(`💬 AI回应: ${response.text.trim()}`);
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
