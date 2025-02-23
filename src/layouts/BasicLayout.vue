<!-- BasicLayout -->
<template>
  <div id="basicLayout">
    <a-layout style="min-height: 100vh">
      <a-layout-header class="header">
        <GlobalHeader :isLoggedIn="isLoggedIn" @showModal="openModal" @Logout="logout"/>
      </a-layout-header>
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
      <a-layout-footer class="footer">
        <a href="https://github.com/iyohuang">made by yohuang</a>
      </a-layout-footer>
    </a-layout>

    <!-- 登录/注册弹框 -->
    <a-modal v-model:open="isModalVisible" @cancel="closeModal" @ok="closeModal" title="登录/注册" :footer="[]">
      <!-- 根据 modalType 来选择渲染登录还是注册表单 -->
      <LoginForm v-if="modalType === 'login'" @switchToRegister="switchToRegister" @loginSuccess="handleLoginSuccess"/>
      <RegisterForm v-if="modalType === 'register'" @switchToLogin="switchToLogin" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import GlobalHeader from './GlobalHeader.vue';
import LoginForm from '@/views/LoginForm.vue';
import RegisterForm from '@/views/RegisterForm.vue';
import {userInfoService} from '@/api/user.js'
import useUserInfoStore from '@/store/userInfo.js'
import {useTokenStore} from '@/store/token.js'

const tokenStore = useTokenStore();
const userInfoStore = useUserInfoStore();
const getUserInfo = async()=>{
    //调用接口
    let result = await userInfoService();
    //数据存储到pinia中
    userInfoStore.setInfo(result.data);
}

// 控制弹框的显示与隐藏
const isModalVisible = ref(false);

// 控制弹框是登录页面还是注册页面
const modalType = ref<'login' | 'register'>('login');

// 打开弹框并设置页面类型
const openModal = (type: 'login' | 'register') => {
  modalType.value = type;
  isModalVisible.value = true;  // 显示弹框
};


// 切换到注册页面
const switchToRegister = () => {
  modalType.value = 'register';
};

// 切换到登录页面
const switchToLogin = () => {
  modalType.value = 'login';
};

// 关闭弹框
const closeModal = () => {
  isModalVisible.value = false;
};

// 登录状态控制
const isLoggedIn = ref(false); // 用户是否登录

// 页面加载时，判断 token 是否存在
onMounted(() => {
  // 如果 token 存在，则表示已登录
  isLoggedIn.value = !!tokenStore.token;
});

// 登录成功后，隐藏弹框并更新登录状态
const handleLoginSuccess = () => {
  closeModal();
  isLoggedIn.value = true;
  getUserInfo();
};

// 登出
const logout = () => {
  isLoggedIn.value = false;
  tokenStore.removeToken();
  userInfoStore.removeInfo();
};
</script>

<style scoped>
#basicLayout .header {
  position: fixed;
  z-index: 100;
  width: 100%;
  background-color: #fff;
}

#basicLayout .content {
  padding: 70px;
  background: linear-gradient(to right, #fefefe, #fff);
}

#basicLayout .footer {
  padding: 30px;
  text-align: center;
  background-color: #efefef;
}
</style>