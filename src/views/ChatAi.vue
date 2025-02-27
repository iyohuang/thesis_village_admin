<template>
    <a-layout class="chat-layout">
      <!-- 左侧导航 -->
      <a-layout-sider
        width="240"
        theme="light"
        class="left-sider"
        :style="{ overflow: 'auto' }"
      >
        <div class="sidebar-header">
          <a-button 
            type="primary" 
            block 
            @click="handleNewChat"
            class="new-chat-btn"
          >
            <template #icon><plus-outlined /></template>
            新建对话
          </a-button>
        </div>
  
        <a-menu
          v-model:selectedKeys="selectedRole"
          mode="inline"
          @select="handleRoleSelect"
        >
          <a-menu-item v-for="role in roles" :key="role.id">
            <template #icon>
              <component :is="role.icon" />
            </template>
            {{ role.name }}
            <span v-if="role.isDefault" class="default-tag">默认</span>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>
  
      <!-- 右侧聊天区 -->
      <a-layout-content class="right-content">
        <ChatWindow :role="currentRole" @new-chat="handleNewChat" />
      </a-layout-content>
    </a-layout>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { 
    PlusOutlined,
    UserOutlined,
    RobotOutlined,
    BankOutlined,
    FileTextOutlined 
  } from '@ant-design/icons-vue'
  import ChatWindow from './ChatWindow.vue'
  
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
  
  const selectedRole = ref(['default']) // 默认选中
  const currentRole = ref(roles.value[0])
  
  const handleRoleSelect = ({ key }) => {
    currentRole.value = roles.value.find(r => r.id === key)
    // 触发对话重置逻辑（通过ChatWindow处理）
  }
  
  const handleNewChat = () => {
    currentRole.value = roles.value.find(r => r.isDefault)
    selectedRole.value = [currentRole.value.id]
  }
  </script>
  
  <style scoped>
  .chat-layout {
    height: 100vh;
  }
  
  .left-sider {
    border-right: 1px solid #f0f0f0;
    box-shadow: 2px 0 8px rgba(0,0,0,0.05);
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