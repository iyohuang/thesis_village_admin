<template>
    <div class="question-detail-container">
        <!-- 问题详情 -->
        <ArrowLeftOutlined type="link" @click="goBack" class="back-button">
            返回
        </ArrowLeftOutlined>
        <a-button type="link" @click="goBack" class="back-button">
            返回
        </a-button>
        <a-card class="question-card" :loading="loading">
            <template #title>

                <h1 class="question-title">{{ question.title }}</h1>
                <div class="question-meta">
                    <span class="author">提问者：
                        <a-avatar :src="question.authorAvatar" :size="40" class="author-avatar" />
                        {{ question.authorName }}</span>
                    <span class="time">{{ formatTime(question.createdAt) }}</span>
                    <a-tag v-for="tagId in question.tags" :key="tagId" color="blue">
                        {{ getTagName(tagId) }}
                    </a-tag>
                </div>
            </template>

            <div class="question-content">
                {{ question.content }}
                <FilePreview :files="question.files" :filetype="question.filetype" class="attachment-section" />
            </div>
        </a-card>


        <!-- 回答表单 -->
        <a-card class="answer-form">
            <h2 class="section-title">撰写回答</h2>
            <CommentEditor ref="answerEditor" :enable-comment="true" :show-submit-button="true"
                @submit="handleAnswerSubmit" @file-uploaded="handleFileUploaded" />
        </a-card>

        <!-- 回答列表 -->
        <div class="answers-section">
            <h2 class="section-title">回答（{{ question.answers.length }}）</h2>
            <a-list item-layout="vertical" :data-source="question.answers">
                <template #renderItem="{ item }">
                    <a-list-item>
                        <a-comment>
                            <template #avatar>
                                <a-avatar :src="item.authorAvatar" />
                            </template>
                            <template #author>
                                <span>{{ item.authorName }}</span>
                                <a-tag v-if="item.accepted" color="green">
                                    <template #icon><check-circle-outlined /></template>
                                    已采纳
                                </a-tag>
                            </template>
                            <template #content>
                                <div class="answer-content">
                                    {{ item.content }}
                                    <FilePreview :files="item.files" :filetype="item.filetype" />
                                </div>
                            </template>
                            <!-- 新增的actions插槽包含回复按钮 -->
                            <template #actions>
                                <span class="comment-action" @click="handleReply(item)">
                                    <a-button type="link">回复</a-button>
                                </span>
                                <!-- 可以继续添加其他操作按钮 -->
                            </template>

                            <template #datetime>
                                <span>{{ formatTime(item.createdAt) }}</span>
                            </template>
                        </a-comment>

                        <!-- 回复输入框 -->
                        <div v-if="activeReplyId === item.id" class="reply-box">
                            <a-textarea v-model:value="item.replyContent" placeholder="输入你的回复..." :rows="3" />
                            <div class="reply-actions">
                                <a-button type="primary" @click="handleReplySubmit(item)">
                                    发送回复
                                </a-button>
                                <a-button @click="activeReplyId = null">取消</a-button>
                            </div>
                        </div>

                        <!-- 回答的评论区 -->
                        <div class="answers-child" v-if="item.children && item.children.length">
                            <AnswerItem v-for="child in item.children" :key="child.answerId" :answers="child" :qid="qid" />
                        </div>
                    </a-list-item>
                </template>
            </a-list>
        </div>

    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeftOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { defineProps } from 'vue';
import { getTags, getQuestionDetail, submitAnswer, getAnswersForQuestion } from '@/api/aq';
//   import { getQuestionDetail, submitAnswer } from '@/api/qna';
import FilePreview from '@/views/FilePreview.vue';
import CommentEditor from '@/views/CommentEditor.vue';
import AnswerItem from '@/views/AnswerItem.vue';

interface Tag {
    id: number;
    name: string;
}
const tags = ref<Tag[]>([]);
// 当前正在显示回复框的回答ID
const activeReplyId = ref(null)

interface Question {
    id: number;
    qid: string;
    title: string;
    content: string;
    tags: number[];
    authorName: string;
    authorAvatar: string;
    createdAt: string;
    files: string[];
    filetype: string;
    answers: Answer[];
}

interface Answer {
    id: string;
    answerId: string;
    qid: string;
    title: string;
    content: string;
    tags: number[];
    authorName: string;
    authorAvatar: string;
    parentUserName: string;
    createdAt: string;
    files: string[];
    filetype: string;
    children: Answer[];
}



const route = useRoute();
const router = useRouter();
const goBack = () => {
    router.go(-1); // 返回上一页
};
//提取路径中的参数
const qid = route.params.qid as string;

// 状态管理
const loading = ref(true);
const question = ref<Question>({
    qid: '',
    title: '',
    content: '',
    tags: [],
    authorName: '',
    createdAt: '',
    files: [],
    filetype: '',
    answers: []
});
const answers = ref<Answer[]>([]);
const answerEditor = ref<InstanceType<typeof CommentEditor>>();
const newAnswer = ref({
    content: '',
    fileType: ''
});
const uploadedFiles = ref<Array<{
    url: string;
    name: string;
    uid: string;
}>>([]);
// 初始化加载数据
const loadData = async () => {
    try {
        loading.value = true;
        const [questionRes, tagsRes] = await Promise.all([
            getQuestionDetail(qid),
            getTags()
        ]);
        console.log('问题详情:', questionRes.data);
        questionRes.data.files = JSON.parse(questionRes.data.files);
        question.value = questionRes.data;
        tags.value = tagsRes.data;
    } catch (error) {
        message.error('加载问题详情失败');
    } finally {
        loading.value = false;
    }
    try {
        console.log("加载问题回答");
        let resanswers = await getAnswersForQuestion(qid);
        // console.log("问题回答", resanswers.data);
        if (resanswers.code === 200) {
            question.value.answers = resanswers.data.map(item => {
                if (typeof item.files === 'string') {
                    try {
                        item.files = JSON.parse(item.files);
                    } catch (error) {
                        console.error('解析 files 失败：', error);
                        item.files = [];
                    }
                }
                return item;
            });
        } else {
            question.value.answers = [];
        }
    } catch (error) {
        message.error('加载问题回答失败');
        question.value.answers = [];
    }

};

//单个文件上传触发
const handleFileUploaded = (fileInfo) => {
    uploadedFiles.value.push({
        url: fileInfo.url,
        name: fileInfo.name,
        uid: fileInfo.uid
    });
    newAnswer.value.fileType = fileInfo.type
};

// 提交回答
const handleAnswerSubmit = async (cont) => {
    try {
        await submitAnswer({
            qid: qid,
            content: cont,
            filetype: newAnswer.value.fileType,
            files: uploadedFiles.value.map(file => file.url)
        });
        message.success('回答提交成功');
        location.reload();
    } catch (error) {
        message.error('回答提交失败');
    }
};

// 工具函数
const formatTime = (time: string) => {
    return new Date(time).toLocaleString();
};

const getTagName = (tagId: number) => {
    // 需要从全局状态或API获取标签名称
    console.log('tags:', tags.value);
    return tags.value.find(t => t.id == tagId)?.name || '未知标签';
};

// 处理回复按钮点击
const handleReply = (item) => {
    if (activeReplyId.value === item.id) {
        // 如果点击的是已激活的回答，则关闭
        activeReplyId.value = null
    } else {
        // 否则打开当前回答的回复框
        activeReplyId.value = item.id
    }
}

// 处理回复提交
const handleReplySubmit = async(item) => {
    console.log('提交回复:', {
        answerId: item.id,
        content: item.replyContent,
        parentId: item.answerId
    })
    // 这里添加实际提交逻辑
    try {
        await submitAnswer({
            qid: qid,
            content: item.replyContent,
            parentId: item.answerId
        });
        message.success('回答提交成功');
        location.reload();
    } catch (error) {
        message.error('回答提交失败');
    }
    // 提交成功后重置状态
    item.replyContent = ''
    activeReplyId.value = null
}

onMounted(() => {
    loadData();
});
</script>

<style scoped>
.author-avatar {
    flex-shrink: 0;
}

.back-button {
    margin-bottom: 0px;
    padding-left: 0;
    color: rgba(0, 0, 0, 0.45);

    &:hover {
        color: #1890ff;
    }
}

.question-detail-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.question-title {
    font-size: 24px;
    margin-top: 12px;
    margin-bottom: 8px;
}

.question-meta {
    margin-bottom: 16px;
    font-size: 14px;
    color: #666;

    span {
        margin-right: 16px;
    }
}

.question-content {
    font-size: 16px;
    line-height: 1.8;
    margin-bottom: 24px;
}

.attachment-section {
    margin-top: 20px;
}

.section-title {
    font-size: 20px;
    margin: 0px 0 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eee;
}

.answer-form {
    margin-top: 32px;
}

.comments-section {
    margin-left: 40px;
    border-left: 2px solid #f0f0f0;
    padding-left: 20px;
}

.question-comments {
    margin-top: 40px;
}

.comment-action {
    margin-left: 4px;
    cursor: pointer;
}

.comment-action:hover {
    color: #1890ff;
}

.reply-box {
    margin: 0px 0 0 20px;
    /* border-left: 3px solid #f0f0f0; */
    padding-left: 35px;
}

.reply-actions {
    margin-top: 5px;
    margin-bottom: 25px;
    display: flex;
    gap: 8px;
}

.answers-child {
    margin-left: 40px;
    border-left: 2px solid #f0f0f0;
    padding-left: 20px;
}
</style>