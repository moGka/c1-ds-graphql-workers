// DeepSeek API 接口定义和实现
// 用于与 DeepSeek AI 模型进行交互的客户端类

// 消息接口 - 定义对话中的消息结构
export interface DeepSeekMessage {
  role: 'user' | 'assistant' | 'system';  // 角色：用户、AI助手、系统
  content: string;  // 消息内容
}

// 请求接口 - 发送给 DeepSeek API 的请求参数
export interface DeepSeekRequest {
  model: string;  // 使用的AI模型名称
  messages: DeepSeekMessage[];  // 对话历史消息数组
  temperature?: number;  // 温度参数，控制回复随机性（0-1）
  max_tokens?: number;  // 最大生成token数量
  stream?: boolean;  // 是否使用流式响应
}

// 响应接口 - DeepSeek API 返回的响应结构
export interface DeepSeekResponse {
  id: string;  // 响应ID
  object: string;  // 对象类型
  created: number;  // 创建时间戳
  model: string;  // 使用的模型名称
  choices: Array<{
    index: number;  // 选项索引
    message: {
      role: string;  // AI角色
      content: string;  // AI回复内容
    };
    finish_reason: string;  // 完成原因
  }>;
  usage: {
    prompt_tokens: number;  // 输入token数
    completion_tokens: number;  // 输出token数
    total_tokens: number;  // 总token数
  };
}

// DeepSeek API 客户端类
// 封装了与 DeepSeek API 交互的所有方法
export class DeepSeekAPI {
  private apiKey: string;  // API 密钥
  private baseUrl: string;  // API 基础URL

  /**
   * 构造函数
   * @param apiKey - DeepSeek API 密钥
   * @param baseUrl - API 基础URL，默认为官方地址
   */
  constructor(apiKey: string, baseUrl: string = 'https://api.deepseek.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * 发送聊天请求（同步模式）
   * @param request - 聊天请求参数
   * @returns Promise<DeepSeekResponse> - 聊天响应
   */
  async chat(request: DeepSeekRequest): Promise<DeepSeekResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API 错误: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DeepSeek API 调用失败:', error);
      throw error;
    }
  }

  /**
   * 发送聊天请求（流式模式）
   * @param request - 聊天请求参数
   * @returns Promise<ReadableStream> - 流式响应
   */
  async streamChat(request: DeepSeekRequest): Promise<ReadableStream> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ ...request, stream: true }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API 错误: ${response.status} - ${errorText}`);
      }

      return response.body!;
    } catch (error) {
      console.error('DeepSeek 流式API 调用失败:', error);
      throw error;
    }
  }

  /**
   * 获取支持的模型列表
   * @returns Promise<string[]> - 支持的模型名称数组
   */
  async getModels(): Promise<string[]> {
    // DeepSeek 目前主要支持的模型
    return ['deepseek-chat', 'deepseek-coder'];
  }

  /**
   * 验证API密钥是否有效
   * @returns Promise<boolean> - 密钥是否有效
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const testRequest: DeepSeekRequest = {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      };

      await this.chat(testRequest);
      return true;
    } catch (error) {
      console.error('API密钥验证失败:', error);
      return false;
    }
  }
}