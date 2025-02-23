<!-- GlobalHeader -->
<template>
  <div id="globalheader">
    <a-row>
      <a-col flex="100px">
        <router-link to="/">
          <div class="title-bar">
            <img class="logo" src="../assets/Anya-PNG-Image.png" alt="logo" />
            <div class="title">煌治</div>
          </div>
        </router-link>
      </a-col>
      <a-col flex="auto">
        <a-menu v-model:selectedKeys="current" mode="horizontal" :items="items" @select="handleMenuSelect" />
      </a-col>
      <a-col flex="140px">
        <div class="user-login-status">
          <!-- 如果已登录，显示头像 -->
          <a-popover v-if="isLoggedIn" trigger="hover" title="用户菜单" placement="bottom"
            :overlayClassName='user - menu - popover'>
            <template #content>
              <a-menu class="user-menu">
                <a-menu-item key="profile" @click="goToProfile">
                  <user-outlined />
                  个人中心
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout" @click="logout" danger>
                  <logout-outlined />
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
            <a-avatar :src="avatarUrl" size="large" @click="showUserProfile"></a-avatar>
          </a-popover>

          <!-- 如果没有登录，显示登录和注册按钮 -->
          <div v-else>
            <a-button type="primary" @click="showLogin">登录</a-button>
            <a-button @click="showRegister" style="margin-left: 10px;">注册</a-button>
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { defineEmits, ref, defineProps, computed } from 'vue';
import { useRouter } from 'vue-router';
import useUserInfoStore from "@/store/userInfo.js";
const visible = ref<boolean>(false);
const router = useRouter();
// 获取头像
const userInfoStore = useUserInfoStore();
const avatarUrl = computed(() => userInfoStore.info.avatar || "/api/uploads/avatars/default.jpg");
const hide = () => {
  visible.value = false;
};
const emit = defineEmits();
const props = defineProps({
  isLoggedIn: Boolean,  // 接收来自父组件的登录状态
});
// 当前菜单选中的值

const current = ref<string[]>([]);
router.afterEach((to, from, next) => {
  current.value = [to.path];
});
const items = ref([
  {
    key: '/',
    label: '主页',
  },
  {
    key: '/qa',
    label: '问答',
  },
  {
    key: '/others',
    label: '其它',
  },
]);

// 跳转逻辑处理
const handleMenuSelect = ({ key }: { key: string }) => {
  // 更新当前选中的菜单项
  current.value = [key];
  router.push(key); // 跳转到对应路由
};


// 显示登录弹框
const showLogin = () => {
  emit('showModal', 'login');
};

//退出登录
const logout = () => {
  emit('Logout');
}

// 显示注册弹框
const showRegister = () => {
  emit('showModal', 'register');
};

// 跳转到个人信息页
const goToProfile = () => {
  router.push('/user/profile');
  hide(); // 关闭弹出菜单
};

</script>

<style scoped>
#globalheader .title-bar {
  display: flex;
  align-items: center;
}

.title {
  font-size: 15px;
  color: black;
  margin-left: 3px;
}

.logo {
  width: 50px;
  height: 50px;
}

.user-menu {
  width: 120px;
  border: none;
}

.user-menu-popover .ant-popover-inner-content {
  padding: 0
}
</style>