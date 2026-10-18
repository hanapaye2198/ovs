export function getRequest(): Request {
  return new Request(window.location.href);
}
