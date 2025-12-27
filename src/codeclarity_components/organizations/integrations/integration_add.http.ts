export enum GitlabTokenType {
  OAUTH_TOKEN = "OAUTH_TOKEN",
  PERSONAL_ACCESS_TOKEN = "PERSONAL_ACCESS_TOKEN",
}

export interface GilabIntegrationAdd {
  token: string;
  token_type: GitlabTokenType;
  gitlab_instance_url: string;
}

export enum GithubTokenType {
  OAUTH_TOKEN = "OAUTH_TOKEN",
  CLASSIC_TOKEN = "CLASSIC_TOKEN",
}

export interface GithubIntegrationAdd {
  token: string;
  token_type: GithubTokenType;
}

export interface GithubIntegrationUpdate {
  token: string;
  token_type: GithubTokenType;
}

export interface GitlabIntegrationUpdate {
  token: string;
  token_type: GitlabTokenType;
  gitlab_instance_url: string;
}
