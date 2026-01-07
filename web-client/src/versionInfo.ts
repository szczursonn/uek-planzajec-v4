export const VERSION_META_TAG_NAME = 'uekpz4-version';

export const APP_VERSION =
    globalThis?.document?.querySelector(`meta[name="${VERSION_META_TAG_NAME}"]`)?.getAttribute('content') || 'unknown';

export const APP_REPO_URL = 'https://github.com/szczursonn/uek-planzajec-v4';
