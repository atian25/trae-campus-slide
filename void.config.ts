// Cloudflare 部署配置（Void CLI）：worker 名固定为 trae-campus-slide-tz
import { defineConfig } from "void/config";

export default defineConfig({
  cloudflare: {
    name: "trae-campus-slide-tz",
    account_id: "e247f3a5b52b1483eb2640ba3c0a0e44",
  },
});
