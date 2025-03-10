export interface ChatSession {
  id: string          // nanoid生成
  roleId: string      // 关联ai_roles.id
  title: string       // 会话标题
  updatedAt: Date     // 最后更新时间
  isDefault?: boolean // 用于默认会话
  isTemp?: boolean // 临时会话标记
  isDeleted?: boolean
}

export interface ChatMessage {
  id?: string
  sessionId: string   // 关联chat_sessions.id
  roleType: 'user' | 'assistant'
  content: string
  createdAt?: Date
}