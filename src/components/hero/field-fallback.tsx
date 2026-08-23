export function FieldFallback() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px)," +
            "linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(78% 68% at 42% 45%, black 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(78% 68% at 42% 45%, black 30%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(48rem 34rem at 78% 16%, rgba(255,255,255,0.08), transparent 65%)," +
            "radial-gradient(36rem 26rem at 10% 85%, rgba(255,255,255,0.04), transparent 60%)",
        }}
      />
    </div>
  );
}
