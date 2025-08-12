// Cloudflare Workers 主入口文件
// 使用 GraphQL Yoga 创建 GraphQL 服务器，集成 DeepSeek API

import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from 'graphql-tools';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

// 构建可执行的 GraphQL Schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// 创建 GraphQL Yoga 实例
const yoga = createYoga({
  schema,      // GraphQL Schema
  // 启用 GraphQL Playground (开发环境)
  graphqlEndpoint: '/',
  cors: false
});

// CORS 头部配置 - 允许前端跨域访问
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',                    // 允许所有域名
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // 允许的HTTP方法
  'Access-Control-Allow-Headers': 'Content-Type, Authorization', // 允许的请求头
  'Access-Control-Max-Age': '86400',                     // 预检请求缓存时间（24小时）
};

// Cloudflare Workers 导出对象
export default {
  /**
   * Workers 主处理函数
   * @param request - HTTP 请求对象
   * @param env - 环境变量对象（包含 DeepSeek API 密钥等）
   * @param ctx - 执行上下文
   */
  async fetch(request: Request, env: any, _ctx: ExecutionContext): Promise<Response> {
    try {
      // 记录请求信息（用于调试）
      console.log(`收到请求: ${request.method} ${request.url}`);

      // 处理 CORS 预检请求 (OPTIONS)
      // 浏览器在发送跨域请求前会先发送预检请求
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: corsHeaders,
        });
      }

      // 环境变量验证
      if (!env.DEEPSEEK_API_KEY) {
        console.error('缺少必需的环境变量: DEEPSEEK_API_KEY');
        return new Response(
          JSON.stringify({ 
            error: '服务配置错误',
            message: 'DeepSeek API 密钥未配置，请联系管理员'
          }), 
          { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            }
          }
        );
      }

      // 创建带有环境变量的上下文处理函数
      const handleRequest = async (req: Request) => {
        // 创建新的 GraphQL 上下文，包含环境变量
        const contextValue = { env };
        
        // 调用 GraphQL Yoga
        return await yoga.fetch(req, contextValue);
      };

      // 处理请求
      const response = await handleRequest(request);
      
      // 为响应添加 CORS 头部
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers),
          ...corsHeaders,
        },
      });

      return newResponse;

    } catch (error) {
      // 全局错误处理
      console.error('Workers 处理错误:', {
        error: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
        url: request.url,
        method: request.method,
      });

      return new Response(
        JSON.stringify({ 
          error: '服务器内部错误',
          message: '处理请求时发生错误，请稍后重试',
          // 显示详细错误信息（Workers 开发环境）
          details: error instanceof Error ? error.message : '未知错误'
        }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }
  },

  /**
   * Workers 定时任务处理函数（可选）
   * 可用于定期清理、健康检查等
   */
  async scheduled(_event: ScheduledEvent, _env: any, _ctx: ExecutionContext) {
    console.log('定时任务执行:', new Date().toISOString());
    
    // 这里可以添加定时任务逻辑，比如：
    // - 清理过期的对话历史
    // - 检查 DeepSeek API 状态
    // - 发送使用统计报告
  },
};