import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { useNotificationStore } from '@/stores/notifications';

import { Discussion } from '../types';

import { getDiscussionsKey } from './get-discussions';

export const createDiscussionInputSchema = z.object({
  title: z.string().min(1, 'Required'),
  body: z.string().min(1, 'Required'),
});

export type CreateDiscussionInput = z.infer<typeof createDiscussionInputSchema>;

export const createDiscussion = ({
  data,
}: {
  data: CreateDiscussionInput;
}): Promise<Discussion> => {
  return api.post(`/discussions`, data);
};

type UseCreateDiscussionOptions = {
  config?: MutationConfig<typeof createDiscussion>;
};

export const useCreateDiscussion = ({
  config,
}: UseCreateDiscussionOptions = {}) => {
  const { addNotification } = useNotificationStore();
  const queryClient = useQueryClient();

  return useMutation({
    onMutate: async (newDiscussion) => {
      await queryClient.cancelQueries({
        queryKey: getDiscussionsKey(),
      });

      const previousDiscussions =
        queryClient.getQueryData<Discussion[]>(getDiscussionsKey());

      queryClient.setQueryData(getDiscussionsKey(), [
        ...(previousDiscussions || []),
        newDiscussion.data,
      ]);

      return { previousDiscussions };
    },
    onError: (_, __, context: any) => {
      if (context?.previousDiscussions) {
        queryClient.setQueryData(
          getDiscussionsKey(),
          context.previousDiscussions,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getDiscussionsKey(),
      });
      addNotification({
        type: 'success',
        title: 'Discussion Created',
      });
    },
    ...config,
    mutationFn: createDiscussion,
  });
};
