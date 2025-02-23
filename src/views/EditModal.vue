<template>
    <div class="modal" v-if="isVisible">
        <div class="modal-content">
            <h2>{{ isEdit ? '编辑' : '新增' }} 信息</h2>
            <form @submit.prevent="handleSubmit">
                <div>
                    <label for="name">姓名:</label>
                    <input type="text" id="name" v-model="formData.name" placeholder="请输入姓名" required />
                </div>
                <div>
                    <label for="age">年龄:</label>
                    <input type="number" id="age" v-model="formData.age" placeholder="请输入年龄" required />
                </div>
                <button type="submit">{{ isEdit ? '更新' : '保存' }}</button>
                <button @click="closeModal">关闭</button>
            </form>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        // 控制模态框是否显示
        isVisible: {
            type: Boolean,
            required: true
        },
        // 编辑时传递的当前数据（新增时为 null 或 undefined）
        initialData: {
            type: Object,
            default: () => null
        }
    },
    data() {
        return {
            // 控制表单数据
            formData: {
                name: '',
                age: ''
            }
        };
    },
    computed: {
        // 是否是编辑模式
        isEdit() {
            return this.initialData !== null;
        }
    },
    watch: {
        // 当传入的新数据变化时，更新表单数据
        initialData(newData) {
            if (newData) {
                this.formData = { ...newData };
            }
        }
    },
    methods: {
        // 提交表单时触发
        handleSubmit() {
            this.$emit('submit', this.formData);
            this.closeModal();
        },
        // 关闭模态框
        closeModal() {
            this.$emit('update:isVisible', false);
        }
    }
};
</script>

<style scoped>
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 300px;
}

form div {
    margin-bottom: 10px;
}

button {
    margin-top: 10px;
}
</style>