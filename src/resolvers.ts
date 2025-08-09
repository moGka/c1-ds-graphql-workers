import { DeepSeekAPI } from './deepseek';

interface ChatInput {
  message: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  conversationId?: string;
}

interface Context {
  env: {
    DEEPSEEK_API_KEY: string;
    DEEPSEEK_API_URL?: string;
  };
}

export const resolvers = {
  Query: {
    health: () => 'GraphQL DeepSeek API is running!',
  },
  
  Mutation: {
    chat: async (_: any, { input }: { input: ChatInput }, context: Context) => {
      try {
        const { message, model = 'deepseek-chat', temperature = 0.7, maxTokens = 2000, conversationId } = input;
        
        if (!context.env.DEEPSEEK_API_KEY) {
          throw new Error('DeepSeek API key is not configured');
        }

        const deepseekApi = new DeepSeekAPI(
          context.env.DEEPSEEK_API_KEY,
          context.env.DEEPSEEK_API_URL
        );

        // 构建消息历史（这里简化处理，实际项目中可能需要从数据库获取对话历史）
        const messages = [
          {
            role: 'user' as const,
            content: message,
          }
        ];

        const response = await deepseekApi.chat({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        });

        const choice = response.choices[0];
        if (!choice) {
          throw new Error('No response from DeepSeek API');
        }

        return {
          id: response.id,
          message: choice.message.content,
          model: response.model,
          usage: {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          },
          conversationId: conversationId || response.id,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Chat error:', error);
        throw new Error(`Failed to process chat request: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },
};