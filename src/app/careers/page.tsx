"use client";

import { useState } from "react";
import Link from "next/link";
import FaceGremLogo from "../../components/FaceGremLogo";
import FaceGremHamburgerMenu from "../../components/FaceGremHamburgerMenu";

export default function CareersPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f2f4f7] text-[#101828]">
      
      
      <FaceGremHamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onLogout={undefined}
      />

<button
        type="button"
        onClick={() => setIsMenuOpen(true)}
        className="fixed right-4 top-4 z-[75] flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl text-slate-800 shadow-lg ring-1 ring-black/10 transition hover:bg-slate-100"
        aria-label="Open menu"
      >
        ≡
      </button>

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