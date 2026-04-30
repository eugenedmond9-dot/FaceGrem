import Link from "next/link";
import FaceGremLogo from "../../components/FaceGremLogo";

export default function AboutPage() {
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
            About FaceGrem
          </h1>

          <div className="mt-8 space-y-6 text-[15px] leading-7 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                What FaceGrem is
              </h2>
              <p className="mt-2">
                FaceGrem is a social platform built to help people connect, share,
                message, discover creators, and build communities around common
                interests.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                What you can do
              </h2>
              <p className="mt-2">
                On FaceGrem, users can create profiles, post content, interact with
                others, join communities, save posts, message people directly, and
                explore videos and discussions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111827]">
                Our goal
              </h2>
              <p className="mt-2">
                Our goal is to create a clean, modern social experience where people
                feel welcome, expressive, and connected.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}