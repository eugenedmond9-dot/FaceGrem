import Link from "next/link";

export default function AdChoicesPage() {
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
            AdChoices
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Learn how ad-related preferences may work on FaceGrem.
          </p>

          <div className="mt-8 space-y-6 text-[15px] leading-7 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                Advertising preferences
              </h2>
              <p className="mt-2">
                FaceGrem may introduce advertising tools or sponsored content options in
                the future. This page is meant to explain how ad choices may be managed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                Relevance and control
              </h2>
              <p className="mt-2">
                If advertising is ever introduced, users may be given ways to control
                relevance settings, hide specific ads, or manage ad preferences.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                Current status
              </h2>
              <p className="mt-2">
                FaceGrem may not currently serve full advertising products. This page is
                available as part of platform transparency and future planning.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}