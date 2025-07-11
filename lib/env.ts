export const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // browser should use relative url
    return "";
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // dev SSR should use localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const getAbsoluteUrl = (path: string) => {
  return `${getBaseUrl()}${path}`;
};
