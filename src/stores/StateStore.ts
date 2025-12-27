import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import type { Project } from "@/codeclarity_components/projects/project.entity";
import type { PaginatedResponse } from "@/utils/api/responses/PaginatedResponse";

export const useProjectsMainStore = defineStore("projectsMain", () => {
  const projectsResponse: Ref<PaginatedResponse<Project> | undefined> = ref();
  const reposLoading: Ref<boolean> = ref(false);
  const reposFetchError: Ref<boolean> = ref(false);
  const reposFetchErrorCode: Ref<string | undefined> = ref();
  const orgId: Ref<string | undefined> = ref();

  // Reset
  function $reset(): void {
    projectsResponse.value = undefined;
    reposLoading.value = false;
    reposFetchError.value = false;
    reposFetchErrorCode.value = undefined;
    orgId.value = undefined;
  }

  // Getters
  function getProjectsResponse(): PaginatedResponse<Project> | undefined {
    return projectsResponse.value;
  }

  function getOrgId(): string | undefined {
    return orgId.value;
  }

  function getReposLoading(): boolean {
    return reposLoading.value;
  }

  function getReposFetchError(): boolean {
    return reposFetchError.value;
  }

  function getReposFetchErrorCode(): string | undefined {
    return reposFetchErrorCode.value;
  }

  // Setters
  function setProjectsResponse(
    _projectsResponse: PaginatedResponse<Project>,
  ): void {
    projectsResponse.value = _projectsResponse;
  }

  function setOrgId(_orgId: string): void {
    orgId.value = _orgId;
  }

  function setReposLoading(_reposLoading: boolean): void {
    reposLoading.value = _reposLoading;
  }

  function setReposFetchError(_reposFetchError: boolean): void {
    reposFetchError.value = _reposFetchError;
  }

  function setReposFetchErrorCode(
    _reposFetchErrorCode: string | undefined,
  ): void {
    reposFetchErrorCode.value = _reposFetchErrorCode;
  }

  return {
    projectsResponse,
    reposLoading,
    reposFetchError,
    reposFetchErrorCode,
    orgId,

    // Getters
    getProjectsResponse,
    getOrgId,
    getReposLoading,
    getReposFetchError,
    getReposFetchErrorCode,

    // Setters
    setProjectsResponse,
    setOrgId,
    setReposLoading,
    setReposFetchError,
    setReposFetchErrorCode,

    // Others
    $reset,
  };
});
