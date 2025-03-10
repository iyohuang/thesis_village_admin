<template>
  <div class="collect-container">
    <!-- 操作区 -->
    <div class="action-bar">
      <a-button type="primary" @click="handleCreate">新建收集任务</a-button>
    </div>

    <!-- 收集任务表格 -->
    <a-table :dataSource="collections" :columns="columns" :pagination="pagination" :rowKey="record => record.id">
      <!-- 状态标签 -->
      <template #status="{ text }">
        <a-tag :color="statusColorMap[text]">{{ text }}</a-tag>
      </template>

      <!-- 操作按钮 -->
      <template #action="{ record }">
        <a-button type="link" @click="handleEdit(record)">编辑</a-button>
        <a-popconfirm title="确定要删除这个收集任务吗？" @confirm="handleDelete(record.id)">
          <a-button type="link" danger>删除</a-button>
        </a-popconfirm>
      </template>

      <!-- 展开详情 -->
      <template #expandedRowRender="{ record }">
        <div class="task-detail">
          <a-descriptions bordered size="small">
            <a-descriptions-item label="已提交用户" :span="2">
              <a-tag v-for="user in getsubmittedUsers(record)" :key="user.id" style="cursor: pointer;"
                class="file-tag">
                {{ user.username }}
                <a-tooltip v-if="user.files?.length">
                  <template #title>点击查看{{ user.files.length }}个文件</template>
                  <span style="margin-left: 5px" @click="handleOpenFiles(user.files)">📎</span>
                </a-tooltip>
                <a-popconfirm title="确定要移除此用户提交记录？" @confirm="handleDeleteUser(record.id, user.id)">
                  <a-tooltip title="删除记录">
                    ❌
                  </a-tooltip>
                </a-popconfirm>
              </a-tag>
              <span v-if="!record.submittedUsers.length">暂无提交</span>
            </a-descriptions-item>

            <a-descriptions-item label="未提交用户">
              <a-tag v-for="user in getUnsubmittedUsers(record)" :key="user.id">
                {{ user.username }}
              </a-tag>
            </a-descriptions-item>
          </a-descriptions>
        </div>
      </template>
    </a-table>

    <!-- 任务编辑/创建模态框 -->
    <a-modal v-model:visible="modalVisible" :title="modalType === 'create' ? '新建收集任务' : '编辑收集任务'" @ok="handleModalOk"
      :confirmLoading="confirmLoading">
      <a-form :model="formState" :rules="formRules" ref="formRef" layout="vertical">
        <a-form-item label="任务名称" name="name">
          <a-input v-model:value="formState.name" placeholder="请输入收集任务名称" />
        </a-form-item>

        <a-form-item label="选择用户" name="selectedUsers">
          <a-select v-model:value="formState.selectedUsers" mode="multiple" placeholder="请选择需要收集的用户" show-search
            option-filter-prop="label">
            <a-select-option v-for="user in allUsers" :key="user.id" :label="user.username">
              {{ user.username }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="截止时间" name="deadline">
          <a-date-picker v-model:value="formState.deadline" show-time format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { userListService } from '@/api/user';
import { collectListService, collectAddService, updateCollectService, removeCollectionUser, removeCollectService } from '@/api/filecollection'
import dayjs from 'dayjs';
import useUserInfoStore from '@/store/userInfo.js';
const userInfoStore = useUserInfoStore();
const currentUserId = userInfoStore.info.id;

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,  // 允许切换每页条数
  pageSizeOptions: ['10', '20', '50'],  // 可选分页大小
  showTotal: total => `共 ${total} 条数据`,  // 显示总数
  // 分页变化事件
  onChange: (current, pageSize) => {
    pagination.current = current;
    pagination.pageSize = pageSize;
    loadData();  // 触发数据加载
  },
  // 每页条数变化事件（与onChange合并处理也可）
  onShowSizeChange: (current, pageSize) => {
    pagination.current = 1;  // 切换条数时重置到第一页
    pagination.pageSize = pageSize;
    loadData();
  }
});

// 模拟数据
const allUsers = ref([
]);

const collections = ref([
]);

// 响应式状态
const modalVisible = ref(false);
const modalType = ref('create');
const confirmLoading = ref(false);
const formRef = ref();

const formState = reactive({
  id: null,
  name: '',
  selectedUsers: [],
  deadline: null
});

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入任务名称' }],
  selectedUsers: [{ required: true, message: '请至少选择一个用户' }],
  deadline: [{ required: true, message: '请选择截止时间' }]
};

// 计算属性
const statusColorMap = {
  '进行中': 'blue',
  '已截止': 'red'
};

const columns = computed(() => [
  { title: '任务名称', dataIndex: 'name', width: '25%' },
  {
    title: '参与用户',
    customRender: ({ record }) =>
      allUsers.value
        .filter(u => record.selectedUsers.includes(u.id))
        .map(u => u.username)
        .join(', ')
  },
  { title: '截止时间', dataIndex: 'deadline' },
  {
    title: '状态',
    dataIndex: 'status',
    slots: { customRender: 'status' },
    filters: [
      { text: '进行中', value: '进行中' },
      { text: '已截止', value: '已截止' }
    ],
    onFilter: (value, record) => record.status === value
  },
  { title: '创建时间', dataIndex: 'createTime' },
  {
    title: '操作',
    slots: { customRender: 'action' },
    width: '150px'
  }
]);

// 方法
const getsubmittedUsers = (record) => {
  return record.submittedUsers.map(submitted => {
    const baseUser = allUsers.value.find(u => u.id === submitted.userId)
    return {
      ...baseUser,
      files: submitted.files // 合并文件信息[2](@ref)
    }
  })
}

const getUnsubmittedUsers = (record) => {
  // 获取已提交用户的ID数组
  const submittedIds = record.submittedUsers.map(s => s.userId);
  
  return record.selectedUsers
    .filter(userId => !submittedIds.includes(userId))
    .map(userId => allUsers.value.find(u => u.id === userId));
};

const handleCreate = () => {
  modalType.value = 'create';
  resetForm();
  modalVisible.value = true;
};

const handleEdit = (record) => {
  modalType.value = 'edit';
  Object.assign(formState, {
    id: record.id,
    name: record.name,
    selectedUsers: [...record.selectedUsers],
    deadline: record.deadline
  });
  modalVisible.value = true;
};

// 删除用户提交文件
const handleDeleteUser = async (taskId, userId) => {
  try {
    console.log("删除用户提交记录，taskId:", taskId, "userId:", userId);
    await removeCollectionUser(taskId, userId);
    message.success('已移除用户提交记录');
    // 更新本地数据
    const task = collections.value.find(c => c.id === taskId);
    if (task) {
      task.submittedUsers = task.submittedUsers.filter(u => u.userId !== userId);
    }
    console.log("collections.value:", collections.value);
  } catch (error) {
    message.error('移除失败: ' + error.message);
  }
};

const handleModalOk = async () => {
  try {
    await formRef.value.validate();
    confirmLoading.value = true;

    if (modalType.value === 'create') {
      // 包装成json
      try {
        const response = await collectAddService(formState.name.trim(), formState.selectedUsers, dayjs(formState.deadline).format('YYYY-MM-DD HH:mm:ss'),currentUserId);
        if (response.data === true) {
          message.success('创建成功');
          collections.value.push({
            ...formState,
            id: Date.now(),
            submittedUsers: [],
            createTime: new Date().toLocaleString(),
            status: '进行中'
          });
        } else {
          message.error('创建失败');
        }
      } catch (error) {
        message.error('创建失败,请检查时间是否以及流逝了');
      }
    } else {
      console.log(formState.id, modalType.value, formState.name.trim(), formState.selectedUsers, dayjs(formState.deadline).format('YYYY-MM-DD HH:mm:ss'));
      try {
        const response = await updateCollectService(
          formState.id,
          formState.name.trim(),
          formState.selectedUsers,
          dayjs(formState.deadline).format('YYYY-MM-DD HH:mm:ss'));
        if (response.data === true) {
          message.success('更新成功');
          const index = collections.value.findIndex(c => c.id === formState.id);
          collections.value.splice(index, 1, {
            ...collections.value[index],
            ...formState
          });
        } else {
          message.error('更新失败');
        }
      } catch (error) {
        message.error('更新失败,请检查时间是否以及流逝了');
      }
    }

    modalVisible.value = false;
    resetForm();
  } catch (error) {
    console.error('表单验证失败:', error);
  } finally {
    confirmLoading.value = false;
  }
};

const handleDelete = (id) => {
  try{
    console.log("id:", id);
    removeCollectService(id);
    collections.value = collections.value.filter(c => c.id !== id);
    message.success('删除成功');
  }catch (error) {
    message.error('删除失败');
  }
  
};

const resetForm = () => {
  formRef.value?.resetFields();
  Object.assign(formState, {
    id: null,
    name: '',
    selectedUsers: [],
    deadline: null
  });
};

// 计算任务状态
collections.value = collections.value.map(c => ({
  ...c,
  status: new Date(c.deadline) > new Date() ? '进行中' : '已截止'
}));

const loadData = async () => {
  const [userList, collectList] = await Promise.all([
    userListService(),
    collectListService({
      page: pagination.current,
      size: pagination.pageSize,
      createUserId: currentUserId
    }
    )])
  allUsers.value = userList.data
  collections.value = collectList.data.list.map(task => ({
    ...task,
    selectedUsers: task.participants.map(p => p.userId),
    // submittedUsers: task.participants.filter(p => p.submitted).map(p => p.userId),
    submittedUsers: task.participants
      .filter(p => p.submitted)
      .map(p => ({
        userId: p.userId,
        files: p.files // 新增文件路径字段[7](@ref)
      })),
    deadline: dayjs(task.deadline).format('YYYY-MM-DD HH:mm'), // 格式化时间
    createTime: dayjs(task.createTime).format('YYYY-MM-DD HH:mm')
  }));
  console.log("collections.value:", collections.value);
}

const handleOpenFiles = (files) => {
  if (!files || !files.length) {
    message.warning('该用户未提交文件')
    return
  }

  // 在新窗口逐个打开文件[7](@ref)
  files.forEach(file => {
    console.log("file:", file);
    window.open(file, '_blank', 'noopener,noreferrer')
  })
}

onMounted(() => {
  loadData();
})

</script>

<style scoped>
.collect-container {
  padding: 24px;
  background: #fff;
}

.action-bar {
  margin-bottom: 20px;
}

.task-detail {
  padding: 12px;
  background: #fafafa;
}
</style>