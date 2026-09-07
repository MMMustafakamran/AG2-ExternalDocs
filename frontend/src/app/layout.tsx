// ─────────────────────────────────────────────────────────────────────────────
// Based on https://docs.ag2.ai/docs/user-guide/ag-ui/copilotkit-quickstart
// Snapshot: doc-snapshot/pages/copilotkit-quickstart.md
// Section: "4) Add the `CopilotKit` provider" — published as ui-react/app/layout.tsx
//
// The provider block, the two imports above it and the metadata object are the
// page's, unchanged. The only addition is `{children}` being wrapped in nothing
// at all — the page's version renders children bare, and so does this.
// ─────────────────────────────────────────────────────────────────────────────

import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import "./globals.css";

export const metadata = {
  title: "AG2 Weather Agent",
  description: "Weather agent powered by AG2 and CopilotKit",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CopilotKit agent="weather_agent" runtimeUrl="/api/copilotkit">
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
