import { Metadata } from 'next';

// t('legal.terms.metadata.title')
// t('legal.terms.metadata.description')
export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for VibeCart - Video-native e-commerce platform for Moroccan sellers',
};

export default function TermsPage() {
  const lastUpdated = 'February 11, 2026';

  return (
    <div className="prose prose-zinc prose-invert max-w-none">
      {/* Header */}
      <header className="mb-10 border-b border-zinc-800 pb-8">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {/* t('legal.terms.title') */}
          Terms of Service
        </h1>
        <p className="text-sm text-zinc-500">
          {/* t('legal.terms.lastUpdated', { date: lastUpdated }) */}
          Last updated: {lastUpdated}
        </p>
      </header>

      {/* Introduction */}
      <section className="mb-8">
        <p className="text-lg leading-relaxed text-zinc-300">
          {/* t('legal.terms.introduction') */}
          Welcome to VibeCart. These Terms of Service govern your use of our video-native 
          e-commerce platform designed specifically for Moroccan sellers. By accessing or 
          using VibeCart, you agree to be bound by these terms.
        </p>
      </section>

      {/* Section 1: Platform Overview */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.terms.sections.platform.title') */}
          1. Platform Overview
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.terms.sections.platform.description') */}
            VibeCart is a video-native e-commerce platform that enables Moroccan sellers 
            to showcase and sell their products through video content. Our platform integrates 
            with WhatsApp Business API and Instagram to streamline the buying process.
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              {/* t('legal.terms.sections.platform.bullet1') */}
              The platform is specifically designed for sellers based in Morocco
            </li>
            <li>
              {/* t('legal.terms.sections.platform.bullet2') */}
              All transactions are conducted in Moroccan Dirham (MAD)
            </li>
            <li>
              {/* t('legal.terms.sections.platform.bullet3') */}
              Primary language support includes Moroccan Darija (ar-MA), Classical Arabic, 
              French, and English
            </li>
          </ul>
        </div>
      </section>

      {/* Section 2: Seller Responsibilities */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.terms.sections.sellerResponsibilities.title') */}
          2. Seller Responsibilities
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.terms.sections.sellerResponsibilities.intro') */}
            As a seller on VibeCart, you are solely responsible for:
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              {/* t('legal.terms.sections.sellerResponsibilities.bullet1') */}
              The accuracy of product descriptions, pricing, and availability
            </li>
            <li>
              {/* t('legal.terms.sections.sellerResponsibilities.bullet2') */}
              The quality, safety, and legality of products offered for sale
            </li>
            <li>
              {/* t('legal.terms.sections.sellerResponsibilities.bullet3') */}
              Order fulfillment, packaging, and shipping to customers
            </li>
            <li>
              {/* t('legal.terms.sections.sellerResponsibilities.bullet4') */}
              Compliance with all applicable Moroccan laws and regulations
            </li>
            <li>
              {/* t('legal.terms.sections.sellerResponsibilities.bullet5') */}
              Handling returns, refunds, and customer disputes
            </li>
            <li>
              {/* t('legal.terms.sections.sellerResponsibilities.bullet6') */}
              Maintaining accurate inventory records
            </li>
          </ul>
        </div>
      </section>

      {/* Section 3: Payment Model */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.terms.sections.payment.title') */}
          3. Cash on Delivery (COD) Payment Model
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.terms.sections.payment.intro') */}
            VibeCart primarily operates on a Cash on Delivery (COD) model:
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              {/* t('legal.terms.sections.payment.bullet1') */}
              Customers place orders through the platform and pay upon delivery
            </li>
            <li>
              {/* t('legal.terms.sections.payment.bullet2') */}
              Sellers are responsible for setting clear delivery expectations
            </li>
            <li>
              {/* t('legal.terms.sections.payment.bullet3') */}
              VibeCart does not process payments or hold funds on behalf of sellers
            </li>
            <li>
              {/* t('legal.terms.sections.payment.bullet4') */}
              Any payment disputes must be resolved directly between seller and customer
            </li>
          </ul>
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-200">
              {/* t('legal.terms.sections.payment.note') */}
              <strong>Note:</strong> Sellers should implement measures to minimize COD 
              order cancellations and fake orders, as these directly impact business operations.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: WhatsApp/Instagram Integration */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.terms.sections.integration.title') */}
          4. WhatsApp and Instagram Integration
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.terms.sections.integration.intro') */}
            VibeCart integrates with third-party services to enhance your selling experience:
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              {/* t('legal.terms.sections.integration.bullet1') */}
              WhatsApp Business API integration for order notifications and customer communication
            </li>
            <li>
              {/* t('legal.terms.sections.integration.bullet2') */}
              Instagram integration for importing product content and expanding reach
            </li>
            <li>
              {/* t('legal.terms.sections.integration.bullet3') */}
              You must comply with WhatsApp Business Terms and Instagram Terms of Use
            </li>
            <li>
              {/* t('legal.terms.sections.integration.bullet4') */}
              VibeCart is not responsible for changes or disruptions to third-party services
            </li>
          </ul>
        </div>
      </section>

      {/* Section 5: User-Generated Content */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.terms.sections.content.title') */}
          5. User-Generated Content
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.terms.sections.content.intro') */}
            By uploading content to VibeCart, you:
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              {/* t('legal.terms.sections.content.bullet1') */}
              Retain ownership of your original content
            </li>
            <li>
              {/* t('legal.terms.sections.content.bullet2') */}
              Grant VibeCart a non-exclusive license to display and promote your content 
              on the platform
            </li>
            <li>
              {/* t('legal.terms.sections.content.bullet3') */}
              Confirm you have the right to use any music, images, or other media in your videos
            </li>
            <li>
              {/* t('legal.terms.sections.content.bullet4') */}
              Agree not to upload content that infringes on third-party rights or violates 
              Moroccan law
            </li>
          </ul>
        </div>
      </section>

      {/* Section 6: Account Termination */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.terms.sections.termination.title') */}
          6. Account Termination
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.terms.sections.termination.intro') */}
            VibeCart reserves the right to suspend or terminate accounts for:
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              {/* t('legal.terms.sections.termination.bullet1') */}
              Violation of these Terms of Service
            </li>
            <li>
              {/* t('legal.terms.sections.termination.bullet2') */}
              Selling prohibited or illegal products
            </li>
            <li>
              {/* t('legal.terms.sections.termination.bullet3') */}
              Fraudulent activity or misrepresentation
            </li>
            <li>
              {/* t('legal.terms.sections.termination.bullet4') */}
              Consistently poor customer feedback or high dispute rates
            </li>
            <li>
              {/* t('legal.terms.sections.termination.bullet5') */}
              Extended periods of inactivity (12+ months)
            </li>
          </ul>
          <p>
            {/* t('legal.terms.sections.termination.notice') */}
            Where possible, we will provide notice before termination and an opportunity 
            to address violations.
          </p>
        </div>
      </section>

      {/* Section 7: Limitation of Liability */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.terms.sections.liability.title') */}
          7. Limitation of Liability
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.terms.sections.liability.text1') */}
            VibeCart provides the platform &quot;as is&quot; and does not guarantee continuous, 
            uninterrupted access. We are not liable for:
          </p>
          <ul className="ms-6 list-disc space-y-2">
            <li>
              {/* t('legal.terms.sections.liability.bullet1') */}
              Disputes between sellers and customers
            </li>
            <li>
              {/* t('legal.terms.sections.liability.bullet2') */}
              Product quality, safety, or delivery issues
            </li>
            <li>
              {/* t('legal.terms.sections.liability.bullet3') */}
              Loss of business or revenue
            </li>
            <li>
              {/* t('legal.terms.sections.liability.bullet4') */}
              Technical issues beyond our reasonable control
            </li>
          </ul>
        </div>
      </section>

      {/* Section 8: Governing Law */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.terms.sections.governingLaw.title') */}
          8. Governing Law
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.terms.sections.governingLaw.text1') */}
            These Terms of Service are governed by and construed in accordance with the 
            laws of the Kingdom of Morocco. Any disputes arising from these terms shall 
            be subject to the exclusive jurisdiction of the courts of Morocco.
          </p>
          <p>
            {/* t('legal.terms.sections.governingLaw.text2') */}
            For sellers operating outside Morocco, you agree that your use of VibeCart 
            constitutes acceptance of Moroccan jurisdiction for any platform-related matters.
          </p>
        </div>
      </section>

      {/* Section 9: Changes to Terms */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.terms.sections.changes.title') */}
          9. Changes to Terms
        </h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            {/* t('legal.terms.sections.changes.text1') */}
            We may update these Terms of Service from time to time. We will notify users 
            of significant changes via email or platform notifications. Continued use of 
            VibeCart after changes constitutes acceptance of the updated terms.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-zinc-800 pt-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {/* t('legal.terms.sections.contact.title') */}
          Contact Us
        </h2>
        <p className="text-zinc-300">
          {/* t('legal.terms.sections.contact.text1') */}
          If you have any questions about these Terms of Service, please contact us at:{" "}
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
