<template>
  <div class="post-container">
    <!-- 发布动态区域 -->
    <a-card title="分享新鲜事" class="post-editor">
      <a-textarea v-model:value="newPost.content" placeholder="这一刻的想法..." :auto-size="{ minRows: 3 }" />
      <!-- 图片上传 -->
      <a-upload accept="image/jpeg,image/png,image/gif,image/webp" v-model:fileList="fileList" list-type="picture-card" multiple :before-upload="beforeUpload"
        :customRequest="customRequest" @change="handleImageChange" :maxCount="9">
        <div v-if="newPost.images.length < 9">
          <plus-outlined />
          <div class="ant-upload-text">添加图片</div>
        </div>
      </a-upload>
      <a-button type="primary" @click="submitPost" :loading="posting">发布</a-button>
    </a-card>

    <!-- 动态列表 -->
    <div class="post-list">
      <a-list item-layout="vertical" :data-source="posts">
        <template #renderItem="{ item }">
          <a-list-item class="post-item">
            <!-- 用户信息 -->
            <template #extra>
              <a-button v-if="item.userId === currentUserId" @click="deletePost(item.id)">删除</a-button>
            </template>
            <a-list-item-meta :description="formatTime(item.createdAt)">
              <template #title>
                <a-avatar :src="item.userAvatar" />
                <span class="username">{{ item.userName }}</span>
              </template>
            </a-list-item-meta>

            <!-- 动态内容 -->
            <div class="post-content">{{ item.content }}</div>

            <!-- 图片展示 -->
            <div class="post-images" v-if="item.images && item.images.length">
              <a-image v-for="(img, index) in item.images" :key="index" :width="100" :src="img" :preview="true" />
            </div>

            <!-- 互动操作 -->
            <div class="post-actions">
              <a-button type="link" @click="toggleLike(item.id)">
                <heart-outlined :style="{ color: item.liked ? 'red' : '' }" />
                {{ item.likesCount }}
              </a-button>
              <a-button type="link" @click="setActivePost(item.id)">评论</a-button>
            </div>

            <!-- 嵌套评论列表 -->
            <div class="comment-list">
              <CommentList v-for="comment in item.comments" :key="comment.id" :comment="comment"
                :currentUserId="currentUserId" @reply="handleReply" @toggleLike="handleCommentLike" />
            </div>

            <!-- 评论输入框 -->
            <a-input v-if="activePostId === item.id" v-model:value="newComment" placeholder="写下你的评论..."
              @pressEnter="submitComment(item.id)" />
          </a-list-item>
        </template>
      </a-list>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { PlusOutlined, HeartOutlined } from '@ant-design/icons-vue';
import { Modal, message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { getMoments, createMoment, deleteMoment, toggleMomentLike, commentPost, uploadMomentPic, getCommentsForMoment, toggleCommentLike } from '@/api/social.js';
import CommentList from './CommentList.vue'; // 递归组件
import useUserInfoStore from '@/store/userInfo.js'
const userInfoStore = useUserInfoStore();
const currentUserId = userInfoStore.info.id

const router = useRouter();

const posts = ref([]);
const posting = ref(false);
// 新动态内容
const newPost = ref({
  content: '',
  images: []
});
const fileList = ref([]);

// 新评论内容（全局管理，每个动态单独输入时通过 activePostId 判断）
const newComment = ref('');
const activePostId = ref<number | null>(null);


const fetchMoments = async () => {
  const res = await getMoments();
  // console.log("获取动态列表：", res);
  posts.value = res.data;
  posts.value = res.data.map(item => {
    if (typeof item.images === 'string') {
      try {
        // 将 images 字符串转换为数组
        item.images = JSON.parse(item.images);
      } catch (error) {
        console.error('解析 images 失败：', error);
        item.images = [];
      }
    }
    return item;
  });
  await Promise.all(posts.value.map(async (post) => {
    try {
      // 假设 getCommentsForMoment 返回的数据格式为 { code: 200, message: "", data: [...] }
      let commentsRes = await getCommentsForMoment(post.id, currentUserId);
      console.log(`加载动态ID ${post.id} 评论结果：`, commentsRes);
      if (commentsRes.code === 200) {
        post.comments = commentsRes.data;
      } else {
        post.comments = [];
      }
    } catch (error) {
      console.error(`加载动态ID ${post.id} 评论失败:`, error);
      post.comments = [];
    }
  }));
};

// 加载假数据（实际中应调用接口）
onMounted(() => {
  //模拟加载假数据，包含嵌套评论
  // posts.value = [
  //   {
  //     id: 1,
  //     userId: 1,
  //     userAvatar: "https://dummyimage.com/40x40/000/fff.png&text=U1",
  //     userName: "张三",
  //     createdAt: new Date().toISOString(),
  //     content: "这是一条测试动态，欢迎大家关注！",
  //     images: ["https://dummyimage.com/100x100/000/fff.png&text=Img1"],
  //     liked: false,
  //     likesCount: 5,
  //     comments: [
  //       {
  //         id: 101,
  //         userId: 2,
  //         userAvatar: "https://dummyimage.com/30x30/000/fff.png&text=U2",
  //         userName: "李四",
  //         content: "不错的动态！",
  //         createdAt: new Date().toISOString(),
  //         likesCount: 2,
  //         liked: false,
  //         parentId: null, // 顶级评论，无父评论
  //         // 对于顶级评论，不需要 parentUserName
  //         children: [
  //           {
  //             id: 201,
  //             userId: 3,
  //             userAvatar: "https://dummyimage.com/30x30/000/fff.png&text=U3",
  //             userName: "王五",
  //             content: "我也觉得不错",
  //             createdAt: new Date().toISOString(),
  //             likesCount: 1,
  //             liked: false,
  //             parentId: 101,
  //             parentUserName: "李四", // 子评论显示“王五 回复了 李四”
  //             children: [] // 继续嵌套的子评论可以继续添加此字段
  //           }
  //         ]
  //       }
  //     ]
  //   },
  //   {
  //     id: 2,
  //     userId: 2,
  //     userAvatar: "https://dummyimage.com/40x40/000/fff.png&text=U2",
  //     userName: "李四",
  //     createTime: new Date().toISOString(),
  //     content: "今天心情很好，分享一张美图。",
  //     images: [
  //       "https://dummyimage.com/100x100/ff0000/fff.png&text=Img2",
  //       "https://dummyimage.com/100x100/00ff00/fff.png&text=Img3"
  //     ],
  //     liked: true,
  //     likesCount: 10,
  //     comments: [] // 无评论
  //   }
  // ];
  fetchMoments();
  // console.log(posts.value);
});


// 图片上传前校验
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件！');
    return Promise.reject(false);
  }
  return true;
};


// 图片上传（此处只模拟上传逻辑）
const handlePreview = (file: any) => {
  console.log("预览图片", file);
};

const customRequest = async ({ file, onSuccess, onError }: any) => {
  try {
    const formData = new FormData();
    formData.append("images", file);

    const res = await uploadMomentPic(formData);
    console.log("上传返回结果：", res);

    // 确保 `res.data` 是数组，并追加所有返回的图片 URL
    if (res.data && Array.isArray(res.data)) {
      newPost.value.images = [...newPost.value.images, ...res.data];
    } else if (res.data) {
      // 若 `res.data` 只是一个字符串（单个图片 URL），也要追加
      newPost.value.images.push(res.data);
    }

    onSuccess({
      status: "success",
      url: res.data[0] || res.data, // 取第一个 URL 或单个 URL
      name: file.name,
      uid: file.uid
    }, file);
  } catch (error) {
    console.error("上传失败:", error);
    onError(error);
    message.error("上传失败，请重试");
  }
};



const submitPost = async () => {

  const payload = {
    content: newPost.value.content,
    images: newPost.value.images // 直接传递数组
  };

  try {
    posting.value = true;
    await createMoment(payload);
    message.success('发布成功');

    newPost.value = { content: '', images: [] };
    fileList.value = []; // 清空上传列表
    location.reload()
  } catch (error) {
    message.error('发布失败');
  } finally {
    posting.value = false;
  }
};

const deletePost = async (id: number) => {
  Modal.confirm({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除吗？',
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = await deleteMoment(id);
        if (res.code === 200) {
          message.success('删除成功');
          // 这里可以触发刷新数据的操作，比如重新请求帖子列表
        } else {
          message.error('删除失败，请稍后重试');
        }
        location.reload();
      } catch (error) {
        message.error('删除失败，请检查网络');
      }
    },
  });
};

// 监听 Upload 组件的 change 事件
const handleImageChange = ({ fileList: newFileList }: any) => {
  console.log("图片上传变化", newFileList);

  // 过滤
  fileList.value = newFileList.filter((file: any) => file.status !== "error" && file.type !== "application/pdf");

  // 确保 images 只存储字符串 URL
  newPost.value.images = newFileList
    .filter((file: any) => file.status === "done" && file.response && file.response.url )
    .map((file: any) => file.response.url);

  console.log("当前已上传图片列表：", newPost.value.images);
};

// 点赞/取消点赞
const toggleLike = async (postId: number) => {
  await toggleMomentLike(postId, currentUserId);
  const post = posts.value.find(p => p.id === postId);
  if (post) {
    post.liked = !post.liked;
    post.likesCount += post.liked ? 1 : -1;
  }
};

// 设置当前激活评论的帖子ID（显示评论输入框）
const setActivePost = (postId: number) => {
  activePostId.value = postId;
};

// 提交评论（顶级评论）
const submitComment = async (postId: number) => {
  if (!newComment.value.trim()) return;
  await commentPost(postId, { content: newComment.value, userId: currentUserId, parentId: null });
  message.success('评论成功');
  newComment.value = '';
  // 重新加载评论数据（实际应调用接口）
};

// 处理回复（子评论回复），设置父评论ID（由递归组件传递）
const handleReply = async (momentId: number,parentCommentId: number, replyContent: string) => {
  if (!replyContent.trim()) return;
  // 使用 activePostId.value 作为当前动态的 ID
  // console.log("当前动态的 ID：", activePostId.value);
  console.log("回复内容：", replyContent);
  console.log("父评论 ID：", parentCommentId);
  console.log("当前动态的 ID：", momentId);
  console.log("当前用户的 ID：", currentUserId);
  await commentPost(momentId, { content: replyContent, userId: currentUserId, parentCommentId: parentCommentId });
  message.success('回复成功');
  // 此处可以重新加载评论数据
};


// 处理评论点赞（交由递归组件传递）
const handleCommentLike = async (commentId: number) => {
  await toggleCommentLike(commentId, currentUserId); // 此处可以调用专门的评论点赞接口
  // 实际上应刷新评论数据或局部更新
};

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString();
};


</script>

<style scoped>
.post-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.post-editor {
  margin-bottom: 24px;
}

.post-item {
  background: #fff;
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.username {
  margin-left: 8px;
  font-weight: 500;
}

.post-content {
  margin: 12px 0;
  white-space: pre-line;
}

.post-images {
  margin: 12px 0;
}

.post-actions {
  margin-top: 12px;
}

.comment-list {
  margin-top: 12px;
}
</style>
