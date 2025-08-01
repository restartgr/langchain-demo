import { ChatZhipuAI } from "@langchain/community/chat_models/zhipuai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { DynamicTool } from "@langchain/core/tools";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { config } from "../config/index.js";

export async function toolUsage(): Promise<void> {
  console.log("🔧 工具使用演示开始...");
  console.log("🔮 使用智谱AI GLM-4模型");

  try {
    // 创建自定义工具：计算器
    const calculatorTool = new DynamicTool({
      name: "calculator",
      description:
        '进行基本的数学计算，支持加减乘除。输入应该是数学表达式，如 "2 + 3" 或 "10 * 5"',
      func: async (input: string): Promise<string> => {
        try {
          // 简单的数学表达式求值（生产环境中应使用更安全的方法）
          const result = Function(`"use strict"; return (${input})`)();
          return `计算结果: ${input} = ${result}`;
        } catch (error) {
          return `计算错误: 无法计算 "${input}"`;
        }
      },
    });

    // 创建天气查询工具（使用fetch模拟API调用）
    const weatherTool = new DynamicTool({
      name: "weather",
      description: '查询指定城市的天气信息。输入城市名称，如 "北京" 或 "上海"',
      func: async (input: string): Promise<string> => {
        try {
          // 模拟天气API调用（实际应用中应使用真实的天气API）
          console.log(`🌤️ 正在查询 ${input} 的天气...`);

          // 模拟网络延迟
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // 模拟天气数据
          const mockWeatherData = {
            北京: "晴朗，25°C，微风",
            上海: "多云，23°C，东南风",
            广州: "小雨，28°C，南风",
            深圳: "阴天，27°C，无风",
          };

          const weather =
            mockWeatherData[input as keyof typeof mockWeatherData] ||
            "未知城市，无法获取天气信息";

          return `${input}的天气: ${weather}`;
        } catch (error) {
          return `天气查询失败: ${
            error instanceof Error ? error.message : String(error)
          }`;
        }
      },
    });

    // 创建网络搜索工具（使用fetch）
    const webSearchTool = new DynamicTool({
      name: "web_search",
      description: "在网络上搜索信息。输入搜索关键词",
      func: async (input: string): Promise<string> => {
        try {
          console.log(`🔍 正在搜索: ${input}`);

          // 模拟搜索API调用（这里使用一个免费的API示例）
          // 实际应用中可以使用 Google Search API, Bing Search API 等
          const searchUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(
            input
          )}&sort=stars&order=desc&per_page=3`;

          const response = await fetch(searchUrl);

          if (!response.ok) {
            throw new Error(`搜索请求失败: ${response.status}`);
          }

          const data = await response.json();

          if (data.items && data.items.length > 0) {
            const results = data.items
              .map(
                (item: any, index: number) =>
                  `${index + 1}. ${item.name}: ${
                    item.description || "无描述"
                  } (⭐${item.stargazers_count})`
              )
              .join("\n");

            return `搜索结果 (GitHub仓库):\n${results}`;
          } else {
            return "未找到相关结果";
          }
        } catch (error) {
          return `搜索失败: ${
            error instanceof Error ? error.message : String(error)
          }`;
        }
      },
    });

    // 初始化智谱AI聊天模型
    const llm = new ChatZhipuAI({
      zhipuAIApiKey: config.zhipuai.apiKey!,
      model: config.models.chat,
      temperature: config.app.temperature,
    });

    // 创建工具列表
    const tools = [calculatorTool, weatherTool, webSearchTool];

    // 由于智谱AI可能不支持OpenAI Functions，我们使用简化的工具调用方式
    console.log("📋 可用工具:");
    tools.forEach((tool) => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });

    // 测试各种工具使用（简化版本，手动选择工具）
    const testQueries = [
      {
        query: "计算 15 + 27 * 3",
        toolName: "calculator",
        input: "15 + 27 * 3",
      },
      { query: "查询北京的天气", toolName: "weather", input: "北京" },
      {
        query: "搜索 langchain 相关项目",
        toolName: "web_search",
        input: "langchain",
      },
    ];

    for (const { query, toolName, input } of testQueries) {
      console.log(`\n${"=".repeat(50)}`);
      console.log(`🤔 用户问题: ${query}`);
      console.log(`🔧 选择工具: ${toolName}`);
      console.log(`${"=".repeat(50)}`);

      try {
        // 找到对应的工具
        const tool = tools.find((t) => t.name === toolName);
        if (tool) {
          const toolResult = await tool.invoke(input);
          console.log(`🔧 工具结果: ${toolResult}`);

          // 让AI基于工具结果生成最终回答
          const messages = [
            new SystemMessage(
              "你是一个有用的AI助手。用户询问了一个问题，我使用了相关工具获得了结果。请基于这个结果给用户一个完整的回答。"
            ),
            new HumanMessage(
              `用户问题: ${query}\n工具结果: ${toolResult}\n\n请给出最终回答:`
            ),
          ];

          const response = await llm.invoke(messages);
          console.log(`✅ GLM最终回答: ${response.content}`);
        }
      } catch (error) {
        console.error(
          `❌ 处理失败: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    // 复合问题测试
    console.log(`\n${"=".repeat(50)}`);
    console.log(`🤔 复合问题测试: 上海的天气怎么样，同时帮我计算 100 / 4`);
    console.log(`${"=".repeat(50)}`);

    try {
      // 先查天气
      const weatherResult = await weatherTool.invoke("上海");
      console.log(`🔧 天气查询结果: ${weatherResult}`);

      // 再计算
      const calcResult = await calculatorTool.invoke("100 / 4");
      console.log(`🔧 计算结果: ${calcResult}`);

      // 让AI综合回答
      const messages = [
        new SystemMessage(
          "你是一个有用的AI助手。请基于以下工具结果给用户一个完整的回答。"
        ),
        new HumanMessage(`用户问题: 上海的天气怎么样，同时帮我计算 100 / 4
天气查询结果: ${weatherResult}
计算结果: ${calcResult}

请给出完整回答:`),
      ];

      const response = await llm.invoke(messages);
      console.log(`✅ GLM综合回答: ${response.content}`);
    } catch (error) {
      console.error(
        `❌ 复合问题处理失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  } catch (error) {
    console.error(
      "❌ 工具使用演示出错:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

// 允许单独运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  toolUsage();
}
