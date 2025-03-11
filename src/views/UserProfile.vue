<template>
  <div class="profile-container">
    <a-page-header title="个人中心" @back="() => router.go(-1)" />
    <div class="content">
      <a-form :model="formState" layout="vertical">
        <!-- 头像上传 -->
        <a-form-item>
          <a-upload v-model:fileList="fileList" list-type="picture-card" :before-upload="beforeUpload"
            @change="handleAvatarChange" :remove="handleRemove" :customRequest="customRequest" :maxCount="1">
            <div v-if="!formState.avatar">
              <plus-outlined />
              <div class="ant-upload-text">上传头像</div>
            </div>
          </a-upload>
        </a-form-item>

        <!-- 用户名 -->
        <a-form-item label="用户名">
          <a-input v-model:value="formState.username" />
        </a-form-item>

        <!-- 手机号 -->
        <a-form-item label="手机号">
          <a-input v-model:value="formState.phoneNumber" />
        </a-form-item>

        <!-- 邮箱 -->
        <a-form-item label="邮箱">
          <a-input v-model:value="formState.email" />
        </a-form-item>

        <!-- 邮箱授权码 -->
        <a-form-item v-if="formState.email" label="邮箱授权码">
          <div v-if="!showAuthCodeInput">
            <span v-if="formState.hasAuthCode" style="margin-right: 10px;">已绑定授权码</span>
            <a-button @click="handleAuthCodeAction">{{ formState.hasAuthCode ? '修改' : '绑定' }}</a-button>
          </div>
          <div v-else>
            <a-input-password v-model:value="authCodeInput" placeholder="请输入授权码" style="margin-bottom: 10px;" />
            <div>
              <a-button type="primary" @click="handleBindAuthCode" style="margin-right: 10px;">提交</a-button>
              <a-button @click="cancelAuthCodeInput">取消</a-button>
            </div>
          </div>
        </a-form-item>

        <!-- 提交按钮 -->
        <a-form-item>
          <a-button type="primary" @click="handleSubmit">保存</a-button>
          <a-button type="default" @click="goToChangePassword" style="margin-left: 10px;">
            修改密码
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { userInfoService, userInfoUpdateService, uploadAvatar, checkAuthCodeService, bindAuthCode } from '@/api/user.js';

const router = useRouter();

// 表单数据
const formState = ref({
  id: '',
  username: '',
  phoneNumber: '',
  email: '',
  avatar: '',
  hasAuthCode: false,
});

// 文件上传相关
const fileList = ref([]);
const showAuthCodeInput = ref(false);
const authCodeInput = ref('');

// 获取用户信息
const fetchProfile = async () => {
  const res = await userInfoService();
  console.log("获取用户信息：", res);
  formState.value = res.data;
  if (res.data.avatar) {
    fileList.value = [
      {
        uid: '-1',
        name: 'avatar',
        status: 'done',
        url: res.data.avatar,
      },
    ];
  }
  
  formState.value.hasAuthCode = false;
  if (res.data.email) {
    let authexit = await checkAuthCodeService(res.data.id, res.data.email);
    formState.value.hasAuthCode = authexit.data
  }
};

// 处理授权码操作
const handleAuthCodeAction = () => {
  showAuthCodeInput.value = true;
  if (formState.value.hasAuthCode) {
    message.info('请重新输入新的授权码');
  }
};

// 取消授权码输入
const cancelAuthCodeInput = () => {
  showAuthCodeInput.value = false;
  authCodeInput.value = '';
};

// 绑定/更新授权码
const handleBindAuthCode = async () => {
  if (!authCodeInput.value) {
    message.error('请输入授权码');
    return;
  }

  try {
    await bindAuthCode({
      userId: formState.value.id,
      email: formState.value.email,
      authCode: authCodeInput.value
    });
    message.success('授权码绑定成功');
    formState.value.hasAuthCode = true;
    showAuthCodeInput.value = false;
    authCodeInput.value = '';
  } catch (error) {
    message.error('操作失败，请重试');
  }
};



// 头像上传前校验
const beforeUpload = (file: File) => {
  console.log("beforeUpload triggered, file:", file);
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件！');
    return false; // 阻止上传
  }
  return true;
};

// 自定义上传逻辑
const customRequest = async ({ file, onSuccess, onError }: any) => {
  console.log("customRequest triggered, file:", file);
  try {
    const formData = new FormData();
    formData.append("file", file); // 字段名需与后端一致
    const res = await uploadAvatar(formData);
    console.log("上传返回结果：", res);

    // 确保 `onSuccess` 传递的是完整的 `response`
    onSuccess({
      status: "success",  // 自定义字段，确保 Ant Design 解析成功
      url: res.data, // 直接赋值返回的文件 URL
      name: file.name, // 文件名
      uid: file.uid // Ant Design 需要的 uid
    }, file);

  } catch (error) {
    console.error("customRequest error:", error);
    onError(error);
    message.error("上传失败，请重试");
  }
};


// 处理上传文件变化，过滤掉不合格的文件
const handleAvatarChange = ({ file, fileList: newFileList }: any) => {
  console.log("handleAvatarChange triggered, file:", file);
  console.log("新的 fileList:", newFileList);
  // 筛选出类型为图片的文件
  const validFileList = newFileList.filter((item: any) => item.type && item.type.startsWith('image/'));
  fileList.value = validFileList;

  if (file.status === 'done') {
    console.log("文件上传完成，response:", file.response);
    formState.value.avatar = file.response.url; // 更新头像 URL
    message.success('头像上传成功');
  } else if (file.status === 'error') {
    message.error('头像上传失败');
  }
};

// 处理文件移除
const handleRemove = () => {
  console.log("handleRemove triggered");
  formState.value.avatar = ''; // 清空头像 URL
  fileList.value = []; // 清空文件列表
  return true; // 允许移除
};

// 提交表单
const handleSubmit = async () => {
  console.log("提交表单，formState:", formState.value);

  let response = await userInfoUpdateService(formState.value.id, formState.value);
  console.log("个人信息更新返回结果：", response);
  if (response.code === 200) {
    message.success('个人信息更新成功');
  }
};

// 跳转到修改密码页面
const goToChangePassword = () => {
  router.push('/user/change-password'); // 修改为你的修改密码页面路由
};

// 初始化加载
onMounted(() => {
  fetchProfile();
});
</script>

<style scoped>
.profile-container {
  padding: 24px;
}

.content {
  max-width: 600px;
  margin: 0 auto;
}
</style>
