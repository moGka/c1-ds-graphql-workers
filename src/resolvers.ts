// GraphQL Resolvers 实现
// 处理前端发送的 GraphQL 查询和变更请求

import { DeepSeekAPI, DeepSeekMessage } from './deepseek';

// 聊天输入参数接口
interface ChatInput {
  message: string;           // 用户消息
  model?: string;           // AI模型名称
  temperature?: number;     // 温度参数
  maxTokens?: number;       // 最大token数
  conversationId?: string;  // 对话ID
  systemPrompt?: string;    // 系统提示词
}

// Workers 执行上下文接口
interface Context {
  env: {
    DEEPSEEK_API_KEY: string;      // DeepSeek API 密钥
    DEEPSEEK_API_URL?: string;     // API 地址（可选）
  };
}

// GraphQL Resolvers 定义
export const resolvers = {
  // 查询解析器
  Query: {
    /**
     * 健康检查 - 返回服务状态
     */
    health: () => 'GraphQL DeepSeek API 服务运行正常！',
    
    /**
     * 获取支持的模型列表
     */
    models: async (_: any, __: any, context: Context) => {
      try {
        if (!context.env.DEEPSEEK_API_KEY) {
          throw new Error('DeepSeek API 密钥未配置');
        }

        const deepseekApi = new DeepSeekAPI(
          context.env.DEEPSEEK_API_KEY,
          context.env.DEEPSEEK_API_URL
        );

        return await deepseekApi.getModels();
      } catch (error) {
        console.error('获取模型列表失败:', error);
        // 返回默认模型列表
        return ['deepseek-chat', 'deepseek-coder'];
      }
    },
  },
  
  // 变更解析器
  Mutation: {
    /**
     * 聊天接口 - 处理用户消息并返回AI回复
     * @param _ - GraphQL 父对象（未使用）
     * @param input - 聊天输入参数
     * @param context - Workers 执行上下文
     */
    chat: async (_: any, { input }: { input: ChatInput }, context: Context) => {
      try {
        // 解构输入参数并设置默认值
        const { 
          message, 
          model = 'deepseek-chat', 
          temperature = 0.7, 
          maxTokens = 2000, 
          conversationId,
          systemPrompt 
        } = input;
        
        // 验证 API 密钥
        if (!context.env.DEEPSEEK_API_KEY) {
          throw new Error('DeepSeek API 密钥未配置，请在环境变量中设置 DEEPSEEK_API_KEY');
        }

        // 验证输入消息
        if (!message || message.trim().length === 0) {
          throw new Error('消息内容不能为空');
        }

        // 创建 DeepSeek API 客户端
        const deepseekApi = new DeepSeekAPI(
          context.env.DEEPSEEK_API_KEY,
          context.env.DEEPSEEK_API_URL
        );

        // 构建消息历史数组
        const messages: DeepSeekMessage[] = [];
        
        // 如果有系统提示词，添加到消息开头
        if (systemPrompt && systemPrompt.trim().length > 0) {
          messages.push({
            role: 'system',
            content: systemPrompt.trim(),
          });
        }

        // 添加用户消息
        messages.push({
          role: 'user',
          content: message.trim(),
        });

        // 调用 DeepSeek API
        console.log(`发送聊天请求 - 模型: ${model}, 温度: ${temperature}, 最大tokens: ${maxTokens}`);
        
        const response = await deepseekApi.chat({
          model,
          messages,
          temperature: Math.max(0, Math.min(1, temperature)), // 确保温度在 0-1 范围内
          max_tokens: Math.max(1, Math.min(4000, maxTokens)), // 确保token数在合理范围内
        });

        // 检查响应是否有效
        const choice = response.choices[0];
        if (!choice || !choice.message) {
          throw new Error('DeepSeek API 返回了无效的响应');
        }

        // 构建返回结果
        const result = {
          id: response.id,
          message: choice.message.content || '',
          model: response.model,
          usage: response.usage ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          } : {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          },
          conversationId: conversationId || response.id,
          timestamp: new Date().toISOString(),
          finishReason: choice.finish_reason,
        };

        console.log(`聊天请求处理成功 - 响应ID: ${result.id}, 使用tokens: ${result.usage.totalTokens}`);
        
        return result;
        
      } catch (error) {
        // 记录详细错误信息
        console.error('聊天请求处理失败:', {
          error: error instanceof Error ? error.message : '未知错误',
          stack: error instanceof Error ? error.stack : undefined,
          input: input,
        });

        // 抛出用户友好的错误消息
        if (error instanceof Error) {
          if (error.message.includes('401')) {
            throw new Error('DeepSeek API 密钥无效，请检查配置');
          } else if (error.message.includes('429')) {
            throw new Error('请求频率过高，请稍后重试');
          } else if (error.message.includes('500')) {
            throw new Error('DeepSeek 服务暂时不可用，请稍后重试');
          }
          throw new Error(`聊天请求失败: ${error.message}`);
        } else {
          throw new Error('处理聊天请求时发生未知错误');
        }
      }
    },
  },
};