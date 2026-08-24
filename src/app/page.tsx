"use client";

import { Hero } from "@/components/hero/hero";
import { ProjectsSection } from "@/components/projects/projects-section";
import { AboutSection } from "@/components/sections/about-section";
import { ArchiveSection } from "@/components/sections/archive-section";
import { ContactSection } from "@/components/sections/contact-section";
import { PinnedStack } from "@/components/layout/pinned-stack";

export default function Home() {
  return (
    <PinnedStack>
        <main id="main" className="relative z-10">
        <section id="index" data-pin-panel className="pin-screen">
          <Hero />
        </section>
        <section id="work" data-pin-panel className="pin-screen">
          <ProjectsSection />
        </section>
        <section id="about" data-pin-panel className="pin-screen">
          <AboutSection />
        </section>
        <section id="contact" data-pin-panel className="pin-screen">
          <ContactSection />
        </section>
        <section id="archive" data-pin-panel className="pin-screen">
          <ArchiveSection />
        </section>
      </main>
    </PinnedStack>
  );
}
