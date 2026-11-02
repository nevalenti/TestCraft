import { queryOptions } from "@tanstack/react-query";
import type { AvatarUrl } from "@testcraft/types";

import { queryKeys } from "@/api/queryKeys";
import * as sdk from "@/api/sdk";

export const accountApi = {
  getAvatarUrl: async (): Promise<AvatarUrl> => {
    const { data } = await sdk.getAvatarUrl({});
    return data;
  },

  uploadAvatar: async (file: File): Promise<AvatarUrl> => {
    const { data } = await sdk.uploadAvatar({ body: { file } });
    return data;
  },
};

export const accountQueries = {
  avatarUrl: () =>
    queryOptions({
      queryKey: queryKeys.account.avatarUrl,
      queryFn: () => accountApi.getAvatarUrl(),
      staleTime: 55 * 60 * 1000,
    }),
};
