<template>
  <div class="comment-list">
    <div class="comment-header">
      <a-avatar :src="comment.userAvatar" size="small" />
      <span class="comment-user">{{ comment.userName }}</span>
      <span v-if="comment.parentUserName" class="reply-info">
        回复了 {{ comment.parentUserName }}
      </span>
      <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
    </div>
    <div class="comment-content">{{ comment.content }}</div>
    <div class="comment-actions">
      <a-button type="link" size="small" @click="toggleLike">
        <heart-outlined :style="{ color: comment.liked ? 'red' : '' }" />
        {{ comment.likesCount }}
      </a-button>
      <a-button type="link" size="small" @click="showReplyInput">
        回复
      </a-button>
    </div>
    <!-- 回复输入框 -->
    <div v-if="replyActive" class="reply-input">
      <a-input v-model:value="replyContent" :placeholder="`回复 @${comment.userName}`" @pressEnter="submitReply" />
      <a-button type="primary" size="small" @click="submitReply">提交</a-button>
    </div>
    <!-- 递归显示子评论 -->
    <div class="child-comments" v-if="comment.children && comment.children.length">
      <CommentItem
        v-for="child in comment.children"
        :key="child.id"
        :comment="child"
        :currentUserId="currentUserId"
        @reply="onChildReply"
        @toggleLike="onChildToggleLike"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits, ref } from 'vue';
import { HeartOutlined } from '@ant-design/icons-vue';

const props = defineProps<{
  comment: any;
  currentUserId: number;
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

const submitReply = () => {
  if (!replyContent.value.trim()) return;
  emit('reply',props.comment.momentId, props.comment.id, replyContent.value);
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
