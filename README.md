# DeepSeek GraphQL Workers

一个基于 Cloudflare Workers 的 GraphQL API 项目，用于访问 DeepSeek AI 模型，为聊天机器人应用提供后端接口。

## 特性

- 🚀 基于 Cloudflare Workers 的无服务器架构
- 📊 GraphQL API 接口，支持类型安全的查询
- 🤖 集成 DeepSeek AI 模型
- 🌐 内置 CORS 支持
- 🔧 TypeScript 开发，类型安全
- 📈 支持 GraphiQL 调试界面

## 项目结构

```
src/
├── index.ts       # Workers 入口文件
├── schema.ts      # GraphQL Schema 定义
├── resolvers.ts   # GraphQL Resolvers
└── deepseek.ts    # DeepSeek API 集成
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制环境变量示例文件：

```bash
cp .env.example .dev.vars
```

在 `.dev.vars` 文件中填入你的 DeepSeek API Key：

```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

### 3. 本地开发

```bash
npm run dev
```

服务将在 `http://localhost:8787` 启动，你可以访问 GraphiQL 界面进行测试。

### 4. 部署到 Cloudflare Workers

首先确保你已经登录 Wrangler CLI：

```bash
wrangler login
```

设置生产环境的 Secrets：

```bash
wrangler secret put DEEPSEEK_API_KEY
# 输入你的 DeepSeek API Key

wrangler secret put DEEPSEEK_API_URL
# 输入 https://api.deepseek.com/v1
```

部署项目：

```bash
npm run deploy
```

## API 使用

### GraphQL Endpoint

- **URL**: `https://your-worker.your-subdomain.workers.dev/graphql`
- **方法**: POST
- **Content-Type**: application/json

### 查询示例

#### 健康检查

```graphql
query {
  health
}
```

#### 聊天对话

```graphql
mutation {
  chat(input: {
    message: "你好，请介绍一下自己"
    model: "deepseek-chat"
    temperature: 0.7
    maxTokens: 2000
  }) {
    id
    message
    model
    usage {
      promptTokens
      completionTokens
      totalTokens
    }
    conversationId
    timestamp
  }
}
```

### REST API 调用示例

使用 curl 调用：

```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { chat(input: { message: \"你好\" }) { message } }"
  }'
```

使用 JavaScript Fetch：

```javascript
const response = await fetch('https://your-worker.your-subdomain.workers.dev/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: `
      mutation Chat($input: ChatInput!) {
        chat(input: $input) {
          id
          message
          model
          usage {
            promptTokens
            completionTokens
            totalTokens
          }
          timestamp
        }
      }
    `,
    variables: {
      input: {
        message: "你好，请介绍一下自己",
        temperature: 0.7,
        maxTokens: 2000
      }
    }
  }),
});

const result = await response.json();
console.log(result.data.chat);
```

## GraphQL Schema

### 输入类型

```graphql
input ChatInput {
  message: String!           # 用户消息
  model: String = "deepseek-chat"  # AI模型名称
  temperature: Float = 0.7   # 温度参数 (0.0-1.0)
  maxTokens: Int = 2000      # 最大生成token数
  conversationId: String     # 对话ID (可选)
}
```

### 返回类型

```graphql
type ChatResponse {
  id: String!              # 响应ID
  message: String!         # AI回复内容
  model: String!           # 使用的模型
  usage: Usage            # Token使用情况
  conversationId: String  # 对话ID
  timestamp: String!      # 时间戳
}

type Usage {
  promptTokens: Int!      # 输入token数
  completionTokens: Int!  # 输出token数
  totalTokens: Int!       # 总token数
}
```

## 配置说明

### 环境变量

| 变量名 | 描述 | 必填 | 默认值 |
|--------|------|------|--------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | ✅ | - |
| `DEEPSEEK_API_URL` | DeepSeek API 基础URL | ❌ | `https://api.deepseek.com/v1` |

### 支持的模型

- `deepseek-chat` - DeepSeek 聊天模型
- `deepseek-coder` - DeepSeek 代码模型

## 开发

### 本地测试

```bash
npm test
```

### 代码检查

```bash
npm run lint
```

### 构建

```bash
npm run build
```

## 集成到前端项目

这个 API 可以轻松集成到各种前端框架中：

### React 示例

```jsx
import { useState } from 'react';

function ChatBot() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://your-worker.your-subdomain.workers.dev/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation Chat($input: ChatInput!) {
              chat(input: $input) {
                message
                usage { totalTokens }
              }
            }
          `,
          variables: { input: { message } }
        }),
      });
      
      const result = await res.json();
      setResponse(result.data.chat.message);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="输入消息..."
      />
      <button onClick={sendMessage} disabled={loading}>
        {loading ? '发送中...' : '发送'}
      </button>
      <div>{response}</div>
    </div>
  );
}
```

### Vue 示例

```vue
<template>
  <div>
    <input v-model="message" placeholder="输入消息..." />
    <button @click="sendMessage" :disabled="loading">
      {{ loading ? '发送中...' : '发送' }}
    </button>
    <div>{{ response }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const message = ref('')
const response = ref('')
const loading = ref(false)

const sendMessage = async () => {
  loading.value = true
  try {
    const res = await fetch('https://your-worker.your-subdomain.workers.dev/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation Chat($input: ChatInput!) {
            chat(input: $input) {
              message
              usage { totalTokens }
            }
          }
        `,
        variables: { input: { message: message.value } }
      }),
    })
    
    const result = await res.json()
    response.value = result.data.chat.message
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
}
</script>
```

## 安全注意事项

1. **API Key 安全**: 永远不要在客户端代码中暴露 DeepSeek API Key
2. **CORS 配置**: 生产环境中应该设置具体的允许域名，而不是使用 `*`
3. **速率限制**: 考虑实现 API 调用频率限制
4. **输入验证**: 对用户输入进行适当的验证和清理

## 故障排除

### 常见问题

1. **部署失败**: 检查 `wrangler.toml` 配置是否正确
2. **API Key 错误**: 确保已正确设置 `DEEPSEEK_API_KEY` Secret
3. **CORS 错误**: 检查前端域名是否在允许列表中
4. **超时错误**: DeepSeek API 响应时间较长时，可能需要调整 timeout 设置

### 调试技巧

1. 查看 Workers 日志：使用 `wrangler tail` 命令
2. 使用 GraphiQL 界面测试查询
3. 检查 Cloudflare Dashboard 中的错误报告

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

---

## 更新日志

### v1.0.0 (2024-12-XX)
- 初始版本发布
- 支持基本的聊天功能
- GraphQL API 接口
- Cloudflare Workers 部署支持