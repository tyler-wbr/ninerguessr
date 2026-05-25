import NinerGuessrLogo from "@/components/NinerGuessrLogo";

export default function SiteFooter() {
  return (
    <footer className="border-t-4 border-niner-gold bg-niner-green text-niner-white/80 text-xs py-5">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
        <NinerGuessrLogo variant="horizontal" className="h-6 sm:h-7" linked={false} />
        <p>
          Not affiliated with UNC Charlotte. Tiles &copy;{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            className="underline decoration-niner-gold/60 hover:text-niner-gold"
          >
            OpenStreetMap
          </a>{" "}
          contributors.
        </p>
      </div>
    </footer>
  );
}
