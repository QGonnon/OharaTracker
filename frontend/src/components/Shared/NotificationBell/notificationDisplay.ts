import type { Router } from 'vue-router'
import { slugify } from '../../../utils'
import { localePath, localeMedia } from '../../../seo/localePath'
import type { AppNotification } from '../../../types/index'
import type { useMangaStore } from '../../../store/manga.module'

// Rendu partagé par la cloche et la page Notifications : sans ce module, la
// branche « événement social » devrait être écrite deux fois à l'identique.

type MangaStore = ReturnType<typeof useMangaStore>
type Translate = (key: string, named?: Record<string, unknown>) => string

/** Notifications qui ne portent sur aucune oeuvre : elles n'ont ni chapitre ni couverture. */
const SOCIAL_TYPES = ['friend_request', 'friend_accepted']

export const isSocialNotification = (n: AppNotification) => SOCIAL_TYPES.includes(n.type)

const isAnime = (n: AppNotification, mangaStore: MangaStore) => mangaStore.isAnimeType({
  type: n.mediaType ?? '',
  sites: n.site ? { [n.site]: { site: n.site, mangaUrl: '', chapterUrl: '', chapters: [] } } : {}
})

export const notificationMessage = (n: AppNotification, t: Translate, mangaStore: MangaStore): string => {
  if (isSocialNotification(n)) {
    return t(`notifications.${n.type}`, { username: n.actor ?? '' })
  }
  return t(
    isAnime(n, mangaStore) ? 'notifications.new_episode' : 'notifications.new_chapter',
    { chapter: n.chapter, title: n.title }
  )
}

/** Ouvre la cible d'une notification. Retourne false si rien n'est ouvrable. */
export const openNotificationTarget = (n: AppNotification, router: Router, mangaStore: MangaStore): boolean => {
  if (isSocialNotification(n)) {
    router.push(localePath('community'))
    return true
  }
  if (n.chapterUrl) {
    window.open(n.chapterUrl, '_blank')
    return true
  }
  if (!n.title) return false

  router.push(localeMedia(mangaStore.resolveMediaKind(null, n.mediaType ?? undefined), slugify(n.title)))
  return true
}
