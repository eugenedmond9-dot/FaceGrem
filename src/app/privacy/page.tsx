import Link from "next/link";
import FaceGremLogo from "../../components/FaceGremLogo";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f2f4f7] text-[#101828]">
      <main className="max-w-4xl px-5 py-10 mx-auto sm:px-6">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-10 h-10 text-3xl transition rounded-full text-slate-500 hover:bg-black/5"
          >
            ‹
          </Link>
        </div>

        <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <FaceGremLogo
              href=""
              showWordmark={false}
              markClassName="h-10 w-10 rounded-full ring-0 shadow-sm"
            />
            <span className="text-2xl font-semibold text-[#111827]">FaceGrem</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-slate-500">Last updated: 2026</p>

          <div className="mt-8 space-y-6 text-[15px] leading-7 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                1. Information we collect
              </h2>
              <p className="mt-2">
                FaceGrem may collect information you provide directly, such as your
                name, email address, profile details, messages, posts, and content you
                upload.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                2. How we use your information
              </h2>
              <p className="mt-2">
                We use your information to operate FaceGrem, create and manage your
                account, improve the platform, communicate with you, protect users, and
                support community features.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                3. Content and visibility
              </h2>
              <p className="mt-2">
                Posts, profile information, and community activity may be visible
                depending on how FaceGrem features are configured. You should avoid
                sharing sensitive personal information publicly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                4. Storage and security
              </h2>
              <p className="mt-2">
                We take reasonable steps to protect your information, but no online
                service can guarantee complete security. You are responsible for keeping
                your password secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                5. Third-party services
              </h2>
              <p className="mt-2">
                FaceGrem may rely on trusted service providers for hosting, data
                storage, authentication, analytics, and media delivery.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                6. Your choices
              </h2>
              <p className="mt-2">
                You may update your profile information, remove some content, or stop
                using the service at any time. Additional privacy controls may be added
                over time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                7. Contact
              </h2>
              <p className="mt-2">
                If you have questions about this policy, you can contact FaceGrem
                support through the platform when contact tools are available.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}