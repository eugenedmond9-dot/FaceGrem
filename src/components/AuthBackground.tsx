"use client";

export default function AuthBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(24,119,242,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.14),transparent_30%),linear-gradient(to_bottom_right,#f2f4f7,#edf4ff)]" />

      <div className="absolute -left-16 top-16 h-72 w-72 animate-[floatOne_14s_ease-in-out_infinite] rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="absolute right-0 top-28 h-80 w-80 animate-[floatTwo_18s_ease-in-out_infinite] rounded-full bg-blue-400/25 blur-3xl" />
      <div className="absolute bottom-10 left-1/3 h-72 w-72 animate-[floatThree_16s_ease-in-out_infinite] rounded-full bg-violet-400/20 blur-3xl" />
      <div className="absolute bottom-0 right-20 h-64 w-64 animate-[floatOne_20s_ease-in-out_infinite] rounded-full bg-sky-300/20 blur-3xl" />

      <style jsx global>{`
        @keyframes floatOne {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(30px, -20px, 0) scale(1.08);
          }
        }

        @keyframes floatTwo {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(-35px, 25px, 0) scale(1.06);
          }
        }

        @keyframes floatThree {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(15px, -30px, 0) scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}