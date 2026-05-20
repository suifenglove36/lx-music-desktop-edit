<template>
  <div :class="$style.panel">
    <div :class="$style.header">
      <div :class="$style.headerInfo">
        <div :class="$style.title">播放列表</div>
        <div :class="$style.subtitle">
          {{ currentListLabel }}
          <span v-if="activeListId"> · {{ currentItems.length }} 首</span>
          <span v-if="isTempPlayListVisible"> · 稍后播放 {{ tempPlayList.length }} 首</span>
        </div>
      </div>
      <div :class="$style.headerActions">
        <button
          :class="$style.iconButton"
          type="button"
          :aria-label="'刷新播放列表'"
          :disabled="isLoading"
          @click="handleReload"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <use xlink:href="#icon-refresh" />
          </svg>
        </button>
      </div>
    </div>

    <div :class="$style.body">
      <section :class="$style.section">
        <div :class="$style.sectionHeader">
          <div>
            <div :class="$style.sectionTitle">{{ currentListLabel }}</div>
            <div :class="$style.sectionMeta">
              <span v-if="activeListId">可拖拽排序、点击播放</span>
              <span v-else>当前没有可展示的列表</span>
            </div>
          </div>
          <div :class="$style.sectionActions">
            <button
              :class="$style.textButton"
              type="button"
              :disabled="!currentItems.length"
              @click="handleClearCurrent"
            >
              清空当前列表
            </button>
          </div>
        </div>

        <div ref="domScrollArea" :class="$style.scrollArea">
          <div v-if="isLoading" :class="$style.loadingState">
            <div :class="$style.loadingSpinner" />
            <div>正在读取播放列表...</div>
          </div>

          <template v-else>
            <div :class="$style.listStack">
              <template v-if="currentItems.length">
                <ul
                  v-if="currentPreItems.length"
                  ref="domCurrentPreList"
                  :class="[$style.list, { [$style.sortable]: canSortCurrentPre }]"
                >
                  <li
                    v-for="(item, index) in currentPreItems"
                    :key="getCurrentRowKey(item, getCurrentPreItemIndex(index))"
                    :ref="isCurrentPlayingItem(item) ? setCurrentActiveRow : null"
                    :class="[
                      $style.item,
                      { [$style.active]: isCurrentPlayingItem(item) },
                      { [$style.activePlaying]: isCurrentPlayingItem(item) && isPlay },
                    ]"
                    :data-playlist-active="isCurrentPlayingItem(item) ? 'true' : null"
                    @click="handlePlayCurrentItem(item)"
                  >
                    <span :class="$style.dragHandle" aria-hidden="true">::</span>
                    <span :class="$style.index">{{ getCurrentPreItemIndex(index) + 1 }}</span>
                    <span
                      v-if="isCurrentPlayingItem(item)"
                      :class="$style.playDot"
                      aria-hidden="true"
                    />
                    <span
                      v-if="isCurrentPlayingItem(item)"
                      :class="[$style.playState, { [$style.playStatePlaying]: isPlay }]"
                      aria-hidden="true"
                    >
                      <span />
                      <span />
                      <span />
                    </span>
                    <div :class="$style.meta">
                      <div :class="$style.name">{{ getItemName(item) }}</div>
                      <div :class="$style.singer">{{ getItemSinger(item) }}</div>
                    </div>
                    <div :class="$style.actions">
                      <button
                        class="drag-ignore"
                        :class="$style.rowButton"
                        type="button"
                        :aria-label="'删除此条目'"
                        @click.stop="handleRemoveCurrentItem(getCurrentPreItemIndex(index))"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <use xlink:href="#icon-close" />
                        </svg>
                      </button>
                    </div>
                  </li>
                </ul>

                <div v-if="isTempPlayListVisible" :class="$style.queueCard">
                  <div :class="$style.queueHeader">
                    <div :class="$style.queueHeaderInfo">
                      <div :class="$style.queueTitle">稍后播放</div>
                      <div :class="$style.queueMeta">
                        {{ tempPlayList.length }} 首会排在当前歌曲后面
                      </div>
                    </div>
                    <div :class="$style.sectionActions">
                      <button
                        :class="$style.textButton"
                        type="button"
                        :disabled="!tempPlayList.length"
                        @click="handleClearTemp"
                      >
                        清空稍后播放
                      </button>
                    </div>
                  </div>

                  <ul
                    ref="domTempList"
                    :class="[$style.list, $style.queueList, { [$style.sortable]: tempPlayList.length > 1 }]"
                  >
                    <li
                      v-for="(item, index) in tempPlayList"
                      :key="getTempRowKey(item, index)"
                      :ref="isCurrentPlayingItem(item) ? setCurrentActiveRow : null"
                      :class="[$style.item, $style.queueItem, { [$style.active]: isCurrentPlayingItem(item) }, { [$style.activePlaying]: isCurrentPlayingItem(item) && isPlay }]"
                      :data-playlist-active="isCurrentPlayingItem(item) ? 'true' : null"
                      @click="handlePlayTempItem(item)"
                    >
                      <span :class="$style.dragHandle" aria-hidden="true">::</span>
                      <span :class="$style.index">{{ index + 1 }}</span>
                      <span
                        v-if="isCurrentPlayingItem(item)"
                        :class="$style.playDot"
                        aria-hidden="true"
                      />
                      <span
                        v-if="isCurrentPlayingItem(item)"
                        :class="[$style.playState, { [$style.playStatePlaying]: isPlay }]"
                        aria-hidden="true"
                      >
                        <span />
                        <span />
                        <span />
                      </span>
                      <div :class="$style.meta">
                        <div :class="$style.name">{{ getTempItemName(item) }}</div>
                        <div :class="$style.singer">{{ getTempItemSinger(item) }}</div>
                      </div>
                      <div :class="$style.actions">
                        <button
                          class="drag-ignore"
                          :class="$style.rowButton"
                          type="button"
                          :aria-label="'删除此条目'"
                          @click.stop="handleRemoveTempItem(index)"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <use xlink:href="#icon-close" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  </ul>
                </div>

                <ul
                  v-if="currentPostItems.length"
                  ref="domCurrentPostList"
                  :class="[$style.list, { [$style.sortable]: canSortCurrentPost }]"
                >
                  <li
                    v-for="(item, index) in currentPostItems"
                    :key="getCurrentRowKey(item, getCurrentPostItemIndex(index))"
                    :ref="isCurrentPlayingItem(item) ? setCurrentActiveRow : null"
                    :class="[$style.item, { [$style.active]: isCurrentPlayingItem(item) }, { [$style.activePlaying]: isCurrentPlayingItem(item) && isPlay }]"
                    :data-playlist-active="isCurrentPlayingItem(item) ? 'true' : null"
                    @click="handlePlayCurrentItem(item)"
                  >
                    <span :class="$style.dragHandle" aria-hidden="true">::</span>
                    <span :class="$style.index">{{ getCurrentPostItemIndex(index) + 1 }}</span>
                    <span
                      v-if="isCurrentPlayingItem(item)"
                      :class="$style.playDot"
                      aria-hidden="true"
                    />
                    <span
                      v-if="isCurrentPlayingItem(item)"
                      :class="[$style.playState, { [$style.playStatePlaying]: isPlay }]"
                      aria-hidden="true"
                    >
                      <span />
                      <span />
                      <span />
                    </span>
                    <div :class="$style.meta">
                      <div :class="$style.name">{{ getItemName(item) }}</div>
                      <div :class="$style.singer">{{ getItemSinger(item) }}</div>
                    </div>
                    <div :class="$style.actions">
                      <button
                        class="drag-ignore"
                        :class="$style.rowButton"
                        type="button"
                        :aria-label="'删除此条目'"
                        @click.stop="handleRemoveCurrentItem(getCurrentPostItemIndex(index))"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <use xlink:href="#icon-close" />
                        </svg>
                      </button>
                    </div>
                  </li>
                </ul>
              </template>

              <template v-else>
                <div :class="$style.emptyState">
                  <svg :class="$style.emptyIcon" viewBox="0 0 24 24" aria-hidden="true">
                    <use xlink:href="#icon-list-order" />
                  </svg>
                  <div :class="$style.emptyTitle">列表为空</div>
                  <div :class="$style.emptyText">
                    {{ emptyCurrentHint }}
                  </div>
                </div>

                <div v-if="isTempPlayListVisible" :class="$style.queueCard">
                  <div :class="$style.queueHeader">
                    <div :class="$style.queueHeaderInfo">
                      <div :class="$style.queueTitle">稍后播放</div>
                      <div :class="$style.queueMeta">
                        {{ tempPlayList.length }} 首待播放歌曲
                      </div>
                    </div>
                    <div :class="$style.sectionActions">
                      <button
                        :class="$style.textButton"
                        type="button"
                        :disabled="!tempPlayList.length"
                        @click="handleClearTemp"
                      >
                        清空稍后播放
                      </button>
                    </div>
                  </div>
                  <ul
                    ref="domTempList"
                    :class="[$style.list, $style.queueList, { [$style.sortable]: tempPlayList.length > 1 }]"
                  >
                  <li
                    v-for="(item, index) in tempPlayList"
                    :key="getTempRowKey(item, index)"
                    :ref="isCurrentPlayingItem(item) ? setCurrentActiveRow : null"
                    :class="[$style.item, $style.queueItem, { [$style.active]: isCurrentPlayingItem(item) }, { [$style.activePlaying]: isCurrentPlayingItem(item) && isPlay }]"
                    :data-playlist-active="isCurrentPlayingItem(item) ? 'true' : null"
                    @click="handlePlayTempItem(item)"
                  >
                      <span :class="$style.dragHandle" aria-hidden="true">::</span>
                      <span :class="$style.index">{{ index + 1 }}</span>
                      <span
                        v-if="isCurrentPlayingItem(item)"
                        :class="$style.playDot"
                        aria-hidden="true"
                      />
                      <span
                        v-if="isCurrentPlayingItem(item)"
                        :class="[$style.playState, { [$style.playStatePlaying]: isPlay }]"
                        aria-hidden="true"
                      >
                        <span />
                        <span />
                        <span />
                      </span>
                      <div :class="$style.meta">
                        <div :class="$style.name">{{ getTempItemName(item) }}</div>
                        <div :class="$style.singer">{{ getTempItemSinger(item) }}</div>
                      </div>
                    <div :class="$style.actions">
                      <button
                        class="drag-ignore"
                        :class="$style.rowButton"
                        type="button"
                        :aria-label="'删除此条目'"
                        @click.stop="handleRemoveTempItem(index)"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <use xlink:href="#icon-close" />
                        </svg>
                      </button>
                    </div>
                    </li>
                  </ul>
                </div>
              </template>
            </div>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { computed, onBeforeUnmount, ref, useCssModule, watch, nextTick } from '@common/utils/vueTools'
import { dialog } from '@renderer/plugins/Dialog'
import { useI18n } from '@renderer/plugins/i18n'
import { downloadList } from '@renderer/store/download/state'
import { getDownloadList, removeDownloadTasks } from '@renderer/store/download/action'
import { defaultList, loveList, tempListMeta, userLists } from '@renderer/store/list/state'
import { getListMusics } from '@renderer/store/list/action'
import { listMusicRemove as removeLocalListMusics, listMusicUpdatePosition as updateLocalListMusicsPosition, listMusicOverwrite as overwriteLocalListMusics } from '@renderer/store/list/listManage/action'
import { isPlay, isShowPlayList, playInfo, playMusicInfo, tempPlayList } from '@renderer/store/player/state'
import { clearTempPlayeList, moveTempPlayList, removeTempPlayList, setPlayListId, updatePlayIndex } from '@renderer/store/player/action'
import { LIST_IDS } from '@common/constants'
import { playListById, playNext } from '@renderer/core/player'
import useDrag from '@renderer/utils/compositions/useDrag'

const moveArrayItem = (list, fromIndex, toIndex) => {
  if (fromIndex === toIndex) return
  const [item] = list.splice(fromIndex, 1)
  if (!item) return
  list.splice(Math.min(toIndex, list.length), 0, item)
}

export default {
  name: 'PlayListPanel',
  setup() {
    const t = useI18n()
    const styles = useCssModule()

    const domCurrentPreList = ref(null)
    const domCurrentPostList = ref(null)
    const domTempList = ref(null)
    const domScrollArea = ref(null)
    const domCurrentActiveRow = ref(null)
    const isDragging = ref(false)
    let dragUnlockTimer = null
    const scrollFrame = ref(null)
    const scrollTaskId = ref(0)
    const currentDragGroup = 'playlist-current-list'
    const isLoading = ref(false)
    const currentItems = ref([])
    const loadSeq = ref(0)

    const activeListId = computed(() => playInfo.playerListId ?? playMusicInfo.listId ?? null)
    const currentSourceListId = computed(() => activeListId.value == LIST_IDS.TEMP ? tempListMeta.id || null : activeListId.value)
    const isDownloadList = computed(() => activeListId.value == LIST_IDS.DOWNLOAD)
    const isTempPlayListVisible = computed(() => tempPlayList.length > 0)
    const currentPlayingIndex = computed(() => {
      if (!currentItems.value.length || !playMusicInfo.musicInfo?.id) return -1
      return currentItems.value.findIndex(item => getMusicInfo(item)?.id == playMusicInfo.musicInfo.id)
    })
    const currentPreItems = computed(() => {
      if (currentPlayingIndex.value < 0) return currentItems.value
      return currentItems.value.slice(0, currentPlayingIndex.value + 1)
    })
    const currentPostItems = computed(() => {
      if (currentPlayingIndex.value < 0) return []
      return currentItems.value.slice(currentPlayingIndex.value + 1)
    })
    const canSortCurrentPre = computed(() => !!activeListId.value && currentPreItems.value.length > 0)
    const canSortCurrentPost = computed(() => !!activeListId.value && currentPostItems.value.length > 0)

    const currentListLabel = computed(() => {
      const listId = currentSourceListId.value
      if (!listId) return '当前播放列表'
      if (listId == LIST_IDS.DOWNLOAD) return '下载列表'
      if (listId == defaultList.id) return t(defaultList.name)
      if (listId == loveList.id) return t(loveList.name)
      const userList = userLists.find(item => item.id === listId)
      return userList?.name ?? '播放列表'
    })

    const emptyCurrentHint = computed(() => {
      if (activeListId.value == LIST_IDS.DOWNLOAD) {
        return '下载列表还没有任务，或尚未完成读取。'
      }
      if (!activeListId.value) {
        return '没有可展示的播放列表，先从歌曲列表开始播放。'
      }
      return '这个列表当前为空，点击刷新试试。'
    })

    const getMusicInfo = (item) => {
      if (!item) return null
      if (item.metadata?.musicInfo) return item.metadata.musicInfo
      if (item.musicInfo) return item.musicInfo
      return item
    }

    const getItemName = (item) => {
      return getMusicInfo(item)?.name || '未知歌曲'
    }

    const getItemSinger = (item) => {
      return getMusicInfo(item)?.singer || '未知歌手'
    }

    const getTempItemName = (item) => {
      return getMusicInfo(item)?.name || '未知歌曲'
    }

    const getTempItemSinger = (item) => {
      return getMusicInfo(item)?.singer || '未知歌手'
    }

    const getCurrentRowKey = (item, index) => `${activeListId.value ?? 'none'}_${getMusicInfo(item)?.id ?? index}`
    const getTempRowKey = (item, index) => `${item.listId ?? 'temp'}_${getMusicInfo(item)?.id ?? index}_${index}`
    const setCurrentActiveRow = (el) => {
      domCurrentActiveRow.value = el
    }

    const getCurrentPreItemIndex = index => index
    const getCurrentPostItemIndex = index => currentPlayingIndex.value < 0 ? index : currentPlayingIndex.value + 1 + index
    const getCurrentPostInsertIndex = index => currentPlayingIndex.value < 0 ? index : currentPlayingIndex.value + index

    const getCurrentActiveRow = () => {
      const container = domScrollArea.value
      if (!container) return domCurrentActiveRow.value
      return container.querySelector('[data-playlist-active="true"]') || domCurrentActiveRow.value
    }

    const scrollCurrentItemIntoView = () => {
      const container = domScrollArea.value
      const activeRow = getCurrentActiveRow()
      if (!container || !activeRow) return false

      const containerRect = container.getBoundingClientRect()
      const activeRect = activeRow.getBoundingClientRect()
      const delta = activeRect.top - containerRect.top - (containerRect.height / 2) + (activeRect.height / 2)
      container.scrollTop = Math.max(0, container.scrollTop + delta)
      return true
    }

    const tryScrollToCurrent = (retry = 0) => {
      if (!isShowPlayList.value) return
      const taskId = ++scrollTaskId.value
      if (scrollFrame.value !== null) {
        cancelAnimationFrame(scrollFrame.value)
        scrollFrame.value = null
      }
      void nextTick().then(() => {
        if (taskId !== scrollTaskId.value) return
        scrollFrame.value = window.requestAnimationFrame(() => {
          if (taskId !== scrollTaskId.value) return
          scrollFrame.value = null
          const isScrolled = scrollCurrentItemIntoView()
          if (!isScrolled && retry < 3) {
            tryScrollToCurrent(retry + 1)
          }
        })
      })
    }

    const promoteCurrentListToTemp = () => {
      if (!activeListId.value || activeListId.value == LIST_IDS.DOWNLOAD || activeListId.value == LIST_IDS.TEMP) return false
      tempListMeta.id = activeListId.value
      overwriteLocalListMusics(LIST_IDS.TEMP, [...currentItems.value])
      setPlayListId(LIST_IDS.TEMP)
      playMusicInfo.listId = LIST_IDS.TEMP
      updatePlayIndex()
      return true
    }

    const reorderCurrentListItem = async(sourceIndex, targetIndex) => {
      if (!activeListId.value) return
      if (sourceIndex === targetIndex) return
      const item = currentItems.value[sourceIndex]
      const musicInfo = getMusicInfo(item)
      if (!musicInfo) return
      if (isDownloadList.value) {
        moveArrayItem(downloadList, sourceIndex, targetIndex)
        window.app_event.downloadListUpdate()
        await reloadCurrentList()
        return
      }
      if (activeListId.value != LIST_IDS.TEMP) {
        promoteCurrentListToTemp()
      }
      await updateLocalListMusicsPosition(LIST_IDS.TEMP, targetIndex, [musicInfo.id]).then(() => {
        updatePlayIndex()
        void reloadCurrentList()
      })
    }

    const reloadCurrentList = async() => {
      const seq = ++loadSeq.value
      isLoading.value = true
      try {
        if (!activeListId.value) {
          currentItems.value = []
          return
        }
        if (isDownloadList.value) {
          await getDownloadList()
          if (seq != loadSeq.value) return
          currentItems.value = [...downloadList]
          return
        }
        const list = await getListMusics(activeListId.value)
        if (seq != loadSeq.value) return
        currentItems.value = [...list]
      } catch (err) {
        console.error(err)
        if (seq == loadSeq.value) currentItems.value = []
      } finally {
        if (seq == loadSeq.value) {
          isLoading.value = false
          tryScrollToCurrent()
        }
      }
    }

    const handleReload = () => {
      reloadCurrentList().catch(() => {})
    }

    const handleClearCurrent = async() => {
      if (!activeListId.value || !currentItems.value.length) return
      const confirm = await dialog.confirm({
        message: `确定清空「${currentListLabel.value}」中的全部歌曲吗？`,
        cancelButtonText: t('cancel_button_text'),
        confirmButtonText: t('confirm_button_text'),
      })
      if (!confirm) return

      if (isDownloadList.value) {
        await removeDownloadTasks(currentItems.value.map(item => item.id))
      } else {
        if (activeListId.value != LIST_IDS.TEMP && !promoteCurrentListToTemp()) return
        const ids = currentItems.value.map(item => getMusicInfo(item)?.id).filter(Boolean)
        if (!ids.length) return
        removeLocalListMusics(LIST_IDS.TEMP, ids)
      }

      if (activeListId.value == LIST_IDS.TEMP && playMusicInfo.musicInfo) {
        playNext(true).catch(() => {})
      }
      await reloadCurrentList()
    }

    const isSamePlayingMusic = (musicInfo) => (
      !!musicInfo &&
      playMusicInfo.musicInfo?.id == musicInfo.id &&
      isPlay.value
    )

    const handlePlayCurrentItem = (item) => {
      if (isDragging.value) return
      if (!activeListId.value) return
      const musicInfo = getMusicInfo(item)
      if (!musicInfo) return
      if (isSamePlayingMusic(musicInfo)) return
      playListById(activeListId.value, musicInfo.id)
    }

    const handlePlayTempItem = (item) => {
      if (isDragging.value) return
      const musicInfo = getMusicInfo(item)
      if (!musicInfo || !item.listId) return
      if (isSamePlayingMusic(musicInfo)) return
      const tempIndex = tempPlayList.findIndex(m => getMusicInfo(m)?.id == musicInfo.id)
      if (tempIndex >= 0) {
        if (tempIndex > 0) {
          moveTempPlayList(tempIndex, 0)
        }
        playNext(true).catch(() => {})
      } else {
        playListById(item.listId, musicInfo.id)
      }
    }

    const handleRemoveCurrentItem = async(index) => {
      if (!activeListId.value) return
      const item = currentItems.value[index]
      const musicInfo = getMusicInfo(item)
      if (!musicInfo) return
      if (isDownloadList.value) {
        await removeDownloadTasks([item.id])
        await reloadCurrentList()
        return
      }

      if (activeListId.value != LIST_IDS.TEMP) {
        promoteCurrentListToTemp()
      }

      removeLocalListMusics(LIST_IDS.TEMP, [musicInfo.id])
      updatePlayIndex()
      if (playMusicInfo.musicInfo?.id == musicInfo.id) {
        playNext(true).catch(() => {})
      }
      await reloadCurrentList()
    }

    const handleRemoveTempItem = (index) => {
      removeTempPlayList(index)
    }

    const handleClearTemp = async() => {
      if (!tempPlayList.length) return
      const confirm = await dialog.confirm({
        message: '确定清空稍后播放列表吗？',
        cancelButtonText: t('cancel_button_text'),
        confirmButtonText: t('confirm_button_text'),
      })
      if (!confirm) return
      clearTempPlayeList()
    }

    const onMyListUpdate = (ids) => {
      if (!activeListId.value) return
      if (activeListId.value == LIST_IDS.TEMP) {
        if (!ids.includes(LIST_IDS.TEMP)) return
      } else if (!ids.includes(activeListId.value)) {
        return
      }
      reloadCurrentList().catch(() => {})
    }

    const onDownloadListUpdate = () => {
      if (!isDownloadList.value) return
      reloadCurrentList().catch(() => {})
    }

    const createDragLockHandlers = () => ({
      onDragStart() {
        if (dragUnlockTimer) clearTimeout(dragUnlockTimer)
        dragUnlockTimer = null
        isDragging.value = true
      },
      onDragEnd() {
        if (dragUnlockTimer) clearTimeout(dragUnlockTimer)
        dragUnlockTimer = window.setTimeout(() => {
          isDragging.value = false
          dragUnlockTimer = null
        }, 0)
      },
    })

    const { setDisabled: setCurrentPreDragDisabled } = useDrag({
      dom_list: domCurrentPreList,
      dragingItemClassName: styles.draggingItem,
      group: currentDragGroup,
      filter: 'drag-ignore',
      onUpdate(newIndex, oldIndex) {
        void reorderCurrentListItem(oldIndex, newIndex)
      },
      onAdd(newIndex, oldIndex) {
        void reorderCurrentListItem(getCurrentPostItemIndex(oldIndex), newIndex)
      },
      ...createDragLockHandlers(),
    })

    const { setDisabled: setCurrentPostDragDisabled } = useDrag({
      dom_list: domCurrentPostList,
      dragingItemClassName: styles.draggingItem,
      group: currentDragGroup,
      filter: 'drag-ignore',
      onUpdate(newIndex, oldIndex) {
        const sourceIndex = getCurrentPostItemIndex(oldIndex)
        const targetIndex = getCurrentPostItemIndex(newIndex)
        void reorderCurrentListItem(sourceIndex, targetIndex)
      },
      onAdd(newIndex, oldIndex) {
        void reorderCurrentListItem(oldIndex, getCurrentPostInsertIndex(newIndex))
      },
      ...createDragLockHandlers(),
    })

    const { setDisabled: setTempDragDisabled } = useDrag({
      dom_list: domTempList,
      dragingItemClassName: styles.draggingItem,
      filter: 'drag-ignore',
      onUpdate(newIndex, oldIndex) {
        moveTempPlayList(oldIndex, newIndex)
      },
      ...createDragLockHandlers(),
    })

    watch([currentPreItems, currentPostItems], () => {
      void nextTick(() => {
        setCurrentPreDragDisabled(!canSortCurrentPre.value)
        setCurrentPostDragDisabled(!canSortCurrentPost.value)
      })
    }, { deep: true, immediate: true })

    watch(() => tempPlayList.length, () => {
      void nextTick(() => {
        setTempDragDisabled(tempPlayList.length < 2)
      })
    }, { immediate: true })

    watch(activeListId, () => {
      reloadCurrentList().catch(() => {})
    }, { immediate: true })

    watch(() => [isShowPlayList.value, currentPlayingIndex.value, isLoading.value], () => {
      if (!isShowPlayList.value || isLoading.value || currentPlayingIndex.value < 0) return
      tryScrollToCurrent()
    }, { immediate: true, flush: 'post' })

    window.app_event.on('myListUpdate', onMyListUpdate)
    window.app_event.on('downloadListUpdate', onDownloadListUpdate)

    onBeforeUnmount(() => {
      window.app_event.off('myListUpdate', onMyListUpdate)
      window.app_event.off('downloadListUpdate', onDownloadListUpdate)
      if (dragUnlockTimer) clearTimeout(dragUnlockTimer)
      dragUnlockTimer = null
      scrollTaskId.value++
      if (scrollFrame.value !== null) {
        cancelAnimationFrame(scrollFrame.value)
        scrollFrame.value = null
      }
    })

    return {
      domCurrentPreList,
      domCurrentPostList,
      domTempList,
      domScrollArea,
      isLoading,
      currentItems,
      tempPlayList,
      activeListId,
      currentSourceListId,
      currentListLabel,
      emptyCurrentHint,
      isDragging,
      currentPlayingIndex,
      currentPreItems,
      currentPostItems,
      canSortCurrentPre,
      canSortCurrentPost,
      isTempPlayListVisible,
      isPlay,
      handleReload,
      handleClearCurrent,
      handlePlayCurrentItem,
      handlePlayTempItem,
      handleRemoveCurrentItem,
      handleRemoveTempItem,
      handleClearTemp,
      getCurrentRowKey,
      getTempRowKey,
      getCurrentPreItemIndex,
      getCurrentPostItemIndex,
      getItemName,
      getItemSinger,
      setCurrentActiveRow,
      getTempItemName,
      getTempItemSinger,
      isCurrentPlayingItem(item) {
        const musicInfo = getMusicInfo(item)
        return !!musicInfo && playMusicInfo.musicInfo?.id === musicInfo.id
      },
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.panel {
  flex: 1;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  color: var(--color-font);
  overflow: hidden;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 0 18px 12px;
}

.headerInfo {
  min-width: 0;
}

.title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
}

.subtitle {
  margin-top: 4px;
  color: var(--color-font-label);
  font-size: 12px;
  line-height: 1.4;
}

.headerActions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

.iconButton {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background-color: var(--color-card-background);
  color: var(--color-font-label);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: @transition-fast;
  transition-property: border-color, color, background-color, opacity;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover:not(:disabled) {
    border-color: var(--color-primary-alpha-500);
    color: var(--color-font);
    background-color: var(--color-card-background);
  }

  &:active:not(:disabled),
  &:focus-visible:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-font);
    background-color: var(--color-card-background);
  }

  &:disabled {
    opacity: .45;
    cursor: not-allowed;
  }
}

.body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0 10px 16px 16px;
  display: flex;
  flex-flow: column nowrap;
  gap: 14px;
}

.loadingState,
.emptyState {
  min-height: 180px;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--color-font-label);
  border: 1px dashed var(--color-border);
  border-radius: 14px;
  background-color: var(--color-content-background);
}

.loadingSpinner {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  animation: playlist-spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes playlist-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes playlist-active-breathe {
  0%, 100% {
    transform: translateY(0);
    filter: saturate(1);
  }
  50% {
    transform: translateY(-1px);
    filter: saturate(1.2);
  }
}

@keyframes playlist-dot-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 4px var(--color-primary-alpha-100);
  }
  50% {
    transform: scale(1.15);
    box-shadow: 0 0 0 7px transparent;
  }
}

@keyframes playlist-eq-1 {
  0%, 100% { height: 30%; }
  50% { height: 96%; }
}

@keyframes playlist-eq-2 {
  0%, 100% { height: 44%; }
  50% { height: 100%; }
}

@keyframes playlist-eq-3 {
  0%, 100% { height: 36%; }
  50% { height: 88%; }
}

.section {
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background-color: var(--color-card-background);
  display: flex;
  flex-flow: column nowrap;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding-bottom: 12px;
}

.sectionHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
}

.sectionTitle {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}

.sectionMeta {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--color-font-label);
}

.sectionActions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

.scrollArea {
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
  padding: 12px 12px 56px;
  display: flex;
  flex-flow: column nowrap;
  gap: 14px;
  overflow-x: hidden;
  overflow-y: scroll;
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
  scroll-padding-bottom: 56px;
  scrollbar-width: thin;
  scrollbar-color: var(--color-primary-alpha-500) var(--color-primary-light-100-alpha-800);

  &::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  &::-webkit-scrollbar-track {
    border-radius: 999px;
    background-color: var(--color-primary-light-100-alpha-800);
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background-color: var(--color-primary-alpha-500);
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: var(--color-primary-alpha-400);
  }
}

.textButton {
  border: 1px solid var(--color-border);
  background-color: var(--color-content-background);
  color: var(--color-font-label);
  border-radius: 999px;
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
  cursor: pointer;
  transition: @transition-fast;
  transition-property: border-color, background-color, color, opacity;

  &:hover:not(:disabled) {
    border-color: var(--color-primary-alpha-500);
    color: var(--color-font);
    background-color: var(--color-content-background);
  }

  &:active:not(:disabled),
  &:focus-visible:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-font);
    background-color: var(--color-content-background);
  }

  &:disabled {
    opacity: .45;
    cursor: not-allowed;
  }
}

.listStack {
  display: flex;
  flex-flow: column nowrap;
  gap: 12px;
}

.queueCard {
  border: 1px solid var(--color-primary-alpha-200);
  border-radius: 14px;
  background-color: var(--color-primary-alpha-50);
  overflow: hidden;
}

.queueHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border);
}

.queueHeaderInfo {
  min-width: 0;
}

.queueTitle {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}

.queueMeta {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--color-font-label);
}

.queueList {
  padding: 8px;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-flow: column nowrap;
  gap: 8px;
}

.sortable .item {
  cursor: grab;
}

.item {
  min-height: 54px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background-color: var(--color-main-background);
  border: 1px solid transparent;
  transition: @transition-fast;
  transition-property: background-color, border-color, transform;
  cursor: pointer;

  &:hover {
    border-color: var(--color-primary-alpha-300);
    background-color: var(--color-main-background);
  }
}

.queueItem {
  background-color: var(--color-content-background);
}

.active {
  border-color: var(--color-primary-alpha-700);
  box-shadow: inset 0 0 0 1px var(--color-primary-alpha-500);
  background-color: var(--color-main-background);
}

.activePlaying {
  border-color: var(--color-primary-alpha-600);
  box-shadow:
    inset 0 0 0 1px var(--color-primary-alpha-400),
    0 0 0 1px var(--color-primary-alpha-100),
    0 0 18px var(--color-primary-alpha-100);
  background: linear-gradient(90deg, var(--color-primary-alpha-100) 0%, var(--color-main-background) 22%);
  animation: playlist-active-breathe 1.8s ease-in-out infinite;
}

.playDot {
  width: 10px;
  height: 10px;
  flex: none;
  border-radius: 50%;
  background-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-alpha-100);
  animation: playlist-dot-pulse 1.2s ease-in-out infinite;
}

.playState {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  width: 24px;
  height: 16px;
  color: var(--color-font-label);
  flex: none;

  span {
    width: 3px;
    height: 35%;
    border-radius: 999px;
    background: currentColor;
    opacity: .55;
    transform-origin: center bottom;
  }
}

.playStatePlaying {
  color: var(--color-primary);

  span:nth-child(1) {
    animation: playlist-eq-1 700ms ease-in-out infinite;
  }

  span:nth-child(2) {
    animation: playlist-eq-2 560ms ease-in-out infinite;
  }

  span:nth-child(3) {
    animation: playlist-eq-3 640ms ease-in-out infinite;
  }
}

.dragHandle {
  width: 26px;
  height: 26px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-font-label);
  text-align: center;
  font-size: 13px;
  line-height: 1;
  cursor: grab;
  user-select: none;
  opacity: .75;
  border-radius: 8px;
  background-color: var(--color-content-background);
  border: 1px solid var(--color-border);
}

.index {
  width: 24px;
  flex: none;
  text-align: right;
  font-size: 12px;
  color: var(--color-font-label);
}

.meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
  gap: 3px;
}

.name,
.singer {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name {
  font-size: 14px;
  line-height: 1.35;
}

.singer {
  font-size: 12px;
  line-height: 1.35;
  color: var(--color-font-label);
}

.actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

.rowButton {
  width: 28px;
  height: 28px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--color-font-label);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: @transition-fast;
  transition-property: background-color, color;

  svg {
    width: 15px;
    height: 15px;
  }

  &:hover {
    background-color: var(--color-primary-alpha-900);
    color: var(--color-primary);
    border-color: var(--color-primary-alpha-400);
  }
}

.sectionActions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

.textButton {
  border: 1px solid var(--color-border);
  background-color: var(--color-content-background);
  color: var(--color-font-label);
  border-radius: 999px;
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
  cursor: pointer;
  transition: @transition-fast;
  transition-property: border-color, background-color, color, opacity;

  &:hover:not(:disabled) {
    border-color: var(--color-primary-alpha-500);
    color: var(--color-font);
    background-color: var(--color-content-background);
  }

  &:active:not(:disabled),
  &:focus-visible:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-font);
    background-color: var(--color-content-background);
  }

  &:disabled {
    opacity: .45;
    cursor: not-allowed;
  }
}

.emptyIcon {
  width: 42px;
  height: 42px;
  margin-bottom: 12px;
  opacity: .45;
}

.emptyTitle {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-font);
}

.emptyText {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  max-width: 280px;
}

.draggingItem {
  opacity: .35;
}
</style>

