import { defineComponent } from 'vue';
import { Form, Field, ErrorMessage } from "vee-validate";
import * as yup from "yup";
import { useAuthStore } from '../../../store/auth.module';
import Menu from '../../Common/Menu/Menu.vue'

export default defineComponent({
    name: 'Login',
    components: {
    Form,
    Field,
    ErrorMessage,
  Menu,
  },
  data() {
    const schema = yup.object().shape({
      username: yup.string().required("Username is required!"),
      password: yup.string().required("Password is required!"),
    });

    return {
      loading: false,
      message: "",
      schema,
    };
  },
  computed: {
    loggedIn() {
      const authStore = useAuthStore();
      return authStore.isLoggedIn;
    },
  },
  created() {
    if (this.loggedIn) {
      this.$router.push("/profile");
    }
  },
  methods: {
    handleLogin(user:any) {
      this.loading = true;
      const authStore = useAuthStore();

      authStore.login(user).then(
        () => {
          this.$router.push("/profile");
        },
        (error:any) => {
          this.loading = false;
          this.message =
            (error.response &&
              error.response.data &&
              error.response.data.message) ||
            error.message ||
            error.toString();
        }
      );
    },
  },
});
