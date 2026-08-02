const secrets: string[] = [];

export const setSecret = (value: string): void => {
  if (value) secrets.push(value);
};

const redact = (message: string): string => {
  let text = message;
  for (const secret of secrets) {
    text = text.split(secret).join('***');
  }
  return text;
};

export const info = (message: string): void => {
  console.log(redact(message));
};

export const warn = (message: string): void => {
  console.warn(redact(`WARNING: ${message}`));
};

export const error = (message: string): void => {
  console.error(redact(`ERROR: ${message}`));
};
