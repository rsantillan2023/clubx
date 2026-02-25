import Vue from "vue";
import VueRouter from "vue-router";
import store from "../store/index";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    redirect: { name: "dashboard" },
  },
  {
    path: "/unauthorized",
    name: "Unauthorized",
    component: () => import("../views/app/Unauthorized.vue"),
  },
  {
    path: "/login",
    name: "Login",
    meta:{
      hiddeHeadAndFooter: true,
    },
    component: () => import("../views/Login.vue"),
  },
  {
    path: "/home",
    name: "dashboard",
    meta: {
      requiresAuth: true,
    },
    component: () => import("../views/Dashboard.vue"),
    props: true,
  },
  {
    path: "/access",
    name: "access",
    meta: {
      title: "Validación de DNI",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/access/access.vue"),
    props: true,
  },
  {
    path: "/productsSale",
    name: "productsSale",
    meta: {
      title: "Venta de Productos",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/consumed/sale/ProductsSale.vue"),
    props: true,
  },
  {
    path: "/lockers",
    name: "lockers",
    meta: {
      title: "Guardarropas",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/lockers/Lockers.vue"),
    props: true,
  },
  {
    path: "/devolution",
    name: "devolutions",
    meta: {
      title: "Devoluciones",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/devolutions/Devolutions.vue"),
    props: true,
  },
  {
    path: "/account",
    name: "account",
    meta: {
      title: "Usuario",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/users/Account.vue"),
    props: true,
  },
  {
    path: "/consumed",
    name: "consumed",
    meta: {
      title: "Consumos",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/consumed/Consumed.vue"),
    props: true,
  },
  {
    path: "/activeVisits",
    name: "activeVisits",
    meta: {
      title: "Socios en este momento en el club",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/partner/activeVisits.vue"),
    props: true,
  },
  {
    path: "/registerPartner",
    name: "register",
    meta: {
      title: "Alta de Socio",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/partner/register.vue"),
    props: true,
  },
  {
    path: "/registerPartnerLite",
    name: "registerLite",
    meta: {
      title: "Alta Rápida de Socio ",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/partner/registerLite.vue"),
    props: true,
  },
  {
    path: "/editPartner",
    name: "editPartner",
    meta: {
      title: "Editar datos de Socio",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/partner/editPartner.vue"),
    props: true,
  },
  {
    path: "/partnerSearch/",
    name: "partnerSearch",
    meta: {
      title: "Busqueda de Socio",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/partner/partnerSearch.vue"),
    props: true,
  },
  {
    path: "/membershipReactivation",
    name: "membershipReactivation",
    meta: {
      title: "Reactivación de membresía",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/partner/reactivation.vue"),
    props: true,
  },
  {
    path: "/entryRegisterLite",
    name: "entryRegisterLite",
    meta: {
      title: "Registro Rápido de Nueva Visita",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/access/entryRegisterLite.vue"),
    props: true,
  },
  {
    path: "/entryRegister",
    name: "entryRegister",
    meta: {
      title: "Registro de Nueva Visita",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/access/entryRegister.vue"),
    props: true,
  },
  {
    path: "/exitRegister",
    name: "exitRegister",
    meta: {
      title: "Registro de Salida",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/access/exitRegister.vue"),
    props: true,
  },
  {
    path: "/operations",
    name: "operations",
    meta: {
      title: "Operaciones",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/operations/operations.vue"),
    props: true,
  },
  {
    path: "/new-operations",
    name: "newOperations",
    meta: {
      title: "Nuevas Operaciones",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/operations/NewOperations.vue"),
    props: true,
  },
  {
    path: "/partners",
    name: "partners",
    meta: {
      title: "Gestión de Socios",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/partner/Partners.vue"),
    props: true,
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach(async(to, from, next) => {
  //valida si la route existe
    if (to.matched.length > 0) {//si existe
      if(to.name == 'Login' && store.getters.isLoggedIn){
        next('/home')
      }
      //verifica si la route requiere login
      if(to.matched.some(record => record.meta.requiresAuth)) {//si requiere login
         if(store.getters.isLoggedIn) {
          /*if(process.env.VUE_APP_ENVIROMENT != 'local'){
            if(to.matched.some(record => record.meta.requiresAccess)){
              if(store.getters.routesAccess.includes(to.path)){
                next()
              }else{
                next('/unauthorized')
              }
            }else next()
          }else next()*/
          next()
          return
        } else {
          next('/login')
        }
      } else {//sino requiere login
        next()
      }
    } else {//sino existe
      next("/login");
    }
});

export default router;
