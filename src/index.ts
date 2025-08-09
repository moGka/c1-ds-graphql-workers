import { createYoga } from 'graphql-yoga';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

const yoga = createYoga({
  schema: {
    typeDefs,
    resolvers,
  },
  graphiql: true, // 启用GraphiQL界面用于测试
  cors: {
    origin: '*', // 生产环境中应该设置为具体的域名
    methods: ['POST', 'GET', 'OPTIONS'],
  },
  context: ({ request, env }) => ({
    request,
    env,
  }),
});

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    try {
      // 处理 CORS 预检请求
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }

      return await yoga.fetch(request, env, ctx);
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }
  },
};