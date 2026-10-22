import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('../layouts/MainLayout.vue'),
      redirect: '/home',
      children: [
        {
          path: 'home',
          name: 'home',
          component: () => import('../views/HomeView.vue'),
        },
        {
          path: 'locations',
          name: 'locations',
          component: () => import('../views/LocationsView.vue'),
        },
        {
          path: 'alerts',
          name: 'alerts',
          component: () => import('../views/AlertsView.vue'),
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../views/ProfileView.vue'),
        },
      ],
    },
    {
      path: '/items/create',
      name: 'item-create',
      component: () => import('../views/ItemFormView.vue'),
    },
    {
      path: '/items/:id',
      name: 'item-detail',
      component: () => import('../views/ItemDetailView.vue'),
    },
    {
      path: '/items/:id/edit',
      name: 'item-edit',
      component: () => import('../views/ItemFormView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  if (!to.meta.public && !token) return '/login'
  if ((to.path === '/login' || to.path === '/register') && token) return '/home'
  return true
})

export default router
