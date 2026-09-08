// English-URL counterpart of functions/product-detail/[id].js — see
// functions/_lib/productMeta.js for the shared server-side OG/meta logic.
import { handleProductDetail } from '../../_lib/productMeta.js';

export async function onRequestGet(context) {
  return handleProductDetail(context, 'en');
}
