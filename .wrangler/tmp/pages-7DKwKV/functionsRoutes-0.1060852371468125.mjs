import { onRequestGet as __api_admin_js_onRequestGet } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\admin.js"
import { onRequestOptions as __api_admin_js_onRequestOptions } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\admin.js"
import { onRequestPost as __api_admin_js_onRequestPost } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\admin.js"
import { onRequestOptions as __api_ads_js_onRequestOptions } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\ads.js"
import { onRequestPost as __api_ads_js_onRequestPost } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\ads.js"
import { onRequestOptions as __api_analytics_js_onRequestOptions } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\analytics.js"
import { onRequestPost as __api_analytics_js_onRequestPost } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\analytics.js"
import { onRequestGet as __api_auth_js_onRequestGet } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\auth.js"
import { onRequestOptions as __api_auth_js_onRequestOptions } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\auth.js"
import { onRequestPost as __api_auth_js_onRequestPost } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\auth.js"
import { onRequestGet as __api_bookmarks_js_onRequestGet } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\bookmarks.js"
import { onRequestOptions as __api_bookmarks_js_onRequestOptions } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\bookmarks.js"
import { onRequestPost as __api_bookmarks_js_onRequestPost } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\bookmarks.js"
import { onRequestGet as __api_business_js_onRequestGet } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\business.js"
import { onRequestOptions as __api_business_js_onRequestOptions } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\business.js"
import { onRequestPost as __api_business_js_onRequestPost } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\business.js"
import { onRequestGet as __api_chat_js_onRequestGet } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\chat.js"
import { onRequestOptions as __api_chat_js_onRequestOptions } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\chat.js"
import { onRequestPost as __api_chat_js_onRequestPost } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\chat.js"
import { onRequestDelete as __api_dogs_js_onRequestDelete } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\dogs.js"
import { onRequestGet as __api_dogs_js_onRequestGet } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\dogs.js"
import { onRequestOptions as __api_dogs_js_onRequestOptions } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\dogs.js"
import { onRequestPost as __api_dogs_js_onRequestPost } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\dogs.js"
import { onRequestGet as __api_notifications_js_onRequestGet } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\notifications.js"
import { onRequestOptions as __api_notifications_js_onRequestOptions } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\notifications.js"
import { onRequestPost as __api_notifications_js_onRequestPost } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\notifications.js"
import { onRequestOptions as __api_reports_js_onRequestOptions } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\reports.js"
import { onRequestPost as __api_reports_js_onRequestPost } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\reports.js"
import { onRequestGet as __api_store_js_onRequestGet } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\store.js"
import { onRequestOptions as __api_store_js_onRequestOptions } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\store.js"
import { onRequestPost as __api_store_js_onRequestPost } from "C:\\Users\\검달프\\Desktop\\Paldo\\functions\\api\\store.js"

export const routes = [
    {
      routePath: "/api/admin",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_js_onRequestGet],
    },
  {
      routePath: "/api/admin",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_admin_js_onRequestOptions],
    },
  {
      routePath: "/api/admin",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_js_onRequestPost],
    },
  {
      routePath: "/api/ads",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_ads_js_onRequestOptions],
    },
  {
      routePath: "/api/ads",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_ads_js_onRequestPost],
    },
  {
      routePath: "/api/analytics",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_analytics_js_onRequestOptions],
    },
  {
      routePath: "/api/analytics",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_analytics_js_onRequestPost],
    },
  {
      routePath: "/api/auth",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_js_onRequestGet],
    },
  {
      routePath: "/api/auth",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_auth_js_onRequestOptions],
    },
  {
      routePath: "/api/auth",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_js_onRequestPost],
    },
  {
      routePath: "/api/bookmarks",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_bookmarks_js_onRequestGet],
    },
  {
      routePath: "/api/bookmarks",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_bookmarks_js_onRequestOptions],
    },
  {
      routePath: "/api/bookmarks",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_bookmarks_js_onRequestPost],
    },
  {
      routePath: "/api/business",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_business_js_onRequestGet],
    },
  {
      routePath: "/api/business",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_business_js_onRequestOptions],
    },
  {
      routePath: "/api/business",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_business_js_onRequestPost],
    },
  {
      routePath: "/api/chat",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_chat_js_onRequestGet],
    },
  {
      routePath: "/api/chat",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_chat_js_onRequestOptions],
    },
  {
      routePath: "/api/chat",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_chat_js_onRequestPost],
    },
  {
      routePath: "/api/dogs",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_dogs_js_onRequestDelete],
    },
  {
      routePath: "/api/dogs",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_dogs_js_onRequestGet],
    },
  {
      routePath: "/api/dogs",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_dogs_js_onRequestOptions],
    },
  {
      routePath: "/api/dogs",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_dogs_js_onRequestPost],
    },
  {
      routePath: "/api/notifications",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_notifications_js_onRequestGet],
    },
  {
      routePath: "/api/notifications",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_notifications_js_onRequestOptions],
    },
  {
      routePath: "/api/notifications",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_notifications_js_onRequestPost],
    },
  {
      routePath: "/api/reports",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_reports_js_onRequestOptions],
    },
  {
      routePath: "/api/reports",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_reports_js_onRequestPost],
    },
  {
      routePath: "/api/store",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_store_js_onRequestGet],
    },
  {
      routePath: "/api/store",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_store_js_onRequestOptions],
    },
  {
      routePath: "/api/store",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_store_js_onRequestPost],
    },
  ]