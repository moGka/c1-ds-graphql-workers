// GraphQL Schema 定义
// 定义了前端聊天机器人可以使用的 GraphQL 接口
export const typeDefs = `
  # 查询类型 - 用于只读操作
  type Query {
    # 健康检查接口，返回服务状态
    health: String!
    
    # 获取支持的模型列表（可选扩展功能）
    models: [String!]!
  }

  # 变更类型 - 用于写操作，如发送聊天消息
  type Mutation {
    # 聊天接口 - 发送消息并获取AI回复
    chat(input: ChatInput!): ChatResponse!
  }

  # 聊天输入参数
  input ChatInput {
    # 用户发送的消息内容（必需）
    message: String!
    
    # AI模型名称，默认使用 deepseek-chat
    model: String = "deepseek-chat"
    
    # 温度参数，控制回复的随机性（0-1）
    temperature: Float = 0.7
    
    # 最大token数量，控制回复长度
    maxTokens: Int = 2000
    
    # 对话ID，用于维持对话上下文（可选）
    conversationId: String
    
    # 系统提示词，用于设定AI角色（可选）
    systemPrompt: String
  }

  # 聊天响应结果
  type ChatResponse {
    # 响应ID
    id: String!
    
    # AI回复的消息内容
    message: String!
    
    # 使用的AI模型名称
    model: String!
    
    # token使用情况统计
    usage: Usage
    
    # 对话ID
    conversationId: String
    
    # 响应时间戳
    timestamp: String!
    
    # 完成原因（如：stop、length等）
    finishReason: String
  }

  # Token使用统计
  type Usage {
    # 输入使用的token数
    promptTokens: Int!
    
    # 输出生成的token数
    completionTokens: Int!
    
    # 总token数
    totalTokens: Int!
  }

  # 消息对象（用于对话历史）
  type Message {
    # 角色：user（用户）、assistant（AI助手）、system（系统）
    role: String!
    
    # 消息内容
    content: String!
  }
`;