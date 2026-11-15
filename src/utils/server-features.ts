// Features the API does not provide yet. Their controls stay hidden or explain this until it does.
export const serverFeatures: Readonly<
  Record<
    | "passwordReset"
    | "gitlabTokenReplacement"
    | "memberRemoval"
    | "invitationResend"
    | "invitationRevoke"
    | "licensePolicyChanges",
    boolean
  >
> = {
  passwordReset: false,
  gitlabTokenReplacement: false,
  memberRemoval: false,
  invitationResend: false,
  invitationRevoke: false,
  licensePolicyChanges: false,
};
