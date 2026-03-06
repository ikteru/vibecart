import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Data Deletion Instructions - VibeCart',
  description: 'How to request deletion of your data from VibeCart',
};

export default async function DataDeletionPage() {
  const t = await getTranslations('legal.dataDeletion');

  return (
    <div className="prose prose-zinc prose-invert max-w-none">
      <header className="mb-10 border-b border-zinc-800 pb-8">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {t('title')}
        </h1>
        <p className="text-sm text-zinc-500">
          {t('lastUpdated', { date: 'March 5, 2026' })}
        </p>
      </header>

      <section className="mb-8">
        <p className="text-lg leading-relaxed text-zinc-300">
          {t('introduction')}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white">{t('option1.title')}</h2>
        <p className="text-zinc-300">
          {t('option1.description')}
        </p>
        <ol className="list-decimal space-y-2 text-zinc-300 ps-6">
          <li>{t('option1.step1')}</li>
          <li>{t('option1.step2')}</li>
          <li>{t('option1.step3')}</li>
          <li>{t('option1.step4')}</li>
        </ol>
        <p className="text-zinc-400 text-sm mt-2">
          {t('option1.note')}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white">{t('option2.title')}</h2>
        <p className="text-zinc-300">
          {t('option2.description')}
        </p>
        <ul className="list-disc space-y-2 text-zinc-300 ps-6">
          <li>{t('option2.bullet1')}</li>
          <li>{t('option2.bullet2')}</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white">{t('whatWeDelete.title')}</h2>
        <p className="text-zinc-300">
          {t('whatWeDelete.description')}
        </p>
        <ul className="list-disc space-y-2 text-zinc-300 ps-6">
          <li>{t('whatWeDelete.bullet1')}</li>
          <li>{t('whatWeDelete.bullet2')}</li>
          <li>{t('whatWeDelete.bullet3')}</li>
          <li>{t('whatWeDelete.bullet4')}</li>
          <li>{t('whatWeDelete.bullet5')}</li>
        </ul>
        <p className="text-zinc-400 text-sm mt-2">
          {t('whatWeDelete.note')}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white">{t('processingTime.title')}</h2>
        <p className="text-zinc-300">
          {t('processingTime.description')}
        </p>
      </section>
    </div>
  );
}
