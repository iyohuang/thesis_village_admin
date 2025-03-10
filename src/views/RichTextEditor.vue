<!-- components/RichTextEditor.vue -->
<template>
  <div class="rich-editor-container">
    <Toolbar
      class="editor-toolbar"
      :editor="editorRef"
      :mode="mode"
    />
    <Editor
      class="editor-content"
      :mode="mode"
      v-model="editorHtml"
      @onCreated="handleCreated"
      @onDestroyed="handleDestroyed"
    />
  </div>
</template>

<script setup>
import { ref, shallowRef, onBeforeUnmount, computed } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css' // 关键样式引入

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  mode: {
    type: String,
    default: 'default' // 或 'simple'
  }
})

const emit = defineEmits(['update:modelValue'])

// 编辑器实例引用
const editorRef = shallowRef(null)
// 编辑器内容
const editorHtml = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 创建编辑器回调
const handleCreated = (editor) => {
  editorRef.value = editor
  console.log('Editor created:', editor)
}

// 销毁编辑器回调
const handleDestroyed = () => {
  console.log('Editor destroyed')
}

// 组件卸载时销毁编辑器
onBeforeUnmount(() => {
  if (!editorRef.value) return
  editorRef.value.destroy()
  editorRef.value = null
})
</script>

<style scoped>
.rich-editor-container {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.editor-toolbar {
  border-bottom: 1px solid #d9d9d9;
}

.editor-content {
  height: 300px;
  overflow-y: hidden;
}
</style>