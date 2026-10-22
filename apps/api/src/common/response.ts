export function ok<T>(data: T, message = 'ok') {
  return { code: 0, message, data };
}

export function fail(message: string, code = 1) {
  return { code, message, data: null };
}
