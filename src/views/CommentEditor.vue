<template>
  <div class="comment-editor">

    <!-- 文本输入区域 -->
    <a-textarea class="comment-input"  v-if="enableComment" v-model:value="content" :placeholder="placeholder" :auto-size="{ minRows: 2 }" />

    <!-- 文件上传区域 -->
    <div v-if="enableUpload">
      <!-- 文件类型选择 -->
      <div v-if="!hideTypeSelector" class="file-type-selector">
        <a-radio-group v-model:value="fileType" button-style="solid">
          <a-radio-button value="image">图片</a-radio-button>
          <a-radio-button value="pdf">PDF</a-radio-button>
          <a-radio-button value="video">视频</a-radio-button>
        </a-radio-group>
      </div>
      <a-upload v-model:file-list="fileList" :accept="currentAccept" :multiple="allowMultiple" :max-count="maxCount"
        :before-upload="beforeUpload" list-type="picture-card" @change="handleFileChange"
        :customRequest="customRequest">
        <!-- 上传按钮 -->
        <div v-if="showUploadButton">
          <plus-outlined />
          <div class="upload-hint">{{ uploadHint }}</div>
        </div>
      </a-upload>

      <!-- 提交按钮 -->
      <div class="submit-section" v-if="showSubmitButton">
        <a-button type="primary" @click="submit" :disabled="!isFormValid">
          提交
        </a-button>
      </div>
    </div>

  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import type { UploadProps, message } from 'ant-design-vue';
import { Upload } from 'ant-design-vue';
import { uploadApFile } from '@/api/aq';

interface FileItem {
  uid: string;
  type: 'image' | 'pdf' | 'video';
  url: string;
}

const props = defineProps({
  enableComment: {
    type: Boolean,
    default: true
  },
  enableUpload: {
    type: Boolean,
    default: true
  },
  hideTypeSelector: Boolean,
  placeholder: {
    type: String,
    default: '输入内容...'
  },
  maxCount: {
    type: Number,
    default: 5
  },
  allowMultiple: {
    type: Boolean,
    default: true
  },
  showSubmitButton: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit', 'files-change', 'file-uploaded']);

// 响应式状态
const fileType = ref<'image' | 'pdf' | 'video'>('image');
const fileList = ref<UploadProps['fileList']>([]);
const content = ref('');

// 计算属性
const currentAccept = computed(() => {
  const acceptMap = {
    image: 'image/*',
    pdf: 'application/pdf',
    video: 'video/*'
  };
  return acceptMap[fileType.value];
});

const showUploadButton = computed(() => {
  return fileList.value ? fileList.value.length < props.maxCount : true;
});

const uploadHint = computed(() => {
  return `上传${fileType.value === 'video' ? '视频' : fileType.value.toUpperCase()}`;
});

// 添加表单验证状态
const isFormValid = computed(() => {
  return content.value.trim().length > 0 || fileList.value.length > 0;
});


// 文件验证
const beforeUpload: UploadProps['beforeUpload'] = file => {
  const isValid = validateFileType(file, fileType.value);
  if (!isValid) {
    console.error('文件类型不符');
  }
  return isValid || Upload.LIST_IGNORE;
};

// 提交
const submit = () => {
  emit('submit',content.value);
};


const validateFileType = (file: File, type: string) => {
  const typeMap = {
    image: ['image/jpeg', 'image/png', 'image/gif'],
    pdf: ['application/pdf'],
    video: ['video/mp4', 'video/quicktime', 'video/x-msvideo']
  };
  return typeMap[type as keyof typeof typeMap].includes(file.type);
};



// 文件变化处理
const handleFileChange = () => {
  console.log("handleFileChange triggered, fileList:", fileList.value);
  emit('files-change', fileList.value);
};

// 重置方法
const reset = () => {
  fileType.value = 'image';
  fileList.value = [];
  content.value = '';
};

const customRequest = async ({ file, onSuccess, onError }: any) => {
  // console.log("customRequest triggered, file:", file);
  // console.log("customRequest triggered, fileType:", fileType.value);
  try {
    const formData = new FormData();
    formData.append("files", file); // 字段名需与后端一致
    const res = await uploadApFile(formData);
    console.log("上传返回结果：", res);

    const fileInfo = {
      status: "success",
      url: res.data,
      name: file.name,
      uid: file.uid,
      type: fileType.value
    };
    // 确保 `onSuccess` 传递的是完整的 `response`
    onSuccess(fileInfo, file);
    emit('file-uploaded', fileInfo);
  } catch (error) {
    console.error("customRequest error:", error);
    onError(error);
    message.error("上传失败，请重试");
  }
};
</script>

<style scoped>

/* 输入区域样式 */
:deep(.ant-input) {
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
  transition: all 0.3s;
}
:deep(.ant-input:hover),
:deep(.ant-input:focus) {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 文件类型选择器 */
.file-type-selector {
  margin-bottom: 6px;
  margin-top: 6px;
}

:deep(.ant-radio-button-wrapper) {
  height: 32px;
  line-height: 30px;
  transition: all 0.3s;
}

/* 上传区域样式 */
:deep(.ant-upload.ant-upload-select-picture-card) {
  width: 100px;
  height: 100px;
  margin-right: 8px;
  margin-bottom: 8px;
  border: 2px dashed #d9d9d9;
  transition: border-color 0.3s;
}

:deep(.ant-upload.ant-upload-select-picture-card:hover) {
  border-color: #1890ff;
}

.upload-hint {
  color: #666;
  font-size: 12px;
  margin-top: 4px;
}

/* 文件列表样式 */
:deep(.ant-upload-list-picture-card-container) {
  width: 100px;
  height: 100px;
}

:deep(.ant-upload-list-item-actions) {
  background: rgba(0, 0, 0, 0.5);
}

/* 提交按钮区域 */
.submit-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}

.submit-section button {
  min-width: 120px;
  height: 40px;
  font-weight: 500;
  transition: all 0.3s;
  border-radius: 6px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .comment-editor {
    padding: 16px;
  }
  
  :deep(.ant-upload.ant-upload-select-picture-card) {
    width: 80px;
    height: 80px;
  }
}
</style>