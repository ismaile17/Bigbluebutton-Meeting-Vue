const AuthRoutes = {
    path: '/auth',
    component: () => import('@/layout/BlankLayout.vue'),
    meta: {
        requiresAuth: false
    },
    children: [
        {
            name: 'Login',
            path: '/login',
            // @ts-ignore
            component: () => import('@/views/Login/Index.vue')
        },

        {
            path: '/meeting/login/:id',
            name: 'meeting-login',
            meta: { public: true }, // Bu sayfa login gerektirmiyor
            component: () => import('@/views/login/MeetingLogin.vue')
        },
   
    ]
};

export default AuthRoutes;
