export const typeDefs = `
  type Query {
    health: String!
  }

  type Mutation {
    chat(input: ChatInput!): ChatResponse!
  }

  input ChatInput {
    message: String!
    model: String = "deepseek-chat"
    temperature: Float = 0.7
    maxTokens: Int = 2000
    conversationId: String
  }

  type ChatResponse {
    id: String!
    message: String!
    model: String!
    usage: Usage
    conversationId: String
    timestamp: String!
  }

  type Usage {
    promptTokens: Int!
    completionTokens: Int!
    totalTokens: Int!
  }

  type Message {
    role: String!
    content: String!
  }
`;