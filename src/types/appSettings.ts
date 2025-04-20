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
};
