<template>
  <div ref="editor" class="vue-jsoneditor"></div>
</template>

<script>
import {createJSONEditor} from 'vanilla-jsoneditor';

// JSONEditor properties as of version 2.3.1
const supportedPropNames = [
  'content',
  'selection',
  'readOnly',
  'indentation',
  'tabSize',
  'mode',
  'mainMenuBar',
  'navigationBar',
  'statusBar',
  'askToFormat',
  'escapeControlCharacters',
  'escapeUnicodeCharacters',
  'flattenColumns',
  'parser',
  'validator',
  'validationParser',
  'pathParser',
  'queryLanguages',
  'queryLanguageId',
  'onChangeQueryLanguage',
  'onChange',
  'onRenderValue',
  'onClassName',
  'onRenderMenu',
  'onRenderContextMenu',
  'onChangeMode',
  'onSelect',
  'onError',
  'onFocus',
  'onBlur',
];
const supportedPropNamesSet = new Set(supportedPropNames);

function filterProps(props, prevProps) {
  return Object.fromEntries(
      Object.entries(props)
          .filter(([key, value]) => supportedPropNamesSet.has(key))
          .filter(([key, value]) => value !== prevProps[key])
  );
}

export default {
  name: 'VueJSONEditor',
  props: supportedPropNames,
  mounted() {
    // filter the props that actually changed
    // since the last time to prevent syncing issues
    const props = filterProps(this, {});
    this.prevProps = props;

    this.editor = createJSONEditor({
      target: this.$refs['editor'],
      props,
    });
    console.log('create editor', this.editor, props);
  },
  updated() {
    const updatedProps = filterProps(this, this.prevProps);
    console.log('update props', updatedProps);
    this.prevProps = updatedProps;
    this.editor.updateProps(updatedProps);
  },
  beforeUnmount() {
    console.log('destroy editor');
    this.editor.destroy();
    this.editor = null;
  },
};
</script>

<style scoped>
.vue-jsoneditor {
  display: flex;
  flex: 1;
}
</style>
