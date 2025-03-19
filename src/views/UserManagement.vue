<template>
  <a-card title="用户管理">
    <div class="search-bar" style="margin-bottom: 16px">
      <a-input-search v-model:value="filters.username" placeholder="输入用户名搜索" @search="fetchUsers"
        style="width: 300px" />
    </div>
    <a-spin :spinning="loading">
      <a-table :dataSource="users" :columns="columns" :pagination="pagination" @change="handleTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'permissions'">
            <div>
              <strong>管理他人权限：</strong>
              {{ formatPermissions(record.permissions.manageOthers) }}
            </div>
            <div>
              <strong>管理自己权限：</strong>
              {{ formatPermissions(record.permissions.manageSelf) }}
            </div>
          </template>

          <template v-if="column.key === 'actions'">
            <a-space>
              <!-- 超级管理员专属操作 -->
              <template v-if="currentUser.role === 'superadmin'">
                <a-button v-if="record.role === 'admin'" @click="handleRevokeAdmin(record)">
                  撤回管理员
                </a-button>
                <a-button v-if="record.role === 'user'" type="primary" @click="handleUpgradeAdmin(record)">
                  升级管理员
                </a-button>
              </template>

              <!-- 管理员权限编辑 -->
              <template
                v-if="(currentUser.role === 'superadmin' && record.id !== currentUser.id) || (currentUser.role === 'admin' && record.role === 'user')">
                <a-button @click="showPermissionModal(record)">编辑权限</a-button>
              </template>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-spin>

    <!-- 权限编辑弹窗 -->
    <a-modal v-model:visible="permissionModalVisible" title="编辑权限" @ok="handlePermissionUpdate">
      <a-form layout="vertical">
        <a-form-item label="管理他人权限">
          <a-checkbox-group v-model:value="editingPermissions.manageOthers">
            <a-checkbox value="moment:delete">不能乱删动态</a-checkbox>
            <a-checkbox value="aq:delete">不能乱删问题</a-checkbox>
            <a-checkbox value="file:delete">不能乱删收集任务</a-checkbox>
          </a-checkbox-group>
        </a-form-item>

        <a-form-item label="管理自己权限">
          <a-checkbox-group v-model:value="editingPermissions.manageSelf">
            <a-checkbox value="moment:disablepost">不准发动态</a-checkbox>
            <a-checkbox value="aq:disablepost">不准提问题</a-checkbox>
            <a-checkbox value="file:disablepost">不准收文件</a-checkbox>
            <a-checkbox value="email:disablepost">不准发邮箱</a-checkbox>
          </a-checkbox-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import { userPermissionListService, updateUserPermissionService, updateUserRoleService } from '@/api/user'
import useUserInfoStore from '@/store/userInfo.js'
const userInfoStore = useUserInfoStore();
const userId = userInfoStore.info.id
const role = userInfoStore.info.roleType

const currentUser = reactive({
  role: role,
  id: userId
});
const filters = reactive({
  role: null,
  username: '' // 新增用户名搜索条件
});
const loading = ref(false);
const users = ref([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  pageSizeOptions: ['10', '20', '50'],
  showTotal: total => `共 ${total} 条`,

});

// 权限编辑相关状态
const permissionModalVisible = ref(false);
const editingUser = ref(null);
const editingPermissions = reactive({
  manageOthers: [],
  manageSelf: []
});

const permissionMap = {
  // 管理他人权限
  'moment:delete': '不能乱删动态',
  'aq:delete': '不能乱删问题',
  'file:delete': '不能乱删收集任务',

  // 管理自己权限
  'moment:disablepost': '不准发动态',
  'aq:disablepost': '不准提问题',
  'file:disablepost': '不准收文件',
  'email:disablepost': '不准发邮箱'
};

const handleUpgradeAdmin = async (user) => {
  try {
    await updateUserRoleService(user.id, 'admin');
    user.role = 'admin';
    message.success('已成功升级为管理员');
    fetchUsers(); // 刷新列表
  } catch (error) {
    message.error('操作失败: ' + error.message);
  }
};

// 撤回管理员权限
const handleRevokeAdmin = async (user) => {
  try {
    await updateUserRoleService(user.id, 'user');
    user.role = 'user';
    message.success('已成功撤回管理员权限');
    fetchUsers(); // 刷新列表
  } catch (error) {
    message.error('操作失败: ' + error.message);
  }
};

const columns = computed(() => [
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username'
  },
  {
    title: '角色',
    dataIndex: 'role',
    key: 'role',
    filters: currentUser.role === 'superadmin'
      ? [
        { text: '用户', value: 'user' },
        { text: '管理员', value: 'admin' }
      ]
      : [
        { text: '用户', value: 'user' } // 管理员只能看到用户过滤
      ],
    onFilter: (value, record) => record.role === value
  },
  {
    title: '权限',
    key: 'permissions'
  },
  {
    title: '操作',
    key: 'actions',
    width: '200px'
  }
]);

// 格式化权限显示
const formatPermissions = (permissions) => {
  return permissions
    .map(p => permissionMap[p] || p)  // 进行中文转换
    .join(', ');
};

// 显示权限编辑弹窗
const showPermissionModal = (user) => {
  editingUser.value = user;
  editingPermissions.manageOthers = [...user.permissions.manageOthers];
  editingPermissions.manageSelf = [...user.permissions.manageSelf];
  permissionModalVisible.value = true;
};

// 处理权限更新
const handlePermissionUpdate = async () => {
  try {

    const payload = {
      manageOthers: editingPermissions.manageOthers,
      manageSelf: editingPermissions.manageSelf
    };
    await updateUserPermissionService(editingUser.value.id, {
      manageOthers: editingPermissions.manageOthers,
      manageSelf: editingPermissions.manageSelf
    });
    Object.assign(editingUser.value.permissions, editingPermissions);
    message.success('权限更新成功');
    permissionModalVisible.value = false;
  } catch (error) {
    message.error('权限更新失败');
  }
};

// 处理角色变更
const handleRoleChange = async (user, newRole) => {
  try {
    user.role = newRole;
    message.success('角色更新成功');
  } catch (error) {
    message.error('角色更新失败');
  }
};

// 分页处理
// const handleTableChange = (pag, filters) => {
//   pagination.current = pag.current;
//   pagination.pageSize = pag.pageSize;

//   // 同步角色筛选状态
//   if (filters.role) {
//     filters.role = filters.role[0] || null;
//     // if(filters.role.length == 2) filters.role = null
//   }
//   Object.assign(filters, filters);

//   fetchUsers();
// };

const handleTableChange = (pag, { role }) => {
  // 更新分页参数
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  
  // 正确获取角色过滤值
  filters.role = role?.[0] || null // 取数组第一个元素
  if(role.length == 2) filters.role = null // 如果数组长度为2,则清空角色过滤值
  // 触发数据请求
  fetchUsers();
};

// 获取用户数据（示例）
const fetchUsers = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.current,
      size: pagination.pageSize,
      role: filters.role,
      username: filters.username || null
    };

    const res = await userPermissionListService(params);
    users.value = res.data.list;
    pagination.total = res.data.total;
    pagination.current = res.data.pageNum || 1;
    pagination.pageSize = res.data.pageSize || 10;
  } finally {
    loading.value = false;
  }
};

// 初始化获取数据
onMounted(() => {
  fetchUsers();
})
</script>