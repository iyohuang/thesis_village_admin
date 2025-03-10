<template>
  <div class="collect-container">
    <!-- 操作栏与列表区域保持统一间距 -->
    <a-card :bordered="false" style="margin-top: 24px">
      <!-- 分页列表 -->
      <a-list item-layout="horizontal" :data-source="pagedTasks" :pagination="pagination">
        <template #renderItem="{ item }">
          <a-list-item class="task-item">
            <template #actions>
              <a-button v-if="item.submitted" type="link" @click="handleOpenFiles(item.oldfiles)" :disabled="!item.submitted">
                <template #icon>🧡</template>
                {{extractFileNameRegex(item.oldfiles[0])}}
              </a-button>
              <a-upload v-model:file-list="item.files" :before-upload="() => false" @change="handleUpload(item)"
                 :show-upload-list="false">
                <a-button type="primary" :icon="h(UploadOutlined)" >
                  {{ item.submitted ? '修改提交' : '上传文件' }}
                </a-button>
              </a-upload>
            </template>

            <a-list-item-meta :description="`截止时间：${dayjs(item.deadline).format('YYYY-MM-DD HH:mm')}`">
              <template #title>
                <span class="task-title">{{ item.name }}</span>
                <a-tag :color="item.submitted ? 'green' : 'volcano'" class="status-tag">
                  {{ item.submitted ? '已提交' : '待提交' }}
                </a-tag>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </a-card>
  </div>
</template>

<script setup>
import { UploadOutlined } from '@ant-design/icons-vue';
import { ref, reactive, h, onMounted } from 'vue';
import dayjs from 'dayjs';
import { collectListService, uploadCollectionFile } from '@/api/filecollection';
import useUserInfoStore from '@/store/userInfo.js';
import { message } from 'ant-design-vue';
const userInfoStore = useUserInfoStore();
const currentUserId = userInfoStore.info.id;
const pagedTasks = ref([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50'],
  showTotal: total => `共 ${total} 条任务`,
  onChange: (page, pageSize) => {
    pagination.current = page;
    pagination.pageSize = pageSize;
    loadData();
  },
  onShowSizeChange: (current, size) => {
    pagination.current = 1;
    pagination.pageSize = size;
    loadData();
  }
});

// 任务数据加载（模仿收集任务页面的loadData）
const loadData = async () => {
  try {
    const { data } = await collectListService({
      userId: currentUserId, // 可选参数
      page: pagination.current,
      size: pagination.pageSize
    });

    console.log

    pagedTasks.value = data.list.map(task => ({
      ...task,
      //files可能是没有的
      oldfiles: task.participants
        ?.filter(p => p?.userId === currentUserId)
        ?.flatMap(p => p.files ?? [])
        ?.filter(Boolean) || [],
      submitted: task.participants.some(p =>
        p.userId === currentUserId && p.submitted
      ),
      deadline: dayjs(task.deadline),
      createTime: dayjs(task.createTime),

    }));

    pagination.total = data.total;
  } catch (error) {
    console.error('任务加载失败:', error);
  }
};

const isEditable = (task) => {
  return dayjs().isBefore(dayjs(task.deadline))
    && task.status === '进行中';
};

const extractFileNameRegex = (filePath) => {
  // 先提取纯文件名（含扩展名）
  const fileName = filePath.split('/').pop();
  const regex = /_([^_]+)$/;
  const match = fileName.match(regex);
  return match ? match[1] : fileName; // 无下划线返回完整文件名
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


// 上传处理（保持操作反馈统一）
const handleUpload = async (task) => {
  if (!task.files?.length) {
    message.error('请选择文件');
    return;
  }
  console.log("上传文件名:", task.files);
  console.log("上传文件:", task.files[0].originFileObj.name);
  console.log("上传id:", task.id);
  console.log("上传文件大小:", task.files[0].size);

  try {
    // 实际应调用提交API
    const formData = new FormData();
    formData.append('files', task.files[0].originFileObj);
    formData.append('taskId', task.id);
    formData.append('userId', currentUserId);
    let res = await uploadCollectionFile(formData);
    console.log("上传返回结果：", res);
    pagedTasks.value = pagedTasks.value.map(t => (t.id === task.id && t.userId === task.userId ? { ...t, oldfiles: res.data, files:[] } : t));

    task.submitted = true;
    message.success(`${task.name} 提交成功`);
  } catch (error) {
    message.error('文件上传失败');
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
/* 保持与收集任务页面一致的样式 */
.collect-container {
  padding: 24px;
  background: #fff;
}

.task-item {
  padding: 12px 24px;
  transition: all 0.3s;
}

.task-item:hover {
  background-color: #fafafa;
}

.task-title {
  font-size: 16px;
  margin-right: 12px;
}

.status-tag {
  margin-left: 8px;
  vertical-align: middle;
}

/* 统一按钮样式 */
:deep(.ant-btn-primary) {
  padding: 0 16px;
  height: 32px;
}
</style>