// Features the API does not provide yet. Their controls stay hidden or explain this until it does.
export const serverFeatures: Readonly<
  Record<"passwordReset" | "invitationResend" | "licensePolicyChanges", boolean>
> = {
  passwordReset: false,
  invitationResend: false,
  licensePolicyChanges: false,
};
