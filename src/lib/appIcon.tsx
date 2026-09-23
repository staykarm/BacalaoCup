import { ReactElement } from "react";

/** Shared visual design for every generated app icon (favicon, apple-touch-icon, PWA manifest icons). */
export function appIconElement(size: number): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a1330",
        color: "#e8c468",
        fontSize: size * 0.5,
        fontWeight: 800,
        fontFamily: "sans-serif",
        letterSpacing: -1,
      }}
    >
      BC
    </div>
  );
}
