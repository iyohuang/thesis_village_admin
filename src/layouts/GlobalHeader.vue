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
          <a-popover v-if="props.isLoggedIn" trigger="hover" title="用户菜单" placement="bottomRight"
            :overlayClassName="'user-menu-popover'">
            <template #content>
              <a-menu class="user-menu">
                <a-menu-item key="profile" @click="goToProfile">
                  <template #icon>
                    <UserOutlined />
                  </template>
                  个人中心
                </a-menu-item>

                <!-- 管理员专属菜单 -->
                <a-menu-item v-if="isAdmin" key="admin" @click="goToAdmin" class="admin-menu-item">
                  <template #icon>
                    <SafetyOutlined />
                  </template>
                  权限管理
                </a-menu-item>

                <a-menu-divider v-if="isAdmin" />

                <a-menu-item key="logout" @click="logout" danger class="logout-item">
                  <template #icon>
                    <LogoutOutlined />
                  </template>
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>

            <a-avatar :src="avatarUrl" size="large" class="header-avatar" :class="{ 'admin-badge': isAdmin }" />
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

const isAdmin = computed(() => {
  return ['admin', 'superadmin'].includes(userInfoStore.info.roleType?.toLowerCase());
});

const goToAdmin = () => {
  router.push('/manage');
  hide();
};
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
    key: '/aichat',
    label: '智问',
  },
  {
    key: '/collectlaunch',
    label: '文件收集',
  },
  {
    key: '/user/collectlaunch',
    label: '上交文件',
  },
  {
    key: '/email',
    label: '邮箱',
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

.user-menu {
  min-width: 150px;
  border-radius: 6px;

  .ant-menu-item {
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .admin-menu-item {
    background: #f0f5ff;
    color: #2f54eb;
  }

  .logout-item {
    margin-top: 4px;
  }
}

.header-avatar {
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.1);
  }

  &.admin-badge::after {
    content: "";
    position: absolute;
    right: -4px;
    bottom: -4px;
    width: 12px;
    height: 12px;
    background: #52c41a;
    border-radius: 50%;
    border: 2px solid white;
  }
}

#globalheader {
  position: sticky;
  /* 渐进增强方案 */
  top: 0;
  transition: all 0.3s;
}
</style>