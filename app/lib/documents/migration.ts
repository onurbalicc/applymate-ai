/** IndexedDB starts at schema v1 for this MVP. Existing localStorage-only
    users have no binary records to migrate; missing document selections are
    intentionally treated as empty by the automation compatibility layer. */
export const DOCUMENT_STORE_SCHEMA_VERSION = 1;

