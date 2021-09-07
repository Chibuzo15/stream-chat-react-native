import { useEffect, useState } from 'react';

import { StreamCache } from '../../StreamCache';
import StreamMediaCache from '../../StreamMediaCache';

import type { ImageURISource } from 'react-native';

type GalleryImageCacheConfig = {
  channelId: string | undefined;
  messageId: string | undefined;
};

export const getAttachmentId = (uri: string | undefined) => {
  const parsedUrl = uri?.split('?')?.[0];
  return parsedUrl?.split(/(images|media)\//)[2];
};

export const useCachedAttachment = (config: {
  cacheConfig: GalleryImageCacheConfig;
  source: ImageURISource;
}) => {
  const [cachedSource, setCachedSource] = useState({
    ...config.source,
    uri: !StreamCache.shouldCacheMedia() ? config.source.uri : '',
  });

  const setCachedSourceIfExists = async () => {
    if (!StreamCache.shouldCacheMedia()) return;

    const { channelId, messageId } = config.cacheConfig;
    const attachmentId = getAttachmentId(config.source.uri);

    if (!messageId || !config.source.uri || !channelId || !attachmentId) {
      if (!messageId || !channelId) {
        console.warn(
          "Attempted to use cached attachment without passing the cacheConfig prop to the cached image component. Please make sure you're sending the channelId and messageId",
        );
      }
      return setCachedSource((src) => ({
        ...src,
        uri: config.source.uri as string,
      }));
    }

    if (!(await StreamMediaCache.checkIfLocalAttachment(channelId, messageId, attachmentId))) {
      await StreamMediaCache.saveAttachment(
        channelId,
        messageId,
        attachmentId,
        config.source.uri as string,
      );
    }

    return setCachedSource((src) => ({
      ...src,
      uri: `file://${StreamMediaCache.getStreamChannelMessageAttachmentDir(
        channelId,
        messageId,
        attachmentId,
      )}`,
    }));
  };

  useEffect(() => {
    setCachedSourceIfExists();
  }, []);

  return cachedSource;
};