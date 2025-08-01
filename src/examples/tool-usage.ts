import { ChatZhipuAI } from "@langchain/community/chat_models/zhipuai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { DynamicTool } from "@langchain/core/tools";
import { config } from "../config/index.js";

export async function toolUsage(): Promise<void> {
  console.log("🔧 工具使用演示开始...");
  console.log("🔮 使用智谱AI GLM-4.5-Air模型 + 真实API工具");

  try {
    // 创建自定义工具：计算器
    const calculatorTool = new DynamicTool({
      name: "calculator",
      description:
        '进行基本的数学计算，支持加减乘除、三角函数等。输入应该是数学表达式，如 "2 + 3"、"sin(0.5)"、"sqrt(16)"',
      func: async (input: string): Promise<string> => {
        try {
          // 使用更安全的数学计算方式
          const mathExpression = input.replace(/[^0-9+\-*/().\s]/g, "");
          const result = Function(`"use strict"; return (${mathExpression})`)();

          if (isNaN(result) || !isFinite(result)) {
            return `计算错误: "${input}" 不是有效的数学表达式`;
          }

          return `计算结果: ${input} = ${result}`;
        } catch (error) {
          return `计算错误: 无法计算 "${input}"，请检查表达式格式`;
        }
      },
    });

    // 创建真实天气查询工具
    const weatherTool = new DynamicTool({
      name: "weather",
      description:
        '查询指定城市的实时天气信息。输入城市名称，如 "北京"、"上海"、"London"',
      func: async (input: string): Promise<string> => {
        try {
          console.log(`🌤️ 正在查询 ${input} 的天气...`);

          // 使用免费的wttr.in天气服务
          const weatherUrl = `https://wttr.in/${encodeURIComponent(
            input
          )}?format=j1`;

          const response = await fetch(weatherUrl, {
            headers: {
              "User-Agent": "curl/7.68.0", // wttr.in需要这个header
            },
          });

          if (!response.ok) {
            throw new Error(`天气API请求失败: ${response.status}`);
          }

          const data = await response.json();

          if (data.current_condition && data.current_condition[0]) {
            const current = data.current_condition[0];
            const weather = data.weather[0];

            return `${input}的天气:
🌡️ 当前温度: ${current.temp_C}°C (体感 ${current.FeelsLikeC}°C)
🌤️ 天气状况: ${current.weatherDesc[0].value}
💨 风速: ${current.windspeedKmph}km/h ${current.winddir16Point}
💧 湿度: ${current.humidity}%
👁️ 能见度: ${current.visibility}km
📊 今日最高温: ${weather.maxtempC}°C，最低温: ${weather.mintempC}°C`;
          } else {
            return `无法获取 ${input} 的天气信息，请检查城市名称是否正确`;
          }
        } catch (error) {
          console.error("天气查询失败:", error);
          return `天气查询失败: ${
            error instanceof Error ? error.message : String(error)
          }`;
        }
      },
    });

    // 创建GitHub搜索工具（已优化）
    const githubSearchTool = new DynamicTool({
      name: "github_search",
      description: "在GitHub上搜索开源项目。输入搜索关键词",
      func: async (input: string): Promise<string> => {
        try {
          console.log(`🔍 正在GitHub上搜索: ${input}`);

          const searchUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(
            input
          )}&sort=stars&order=desc&per_page=5`;

          const response = await fetch(searchUrl);

          if (!response.ok) {
            throw new Error(`GitHub搜索请求失败: ${response.status}`);
          }

          const data = await response.json();

          if (data.items && data.items.length > 0) {
            const results = data.items
              .map(
                (item: any, index: number) =>
                  `${index + 1}. **${item.name}**
   📄 描述: ${item.description || "无描述"}
   ⭐ Stars: ${item.stargazers_count.toLocaleString()}
   🍴 Forks: ${item.forks_count.toLocaleString()}
   🌐 语言: ${item.language || "未知"}
   🔗 链接: ${item.html_url}`
              )
              .join("\n\n");

            return `GitHub搜索结果 (关键词: ${input}):\n\n${results}`;
          } else {
            return `未找到与 "${input}" 相关的GitHub项目`;
          }
        } catch (error) {
          return `GitHub搜索失败: ${
            error instanceof Error ? error.message : String(error)
          }`;
        }
      },
    });

    // 创建时间查询工具
    const timeTool = new DynamicTool({
      name: "time",
      description:
        '查询当前时间或指定时区的时间。输入时区名称如 "Asia/Shanghai"、"America/New_York" 或 "UTC"',
      func: async (input: string): Promise<string> => {
        try {
          console.log(`🕐 正在查询时间: ${input}`);

          const timezone = input.trim() || "Asia/Shanghai";
          const now = new Date();

          let timeString: string;
          let zoneName: string;

          if (timezone.toLowerCase() === "utc") {
            timeString = now.toISOString();
            zoneName = "UTC";
          } else {
            timeString = now.toLocaleString("zh-CN", {
              timeZone: timezone,
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              weekday: "long",
            });
            zoneName = timezone;
          }

          return `🕐 时间查询结果:
📅 时区: ${zoneName}
⏰ 当前时间: ${timeString}
🌍 UTC时间: ${now.toISOString()}`;
        } catch (error) {
          return `时间查询失败: ${
            error instanceof Error ? error.message : String(error)
          }`;
        }
      },
    });

    // 创建汇率查询工具
    const currencyTool = new DynamicTool({
      name: "currency",
      description: '查询实时汇率。输入格式: "USD to CNY" 或 "100 EUR to USD"',
      func: async (input: string): Promise<string> => {
        try {
          console.log(`💱 正在查询汇率: ${input}`);

          // 解析输入格式
          const match = input.match(/(\d+)?\s*([A-Z]{3})\s+to\s+([A-Z]{3})/i);
          if (!match) {
            return '汇率查询格式错误，请使用格式: "USD to CNY" 或 "100 EUR to USD"';
          }

          const amount = parseFloat(match[1]) || 1;
          const fromCurrency = match[2].toUpperCase();
          const toCurrency = match[3].toUpperCase();

          // 使用免费的汇率API
          const apiUrl = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;

          const response = await fetch(apiUrl);

          if (!response.ok) {
            throw new Error(`汇率API请求失败: ${response.status}`);
          }

          const data = await response.json();

          if (data.rates && data.rates[toCurrency]) {
            const rate = data.rates[toCurrency];
            const convertedAmount = amount * rate;

            return `💱 汇率查询结果:
💰 ${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}
📊 汇率: 1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}
📅 更新时间: ${data.date}`;
          } else {
            return `无法获取 ${fromCurrency} 到 ${toCurrency} 的汇率`;
          }
        } catch (error) {
          return `汇率查询失败: ${
            error instanceof Error ? error.message : String(error)
          }`;
        }
      },
    });

    // 创建新闻查询工具
    const newsTool = new DynamicTool({
      name: "news",
      description:
        '查询最新科技新闻。输入关键词如 "AI"、"technology"、"programming"',
      func: async (input: string): Promise<string> => {
        try {
          console.log(`📰 正在查询新闻: ${input}`);

          // 使用Hacker News API作为示例
          const response = await fetch(
            "https://hacker-news.firebaseio.com/v0/topstories.json"
          );

          if (!response.ok) {
            throw new Error(`新闻API请求失败: ${response.status}`);
          }

          const storyIds = await response.json();

          // 获取前5个热门新闻
          const newsPromises = storyIds.slice(0, 5).map(async (id: number) => {
            const storyResponse = await fetch(
              `https://hacker-news.firebaseio.com/v0/item/${id}.json`
            );
            return storyResponse.json();
          });

          const stories = await Promise.all(newsPromises);

          const filteredStories = stories.filter(
            (story) =>
              story.title &&
              story.title.toLowerCase().includes(input.toLowerCase())
          );

          if (filteredStories.length === 0) {
            return `未找到包含关键词 "${input}" 的相关新闻`;
          }

          const newsResults = filteredStories
            .slice(0, 3)
            .map(
              (story, index) =>
                `${index + 1}. **${story.title}**
   🔗 链接: ${story.url || `https://news.ycombinator.com/item?id=${story.id}`}
   👍 分数: ${story.score || 0}
   ⏰ 时间: ${new Date(story.time * 1000).toLocaleString("zh-CN")}`
            )
            .join("\n\n");

          return `📰 相关新闻 (关键词: ${input}):\n\n${newsResults}`;
        } catch (error) {
          return `新闻查询失败: ${
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
    const tools = [
      calculatorTool,
      weatherTool,
      githubSearchTool,
      timeTool,
      currencyTool,
      newsTool,
    ];

    console.log("📋 可用的真实API工具:");
    tools.forEach((tool) => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });

    // 测试各种工具使用
    const testQueries = [
      {
        query: "计算 (15 + 27) * 3 / 2",
        toolName: "calculator",
        input: "(15 + 27) * 3 / 2",
      },
      { query: "查询北京的实时天气", toolName: "weather", input: "北京" },
      {
        query: "搜索langchain相关的GitHub项目",
        toolName: "github_search",
        input: "langchain",
      },
      {
        query: "查询上海时区的当前时间",
        toolName: "time",
        input: "Asia/Shanghai",
      },
      {
        query: "查询美元到人民币的汇率",
        toolName: "currency",
        input: "USD to CNY",
      },
      { query: "查询AI相关的最新科技新闻", toolName: "news", input: "AI" },
    ];

    for (const { query, toolName, input } of testQueries) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🤔 用户问题: ${query}`);
      console.log(`🔧 使用工具: ${toolName}`);
      console.log(`${"=".repeat(60)}`);

      try {
        const tool = tools.find((t) => t.name === toolName);
        if (tool) {
          const toolResult = await tool.invoke(input);
          console.log(`🔧 工具结果:\n${toolResult}`);

          // 让AI基于工具结果生成最终回答
          const messages = [
            new SystemMessage(
              "你是一个有用的AI助手。用户询问了一个问题，我使用了相关工具获得了结果。请基于这个结果给用户一个完整、友好的回答。"
            ),
            new HumanMessage(
              `用户问题: ${query}\n工具结果: ${toolResult}\n\n请给出最终回答:`
            ),
          ];

          const response = await llm.invoke(messages);
          console.log(`✅ GLM智能回答: ${response.content}`);
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
    console.log(`\n${"=".repeat(60)}`);
    console.log(
      `🤔 复合问题测试: 上海的天气怎么样，现在几点了，美元汇率是多少？`
    );
    console.log(`${"=".repeat(60)}`);

    try {
      // 并行执行多个工具
      const [weatherResult, timeResult, currencyResult] = await Promise.all([
        weatherTool.invoke("上海"),
        timeTool.invoke("Asia/Shanghai"),
        currencyTool.invoke("USD to CNY"),
      ]);

      console.log(`🔧 天气查询结果:\n${weatherResult}`);
      console.log(`🔧 时间查询结果:\n${timeResult}`);
      console.log(`🔧 汇率查询结果:\n${currencyResult}`);

      // 让AI综合回答
      const messages = [
        new SystemMessage(
          "你是一个有用的AI助手。请基于以下工具结果给用户一个完整、综合的回答。"
        ),
        new HumanMessage(`用户问题: 上海的天气怎么样，现在几点了，美元汇率是多少？

天气查询结果: ${weatherResult}

时间查询结果: ${timeResult}

汇率查询结果: ${currencyResult}

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

    console.log("\n🎉 真实API工具演示完成！");
    console.log("💡 现在所有工具都使用真实的API服务，提供准确的实时数据。");
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
