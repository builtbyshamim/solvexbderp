// src/common/constants/cache-keys.constant.ts
export enum CacheKeys {
  HELLO_MESSAGE = 'hello_message',
  USER_PROFILE = 'user_profile:', // আইডি যোগ করার জন্য কোলন
  SETTINGS = 'app_settings',


  // ✅ Product cache keys
  PRODUCTS_LIST = 'products:list:',      // products:list:page=1&limit=10&search=...
  PRODUCT_DETAIL = 'products:detail:',   // products:detail:{id}
  TOP_DEALS_PRODUCTS = 'products:top-deals:',   
}