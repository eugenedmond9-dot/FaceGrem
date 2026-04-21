import Link from "next/link";

export default function HelpPage() {
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
            Help
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Find answers and support for common FaceGrem questions.
          </p>

          <div className="mt-8 space-y-6 text-[15px] leading-7 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                Account access
              </h2>
              <p className="mt-2">
                If you cannot log in, double-check your email and password. Password
                recovery tools can be added as FaceGrem continues to grow.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                Posts and profile
              </h2>
              <p className="mt-2">
                You can update your profile, upload an avatar, create posts, and manage
                your content directly from your account pages.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                Communities and messages
              </h2>
              <p className="mt-2">
                FaceGrem lets you join communities, post inside them, and message other
                users through direct conversations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                Need more support?
              </h2>
              <p className="mt-2">
                More support tools and reporting channels can be added over time as the
                platform expands.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}