<!-- CommentTree.vue -->
<template>
  <div class="comment-tree">
    <div v-for="comment in comments" :key="comment.id" class="comment-node">
      <a-comment>
        <template #avatar>
          <a-avatar :src="comment.avatar" />
        </template>
        <template #author>
          {{ comment.author }}
          <span class="reply-time">{{ formatTime(comment.createdAt) }}</span>
        </template>
        <template #content>
          <p>{{ comment.content }}</p>
          <a-button v-if="!showReplyInput" type="link" size="small" @click="toggleReply(comment.id)">
            回复
          </a-button>
          <div v-if="activeReply === comment.id" class="reply-input">
            <a-textarea v-model:value="replyContent" placeholder="输入回复内容" :auto-size="{ minRows: 1 }" />
            <div class="action-buttons">
              <a-button type="primary" size="small" @click="submitReply(comment.id)">
                提交
              </a-button>
              <a-button size="small" @click="cancelReply">取消</a-button>
            </div>
          </div>
        </template>
      </a-comment>

      <!-- 嵌套回复 -->
      <div v-if="comment.replies?.length" class="nested-replies">
        <comment-tree :comments="comment.replies" @reply="handleNestedReply(comment.id, $event)" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps({
  comments: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['reply']);

const activeReply = ref<string | null>(null);
const replyContent = ref('');

const toggleReply = (commentId: string) => {
  activeReply.value = activeReply.value === commentId ? null : commentId;
};

const submitReply = (parentId: string) => {
  if (replyContent.value.trim()) {
    emit('reply', parentId, replyContent.value);
    replyContent.value = '';
    activeReply.value = null;
  }
};

const handleNestedReply = (parentId: string, content: string) => {
  emit('reply', parentId, content);
};
</script>