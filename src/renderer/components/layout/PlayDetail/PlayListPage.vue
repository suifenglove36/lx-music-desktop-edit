<template lang="pug">
div(:class="['right', $style.right]")
  PlayListPanel
</template>

<script>
import PlayListPanel from './components/PlayListPanel.vue'

export default {
  name: 'PlayListPage',
  components: {
    PlayListPanel,
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.right {
  flex: 0 0 60%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  position: relative;
  display: flex;
  flex-flow: column nowrap;
  overflow: hidden;
  transition: flex-basis @transition-normal;
}
</style>
