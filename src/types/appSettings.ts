export type AppSettings = {
  rootDirectory: {
    path: string;
  };
  git: {
    remoteUrl: string;
    token: string;
    author: {
      name: string;
      email: string;
    }
  };
};
