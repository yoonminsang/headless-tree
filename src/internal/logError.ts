export const logError = (error: Error, data?: Record<string, unknown>) => {
  console.error('error', error);

  if (data) {
    console.error('error data', data);
  }
  return;
};
