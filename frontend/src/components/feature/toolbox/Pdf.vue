<template>
  <div class="pdf-page">

    <!-- 文件添加区域 -->
    <div class="upload-section">
      <a-upload
          ref="uploadRef"
          :before-upload="beforeUpload"
          :custom-request="customUpload"
          :show-file-list="false"
          accept=".pdf"
          class="pdf-upload"
          content="将PDF文件拖到此处，或点击添加"
          drag
          draggable
          multiple
      >
      </a-upload>
    </div>

    <!-- PDF文件列表 -->
    <div class="pdf-list-section">
      <h3>PDF文件列表</h3>
      <a-table
          ref="tableRef"
          v-model:selected-keys="selectedFiles"
          :data="pdfFileList"
          :loading="tableLoading"
          :pagination="false"
          :row-selection="{
                    type: 'checkbox',
                    showCheckedAll:true,
                }"
          row-key="key"
          @selection-change="handleSelectionChange"
      >
        <template #columns>
          <a-table-column :width="55" type="selection"/>

          <a-table-column :width="200" data-index="name" title="文件名">
            <template #cell="{ record }">
              <div class="file-info">
                <icon-file class="file-icon"/>
                <span class="file-name">{{ record.name }}</span>
              </div>
            </template>
          </a-table-column>

          <a-table-column :width="120" data-index="size" title="文件大小">
            <template #cell="{ record }">
              {{ formatFileSize(record.size) }}
            </template>
          </a-table-column>

          <a-table-column :width="80" align="center" data-index="pages" title="页数">
            <template #cell="{ record }">
              <div v-if="!record.needPass">
                {{ record.pages }}
              </div>
              <div v-else>
                <a-tooltip content="加密文档，点击输入密码">
                  <a-button
                      size="small"
                      type="text"
                      @click="()=>setPass(record)"
                  >
                    <icon-lock/>
                  </a-button>
                </a-tooltip>
              </div>
            </template>
          </a-table-column>

          <a-table-column :width="120" data-index="pageFrom" title="开始页">
            <template #cell="{ record }">
              <div v-if="!record.needPass">
                <a-input-number
                    v-model="record.pageFrom"
                    :max="record.pageTo"
                    :min="1"
                    controls-position="right"
                    size="small"
                    style="width: 80px"
                />
              </div>
            </template>
          </a-table-column>

          <a-table-column :width="120" data-index="pageTo" title="结束页">
            <template #cell="{ record }">
              <div v-if="!record.needPass">
                <a-input-number
                    v-model="record.pageTo"
                    :disabled="record.needPass"
                    :max="record.pages"
                    :min="record.pageFrom"
                    controls-position="right"
                    size="small"
                    style="width: 80px"
                />
              </div>
            </template>
          </a-table-column>

          <a-table-column :width="160" data-index="uploadTime" title="添加时间">
            <template #cell="{ record }">
              {{ formatDate(record.uploadTime) }}
            </template>
          </a-table-column>

          <a-table-column :width="340" fixed="right" title="操作">
            <template #cell="{ record }">
              <a-space size="mini">
                <a-button size="small" style="padding-left: 0" type="text" @click="previewPdf(record)">
                  预览
                </a-button>
                <a-button size="small" style="padding-left: 0" type="text" @click="duplicatePdf(record)">
                  复制
                </a-button>
                <a-button size="small" style="padding-left: 0" type="text" @click="movePdf(record, true)">
                  上移
                </a-button>
                <a-button size="small" style="padding-left: 0" type="text" @click="movePdf(record, false)">
                  下移
                </a-button>
                <a-button size="small" style="padding-left: 0" type="text" @click="encryptPdf([record])">
                  加密
                </a-button>
                <a-button size="small" style="padding-left: 0" type="text" @click="decryptPdf([record])">
                  解密
                </a-button>
                <a-popconfirm content="确认删除?" type="error" @ok="deletePdf(record)">
                  <a-button size="small" status="danger" style="padding-left: 0" type="text">
                    删除
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>

    <!-- 批量操作按钮 -->
    <div class="batch-actions">
      <div class="action-buttons">
        <a-button :disabled="!hasSelection" type="primary" @click="batchMerge">
          合并选中
        </a-button>
        <a-button :disabled="!hasSelection" type="primary"
                  @click="()=>encryptPdf(selectedFiles.map(f => pdfFileList.find(ff => ff.id === f)) as PdfFile[])">
          批量加密
        </a-button>
        <a-button :disabled="!hasSelection" type="primary" @click="()=>decryptPdf(selectedFiles.map(f => pdfFileList.find(ff => ff.id === f)))">
          批量解密
        </a-button>
        <a-button :disabled="!hasSelection" type="primary" @click="() => imgCvtModel.show = true">
          转换为图片
        </a-button>
        <a-button :disabled="!hasSelection" type="primary" @click="batchDelete">
          删除选中
        </a-button>
      </div>
    </div>

    <!-- 图片转换对话框 -->
    <a-modal
        v-model:visible="imgCvtModel.show"
        :width="450"
        title="转换为图片"
        @cancel="() => imgCvtModel.show = false"
        @ok="convertPdf"
    >
      <a-space>
        <span>格式:</span>
        <a-select
            v-model="imgCvtModel.imgFormat"
            :options="imgFormatOpts"
            style="width: 140px"
        />
        <span>清晰度:</span>
        <a-select
            v-model="imgCvtModel.dpi"
            :options="imgDpiOpts"
            style="width: 140px"
        />
      </a-space>
    </a-modal>
    <canvas id="canvas" hidden="hidden"></canvas>
  </div>

</template>

<script lang="ts" setup>
import {computed, reactive, ref} from 'vue'
import {Message, Modal} from '@arco-design/web-vue'
import {IconFile, IconLock} from '@arco-design/web-vue/es/icon'
import {PDFDocument} from '@cantoo/pdf-lib'
import {showInput} from "../../common/modal";
import {saveAs} from 'file-saver'
import * as pdfjsLib from 'pdfjs-dist';

interface PdfFile {
  key:number,
  name: string,
  size: number,
  pages: number,
  pageFrom: number,
  pageTo: number,
  needPass: boolean,
  password: string,
  id: string,
  uploadTime: Date,
  url: string,
}

const pdfFileList = ref<PdfFile[]>([])
const tableLoading = ref(false)
const selectedFiles = ref([])
const uploadRef = ref()
const tableRef = ref()

// 计算是否有选中的文件
const hasSelection = computed(() => selectedFiles.value.length > 0)

// 添加前验证
const beforeUpload = (file) => {
  // 检查文件类型
  if (!file.type.includes('pdf')) {
    Message.error('只能添加PDF文件！')
    return false
  }
  return true
}

// 自定义添加请求
const customUpload = async (options) => {
  console.log(options)
  const {fileItem} = options
  if (!fileItem) {
    Message.error('文件添加失败：文件对象为空')
    return
  }

  try {
    const arrayBuffer = await fileItem.file.arrayBuffer()
    const form = new FormData()
    form.append('file', fileItem.file)
    const resp = await fetch('/api/upload', {
      method: 'POST',
      body: form
    })
    if (!resp.ok) {
      const data = await resp.json()
      Message.error('文件上传失败 ' + data.error)
      return
    }

    const data = await resp.json()
    const doc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true
    })
    const pdfFile = {
      key:Date.now(),
      id: data.fileid,
      name: fileItem.name,
      size: fileItem.file.size,
      pages: doc.isEncrypted ? 0 : doc.getPages().length,
      pageFrom: doc.isEncrypted ? 0 : 1,
      pageTo: doc.isEncrypted ? 0 : doc.getPages().length,
      needPass: doc.isEncrypted,
      password: '',
      uploadTime: new Date(),
      url: URL.createObjectURL(fileItem.file),
    }

    pdfFileList.value.push(pdfFile)
    Message.success(`文件 ${fileItem.name} 添加成功`)
  } catch (error) {
    console.error(error)
    Message.error(`添加失败:${error}`)
  }
}

// 处理表格选择变化
const handleSelectionChange = () => {
  console.log(selectedFiles)
}

// 预览PDF
const previewPdf = (file) => {
  window.open(file.url, '_blank')
}

// 移动PDF
const movePdf = (file, isUp) => {
  const idx = pdfFileList.value.findIndex(f => f.id === file.id)
  if (idx === -1) return

  if (isUp) {
    if (idx > 0) {
      pdfFileList.value.splice(idx, 1)
      pdfFileList.value.splice(idx - 1, 0, file)
    }
  } else if (idx < pdfFileList.value.length - 1) {
    pdfFileList.value.splice(idx, 1)
    pdfFileList.value.splice(idx + 1, 0, file)
  }
}

// 复制PDF
const duplicatePdf = (file) => {
  const idx = pdfFileList.value.findIndex(f => f.id === file.id)
  if (idx === -1) return

  pdfFileList.value.splice(idx + 1, 0, {
    key: Date.now(),
    id: file.id,
    name: file.name,
    size: file.size,
    pages: file.pages,
    pageFrom: 1,
    pageTo: file.pages,
    uploadTime: file.uploadTime,
    needPass: file.needPass,
    password: file.password,
    url: file.url,
  })
}

// 设置密码
const setPass = async (file) => {
  if (!file) {
    return
  }
  const pass = await showInput({
    type: 'password',
    placeholder: '请输入密码',
    okText: '确定',
  })
  if (!pass) {
    return
  }
  try {
    const resp = await fetch('/api/pdf/setpass', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: file.id,
        password: pass
      })
    })
    if (!resp.ok) {
      const data = await resp.json()
      Message.error('设置密码失败：' + data.error)
      return
    }
    const respData = await resp.json()
    file.needPass = false
    file.pages = respData.pages
    file.pageFrom = 1
    file.pageTo = file.pages
    file.password = pass
    Message.success('设置密码成功')
  } catch (error) {
    Message.error('设置密码失败：' + error)
  }
}
// 加密PDF
const encryptPdf = async (files: PdfFile[]) => {
  let loading = null
  try {
    if (!files) {
      return
    }
    const password = await showInput({
      type: 'password',
      placeholder: '请输入加密密码',
      okText: '加密',
    })
    if (!password) {
      return
    }

    loading = Message.loading({
      content: '加密中...',
      duration: 0
    })
    const resp = await fetch('/api/pdf/encrypt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(files.map((f) => ({...f, newPass: password})))
    })
    loading.close()
    if (!resp.ok) {
      const data = await resp.json()
      Message.error('加密失败：' + data.error)
      return
    }
    const data = await resp.json()

    if (data.type === 'success') {
      saveAs(`api/download?filename=${data.message}`, data.message)
    } else {
      Message.error('加密失败：' + data.error)
    }
  } catch (e) {
    console.log(e)
    loading?.close()
    Message.error(`加密失败:${e}`)
  }
}
const pageList = (from: number, to: number, total: number) => {
  const pages = []
  if (from === to) {
    if (from === 0) {
      for (let i = 0; i < total; i++) {
        pages.push(i)
      }
      return pages
    } else {
      return [from]
    }
  } else {
    for (let i = from; i <= to; i++) {
      pages.push(i - 1)
    }
    return pages
  }
}

// 解密PDF
const decryptPdf = async (files) => {
  let loading = null
  try {
    const password = await showInput({
      type: 'password',
      placeholder: '请输入解密密码',
      okText: '解密'
    })
    if (!password) {
      return
    }
    loading = Message.loading({
      content: '解密中...',
      duration: 0
    })
    const resp = await fetch('/api/pdf/decrypt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(files.map((f) => ({...f, password: password})))
    })
    loading.close()
    if (!resp.ok) {
      const data = await resp.json()
      Message.error('加密失败：' + data.error)
      return
    }
    const data = await resp.json()

    if (data.type === 'success') {
      saveAs(`api/download?filename=${data.message}`, data.message)
    } else {
      Message.error('加密失败：' + data.error)
    }
  } catch (e) {
    loading?.close()
    Message.error(`解密失败:${e}`)
  }
}

// 图片转换选项
const imgDpiOpts = [
  {value: 150, label: '低'},
  {value: 300, label: '中'},
  {value: 600, label: '高'}
]

const imgFormatOpts = [
  {value: 'PNG', label: 'PNG'},
  {value: 'JPEG', label: 'JPEG'},
]

const imgCvtModel = reactive({
  show: false,
  imgFormat: 'PNG',
  dpi: 300
})

const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

// 配置 StreamSaver
if (isDev) {
  // 开发环境：使用当前页面的完整URL
  const port = window.location.port || '3000' // 使用当前页面的端口或默认3000
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.protocol}//${window.location.hostname}:${port}//pdf.worker.js`
} else {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js'
}

// 转换PDF
const convertPdf = async () => {
  imgCvtModel.show = false
  const loading = Message.loading({
    content: '转换中...',
    duration: 0
  })
  try {
    const resp = await fetch('/api/pdf/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(
          selectedFiles.value.map(id => pdfFileList.value.find(f => f.key === id)).map(ff => ({
            ...ff,
            dpi: imgCvtModel.dpi,
            format: imgCvtModel.imgFormat.toLocaleLowerCase()
          }))
      )
    })
    loading.close()
    if (resp.ok) {
      const data = await resp.json()
      saveAs(`api/download?filename=${data.message}`, data.message)
      Message.success('转换完成')
    } else {
      const data = await resp.json()
      Message.error('转换失败：' + data.message)
    }
  } catch (e) {
    console.log(e)
    loading.close()
    Message.error(`转换失败:${e}`)
  }
}

const deletePdf = async (file: PdfFile) => {
  try {

    const index = pdfFileList.value.findIndex(f => f.key === file.key)
    if (index > -1) {
      pdfFileList.value.splice(index, 1)

      const selectedIndex = selectedFiles.value.findIndex(f => f === file.key)
      if (selectedIndex > -1) {
        selectedFiles.value.splice(selectedIndex, 1)
      }

      Message.success('删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

const batchMerge = async () => {
  if (selectedFiles.value.length === 0) {
    Message.warning('请先选择要合并的文件')
    return
  }
  const loading = Message.loading('合并中...')

  try {
    const resp = await fetch('/api/pdf/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(selectedFiles.value.map(id => {
        const file = pdfFileList.value.find(f => f.key === id)
        if (!file) return null
        return {
          id: file.id,
          password: file.password,
          pageFrom: file.pageFrom,
          pageTo: file.pageTo
        }
      }))
    })
    if (!resp.ok) {
      const data = await resp.json()
      Message.error(data.message)
      return
    }
    const data = await resp.json()
    loading.close()
    if (!data || data.type === 'error') {
      Message.error(`合并失败:${data?.message}`)
      return
    } else {
      Message.success('合并成功')
      saveAs(`/api/download?filename=${data.message}`, data.message)
    }
  } catch (e) {
    loading.close()
    Message.error(`合并失败:${e}`)
  }
}

const batchDelete = async () => {
  if (selectedFiles.value.length === 0) {
    Message.warning('请先选择要删除的文件')
    return
  }

  try {
    await new Promise((resolve, reject) => {
      Modal.confirm({
        hideTitle: true,
        width: 300,
        content: `确定要删除选中的 ${selectedFiles.value.length} 个文件吗？`,
        okText: '确定',
        cancelText: '取消',
        onOk: resolve,
        onCancel: reject
      })
    })

    pdfFileList.value = pdfFileList.value.filter(f => !selectedFiles.value.includes(f.key))

    selectedFiles.value = []
    if (tableRef.value) {
      tableRef.value.clearSelection()
    }

    Message.success('批量删除成功')
  } catch (e) {
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  // 根据大小选择合适的精度
  let precision = 2
  if (bytes < 1024) precision = 0 // 小于1KB显示整数
  if (bytes < 1024 * 1024) precision = 1 // 1KB-1MB显示1位小数
  if (bytes >= 1024 * 1024) precision = 2 // 大于1MB显示2位小数

  return parseFloat((bytes / Math.pow(k, i)).toFixed(precision)) + ' ' + sizes[i]
}


// 格式化日期
const formatDate = (date: Date): string => {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}


</script>

<style scoped>
.pdf-page {
  padding: 20px;
}

.upload-section {
  margin-bottom: 1px;
  display: flex;
  justify-content: center;
}

.pdf-upload {
  max-width: 100%;
  width: 100%;
}

:deep(.arco-upload-drag) {
  height: 34px !important;
  min-height: 34px !important;
  border: 1px dashed #e5e6eb;
  border-radius: 4px;
  transition: all 0.2s;
}

:deep(.arco-upload-drag:hover) {
  border-color: #165dff;
  background: #f2f3f5;
}

:deep(.arco-upload-drag-content) {
  height: 100%;
}

.upload-content {
  height: 100%;
  text-align: center;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  font-size: 20px;
  color: #c9cdd4;
}

.upload-text {
  color: #4e5969;
  font-size: 14px;
  margin: 0;
  white-space: nowrap;
}

.upload-text em {
  color: #165dff;
  font-style: normal;
  cursor: pointer;
}

.pdf-list-section {
  margin-bottom: 32px;
}

.pdf-list-section h3 {
  margin-bottom: 16px;
  color: #1d2129;
  font-size: 18px;
  font-weight: 600;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  color: #f53f3f;
  font-size: 16px;
}

.file-name {
  font-weight: 500;
}

.batch-actions {
  padding: 20px;
  background: #f7f8fa;
  border-radius: 8px;
  border: 1px solid #e5e6eb;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 拖拽添加样式 */

</style>
