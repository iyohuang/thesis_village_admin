<template>
  <a-row :gutter="24">
    <!-- 左侧历史记录 -->
    <a-col :span="6">
      <a-card title="发送历史" style="height: 80vh">
        <a-list :data-source="historyList" item-layout="vertical">
          <template #renderItem="{ item }">
            <a-list-item :class="{ 'selected-history': selectedHistoryId === item.id }"
              @click="handleSelectHistory(item)">
              <a-list-item-meta :title="item.subject"
                :description="`发件人：${item.senderEmail} | 收件人：${JSON.parse(item.receiverEmail).join(', ')}`" />
              <template #actions>
                <span>{{ formatTime(item.sendTime) }}</span>
              </template>
              <!-- 附件预览 -->
              <div v-if="JSON.parse(item.files).length" class="attachment-preview">
                <paper-clip-outlined />
                {{ JSON.parse(item.files).length }}个附件
              </div>
            </a-list-item>
          </template>
        </a-list>
      </a-card>
    </a-col>

    <!-- 右侧发送表单 -->
    <a-col :span="16">
      <a-card :title="selectedHistoryId ? '邮件详情' : '发送新邮件'">
        <!-- 新建邮件按钮 -->
        <template #extra>
          <a-button v-if="selectedHistoryId" type="primary" @click="handleNewEmail">
            新建邮件
          </a-button>
        </template>
        <a-alert v-if="!availableEmails.length && !selectedHistoryId" type="warning" show-icon message="未绑定发件邮箱"
          description="您还没有可用的发件邮箱，请先前往个人中心绑定邮箱" style="margin-bottom: 24px">
          <template #action>
            <a-button type="primary" size="small" @click="goToProfile">
              立即绑定
            </a-button>
          </template>
        </a-alert>
        <a-form :model="formState" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
          <a-form-item label="发件人">
            <a-select v-model:value="formState.from" :disabled="!!selectedHistoryId || !availableEmails.length"
              placeholder="请先绑定发件邮箱">
              <a-select-option v-for="email in availableEmails" :key="email" :value="email">
                {{ email }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="收件人">
            <a-select v-model:value="formState.to" mode="tags" :disabled="!!selectedHistoryId" placeholder="输入邮箱后按分号分隔">
              <a-select-option v-for="user in allUsers" :key="user.email" :value="user.email">
                {{ `${user.username} <${user.email}>` }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="主题">
            <a-input v-model:value="formState.subject" :disabled="!!selectedHistoryId" />
          </a-form-item>

          <a-form-item label="正文内容">
            <RichTextEditor v-model="formState.content" :readonly="!!selectedHistoryId" />
          </a-form-item>

          <!-- 附件展示 -->
          <a-form-item label="附件" v-if="formState.files.length">
            <a-list :data-source="formState.files" size="small">
              <template #renderItem="{ item }">
                <a-list-item>
                  <!-- <paper-clip-outlined /> -->
                  📎
                  <a :href="item" target="_blank">{{ extractFileNameRegex(item.split('/').pop()) }}</a>
                </a-list-item>
              </template>
            </a-list>
          </a-form-item>

          <!-- 发送按钮 -->
          <a-form-item :wrapper-col="{ offset: 4 }" v-if="!selectedHistoryId">
            <a-button type="primary" html-type="submit" :loading="sending" @click="handleSubmit">
              发送邮件
            </a-button>
          </a-form-item>
        </a-form>
      </a-card>
    </a-col>
  </a-row>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import RichTextEditor from '@/views/RichTextEditor.vue';
import { PaperClipOutlined } from '@ant-design/icons-vue';
import { sendEmail, getAllEmailUsers, getEmailHistory, getAvailableEmails } from '@/api/emails'
import { useRouter } from 'vue-router';

const router = useRouter();

const formState = reactive({
  from: '',
  to: [],
  subject: '',
  content: '',
  files: []
});
const allUsers = ref([]);
const fileList = ref([]);
const sending = ref(false);
const historyList = ref([]);
const availableEmails = ref(['717146638@qq.com', 'backup@yourcompany.com']);
const selectedHistoryId = ref(null);

const goToProfile = () => {
  router.push('/user/profile')
}

const extractFileNameRegex = (filePath) => {
  // 先提取纯文件名（含扩展名）
  const fileName = filePath.split('/').pop();
  const regex = /_([^_]+)$/;
  const match = fileName.match(regex);
  return match ? match[1] : fileName; // 无下划线返回完整文件名
}

// 处理历史记录选择
const handleSelectHistory = (item) => {
  selectedHistoryId.value = item.id;

  // 填充表单数据
  formState.from = item.senderEmail;
  formState.to = JSON.parse(item.receiverEmail);
  formState.subject = item.subject;
  formState.content = item.content;
  formState.files = JSON.parse(item.files);

  // 清空上传文件列表
  fileList.value = [];
};

// 新建邮件处理
const handleNewEmail = () => {
  selectedHistoryId.value = null;
  resetForm();
};

// // 修改后的重置表单方法
const resetForm = () => {
  formState.from = availableEmails.value[0];
  formState.to = [];
  formState.subject = '';
  formState.content = '';
  formState.files = [];
  fileList.value = [];
};

// // 修改时间格式化方法
const formatTime = (timeStr) => {
  const date = new Date(timeStr);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// 获取历史记录
const loadHistory = async () => {
  try {
    const res = await getEmailHistory();
    historyList.value = res.data;
  } catch (error) {
    message.error('获取历史记录失败');
  }
};

// 处理文件上传
const beforeUpload = (file) => {
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error('文件大小不能超过10MB');
    return false;
  }
  fileList.value = [...fileList.value, file];
  return false;
};

// 提交表单
const handleSubmit = async () => {
  sending.value = true;
  console.log("提交表单，formState:", formState);

  try {
    const formData = new FormData();
    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, value);
    });
    fileList.value.forEach(file => {
      formData.append('attachments', file.originFileObj);
    });

    await sendEmail(formData);

    message.success('邮件发送成功');
    loadHistory();
    resetForm();
  } catch (error) {
    message.error(`发送失败: ${error.response?.data?.message || error.message}`);
  } finally {
    sending.value = false;
  }
};

// const resetForm = () => {
//   formState.subject = ''
//   formState.content = ''
//   formState.to = []
//   fileList.value = []
// }

const loadAllUser = async () => {
  try {
    const res = await getAllEmailUsers();
    allUsers.value = res.data || [];
  } catch (error) {
    message.error('获取用户列表失败');
  }
};

// 自定义邮箱校验规则
const validateEmails = (rule, value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (value.some(email => !emailRegex.test(email))) {
    return Promise.reject('包含无效邮箱格式');
  }
  return Promise.resolve();
};

// 邮箱搜索过滤
const filterEmailOption = (input, option) => {
  return option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

const loadavailableEmails = async () => {
  try {
    const res = await getAvailableEmails();
    availableEmails.value = res.data;
  } catch (error) {
    message.error('获取可用邮箱失败');
  }
}

// 初始化加载历史记录
onMounted(() => {
  loadavailableEmails();
  loadAllUser();
  loadHistory();
});
</script>

<style scoped>
/* 增加邮箱展示密度 */
.ant-select-selection-item {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 优化选项列表展示 */
.ant-select-item-option-content {
  font-family: monospace;
}

/* 选中样式 */
.selected-history {
  background-color: #f0faff;
  border-left: 3px solid #1890ff;
  cursor: pointer;
}

/* 附件预览样式 */
.attachment-preview {
  color: #666;
  font-size: 12px;
  margin-top: 8px;
}

/* 调整列表项间距 */
.ant-list-item {
  padding: 12px 24px;
}
</style>