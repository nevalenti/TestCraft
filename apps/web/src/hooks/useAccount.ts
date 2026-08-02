import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { accountApi, accountQueries } from '@/api/account';
import { queryKeys } from '@/api/queryKeys';

export const useAvatarUrl = () => useQuery(accountQueries.avatarUrl());

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => accountApi.uploadAvatar(file),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.account.avatarUrl, data);
    },
  });
};
