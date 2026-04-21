import Link from "next/link";

export default function PrivacyCentrePage() {
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
            Privacy Centre
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Learn how FaceGrem handles privacy and user controls.
          </p>

          <div className="grid gap-4 mt-8 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-[#f8fafc] p-5">
              <h2 className="text-lg font-semibold text-[#111827]">
                Account information
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Review and update your profile details, including name, username, bio,
                and avatar.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#f8fafc] p-5">
              <h2 className="text-lg font-semibold text-[#111827]">
                Posts and content
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Manage what you post and remember that public content may be visible to
                others.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#f8fafc] p-5">
              <h2 className="text-lg font-semibold text-[#111827]">
                Messages and interactions
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Direct messages and social interactions are part of the FaceGrem
                experience and may be stored to support the service.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#f8fafc] p-5">
              <h2 className="text-lg font-semibold text-[#111827]">
                Security tips
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use a strong password, avoid sharing account access, and review your
                account regularly.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-black/10 bg-[#f8fafc] p-5">
            <h2 className="text-lg font-semibold text-[#111827]">
              Need more details?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              For the full explanation of how information is handled on FaceGrem, read
              the Privacy Policy.
            </p>
            <Link
              href="/privacy"
              className="mt-4 inline-block rounded-2xl border border-[#1877f2] px-4 py-2 text-sm font-semibold text-[#1877f2] transition hover:bg-[#1877f2]/5"
            >
              Open Privacy Policy
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}