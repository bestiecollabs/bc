import * as impl from "../brands/import.js";

/**
 * POST /api/admin/chipchip/brands-import
 * Delegates to /api/admin/brands implementation so policy stays centralized.
 */
export const onRequestPost = (ctx) => impl.onRequestPost(ctx);



