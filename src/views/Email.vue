<template>
  <a-row :gutter="24">
    <!-- 左侧历史记录 -->
    <a-col :span="8">
      <a-card title="发送历史" style="height: 80vh">
        <a-list :data-source="historyList" item-layout="vertical">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta :title="item.subject" :description="`收件人：${item.to}`" />
              <template #actions>
                <span>{{ formatTime(item.sendTime) }}</span>
                <a-tag :color="item.status === 'success' ? 'green' : 'red'">
                  {{ item.status === 'success' ? '成功' : '失败' }}
                </a-tag>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </a-card>
    </a-col>

    <!-- 右侧发送表单 -->
    <a-col :span="16">
      <a-card title="发送新邮件">
        <a-form :model="formState" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }" @finish="handleSubmit">
          <a-form-item label="发件人" name="from" :rules="[{ required: true, message: '请选择发件邮箱' }]">
            <a-select v-model:value="formState.from">
              <a-select-option v-for="email in availableEmails" :key="email" :value="email">
                {{ email }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="收件人" name="to" :rules="[
            { required: true, message: '请输入收件人邮箱' },
            { type: 'email', message: '邮箱格式不正确' }
          ]">
            <a-input v-model:value="formState.to" placeholder="多个邮箱用分号分隔" />
          </a-form-item>

          <a-form-item label="主题" name="subject" :rules="[{ required: true, message: '请输入邮件主题' }]">
            <a-input v-model:value="formState.subject" />
          </a-form-item>

          <a-form-item label="正文内容" name="content" :rules="[{ required: true, message: '请输入邮件内容' }]">
            <RichTextEditor v-model="formState.content" />
          </a-form-item>

          <a-form-item label="附件" name="attachments">
            <a-upload v-model:file-list="fileList" :multiple="true" :before-upload="beforeUpload"
              @remove="handleRemove">
              <a-button>
                <upload-outlined />
                选择文件
              </a-button>
            </a-upload>
          </a-form-item>

          <a-form-item :wrapper-col="{ offset: 4 }">
            <a-button type="primary" html-type="submit" :loading="sending" >
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
import { sendEmail } from '@/api/emails'

const formState = reactive({
  from: '',
  to: '',
  subject: '',
  content: '',
});

const fileList = ref([]);
const sending = ref(false);
const historyList = ref([]);
const availableEmails = ref(['717146638@qq.com', 'backup@yourcompany.com']);

// 获取历史记录
const loadHistory = async () => {
  try {
    const res = await api.get('/emails/history');
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
  try {
    const formData = new FormData();
    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, value);
    });
    fileList.value.forEach(file => {
      formData.append('attachments', file.originFileObj);
    });
    console.log(formState);
    console.log(fileList.value);
    console.log(formData);

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

// 初始化加载历史记录
onMounted(() => {
  loadHistory();
});
</script>