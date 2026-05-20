import Sortable, { AutoScroll } from 'sortablejs/modular/sortable.core.esm'
import { onBeforeUnmount, watch } from '@common/utils/vueTools'
import { clearDownKeys } from '@renderer/event'

Sortable.mount(new AutoScroll())

const noop = () => {}

const normalizeSelector = (value) => {
  if (!value) return null
  if (value.startsWith('.') ||
    value.startsWith('#') ||
    value.startsWith('[') ||
    value.includes(' ') ||
    value.includes('>') ||
    value.includes(':')) return value
  return '.' + value
}

export default ({
  dom_list,
  dragingItemClassName,
  filter,
  handle = null,
  group = null,
  onUpdate,
  onAdd = null,
  onStart = noop,
  onEnd = noop,
  onDragStart = noop,
  onDragEnd = noop,
  onReady = noop,
}) => {
  let sortable
  let pendingDisabled = true

  const initSortable = (el) => {
    if (!el) return
    if (sortable) {
      sortable.destroy()
      sortable = null
    }
    sortable = Sortable.create(el, {
      animation: 150,
      disabled: pendingDisabled,
      forceFallback: true,
      fallbackTolerance: 4,
      fallbackOnBody: true,
      group: group || undefined,
      filter: normalizeSelector(filter),
      handle: normalizeSelector(handle),
      ghostClass: dragingItemClassName,
      onUpdate(event) {
        onUpdate(event.newIndex, event.oldIndex)
      },
      onAdd(event) {
        if (!onAdd) return
        onAdd(event.newIndex, event.oldIndex)
      },
      onMove() {
        return true
      },
      onStart() {
        onStart()
        onDragStart()
        window.app_event.dragStart()
      },
      onEnd() {
        onEnd()
        onDragEnd()
        // 处于拖动状态期间，键盘事件无法监听，拖动结束手动清理按下的键
        clearDownKeys()
        window.app_event.dragEnd()
      },
    })
    sortable.option('disabled', pendingDisabled)
    onReady()
  }

  watch(dom_list, el => {
    if (sortable) {
      sortable.destroy()
      sortable = null
    }
    if (el) initSortable(el)
  }, { immediate: true, flush: 'post' })

  onBeforeUnmount(() => {
    if (sortable) {
      sortable.destroy()
      sortable = null
    }
  })

  return {
    setDisabled: (disabled) => {
      pendingDisabled = disabled
      if (!sortable) return
      sortable.option('disabled', disabled)
    },
  }
}
