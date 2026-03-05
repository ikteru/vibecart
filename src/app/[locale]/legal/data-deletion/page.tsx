import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Deletion Instructions - VibeCart',
  description: 'How to request deletion of your data from VibeCart',
};

export default function DataDeletionPage() {
  return (
    <div className="prose prose-zinc prose-invert max-w-none">
      <header className="mb-10 border-b border-zinc-800 pb-8">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Data Deletion Instructions
        </h1>
        <p className="text-sm text-zinc-500">
          Last updated: March 5, 2026
        </p>
      </header>

      <section className="mb-8">
        <p className="text-lg leading-relaxed text-zinc-300">
          If you would like to delete your data from VibeCart, you can do so using any of the methods below.
          We will process your request within 30 days.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white">Option 1: Delete from Instagram</h2>
        <p className="text-zinc-300">
          You can remove VibeCart&apos;s access to your data by revoking permissions directly from Instagram:
        </p>
        <ol className="list-decimal space-y-2 text-zinc-300 ps-6">
          <li>Open your Instagram app and go to <strong className="text-white">Settings</strong></li>
          <li>Navigate to <strong className="text-white">Security</strong> &rarr; <strong className="text-white">Apps and Websites</strong></li>
          <li>Find <strong className="text-white">VibeCart</strong> in the Active tab</li>
          <li>Tap <strong className="text-white">Remove</strong></li>
        </ol>
        <p className="text-zinc-400 text-sm mt-2">
          This will revoke our access to your Instagram data. Your VibeCart account and associated data will be automatically deleted within 30 days.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white">Option 2: Contact Us</h2>
        <p className="text-zinc-300">
          Send an email to{' '}
          <a href="mailto:privacy@codelya.ma" className="text-emerald-400 hover:text-emerald-300 no-underline">
            privacy@codelya.ma
          </a>{' '}
          with the subject line <strong className="text-white">&quot;Data Deletion Request&quot;</strong> and include:
        </p>
        <ul className="list-disc space-y-2 text-zinc-300 ps-6">
          <li>Your Instagram username</li>
          <li>The email address associated with your account (if any)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white">What Data We Delete</h2>
        <p className="text-zinc-300">
          Upon receiving your request, we will permanently delete:
        </p>
        <ul className="list-disc space-y-2 text-zinc-300 ps-6">
          <li>Your seller profile and shop configuration</li>
          <li>Your product listings and uploaded images</li>
          <li>Your Instagram access tokens (encrypted)</li>
          <li>Your order history and customer interactions</li>
          <li>Any other personal data associated with your account</li>
        </ul>
        <p className="text-zinc-400 text-sm mt-2">
          Some anonymized, aggregated data may be retained for analytics purposes, as permitted under applicable law.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white">Processing Time</h2>
        <p className="text-zinc-300">
          Data deletion requests are processed within <strong className="text-white">30 days</strong>.
          You will receive a confirmation email once your data has been deleted.
        </p>
      </section>
    </div>
  );
}
