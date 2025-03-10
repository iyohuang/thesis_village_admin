<template>
  <a-layout class="chat-layout">
    <!-- 左侧导航 -->
    <a-layout-sider width="240" theme="light" class="left-sider" :style="{ overflow: 'auto' }">
      <div class="sidebar-header">
        <a-button type="primary" block @click="handleNewChat" class="new-chat-btn">
          <template #icon><plus-outlined /></template>
          新建对话
        </a-button>
      </div>

      <a-menu v-model:selectedKeys="selectedSessionId" mode="inline" @select="handleSessionSelect">
        <a-menu-item v-for="session in filteredSessions" :key="session.id" @mouseenter="hoverSessionId = session.id"
          @mouseleave="hoverSessionId = null">
          <template #icon>
            <component :is=getRoleIcon(session.roleId) />
          </template>
          {{ truncateTitle(session.title) }}
          <a-button v-show="hoverSessionId === session.id" type="link" danger class="delete-btn"
            @click.stop="handleSoftDelete(session.id)">
            删除
          </a-button>
          <!-- <span v-if="session.isDefault" class="default-tag">默认</span> -->
          <span class="update-time">{{ formatTime(session.updatedAt) }}</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <!-- 右侧聊天区 -->
    <a-layout-content class="right-content">
      <!-- <ChatWindow :role="currentRole" @new-chat="handleNewChat" /> -->
      <ChatWindow v-if="activeSession" :role="currentRole" :session="activeSession"
        @change-temp="handleConfirmSession" />
      <div v-else class="empty-chat">请选择或新建对话</div>
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { nanoid } from 'nanoid'
import {
  PlusOutlined,
  UserOutlined,
  RobotOutlined,
  BankOutlined,
  FileTextOutlined
} from '@ant-design/icons-vue'
import ChatWindow from './ChatWindow.vue'
import { ChatSession } from '@/types/aichat'
import { getSessions, createSession, deleteSession } from '@/api/aichat'
import { message, Modal } from 'ant-design-vue'
import useUserInfoStore from '@/store/userInfo.js'
import Title from 'ant-design-vue/es/typography/Title'
const userInfoStore = useUserInfoStore();
const userId = userInfoStore.info.id
const sessions = ref<ChatSession[]>([]);
const selectedSessionId = ref<string[]>([])
const isLoading = ref(false)
const hoverSessionId = ref<string | null>(null)
// 角色配置数据
const roles = ref([
  {
    id: 'default',
    name: '通用助手',
    icon: RobotOutlined,
    prompt: '你是一个通用AI助手',
    isDefault: true
  },
  {
    id: 'agriculture',
    name: '农业专家',
    icon: BankOutlined,
    prompt: '你是一名农业专家...'
  },
  {
    id: 'tax',
    name: '税务助手',
    icon: FileTextOutlined,
    prompt: '你负责处理税务问题...'
  }
])

const RoleTypeIcons = {
  default: RobotOutlined,
  agriculture: BankOutlined,
  tax: FileTextOutlined
  // 添加更多类型映射...
};

const selectedRole = ref(['default']) // 默认选中
const currentRole = ref(roles.value[0])
const tempSession = ref<ChatSession | null>(null) // 临时会话
const hasContentCache = new Set<string>()
// const handleRoleSelect = ({ key }) => {
//   currentRole.value = roles.value.find(r => r.id === key)
//   // 触发对话重置逻辑（通过ChatWindow处理）
// }

// 计算当前会话的完整信息
// const currentSession = computed(() => {
//   return sessions.value.find(s => s.id === selectedSessionId.value)
// })

const filteredSessions = computed(() =>{
  return sessions.value.filter(session => !session.isDeleted)
})

const handleSessionSelect = async ({ key }) => {
  try {
    isLoading.value = true
    selectedSessionId.value = [key]

    // 加载新会话的消息
    // const session = sessions.value.find(s => s.id === key)
    // if (session) {
    //   // 这里需要实现获取消息的API调用
    //   // const res = await getMessages(key)
    //   // messages.value = res.data
    // }
  } catch (error) {
    message.error('加载会话失败')
  } finally {
    isLoading.value = false
  }
}

// 获取当前激活的会话
const activeSession = computed(() => {
  return sessions.value.find(s => s.id === selectedSessionId.value[0])
})

const truncateTitle = (title: string) => {
  // 处理空值情况
  if (!title) return '无标题'

  // 截取前4个字符（中文英文均适用）
  return title.length > 4 ? `${title.substring(0, 4)}...` : title
}


// const handleNewChat = () => {
//   const newid = nanoid()
//   console.log(newid)
//   currentRole.value = roles.value.find(r => r.isDefault)
//   selectedRole.value = [currentRole.value.id]
// }

const handleSoftDelete = async (sessionId: string) => {
  Modal.confirm({
    title: '确认删除对话？',
    content: '删除后不可恢复',
    onOk() {
      // 1. 标记删除状态
      sessions.value = sessions.value.map(s =>
        s.id === sessionId ? { ...s, isDeleted: true } : s
      )

      // 2. 清除选中状态
      if (selectedSessionId.value.includes(sessionId)) {
        selectedSessionId.value = []
      }

      // 3. 发送请求
      deleteSession(sessionId);
    }
  })
}

const handleNewChat = () => {
  // 如果已有临时会话且未保存内容
  if (tempSession.value && !hasContentCache.has(tempSession.value.id)) {
    message.warning('请先完成当前新对话')
    return
  }

  // 创建临时会话（不立即保存到后端）
  const newSession: ChatSession = {
    id: nanoid(),
    // roleId: roles.value.find(r => r.isDefault)!.id,
    roleId: 'default',
    title: '新对话',
    updatedAt: new Date(),
    isTemp: true // 标记为临时会话
  }

  // 更新状态
  tempSession.value = newSession
  selectedSessionId.value = [newSession.id]

  // 插入到会话列表最前面（临时展示）
  sessions.value.unshift(newSession)
}


const handleConfirmSession = async (sessionId: string, newtitle: string) => {

  console.log('handleConfirmSession', sessionId)
  try {
    // 检查是否临时会话
    const session = sessions.value.find(s => s.id === sessionId)
    if (!session?.isTemp) return

    // 执行实际创建
    const { data } = await createSession({
      id: sessionId,
      roleId: 'default',
      userId: userId,
      title: newtitle
    })

    // 更新会话状态
    const index = sessions.value.findIndex(s => s.id === sessionId)
    if (index > -1) {
      sessions.value[index] = {
        ...data,
        isTemp: false
      }
    }

    hasContentCache.add(sessionId)
    tempSession.value = null
  } catch (error) {
    message.error('会话创建失败')
    // 回滚临时会话
    sessions.value = sessions.value.filter(s => s.id !== sessionId)
    selectedSessionId.value = sessions.value[0]?.id ? [sessions.value[0].id] : []
  }
}


const getRoleIcon = (roleId: string) => {
  return RoleTypeIcons[roleId] || UserOutlined;
}

// 格式化时间
const formatTime = (time: Date) => {
  return new Date(time).toLocaleString();
};

const loadSessions = async () => {
  try {
    const { data } = await getSessions(userId)
    sessions.value = data.map(s => ({
      ...s,
      updatedAt: new Date(s.updatedAt)
    }))

    if (sessions.value.length > 0) {
      selectedSessionId.value = [sessions.value[0].id]
      // console.log("sessions", sessions.value);
    }
  } catch (error) {
    message.error('加载会话列表失败')
  }
}

onMounted(() => {
  loadSessions()
})

</script>

<style scoped>
.chat-layout {
  height: 100vh;
}

.left-sider {
  border-right: 1px solid #f0f0f0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.new-chat-btn {
  margin-bottom: 12px;
}

.default-tag {
  margin-left: 8px;
  font-size: 12px;
  color: #666;
  background: #fafafa;
  padding: 2px 6px;
  border-radius: 4px;
}

.right-content {
  background: #fff;
  padding: 24px;
}
</style>