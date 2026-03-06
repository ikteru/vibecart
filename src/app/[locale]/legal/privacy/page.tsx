import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for VibeCart - CNDP compliant data protection for Moroccan sellers',
};

export default async function PrivacyPage() {
  const t = await getTranslations('legal.privacy');

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

      {/* CNDP Compliance Notice */}
      <section className="mb-8">
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
          <h2 className="mb-2 text-lg font-semibold text-green-200">
            {t('cndp.title')}
          </h2>
          <p className="text-sm text-green-100">
            {t('cndp.description')}
          </p>
        </div>
      </section>

      {/* Section 1: Data Controller */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.controller.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.controller.text1')}
          </p>
          <p>
            {t('sections.controller.contact')}{" "}
            <a
              href="mailto:dpo@vibecart.ma"
              className="text-primary-400 hover:text-primary-300"
            >
              dpo@vibecart.ma
            </a>
          </p>
        </div>
      </section>

      {/* Section 2: Data We Collect */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.dataCollected.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.dataCollected.intro')}
          </p>

          <h3 className="text-lg font-medium text-white">
            {t('sections.dataCollected.seller.title')}
          </h3>
          <ul className="ms-6 list-disc space-y-2">
            <li>{t('sections.dataCollected.seller.bullet1')}</li>
            <li>{t('sections.dataCollected.seller.bullet2')}</li>
            <li>{t('sections.dataCollected.seller.bullet3')}</li>
            <li>{t('sections.dataCollected.seller.bullet4')}</li>
            <li>{t('sections.dataCollected.seller.bullet5')}</li>
          </ul>

          <h3 className="mt-6 text-lg font-medium text-white">
            {t('sections.dataCollected.customer.title')}
          </h3>
          <ul className="ms-6 list-disc space-y-2">
            <li>{t('sections.dataCollected.customer.bullet1')}</li>
            <li>{t('sections.dataCollected.customer.bullet2')}</li>
            <li>{t('sections.dataCollected.customer.bullet3')}</li>
          </ul>
        </div>
      </section>

      {/* Section 3: How We Use Data */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.usage.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.usage.intro')}
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>{t('sections.usage.bullet1')}</li>
            <li>{t('sections.usage.bullet2')}</li>
            <li>{t('sections.usage.bullet3')}</li>
            <li>{t('sections.usage.bullet4')}</li>
            <li>{t('sections.usage.bullet5')}</li>
            <li>{t('sections.usage.bullet6')}</li>
            <li>{t('sections.usage.bullet7')}</li>
          </ul>
        </div>
      </section>

      {/* Section 4: Data Storage */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.storage.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.storage.intro')}
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>{t('sections.storage.bullet1')}</li>
            <li>{t('sections.storage.bullet2')}</li>
            <li>{t('sections.storage.bullet3')}</li>
            <li>{t('sections.storage.bullet4')}</li>
          </ul>
        </div>
      </section>

      {/* Section 5: WhatsApp Business API */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.whatsapp.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.whatsapp.intro')}
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>{t('sections.whatsapp.bullet1')}</li>
            <li>{t('sections.whatsapp.bullet2')}</li>
            <li>{t('sections.whatsapp.bullet3')}</li>
            <li>{t('sections.whatsapp.bullet4')}</li>
          </ul>
          <p>
            {t('sections.whatsapp.note')}{" "}
            <a
              href="https://whatsapp.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300"
            >
              WhatsApp&apos;s Privacy Policy
            </a>.
          </p>
        </div>
      </section>

      {/* Section 6: User Rights */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.rights.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.rights.intro')}
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>{t('sections.rights.bullet1')}</li>
            <li>{t('sections.rights.bullet2')}</li>
            <li>{t('sections.rights.bullet3')}</li>
            <li>{t('sections.rights.bullet4')}</li>
            <li>{t('sections.rights.bullet5')}</li>
            <li>{t('sections.rights.bullet6')}</li>
          </ul>
          <p className="mt-4">
            {t('sections.rights.exercise')}{" "}
            <a
              href="mailto:privacy@vibecart.ma"
              className="text-primary-400 hover:text-primary-300"
            >
              privacy@vibecart.ma
            </a>
          </p>
        </div>
      </section>

      {/* Section 7: Data Retention */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.retention.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.retention.intro')}
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>{t('sections.retention.bullet1')}</li>
            <li>{t('sections.retention.bullet2')}</li>
            <li>{t('sections.retention.bullet3')}</li>
            <li>{t('sections.retention.bullet4')}</li>
          </ul>
        </div>
      </section>

      {/* Section 8: Data Sharing */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.sharing.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.sharing.intro')}
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>{t('sections.sharing.bullet1')}</li>
            <li>{t('sections.sharing.bullet2')}</li>
            <li>{t('sections.sharing.bullet3')}</li>
            <li>{t('sections.sharing.bullet4')}</li>
          </ul>
          <p>
            {t('sections.sharing.note')}
          </p>
        </div>
      </section>

      {/* Section 9: Cookies */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.cookies.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.cookies.text1')}{" "}
            <a
              href="cookies"
              className="text-primary-400 hover:text-primary-300"
            >
              {t('sections.cookies.link')}
            </a>.
          </p>
        </div>
      </section>

      {/* Section 10: International Transfers */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.transfers.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.transfers.text1')}
          </p>
        </div>
      </section>

      {/* Section 11: Complaints */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.complaints.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {t('sections.complaints.text1')}
          </p>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <p className="mb-2 font-medium text-white">
              {t('sections.complaints.cndp')}
            </p>
            <p className="text-sm text-zinc-400">
              {t('sections.complaints.address')}
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-zinc-800 pt-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.contact.title')}
        </h2>
        <p className="text-zinc-300">
          {t('sections.contact.text1')}
        </p>
        <div className="mt-4 space-y-2 text-zinc-300">
          <p>
            {t('sections.contact.email')}{" "}
            <a
              href="mailto:dpo@vibecart.ma"
              className="text-primary-400 hover:text-primary-300"
            >
              dpo@vibecart.ma
            </a>
          </p>
          <p>
            {t('sections.contact.address')}
          </p>
        </div>
      </section>
    </div>
  );
}
