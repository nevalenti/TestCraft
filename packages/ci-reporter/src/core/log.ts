const secrets: string[] = [];

export const setSecret = (value: string): void => {
  if (value) secrets.push(value);
};

const redact = (message: string): string =>
  secrets.reduce((msg, secret) => msg.split(secret).join("***"), message);

export const info = (message: string): void => {
  console.log(redact(message));
};

export const warn = (message: string): void => {
  console.warn(redact(`WARNING: ${message}`));
};

export const error = (message: string): void => {
  console.error(redact(`ERROR: ${message}`));
};
