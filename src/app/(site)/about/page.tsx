import type { Metadata } from "next";
import { aboutHeading, aboutText } from "@/content/about";

export const metadata: Metadata = {
  title: "About",
  description: "A short background on the artist.",
};

export default function AboutPage() {
  const paragraphs = aboutText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article className="about-page mx-auto flex min-h-svh max-w-[36rem] flex-col justify-center px-6 pt-[calc(var(--nav-h)+5rem)] pb-32">
      <h1 className="font-display text-[2.8rem] leading-none font-light text-ivory sm:text-[3.4rem]">{aboutHeading}</h1>
      <div className="mt-10 space-y-6">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-[1.16rem] leading-[1.8] text-wall-text/88 sm:text-[1.22rem]">
            {p}
          </p>
        ))}
      </div>
    </article>
  );
}
