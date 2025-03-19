<template>
  <div class="comment-item">
    <div class="comment-header">
      <a-avatar :src="comment.userAvatar" size="small" />
      <!-- 显示用户名 -->
      <span class="comment-user">{{ comment.userName }}</span>
      <!-- 如果存在 parentUserName，则显示“回复了 XXX”的提示 -->
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
    <div v-if="replyActive" class="reply-input">
      <a-input v-model:value="replyContent" :placeholder="`回复 @${comment.userName}`" @pressEnter="reply" />
      <a-button type="primary" size="small" @click="reply(comment.id)">提交</a-button>
    </div>
    <!-- 递归显示子评论 -->
    <div class="child-comments" v-if="comment.children && comment.children.length">
      <CommentItem v-for="child in comment.children" :key="child.id" :comment="child" :currentUserId="currentUserId"
        @reply="emitReply" @toggleLike="emitToggleLike" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits, ref } from 'vue';
import { HeartOutlined } from '@ant-design/icons-vue';
import CommentItem from './CommentItem.vue'; // 递归调用
const replyActive = ref(false);
const replyContent = ref('');
const props = defineProps<{
  comment: {
    id: number;
    userAvatar: string;
    userName: string;
    content: string;
    createdAt: string;
    likesCount: number;
    liked: boolean;
    parentCommentId: number;
    momentId: number;
    parentUserName?: string; // 父评论用户名（若存在）
    children?: any[];
  };
  currentUserId: number;
}>();

const emit = defineEmits<{
  (e: 'reply', momentId:number ,parentCommentId: number, replyContent: string): void;
  (e: 'toggleLike', commentId: number): void;
  (e: 'setActivePost', postId: number): void;
}>();

const toggleLike = () => {
  emit('toggleLike', props.comment.id);
  props.comment.liked = !props.comment.liked;
  props.comment.likesCount += props.comment.liked ? 1 : -1;
};

const reply = (commentId: number) => {
  emit('reply', props.comment.momentId, commentId,replyContent.value);
};

const showReplyInput = () => {
  replyActive.value = !replyActive.value;
};

const emitReply = (momentId:number ,parentCommentId: number, replyContent: string) => {
  emit('reply', momentId,parentCommentId,replyContent);
};



const emitToggleLike = (commentId: number) => {
  emit('toggleLike', commentId);
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

.reply-input {
  margin-top: 4px;
  display: flex;
  gap: 6px;
}

.comment-actions {
  margin-top: 4px;
}

.child-comments {   
  margin-top: 8px;
  border-left: 4px solid #f0f0f0;
  padding-left: 0px;
}
</style>