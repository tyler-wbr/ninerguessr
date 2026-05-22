export default function SiteFooter() {
  return (
    <footer className="border-t-4 border-niner-gold bg-niner-green text-niner-white/80 text-xs py-4 text-center">
      Niner Guessr — Not affiliated with UNC Charlotte. Tiles &copy;{" "}
      <a
        href="https://www.openstreetmap.org/copyright"
        className="underline decoration-niner-gold/60 hover:text-niner-gold"
      >
        OpenStreetMap
      </a>{" "}
      contributors.
    </footer>
  );
}
