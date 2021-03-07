import Vue from 'vue';
import popup from './Popup';
import { library } from '@fortawesome/fontawesome-svg-core'
import { faBorderAll, faPalette, faTrash, faEraser, faPaintRoller, faSave } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faTrash, faPalette, faBorderAll, faEraser, faPaintRoller, faSave)

Vue.component('font-awesome-icon', FontAwesomeIcon)
Vue.config.productionTip = false

new Vue({
  el: '#app',
  render: h => h(popup),
});
