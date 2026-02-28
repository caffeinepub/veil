export default function Footer() {
  const year = new Date().getFullYear();
  const appId = encodeURIComponent(window.location.hostname || 'veil-app');

  return (
    <footer className="border-t border-border bg-background py-6 mt-auto">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>© {year} Veil — a safe space for honest expression</span>
        <span>
          Built with{' '}
          <span className="text-accent" aria-label="love">♥</span>
          {' '}using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </span>
      </div>
    </footer>
  );
}
