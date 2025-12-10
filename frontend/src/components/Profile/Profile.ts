import { defineComponent } from 'vue';
import { useAuthStore } from '../../store/auth.module';
import Menu from '../Menu/Menu.vue'

export default defineComponent({
  name: 'Profile',
  components:{
    Menu,
  },
  computed: {
    currentUser() {
      const authStore = useAuthStore();
      return authStore.currentUser;
    }
  },
  mounted() {
    if (!this.currentUser) {
      this.$router.push('/login');
    }
  }
});