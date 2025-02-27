<template>
  <div class="chat-window">
    <!-- 当前角色标题 -->
    <div class="role-header">
      <component :is="role.icon" class="role-icon" />
      <span class="role-title">{{ role.name }}</span>
    </div>

    <!-- 消息列表 -->
    <div class="message-container">
      <div v-for="(msg, index) in messages" :key="index" :class="['message-bubble', msg.role]">
        <div class="message-avatar">
          <component :is="msg.role === 'user' ? UserOutlined : RobotOutlined" />
        </div>
        <a-card class="message-card">
          <div class="message-content">{{ msg.content }}</div>
        </a-card>
      </div>
      <a-spin v-if="isLoading" class="loading-spinner" />
    </div>

    <!-- 输入区 -->
    <div class="input-area">
      <a-input-group compact>
        <a-textarea v-model:value="inputMessage" placeholder="输入消息..." :auto-size="{ minRows: 2, maxRows: 6 }"
          @pressEnter="sendMessage" />
        <a-button type="primary" @click="sendMessage" :loading="isLoading" class="send-btn">
          <send-outlined />
        </a-button>
      </a-input-group>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, reactive } from 'vue'
import {
  UserOutlined,
  RobotOutlined,
  SendOutlined
} from '@ant-design/icons-vue'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { useTokenStore } from '@/store/token.js'
import { message } from 'ant-design-vue'
import { testchat } from '@/api/aichat'
const tokenStore = useTokenStore();
const props = defineProps({
  role: {
    type: Object,
    required: true
  }
})

// 消息列表与发送逻辑（与之前实现类似）
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
let eventSource = ref([]);
//-------------test
// 建立 SSE 连接
onMounted(() => {
  //
  // eventSource = new EventSourcePolyfill('api/ai/chat-stream', {
  //   headers: {
  //     'Content-Type': 'application/json',
  //     "Authorization": tokenStore.token,
  //     'Cache-Control': 'no-cache',
  //     'Connection': 'keep-alive',
  //     'Access-Control-Allow-Origin': '*',
  //   },
  // })
  // eventSource.onopen = (event) => {
  //   console.log("连接成功", event);
  // };
  // eventSource.addEventListener('message', (e) => {
  //   console.log("接收到消息", e.data);
  //   // messages.value.push(e.data);
  // });

  // 监听默认的 'message' 事件
  // eventSource.onmessage = (event) => {
  //   // console.log('Message event:', event.data);
  // };

  //  eventSource.addEventListener('chat', (e) => {
  //   console.log("接收到消息", e.data);
  //   messages.value.push(e.data);
  // });


  // eventSource.onerror = (err) => {
  //   console.error('SSE Error:', err);
  //   eventSource.close();
  // };
});

// 发送消息（模拟用户输入）
const sendMessage = async () => {
  if (!inputMessage.value.trim()) {
    return;
  }
  // 关闭旧连接
  if (eventSource) {
    eventSource = null;
  }

  eventSource = new EventSourcePolyfill(`api/ai/chat?q=${encodeURIComponent(inputMessage.value)}`, {
    headers: {
      "Authorization": tokenStore.token,
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no'
    },
  })
  console.log("发送消息:", inputMessage.value);

  messages.value.push({
    role: 'user',
    content: inputMessage.value.trim()
  })

  inputMessage.value = '';

  const aiMsg = reactive({
    role: 'assistant',
    content: ''
  })
  messages.value.push(aiMsg);

  eventSource.onmessage = (event) => {
    console.log('Message event:', event.data);
    // messages.value.push(event.data);
    aiMsg.content += event.data
  };

  eventSource.onopen = (event) => {
    console.log("连接成功", event);
  };

  // 清理连接
  onBeforeUnmount(() => {
    eventSource.close();
  });

  eventSource.onerror = (err) => {
    console.error('SSE Error:', err);
    eventSource.close();
  };

  eventSource.addEventListener('done', () => {
    isLoading.value = false
  })
};

const handleSend = async () => {
  // 发送逻辑（调用API）
}

// 角色变化时重置对话
watch(() => props.role, () => {
  messages.value = []
})
</script>

<style scoped>
.chat-window {
  max-width: 800px;
  margin: 0 auto;
  height: 90%;
  display: flex;
  flex-direction: column;
}

.role-header {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
}

.role-icon {
  font-size: 24px;
  color: #1890ff;
}

.message-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.message-bubble {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.message-bubble.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-card {
  max-width: 70%;
  border-radius: 12px;
}

.user .message-card {
  background: #e6f4ff;
  border-color: #91caff;
}

.assistant .message-card {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.input-area :deep(.ant-input) {
  border-radius: 8px 0 0 8px;
}

.send-btn {
  width: 64px;
  height: auto;
  border-radius: 0 8px 8px 0;
}
</style>