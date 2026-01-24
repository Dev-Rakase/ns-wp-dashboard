const metaDeletionDocsUrl =
  "https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback";
const metaTermsUrl = "https://developers.facebook.com/terms/";

export default function PrivacyPolicyPage() {
  const baseUrl =
    process.env.NEXT_PUBLIC_ADMIN_PANEL_URL || process.env.ADMIN_PANEL_URL || "";
  const dataDeletionUrl = baseUrl
    ? `${baseUrl}/privacy-policy#data-deletion`
    : "/privacy-policy#data-deletion";

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-4 text-sm text-gray-600">Last updated: 2026-01-24</p>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Scope</h2>
          <p className="text-gray-700">
            This Privacy Policy explains how NS AI Search processes data when
            you connect a Facebook Page for Messenger bot functionality. We
            follow Meta Platform Terms and applicable laws for data processing.
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
          <h2 className="text-xl font-semibold">Data We Process</h2>
          <ul className="list-disc space-y-2 pl-6 text-gray-700">
            <li>Facebook Page ID and Page name for connection status.</li>
            <li>
              Page access tokens to enable Messenger messaging on your behalf.
            </li>
            <li>
              Limited message metadata needed to deliver and monitor Messenger
              interactions.
            </li>
            <li>Website domain and license key for authentication.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">How We Use Data</h2>
          <ul className="list-disc space-y-2 pl-6 text-gray-700">
            <li>Connect and maintain your Messenger bot integration.</li>
            <li>Provide diagnostics, security, and abuse prevention.</li>
            <li>Comply with legal and platform policy requirements.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Data Sharing</h2>
          <p className="text-gray-700">
            We do not sell personal data. We share data only with Meta platforms
            as required to operate Messenger features, or as required by law.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Data Retention</h2>
          <p className="text-gray-700">
            We retain data only as long as needed to provide the service,
            resolve disputes, and comply with legal obligations. When a Facebook
            Page owner removes our app, the integration is disabled and we stop
            processing new Page data.
          </p>
        </section>

        <section className="mt-8 space-y-4" id="data-deletion">
          <h2 className="text-xl font-semibold">User Data Deletion</h2>
          <p className="text-gray-700">
            Users can request deletion of their data by removing the app from
            Facebook and submitting a deletion request in Settings &amp; Privacy
            &gt; Settings &gt; Apps and Websites. We acknowledge and process
            such requests and provide a confirmation code and status link.
          </p>
          <p className="text-gray-700">
            Data deletion instructions follow Meta’s guidance:{" "}
            <a
              className="text-blue-600 underline"
              href={metaDeletionDocsUrl}
              target="_blank"
              rel="noreferrer"
            >
              {metaDeletionDocsUrl}
            </a>
          </p>
          <p className="text-gray-700">
            Data Deletion URL:{" "}
            <span className="font-medium">{dataDeletionUrl}</span>
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-gray-700">
            For privacy questions, contact the site owner or administrator who
            integrated the Messenger bot on this website.
          </p>
        </section>
      </div>
    </main>
  );
}
