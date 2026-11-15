import { IntegrationProvider } from "@/codeclarity_components/organizations/integrations/Integrations";

// The word shown for where a project comes from.
export function sourceLabel(type: IntegrationProvider): string {
  if (type === IntegrationProvider.GITHUB) return "GitHub";
  if (type === IntegrationProvider.GITLAB) return "GitLab";
  return "Upload";
}
