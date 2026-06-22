import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
  faHome,
  faUser,
  faUserPlus,
  faSignInAlt,
  faSignOutAlt,
  faSun,
  faMoon,
} from "@fortawesome/free-solid-svg-icons";

library.add(faHome, faUser, faUserPlus, faSignInAlt, faSignOutAlt);
library.add(faSun, faMoon);

export { FontAwesomeIcon };