<template>
  <a-form :model="RegisterFormState" @submit="handleRegister" :labelCol="{ span: 6 }" :wrapperCol="{ span: 14 }" class="form-container">
    <a-form-item label="账号">
      <a-input v-model:value="RegisterFormState.username" placeholder="请输入账号" />
    </a-form-item>
    <a-form-item label="密码">
      <a-input-password v-model:value="RegisterFormState.password" placeholder="请输入密码" />
    </a-form-item>
    <a-form-item label="确认密码">
      <a-input-password v-model:value="RegisterFormState.confirmPassword" placeholder="请确认密码" />
    </a-form-item>
    <a-form-item>
      <a-button type="primary" html-type="submit">
        注册
      </a-button>
      <a-button @click="switchToLogin" style="margin-left: 10px">
        去登录
      </a-button>
    </a-form-item>
  </a-form>
</template>

<script setup>
import { ref } from 'vue';
import { defineEmits } from 'vue';
import { message } from 'ant-design-vue';
import axios from 'axios';
import { userRegisterService } from '@/api/user.js'

// 定义表单数据
// const username = ref('');
// const password = ref('');
// const confirmPassword = ref('');
const RegisterFormState = ref({
  username: '',
  password: '',
  confirmPassword: ''
});
// 定义事件
const emit = defineEmits(['switchToLogin']);

// 注册提交处理
const handleRegister = async (event) => {
  event.preventDefault(); // 阻止表单默认提交

  // 校验表单
  if (!RegisterFormState.value.password || !RegisterFormState.value.password || !RegisterFormState.value.confirmPassword) {
    message.error('请完整填写注册信息');
    return;
  }

  if (RegisterFormState.value.password !== RegisterFormState.value.confirmPassword) {
    message.error('密码和确认密码不一致');
    return;
  }

  try {
    // 发送注册请求
    let response = await userRegisterService(RegisterFormState.value);

    // 处理返回结果
    if (response.code == '200') {
      message.success('注册成功，请前往登录');
      // 跳转到登录页面
      switchToLogin();
    } else {
      message.error(`注册失败：${response.message}`);
    }
  } catch (error) {
    console.error('注册请求失败', error);
    message.error('注册失败，请稍后重试');
  }
};

// 切换到登录页面
const switchToLogin = () => {
  emit('switchToLogin');
};
</script>

<style scoped>
.form-container {
  padding: 20px;
  min-height: 265px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>
