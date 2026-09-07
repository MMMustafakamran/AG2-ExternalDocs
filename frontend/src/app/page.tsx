// Harness index. Not doc code — a map of what this repo covers, so someone
// opening the app knows which route corresponds to which page of the docs.

const PAGES = [
  {
    title: "AG-UI",
    doc: "https://docs.ag2.ai/docs/user-guide/ag-ui/",
    covers: "AGUIStream, the manual-dispatch server, token usage on RUN_FINISHED",
    where: "backend/run_ag_ui.py",
    route: null,
    status: "ok",
  },
  {
    title: "CopilotKit Quickstart",
    doc: "https://docs.ag2.ai/docs/user-guide/ag-ui/copilotkit-quickstart",
    covers: "The runtime route, the provider, and the weather card rendered from a tool call",
    where: "src/app/api/copilotkit/route.ts · src/app/layout.tsx · this app",
    route: "/quickstart/demo-chat",
    status: "finding",
  },
  {
    title: "Backend deep dive",
    doc: "https://docs.ag2.ai/docs/user-guide/ag-ui/backend-deepdive",
    covers: "Event mapping, shared state snapshots, input-required checkpoints",
    where: "backend/run_ag_ui.py",
    route: null,
    status: "ok",
  },
  {
    title: "Channels",
    doc: "https://docs.ag2.ai/docs/user-guide/ag-ui/channels",
    covers: "The same endpoint driving Slack and other platforms",
    where: "not implemented — needs Slack credentials",
    route: null,
    status: "skipped",
  },
] as const;

const BADGE: Record<string, string> = {
  ok: "bg-emerald-100 text-emerald-800 border-emerald-300",
  finding: "bg-amber-100 text-amber-900 border-amber-300",
  skipped: "bg-slate-100 text-slate-600 border-slate-300",
};

const LABEL: Record<string, string> = {
  ok: "Working",
  finding: "Finding",
  skipped: "Not covered",
};

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">
        AG2 · AG-UI external-docs harness
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        One entry per page of{" "}
        <a
          className="underline"
          href="https://docs.ag2.ai/docs/user-guide/ag-ui/"
          target="_blank"
          rel="noreferrer"
        >
          docs.ag2.ai/docs/user-guide/ag-ui
        </a>
        . Code is pasted from those pages verbatim; where it fails as published,
        that is the finding.
      </p>

      <ul className="mt-8 space-y-4">
        {PAGES.map((p) => (
          <li
            key={p.title}
            className="rounded-lg border border-slate-200 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <a
                className="font-medium text-slate-900 underline"
                href={p.doc}
                target="_blank"
                rel="noreferrer"
              >
                {p.title}
              </a>
              <span
                className={`rounded border px-2 py-0.5 text-xs ${BADGE[p.status]}`}
              >
                {LABEL[p.status]}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{p.covers}</p>
            <p className="mt-1 font-mono text-xs text-slate-500">{p.where}</p>
            {p.route && (
              <a
                className="mt-3 inline-block text-sm text-sky-700 underline"
                href={p.route}
              >
                Open the demo →
              </a>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-8 text-xs text-slate-500">
        The CopilotKit Quickstart finding is about the reference starter it links
        to, not about the page&apos;s own snippets — see{" "}
        <code>doc-snapshot/reports/FINDINGS.md</code>.
      </p>
    </main>
  );
}
