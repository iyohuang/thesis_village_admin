<template>
  <div class="comment-list">
    <div class="comment-header">
      <a-avatar :src="answers.authorAvatar" size="small" />
      <span class="comment-user">{{ answers.authorName }}</span>
      <span v-if="answers.parentUserName" class="reply-info">
        回复了 {{ answers.parentUserName }}
      </span>
      <span class="comment-time">{{ formatTime(answers.createdAt) }}</span>
    </div>
    <div class="comment-content">{{ answers.content }}</div>
    <div class="comment-actions">
      <!-- <a-button type="link" size="small" @click="toggleLike">
        <heart-outlined :style="{ color: comment.liked ? 'red' : '' }" />
        {{ comment.likesCount }}
      </a-button> -->
      <a-button type="link" size="small" @click="showReplyInput">
        回复
      </a-button>
    </div>
    <!-- 回复输入框 -->
    <div v-if="replyActive" class="reply-input">
      <a-input v-model:value="replyContent" :placeholder="`回复 @${answers.authorName}`" @pressEnter="submitReply" />
      <a-button type="primary" size="small" @click="submitReply">提交</a-button>
    </div>
    <!-- 递归显示子评论 -->
    <div class="child-comments" v-if="answers.children && answers.children.length">
      <AnswerItem
        v-for="child in answers.children"
        :key="child.answerid"
        :answers="child"
        :qid=props.qid
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits, ref } from 'vue';
import { HeartOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { submitAnswer } from '@/api/aq';

const props = defineProps<{
  answers: any;
  qid: string;
}>();

const emit = defineEmits<{
  (e: 'reply',momentId: number, parentCommentId: number, replyContent: string): void;
  (e: 'toggleLike', commentId: number): void;
  (e: 'setActivePost', postId: number): void;
}>();

const replyActive = ref(false);
const replyContent = ref('');

const toggleLike = () => {
  emit('toggleLike', props.comment.id);
  props.comment.liked = !props.comment.liked;
  props.comment.likesCount += props.comment.liked ? 1 : -1;
};

const showReplyInput = () => {
  replyActive.value = !replyActive.value;
};

const submitReply = async() => {
  if (!replyContent.value.trim()) return;
  try {
        await submitAnswer({
            qid: props.qid,
            content: replyContent.value,
            parentId: props.answers.answerId
        });
        message.success('回答提交成功');
        location.reload();
    } catch (error) {
        message.error('回答提交失败');
    }
    replyContent.value = "";
    replyActive.value = false;
};


const onChildReply = (momentId: number, parentCommentId: number, replyContent: string) => {
  emit('reply', momentId, parentCommentId, replyContent);
};


const onChildToggleLike = (childId: number) => {
  emit('toggleLike', childId);
};

const formatTime = (time: string): string => {
  return new Date(time).toLocaleString();
};
</script>

<style scoped>
.comment-item {
  border-bottom: 0px solid #f0f0f0;
  padding: 5px 0;
  margin-left: 0px;
}
.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.reply-info {
  color: #888;
  font-size: 12px;
}
.comment-actions {
  margin-top: 4px;
}
.reply-input {
  margin-top: 4px;
  display: flex;
  gap: 6px;
}
.child-comments {
  margin-top: 8px;
  border-left: 0px solid #f0f0f0;
  padding-left: 0px;
}
</style>
