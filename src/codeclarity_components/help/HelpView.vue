<script lang="ts" setup>
import FaqBox from '@/base_components/FaqBox.vue';
import { useStateStore } from '@/stores/state';

const state = useStateStore();
state.$reset();

state.page = 'help';
state.publicPage = false;
</script>
<template>
    <div class="flex flex-col gap-8 p-12">
        <h2 class="text-3xl font-bold tracking-tight">Help</h2>
        <!-- <template #description>
                Within this page you can find a section on frequently asked questions. If your
                question is not answered within, the please take up contact with us.
            </template> -->
        <div>
            <div class="flex flex-col gap-8">
                <h2 class="font-black text-2xl">Faq</h2>
                <div class="flex flex-row gap-5 flex-wrap w-full justify-evenly">
                    <FaqBox>
                        <template #question>What is Software Composition Analysis (SCA)?</template>
                        <template #answer></template>
                    </FaqBox>
                    <FaqBox>
                        <template #question>Does SCA find non-disclosed vulnerabilities?</template>
                        <template #answer>
                            No, SCA is a process that relies on the disclosure of vulnerabilities in
                            order to identify affected components within your project.
                        </template>
                    </FaqBox>
                    <FaqBox>
                        <template #question>Where can I upload/import my projects?</template>
                        <template #answer>
                            In order to import your projects you must add a Github or Gitlab
                            integration. After that you can import any of your, or your
                            orgranizations' projects.
                        </template>
                    </FaqBox>
                    <FaqBox>
                        <template #question>Can I upload/import projects that are not stored in a Versions Control
                            System?</template>
                        <template #answer>
                            No, you cannot. We only support the upload/import of source code
                            projects via Github or Gitlab.
                        </template>
                    </FaqBox>
                    <FaqBox>
                        <template #question>What can I do, if a vulnerable component is not patchable?</template>
                        <template #answer>
                            If the vulnerability poses a great risk to your application and/or
                            infrastructure then remove the dependency from your project. You may
                            search your package manager for a similar packages that provides the
                            same or similar functionality and contract. You may also implement the
                            functionality your self.
                        </template>
                    </FaqBox>
                    <FaqBox>
                        <template #question>I found an error in a vulnerability description.</template>
                        <template #answer>
                            Our apologies for the inconvenience. If you wish to have this error
                            rectified then please contact us via the form below, and make sure to
                            select 'Vulnerability Description Correction' as the Subject. Provide us
                            with the vulnerability identifier (CVE or other) and the error we should
                            correct.
                        </template>
                    </FaqBox>
                    <FaqBox>
                        <template #question>A vulnerability was reported which does not affect my
                            project.</template>
                        <template #answer>
                            Our apologies for the inconvenience. If you wish to have this error
                            rectified then please contact us via the form below, and make sure to
                            select 'False positive report' as the Subject. Provide us with the
                            approximate analysis start time, the project name and organization name
                            on which the error occured. Additionally, provide us with the
                            vulnerability identifier (CVE or other). Lastly, tell us why you believe
                            this vulnerability does not affect your particular project.
                        </template>
                    </FaqBox>
                    <FaqBox>
                        <template #question>Where do you source vulnerability information?</template>
                        <template #answer>
                            We integrate with both the National Vulnerability Database (<a href="https://nvd.nist.gov/"
                                target="_blank">NVD</a>) and the Open Source Vulnerabilities Database (<a
                                href="https://osv.dev/" target="_blank">OSV</a>).
                        </template>
                    </FaqBox>
                </div>
            </div>
        </div>
        <div>
            <h2 class="font-black text-2xl">Contact us</h2>
            <div>TBA</div>
        </div>
    </div>
</template>
