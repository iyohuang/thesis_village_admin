<!-- LoginForm -->
<template>
  <a-form :model="LoginFormState" :labelCol="{ span: 6 }" :wrapperCol="{ span: 14 }" class="form-container"
    @submit.prevent="handleLogin">
    <a-form-item label="账号">
      <a-input v-model:value="LoginFormState.username" placeholder="请输入账号" />
    </a-form-item>
    <a-form-item label="密码">
      <a-input-password v-model:value="LoginFormState.password" placeholder="请输入密码" />
    </a-form-item>
    <a-form-item>
      <a-button type="primary" html-type="submit">登录</a-button>
      <a-button @click="switchToRegister" style="margin-left: 10px">去注册</a-button>
    </a-form-item>
  </a-form>
</template>

<script setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import {useTokenStore} from '@/store/token.js'
// import {useUserInfoStore} from '@/store/userInfo.js'
import {userLoginService} from '@/api/user.js'
// const username = ref('');
// const password = ref('');
const tokenStore = useTokenStore();
const LoginFormState = ref({
  username: '',
  password: ''
});


const handleLogin = async () => {
  if (!LoginFormState.value.username || !LoginFormState.value.password) {
    message.error('账号和密码不能为空');
    return;
  }

  try {
    let response = await userLoginService(LoginFormState.value);

    if (response.code === 200) {
      // localStorage.setItem('auth_token', response.data.token);
      message.success('登录成功');
      tokenStore.setToken(response.data);
      emit('loginSuccess');
      // 例如跳转页面: window.location.href = '/dashboard';
    } else {
      message.error('登录失败：' + response.message);
      // const tokenStore = useTokenStore();
      // const userInfoStore = useUserInfoStore();
      // tokenStore.removeToken();
      // userInfoStore.removeInfo();
    } 
  } catch (error) {
    console.error('登录请求出错', error);
    message.error('请求失败，请稍后重试');
  }
};

const emit = defineEmits(['switchToRegister']);
const switchToRegister = () => {
  emit('switchToRegister');
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
