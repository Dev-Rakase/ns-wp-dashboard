import type { Metadata } from "next";

const metaTermsUrl = "https://developers.facebook.com/terms/";

export const metadata: Metadata = {
  title: "Terms and Conditions | NS AI Search",
  description: "Terms and conditions for the NS AI Search Messenger integration.",
};

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold">Terms and Conditions</h1>
        <p className="mt-4 text-sm text-gray-600">Last updated: 2026-01-24</p>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Overview</h2>
          <p className="text-gray-700">
            These Terms and Conditions govern access to and use of the NS AI
            Search Messenger integration and related services. By using this
            service, you agree to comply with these terms, all applicable laws,
            and the Meta Platform Terms and Developer Policies.
          </p>
          <p className="text-gray-700">
            Meta Platform Terms:{" "}
            <a
              className="text-blue-600 underline"
              href={metaTermsUrl}
              target="_blank"
              rel="noreferrer"
            >
              {metaTermsUrl}
            </a>
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Eligibility and Accounts</h2>
          <p className="text-gray-700">
            You are responsible for ensuring that you have authority to connect
            a Facebook Page and to use the associated data for your business.
            You must keep your credentials and access tokens secure.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Acceptable Use</h2>
          <ul className="list-disc space-y-2 pl-6 text-gray-700">
            <li>Use the service only for lawful purposes.</li>
            <li>
              Do not violate Meta Platform Terms, Developer Policies, or any
              applicable law.
            </li>
            <li>Do not misuse or attempt to bypass security controls.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Data Handling</h2>
          <p className="text-gray-700">
            Data from Meta products is processed in accordance with the Privacy
            Policy. We only use the data necessary to provide Messenger bot
            functionality, support, and diagnostics.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Third-Party Services</h2>
          <p className="text-gray-700">
            This service integrates with Meta platforms. Your use of Meta
            products is governed by Meta’s terms, policies, and applicable
            permissions granted to our app.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Suspension and Termination</h2>
          <p className="text-gray-700">
            We may suspend or terminate access if you violate these terms, if
            required by Meta policies, or to protect security and integrity. If
            your Facebook Page removes the app, our access to your Page and user
            data ends and the integration is disabled.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Disclaimers</h2>
          <p className="text-gray-700">
            The service is provided on an “as is” basis without warranties of
            any kind. We do not guarantee uninterrupted availability or error
            free operation.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Changes</h2>
          <p className="text-gray-700">
            We may update these terms to reflect product, legal, or policy
            changes. Continued use means you accept the updated terms.
          </p>
        </section>
      </div>
    </main>
  );
}
