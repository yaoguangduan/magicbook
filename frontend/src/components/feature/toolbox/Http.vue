<template>
    <div class="http-client">
        <!-- 顶部请求区域 -->
        <div class="request-header">
            <div class="request-line">
                <!-- 保存的请求选择 -->
                <a-select
                    v-model="httpClientData.ui.selectedSavedRequest"
                    :style="{ width: '200px' }"
                    allow-clear
                    class="saved-requests-select"
                    placeholder="选择保存的请求"
                    @change="onSelectSavedRequest"
                    @clear="clearCurrentRequest"
                >
                    <template #label>
                        <div v-if="selectedSavedRequestData" class="saved-request-option">
              <span :class="selectedSavedRequestData.data.method.toLowerCase()" class="method-tag">
                {{ selectedSavedRequestData.data.method }}
              </span>
                            <span class="request-name">{{ displayName(selectedSavedRequestData.name) }}</span>
                        </div>
                    </template>

                    <a-option
                        v-for="item in httpClientData.save.savedRequests"
                        :key="item.id"
                        :value="item.name"
                    >
                        <div class="saved-request-option">
              <span :class="item.data.method.toLowerCase()" class="method-tag">
                {{ item.data.method }}
              </span>
                            <span class="request-name">{{ displayName(item.name) }}</span>
                        </div>
                    </a-option>
                </a-select>

                <!-- 操作按钮组 -->
                <a-button-group>
                    <a-button
                        :disabled="!hasRequestData"
                        @click="handleSave"
                    >
                        <template #icon>
                            <icon-save/>
                        </template>
                        保存
                    </a-button>
                    <a-dropdown trigger="click">
                        <a-button :disabled="!hasRequestData">
                            <template #icon>
                                <icon-down/>
                            </template>
                        </a-button>
                        <template #content>
                            <a-doption @click="handleNew">
                                <template #icon>
                                    <icon-plus/>
                                </template>
                                新建
                            </a-doption>
                            <a-doption :disabled="!httpClientData.ui.selectedSavedRequest" @click="handleCopy">
                                <template #icon>
                                    <icon-copy/>
                                </template>
                                复制
                            </a-doption>
                            <a-doption :disabled="!httpClientData.ui.selectedSavedRequest" class="delete-option" @click="handleDelete">
                                <template #icon>
                                    <icon-delete/>
                                </template>
                                删除
                            </a-doption>
                        </template>
                    </a-dropdown>
                </a-button-group>

                <!-- HTTP 方法选择 -->
                <a-select v-model="httpClientData.request.method" :style="{ width: '100px' }" class="method-select">
                    <a-option value="GET">GET</a-option>
                    <a-option value="POST">POST</a-option>
                    <a-option value="PUT">PUT</a-option>
                    <a-option value="DELETE">DELETE</a-option>
                    <a-option value="PATCH">PATCH</a-option>
                    <a-option value="HEAD">HEAD</a-option>
                    <a-option value="OPTIONS">OPTIONS</a-option>
                </a-select>

                <!-- URL 输入框 -->
                <a-input
                    v-model="httpClientData.request.url"
                    class="url-input"
                    placeholder="请输入请求 URL，例如：https://api.example.com/users"
                />

                <!-- 发送按钮 -->
                <a-button
                    :loading="httpClientData.ui.loading"
                    class="send-button"
                    type="primary"
                    @click="sendRequest"
                >
                    发送
                </a-button>
            </div>
        </div>

        <!-- 保存对话框 -->
        <a-modal
            v-model:visible="httpClientData.ui.saveDialogVisible"
            :ok-loading="httpClientData.ui.saveLoading"
            title="保存请求"
            @ok="saveRequest"
        >
            <a-form :model="httpClientData.save.form" layout="vertical">
                <a-form-item label="请求名称" required>
                    <a-input v-model="httpClientData.save.form.name" placeholder="请输入请求名称"/>
                </a-form-item>
                <a-form-item label="描述">
                    <a-textarea v-model="httpClientData.save.form.description" :rows="3" placeholder="请输入请求描述（可选）"/>
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 复制对话框 -->
        <a-modal
            v-model:visible="httpClientData.ui.copyDialogVisible"
            :ok-loading="httpClientData.ui.copyLoading"
            title="复制请求"
            @ok="copyRequest"
        >
            <a-form :model="httpClientData.copy.form" layout="vertical">
                <a-form-item label="请求名称" required>
                    <a-input v-model="httpClientData.copy.form.name" placeholder="请输入新的请求名称"/>
                </a-form-item>
                <a-form-item label="描述">
                    <a-textarea v-model="httpClientData.copy.form.description" :rows="3" placeholder="请输入请求描述（可选）"/>
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 下载文件名对话框 -->
        <a-modal
            v-model:visible="httpClientData.ui.downloadDialogVisible"
            title="下载文件"
            @cancel="httpClientData.ui.downloadDialogVisible = false"
            @ok="confirmDownload"
        >
            <a-form :model="httpClientData.download.form" layout="vertical">
                <a-form-item label="文件名" required>
                    <a-input
                        v-model="httpClientData.download.form.filename"
                        placeholder="请输入文件名"
                        @keyup.enter="confirmDownload"
                    />
                </a-form-item>
                <a-form-item label="文件信息">
                    <div style="padding: 8px 12px; background: #f7f8fa; border-radius: 4px; color: #4e5969; font-size: 14px;">
                        <div style="margin-bottom: 4px;">
                            <strong>类型:</strong> {{ httpClientData.response.contentType || '未知' }}
                        </div>
                        <div>
                            <strong>大小:</strong> {{ formatResponseSize(httpClientData.response.data) }}
                        </div>
                    </div>
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 打开对话框 -->
        <a-modal
            v-model:visible="httpClientData.ui.loadDialogVisible"
            title="打开保存的请求"
            width="800px"
        >
            <div class="saved-requests">
                <div class="search-bar">
                    <a-input-search
                        v-model="httpClientData.ui.searchKeyword"
                        placeholder="搜索请求名称或描述"
                        @search="loadSavedRequests"
                    />
                </div>

                <div class="requests-list">
                    <a-spin :loading="httpClientData.ui.loadLoading" style="width: 100%">
                        <div
                            v-for="item in filteredRequests"
                            :key="item.id"
                            class="request-item"
                            @click="loadRequest(item)"
                        >
                            <div class="request-info">
                                <div class="request-title">
                <span :class="item.data.method.toLowerCase()" class="method-tag">
                  {{ item.data.method }}
                </span>
                                    <span class="request-name">{{ item.name }}</span>
                                </div>
                                <div class="request-url">{{ item.data.url }}</div>
                                <div class="request-meta">
                                    <span class="save-time">{{ formatTime(item.createdAt) }}</span>
                                    <span v-if="item.description" class="description">{{ item.description }}</span>
                                </div>
                            </div>
                            <div class="request-actions">
                                <a-button size="small" type="text" @click.stop="deleteRequest(item.id)">
                                    <template #icon>
                                        <icon-delete/>
                                    </template>
                                </a-button>
                            </div>
                        </div>

                        <div v-if="filteredRequests.length === 0" class="empty-state">
                            <icon-info-circle class="empty-icon"/>
                            <p>暂无保存的请求</p>
                        </div>
                    </a-spin>
                </div>
            </div>
        </a-modal>

        <!-- 主体区域：左右拖拽分割 -->
        <div class="main-content">
            <a-split
                :default-size="0.5"
                :max="0.8"
                :min="0.2"
                class="split-container"
                direction="horizontal"
            >
                <template #first>
                    <!-- 左侧：请求配置 -->
                    <a-tabs v-model:active-key="httpClientData.ui.requestActiveTab" class="request-tabs">
                        <!-- Body 标签页 -->
                        <a-tab-pane key="body" class="body-tab-pane" title="Body">
                            <div class="body-config">
                                <a-radio-group v-model="httpClientData.request.bodyType" class="body-type-selector">
                                    <a-radio value="none">None</a-radio>
                                    <a-radio value="body">Body</a-radio>
                                    <a-radio value="form">Form Data</a-radio>
                                </a-radio-group>

                                <div v-if="httpClientData.request.bodyType !== 'none'" class="body-content">
                                    <!-- Body 编辑器 -->
                                    <div v-if="httpClientData.request.bodyType === 'body'" class="body-editor">
                                        <CodeMirror
                                            v-model="httpClientData.request.body.text"
                                            :style="{ height: editorHeight, width: '100%' }"
                                            basic
                                            class="body-codemirror"
                                            placeholder="请输入请求体内容（JSON、XML、文本等）"
                                        />
                                    </div>

                                    <!-- Form Data -->
                                    <div v-if="httpClientData.request.bodyType === 'form'" class="form-data">
                                        <div v-for="(item, index) in httpClientData.request.body.formData" :key="index" class="form-item">
                                            <a-input v-model="item.key" class="form-key" placeholder="Key"/>
                                            <a-input v-model="item.value" class="form-value" placeholder="Value"/>
                                            <a-button size="small" type="text" @click="removeFormItem(index)">
                                                <template #icon>
                                                    <icon-delete/>
                                                </template>
                                            </a-button>
                                        </div>
                                        <a-button class="add-form-btn" size="small" type="dashed" @click="addFormItem">
                                            <template #icon>
                                                <icon-plus/>
                                            </template>
                                            添加字段
                                        </a-button>
                                    </div>
                                </div>
                            </div>
                        </a-tab-pane>

                        <!-- Headers 标签页 -->
                        <a-tab-pane key="headers" title="Headers">
                            <div class="headers-config">
                                <div v-for="(header, index) in httpClientData.request.headers" :key="index" class="header-item">
                                    <a-auto-complete
                                        v-model="header.key"
                                        :data="filterHeaderKeys(header.key)"
                                        :filter-option="false"
                                        allow-clear
                                        class="header-key"
                                        placeholder="Header Name"
                                    >
                                        <template #option="{ data }">
                                            <div class="header-option">
                                                <span class="header-name">{{ data.value }}</span>
                                                <span v-if="getHeaderDescription(data.value)" class="header-desc">
                        {{ getHeaderDescription(data.value) }}
                      </span>
                                            </div>
                                        </template>
                                    </a-auto-complete>

                                    <a-auto-complete
                                        v-model="header.value"
                                        :data="filterHeaderValues(header.key, header.value)"
                                        :filter-option="false"
                                        allow-clear
                                        class="header-value"
                                        placeholder="Header Value"
                                    >
                                        <template #option="{ data }">
                                            <div class="header-value-option">
                                                {{ data.value }}
                                            </div>
                                        </template>
                                    </a-auto-complete>

                                    <a-button size="small" type="text" @click="removeHeader(index)">
                                        <template #icon>
                                            <icon-delete/>
                                        </template>
                                    </a-button>
                                </div>
                                <a-button class="add-header-btn" size="small" type="dashed" @click="addHeader">
                                    <template #icon>
                                        <icon-plus/>
                                    </template>
                                    添加 Header
                                </a-button>
                            </div>
                        </a-tab-pane>

                        <!-- Query 参数标签页 -->
                        <a-tab-pane key="query" title="Query">
                            <div class="query-config">
                                <div v-for="(param, index) in httpClientData.request.queryParams" :key="index" class="query-item">
                                    <a-input v-model="param.key" class="query-key" placeholder="Parameter Name"/>
                                    <a-input v-model="param.value" class="query-value" placeholder="Parameter Value"/>
                                    <a-button size="small" type="text" @click="removeQueryParam(index)">
                                        <template #icon>
                                            <icon-delete/>
                                        </template>
                                    </a-button>
                                </div>
                                <a-button class="add-query-btn" size="small" type="dashed" @click="addQueryParam">
                                    <template #icon>
                                        <icon-plus/>
                                    </template>
                                    添加参数
                                </a-button>
                            </div>
                        </a-tab-pane>

                        <!-- Settings 标签页 -->
                        <a-tab-pane key="settings" title="Settings">
                            <div class="settings-config">
                                <div class="settings-section">
                                    <h4 class="section-title">网络设置</h4>

                                    <a-form-item class="setting-item" label="超时时间 (秒)">
                                        <a-input-number
                                            :max="300"
                                            :min="1"
                                            :model-value="Math.floor(httpClientData.request.settings.timeout / 1000)"
                                            :step="1"
                                            style="width: 120px"
                                            @update:model-value="(val) => httpClientData.request.settings.timeout = val * 1000"
                                        />
                                        <span class="setting-description">请求超时时间，1-300秒</span>
                                    </a-form-item>

                                    <a-form-item class="setting-item" label="用户代理">
                                        <a-input
                                            v-model="httpClientData.request.settings.userAgent"
                                            placeholder="User-Agent"
                                            style="width: 300px"
                                        />
                                    </a-form-item>
                                </div>

                                <div class="settings-section">
                                    <h4 class="section-title">安全设置</h4>

                                    <a-form-item class="setting-item">
                                        <a-checkbox v-model="httpClientData.request.settings.sslVerify">
                                            SSL 证书验证
                                        </a-checkbox>
                                        <span class="setting-description">验证 HTTPS 证书的有效性</span>
                                    </a-form-item>
                                </div>

                                <div class="settings-section">
                                    <h4 class="section-title">重定向设置</h4>

                                    <a-form-item class="setting-item">
                                        <a-checkbox v-model="httpClientData.request.settings.followRedirects">
                                            跟随重定向
                                        </a-checkbox>
                                        <span class="setting-description">自动跟随 3xx 重定向响应</span>
                                    </a-form-item>

                                    <a-form-item v-if="httpClientData.request.settings.followRedirects" class="setting-item" label="最大重定向次数">
                                        <a-input-number
                                            v-model="httpClientData.request.settings.maxRedirects"
                                            :max="20"
                                            :min="0"
                                            :step="1"
                                            style="width: 120px"
                                        />
                                        <span class="setting-description">防止无限重定向，0-20次</span>
                                    </a-form-item>
                                </div>

                                <div class="settings-section">
                                    <h4 class="section-title">重试设置</h4>

                                    <a-form-item class="setting-item" label="重试次数">
                                        <a-input-number
                                            v-model="httpClientData.request.settings.retries"
                                            :max="10"
                                            :min="0"
                                            :step="1"
                                            style="width: 120px"
                                        />
                                        <span class="setting-description">请求失败时的重试次数，0-10次</span>
                                    </a-form-item>
                                </div>
                            </div>
                        </a-tab-pane>
                    </a-tabs>
                </template>

                <template #second>
                    <!-- 右侧：响应结果 -->
                    <a-tabs v-model:active-key="httpClientData.ui.responseActiveTab" class="response-tabs">
                        <template #extra>
                            <div v-if="httpClientData.response.status" class="response-status-info">
               <span :class="getStatusClass(httpClientData.response.status)" class="status-code">
                 {{ httpClientData.response.status }}
               </span>
                                <span v-if="httpClientData.response.time"
                                      :class="getResponseTimeClass(httpClientData.response.time)"
                                      class="response-time">
                                     {{ formatResponseTime(httpClientData.response.time) }}
                                 </span>
                            </div>
                        </template>

                        <!-- Response Body -->
                        <a-tab-pane key="body" class="response-tab-pane" title="Response">
                            <div class="response-body">
                                <div class="response-toolbar">
                                    <div class="response-actions">
                                        <!-- 二进制数据显示下载按钮 -->
                                        <template v-if="httpClientData.response.data && httpClientData.response.isBinary">
                                            <a-button size="mini" @click="downloadBinaryResponse">
                                                下载
                                                <template #icon>
                                                    <icon-download/>
                                                </template>
                                            </a-button>
                                        </template>

                                        <!-- 文本数据显示复制和格式化按钮 -->
                                        <template v-else-if="httpClientData.response.data">
                                            <a-button size="mini" @click="copyResponse">
                                                复制
                                                <template #icon>
                                                    <icon-copy/>
                                                </template>
                                            </a-button>
                                            <a-button v-if="canBeautify" size="mini" @click="beautifyResponse">
                                                格式化
                                                <template #icon>
                                                    <icon-code/>
                                                </template>
                                            </a-button>
                                        </template>
                                    </div>
                                    <div class="response-info">
                                         <span v-if="httpClientData.response.data" class="response-size">
                                             {{ formatResponseSize(httpClientData.response.data) }}
                                         </span>
                                    </div>
                                </div>

                                <div class="response-content">
                                    <div v-if="!httpClientData.response.data && !httpClientData.ui.loading" class="empty-response">
                                        <icon-info-circle class="empty-icon"/>
                                        <p>发送请求后，响应内容将显示在这里</p>
                                    </div>

                                    <div v-else-if="httpClientData.ui.loading" class="loading-response">
                                        <a-spin :size="32"/>
                                        <p>请求发送中...</p>
                                    </div>

                                    <div v-else class="response-data">
                                        <CodeMirror
                                            :class="{ 'hex-viewer': httpClientData.response.isBinary }"
                                            :extensions="httpClientData.response.isBinary ? [] : [json()]"
                                            :model-value="httpClientData.response.isBinary ? formatBinaryAsHex(httpClientData.response.data) : formatResponse(httpClientData.response.data)"
                                            :readonly="true"
                                            :style="{ height: editorHeight, width: '100%' }"
                                            basic
                                            class="response-codemirror"
                                        />
                                    </div>
                                </div>
                            </div>
                        </a-tab-pane>

                        <!-- Response Headers -->
                        <a-tab-pane key="headers" title="Response Headers">
                            <div class="response-headers">
                                <div v-if="!httpClientData.response.headers" class="empty-headers">
                                    <p>发送请求后，响应头将显示在这里</p>
                                </div>
                                <div v-else class="headers-list">
                                    <div v-for="(value, key) in httpClientData.response.headers" :key="key" class="header-row">
                                        <span class="header-name">{{ key }}:</span>
                                        <span class="header-value">{{ value }}</span>
                                    </div>
                                </div>
                            </div>
                        </a-tab-pane>
                    </a-tabs>
                </template>
            </a-split>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {computed, onActivated, onMounted, onUnmounted, reactive, ref} from 'vue'
import {Message, Modal} from '@arco-design/web-vue'
import {IconCode, IconCopy, IconDelete, IconDown, IconDownload, IconInfoCircle, IconPlus, IconSave} from '@arco-design/web-vue/es/icon'

import {json} from '@codemirror/lang-json'
import CodeMirror from 'vue-codemirror6'
import {httpHeadersData} from '../../../data/http-headers'
import {appState} from "../../../states"
import httpClient from '../../../utils/http-client'
import {detect, detectAndConvert, FORMAT} from '../../../utils/txt_format'
import KVStoreClient from '../../../utils/kvstore-client'

onActivated(async () => {
    await loadSavedRequests()
})
// 定义组件名称
defineOptions({
    name: 'HttpClient'
})

// 计算编辑器高度
const editorHeight = ref('400px')

// 直接使用导入的Header数据
const commonHeaders = httpHeadersData

// 统一的请求响应数据管理
const httpClientData = reactive({
    // 请求配置
    request: {
        method: 'GET',
        url: '',
        name: '',
        headers: [
            {key: 'Content-Type', value: 'application/json'},
            {key: '', value: ''}
        ],
        queryParams: [
            {key: '', value: ''}
        ],
        bodyType: 'none',
        body: {
            json: '{\n  "key": "value"\n}',
            text: '',
            formData: [{key: '', value: ''}]
        },
        settings: {
            timeout: 30000,          // 超时时间（毫秒）
            sslVerify: true,         // SSL 证书验证
            followRedirects: true,   // 跟随重定向
            maxRedirects: 5,         // 最大重定向次数
            retries: 0,              // 重试次数
            userAgent: 'MagicBook/1.0'  // User-Agent
        }
    },
    // 响应数据
    response: {
        status: null,
        statusText: '',
        headers: null,
        data: null,
        time: 0,
        isBinary: false,
        contentType: ''
    },
    // UI状态
    ui: {
        loading: false,
        requestActiveTab: 'body',
        responseActiveTab: 'body',
        saveDialogVisible: false,
        loadDialogVisible: false,
        copyDialogVisible: false,
        downloadDialogVisible: false,
        saveLoading: false,
        loadLoading: false,
        copyLoading: false,
        searchKeyword: '',
        selectedSavedRequest: ''
    },
    // 保存相关
    save: {
        form: {
            name: '',
            description: ''
        },
        savedRequests: []
    },
    // 复制相关
    copy: {
        form: {
            name: '',
            description: ''
        }
    },
    // 下载相关
    download: {
        form: {
            filename: ''
        }
    }
})

// 直接使用 httpClientData，不需要额外的 computed 包装器


// 添加/删除表单项
const addFormItem = () => {
    httpClientData.request.body.formData.push({key: '', value: ''})
}

const removeFormItem = (index: number) => {
    if (httpClientData.request.body.formData.length > 1) {
        httpClientData.request.body.formData.splice(index, 1)
    }

}

// 添加/删除 Header
const addHeader = () => {
    httpClientData.request.headers.push({key: '', value: ''})
}

const removeHeader = (index: number) => {
    if (httpClientData.request.headers.length > 1) {
        httpClientData.request.headers.splice(index, 1)
    }

}

// 添加/删除查询参数
const addQueryParam = () => {
    httpClientData.request.queryParams.push({key: '', value: ''})
}

const removeQueryParam = (index: number) => {
    if (httpClientData.request.queryParams.length > 1) {
        httpClientData.request.queryParams.splice(index, 1)
    }
}

// 构建请求 URL（包含查询参数）
const buildRequestUrl = () => {
    let url = httpClientData.request.url
    const validParams = httpClientData.request.queryParams.filter(param => param.key && param.value)

    if (validParams.length > 0) {
        const searchParams = new URLSearchParams()
        validParams.forEach(param => {
            searchParams.append(param.key, param.value)
        })
        url += (url.includes('?') ? '&' : '?') + searchParams.toString()
    }

    return url
}

// 构建请求头
const buildHeaders = () => {
    const headers: Record<string, string> = {}

    httpClientData.request.headers.forEach(header => {
        if (header.key && header.value) {
            headers[header.key.toLocaleLowerCase()] = header.value
        }
    })

    return headers
}

// 构建请求体
const buildRequestBody = () => {
    switch (httpClientData.request.bodyType) {
        case 'body':
            return httpClientData.request.body.text.trim()
        case 'form':
            // 构建表单数据对象，这样可以被 JSON.stringify 序列化
            const formObj: Record<string, string> = {}
            httpClientData.request.body.formData.forEach(item => {
                if (item.key && item.value) {
                    formObj[item.key] = item.value
                }
            })
            return formObj
        default:
            return undefined
    }
}

// 发送请求
const sendRequest = async () => {
    if (!httpClientData.request.url) {
        Message.error('请输入请求 URL')
        return
    }

    httpClientData.ui.loading = true

    try {
        const url = buildRequestUrl()
        const headers = buildHeaders()
        let body = undefined

        // 只有非 GET/HEAD 请求才发送 body
        if (!['HEAD'].includes(httpClientData.request.method)) {
            body = buildRequestBody()
        }

        // 构建请求数据发送给服务端
        const requestPayload = {
            method: httpClientData.request.method,
            url: url,
            headers: headers,
            body: body,
            settings: httpClientData.request.settings
        }
        console.log('[HTTP] 请求数据:', requestPayload)

        if (httpClientData.request.bodyType === 'form') {
            if (requestPayload.headers['content-type'] === undefined) {
                requestPayload.headers['content-type'] = 'application/x-www-form-urlencoded'
            }
        }

        const res = await httpClient('/api/http', {
            method: 'POST',
            body: JSON.stringify(requestPayload)
        })

        if (res.ok) {
            // 检查是否为二进制响应
            const isBinary = res.headers.get('X-Is-Binary') === 'true'
            if (isBinary) {
                // 处理二进制响应
                const arrayBuffer = await res.arrayBuffer()
                const status = parseInt(res.headers.get('X-Response-Status') || '200')
                const statusText = res.headers.get('X-Response-StatusText') || ''
                const time = parseInt(res.headers.get('X-Response-Time') || '0')
                const contentType = res.headers.get('Content-Type') || ''

                // 提取原始响应头
                const originalHeaders: Record<string, string> = {}
                res.headers.forEach((value, key) => {
                    if (key.startsWith('x-original-')) {
                        const originalKey = key.substring(11) // 移除 'x-original-' 前缀
                        originalHeaders[originalKey] = value
                    }
                })

                httpClientData.response = {
                    status: status,
                    statusText: statusText,
                    headers: originalHeaders,
                    data: arrayBuffer,
                    time: time,
                    isBinary: true,
                    contentType: contentType
                }

                Message.success('请求发送成功')
            } else {
                // 处理普通 JSON 响应
                const result = await res.json()

                if (result.success) {
                    // 服务端返回的响应数据
                    httpClientData.response = {
                        status: result.status,
                        statusText: result.statusText || '',
                        headers: result.headers || {},
                        data: result.data,
                        time: result.time || 0,
                        isBinary: false
                    }

                    Message.success('请求发送成功')
                } else {
                    // 服务端处理失败
                    throw new Error(result.message || result.error || '请求失败')
                }
            }
        } else {
            const error = await res.json()
            throw new Error(error.message || '请求失败')
        }

    } catch (error) {
        console.error('请求失败:', error)
        Message.error(`请求失败: ${error.message}`)

        httpClientData.response = {
            status: null,
            statusText: '',
            headers: null,
            data: `请求失败: ${error.message}`,
            time: 0
        }
    } finally {
        httpClientData.ui.loading = false
    }
}

// 获取状态码颜色
const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'green'
    if (status >= 300 && status < 400) return 'blue'
    if (status >= 400 && status < 500) return 'orange'
    if (status >= 500) return 'red'
    return 'gray'
}

// 获取状态码样式类
const getStatusClass = (status: number) => {
    if (status >= 200 && status < 300) return 'status-success'
    if (status >= 300 && status < 400) return 'status-info'
    if (status >= 400 && status < 500) return 'status-warning'
    if (status >= 500) return 'status-error'
    return 'status-default'
}

// 格式化响应数据
const formatResponse = (data: any) => {
    if (typeof data === 'string') {
        try {
            return JSON.stringify(JSON.parse(data), null, 2)
        } catch {
            return data
        }
    }
    return JSON.stringify(data, null, 2)
}

// 将 ArrayBuffer 转换为十六进制显示
const formatBinaryAsHex = (arrayBuffer: ArrayBuffer) => {
    const bytes = new Uint8Array(arrayBuffer)
    let hex = ''

    for (let i = 0; i < bytes.length; i++) {
        // 每16个字节换一行
        if (i > 0 && i % 16 === 0) {
            hex += '\n'
        }
        // 每4个字节加一个空格
        else if (i > 0 && i % 4 === 0) {
            hex += ' '
        }

        // 转换为两位十六进制
        hex += bytes[i].toString(16).padStart(2, '0')
    }

    return hex
}

// 复制响应内容
const copyResponse = async () => {
    try {
        const text = formatResponse(httpClientData.response.data)
        await navigator.clipboard.writeText(text)
        Message.success('已复制到剪贴板')
    } catch (error) {
        Message.error('复制失败')
    }
}

// 检查是否有请求数据
const hasRequestData = computed(() => {
    return httpClientData.request.url.trim() !== ''
})

// 获取当前选中的保存请求数据
const selectedSavedRequestData = computed(() => {
    if (!httpClientData.ui.selectedSavedRequest) return null
    return httpClientData.save.savedRequests.find(item => item.name === httpClientData.ui.selectedSavedRequest)
})

// 获取Header描述
const getHeaderDescription = (headerName: string): string => {
    return commonHeaders.descriptions[headerName] || ''
}

// Header 自动补全过滤函数
const filterHeaderKeys = (inputValue: string) => {
    const filtered = !inputValue ? commonHeaders.keys :
        commonHeaders.keys.filter(key =>
            key.toLowerCase().includes(inputValue.toLowerCase())
        )

    return filtered.map(key => ({value: key, label: key}))
}

const filterHeaderValues = (headerKey: string, inputValue: string) => {
    const possibleValues = commonHeaders.values[headerKey] || []
    const filtered = !inputValue ? possibleValues :
        possibleValues.filter(value =>
            value.toLowerCase().includes(inputValue.toLowerCase())
        )

    return filtered.map(value => ({value, label: value}))
}

// 过滤后的请求列表
const filteredRequests = computed(() => {
    if (!httpClientData.ui.searchKeyword) return httpClientData.save.savedRequests

    const keyword = httpClientData.ui.searchKeyword.toLowerCase()
    return httpClientData.save.savedRequests.filter(item =>
        item.name.toLowerCase().includes(keyword) ||
        item.description?.toLowerCase().includes(keyword) ||
        item.data.url.toLowerCase().includes(keyword)
    )
})

// 显示保存对话框
const showSaveDialog = () => {
    // 如果没有选中的请求，生成默认名称
    if (!httpClientData.ui.selectedSavedRequest) {
        const url = httpClientData.request.url || 'new-request'
        const urlParts = url.split('/')
        const lastPart = urlParts[urlParts.length - 1] || 'request'
        httpClientData.save.form.name = `${httpClientData.request.method}_${lastPart}`.toLowerCase()
    } else {
        // 如果有选中的请求，使用其显示名称
        const selectedRequest = httpClientData.save.savedRequests.find(
            item => item.name === httpClientData.ui.selectedSavedRequest
        )
        httpClientData.save.form.name = selectedRequest ? displayName(selectedRequest.name) : ''
    }

    httpClientData.save.form.description = ''
    httpClientData.ui.saveDialogVisible = true
}

// 显示加载对话框
const showLoadDialog = async () => {
    httpClientData.ui.loadDialogVisible = true
    await loadSavedRequests()
}

// 保存请求
const saveRequest = async () => {
    if (!httpClientData.save.form.name.trim()) {
        Message.error('请输入请求名称')
        return
    }

    httpClientData.ui.saveLoading = true

    try {
        const requestData = {
            method: httpClientData.request.method,
            url: httpClientData.request.url,
            headers: httpClientData.request.headers.filter(h => h.key && h.value),
            queryParams: httpClientData.request.queryParams.filter(p => p.key && p.value),
            bodyType: httpClientData.request.bodyType,
            body: httpClientData.request.body,
            settings: httpClientData.request.settings,
        }

        // 保存响应数据（如果有的话）
        const responseData = httpClientData.response.status ? {
            status: httpClientData.response.status,
            statusText: httpClientData.response.statusText,
            headers: httpClientData.response.headers,
            data: httpClientData.response.isBinary
                ? Array.from(new Uint8Array(httpClientData.response.data))  // 将 ArrayBuffer 转换为数组
                : httpClientData.response.data,
            time: httpClientData.response.time,
            isBinary: httpClientData.response.isBinary,
            contentType: httpClientData.response.contentType
        } : null

        const saveData = {
            name: httpClientData.save.form.name,
            description: httpClientData.save.form.description,
            data: requestData,
            response: responseData
        }

        const fullName = getFullName(httpClientData.save.form.name)
        
        await KVStoreClient.save('httprequest', fullName, {
            description: httpClientData.save.form.description,
            data: requestData,
            response: responseData
        })

        console.log('Save successful')
        Message.success('请求已保存')
        httpClientData.ui.saveDialogVisible = false
        httpClientData.request.name = fullName

        // 先重新加载数据
        await loadSavedRequests()
        
        // 然后设置选中状态
        httpClientData.ui.selectedSavedRequest = fullName
    } catch (error) {
        console.error('保存请求失败:', error)
        Message.error('保存失败')
    } finally {
        httpClientData.ui.saveLoading = false
    }
}

// 复制请求
const copyRequest = async () => {
    if (!httpClientData.copy.form.name.trim()) {
        Message.error('请输入请求名称')
        return
    }

    const existingRequest = httpClientData.save.savedRequests.find(item => item.name === httpClientData.copy.form.name)
    if (existingRequest) {
        Message.error('请求名称已存在，请使用其他名称')
        return
    }

    httpClientData.ui.copyLoading = true

    try {
        const requestData = {
            method: httpClientData.request.method,
            url: httpClientData.request.url,
            headers: httpClientData.request.headers.filter(h => h.key && h.value),
            queryParams: httpClientData.request.queryParams.filter(p => p.key && p.value),
            bodyType: httpClientData.request.bodyType,
            body: httpClientData.request.body,
            settings: httpClientData.request.settings
        }

        // 复制响应数据（如果有的话）
        const responseData = httpClientData.response.status ? {
            status: httpClientData.response.status,
            statusText: httpClientData.response.statusText,
            headers: httpClientData.response.headers,
            data: httpClientData.response.isBinary
                ? Array.from(new Uint8Array(httpClientData.response.data))  // 将 ArrayBuffer 转换为数组
                : httpClientData.response.data,
            time: httpClientData.response.time,
            isBinary: httpClientData.response.isBinary,
            contentType: httpClientData.response.contentType
        } : null

        const saveData = {
            name: httpClientData.copy.form.name,
            description: httpClientData.copy.form.description,
            data: requestData,
            response: responseData
        }

        const fullName = getFullName(httpClientData.copy.form.name)
        
        await KVStoreClient.save('httprequest', fullName, {
            description: httpClientData.copy.form.description,
            data: requestData,
            response: responseData
        })

        console.log('Copy successful')
        Message.success('请求已复制')
        httpClientData.ui.copyDialogVisible = false

        // 先重新加载数据
        await loadSavedRequests()
        
        // 然后设置选中状态为新复制的请求
        httpClientData.ui.selectedSavedRequest = fullName
        httpClientData.request.name = fullName
    } catch (error) {
        console.error('复制请求失败:', error)
        Message.error('复制失败')
    } finally {
        httpClientData.ui.copyLoading = false
    }
}

// 加载保存的请求列表
const loadSavedRequests = async () => {
    httpClientData.ui.loadLoading = true

    try {
        const records = await KVStoreClient.findByType('httprequest')
        console.log('KVStore response:', records)

        // 处理查询结果
        const requests = records.map(record => ({
            id: record.id,
            name: record.name,
            description: record.data.description,
            data: record.data.data,
            response: record.data.response,
            createdAt: record.created_at || new Date().toISOString()
        }))

        httpClientData.save.savedRequests = requests
        console.log('Saved requests:', httpClientData.save.savedRequests)
    } catch (error) {
        console.error('获取保存的请求失败:', error)
        Message.error('获取数据失败: ' + error.message)
    } finally {
        httpClientData.ui.loadLoading = false
    }
}

// 加载请求
const loadRequest = (item: any) => {
    const data = item.data

    httpClientData.request.method = data.method
    httpClientData.request.url = data.url
    httpClientData.request.name = item.name
    httpClientData.ui.selectedSavedRequest = item.name

    // 加载 headers
    httpClientData.request.headers = data.headers.length > 0
        ? [...data.headers, {key: '', value: ''}]
        : [{key: '', value: ''}]

    // 加载查询参数
    httpClientData.request.queryParams = data.queryParams.length > 0
        ? [...data.queryParams, {key: '', value: ''}]
        : [{key: '', value: ''}]

    // 加载 body
    httpClientData.request.bodyType = data.bodyType
    if (data.body) {
        httpClientData.request.body = {...httpClientData.request.body, ...data.body}
    }

    // 加载 settings（使用默认值填充缺失的设置）
    if (data.settings) {
        httpClientData.request.settings = {
            timeout: 30000,
            sslVerify: true,
            followRedirects: true,
            maxRedirects: 5,
            retries: 0,
            userAgent: 'MagicBook/1.0',
            ...data.settings
        }
    } else {
        // 如果没有保存的settings，使用默认值
        httpClientData.request.settings = {
            timeout: 30000,
            sslVerify: true,
            followRedirects: true,
            maxRedirects: 5,
            retries: 0,
            userAgent: 'MagicBook/1.0'
        }
    }

    // 加载响应数据（如果有的话）
    if (item.response) {
        httpClientData.response = {
            status: item.response.status,
            statusText: item.response.statusText || '',
            headers: item.response.headers || {},
            data: item.response.isBinary && Array.isArray(item.response.data)
                ? new Uint8Array(item.response.data).buffer  // 将数组恢复为 ArrayBuffer
                : item.response.data,
            time: item.response.time || 0,
            isBinary: item.response.isBinary || false,
            contentType: item.response.contentType || ''
        }
    } else {
        // 清空响应数据
        httpClientData.response = {
            status: null,
            statusText: '',
            headers: null,
            data: null,
            time: 0
        }
    }

    httpClientData.ui.loadDialogVisible = false
    Message.success(`已加载请求: ${displayName(item.name)}`)
}

// 删除请求
const deleteRequest = async (id: string) => {
    try {
        // 这里应该调用删除API
        httpClientData.save.savedRequests = httpClientData.save.savedRequests.filter(item => item.id !== id)
        Message.success('已删除')
    } catch (error) {
        Message.error('删除失败')
    }
}

// 格式化时间
const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleString('zh-CN')
}

// 格式化响应时间
const formatResponseTime = (time: number) => {
    if (time >= 1000) {
        return `${(time / 1000).toFixed(2)}s`
    }
    return `${time}ms`
}

// 获取响应时间颜色类
const getResponseTimeClass = (time: number) => {
    if (time < 200) return 'time-fast'      // 绿色 - 快速
    if (time < 500) return 'time-normal'    // 蓝色 - 正常  
    if (time < 1000) return 'time-slow'     // 橙色 - 慢
    return 'time-very-slow'                 // 红色 - 很慢
}

// 判断响应内容是否可以美化
const canBeautify = computed(() => {
    if (!httpClientData.response.data) return false
    const dataStr = typeof httpClientData.response.data === 'string'
        ? httpClientData.response.data
        : JSON.stringify(httpClientData.response.data)
    const format = detect(dataStr)
    return format === FORMAT.JSON || format === FORMAT.XML
})

// 格式化响应大小
const formatResponseSize = (data: any) => {
    let size: number

    if (data instanceof ArrayBuffer) {
        size = data.byteLength
    } else if (typeof data === 'string') {
        size = new Blob([data]).size
    } else {
        size = new Blob([JSON.stringify(data)]).size
    }

    if (size < 1024) {
        return `${size} B`
    } else if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`
    } else if (size < 1024 * 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(1)} MB`
    } else {
        return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
    }
}

// 美化响应内容
const beautifyResponse = () => {
    try {
        const dataStr = typeof httpClientData.response.data === 'string'
            ? httpClientData.response.data
            : JSON.stringify(httpClientData.response.data)

        const format = detect(dataStr)
        if (format === FORMAT.JSON) {
            // 美化 JSON
            httpClientData.response.data = detectAndConvert(dataStr, FORMAT.JSON)
        } else if (format === FORMAT.XML) {
            // 美化 XML
            httpClientData.response.data = detectAndConvert(dataStr, FORMAT.XML)
        }
    } catch (error) {
    }
}

// 显示下载对话框
const downloadBinaryResponse = () => {
    if (!httpClientData.response.data || !httpClientData.response.isBinary) {
        Message.error('没有可下载的二进制数据')
        return
    }

    // 生成默认文件名
    let defaultFilename = 'download'
    const contentType = httpClientData.response.contentType || ''

    // 根据 Content-Type 生成合适的文件名
    if (contentType.includes('image/')) {
        const ext = contentType.split('/')[1] || 'bin'
        defaultFilename = `image.${ext}`
    } else if (contentType.includes('video/')) {
        const ext = contentType.split('/')[1] || 'bin'
        defaultFilename = `video.${ext}`
    } else if (contentType.includes('audio/')) {
        const ext = contentType.split('/')[1] || 'bin'
        defaultFilename = `audio.${ext}`
    } else if (contentType.includes('application/pdf')) {
        defaultFilename = 'document.pdf'
    } else if (contentType.includes('application/zip')) {
        defaultFilename = 'archive.zip'
    } else {
        defaultFilename = 'file.bin'
    }

    // 尝试从响应头中获取文件名
    const contentDisposition = httpClientData.response.headers['content-disposition']
    if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (match && match[1]) {
            defaultFilename = match[1].replace(/['"]/g, '')
        }
    }

    // 设置默认文件名并显示对话框
    httpClientData.download.form.filename = defaultFilename
    httpClientData.ui.downloadDialogVisible = true
}

// 确认下载
const confirmDownload = () => {
    try {
        const filename = httpClientData.download.form.filename.trim()
        if (!filename) {
            Message.error('请输入文件名')
            return
        }

        // 创建 Blob 对象
        const blob = new Blob([httpClientData.response.data], {
            type: httpClientData.response.contentType || 'application/octet-stream'
        })

        // 创建下载链接
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        Message.success(`文件已下载: ${filename}`)
        httpClientData.ui.downloadDialogVisible = false

        // 清空表单
        httpClientData.download.form.filename = ''
    } catch (error) {
        console.error('下载失败:', error)
        Message.error('下载失败')
    }
}

// 清理当前请求数据
const clearCurrentRequest = () => {
    // 重置所有请求数据为初始状态
    Object.assign(httpClientData.request, {
        method: 'GET',
        url: '',
        name: '',
        headers: [
            {key: 'Content-Type', value: 'application/json'},
            {key: '', value: ''}
        ],
        queryParams: [
            {key: '', value: ''}
        ],
        bodyType: 'none',
        body: {
            json: '{\n  "key": "value"\n}',
            text: '',
            formData: [{key: '', value: ''}]
        },
        settings: {
            timeout: 30000,
            sslVerify: true,
            followRedirects: true,
            maxRedirects: 5,
            retries: 0,
            userAgent: 'MagicBook/1.0'
        }
    })

    // 清理响应数据
    Object.assign(httpClientData.response, {
        status: null,
        statusText: '',
        headers: null,
        data: null,
        time: 0,
        isBinary: false,
        contentType: ''
    })

    // 重置UI状态
    httpClientData.ui.requestActiveTab = 'body'
    httpClientData.ui.responseActiveTab = 'body'
    httpClientData.ui.selectedSavedRequest = ''

    Message.success('已清空当前请求数据')
}

// 显示名称（直接返回，不再处理前缀）
const displayName = (name: string) => {
    return name
}

// 获取完整名称（直接返回，不再添加前缀）
const getFullName = (name: string) => {
    return name
}

// 选择保存的请求
const onSelectSavedRequest = (requestName: string) => {
    if (!requestName) {
        return
    }

    const item = httpClientData.save.savedRequests.find(req => req.name === requestName)
    if (item) {
        loadRequest(item)
    }
}

// 处理保存操作
const handleSave = () => {
    // 如果已经选择了保存的用例，直接保存
    if (httpClientData.ui.selectedSavedRequest) {
        const selectedRequest = httpClientData.save.savedRequests.find(
            item => item.name === httpClientData.ui.selectedSavedRequest
        )
        if (selectedRequest) {
            // 直接保存到已有用例
            httpClientData.save.form.name = displayName(selectedRequest.name)
            httpClientData.save.form.description = selectedRequest.description || ''
            saveRequest()
            return
        }
    }

    // 否则弹出命名对话框
    showSaveDialog()
}

// 处理新建操作
const handleNew = () => {
    clearCurrentRequest()
}

// 处理复制操作
const handleCopy = () => {
    if (!httpClientData.ui.selectedSavedRequest) {
        Message.warning('请先选择要复制的请求')
        return
    }

    const selectedRequest = httpClientData.save.savedRequests.find(
        item => item.name === httpClientData.ui.selectedSavedRequest
    )

    if (!selectedRequest) {
        Message.error('未找到选中的请求')
        return
    }

    // 设置复制表单的默认值
    httpClientData.copy.form.name = `${displayName(selectedRequest.name)}_副本`
    httpClientData.copy.form.description = selectedRequest.description || ''
    httpClientData.ui.copyDialogVisible = true
}

// 处理删除操作
const handleDelete = async () => {
    if (!httpClientData.ui.selectedSavedRequest) {
        Message.warning('请先选择要删除的请求')
        return
    }

    const selectedRequest = httpClientData.save.savedRequests.find(
        item => item.id === httpClientData.ui.selectedSavedRequest
    )

    if (!selectedRequest) {
        Message.error('未找到选中的请求')
        return
    }

    try {
        const confirmed = await new Promise((resolve) => {
            Modal.confirm({
                title: '确认删除',
                content: `确定要删除请求 "${displayName(selectedRequest.name)}" 吗？此操作不可撤销。`,
                okText: '删除',
                cancelText: '取消',
                okButtonProps: {status: 'danger'},
                onOk: () => resolve(true),
                onCancel: () => resolve(false)
            })
        })

        if (!confirmed) return

        // 删除远程保存的请求
        await KVStoreClient.delete('httprequest', selectedRequest.name)
        
        Message.success('请求已删除')

        // 从列表中移除
        httpClientData.save.savedRequests = httpClientData.save.savedRequests.filter(
            item => item.name !== httpClientData.ui.selectedSavedRequest
        )
        clearCurrentRequest()
    } catch (error) {
        console.error('删除请求失败:', error)
        Message.error('删除失败: ' + error.message)
    }
}


// 计算编辑器高度
const calculateEditorHeight = () => {
    // 获取可用高度并减去其他元素的高度
    const windowHeight = window.innerHeight
    const headerHeight = 100 // 顶部区域高度
    const tabHeaderHeight = 50 // tab头部高度
    const toolbarHeight = 80 // 工具栏高度
    const padding = 40 // 内边距

    const availableHeight = windowHeight - headerHeight - tabHeaderHeight - toolbarHeight - padding
    editorHeight.value = Math.max(300, availableHeight) + 'px'
}

// 组件挂载时加载保存的请求
onMounted(async () => {
    await loadSavedRequests()
    calculateEditorHeight()

    // 监听窗口大小变化
    window.addEventListener('resize', calculateEditorHeight)
})

// 组件卸载时清理事件监听
onUnmounted(() => {
    window.removeEventListener('resize', calculateEditorHeight)
})

// 导出数据管理对象供外部使用
const exportHttpClientData = () => {
    return {
        // 深拷贝当前数据状态
        data: JSON.parse(JSON.stringify(httpClientData)),
        // 提供清理方法
        clear: clearCurrentRequest,
        // 提供设置数据方法
        setData: (newData: any) => {
            if (newData.request) Object.assign(httpClientData.request, newData.request)
            if (newData.response) Object.assign(httpClientData.response, newData.response)
            if (newData.ui) Object.assign(httpClientData.ui, newData.ui)
            if (newData.save) Object.assign(httpClientData.save, newData.save)
        },
        // 获取响应式数据引用
        reactive: httpClientData
    }
}

// 暴露给父组件使用
defineExpose({
    httpClientData,
    exportHttpClientData,
    clearCurrentRequest
})
</script>

<style scoped>
.http-client {
    height: calc(100vh - 100px);
    display: flex;
    flex-direction: column;
    background: #fff;
    padding: 8px;
}

.request-header {
    padding: 12px;
    margin-bottom: 8px;
    background: #fafafa;
    border-radius: 6px;
}

.request-line {
    display: flex;
    gap: 12px;
    align-items: center;
}

.method-select {
    flex-shrink: 0;
}

.url-input {
    flex: 1;
}

.send-button {
    flex-shrink: 0;
    min-width: 80px;
}

/* 删除选项的特殊样式 */
:deep(.arco-dropdown-option.delete-option) {
    color: #f53f3f;
}

:deep(.arco-dropdown-option.delete-option:hover) {
    background-color: #ffece8;
    color: #f53f3f;
}

.saved-requests-select {
    flex-shrink: 0;
}

.saved-request-option {
    display: flex;
    align-items: center;
    gap: 8px;
}

.saved-request-option .method-tag {
    padding: 1px 4px;
    border-radius: 2px;
    font-size: 9px;
    font-weight: 500;
    color: #fff;
    min-width: 25px;
    text-align: center;
    display: inline-block;
    line-height: 1.8;
}

.saved-request-option .request-name {
    font-size: 13px;
    color: #1d2129;
}


.main-content {
    flex: 1;
    display: flex;
    min-height: 0;
}

.split-container {
    width: 100%;
    height: 100%;
}

.panel-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: #4e5969;
}


.response-status-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    margin-right: 12px;
}

.status-code {
    font-weight: 600;
    font-size: 12px;
}

/* 状态码字体颜色样式 */
.status-success {
    color: #52c41a;
}

.status-info {
    color: #1890ff;
}

.status-warning {
    color: #fa8c16;
}

.status-error {
    color: #ff4d4f;
}

.status-default {
    color: #8c8c8c;
}

.response-status-info .response-time {
    font-size: 11px;
    font-weight: 500;
}

/* 响应时间字体颜色样式 */
.time-fast {
    color: #52c41a;
}

.time-normal {
    color: #1890ff;
}

.time-slow {
    color: #fa8c16;
}

.time-very-slow {
    color: #ff4d4f;
}


/* 为 Tab 内容区增加左右内边距，避免内容贴边 */
.request-tabs,
.response-tabs {
    height: 100%;
    padding-left: 10px;
    padding-right: 10px;
    box-sizing: border-box;
    overflow: hidden;
}

/* 确保 tabs 内容区域能够填满高度 */
.request-tabs :deep(.arco-tabs-content),
.response-tabs :deep(.arco-tabs-content) {
    height: calc(100% - 32px); /* 减去tab头部高度 */
    display: flex;
    flex-direction: column;
}

.request-tabs :deep(.arco-tabs-content-list),
.response-tabs :deep(.arco-tabs-content-list) {
    height: 100%;
    display: flex;
}

.request-tabs :deep(.arco-tabs-content-item),
.response-tabs :deep(.arco-tabs-content-item) {
    height: 100%;
    width: 100%;
    display: flex !important;
    flex-direction: column;
}

/* Body tab pane 特殊样式 */
.body-tab-pane,
.response-tab-pane {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.body-config {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.response-body {
    height: 100%;
    display: flex;
    flex-direction: column;
}

:deep(.arco-tabs-pane) {
    height: 100%;
}

:deep(.vue-codemirror) {
    height: 100%;
}

.response-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.body-type-selector {
    margin-bottom: 16px;
    flex-shrink: 0;
}

.body-content {
    height: 100%;
}

.body-editor {
    height: 100%;
}

.raw-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
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

/* CodeMirror 基础样式 */
.body-codemirror,
.response-codemirror {
    height: 100%;
}

.form-data,
.headers-config,
.query-config {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-item,
.header-item,
.query-item {
    display: flex;
    gap: 8px;
    align-items: center;
}

.form-key,
.form-value,
.header-key,
.header-value,
.query-key,
.query-value {
    flex: 1;
}

/* Header 自动补全样式 */
.header-option {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.header-name {
    font-weight: 500;
    color: #1d2129;
}

.header-desc {
    font-size: 12px;
    color: #86909c;
    line-height: 1.2;
}

.header-value-option {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    color: #4e5969;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 自动补全下拉框样式 */
.header-key :deep(.arco-auto-complete-popup),
.header-value :deep(.arco-auto-complete-popup) {
    max-height: 200px;
    overflow-y: auto;
}

.header-key :deep(.arco-auto-complete-option),
.header-value :deep(.arco-auto-complete-option) {
    padding: 8px 12px;
}

.header-key :deep(.arco-auto-complete-option:hover),
.header-value :deep(.arco-auto-complete-option:hover) {
    background-color: #f7f8fa;
}

.add-form-btn,
.add-header-btn,
.add-query-btn {
    align-self: flex-start;
    margin-top: 8px;
}

/* Settings 配置样式 */
.settings-config {
    padding: 16px;
    background-color: #fafafa;
    border-radius: 4px;
    overflow-y: auto;
}

.settings-section {
    margin-bottom: 24px;
}

.settings-section:last-child {
    margin-bottom: 0;
}

.section-title {
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 600;
    color: #1d2129;
    border-bottom: 1px solid #e5e6eb;
    padding-bottom: 8px;
}

.setting-item {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.setting-item:last-child {
    margin-bottom: 0;
}

.setting-item .arco-form-item-label {
    min-width: 120px;
    margin-bottom: 0;
}

.setting-description {
    color: #86909c;
    font-size: 12px;
    margin-left: 8px;
}


.response-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e6eb;
    flex-shrink: 0;
}

.response-actions {
    display: flex;
    gap: 8px;
    align-items: center;
}

.response-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.response-size {
    font-size: 12px;
    color: #86909c;
    font-weight: 500;
}

.empty-response,
.loading-response {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #86909c;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
}

.response-data {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}


/* 十六进制查看器样式 */
.response-codemirror.hex-viewer {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.4;
    background: #fafafa;
}

.response-codemirror.hex-viewer .cm-content {
    color: #2d3748;
    letter-spacing: 0.5px;
}

.response-codemirror.hex-viewer .cm-line {
    padding-left: 8px;
}

/* 响应区域特殊样式 */
.response-codemirror.pretty-json,
.response-codemirror.raw-response {
    background: #f7f8fa;
}

.response-headers {
    height: 100%;
}

.empty-headers {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #86909c;
}

.headers-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.header-row {
    display: flex;
    padding: 8px;
    background: #f7f8fa;
    border-radius: 4px;
}

.header-name {
    font-weight: 600;
    color: #1d2129;
    min-width: 150px;
    margin-right: 16px;
}

.header-value {
    color: #4e5969;
    word-break: break-all;
}

/* 保存/打开对话框样式 */
.saved-requests {
    max-height: 500px;
}

.search-bar {
    margin-bottom: 16px;
}

.requests-list {
    max-height: 400px;
    overflow-y: auto;
}

.request-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border: 1px solid #e5e6eb;
    border-radius: 6px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.request-item:hover {
    border-color: #165dff;
    background: #f8f9ff;
}

.request-info {
    flex: 1;
}

.request-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}

.method-tag {
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 500;
    color: #fff;
    min-width: 32px;
    text-align: center;
    display: inline-block;
}

.method-tag.get {
    background: #52c41a;
}

.method-tag.post {
    background: #fa8c16;
}

.method-tag.put {
    background: #1890ff;
}

.method-tag.delete {
    background: #ff4d4f;
}

.method-tag.patch {
    background: #722ed1;
}

.method-tag.head {
    background: #8c8c8c;
}

.method-tag.options {
    background: #13c2c2;
}

.request-name {
    font-weight: 600;
    color: #1d2129;
}

.request-url {
    color: #4e5969;
    font-size: 13px;
    margin-bottom: 4px;
    word-break: break-all;
}

.request-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #86909c;
}

.description {
    font-style: italic;
}

.request-actions {
    flex-shrink: 0;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #86909c;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .main-content {
        flex-direction: column;
        gap: 8px;
    }

    .request-panel,
    .response-panel {
        min-height: 300px;
    }

    .request-line {
        flex-wrap: wrap;
        gap: 8px;
    }

    .saved-requests-select {
        width: 150px !important;
    }

    .method-select {
        width: 80px !important;
    }
}
</style>
