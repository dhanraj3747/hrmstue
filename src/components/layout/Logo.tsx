import Image from "next/image";

export function Logo({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white ${
          compact ? "h-12 w-12 p-1" : "h-16 w-16 p-1.5"
        }`}
      >
        <Image
          src="/logo.jpeg"
          alt="RedFoxa Careerlink Pvt Ltd"
          fill
          className="object-contain"
          sizes="64px"
          priority
        />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-base font-bold tracking-wide text-brand-red">REDFOXA</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-red/75">
            Careerlink Pvt Ltd
          </p>
        </div>
      )}
    </div>
  );
}
