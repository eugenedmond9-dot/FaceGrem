import Link from "next/link";

export default function TermsPage() {
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
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877f2] text-lg font-bold text-white">
              F
            </div>
            <span className="text-2xl font-semibold text-[#111827]">FaceGrem</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
            Terms
          </h1>
          <p className="mt-3 text-sm text-slate-500">Last updated: 2026</p>

          <div className="mt-8 space-y-6 text-[15px] leading-7 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                1. Using FaceGrem
              </h2>
              <p className="mt-2">
                By creating an account or using FaceGrem, you agree to use the
                platform responsibly and lawfully.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                2. Your account
              </h2>
              <p className="mt-2">
                You are responsible for maintaining the security of your account and
                the accuracy of the information you provide.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                3. Your content
              </h2>
              <p className="mt-2">
                You are responsible for the content you post, upload, or send through
                FaceGrem. Content must not violate laws or harm other users.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                4. Platform changes
              </h2>
              <p className="mt-2">
                FaceGrem may update features, policies, and services over time to
                improve the platform and maintain safety.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                5. Account limitations
              </h2>
              <p className="mt-2">
                We may suspend or remove accounts or content that violate platform
                rules or threaten the safety and integrity of the service.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}