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
import {ref} from "vue";
import {Mode} from 'vanilla-jsoneditor'

defineOptions({
    name: 'Json'
})

const value = ref()

</script>