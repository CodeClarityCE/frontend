import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";

import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";

import SourceVerdictExportMenu from "./SourceVerdictExportMenu.vue";

vi.unmock("@/utils/api/BaseRepository");

const download = vi.hoisted(() => vi.fn());
vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    downloadSourceVerdicts = download;
  },
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getAuthenticated: true, getToken: "token" }),
}));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));
const saveBlob = vi.hoisted(() => vi.fn());
vi.mock("@/utils/download", () => ({ saveBlob }));
const errorToast = vi.hoisted(() => vi.fn());
vi.mock("@/utils/toasts", () => ({ errorToast }));

// Renders the menu inline so its items can be clicked.
const passthrough = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      h("div", slots.default?.()),
});
const item = defineComponent({
  emits: ["select"],
  setup:
    (_, { slots, emit }) =>
    () =>
      h("button", { onClick: () => emit("select") }, slots.default?.()),
});

function mountMenu(): ReturnType<typeof mount<typeof SourceVerdictExportMenu>> {
  return mount(SourceVerdictExportMenu, {
    props: { analysisID: "analysis-1", projectID: "project-1" },
    global: {
      stubs: {
        DropdownMenu: passthrough,
        DropdownMenuTrigger: passthrough,
        DropdownMenuContent: passthrough,
        DropdownMenuLabel: passthrough,
        DropdownMenuSeparator: passthrough,
        DropdownMenuItem: item,
      },
    },
  });
}

describe("SourceVerdictExportMenu", () => {
  beforeEach(() => {
    download.mockReset();
    saveBlob.mockReset();
    errorToast.mockReset();
  });

  it.each(["csv", "json"] as const)(
    "saves the %s export of the analysis",
    async (format) => {
      const blob = new Blob(["rows"]);
      download.mockResolvedValue(blob);

      const wrapper = mountMenu();
      await wrapper
        .find(`[data-testid="export-verdicts-${format}"]`)
        .trigger("click");
      await flushPromises();

      expect(download).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: "org-1",
          projectId: "project-1",
          analysisId: "analysis-1",
          format,
          bearerToken: "token",
        }),
      );
      expect(saveBlob).toHaveBeenCalledWith(
        blob,
        `source-verdicts-analysis-1.${format}`,
      );
    },
  );

  it("says the analysis predates source verdicts when the API has none", async () => {
    download.mockRejectedValue(
      new BusinessLogicError(APIErrors.SourceVerdictsNotAvailable, "none"),
    );

    const wrapper = mountMenu();
    await wrapper.find('[data-testid="export-verdicts-csv"]').trigger("click");
    await flushPromises();

    expect(saveBlob).not.toHaveBeenCalled();
    expect(errorToast).toHaveBeenCalledWith(
      "This analysis predates source verdicts. Re-run it to export them.",
    );
  });

  it("reports any other failure", async () => {
    download.mockRejectedValue(new Error("network"));

    const wrapper = mountMenu();
    await wrapper.find('[data-testid="export-verdicts-json"]').trigger("click");
    await flushPromises();

    expect(errorToast).toHaveBeenCalledWith(
      "Could not export the source verdicts",
    );
  });
});
