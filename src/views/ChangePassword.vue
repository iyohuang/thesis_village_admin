<template>
  <div class="password-container">
    <a-page-header title="修改密码" @back="() => router.go(-1)" />
    <div class="content">
      <a-form :model="formState" layout="vertical">
        <!-- 旧密码 -->
        <a-form-item label="旧密码">
          <a-input-password v-model:value="formState.oldPassword" placeholder="请输入旧密码" />
        </a-form-item>
        <!-- 新密码 -->
        <a-form-item label="新密码">
          <a-input-password v-model:value="formState.newPassword" placeholder="请输入新密码" />
        </a-form-item>
        <!-- 确认新密码 -->
        <a-form-item label="确认新密码">
          <a-input-password v-model:value="formState.confirmPassword" placeholder="请再次输入新密码" />
        </a-form-item>
        <!-- 提交按钮 -->
        <a-form-item>
          <a-button type="primary" @click="handleSubmit">保存修改</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { updatePasswordService } from '@/api/user'; // 这里调用后端接口更新密码

const router = useRouter();

// 表单数据
const formState = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 提交表单
const handleSubmit = async () => {
  // 前端基本校验
  if (!formState.value.oldPassword || !formState.value.newPassword || !formState.value.confirmPassword) {
    message.error('请完整填写所有字段');
    return;
  }
  if (formState.value.newPassword !== formState.value.confirmPassword) {
    message.error('新密码与确认密码不一致');
    return;
  }
  if (formState.value.newPassword === formState.value.oldPassword) {
    message.error('新密码怎么和旧密码一样勒');
    return;
  }
  try {
    // 调用更新密码接口，后端根据业务逻辑验证旧密码、更新新密码
    const response = await updatePasswordService(formState.value.oldPassword, formState.value.newPassword);
    if (response.code === 200) {
      message.success('密码修改成功');
      // 修改成功后跳转到个人信息页面
      router.push('/user/profile');
    } else {
      message.error(response.message || '密码修改失败，请检查旧密码是否正确');
    }
  } catch (error) {
    console.error('密码修改错误', error);
    message.error('密码修改失败，请稍后重试');
  }
};
</script>

<style scoped>
.password-container {
  padding: 24px;
}
.content {
  max-width: 600px;
  margin: 0 auto;
}
</style>
