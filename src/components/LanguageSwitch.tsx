import { useI18n } from '../lib/i18n';
import { useMe, useUpdateSettings } from '../lib/queries';

export function LanguageSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  const { data: user } = useMe();
  const update = useUpdateSettings();

  const change = (l: 'fr' | 'en') => {
    setLang(l);
    if (user && user.language !== l) update.mutate({ language: l });
  };

  return (
    <div role="group" aria-label={t('Langue', 'Language')} className={`inline-flex rounded-lg border border-white/10 p-0.5 ${className}`}>
      {(['fr', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => change(l)}
          aria-pressed={lang === l}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase transition-colors cursor-pointer ${
            lang === l ? 'bg-lime text-black' : 'text-white/50 hover:text-white'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
