import { db } from "@/db/client";
import { createTask, CreateTaskInput, getTodayTasks } from "@/services/task";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useTodayTasks() {
  return useQuery({
    // queryKeyはキャッシュの名前であって、検索条件ではない
    queryKey: ["tasks", "today"],
    queryFn: () => getTodayTasks(db),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      return createTask(db, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
