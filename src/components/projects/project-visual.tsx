import type { Project } from "@/data/projects";

function accent(hue: number, alpha: number) {
  return `oklch(0.87 0.19 ${hue} / ${alpha})`;
}

export function ProjectVisual({ project }: { project: Project }) {
  const { hue, variant, index } = project;

  let pattern = "";
  if (variant === "contours") {
    pattern =
      `repeating-radial-gradient(circle at 84% -12%, transparent 0 26px, ${accent(hue, 0.16)} 27px 28px),` +
      `repeating-radial-gradient(circle at -8% 112%, transparent 0 34px, ${accent(hue, 0.08)} 35px 36px)`;
  } else if (variant === "beams") {
    pattern =
      `repeating-linear-gradient(115deg, transparent 0 34px, ${accent(hue, 0.07)} 34px 36px),` +
      `radial-gradient(24rem 16rem at 80% 10%, ${accent(hue, 0.2)}, transparent 65%)`;
  } else if (variant === "orbit") {
    pattern =
      `radial-gradient(circle at 72% 28%, transparent 0 108px, ${accent(hue, 0.28)} 109px 134px, transparent 135px),` +
      `radial-gradient(14rem 10rem at 72% 28%, ${accent(hue, 0.18)}, transparent 70%)`;
  } else {
    pattern =
      `linear-gradient(to right, ${accent(hue, 0.06)} 1px, transparent 1px),` +
      `linear-gradient(to bottom, ${accent(hue, 0.06)} 1px, transparent 1px),` +
      `radial-gradient(20rem 14rem at 30% 65%, ${accent(hue, 0.16)}, transparent 70%)`;
  }

  const gridSize = variant === "grid" ? "64px 64px" : undefined;

  return (
    <div
      aria-hidden
      className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.05]"
      style={{
        backgroundImage: `${pattern}, linear-gradient(to top, rgba(9,9,11,0.94) 4%, rgba(9,9,11,0.25) 46%, rgba(9,9,11,0.05))`,
        backgroundSize: gridSize
          ? `${gridSize}, ${gridSize}, auto`
          : undefined,
      }}
    >
      <span className="absolute -bottom-8 right-[-1%] select-none font-display text-[10rem] font-semibold leading-none text-hollow opacity-15">
        {index}
      </span>
      <span className="absolute inset-x-0 bottom-0 h-px bg-line" />
    </div>
  );
}
