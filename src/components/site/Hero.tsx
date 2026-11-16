import Image from "next/image";
import { Arch, Lozenge } from "./Ornaments";
import { StainedGlass } from "./StainedGlass";

interface HeroProps {
  name: string;
  kicker: string;
}

/**
 * The entrance hall. Above the doorway, the hands from Michelangelo's Creation of Adam, faded like
 * an old ceiling; through the doorway, a leaded window with light behind it.
 * The lights coming up on arrival is the page's one orchestrated motion.
 */
export function Hero({ name, kicker }: HeroProps) {
  const trimmed = name.trim();
  const isMonogram = !/\s/.test(trimmed) && trimmed.length <= 4;
  const [first, ...rest] = trimmed.split(/\s+/);
  const second = rest.join(" ");

  return (
    <section className="hero surface-walnut on-dark relative isolate flex min-h-svh flex-col overflow-hidden" aria-labelledby="hero-title">
      <div className="hero-fresco anim-lights-up" aria-hidden>
        <Image
          src="/fresco/creation-hands.jpg"
          alt=""
          fill
          preload
          sizes="100vw"
          quality={75}
          className="object-cover object-[50%_40%]"
        />
      </div>
      <div className="hero-glow anim-lights-up" aria-hidden />

      <div className="hero-window anim-lights-up hidden sm:block" aria-hidden>
        <StainedGlass className="h-full w-full" />
      </div>
      <div className="hero-window hero-window-tall anim-lights-up sm:hidden" aria-hidden>
        <StainedGlass tall className="h-full w-full" />
      </div>
      <div className="hero-veil" aria-hidden />
      <Arch hollow className="hero-arch anim-lights-up hidden sm:block" />
      <Arch hollow tall className="hero-arch hero-arch-tall anim-lights-up sm:hidden" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-end px-6 pt-[calc(var(--nav-h)+2rem)] pb-6 text-center sm:pb-8">
        <p className="anim-rise font-display text-[1.1rem] italic text-gold-pale sm:text-[1.25rem]" style={{ animationDelay: "700ms" }}>
          {kicker}
        </p>

        {isMonogram ? (
          <h1 id="hero-title" className="hero-monogram mt-5 font-display font-light text-ivory" aria-label={trimmed}>
            {[...trimmed].map((ch, i) => (
              <span key={i} className={i % 2 ? "hero-monogram-alt" : undefined} aria-hidden>
                {ch}
              </span>
            ))}
          </h1>
        ) : (
          <h1 id="hero-title" className="hero-name mt-7 font-display font-light text-ivory">
            <span className="block">{first}</span>
            {second ? <span className="hero-name-second block">{second}</span> : null}
          </h1>
        )}

        <Lozenge className="anim-rise mt-7 text-gold-light/80" />
      </div>

      <a
        href="#collection"
        className="anim-rise relative z-10 mx-auto mb-8 flex flex-col items-center gap-3 px-4 py-2 font-display text-[1.1rem] italic text-gold-pale transition-colors hover:text-ivory sm:mb-10"
        style={{ animationDelay: "1600ms" }}
      >
        Enter the gallery
        <span className="anim-cue block h-10 w-px bg-gradient-to-b from-gold-light to-transparent" aria-hidden />
      </a>
    </section>
  );
}
