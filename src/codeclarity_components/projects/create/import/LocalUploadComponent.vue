<script lang="ts" setup>
import { FileArchive, Upload, X } from "@lucide/vue";
import { toTypedSchema } from "@vee-validate/zod";
import { storeToRefs } from "pinia";
import { useForm } from "vee-validate";
import { computed, ref } from "vue";
import * as z from "zod";

import { FileRepository } from "@/codeclarity_components/file/file.repository";
import { ProjectRepository } from "@/codeclarity_components/projects/project.repository";
import router from "@/router";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { Progress } from "@/shadcn/ui/progress";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
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
    .min(2, "A name of at least 2 characters is required")
    .max(100, "At most 100 characters"),
  description: z.string().max(500, "At most 500 characters").optional(),
});

type FormValues = z.infer<typeof formSchema>;

const form = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    name: "",
    description: "",
  },
});
const [name] = form.defineField("name");
const [description] = form.defineField("description");
const nameError = computed(() => form.errors.value.name);
const descriptionError = computed(() => form.errors.value.description);
const fileInput = ref<HTMLInputElement | null>(null);

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
    uploadError.value =
      err instanceof Error
        ? err.message
        : "Failed to create project or upload file.";
    errorToast("Failed to create project or upload file.");
  } finally {
    isUploading.value = false;
  }
});

// Clears the native input too, so the same file can be picked again.
function removeFile(): void {
  clearFile();
  if (fileInput.value) fileInput.value.value = "";
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Project archive</CardTitle>
      <CardDescription>
        A ZIP (.zip) or TAR.GZ (.tar.gz, .tgz) archive of the project, with its
        package.json or composer.json.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form class="flex max-w-2xl flex-col gap-6" novalidate @submit="onSubmit">
        <div class="flex flex-col gap-2">
          <Label for="upload-name">Name</Label>
          <Input
            id="upload-name"
            v-model="name"
            :disabled="isUploading"
            :aria-invalid="nameError ? true : undefined"
            :aria-describedby="nameError ? 'upload-name-error' : undefined"
          />
          <p
            v-if="nameError"
            id="upload-name-error"
            class="text-sm text-destructive"
          >
            {{ nameError }}
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <Label for="upload-description">Description (optional)</Label>
          <Input
            id="upload-description"
            v-model="description"
            :disabled="isUploading"
            :aria-invalid="descriptionError ? true : undefined"
            :aria-describedby="
              descriptionError ? 'upload-description-error' : undefined
            "
          />
          <p
            v-if="descriptionError"
            id="upload-description-error"
            class="text-sm text-destructive"
          >
            {{ descriptionError }}
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <Label for="upload-file">Archive</Label>
          <div
            class="flex flex-col items-center gap-3 rounded-card border-2 border-dashed p-8 text-center transition-colors duration-150 motion-reduce:transition-none"
            :class="
              isDragOver ? 'border-primary bg-brand-subtle' : 'border-border'
            "
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop.prevent="handleDrop"
          >
            <template v-if="!selectedFile">
              <Upload aria-hidden="true" class="size-8 text-muted-foreground" />
              <p class="text-sm text-muted-foreground">
                Drop the archive here, or choose it.
              </p>
              <input
                id="upload-file"
                ref="fileInput"
                type="file"
                :accept="ALLOWED_EXTENSIONS.join(',')"
                :disabled="isUploading"
                class="text-sm file:mr-3 file:rounded-button file:border file:bg-card file:px-3 file:py-1.5 file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                @change="handleFileSelect"
              />
            </template>
            <template v-else>
              <FileArchive aria-hidden="true" class="size-8 text-success" />
              <p class="text-sm font-medium text-foreground-strong">
                {{ selectedFile.name }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ formatFileSize(selectedFile.size) }}
              </p>
              <Button
                v-if="!isUploading"
                type="button"
                variant="outline"
                size="sm"
                @click="removeFile"
              >
                <X aria-hidden="true" />
                Remove {{ selectedFile.name }}
              </Button>
            </template>
          </div>
        </div>

        <div v-if="isUploading" class="flex flex-col gap-2">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Uploading</span>
            <span class="font-medium tabular-nums">{{ uploadProgress }}%</span>
          </div>
          <Progress
            :model-value="uploadProgress"
            aria-label="Upload progress"
          />
        </div>

        <Alert v-if="uploadError" variant="destructive">
          <AlertDescription>{{ uploadError }}</AlertDescription>
        </Alert>

        <div class="flex gap-3">
          <Button type="submit" :disabled="isUploading || !selectedFile" arrow>
            {{ isUploading ? "Uploading" : "Create project and upload" }}
          </Button>
          <Button
            type="button"
            variant="outline"
            :disabled="isUploading"
            @click="router.back()"
          >
            Cancel
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</template>
