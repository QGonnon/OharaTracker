import { defineComponent } from 'vue';
import { Form, Field, ErrorMessage } from "vee-validate";
import * as yup from "yup";
import { useAuthStore } from '../../../store/auth.module';
import Menu from '../../Common/Menu/Menu.vue'

export default defineComponent({
  name: "Register",
  components: {
    Form,
    Field,
    ErrorMessage,
    Menu,
  },
  data() {
    const schema = yup.object().shape({
      username: yup
        .string()
        .required("Username is required!")
        .min(3, "Must be at least 3 characters!")
        .max(20, "Must be maximum 20 characters!"),
      email: yup
        .string()
        .required("Email is required!")
        .email("Email is invalid!")
        .max(50, "Must be maximum 50 characters!"),
      password: yup
        .string()
        .required("Password is required!")
        .min(6, "Must be at least 6 characters!")
        .max(40, "Must be maximum 40 characters!"),
    });

    return {
      successful: false,
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
  mounted() {
    if (this.loggedIn) {
      this.$router.push("/profile");
    }
  },
  methods: {
    handleRegister(user: any) {
      this.message = "";
      this.successful = false;
      this.loading = true;
      const authStore = useAuthStore();

      authStore.register(user).then(
        async (data) => {
          this.message = data.message;
          this.successful = true;
          
          // Connecter automatiquement l'utilisateur après l'inscription
          try {
            await authStore.login({ username: user.username, password: user.password });
            this.$router.push("/profile");
          } catch (loginError) {
            this.loading = false;
            // Si la connexion automatique échoue, rediriger vers la page de login
            setTimeout(() => {
              this.$router.push("/login");
            }, 2000);
          }
        },
        (error) => {
          this.message =
            (error.response &&
              error.response.data &&
              error.response.data.message) ||
            error.message ||
            error.toString();
          this.successful = false;
          this.loading = false;
        }
      );
    },
  },
});
