import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth';
import AuthRoutes from './AuthRoutes';
import MainRoutes from './MainRoutes';
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:pathMatch(.*)*',
      component: () => {}
  },
MainRoutes,
AuthRoutes
],
},);


router.beforeEach(async (to, from, next) => {
  const publicPages = ['/login'];
  const authRequired = !publicPages.includes(to.path);
  const auth = useAuthStore();

  if (authRequired && !auth.user) {
    auth.returnUrl = to.fullPath;
    return next('/login');
  } else if (auth.user) {
    const userRoles = auth.user.roles.map((role: any) => role.name); // Kullanıcı rolleri

    if (to.path === '/') {
      if (userRoles.includes('Participant')) {
        return next('/home');
      }
    }

    // Hedef rotanın gerekli rolleri varsa kontrol edin
    const requiredRoles = to.meta.requiredRoles as string[] | undefined;
    if (requiredRoles && !requiredRoles.some(role => userRoles.includes(role))) {
      return next('/error'); // Yetkisiz erişim
    }
  }

  next(); 
});


export default router
