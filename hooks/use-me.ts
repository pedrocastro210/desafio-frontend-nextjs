import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
    staleTime: 60_000, // Informações do perfil do agente são estáveis, verificar uma vez por minuto
  });
}
