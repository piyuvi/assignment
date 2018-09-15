import Vue from 'vue'
import Router from 'vue-router'
import Advertise from '@/components/Advertise'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Advertise',
      component: Advertise
    }
  ]
})
