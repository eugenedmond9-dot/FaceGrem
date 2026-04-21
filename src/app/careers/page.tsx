import Link from "next/link";

export default function CareersPage() {
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
            Careers
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Join the people building the future of FaceGrem.
          </p>

          <div className="mt-8 space-y-6 text-[15px] leading-7 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                Work with us
              </h2>
              <p className="mt-2">
                FaceGrem is growing, and this space can be used in the future to list
                open roles, hiring information, and team values.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                Current openings
              </h2>
              <p className="mt-2">
                There are no public openings listed yet. Check back later as FaceGrem
                continues to develop.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                Who we look for
              </h2>
              <p className="mt-2">
                In the future, FaceGrem may look for people across engineering, design,
                operations, community, and product roles.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}