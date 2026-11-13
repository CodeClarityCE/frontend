<script lang="ts" setup>
import BrandEmphasis from "@/base_components/page/BrandEmphasis.vue";
import TextLink from "@/codeclarity_components/authentication/layout/TextLink.vue";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shadcn/ui/accordion";
import { Card, CardContent } from "@/shadcn/ui/card";
import { useStateStore } from "@/stores/state";

const state = useStateStore();
state.$reset();

state.page = "help";
state.publicPage = false;
</script>
<template>
  <main class="flex flex-col gap-8 p-12 text-foreground">
    <h1 class="text-3xl font-bold tracking-tight text-foreground-strong">
      How can we <BrandEmphasis>help</BrandEmphasis>?
    </h1>
    <section class="flex max-w-4xl flex-col gap-4" aria-labelledby="faq">
      <h2 id="faq" class="text-xl font-bold text-foreground-strong">
        Frequently asked questions
      </h2>
      <Card class="rounded-card border-border shadow-card">
        <CardContent class="py-2">
          <Accordion type="multiple" class="[&>*:last-child]:border-b-0">
            <AccordionItem value="q0">
              <AccordionTrigger class="text-left text-base">
                What is Software Composition Analysis (SCA)?
              </AccordionTrigger>
              <AccordionContent class="text-muted-foreground">
                Software Composition Analysis finds the open source components
                in your project, then reports their known vulnerabilities and
                licences.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q1">
              <AccordionTrigger class="text-left text-base">
                Does SCA find non-disclosed vulnerabilities?
              </AccordionTrigger>
              <AccordionContent class="text-muted-foreground">
                No, SCA is a process that relies on the disclosure of
                vulnerabilities in order to identify affected components within
                your project.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger class="text-left text-base">
                Where can I upload/import my projects?
              </AccordionTrigger>
              <AccordionContent class="text-muted-foreground">
                In order to import your projects you must add a Github or Gitlab
                integration. After that you can import any of your, or your
                orgranizations' projects.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger class="text-left text-base">
                Can I upload/import projects that are not stored in a Versions
                Control System?
              </AccordionTrigger>
              <AccordionContent class="text-muted-foreground">
                No, you cannot. We only support the upload/import of source code
                projects via Github or Gitlab.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger class="text-left text-base">
                What can I do, if a vulnerable component is not patchable?
              </AccordionTrigger>
              <AccordionContent class="text-muted-foreground">
                If the vulnerability poses a great risk to your application
                and/or infrastructure then remove the dependency from your
                project. You may search your package manager for a similar
                packages that provides the same or similar functionality and
                contract. You may also implement the functionality your self.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q5">
              <AccordionTrigger class="text-left text-base">
                I found an error in a vulnerability description.
              </AccordionTrigger>
              <AccordionContent class="text-muted-foreground">
                Our apologies for the inconvenience. If you wish to have this
                error rectified then please contact us via the form below, and
                make sure to select 'Vulnerability Description Correction' as
                the Subject. Provide us with the vulnerability identifier (CVE
                or other) and the error we should correct.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q6">
              <AccordionTrigger class="text-left text-base">
                A vulnerability was reported which does not affect my project.
              </AccordionTrigger>
              <AccordionContent class="text-muted-foreground">
                Our apologies for the inconvenience. If you wish to have this
                error rectified then please contact us via the form below, and
                make sure to select 'False positive report' as the Subject.
                Provide us with the approximate analysis start time, the project
                name and organization name on which the error occured.
                Additionally, provide us with the vulnerability identifier (CVE
                or other). Lastly, tell us why you believe this vulnerability
                does not affect your particular project.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q7">
              <AccordionTrigger class="text-left text-base">
                Where do you source vulnerability information?
              </AccordionTrigger>
              <AccordionContent class="text-muted-foreground">
                We integrate with both the National Vulnerability Database
                (<TextLink href="https://nvd.nist.gov/">NVD</TextLink>) and the
                Open Source Vulnerabilities Database (<TextLink
                  href="https://osv.dev/"
                  >OSV</TextLink
                >).
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </section>
    <section class="flex flex-col gap-2" aria-labelledby="contact">
      <h2 id="contact" class="text-xl font-bold text-foreground-strong">
        Contact us
      </h2>
      <p class="text-muted-foreground">TBA</p>
    </section>
  </main>
</template>
