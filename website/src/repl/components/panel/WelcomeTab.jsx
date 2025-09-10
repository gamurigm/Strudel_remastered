import { useSettings } from '@src/settings.mjs';
import { WelcomeBeats } from './WelcomeBeats';

const { BASE_URL } = import.meta.env;
const baseNoTrailing = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

export function WelcomeTab({ context }) {
  const { fontFamily } = useSettings();
  return (
    <div className="prose dark:prose-invert min-w-full pt-2 font-sans pb-6 px-4" style={{ fontFamily }}>
      <h3>꩜ welcome</h3>
      <WelcomeBeats />
      <p className="mt-6 text-xs opacity-60">
        Más ejemplos: <a href={`${baseNoTrailing}/workshop/getting-started/`} target="_blank">tutorial</a> · Comunidad en <a href="https://discord.com/invite/HGEdXmRkzT" target="_blank">discord</a>.
      </p>
    </div>
  );
}
