<template>
    <JsonEditorVue
        v-model="value"
        :mode="Mode.text"
        :stringified="false"
        style="height: calc(100vh - 100px)"
    />
</template>

<script lang="ts" setup>
import JsonEditorVue from 'json-editor-vue'
import {ref, watch} from "vue";
import {Mode} from 'vanilla-jsoneditor'
import {useRoute} from 'vue-router'
import httpClient from "../../../utils/http-client";

defineOptions({
    name: 'Json'
})

const value = ref()

</script>