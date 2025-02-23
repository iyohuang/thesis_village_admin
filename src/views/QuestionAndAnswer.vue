<template>
    <div class="qa-container">
        <a-layout class="qa-layout">
            <!-- 左侧标签栏 -->
            <a-layout-sider width="200" theme="light" class="tag-sider">
                <div class="tag-header">问题分类</div>
                <a-menu v-model:selectedKeys="selectedTags" mode="vertical" @click="handleTagClick">
                    <a-menu-item v-for="tag in sortedTags" :key="tag.id">
                        <template #icon><tag-outlined /></template>
                        {{ tag.name }} ({{ tagCountMap[tag.id] || 0 }})
                    </a-menu-item>
                </a-menu>
            </a-layout-sider>

            <!-- 右侧内容区 -->
            <a-layout-content class="content-area">
                <!-- 提问表单 -->
                <a-card name="questionForm" class="ask-card" title="我要提问">
                    <a-form :model="newQuestion" :rules="myrules" @finish="submitQuestion">
                        <a-form-item name="title" label="问题标题" required>
                            <a-input v-model:value="newQuestion.title" placeholder="请输入问题标题" :maxlength="50"
                                show-count />
                        </a-form-item>

                        <a-form-item name="content" label="问题描述" required>
                            <a-textarea v-model:value="newQuestion.content" :auto-size="{ minRows: 3, maxRows: 6 }"
                                placeholder="请详细描述您的问题" :maxlength="500" show-count />
                        </a-form-item>

                        <a-form-item name="tags" label="选择标签" required>
                            <a-select v-model:value="newQuestion.tags" mode="tags" style="width: 100%"
                                placeholder="选择或输入新标签" :options="tagOptions" :token-separators="[',']"
                                allow-clear></a-select>
                        </a-form-item>
                        <a-form-item label="添加附件">
                            <CommentEditor ref="questionEditor" :enable-comment="false"
                                @files-change="handleFilesChange" @file-uploaded="handleFileUploaded" />
                        </a-form-item>
                        <a-button type="primary" html-type="submit" :loading="submitting" @click="submitQuestion">
                            提交问题
                        </a-button>
                    </a-form>
                </a-card>

                <!-- 问题列表 -->
                <a-list class="question-list" item-layout="vertical" :data-source="filteredQuestions" :loading="loading"
                    @change="handlePageChange" :pagination="{
                        ...pagination,
                        onChange: handlePageChange
                    }">
                    <template #renderItem="{ item }">
                        <a-list-item>
                            <a-list-item-meta>
                                <template #title>
                                    <router-link :to="`/questions/${item.qid}`" class="question-title">
                                        {{ item.title }}
                                    </router-link>
                                    <div class="tag-list">
                                        <a-tag v-for="tagId in item.tags" :key="tagId" color="blue">
                                            {{ getTagName(tagId) }}
                                        </a-tag>
                                    </div>
                                </template>

                                <template #description>
                                    <div class="question-content">{{ previewContent(item.content) }}</div>
                                
                                    <FilePreview :files="item.files" :filetype="item.filetype" /> 
                                    <div class="question-meta">
                                        <span class="author">提问者：{{ item.authorName }}</span>
                                        <span class="answers">回答数：{{ item.answerCount }}</span>
                                        <span class="time">{{ formatTime(item.createdAt) }}</span>
                                    </div>
                                </template>
                            </a-list-item-meta>

                            <!-- 回答预览 -->
                            <!-- <div class="answer-preview">
                                <div v-for="answer in item.answers.slice(0, 2)" :key="answer.id" class="answer-item">
                                    <a-comment>
                                        <template #avatar>
                                            <a-avatar :src="answer.avatar" />
                                        </template>
                                        <template #author>
                                            <span>{{ answer.author }}</span>
                                            <a-tag v-if="answer.accepted" color="green">
                                                <template #icon><check-circle-outlined /></template>
                                                已采纳
                                            </a-tag>
                                        </template>
                                        <template #content>
                                            <div class="answer-content">
                                                {{ previewContent(answer.content) }}
                                                <FilePreview :files="answer.files" />
                                            </div>
                                        </template>
                                        <template #datetime>
                                            <span>{{ formatTime(answer.createTime) }}</span>
                                        </template>
                                    </a-comment>
                                </div>

                                <a-button v-if="item.answerCount > 2" type="link"
                                    @click="$router.push(`/questions/${item.id}`)" class="view-all-answers">
                                    查看全部{{ item.answerCount }}个回答 →
                                </a-button>
                            </div> -->
                        </a-list-item>
                    </template>
                </a-list>
            </a-layout-content>
        </a-layout>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { TagOutlined, CheckCircleOutlined } from '@ant-design/icons-vue';
import { getTags, getQuestions, createQuestion } from '@/api/aq';
import CommentEditor from '@/views/CommentEditor.vue';
import FilePreview from '@/views/FilePreview.vue';

interface FileItem {
    uid: string;
    type: 'image' | 'pdf' | 'video';
    url: string;
    name?: string;
    status?: 'uploading' | 'done' | 'error';
    percent?: number;
}

interface Tag {
    id: number;
    name: string;
}

interface Answer {
    id: string;
    content: string;
    author: string;
    avatar: string;
    accepted: boolean;
    images: string[];
    createTime: string;
}

interface Question {
    id: string;
    qid: string;
    title: string;
    content: string;
    tags: number[];
    authorName: string;
    answerCount: number;
    createdAt: string;
    files: string[];
    filetype: string;
    answers: Answer[];
}

// 存储所有上传文件的信息
const uploadedFiles = ref<Array<{
    url: string;
    name: string;
    uid: string;
}>>([]);

// 状态管理
const loading = ref(true);
const submitting = ref(false);
const tags = ref<Tag[]>([]);

const questions = ref<Question[]>([
    {
        id: 'q1',
        title: '水稻种植的最佳施肥时间？',
        content: '请问在长江中下游地区，水稻种植的基肥和追肥的最佳施用时间分别是什么时候？需要特别注意哪些事项？',
        tags: ['1', '5'],
        author: '张大叔',
        answerCount: 3,
        createTime: '2024-03-20T09:00:00',
        answers: [
            {
                id: 'a1',
                content: '基肥建议在插秧前7-10天施用，追肥分两次：分蘖期和孕穗期。注意根据土壤肥力调整用量，推荐使用测土配方施肥技术...',
                author: '农技专家王老师',
                avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
                accepted: true,
                images: [
                    'https://example.com/fert1.jpg',
                    'https://example.com/fert2.jpg'
                ],
                createTime: '2024-03-20T10:30:00'
            },
            {
                id: 'a2',
                content: '我们合作社的做法是：基肥用有机肥+复合肥，追肥主要看叶色变化...',
                author: '合作社李主任',
                avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
                accepted: false,
                images: [],
                createTime: '2024-03-20T11:15:00'
            }
        ],
        attachments: [
            {
                uid: 'f1',
                type: 'pdf',
                url: 'https://example.com/rice-guide.pdf',
                name: '水稻种植手册.pdf'
            }
        ]
    },
    {
        id: 'q2',
        title: '如何申请农业补贴？',
        content: '今年最新的农业补贴政策有哪些变化？申请流程和需要准备的材料有什么更新吗？',
        tags: ['2', '3'],
        author: '王会计',
        answerCount: 2,
        createTime: '2024-03-19T14:20:00',
        answers: [
            {
                id: 'a3',
                content: '2024年主要变化包括：1. 新增智慧农业补贴项目 2. 申报材料电子化 3. 审批时限缩短至20个工作日...',
                author: '政策解读张主任',
                avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
                accepted: true,
                images: [
                    'https://example.com/policy1.jpg'
                ],
                createTime: '2024-03-19T15:45:00',
                comments: [
                    {
                        id: 'c1',
                        content: '请问养殖户可以申请吗？',
                        author: '李养殖户',
                        createdAt: '2024-03-19T16:00:00',
                        replies: [
                            {
                                id: 'c1-1',
                                content: '养殖类补贴在第三章有专门说明',
                                author: '政策解读张主任',
                                createdAt: '2024-03-19T16:15:00'
                            }
                        ]
                    }
                ]
            }
        ],
        attachments: [
            {
                uid: 'f2',
                type: 'video',
                url: 'https://example.com/subsidy-video.mp4',
                name: '申报流程演示.mp4',
                duration: 120
            }
        ]
    }
]);
const selectedTags = ref<number[]>([]);
const questionFiles = ref<FileItem[]>([]);
const newQuestion = ref({
    title: '',
    content: '',
    tags: [],
    fileType: ''
});
const myrules = {
    title: [{ required: true, message: '请输入问题标题' }],
    content: [{ required: true, message: '请填写问题描述' }],
    tags: [{ type: 'array', required: true, message: '请选择至少一个标签' }]
};
const questionEditor = ref<InstanceType<typeof CommentEditor>>();

//假数据



// 分页配置
const pagination = ref({
    pageSize: 10,
    current: 1,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50']
});

const handlePageChange = (page: number, pageSize: number) => {
    pagination.value.current = page;
    pagination.value.pageSize = pageSize;
    loadData();
};

// 计算属性
const sortedTags = computed(() => {
    return [...tags.value].sort((a, b) => a.name.localeCompare(b.name));
});

const tagOptions = computed(() => {
    return tags.value.map(tag => ({
        value: tag.name,
        label: tag.name
    }));
});

const tagCountMap = computed(() => {
    return questions.value.reduce((acc: Record<string, number>, q) => {
        q.tags.forEach(tagId => {
            acc[tagId] = (acc[tagId] || 0) + 1;
        });
        return acc;
    }, {});
});

const filteredQuestions = computed(() => {
    if (!selectedTags.value.length) return questions.value;
    console.log("selectedTags.value:", selectedTags.value);

    return questions.value.filter(q =>
        q.tags.some(tagId => selectedTags.value.includes(tagId))
    );
});

const formatTime = (time: string) => {
    return new Date(time).toLocaleString();
};

// 方法

const previewContent = (text: string) => {
    return text.length > 100 ? text.slice(0, 100) + '...' : text;
};



const getTagName = (tagId: number) => {
    return tags.value.find(t => t.id == tagId)?.name || '未知标签';
};

const handleTagClick = ({ key }: { key: number }) => {
    selectedTags.value = [key];
    console.log('Filtered Questions:', filteredQuestions.value);
};

const loadData = async () => {
    try {
        loading.value = true;

        // 并行获取标签和问题
        const [tagsRes, questionsRes] = await Promise.all([
            getTags(),
            getQuestions({
                page: pagination.value.current,
                pageSize: pagination.value.pageSize,
                tagIds: selectedTags.value
            })
        ]);

        console.log('tagsRes.data:', tagsRes.data);
        console.log('questionsRes.data:', questionsRes.data);

        // 更新标签数据
        tags.value = tagsRes.data;

        // 处理问题数据
        questions.value = questionsRes.data.records.map(item => {
            if (typeof item.files === 'string') {
                try {
                    // 将 images 字符串转换为数组
                    item.files = JSON.parse(item.files);
                } catch (error) {
                    console.error('解析 files 失败：', error);
                    item.files = [];
                }
            }
            return item;
        });
        console.log('处理后的问题数据:', questions.value);
        // 设置分页总数
        pagination.value.total = questionsRes.data.total;

    } catch (error) {
        message.error('数据加载失败，请稍后再试');
        console.error('加载问题数据时发生错误:', error);
    } finally {
        loading.value = false;
    }
};

// 处理单个文件上传成功
const handleFileUploaded = (fileInfo) => {
    uploadedFiles.value.push({
        url: fileInfo.url,
        name: fileInfo.name,
        uid: fileInfo.uid
    });
    newQuestion.value.fileType = fileInfo.type
};

// 处理文件列表变化（比如删除文件时）
const handleFilesChange = (fileList) => {
    // 根据最新的 fileList 更新 uploadedFiles
    uploadedFiles.value = uploadedFiles.value.filter(file =>
        fileList.some(f => f.uid === file.uid)
    );
};

const handleQuestionFiles = (files: FileItem[]) => {
    questionFiles.value = files;
};

// 提交问题时使用
const submitQuestion = async () => {
    if(!newQuestion.value.content.trim()&&!newQuestion.value.title.trim()){
        return;
    }
    if(!newQuestion.value.content.trim()){
        message.error('请输入问题内容');
        return;
    }
    if(!newQuestion.value.title.trim()){
        message.error('请输入问题标题');
        return;
    }

    try {
        await createQuestion({
            title: newQuestion.value.title,
            content: newQuestion.value.content,
            tags: newQuestion.value.tags,
            files: uploadedFiles.value.map(file => file.url), // 提交所有文件URL
            filetype : newQuestion.value.fileType
        });

        // 提交成功后清空文件列表
        uploadedFiles.value = [];

    } catch (error) {
        console.error('提交失败:', error);
    }
};


const handleSubmit = async () => {
    try {
        // 收集文件信息
        const files = questionFiles.value.map(f => ({
            type: f.type,
            url: f.url
        }));

        await createQuestion({
            title: newQuestion.value.title,
            content: newQuestion.value.content,
            tags: newQuestion.value.tags,
            files // 添加文件参数
        });

        // 重置表单
        questionFiles.value = [];
        questionEditor.value?.reset();
    } catch (error) {
        // 错误处理
    }
};


// 初始化
onMounted(() => {
    loadData();
});
</script>

<style scoped>
.qa-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.tag-sider {
    border-right: 1px solid #f0f0f0;
    background: #fff;
}

.tag-header {
    padding: 16px;
    font-weight: 600;
    border-bottom: 1px solid #f0f0f0;
    background: #fafafa;
}

.content-area {
    padding: 0 24px;
    background: #fff;
}

.ask-card {
    margin-bottom: 24px;
    border-radius: 8px;
}

.question-title {
    font-size: 16px;
    font-weight: 500;
    margin-right: 12px;
}

.tag-list {
    margin-top: 8px;
}

.question-content {
    color: rgba(0, 0, 0, 0.85);
    margin: 8px 0;
    line-height: 1.6;
}

.question-meta {
    display: flex;
    gap: 16px;
    color: rgba(0, 0, 0, 0.45);
    font-size: 12px;

    .author {
        color: #1890ff;
    }
}

.answer-preview {
    margin-top: 16px;
    border-top: 1px dashed #f0f0f0;
    padding-top: 16px;
}

.answer-content {
    color: rgba(0, 0, 0, 0.85);
    line-height: 1.6;
}

.preview-images {
    margin-top: 8px;
    display: flex;
    gap: 8px;
}

.view-all-answers {
    margin-top: 8px;
    padding-left: 0;
}
</style>