import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'CoFounder privacy policy — how we handle your data.',
};

export default function PrivacyPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-foreground-secondary mb-8">
          Last updated: March 22, 2026
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Overview</h2>
            <p className="text-foreground-secondary">
              CoFounder is an open-source AI development framework distributed under the MIT License.
              This privacy policy explains how we handle data when you use our website, CLI tools,
              and cloud services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Website</h3>
                <p className="text-foreground-secondary">
                  We collect standard web analytics data (page views, referrer, browser type) to improve
                  the website experience. We do not use third-party tracking cookies.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">CLI &amp; SDK</h3>
                <p className="text-foreground-secondary">
                  The CoFounder CLI and SDK packages run entirely on your machine. They do not send
                  telemetry, usage data, or code to our servers unless you explicitly opt in to
                  cloud features.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Newsletter</h3>
                <p className="text-foreground-secondary">
                  If you subscribe to our newsletter, we store your email address solely for sending
                  updates. You can unsubscribe at any time.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p className="text-foreground-secondary">
              Security is core to CoFounder. We apply the same standards to our own infrastructure
              that our framework helps you enforce: encrypted data in transit (TLS), no unnecessary
              data retention, and regular security reviews.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
            <p className="text-foreground-secondary">
              Our website is hosted on Vercel. When you use CoFounder to connect to LLM providers
              (OpenAI, Anthropic, Google, etc.), your API calls go directly to those providers.
              CoFounder does not proxy, store, or log your LLM requests.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="text-foreground-secondary">
              You can request deletion of any personal data we hold by contacting us at{' '}
              <a href="mailto:hello@waymaker.cx" className="text-foreground font-medium hover:underline">
                hello@waymaker.cx
              </a>
              . We comply with GDPR, CCPA, and applicable data protection regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact</h2>
            <p className="text-foreground-secondary">
              For privacy questions, reach us at{' '}
              <a href="mailto:hello@waymaker.cx" className="text-foreground font-medium hover:underline">
                hello@waymaker.cx
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
