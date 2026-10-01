import { Post } from '../models/index.js';

// Requires MongoDB replica set / Atlas; prepares real-time feed fan-out.
export const watchPostChanges = () => {
  if (process.env.ENABLE_CHANGE_STREAMS !== 'true') return;
  Post.watch([], { fullDocument: 'updateLookup' })
    .on('change', event => console.log(`Post change: ${event.operationType}`, event.documentKey))
    .on('error', error => console.warn('Change stream unavailable:', error.message));
};
