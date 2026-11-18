// Features the API does not provide yet. Their controls stay hidden or explain this until it does.
export const serverFeatures: Readonly<
  Record<
    | "passwordReset"
    | "gitlabTokenReplacement"
    | "invitationResend"
    | "licensePolicyChanges",
    boolean
  >
> = {
  passwordReset: false,
  gitlabTokenReplacement: false,
  invitationResend: false,
  licensePolicyChanges: false,
};
