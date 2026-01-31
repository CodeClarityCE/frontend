<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { toTypedSchema } from "@vee-validate/zod";
import { storeToRefs } from "pinia";
import { useForm } from "vee-validate";
import { ref } from "vue";
import * as z from "zod";

import { InfoCard } from "@/base_components";
import { FileRepository } from "@/codeclarity_components/file/file.repository";
import { ProjectRepository } from "@/codeclarity_components/projects/project.repository";
import router from "@/router";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import Button from "@/shadcn/ui/button/Button.vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shadcn/ui/form";
import Input from "@/shadcn/ui/input/Input.vue";
import { Progress } from "@/shadcn/ui/progress";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { filterUndefined } from "@/utils/form/filterUndefined";
import { errorToast, successToast } from "@/utils/toasts";

// Repositories
const projectsRepo = new ProjectRepository();
const fileRepo = new FileRepository();

// Stores
const authStore = useAuthStore();
const userStore = useUserStore();
const { defaultOrg } = storeToRefs(userStore);

// State
const selectedFile = ref<File | null>(null);
const isDragOver = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadError = ref<string | null>(null);

// Allowed file extensions
const ALLOWED_EXTENSIONS = [".zip", ".tar.gz", ".tgz"];

// Form schema
const formSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

const form = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    name: "",
    description: "",
  },
});

// File validation
function isValidFile(file: File): boolean {
  const fileName = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Handle file selection
function handleFileSelect(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    if (isValidFile(file)) {
      selectedFile.value = file;
      uploadError.value = null;
    } else {
      uploadError.value =
        "Invalid file type. Please upload a ZIP or TAR.GZ archive.";
      selectedFile.value = null;
    }
  }
}

// Handle drag and drop
function handleDrop(event: DragEvent): void {
  isDragOver.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    if (isValidFile(file)) {
      selectedFile.value = file;
      uploadError.value = null;
    } else {
      uploadError.value =
        "Invalid file type. Please upload a ZIP or TAR.GZ archive.";
      selectedFile.value = null;
    }
  }
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault();
  isDragOver.value = true;
}

function handleDragLeave(): void {
  isDragOver.value = false;
}

// Clear selected file
function clearFile(): void {
  selectedFile.value = null;
  uploadError.value = null;
}

// Submit handler
const onSubmit = form.handleSubmit(async (values) => {
  if (!selectedFile.value) {
    uploadError.value = "Please select a file to upload.";
    return;
  }

  if (!defaultOrg?.value?.id) {
    uploadError.value = "No organization selected.";
    return;
  }

  if (!authStore.getToken) {
    uploadError.value = "Not authenticated.";
    return;
  }

  isUploading.value = true;
  uploadProgress.value = 0;
  uploadError.value = null;

  try {
    // Step 1: Create the FILE project
    const projectResponse = await projectsRepo.createProject({
      orgId: defaultOrg.value.id,
      data: {
        name: values.name,
        description: values.description ?? "",
      },
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });

    const projectId = projectResponse.id;

    // Step 2: Upload the file
    await fileRepo.uploadFile({
      projectId,
      orgId: defaultOrg.value.id,
      file: selectedFile.value,
      bearerToken: authStore.getToken,
      onProgress: (progress) => {
        uploadProgress.value = progress;
      },
    });

    successToast("Project created and file uploaded successfully!");

    // Navigate to projects list
    void router.push({ name: "projects" });
  } catch (err) {
    console.error("Upload error:", err);
    uploadError.value =
      err instanceof Error
        ? err.message
        : "Failed to create project or upload file.";
    errorToast("Failed to create project or upload file.");
  } finally {
    isUploading.value = false;
  }
});

// Open file picker
function openFilePicker(): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ALLOWED_EXTENSIONS.join(",");
  input.onchange = handleFileSelect;
  input.click();
}
</script>

<template>
  <main class="min-h-screen bg-white p-6">
    <div class="space-y-8">
      <!-- Info Card -->
      <InfoCard
        title="Upload Local Project"
        description="Upload a ZIP or TAR.GZ archive of your project for security analysis"
        icon="solar:upload-bold"
        variant="primary"
      >
        <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div class="flex items-start gap-3">
            <Icon
              icon="solar:info-circle-bold"
              class="h-5 w-5 text-blue-600 mt-0.5"
            />
            <div>
              <p class="font-medium text-blue-800 mb-1">Supported Formats</p>
              <p class="text-sm text-blue-700">
                Upload your project as a ZIP (.zip) or TAR.GZ (.tar.gz, .tgz)
                archive. The archive should contain your project files including
                package.json or composer.json.
              </p>
            </div>
          </div>
        </div>
      </InfoCard>

      <!-- Upload Form -->
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription
            >Enter the project name and upload your source code
            archive</CardDescription
          >
        </CardHeader>
        <CardContent>
          <form class="space-y-6" @submit="onSubmit">
            <!-- Project Name -->
            <FormField v-slot="{ componentField }" name="name">
              <FormItem>
                <FormLabel class="text-sm font-medium text-theme-black">
                  Project Name <span class="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="My Awesome Project"
                    v-bind="filterUndefined(componentField)"
                    class="border-gray-300 focus:ring-1 focus:ring-theme-primary focus:border-theme-primary"
                    :disabled="isUploading"
                  />
                </FormControl>
                <FormDescription class="text-xs text-theme-gray">
                  A descriptive name for your project
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- Project Description -->
            <FormField v-slot="{ componentField }" name="description">
              <FormItem>
                <FormLabel class="text-sm font-medium text-theme-black">
                  Description
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="A brief description of your project"
                    v-bind="filterUndefined(componentField)"
                    class="border-gray-300 focus:ring-1 focus:ring-theme-primary focus:border-theme-primary"
                    :disabled="isUploading"
                  />
                </FormControl>
                <FormDescription class="text-xs text-theme-gray">
                  Optional description for your project
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- File Drop Zone -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-theme-black">
                Project Archive <span class="text-red-500">*</span>
              </label>
              <div
                class="border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer"
                :class="[
                  isDragOver
                    ? 'border-theme-primary bg-theme-primary/5'
                    : 'border-gray-300 hover:border-gray-400',
                  selectedFile ? 'border-green-500 bg-green-50' : '',
                  isUploading ? 'opacity-50 cursor-not-allowed' : '',
                ]"
                @dragover="handleDragOver"
                @dragleave="handleDragLeave"
                @drop.prevent="handleDrop"
                @click="!isUploading && !selectedFile && openFilePicker()"
              >
                <!-- No file selected -->
                <div v-if="!selectedFile" class="space-y-4">
                  <Icon
                    icon="solar:upload-bold"
                    class="h-12 w-12 mx-auto text-gray-400"
                  />
                  <div>
                    <p class="text-sm font-medium text-gray-700">
                      Drag and drop your project archive here
                    </p>
                    <p class="text-xs text-gray-500 mt-1">or click to browse</p>
                  </div>
                  <p class="text-xs text-gray-400">Supported: ZIP, TAR.GZ</p>
                </div>

                <!-- File selected -->
                <div v-else class="space-y-4">
                  <Icon
                    icon="solar:file-check-bold"
                    class="h-12 w-12 mx-auto text-green-500"
                  />
                  <div>
                    <p class="text-sm font-medium text-gray-700">
                      {{ selectedFile.name }}
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ formatFileSize(selectedFile.size) }}
                    </p>
                  </div>
                  <Button
                    v-if="!isUploading"
                    type="button"
                    variant="outline"
                    size="sm"
                    @click.stop="clearFile"
                  >
                    <Icon icon="solar:trash-bin-2-bold" class="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>

            <!-- Upload Progress -->
            <div v-if="isUploading" class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Uploading...</span>
                <span class="text-theme-primary font-medium"
                  >{{ uploadProgress }}%</span
                >
              </div>
              <Progress :model-value="uploadProgress" class="h-2" />
            </div>

            <!-- Error Alert -->
            <Alert v-if="uploadError" variant="destructive">
              <Icon icon="solar:danger-triangle-bold" class="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{{ uploadError }}</AlertDescription>
            </Alert>

            <!-- Submit Button -->
            <div class="flex gap-3 pt-4">
              <Button
                type="submit"
                class="bg-theme-primary hover:bg-theme-primary/90 text-white"
                :disabled="isUploading || !selectedFile"
              >
                <Icon
                  v-if="isUploading"
                  icon="solar:spinner-bold"
                  class="h-4 w-4 mr-2 animate-spin"
                />
                <Icon v-else icon="solar:upload-bold" class="h-4 w-4 mr-2" />
                {{ isUploading ? "Uploading..." : "Create Project & Upload" }}
              </Button>
              <Button
                type="button"
                variant="outline"
                class="border-gray-300 text-gray-700 hover:border-theme-primary hover:text-theme-primary"
                :disabled="isUploading"
                @click="router.back()"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  </main>
</template>
