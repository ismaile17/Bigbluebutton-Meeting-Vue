const MainRoutes = {
    path: '/main',
    meta: {
        requiresAuth: true
    },
    redirect: '/main',
    component: () => import('@/layout/AppLayout.vue'),
    children:[
  {
            path: '/',
            name: 'main',
            meta: {
                breadcrumb: ['Meeting To Me'],
                requiredRoles: ['Admin', 'Manager']
            },
            component: () => import('@/views/dashboards/Authorization.vue')
        },
        {
          path: '/screens',
          name: 'screens',
          meta: {
              breadcrumb: ['Screen Management']
          },
          component: () => import('@/views/screens/Index.vue')
      },
      {
        path: '/roles',
        name: 'roles',
        meta: {
            breadcrumb: ['Screen Management']
        },
        component: () => import('@/views/roles/Index.vue')
    },
    {
      path: '/authorization',
      name: 'authorization',
      meta: {
          breadcrumb: ['Authorization Management']

      },
      component: () => import('@/views/authorization/Index.vue')
  },
  {
    path: '/meeting/group/add',
    name: 'group-add',
    meta: {
        breadcrumb: ['Create Group'],
        requiredRoles: ['Admin', 'Manager']

    },
    component: () => import('@/views/meeting/groups/Add.vue')
},
{
    path: '/meeting/group/list',
    name: 'group-list',
    meta: {
        breadcrumb: ['Group List'],
        requiredRoles: ['Admin', 'Manager']
    },
    component: () => import('@/views/meeting/groups/List.vue')
},
{
    path: '/meeting/createmeeting',
    name: 'create-meeting',
    meta: {
        breadcrumb: ['Create Meeting'],
        requiredRoles: ['Admin', 'Manager']
    },
    component: () => import('@/views/meeting/CreateMeeting.vue')
},
{
    path: '/meeting/createmeetingV2',
    name: 'create-meetingv2',
    meta: {
        breadcrumb: ['Create Meeting V2'],
        requiredRoles: ['Admin', 'Manager']
    },
    component: () => import('@/views/meeting/CreateMeetingV2.vue')
},
{
    path: '/meeting/meetinglist',
    name: 'meeting-list',
    meta: {
        breadcrumb: ['Meeting List'],
        requiredRoles: ['Admin', 'Manager']
    },
    component: () => import('@/views/meeting/MeetingList.vue')
},
{
    path: '/meeting/group/editgroup/:id',
    name: 'group-edit',
    meta: {
        breadcrumb: ['Group Edit'],
        requiredRoles: ['Admin', 'Manager']
    },
    component: () => import('@/views/meeting/groups/EditGroupV2.vue')
},
{
    path: '/participant/groupdetail/:id',
    name: 'group-detail',
    meta: {
        breadcrumb: ['Group Detail'],
        requiredRoles: ['Admin', 'Participant']
    },
    component: () => import('@/views/participantpages/ParticipantGroupPage.vue')
},
{
    path: '/home/',
    name: 'participant-homepage',
    meta: {
        breadcrumb: ['Home'],
        requiredRoles: ['Admin', 'Participant']
    },
    component: () => import('@/views/participantpages/ParticipantHomePage.vue')
},

{
    path: '/participant/new',
    name: 'new-participant',
    meta: {
        breadcrumb: ['Participant'],
        requiredRoles: ['Admin', 'Manager']
    },
    component: () => import('@/views/participant/NewParticipant.vue')
},
{
    path: '/participant/list',
    name: 'participant-list',
    meta: {
        breadcrumb: ['Participant'],
        requiredRoles: ['Admin', 'Manager']
    },
    component: () => import('@/views/participant/ParticipantList.vue')
},
{
    path: '/buy/packagelist',
    name: 'package-list',
    meta: {
        breadcrumb: ['Package'],
        requiredRoles: ['Admin', 'Manager']
    },
    component: () => import('@/views/packageandbuying/packagelist.vue')
},
{
path: '/buy/paymentpage',
name: 'payment-page',
meta: {
    breadcrumb: ['Payment'],
    requiredRoles: ['Admin', 'Manager']
},
component: () => import('@/views/packageandbuying/paymentpage.vue')
},
{
    path: '/buy/paymentpagev2/:id',
    name: 'payment-pagev2',
    meta: {
        breadcrumb: ['Paymentv2'],
        requiredRoles: ['Admin', 'Manager']
    },
    component: () => import('@/views/packageandbuying/paymentpagev2.vue')
    },
{
    path: '/check',
    name: 'check-page',
    meta: {
        breadcrumb: ['Check'],
        requiredRoles: ['Admin', 'Manager']
    },
    component: () => import('@/views/packageandbuying/check.vue')
    },

{
    path: '/participant/editparticipant/:id',
    name: 'edit-participant',
    meta: {
        breadcrumb: ['Edit Participant'],
        requiredRoles: ['Admin', 'Manager']
    },
    component: () => import('@/views/participant/EditParticipant.vue')
},

{
    path: '/authorization/detailsetting',
    name: 'detailsetting',
    meta: {
        breadcrumb: ['DetailSetting'],
        requiredRoles: ['Admin', 'Manager']
    },
    component: () => import('@/views/authorization/DetailSetting.vue')
},


{
    path: '/completedmeeting/managercomp',
    name: 'managercompleted',
    meta: {
        breadcrumb: ['Manager Completed'],
        requiredRoles: ['Admin', 'Manager']
    },
    component: () => import('@/views/completedmeeting/ManagerCompletedMeeting.vue')
},

{
    path: '/tickets',
    name: 'ticketspage',
    meta: {
        breadcrumb: ['Tickets'],
        requiredRoles: ['Admin', 'Manager']
    },
    component: () => import('@/views/tickets/TicketPage.vue')
},

{
    path: '/ticketsforadmin',
    name: 'ticketspageforadmin',
    meta: {
        breadcrumb: ['Tickets'],
        requiredRoles: ['Admin']
    },
    component: () => import('@/views/tickets/TicketPageForAdmin.vue')
},

{
    path: '/paymentsforadmin',
    name: 'paymentsforadmin',
    meta: {
        breadcrumb: ['Payments For Admin'],
        requiredRoles: ['Admin']
    },
    component: () => import('@/views/packageandbuying/PaymentAdminPage.vue')
},

{
    path: '/billings',
    name: 'billings',
    meta: {
        breadcrumb: ['Billings'],
        requiredRoles: ['Admin', 'Manager']
    },
    component: () => import('@/views/packageandbuying/BillingsList.vue')
},

{
    path: '/error',
    name: 'errors',
    meta: {
        breadcrumb: ['Error'],
        requiredRoles: ['Admin', 'Manager', 'Participant']
    },
    component: () => import('@/views/Error.vue')
},



{
    path: '/completedmeeting/dashboard/:id',
    name: 'dashboard',
    meta: {
        breadcrumb: ['Dashboard'],
        requiredRoles: ['Admin', 'Manager']
    },
    component: () => import('@/views/completedmeeting/LearningDashboard.vue')
},

{
    path: '/meeting/edit/:id',
    name: 'edit-meeting',
    meta: {
        breadcrumb: ['Edit Meeting'],
        requiredRoles: ['Admin', 'Manager']
    },
    component: () => import('@/views/meeting/EditMeetingV2.vue')
},

    {
    path: '/',
    name: 'homepage',
    meta: {
        breadcrumb: ['Home'],
        requiredRoles: ['Admin', 'Manager']
    },
    component: () => import('@/views/dashboards/Authorization.vue')
    },





    
      ]
    
};

export default MainRoutes;
