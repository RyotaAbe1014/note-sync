export type AppSettings = {
  rootDirectory: {
    path: string;
  };
  git: {
    token: string;
    author: {
      name: string;
      email: string;
    };
  };
  apiKeys: {
    openai: string;
    // add other ai providers here
  };
  theme: 'light' | 'dark' | 'system';
};
