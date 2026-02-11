import { Metadata } from 'next';

// t('legal.cookies.metadata.title')
// t('legal.cookies.metadata.description')
export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Cookie Policy for VibeCart - Understanding how we use cookies on our platform',
};

export default function CookiesPage() {
  const lastUpdated = 'February 11, 2026';

  return (
    <div className="prose prose-zinc prose-invert max-w-none">
      {/* Header */}
      <header className="mb-10 border-b border-zinc-800 pb-8">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {/* t('legal.cookies.title') */}
          Cookie Policy
        </h1>
        <p className="text-sm text-zinc-500">
          {/* t('legal.cookies.lastUpdated', { date: lastUpdated }) */}
          Last updated: {lastUpdated}
        </p>
      </header>

      {/* Introduction */}
      <section className="mb-8">
        <p className="text-lg leading-relaxed text-zinc-300">
          {/* t('legal.cookies.introduction') */}
          This Cookie Policy explains how VibeCart uses cookies and similar technologies 
          to recognize you when you visit our platform. It explains what these technologies 
          are and why we use them, as well as your rights to control our use of them.
        </p>
      </section>

      {/* Section 1: What are Cookies */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.cookies.sections.whatAre.title') */}
          1. What Are Cookies?
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.cookies.sections.whatAre.text1') */}
            Cookies are small data files that are placed on your computer or mobile device 
            when you visit a website. They are widely used by website owners to make their 
            websites work more efficiently and provide reporting information.
          </p>
          <p>
            {/* t('legal.cookies.sections.whatAre.text2') */}
            Cookies set by us are called &quot;first-party cookies.&quot; Cookies set by parties 
            other than us are called &quot;third-party cookies.&quot; Third-party cookies enable 
            third-party features or functionality on or through the website.
          </p>
        </div>
      </section>

      {/* Section 2: How We Use Cookies */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.cookies.sections.howWeUse.title') */}
          2. How We Use Cookies
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.cookies.sections.howWeUse.intro') */}
            We use cookies for several reasons:
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              {/* t('legal.cookies.sections.howWeUse.bullet1') */}
              To enable certain functions of the platform
            </li>
            <li>
              {/* t('legal.cookies.sections.howWeUse.bullet2') */}
              To provide analytics and understand how you interact with our platform
            </li>
            <li>
              {/* t('legal.cookies.sections.howWeUse.bullet3') */}
              To store your preferences and settings
            </li>
            <li>
              {/* t('legal.cookies.sections.howWeUse.bullet4') */}
              To improve the security of our platform
            </li>
          </ul>
        </div>
      </section>

      {/* Section 3: Types of Cookies */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.cookies.sections.types.title') */}
          3. Types of Cookies We Use
        </h2>

        {/* Essential Cookies */}
        <div className="mb-6 rounded-xl border border-zinc-700 bg-zinc-800/50 p-6">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-xs text-green-400">
              {/* t('legal.cookies.sections.types.essential.badge') */}
              1
            </span>
            {/* t('legal.cookies.sections.types.essential.title') */}
            Essential Cookies
          </h3>
          <p className="mb-3 text-zinc-300">
            {/* t('legal.cookies.sections.types.essential.description') */}
            These cookies are strictly necessary to provide you with services available 
            through our platform and to use some of its features, such as access to 
            secure areas. Without these cookies, certain services you have asked for 
            cannot be provided.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="py-2 text-start text-zinc-400">
                    {/* t('legal.cookies.sections.types.table.cookieName') */}
                    Cookie Name
                  </th>
                  <th className="py-2 text-start text-zinc-400">
                    {/* t('legal.cookies.sections.types.table.purpose') */}
                    Purpose
                  </th>
                  <th className="py-2 text-start text-zinc-400">
                    {/* t('legal.cookies.sections.types.table.duration') */}
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                <tr className="border-b border-zinc-800">
                  <td className="py-2 font-mono text-xs">sb-access-token</td>
                  <td className="py-2">Authentication session</td>
                  <td className="py-2">Session</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="py-2 font-mono text-xs">sb-refresh-token</td>
                  <td className="py-2">Refresh authentication</td>
                  <td className="py-2">7 days</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="py-2 font-mono text-xs">locale</td>
                  <td className="py-2">Language preference</td>
                  <td className="py-2">1 year</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-xs">theme</td>
                  <td className="py-2">Dark/light mode preference</td>
                  <td className="py-2">1 year</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Cookies */}
        <div className="mb-6 rounded-xl border border-zinc-700 bg-zinc-800/50 p-6">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs text-amber-400">
              {/* t('legal.cookies.sections.types.analytics.badge') */}
              2
            </span>
            {/* t('legal.cookies.sections.types.analytics.title') */}
            Analytics Cookies
          </h3>
          <p className="mb-3 text-zinc-300">
            {/* t('legal.cookies.sections.types.analytics.description') */}
            These cookies help us understand how visitors interact with our platform 
            by collecting and reporting information anonymously. This helps us improve 
            our platform and provide a better user experience.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="py-2 text-start text-zinc-400">
                    {/* t('legal.cookies.sections.types.table.cookieName') */}
                    Cookie Name
                  </th>
                  <th className="py-2 text-start text-zinc-400">
                    {/* t('legal.cookies.sections.types.table.purpose') */}
                    Purpose
                  </th>
                  <th className="py-2 text-start text-zinc-400">
                    {/* t('legal.cookies.sections.types.table.duration') */}
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                <tr className="border-b border-zinc-800">
                  <td className="py-2 font-mono text-xs">_vc_session</td>
                  <td className="py-2">Session analytics</td>
                  <td className="py-2">30 minutes</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="py-2 font-mono text-xs">_vc_visitor</td>
                  <td className="py-2">Unique visitor tracking</td>
                  <td className="py-2">1 year</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-xs">_vc_events</td>
                  <td className="py-2">Event tracking (clicks, views)</td>
                  <td className="py-2">Session</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
            <p className="text-sm text-amber-200">
              {/* t('legal.cookies.sections.types.analytics.note') */}
              <strong>Note:</strong> We currently use minimal analytics. If we implement 
              third-party analytics (such as Google Analytics), we will update this policy 
              and request your consent where required.
            </p>
          </div>
        </div>

        {/* Functionality Cookies */}
        <div className="mb-6 rounded-xl border border-zinc-700 bg-zinc-800/50 p-6">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-xs text-blue-400">
              {/* t('legal.cookies.sections.types.functionality.badge') */}
              3
            </span>
            {/* t('legal.cookies.sections.types.functionality.title') */}
            Functionality Cookies
          </h3>
          <p className="mb-3 text-zinc-300">
            {/* t('legal.cookies.sections.types.functionality.description') */}
            These cookies allow us to remember choices you make when you use our platform, 
            such as remembering your login details or language preference. They provide 
            enhanced, more personal features.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="py-2 text-start text-zinc-400">
                    {/* t('legal.cookies.sections.types.table.cookieName') */}
                    Cookie Name
                  </th>
                  <th className="py-2 text-start text-zinc-400">
                    {/* t('legal.cookies.sections.types.table.purpose') */}
                    Purpose
                  </th>
                  <th className="py-2 text-start text-zinc-400">
                    {/* t('legal.cookies.sections.types.table.duration') */}
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                <tr className="border-b border-zinc-800">
                  <td className="py-2 font-mono text-xs">vc_preferences</td>
                  <td className="py-2">User preferences</td>
                  <td className="py-2">1 year</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-xs">vc_recent_views</td>
                  <td className="py-2">Recently viewed products</td>
                  <td className="py-2">7 days</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 4: Third-Party Cookies */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.cookies.sections.thirdParty.title') */}
          4. Third-Party Cookies
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.cookies.sections.thirdParty.intro') */}
            In addition to our own cookies, we may use third-party cookies for:
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              {/* t('legal.cookies.sections.thirdParty.bullet1') */}
              <strong>Supabase:</strong> For authentication and database services
            </li>
            <li>
              {/* t('legal.cookies.sections.thirdParty.bullet2') */}
              <strong>WhatsApp:</strong> For WhatsApp Business integration (if enabled)
            </li>
            <li>
              {/* t('legal.cookies.sections.thirdParty.bullet3') */}
              <strong>Payment processors:</strong> If/when online payment features are added
            </li>
          </ul>
          <p>
            {/* t('legal.cookies.sections.thirdParty.note') */}
            These third parties may use cookies, web beacons, and similar technologies 
            to collect information about your use of our platform. We do not control 
            these third parties&apos; tracking technologies or how they may be used.
          </p>
        </div>
      </section>

      {/* Section 5: Cookie Management */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.cookies.sections.management.title') */}
          5. How to Manage Cookies
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.cookies.sections.management.intro') */}
            You have the right to decide whether to accept or reject cookies. You can 
            exercise your cookie preferences in the following ways:
          </p>
          
          <h3 className="mt-6 text-lg font-medium text-white">
            {/* t('legal.cookies.sections.management.browser.title') */}
            Browser Settings
          </h3>
          <p>
            {/* t('legal.cookies.sections.management.browser.text1') */}
            Most web browsers allow you to control cookies through their settings. 
            You can usually find these settings in the &quot;Options&quot; or &quot;Preferences&quot; 
            menu of your browser. Here are links to cookie management instructions 
            for common browsers:
          </p>
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
            {/* t('legal.cookies.sections.management.consequences.title') */}
            Consequences of Disabling Cookies
          </h3>
          <p>
            {/* t('legal.cookies.sections.management.consequences.text1') */}
            If you choose to reject cookies, you may still use our platform, but your 
            access to some functionality and areas may be restricted. Specifically:
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              {/* t('legal.cookies.sections.management.consequences.bullet1') */}
              You may not be able to log in or maintain a session
            </li>
            <li>
              {/* t('legal.cookies.sections.management.consequences.bullet2') */}
              Your language preferences may not be saved
            </li>
            <li>
              {/* t('legal.cookies.sections.management.consequences.bullet3') */}
              Some personalized features may not function properly
            </li>
          </ul>
        </div>
      </section>

      {/* Section 6: Cookie Consent */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.cookies.sections.consent.title') */}
          6. Cookie Consent
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.cookies.sections.consent.text1') */}
            When you first visit our platform, we will ask for your consent to use 
            non-essential cookies. You can change your preferences at any time by 
            clicking the cookie settings link in the footer of our website.
          </p>
          <p>
            {/* t('legal.cookies.sections.consent.text2') */}
            Essential cookies (those necessary for the platform to function) are 
            always active and cannot be disabled through our cookie preferences tool.
          </p>
        </div>
      </section>

      {/* Section 7: Updates to Policy */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.cookies.sections.updates.title') */}
          7. Updates to This Policy
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.cookies.sections.updates.text1') */}
            We may update this Cookie Policy from time to time to reflect changes 
            in the cookies we use or for other operational, legal, or regulatory 
            reasons. We will notify you of any significant changes by posting the 
            new policy on this page with an updated revision date.
          </p>
          <p>
            {/* t('legal.cookies.sections.updates.text2') */}
            We encourage you to periodically review this page for the latest 
            information on our cookie practices.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-zinc-800 pt-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.cookies.sections.contact.title') */}
          Contact Us
        </h2>
        <p className="text-zinc-300">
          {/* t('legal.cookies.sections.contact.text1') */}
          If you have any questions about our use of cookies or other technologies, 
          please contact us at:{" "}
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
