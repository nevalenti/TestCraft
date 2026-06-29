import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { accountApi } from "@/api/account";
import { queryKeys } from "@/api/queryKeys";

export const useAvatarUrl = () =>
  useQuery({
    queryKey: queryKeys.account.avatarUrl,
    queryFn: () => accountApi.getAvatarUrl(),
    staleTime: 55 * 60 * 1000,
  });

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => accountApi.uploadAvatar(file),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.account.avatarUrl, data);
    },
  });
};
