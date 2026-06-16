import { QueryClient, isServer } from "@tanstack/react-query";
import { cache } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Retorna um QueryClient por requisição no servidor (via React cache)
 * e um singleton no browser — padrão oficial TanStack Query + App Router.
 */
export function getQueryClient() {
  if (isServer) {
    return cache(() => makeQueryClient())();
  }

  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }

  return browserQueryClient;
}
