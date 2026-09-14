/**
 * Client-side fetch helper — luôn gửi cookie session.
 */
export type ApiFetchInit = RequestInit & {
  skipCredentials?: boolean;
};

export async function apiFetch(
  input: string | URL | Request,
  init?: ApiFetchInit
): Promise<Response> {
  const { skipCredentials, headers, ...rest } = init || {};
  const nextHeaders = new Headers(headers || {});
  if (
    rest.body &&
    typeof rest.body === "string" &&
    !nextHeaders.has("Content-Type")
  ) {
    nextHeaders.set("Content-Type", "application/json");
  }
  return fetch(input, {
    ...rest,
    headers: nextHeaders,
    credentials: skipCredentials ? rest.credentials || "same-origin" : "include",
  });
}
