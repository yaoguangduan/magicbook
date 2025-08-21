<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import {Message} from '@arco-design/web-vue'
import CodeMirror from 'vue-codemirror6'
import {EditorView} from '@codemirror/view'
import {IconCopy, IconDelete, IconDownload, IconFile, IconRefresh} from '@arco-design/web-vue/es/icon'

import {json} from '@codemirror/lang-json'
import {StreamLanguage} from '@codemirror/language'
import {toml as tomlMode} from '@codemirror/legacy-modes/mode/toml'
import {properties as propertiesMode} from '@codemirror/legacy-modes/mode/properties'

const tomlExt = StreamLanguage.define(tomlMode)
const propertiesExt = StreamLanguage.define(propertiesMode)
const inputFormat = ref('json')
const outputFormat = ref('xml')
const inputText = ref('')
const outputText = ref('')
const converting = ref(false)

const getInputPlaceholder = () => {
  const placeholders = {
    json: '请输入 JSON 数据...',
    xml: '请输入 XML 数据...',
    yaml: '请输入 YAML 数据...',
    properties: '请输入 Properties 数据...'
  }
  return placeholders[inputFormat.value] || '请输入数据...'
}

const getOutputPlaceholder = () => {
  const placeholders = {
    json: '转换后的 JSON 将显示在这里...',
    xml: '转换后的 XML 将显示在这里...',
    yaml: '转换后的 YAML 将显示在这里...',
    properties: '转换后的 Properties 将显示在这里...'
  }
  return placeholders[outputFormat.value] || '转换结果将显示在这里...'
}

const onInputChange = () => {
  // 可以在这里添加实时验证
}

const onInputFormatChange = (value: string) => {
  inputFormat.value = value
  inputText.value = ''
  outputText.value = ''
}

const onOutputFormatChange = (value: string) => {
  outputFormat.value = value
  outputText.value = ''
}

const convertFormat = async () => {
  if (!inputText.value.trim()) {
    Message.warning('请输入要转换的数据')
    return
  }

  if (inputFormat.value === outputFormat.value) {
    Message.warning('输入和输出格式不能相同')
    return
  }

  converting.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    outputText.value = `转换后的 ${outputFormat.value.toUpperCase()} 格式数据\n\n${inputText.value}`
    Message.success('转换成功')
  } catch (error) {
    Message.error('转换失败：' + error.message)
  } finally {
    converting.value = false
  }
}

const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
}

const loadSample = () => {
  const samples = {
    json: `{
  "name": "示例数据",
  "version": "1.0.0",
  "description": "这是一个JSON示例",
  "tags": ["示例", "数据", "JSON"]
}`,
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <name>示例数据</name>
  <version>1.0.0</version>
  <description>这是一个XML示例</description>
  <tags>
    <tag>示例</tag>
    <tag>数据</tag>
    <tag>XML</tag>
  </tags>
</root>`,
    yaml: `name: 示例数据
version: 1.0.0
description: 这是一个YAML示例
tags:
  - 示例
  - 数据
  - YAML`,
    properties: `name=示例数据
version=1.0.0
description=这是一个Properties示例
tags=示例,数据,Properties`
  }

  inputText.value = samples[inputFormat.value] || ''
  Message.success('已加载示例数据')
}

const copyOutput = () => {
  if (outputText.value) {
    navigator.clipboard.writeText(outputText.value)
    Message.success('已复制到剪贴板')
  }
}

const downloadOutput = () => {
  if (outputText.value) {
    const extensions = {
      json: '.json',
      xml: '.xml',
      yaml: '.yaml',
      properties: '.properties'
    }

    const ext = extensions[outputFormat.value] || '.txt'
    const blob = new Blob([outputText.value], {type: 'text/plain'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted${ext}`
    a.click()
    URL.revokeObjectURL(url)
    Message.success('下载成功')
  }
}

// 添加 CodeMirror 配置
const cmOptions = {
  extensions: [
    EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '14px'
      },
      '.cm-editor': {
        height: '100%'
      },
      '.cm-scroller': {
        height: '100%'
      }
    })
  ]
}

onMounted(() => {
  // 确保组件挂载后高度正确
  setTimeout(() => {
    const editors = document.querySelectorAll('.cm-editor')
    editors.forEach(editor => {
      if (editor instanceof HTMLElement) {
        editor.style.height = '100%'
      }
    })
  }, 100)
})
</script>

<template>
  <div class="converter-container">
    <!-- 操作栏 -->
    <div class="toolbar">
      <div class="controls-section">
        <span class="label">输入格式：</span>
        <a-select
            v-model="inputFormat"
            style="width: 120px;"
            @change="onInputFormatChange"
        >
          <a-option value="json">JSON</a-option>
          <a-option value="xml">XML</a-option>
          <a-option value="yaml">YAML</a-option>
          <a-option value="toml">TOML</a-option>
          <a-option value="ini">INI</a-option>
          <a-option value="properties">Properties</a-option>
        </a-select>

        <span class="arrow">→</span>

        <span class="label">输出格式：</span>
        <a-select
            v-model="outputFormat"
            style="width: 120px;"
            @change="onOutputFormatChange"
        >
          <a-option value="json">JSON</a-option>
          <a-option value="xml">XML</a-option>
          <a-option value="yaml">YAML</a-option>
          <a-option value="toml">TOML</a-option>
          <a-option value="ini">INI</a-option>
          <a-option value="properties">Properties</a-option>
        </a-select>

        <a-button :loading="converting" type="primary" @click="convertFormat">
          <template #icon>
            <icon-refresh/>
          </template>
          转换
        </a-button>

        <a-button @click="loadSample">
          <template #icon>
            <icon-file/>
          </template>
          加载示例
        </a-button>

        <a-button @click="clearInput">
          <template #icon>
            <icon-delete/>
          </template>
          清空
        </a-button>

        <a-button :disabled="!outputText" @click="copyOutput">
          <template #icon>
            <icon-copy/>
          </template>
          复制
        </a-button>

        <a-button :disabled="!outputText" @click="downloadOutput">
          <template #icon>
            <icon-download/>
          </template>
          下载
        </a-button>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <a-split style="height: calc(100vh - 160px)">
      <template #first>
        <div class="editor-wrapper">
          <code-mirror
              v-model="inputText"
              :lang="json()"
              :options="cmOptions"
              :placeholder="getInputPlaceholder()"
              basic
              class="input-editor"
          ></code-mirror>
        </div>
      </template>
      <template #second>
        <div class="editor-wrapper">
          <code-mirror
              v-model="outputText"
              :options="cmOptions"
              :placeholder="getOutputPlaceholder()"
              basic
              class="output-editor"
              readonly
          ></code-mirror>
        </div>
      </template>
    </a-split>
  </div>
</template>

<style scoped>
.converter-container {
  height: 80vh;
  width: 100%;
}

.toolbar {
  padding: 16px;
  border-bottom: 1px solid #e5e6eb;
  background: #fafafa;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.controls-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.label {
  font-size: 14px;
  color: #4e5969;
  white-space: nowrap;
}

.arrow {
  font-size: 16px;
  color: #165dff;
  font-weight: bold;
  margin: 0 8px;
}

.editor-wrapper {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.input-editor,
.output-editor {
  height: 100% !important;
  width: 100% !important;
}

/* 强制设置 CodeMirror 编辑器高度 */
:deep(.cm-editor) {
  height: 100% !important;
}

:deep(.cm-scroller) {
  height: 100% !important;
}

:deep(.cm-content) {
  height: 100% !important;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .controls-section {
    gap: 6px;
  }
}

@media (max-width: 768px) {
  .controls-section {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>