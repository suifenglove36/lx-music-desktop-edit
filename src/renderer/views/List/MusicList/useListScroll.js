import { onMounted, onBeforeUnmount, nextTick } from '@common/utils/vueTools'
import { useRoute, useRouter } from '@common/utils/vueRouter'
import { setListPosition, getListPosition } from '@renderer/utils/data'
import { appSetting } from '@renderer/store/setting'
import { playMusicInfo } from '@renderer/store/player/state'

export default ({ props, listRef, list, handleRestoreScroll }) => {
  const route = useRoute()
  const router = useRouter()

  const saveListPosition = () => {
    setListPosition(props.listId, listRef.value?.getScrollTop() || 0)
  }

  const handleScrollList = (index, isAnimation, callback = () => {}) => {
    listRef.value.scrollToIndex(index, -150, isAnimation, callback)
  }

  const scrollToCurrentPlaying = async(isAnimation = false) => {
    const currentMusicId = playMusicInfo.musicInfo?.id
    if (!currentMusicId || !list.value.length) return false

    const currentIndex = list.value.findIndex(item => item.id == currentMusicId)
    if (currentIndex < 0) return false

    await nextTick()
    listRef.value?.scrollToIndex(currentIndex, -150, isAnimation)
    return true
  }

  const restoreScroll = async(index, isAnimation) => {
    // console.log(index, isAnimation)
    if (!list.value.length) return

    if (await scrollToCurrentPlaying(isAnimation)) return

    if (index == null) {
      let location = await getListPosition(props.listId) || 0
      if (appSetting['list.isSaveScrollLocation'] && location != null) {
        listRef.value?.scrollTo(location)
      }
      return
    }

    handleScrollList(index, isAnimation)
  }

  onMounted(() => {
    handleRestoreScroll(route.query.scrollIndex, false)
    if (route.query.scrollIndex != null) {
      router.replace({
        path: '/list',
        query: {
          id: props.listId,
          updated: true,
        },
      })
    }
  })
  onBeforeUnmount(() => {
    saveListPosition()
  })

  return {
    saveListPosition,
    restoreScroll,
  }
}
