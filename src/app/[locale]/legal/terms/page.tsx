import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for VibeCart - Video-native e-commerce platform for Moroccan sellers',
};

export default async function TermsPage() {
  const t = await getTranslations('legal.terms');

  return (
    <div className="prose prose-zinc prose-invert max-w-none">
      {/* Header */}
      <header className="mb-10 border-b border-zinc-800 pb-8">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {t('title')}
        </h1>
        <p className="text-sm text-zinc-500">
          {t('lastUpdated', { date: 'March 5, 2026' })}
        </p>
      </header>

      {/* Introduction */}
      <section className="mb-8">
        <p className="text-lg leading-relaxed text-zinc-300">
          {t('introduction')}
        </p>
      </section>

      {/* Section 1: Platform Overview */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.platform.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.platform.description')}
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>{t('sections.platform.bullet1')}</li>
            <li>{t('sections.platform.bullet2')}</li>
            <li>{t('sections.platform.bullet3')}</li>
          </ul>
        </div>
      </section>

      {/* Section 2: Seller Responsibilities */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.sellerResponsibilities.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.sellerResponsibilities.intro')}
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>{t('sections.sellerResponsibilities.bullet1')}</li>
            <li>{t('sections.sellerResponsibilities.bullet2')}</li>
            <li>{t('sections.sellerResponsibilities.bullet3')}</li>
            <li>{t('sections.sellerResponsibilities.bullet4')}</li>
            <li>{t('sections.sellerResponsibilities.bullet5')}</li>
            <li>{t('sections.sellerResponsibilities.bullet6')}</li>
          </ul>
        </div>
      </section>

      {/* Section 3: Payment Model */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.payment.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.payment.intro')}
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>{t('sections.payment.bullet1')}</li>
            <li>{t('sections.payment.bullet2')}</li>
            <li>{t('sections.payment.bullet3')}</li>
            <li>{t('sections.payment.bullet4')}</li>
          </ul>
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-200">
              {t('sections.payment.note')}
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: WhatsApp/Instagram Integration */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.integration.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.integration.intro')}
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>{t('sections.integration.bullet1')}</li>
            <li>{t('sections.integration.bullet2')}</li>
            <li>{t('sections.integration.bullet3')}</li>
            <li>{t('sections.integration.bullet4')}</li>
          </ul>
        </div>
      </section>

      {/* Section 5: User-Generated Content */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.content.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.content.intro')}
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>{t('sections.content.bullet1')}</li>
            <li>{t('sections.content.bullet2')}</li>
            <li>{t('sections.content.bullet3')}</li>
            <li>{t('sections.content.bullet4')}</li>
          </ul>
        </div>
      </section>

      {/* Section 6: Account Termination */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.termination.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.termination.intro')}
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>{t('sections.termination.bullet1')}</li>
            <li>{t('sections.termination.bullet2')}</li>
            <li>{t('sections.termination.bullet3')}</li>
            <li>{t('sections.termination.bullet4')}</li>
            <li>{t('sections.termination.bullet5')}</li>
          </ul>
          <p>
            {t('sections.termination.notice')}
          </p>
        </div>
      </section>

      {/* Section 7: Limitation of Liability */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.liability.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.liability.text1')}
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>{t('sections.liability.bullet1')}</li>
            <li>{t('sections.liability.bullet2')}</li>
            <li>{t('sections.liability.bullet3')}</li>
            <li>{t('sections.liability.bullet4')}</li>
          </ul>
        </div>
      </section>

      {/* Section 8: Governing Law */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.governingLaw.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.governingLaw.text1')}
          </p>
          <p>
            {t('sections.governingLaw.text2')}
          </p>
        </div>
      </section>

      {/* Section 9: Changes to Terms */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.changes.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.changes.text1')}
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-zinc-800 pt-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.contact.title')}
        </h2>
        <p className="text-zinc-300">
          {t('sections.contact.text1')}{" "}
          <a
            href="mailto:legal@vibecart.ma"
            className="text-primary-400 hover:text-primary-300"
          >
            legal@vibecart.ma
          </a>
        </p>
      </section>
    </div>
  );
}
