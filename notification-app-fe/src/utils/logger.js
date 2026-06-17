function write(level, message, details) {
  const payload = {
    timestamp: new Date().toISOString(),
    message,
    ...(details ? { details } : {}),
  };

  if (level === "error") {
    console.error(payload);
    return;
  }

  console.info(payload);
}

export const logger = {
  apiRequest(method, path) {
    write("info", "API request", { method, path });
  },

  apiFailure(method, path, error) {
    write("error", "API failure", {
      method,
      path,
      error: error?.message ?? String(error),
    });
  },

  navigation(path) {
    write("info", "Page navigation", { path });
  },
};
