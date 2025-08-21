import {createRouter, createWebHistory} from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../components/Home.vue'),
        meta: {
            desc: '主页'
        }
    },
    {
        path: '/pdf',
        name: 'PDF处理',
        component: () => import('../components/feature/toolbox/Pdf.vue'),
        meta: {
            category: '通用工具',
            searchKeys: ['pdf', '合并', '加密', '解密', '转换'],
            desc: 'pdf合并、转换、加解密等常用操作'
        }
    },
    {
        path: '/json',
        name: 'Json操作',
        component: () => import('../components/feature/toolbox/Json.vue'),
        meta: {
            category: '通用工具',
            searchKeys: ['json', '校验', '格式化', '压缩', '编辑'],
            desc: 'json校验、格式化、压缩、编辑等'
        }
    },
    {
        path: '/convert',
        name: '文本格式转换',
        component: () => import('../components/feature/toolbox/Converter.vue'),
        meta: {
            category: '通用工具',
            searchKeys: ['json', 'xml', 'yaml', 'properties', '格式转换'],
            desc: 'xml、yaml等格式文件转换'
        }
    },
    {
        path: '/tcmsp',
        name: 'TCMSP数据下载',
        component: () => import('../components/feature/toolbox/Json.vue'),
        meta: {
            category: '生物信息',
            searchKeys: ['tcmsp', 'herb', 'targets', 'ingredients'],
            desc: 'tcmsp 药物/靶点数据下载'
        }
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
