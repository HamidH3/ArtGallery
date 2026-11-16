import Link from "next/link";

export default function NotFound() {
  return (
    <main className="surface-walnut on-dark grid min-h-svh place-items-center px-6 text-center">
      <div className="max-w-[30rem]">
        <p className="font-display text-[1.2rem] italic text-gold-light">This room is closed</p>
        <h1 className="mt-4 font-display text-[2.8rem] leading-[1.05] font-light text-ivory">
          The page you were looking for isn&rsquo;t on view
        </h1>
        <p className="mt-6 text-[1.1rem] text-wall-text/80">
          It may have been moved or taken down. The rest of the collection is still open.
        </p>
        <Link href="/" className="closing-door mt-10">
          <span className="font-display text-[1.3rem] italic">Return to the gallery</span>
        </Link>
      </div>
    </main>
  );
}
