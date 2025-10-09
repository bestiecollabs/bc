import { onRequest as __api_admin_chipchip_import_brands_js_onRequest } from "C:\\bc\\cloudflare\\html\\functions\\api\\admin\\chipchip\\import\\brands.js"
import { onRequest as __api_admin_chipchip_import_creators_js_onRequest } from "C:\\bc\\cloudflare\\html\\functions\\api\\admin\\chipchip\\import\\creators.js"
import { onRequest as __api_admin_chipchip_audit_index_js_onRequest } from "C:\\bc\\cloudflare\\html\\functions\\api\\admin\\chipchip\\audit\\index.js"
import { onRequest as __api_admin_chipchip_brands_js_onRequest } from "C:\\bc\\cloudflare\\html\\functions\\api\\admin\\chipchip\\brands.js"
import { onRequest as __api_admin_chipchip_brands_actions_js_onRequest } from "C:\\bc\\cloudflare\\html\\functions\\api\\admin\\chipchip\\brands.actions.js"
import { onRequest as __api_admin_chipchip_creators_js_onRequest } from "C:\\bc\\cloudflare\\html\\functions\\api\\admin\\chipchip\\creators.js"
import { onRequest as __api_admin_chipchip_creators_actions_js_onRequest } from "C:\\bc\\cloudflare\\html\\functions\\api\\admin\\chipchip\\creators.actions.js"
import { onRequest as __api_admin_chipchip_undo_js_onRequest } from "C:\\bc\\cloudflare\\html\\functions\\api\\admin\\chipchip\\undo.js"
import { onRequest as __api_admin_chipchip_users_index_js_onRequest } from "C:\\bc\\cloudflare\\html\\functions\\api\\admin\\chipchip\\users\\index.js"
import { onRequestPost as __api_account_address_js_onRequestPost } from "C:\\bc\\cloudflare\\html\\functions\\api\\account\\address.js"
import { onRequestPost as __api_account_password_js_onRequestPost } from "C:\\bc\\cloudflare\\html\\functions\\api\\account\\password.js"
import { onRequestPost as __api_account_profile_js_onRequestPost } from "C:\\bc\\cloudflare\\html\\functions\\api\\account\\profile.js"
import { onRequestPost as __api_address_verify_js_onRequestPost } from "C:\\bc\\cloudflare\\html\\functions\\api\\address\\verify.js"
import { onRequestPost as __api_signup_complete_js_onRequestPost } from "C:\\bc\\cloudflare\\html\\functions\\api\\signup\\complete.js"
import { onRequestGet as __api_users_me_js_onRequestGet } from "C:\\bc\\cloudflare\\html\\functions\\api\\users\\me.js"
import { onRequestGet as __oauth_tiktok_callback_js_onRequestGet } from "C:\\bc\\cloudflare\\html\\functions\\oauth\\tiktok\\callback.js"
import { onRequest as __api_admin_ping_js_onRequest } from "C:\\bc\\cloudflare\\html\\functions\\api\\admin\\ping.js"
import { onRequestGet as __api_creator_js_onRequestGet } from "C:\\bc\\cloudflare\\html\\functions\\api\\creator.js"
import { onRequestGet as __api_creators_js_onRequestGet } from "C:\\bc\\cloudflare\\html\\functions\\api\\creators.js"
import { onRequestPost as __api_verify_js_onRequestPost } from "C:\\bc\\cloudflare\\html\\functions\\api\\verify.js"
import { onRequestPost as __auth_login_js_onRequestPost } from "C:\\bc\\cloudflare\\html\\functions\\auth\\login.js"
import { onRequestPost as __auth_start_js_onRequestPost } from "C:\\bc\\cloudflare\\html\\functions\\auth\\start.js"
import { onRequestGet as __connect_instagram_js_onRequestGet } from "C:\\bc\\cloudflare\\html\\functions\\connect\\instagram.js"
import { onRequestGet as __connect_tiktok_js_onRequestGet } from "C:\\bc\\cloudflare\\html\\functions\\connect\\tiktok.js"
import { onRequestGet as __db_ping_js_onRequestGet } from "C:\\bc\\cloudflare\\html\\functions\\db\\ping.js"
import { onRequestGet as __debug_auth_js_onRequestGet } from "C:\\bc\\cloudflare\\html\\functions\\debug\\auth.js"
import { onRequestGet as __dev_init_js_onRequestGet } from "C:\\bc\\cloudflare\\html\\functions\\dev\\init.js"
import { onRequestGet as __disconnect_js_onRequestGet } from "C:\\bc\\cloudflare\\html\\functions\\disconnect.js"
import { onRequestGet as __health_js_onRequestGet } from "C:\\bc\\cloudflare\\html\\functions\\health.js"
import { onRequestGet as __logout_js_onRequestGet } from "C:\\bc\\cloudflare\\html\\functions\\logout.js"

export const routes = [
    {
      routePath: "/api/admin/chipchip/import/brands",
      mountPath: "/api/admin/chipchip/import",
      method: "",
      middlewares: [],
      modules: [__api_admin_chipchip_import_brands_js_onRequest],
    },
  {
      routePath: "/api/admin/chipchip/import/creators",
      mountPath: "/api/admin/chipchip/import",
      method: "",
      middlewares: [],
      modules: [__api_admin_chipchip_import_creators_js_onRequest],
    },
  {
      routePath: "/api/admin/chipchip/audit",
      mountPath: "/api/admin/chipchip/audit",
      method: "",
      middlewares: [],
      modules: [__api_admin_chipchip_audit_index_js_onRequest],
    },
  {
      routePath: "/api/admin/chipchip/brands",
      mountPath: "/api/admin/chipchip",
      method: "",
      middlewares: [],
      modules: [__api_admin_chipchip_brands_js_onRequest],
    },
  {
      routePath: "/api/admin/chipchip/brands.actions",
      mountPath: "/api/admin/chipchip",
      method: "",
      middlewares: [],
      modules: [__api_admin_chipchip_brands_actions_js_onRequest],
    },
  {
      routePath: "/api/admin/chipchip/creators",
      mountPath: "/api/admin/chipchip",
      method: "",
      middlewares: [],
      modules: [__api_admin_chipchip_creators_js_onRequest],
    },
  {
      routePath: "/api/admin/chipchip/creators.actions",
      mountPath: "/api/admin/chipchip",
      method: "",
      middlewares: [],
      modules: [__api_admin_chipchip_creators_actions_js_onRequest],
    },
  {
      routePath: "/api/admin/chipchip/undo",
      mountPath: "/api/admin/chipchip",
      method: "",
      middlewares: [],
      modules: [__api_admin_chipchip_undo_js_onRequest],
    },
  {
      routePath: "/api/admin/chipchip/users",
      mountPath: "/api/admin/chipchip/users",
      method: "",
      middlewares: [],
      modules: [__api_admin_chipchip_users_index_js_onRequest],
    },
  {
      routePath: "/api/account/address",
      mountPath: "/api/account",
      method: "POST",
      middlewares: [],
      modules: [__api_account_address_js_onRequestPost],
    },
  {
      routePath: "/api/account/password",
      mountPath: "/api/account",
      method: "POST",
      middlewares: [],
      modules: [__api_account_password_js_onRequestPost],
    },
  {
      routePath: "/api/account/profile",
      mountPath: "/api/account",
      method: "POST",
      middlewares: [],
      modules: [__api_account_profile_js_onRequestPost],
    },
  {
      routePath: "/api/address/verify",
      mountPath: "/api/address",
      method: "POST",
      middlewares: [],
      modules: [__api_address_verify_js_onRequestPost],
    },
  {
      routePath: "/api/signup/complete",
      mountPath: "/api/signup",
      method: "POST",
      middlewares: [],
      modules: [__api_signup_complete_js_onRequestPost],
    },
  {
      routePath: "/api/users/me",
      mountPath: "/api/users",
      method: "GET",
      middlewares: [],
      modules: [__api_users_me_js_onRequestGet],
    },
  {
      routePath: "/oauth/tiktok/callback",
      mountPath: "/oauth/tiktok",
      method: "GET",
      middlewares: [],
      modules: [__oauth_tiktok_callback_js_onRequestGet],
    },
  {
      routePath: "/api/admin/ping",
      mountPath: "/api/admin",
      method: "",
      middlewares: [],
      modules: [__api_admin_ping_js_onRequest],
    },
  {
      routePath: "/api/creator",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_creator_js_onRequestGet],
    },
  {
      routePath: "/api/creators",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_creators_js_onRequestGet],
    },
  {
      routePath: "/api/verify",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_verify_js_onRequestPost],
    },
  {
      routePath: "/auth/login",
      mountPath: "/auth",
      method: "POST",
      middlewares: [],
      modules: [__auth_login_js_onRequestPost],
    },
  {
      routePath: "/auth/start",
      mountPath: "/auth",
      method: "POST",
      middlewares: [],
      modules: [__auth_start_js_onRequestPost],
    },
  {
      routePath: "/connect/instagram",
      mountPath: "/connect",
      method: "GET",
      middlewares: [],
      modules: [__connect_instagram_js_onRequestGet],
    },
  {
      routePath: "/connect/tiktok",
      mountPath: "/connect",
      method: "GET",
      middlewares: [],
      modules: [__connect_tiktok_js_onRequestGet],
    },
  {
      routePath: "/db/ping",
      mountPath: "/db",
      method: "GET",
      middlewares: [],
      modules: [__db_ping_js_onRequestGet],
    },
  {
      routePath: "/debug/auth",
      mountPath: "/debug",
      method: "GET",
      middlewares: [],
      modules: [__debug_auth_js_onRequestGet],
    },
  {
      routePath: "/dev/init",
      mountPath: "/dev",
      method: "GET",
      middlewares: [],
      modules: [__dev_init_js_onRequestGet],
    },
  {
      routePath: "/disconnect",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__disconnect_js_onRequestGet],
    },
  {
      routePath: "/health",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__health_js_onRequestGet],
    },
  {
      routePath: "/logout",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__logout_js_onRequestGet],
    },
  ]