import dotenv from "dotenv";
import type { Config } from "../types/index.js";

dotenv.config();

export const config: Config = {
  zhipuai: {
    apiKey: process.env.ZHIPUAI_API_KEY,
    apiBase: process.env.ZHIPUAI_API_BASE || "",
  },

  // 默认模型配置
  models: {
    chat: "GLM-4.5-Air", // 智谱AI GLM-4.5-Air模型
  },

  // 应用配置
  app: {
    maxTokens: 1000,
    temperature: 0.7,
  },
};

// 验证必需的环境变量
if (!config.zhipuai.apiKey) {
  console.error("❌ 错误: 请在.env文件中设置ZHIPUAI_API_KEY");
  console.log("💡 提示: 请到 https://open.bigmodel.cn/ 申请API密钥");
  process.exit(1);
}
