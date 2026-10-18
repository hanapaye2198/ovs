export {
  createClientOnlyFn,
  createCsrfMiddleware,
  createIsomorphicFn,
  createMiddleware,
  createServerFn,
  createServerOnlyFn,
  createStart,
} from "@tanstack/start-client-core";

import * as React from "react";
import { isRedirect, useRouter } from "@tanstack/react-router";

export function useServerFn<TArgs extends unknown[], TResult>(
  serverFn: (...args: TArgs) => TResult,
) {
  const router = useRouter();

  return React.useCallback(
    async (...args: TArgs): Promise<Awaited<TResult>> => {
      try {
        return await serverFn(...args);
      } catch (error) {
        if (isRedirect(error)) {
          return router.navigate(router.resolveRedirect(error).options) as Awaited<TResult>;
        }
        throw error;
      }
    },
    [router, serverFn],
  );
}
