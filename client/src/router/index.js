import { createRouter, createWebHistory } from 'vue-router'
import EventList from '../views/EventList.vue'
import CreateEvent from '../views/CreateEvent.vue'
import EventView from '../views/EventView.vue'
import EventListAdmin from '../views/EventListAdmin.vue'
import { watch } from 'vue'

const setTitle = title => {
  let titleOrigin = 'Ảnh sự kiện | MISA JSC'
  if (title) {
    titleOrigin = `${titleOrigin} | ${title}`
  }

  document.title = titleOrigin
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: EventList,
    },
    {
      path: '/admin',
      name: 'admin',

      children: [
        {
          path: '',
          name: 'eventListAdmin',
          component: EventListAdmin,
          meta: {
            title: 'Quản lý sự kiện',
          },
        },
        {
          path: 'create',
          name: 'createEvent',
          component: CreateEvent,
          meta: {
            title: 'Quản lý sự kiện',
          },
        },
        {
          path: 'edit/:eventId',
          name: 'editEvent',
          component: CreateEvent,
          meta: {
            title: 'Quản lý sự kiện',
          },
        },
      ],
      meta: {
        isAdmin: true,
      },
    },
    {
      path: '/album/:eventId',
      name: 'eventView',
      component: EventView,
      meta: {
        setTitle,
      },
    },
  ],
})

watch(router.currentRoute, router => {
  let title = router.meta.title
  setTitle(title)
})

export default router
