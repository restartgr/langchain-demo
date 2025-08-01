import { config } from "./config/index.js";
import { basicChat } from "./examples/basic-chat.js";
import { documentQA } from "./examples/document-qa.js";
import { toolUsage } from "./examples/tool-usage.js";
import { chainExample } from "./examples/chain-example.js";

console.log("🚀 LangChain 演示项目启动");
console.log("=====================================");

async function main(): Promise<void> {
  try {
    console.log("\n1. 基础聊天演示");
    console.log("─".repeat(30));
    await basicChat();

    console.log("\n2. 文档问答演示");
    console.log("─".repeat(30));
    await documentQA();

    console.log("\n3. 工具使用演示");
    console.log("─".repeat(30));
    await toolUsage();

    console.log("\n4. 链式调用演示");
    console.log("─".repeat(30));
    await chainExample();

    console.log("\n✅ 所有演示完成！");
    console.log("\n💡 提示: 你可以单独运行各个演示:");
    console.log("   npm run chat   - 基础聊天");
    console.log("   npm run qa     - 文档问答");
    console.log("   npm run tools  - 工具使用");
    console.log("   npm run chain  - 链式调用");
  } catch (error) {
    console.error(
      "❌ 演示运行出错:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

// 仅在直接运行此文件时执行main函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
