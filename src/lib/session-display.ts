export function formatSessionLabel(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";
  const browser = userAgent.includes("Edg/")
    ? "Edge"
    : userAgent.includes("Chrome/")
      ? "Chrome"
      : userAgent.includes("Firefox/")
        ? "Firefox"
        : userAgent.includes("Safari/")
          ? "Safari"
          : "Browser";
  const platform = userAgent.includes("iPhone")
    ? "iPhone"
    : userAgent.includes("iPad")
      ? "iPad"
      : userAgent.includes("Android")
        ? "Android"
        : userAgent.includes("Macintosh")
          ? "Mac"
          : userAgent.includes("Windows")
            ? "Windows"
            : userAgent.includes("Linux")
              ? "Linux"
              : "device";
  return `${browser} on ${platform}`;
}

export function formatLastActive(value: string): string {
  const date = new Date(value);
  const minutes = Math.max(
    1,
    Math.floor((Date.now() - date.getTime()) / 60_000)
  );
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short"
  });
}
