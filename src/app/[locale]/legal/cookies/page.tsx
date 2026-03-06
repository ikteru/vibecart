import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Cookie Policy for VibeCart - Understanding how we use cookies on our platform',
};

export default async function CookiesPage() {
  const t = await getTranslations('legal.cookies');

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

      {/* Section 1: What are Cookies */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.whatAre.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>{t('sections.whatAre.text1')}</p>
          <p>{t('sections.whatAre.text2')}</p>
        </div>
      </section>

      {/* Section 2: How We Use Cookies */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.howWeUse.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>{t('sections.howWeUse.intro')}</p>
          <ul className="ms-6 list-disc space-y-2">
            <li>{t('sections.howWeUse.bullet1')}</li>
            <li>{t('sections.howWeUse.bullet2')}</li>
            <li>{t('sections.howWeUse.bullet3')}</li>
            <li>{t('sections.howWeUse.bullet4')}</li>
          </ul>
        </div>
      </section>

      {/* Section 3: Types of Cookies */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.types.title')}
        </h2>

        {/* Essential Cookies */}
        <div className="mb-6 rounded-xl border border-zinc-700 bg-zinc-800/50 p-6">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-xs text-green-400">
              {t('sections.types.essential.badge')}
            </span>
            {t('sections.types.essential.title')}
          </h3>
          <p className="mb-3 text-zinc-300">
            {t('sections.types.essential.description')}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="py-2 text-start text-zinc-400">
                    {t('sections.types.table.cookieName')}
                  </th>
                  <th className="py-2 text-start text-zinc-400">
                    {t('sections.types.table.purpose')}
                  </th>
                  <th className="py-2 text-start text-zinc-400">
                    {t('sections.types.table.duration')}
                  </th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                <tr className="border-b border-zinc-800">
                  <td className="py-2 font-mono text-xs">{t('sections.types.essential.cookies.accessToken.name')}</td>
                  <td className="py-2">{t('sections.types.essential.cookies.accessToken.purpose')}</td>
                  <td className="py-2">{t('sections.types.essential.cookies.accessToken.duration')}</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="py-2 font-mono text-xs">{t('sections.types.essential.cookies.refreshToken.name')}</td>
                  <td className="py-2">{t('sections.types.essential.cookies.refreshToken.purpose')}</td>
                  <td className="py-2">{t('sections.types.essential.cookies.refreshToken.duration')}</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="py-2 font-mono text-xs">{t('sections.types.essential.cookies.locale.name')}</td>
                  <td className="py-2">{t('sections.types.essential.cookies.locale.purpose')}</td>
                  <td className="py-2">{t('sections.types.essential.cookies.locale.duration')}</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-xs">{t('sections.types.essential.cookies.theme.name')}</td>
                  <td className="py-2">{t('sections.types.essential.cookies.theme.purpose')}</td>
                  <td className="py-2">{t('sections.types.essential.cookies.theme.duration')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Cookies */}
        <div className="mb-6 rounded-xl border border-zinc-700 bg-zinc-800/50 p-6">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs text-amber-400">
              {t('sections.types.analytics.badge')}
            </span>
            {t('sections.types.analytics.title')}
          </h3>
          <p className="mb-3 text-zinc-300">
            {t('sections.types.analytics.description')}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="py-2 text-start text-zinc-400">
                    {t('sections.types.table.cookieName')}
                  </th>
                  <th className="py-2 text-start text-zinc-400">
                    {t('sections.types.table.purpose')}
                  </th>
                  <th className="py-2 text-start text-zinc-400">
                    {t('sections.types.table.duration')}
                  </th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                <tr className="border-b border-zinc-800">
                  <td className="py-2 font-mono text-xs">{t('sections.types.analytics.cookies.session.name')}</td>
                  <td className="py-2">{t('sections.types.analytics.cookies.session.purpose')}</td>
                  <td className="py-2">{t('sections.types.analytics.cookies.session.duration')}</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="py-2 font-mono text-xs">{t('sections.types.analytics.cookies.visitor.name')}</td>
                  <td className="py-2">{t('sections.types.analytics.cookies.visitor.purpose')}</td>
                  <td className="py-2">{t('sections.types.analytics.cookies.visitor.duration')}</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-xs">{t('sections.types.analytics.cookies.events.name')}</td>
                  <td className="py-2">{t('sections.types.analytics.cookies.events.purpose')}</td>
                  <td className="py-2">{t('sections.types.analytics.cookies.events.duration')}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
            <p className="text-sm text-amber-200">
              {t('sections.types.analytics.note')}
            </p>
          </div>
        </div>

        {/* Functionality Cookies */}
        <div className="mb-6 rounded-xl border border-zinc-700 bg-zinc-800/50 p-6">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-xs text-blue-400">
              {t('sections.types.functionality.badge')}
            </span>
            {t('sections.types.functionality.title')}
          </h3>
          <p className="mb-3 text-zinc-300">
            {t('sections.types.functionality.description')}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="py-2 text-start text-zinc-400">
                    {t('sections.types.table.cookieName')}
                  </th>
                  <th className="py-2 text-start text-zinc-400">
                    {t('sections.types.table.purpose')}
                  </th>
                  <th className="py-2 text-start text-zinc-400">
                    {t('sections.types.table.duration')}
                  </th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                <tr className="border-b border-zinc-800">
                  <td className="py-2 font-mono text-xs">{t('sections.types.functionality.cookies.preferences.name')}</td>
                  <td className="py-2">{t('sections.types.functionality.cookies.preferences.purpose')}</td>
                  <td className="py-2">{t('sections.types.functionality.cookies.preferences.duration')}</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-xs">{t('sections.types.functionality.cookies.recentViews.name')}</td>
                  <td className="py-2">{t('sections.types.functionality.cookies.recentViews.purpose')}</td>
                  <td className="py-2">{t('sections.types.functionality.cookies.recentViews.duration')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 4: Third-Party Cookies */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.thirdParty.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>{t('sections.thirdParty.intro')}</p>
          <ul className="ms-6 list-disc space-y-2">
            <li>{t('sections.thirdParty.bullet1')}</li>
            <li>{t('sections.thirdParty.bullet2')}</li>
            <li>{t('sections.thirdParty.bullet3')}</li>
          </ul>
          <p>{t('sections.thirdParty.note')}</p>
        </div>
      </section>

      {/* Section 5: Cookie Management */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.management.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>{t('sections.management.intro')}</p>

          <h3 className="mt-6 text-lg font-medium text-white">
            {t('sections.management.browser.title')}
          </h3>
          <p>{t('sections.management.browser.text1')}</p>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              <a
                href="https://support.google.com/chrome/answer/95647"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300"
              >
                Google Chrome
              </a>
            </li>
            <li>
              <a
                href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300"
              >
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a
                href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300"
              >
                Safari
              </a>
            </li>
            <li>
              <a
                href="https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300"
              >
                Microsoft Edge
              </a>
            </li>
          </ul>

          <h3 className="mt-6 text-lg font-medium text-white">
            {t('sections.management.consequences.title')}
          </h3>
          <p>{t('sections.management.consequences.text1')}</p>
          <ul className="ms-6 list-disc space-y-2">
            <li>{t('sections.management.consequences.bullet1')}</li>
            <li>{t('sections.management.consequences.bullet2')}</li>
            <li>{t('sections.management.consequences.bullet3')}</li>
          </ul>
        </div>
      </section>

      {/* Section 6: Cookie Consent */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.consent.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>{t('sections.consent.text1')}</p>
          <p>{t('sections.consent.text2')}</p>
        </div>
      </section>

      {/* Section 7: Updates to Policy */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {t('sections.updates.title')}
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>{t('sections.updates.text1')}</p>
          <p>{t('sections.updates.text2')}</p>
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
            href="mailto:privacy@vibecart.ma"
            className="text-primary-400 hover:text-primary-300"
          >
            privacy@vibecart.ma
          </a>
        </p>
      </section>
    </div>
  );
}
