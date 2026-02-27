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
    path: "/accessMembership",
    name: "accessMembership",
    meta: {
      title: "Validación de Membresia",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/access/accessMembership.vue"),
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
    path: "/historicalVisits",
    name: "historicalVisits",
    meta: {
      title: "Histórico de Visitantes por Día",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/partner/historicalVisits.vue"),
    props: true,
  },
  {
    path: "/visitsConsumptions",
    name: "visitsConsumptions",
    meta: {
      title: "Consumos por Visita",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/partner/visitsConsumptions.vue"),
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
    path: "/quienes-pagan-a-la-salida",
    name: "quienesPaganALaSalida",
    meta: {
      title: "Quiénes pagan a la salida",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/access/quienesPaganALaSalida.vue"),
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
    path: "/table-crud",
    name: "tableCrud",
    meta: {
      title: "CRUD de Tablas",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/admin/TableCrud.vue"),
    props: true,
  },
  {
    path: "/partners-database",
    name: "partnersDatabase",
    meta: {
      title: "Base de datos de socios",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/partner/PartnersDatabase.vue"),
    props: true,
  },
  {
    path: "/products-services",
    name: "productsServices",
    meta: {
      title: "Gestión de Productos y Servicios",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/admin/ProductsServices.vue"),
    props: true,
  },
  {
    path: "/prices-management",
    name: "pricesManagement",
    meta: {
      title: "Gestión de Precios",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/admin/PricesManagement.vue"),
    props: true,
  },
  {
    path: "/esquema-pago-mensual",
    name: "esquemaPagoMensual",
    meta: {
      title: "Esquema de pago mensual",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/admin/EsquemaPagoMensual.vue"),
    props: true,
  },
  {
    path: "/users-management",
    name: "usersManagement",
    meta: {
      title: "Gestión de Usuarios, Roles y Permisos",
      requiresAuth: true,
      requiresAccess: true
    },
    component: () => import("../views/admin/UsersManagement.vue"),
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
