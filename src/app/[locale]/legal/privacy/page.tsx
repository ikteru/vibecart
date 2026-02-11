import { Metadata } from 'next';

// t('legal.privacy.metadata.title')
// t('legal.privacy.metadata.description')
export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for VibeCart - CNDP compliant data protection for Moroccan sellers',
};

export default function PrivacyPage() {
  const lastUpdated = 'February 11, 2026';

  return (
    <div className="prose prose-zinc prose-invert max-w-none">
      {/* Header */}
      <header className="mb-10 border-b border-zinc-800 pb-8">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {/* t('legal.privacy.title') */}
          Privacy Policy
        </h1>
        <p className="text-sm text-zinc-500">
          {/* t('legal.privacy.lastUpdated', { date: lastUpdated }) */}
          Last updated: {lastUpdated}
        </p>
      </header>

      {/* Introduction */}
      <section className="mb-8">
        <p className="text-lg leading-relaxed text-zinc-300">
          {/* t('legal.privacy.introduction') */}
          At VibeCart, we take your privacy seriously. This Privacy Policy explains how 
          we collect, use, store, and protect your personal data in compliance with 
          Moroccan Law 09-08 on the Protection of Personal Data (CNDP regulations).
        </p>
      </section>

      {/* CNDP Compliance Notice */}
      <section className="mb-8">
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
          <h2 className="mb-2 text-lg font-semibold text-green-200">
            {/* t('legal.privacy.cndp.title') */}
            CNDP Compliance Notice
          </h2>
          <p className="text-sm text-green-100">
            {/* t('legal.privacy.cndp.description') */}
            VibeCart is committed to protecting your personal data in accordance with 
            Law 09-08 and the regulations of the National Commission for the Control 
            of Personal Data Protection (CNDP) in Morocco.
          </p>
        </div>
      </section>

      {/* Section 1: Data Controller */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.privacy.sections.controller.title') */}
          1. Data Controller
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.privacy.sections.controller.text1') */}
            VibeCart SARL operates as the data controller for personal data processed 
            through our platform. Our registered office is in Morocco.
          </p>
          <p>
            {/* t('legal.privacy.sections.controller.contact') */}
            <strong>Data Protection Contact:</strong>{" "}
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
          {/* t('legal.privacy.sections.dataCollected.title') */}
          2. Personal Data We Collect
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.privacy.sections.dataCollected.intro') */}
            We collect the following categories of personal data:
          </p>
          
          <h3 className="text-lg font-medium text-white">
            {/* t('legal.privacy.sections.dataCollected.seller.title') */}
            For Sellers:
          </h3>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              {/* t('legal.privacy.sections.dataCollected.seller.bullet1') */}
              <strong>Identity:</strong> Full name, business name, shop handle
            </li>
            <li>
              {/* t('legal.privacy.sections.dataCollected.seller.bullet2') */}
              <strong>Contact:</strong> Phone number, email address, WhatsApp number
            </li>
            <li>
              {/* t('legal.privacy.sections.dataCollected.seller.bullet3') */}
              <strong>Business:</strong> Business address, tax identification (ICE/IF)
            </li>
            <li>
              {/* t('legal.privacy.sections.dataCollected.seller.bullet4') */}
              <strong>Content:</strong> Product videos, images, descriptions, and shop branding
            </li>
            <li>
              {/* t('legal.privacy.sections.dataCollected.seller.bullet5') */}
              <strong>Account:</strong> Login credentials, IP address, device information
            </li>
          </ul>

          <h3 className="mt-6 text-lg font-medium text-white">
            {/* t('legal.privacy.sections.dataCollected.customer.title') */}
            For Customers (via WhatsApp Orders):
          </h3>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              {/* t('legal.privacy.sections.dataCollected.customer.bullet1') */}
              <strong>Contact:</strong> Name, phone number, WhatsApp messages
            </li>
            <li>
              {/* t('legal.privacy.sections.dataCollected.customer.bullet2') */}
              <strong>Delivery:</strong> Shipping address, city, postal code
            </li>
            <li>
              {/* t('legal.privacy.sections.dataCollected.customer.bullet3') */}
              <strong>Order:</strong> Product selections, order history, preferences
            </li>
          </ul>
        </div>
      </section>

      {/* Section 3: How We Use Data */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.privacy.sections.usage.title') */}
          3. How We Use Your Data
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.privacy.sections.usage.intro') */}
            We process your personal data for the following purposes:
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              {/* t('legal.privacy.sections.usage.bullet1') */}
              Providing and maintaining the VibeCart platform
            </li>
            <li>
              {/* t('legal.privacy.sections.usage.bullet2') */}
              Processing and managing orders between sellers and customers
            </li>
            <li>
              {/* t('legal.privacy.sections.usage.bullet3') */}
              Sending order notifications via WhatsApp Business API
            </li>
            <li>
              {/* t('legal.privacy.sections.usage.bullet4') */}
              Authenticating users and securing accounts
            </li>
            <li>
              {/* t('legal.privacy.sections.usage.bullet5') */}
              Improving platform functionality and user experience
            </li>
            <li>
              {/* t('legal.privacy.sections.usage.bullet6') */}
              Complying with legal obligations and regulatory requirements
            </li>
            <li>
              {/* t('legal.privacy.sections.usage.bullet7') */}
              Preventing fraud and ensuring platform security
            </li>
          </ul>
        </div>
      </section>

      {/* Section 4: Data Storage */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.privacy.sections.storage.title') */}
          4. Data Storage and Security
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.privacy.sections.storage.intro') */}
            We store your data securely using industry-standard practices:
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              {/* t('legal.privacy.sections.storage.bullet1') */}
              Data is stored on Supabase infrastructure with encryption at rest and in transit
            </li>
            <li>
              {/* t('legal.privacy.sections.storage.bullet2') */}
              Servers are located in regions compliant with Moroccan data protection requirements
            </li>
            <li>
              {/* t('legal.privacy.sections.storage.bullet3') */}
              Access is restricted to authorized personnel only
            </li>
            <li>
              {/* t('legal.privacy.sections.storage.bullet4') */}
              Regular security audits and vulnerability assessments
            </li>
          </ul>
        </div>
      </section>

      {/* Section 5: WhatsApp Business API */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.privacy.sections.whatsapp.title') */}
          5. WhatsApp Business API Data Sharing
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.privacy.sections.whatsapp.intro') */}
            VibeCart uses WhatsApp Business API to facilitate communication:
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              {/* t('legal.privacy.sections.whatsapp.bullet1') */}
              Customer phone numbers are shared with WhatsApp for message delivery
            </li>
            <li>
              {/* t('legal.privacy.sections.whatsapp.bullet2') */}
              Order details are transmitted to generate order confirmation messages
            </li>
            <li>
              {/* t('legal.privacy.sections.whatsapp.bullet3') */}
              WhatsApp processes data according to their Privacy Policy
            </li>
            <li>
              {/* t('legal.privacy.sections.whatsapp.bullet4') */}
              Customers can opt-out of WhatsApp communications at any time
            </li>
          </ul>
          <p>
            {/* t('legal.privacy.sections.whatsapp.note') */}
            For more information, please review{" "}
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
          {/* t('legal.privacy.sections.rights.title') */}
          6. Your Data Protection Rights
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.privacy.sections.rights.intro') */}
            Under Moroccan Law 09-08 and CNDP regulations, you have the following rights:
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              {/* t('legal.privacy.sections.rights.bullet1') */}
              <strong>Right of Access:</strong> Request a copy of your personal data
            </li>
            <li>
              {/* t('legal.privacy.sections.rights.bullet2') */}
              <strong>Right of Rectification:</strong> Correct inaccurate or incomplete data
            </li>
            <li>
              {/* t('legal.privacy.sections.rights.bullet3') */}
              <strong>Right to Erasure:</strong> Request deletion of your personal data
            </li>
            <li>
              {/* t('legal.privacy.sections.rights.bullet4') */}
              <strong>Right to Restriction:</strong> Limit how we process your data
            </li>
            <li>
              {/* t('legal.privacy.sections.rights.bullet5') */}
              <strong>Right to Object:</strong> Object to certain types of processing
            </li>
            <li>
              {/* t('legal.privacy.sections.rights.bullet6') */}
              <strong>Right to Portability:</strong> Receive your data in a structured format
            </li>
          </ul>
          <p className="mt-4">
            {/* t('legal.privacy.sections.rights.exercise') */}
            To exercise your rights, contact us at:{" "}
            <a 
              href="mailto:privacy@vibecart.ma" 
              className="text-primary-400 hover:text-primary-300"
            >
              privacy@vibecart.ma
            </a>
            {" "}or submit a request through your account settings.
          </p>
        </div>
      </section>

      {/* Section 7: Data Retention */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.privacy.sections.retention.title') */}
          7. Data Retention Policy
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.privacy.sections.retention.intro') */}
            We retain your personal data for the following periods:
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              {/* t('legal.privacy.sections.retention.bullet1') */}
              <strong>Account Data:</strong> Retained while your account is active; deleted 
              within 30 days of account closure (unless legal obligations require longer retention)
            </li>
            <li>
              {/* t('legal.privacy.sections.retention.bullet2') */}
              <strong>Order Data:</strong> Retained for 10 years to comply with Moroccan 
              tax and commercial law
            </li>
            <li>
              {/* t('legal.privacy.sections.retention.bullet3') */}
              <strong>WhatsApp Messages:</strong> Retained for 90 days, then automatically deleted
            </li>
            <li>
              {/* t('legal.privacy.sections.retention.bullet4') */}
              <strong>Analytics Data:</strong> Anonymized after 12 months
            </li>
          </ul>
        </div>
      </section>

      {/* Section 8: Data Sharing */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.privacy.sections.sharing.title') */}
          8. Data Sharing and Third Parties
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.privacy.sections.sharing.intro') */}
            We share your data only in the following circumstances:
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              {/* t('legal.privacy.sections.sharing.bullet1') */}
              <strong>With Sellers/Customers:</strong> Necessary order information is shared 
              to complete transactions
            </li>
            <li>
              {/* t('legal.privacy.sections.sharing.bullet2') */}
              <strong>Service Providers:</strong> Supabase (hosting), WhatsApp (messaging), 
              and other essential service providers
            </li>
            <li>
              {/* t('legal.privacy.sections.sharing.bullet3') */}
              <strong>Legal Requirements:</strong> When required by Moroccan law or court orders
            </li>
            <li>
              {/* t('legal.privacy.sections.sharing.bullet4') */}
              <strong>Business Transfers:</strong> In case of merger, acquisition, or sale 
              (with notice to users)
            </li>
          </ul>
          <p>
            {/* t('legal.privacy.sections.sharing.note') */}
            We do not sell your personal data to third parties for marketing purposes.
          </p>
        </div>
      </section>

      {/* Section 9: Cookies */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.privacy.sections.cookies.title') */}
          9. Cookies and Tracking
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.privacy.sections.cookies.text1') */}
            We use cookies and similar technologies to enhance your experience. 
            For detailed information, please see our{" "}
            <a 
              href="cookies" 
              className="text-primary-400 hover:text-primary-300"
            >
              Cookie Policy
            </a>.
          </p>
        </div>
      </section>

      {/* Section 10: International Transfers */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.privacy.sections.transfers.title') */}
          10. International Data Transfers
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.privacy.sections.transfers.text1') */}
            While our primary operations are in Morocco, some data may be processed 
            by service providers in other countries. We ensure adequate protection 
            through standard contractual clauses and by selecting providers with 
            strong data protection commitments.
          </p>
        </div>
      </section>

      {/* Section 11: Complaints */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.privacy.sections.complaints.title') */}
          11. Filing a Complaint
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.privacy.sections.complaints.text1') */}
            If you believe your data protection rights have been violated, you have 
            the right to file a complaint with:
          </p>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <p className="mb-2 font-medium text-white">
              {/* t('legal.privacy.sections.complaints.cndp') */}
              National Commission for the Control of Personal Data Protection (CNDP)
            </p>
            <p className="text-sm text-zinc-400">
              {/* t('legal.privacy.sections.complaints.address') */}
              5, Angle Allal El Fassi & Rue Arzez, Souissi, Rabat, Morocco<br />
              Website: www.cndp.ma<br />
              Email: contact@cndp.ma
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-zinc-800 pt-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.privacy.sections.contact.title') */}
          Contact Us
        </h2>
        <p className="text-zinc-300">
          {/* t('legal.privacy.sections.contact.text1') */}
          For privacy-related inquiries or to exercise your data protection rights, 
          please contact our Data Protection Officer:
        </p>
        <div className="mt-4 space-y-2 text-zinc-300">
          <p>
            <strong>Email:</strong>{" "}
            <a 
              href="mailto:dpo@vibecart.ma" 
              className="text-primary-400 hover:text-primary-300"
            >
              dpo@vibecart.ma
            </a>
          </p>
          <p>
            <strong>Address:</strong> VibeCart SARL, Morocco
          </p>
        </div>
      </section>
    </div>
  );
}
