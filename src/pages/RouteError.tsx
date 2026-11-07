import { Link, isRouteErrorResponse, useRouteError } from 'react-router';
import { Logo } from '../components/ui/Logo';

/** Last-resort error boundary: shown when a page crashes or a lazy chunk fails to load. */
export default function RouteError() {
  const error = useRouteError();
  const chunkFailed = error instanceof Error && /dynamically imported module|Loading chunk|Importing a module script failed/i.test(error.message);
  const status = isRouteErrorResponse(error) ? error.status : null;
  if (import.meta.env.DEV) console.error(error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-6 text-center text-white">
      <Logo size={40} />
      <h1 className="font-display text-2xl font-bold">
        {chunkFailed ? 'Une nouvelle version est disponible' : status === 404 ? 'Page introuvable' : 'Une erreur est survenue'}
      </h1>
      <p className="max-w-md text-sm text-white/60">
        {chunkFailed
          ? "L'application a été mise à jour. Rechargez la page pour continuer."
          : "Nous n'avons pas pu afficher cette page. Réessayez ; si le problème persiste, revenez plus tard."}
      </p>
      <div className="flex gap-3">
        <button onClick={() => window.location.reload()} className="rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-black cursor-pointer">
          Recharger
        </button>
        <Link to="/" className="rounded-lg border border-white/10 px-4 py-2 text-sm">
          Accueil
        </Link>
      </div>
    </div>
  );
}
