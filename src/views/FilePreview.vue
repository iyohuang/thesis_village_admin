<template>
    <div class="file-preview">
        <!-- 打印 files 数据 -->
        <!-- <pre>{{ files }}</pre> -->
        <div v-for="(file, index) in files" :key="index" class="file-item">
            <!-- <file-outlined style="margin-right: 8px;" /> -->
            <component :is = "getFileIcons(filetype)" style="margin-right: 2px;" />
            <!-- <span>{{ file }}</span> -->
            <a href="javascript:void(0);" @click="handleFileClick(file)">
                查看附件
            </a>
        </div>
    </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { getFileIcon } from '@/utils/file-icon';
import { 
  FileOutlined,
  PictureOutlined,
  VideoCameraOutlined
} from '@ant-design/icons-vue';

interface FileItem {
    uid: string;
    type: 'image' | 'pdf' | 'video';
    name: string;
    url: string;
}

const props = defineProps<{
    files: string[];
    filetype: string;
}>();

const fileTypeIcons = {
  pdf: FileOutlined,
  image: PictureOutlined,
  video: VideoCameraOutlined
  // 添加更多类型映射...
};


console.log('Files Prop:', props.files);
const handleFileClick = (url: string) => {
    window.open(url, '_blank');
};

const getFileIcons = (fileType) => {
  // 如果直接使用文件类型
  return fileTypeIcons[fileType] || FileOutlined;
};
</script>

<style scoped>
.file-preview {
    margin-top: 8px;
    display: flex;
    gap: 8px;
    color: #555;
}

.file-item a {
    color: #1890ff;
    text-decoration: none;
}
</style>