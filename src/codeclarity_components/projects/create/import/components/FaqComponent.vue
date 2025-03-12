<script lang="ts" setup>
import FaqBox from '@/base_components/FaqBox.vue';
</script>
<template>
    <div>
        <h2>Faq</h2>
        <div class="flex flex-row gap-5 flex-wrap w-full justify-left">
            <FaqBox>
                <template #question>I cannot find a recently created repo.</template>
                <template #answer>
                    <div class="flex flex-col gap-2">
                        <div>
                            We cache repositories. So if you cannot find a specific recently created
                            repo, then simply force refresh the repos, by clicking the 'Force
                            Refresh' button at the top of the page. We do apologize for the
                            inconvenience.
                        </div>
                    </div>
                </template>
            </FaqBox>
            <FaqBox>
                <template #question>My imports keep failing.</template>
                <template #answer>
                    <div class="flex flex-col gap-2">
                        <div>
                            Force refresh the repos, by clicking the 'Force Refresh' button at the
                            top of the page, and try to import the impacted repositories again. If
                            the problem persists then please contact us.
                        </div>
                    </div>
                </template>
            </FaqBox>
            <FaqBox>
                <template #question>I do not see all of my repos.</template>
                <template #answer>
                    <div class="flex flex-col gap-2">
                        <div>
                            We can only show those repos to which the user that created the
                            integration has access to. In particular, we can only show those repos
                            to which the entered access token has access to. Additionally, we only
                            show repos that have not been imported already. In case you are still
                            missing some repos then please force refresh the repos, by clicking the
                            'Force Refresh' button at the top of the page, and try to import the
                            impacted repositories again. If the problem persists then please contact
                            us.
                        </div>
                    </div>
                </template>
            </FaqBox>
        </div>
    </div>
</template>
