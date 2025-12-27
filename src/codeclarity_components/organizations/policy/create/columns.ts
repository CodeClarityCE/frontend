import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import type { License } from "@/codeclarity_components/results/licenses/License";
import Checkbox from "@/shadcn/ui/checkbox/Checkbox.vue";

export const columns: ColumnDef<License>[] = [
  {
    id: "select",
    header: ({ table }) =>
      h(Checkbox, {
        modelValue: table.getIsAllPageRowsSelected(),
        "onUpdate:modelValue": (value: boolean | "indeterminate") =>
          table.toggleAllPageRowsSelected(!!value),
        ariaLabel: "Select all",
      }),
    cell: ({ row }) =>
      h(Checkbox, {
        modelValue: row.getIsSelected(),
        "onUpdate:modelValue": (value: boolean | "indeterminate") =>
          row.toggleSelected(!!value),
        ariaLabel: "Select row",
      }),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "licenseName",
    header: () => h("div", { class: "text-right" }, "License Name"),
    cell: ({ row }) => {
      const licenseName: string = row.original.name;

      return h("div", { class: "text-right font-medium" }, licenseName);
    },
  },
];
