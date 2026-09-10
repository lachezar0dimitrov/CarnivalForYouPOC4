// Old site: contacts.php?lang=bg — see functions/_lib/legacyRedirect.js
// (handleStaticContentPage) for why this needs a real Function instead of
// the static public/_redirects rule it used to have.
import { handleStaticContentPage } from './_lib/legacyRedirect.js';

export const onRequest = handleStaticContentPage('/contacts');
