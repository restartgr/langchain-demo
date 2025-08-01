import dotenv from "dotenv";
import type { Config } from "../types/index.js";

dotenv.config();

export const config: Config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    apiBase: process.env.OPENAI_API_BASE,
  },

  // 默认模型配置
  models: {
    chat: "gpt-3.5-turbo",
    embedding: "text-embedding-ada-002",
  },

  // 应用配置
  app: {
    maxTokens: 1000,
    temperature: 0.7,
  },
};

// 验证必需的环境变量
if (!config.openai.apiKey) {
  console.error("❌ 错误: 请在.env文件中设置OPENAI_API_KEY");
  process.exit(1);
}
