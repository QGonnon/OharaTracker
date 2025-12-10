import { defineComponent } from 'vue';
import { Form, Field, ErrorMessage } from "vee-validate";
import * as yup from "yup";
import { useAuthStore } from '../../../store/auth.module';
import Menu from '../../Common/Menu/Menu.vue'

declare global {
  interface Window {
    google: any;
  }
}

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
  mounted() {
    this.initGoogleSignIn();
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
    initGoogleSignIn() {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
            callback: this.handleGoogleLogin,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-button'),
            { 
              theme: 'outline', 
              size: 'large',
              width: 500,
              text: 'signin_with',
              locale: 'fr'
            }
          );
          // Optionnel : afficher aussi le One Tap
          // window.google.accounts.id.prompt();
        }
      };
      document.head.appendChild(script);
    },
    async handleGoogleLogin(response: any) {
      try {
        this.loading = true;
        this.message = "";
        
        if (response && response.credential) {
          const authStore = useAuthStore();
          await authStore.googleLogin(response.credential);
          this.$router.push("/profile");
        }
      } catch (error: any) {
        this.loading = false;
        this.message = error.message || "Erreur lors de la connexion avec Google";
      }
    },
  },
});
