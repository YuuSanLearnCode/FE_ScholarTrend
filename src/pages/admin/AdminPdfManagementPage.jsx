import { useState, useEffect, useCallback } from "react";
import {
  backfillPdfText,
  extractPdfTextForPaper,
  extractPdfTextBatch,
  getPdfStorageList,
} from "../../services/adminService";
import styles from "./AdminPdfManagementPage.module.css";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All papers" },
  { value: "ready", label: "📄 PDF ready (not extracted)" },
  { value: "extracted", label: "✅ Text extracted" },
  { value: "failed", label: "❌ Failed" },
  { value: "pending", label: "⏳ Pending" },
];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.errors?.[0] ||
    error.message ||
    "An unknown error occurred."
  );
}

export default function AdminPdfManagementPage() {
  // ── Table data ──
  const [papers, setPapers] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ── Selection ──
  const [selected, setSelected] = useState(new Set());

  // ── Action states ──
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState(null);
  const [actionError, setActionError] = useState("");

  // ── Backfill ──
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);
  const [backfillError, setBackfillError] = useState("");
  const [backfillMax, setBackfillMax] = useState(200);

  // ─── Load papers list ────────────────────────────────────────────
  const loadPapers = useCallback(async () => {
    setTableLoading(true);
    setTableError("");
    try {
      const res = await getPdfStorageList(500);
      // res = { totalCount, statusSummary, items: PdfStorageStatusDto[] }
      setPapers(res.items ?? []);
    } catch (err) {
      setTableError(getErrorMessage(err));
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  // ─── Filtering ───────────────────────────────────────────────────
  const filteredPapers = papers.filter((p) => {
    const matchSearch =
      !search ||
      p.paperTitle?.toLowerCase().includes(search.toLowerCase()) ||
      String(p.researchPaperId).includes(search);

    const st = p.status?.toLowerCase();
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "ready" && st === "ready") ||
      (statusFilter === "extracted" && p.textExtracted) ||
      (statusFilter === "failed" && st === "failed") ||
      (statusFilter === "pending" && st !== "ready" && st !== "failed");

    return matchSearch && matchStatus;
  });

  // ─── Selection helpers ───────────────────────────────────────────
  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filteredPapers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredPapers.map((p) => p.researchPaperId)));
    }
  }

  // ─── Extract selected ────────────────────────────────────────────
  async function handleExtractSelected() {
    if (selected.size === 0) return;
    setActionLoading(true);
    setActionResult(null);
    setActionError("");
    try {
      if (selected.size === 1) {
        const [id] = [...selected];
        const res = await extractPdfTextForPaper(id, false);
        setActionResult({
          type: "single",
          paperId: id,
          chars: res.extractedText?.length ?? 0,
          status: res.status ?? "Ready",
        });
      } else {
        const ids = [...selected];
        const res = await extractPdfTextBatch(ids, false);
        setActionResult({
          type: "batch",
          total: ids.length,
          extracted: res.extracted ?? 0,
          skipped: res.skipped ?? 0,
          failed: res.failed ?? 0,
        });
      }
      setSelected(new Set());
      loadPapers();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  // ─── Backfill all ────────────────────────────────────────────────
  async function handleBackfill() {
    setBackfillLoading(true);
    setBackfillResult(null);
    setBackfillError("");
    try {
      const res = await backfillPdfText(parseInt(backfillMax, 10) || 200);
      setBackfillResult(res);
      loadPapers();
    } catch (err) {
      setBackfillError(getErrorMessage(err));
    } finally {
      setBackfillLoading(false);
    }
  }

  // ─── Status badge ────────────────────────────────────────────────
  function StatusBadge({ status }) {
    const st = status?.toLowerCase();
    if (st === "ready") return <span className={styles.badgeReady}>Ready</span>;
    if (st === "failed") return <span className={styles.badgeFailed}>Failed</span>;
    if (st === "downloading") return <span className={styles.badgePending}>Downloading…</span>;
    return <span className={styles.badgePending}>{status || "Unknown"}</span>;
  }

  const allSelected =
    filteredPapers.length > 0 && selected.size === filteredPapers.length;
  const someSelected = selected.size > 0 && selected.size < filteredPapers.length;

  const readyCount = papers.filter((p) => p.status?.toLowerCase() === "ready").length;
  const failedCount = papers.filter((p) => p.status?.toLowerCase() === "failed").length;

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div>
          <p className={styles.kicker}>PDF Management</p>
          <h1 className={styles.pageTitle}>PDF Text Extraction</h1>
          <p className={styles.pageSubtitle}>
            Select papers from the list below and extract their full PDF text
            to power richer AI gap analysis.
          </p>
        </div>

        {/* Backfill button */}
        <div className={styles.backfillArea}>
          <div className={styles.backfillRow}>
            <label className={styles.backfillLabel} htmlFor="backfillMax">
              Max papers
            </label>
            <input
              id="backfillMax"
              className={styles.backfillInput}
              type="number"
              min={1}
              max={2000}
              value={backfillMax}
              onChange={(e) => setBackfillMax(e.target.value)}
            />
            <button
              className={styles.backfillBtn}
              onClick={handleBackfill}
              disabled={backfillLoading}
              title="Extract text from all PDFs that haven't been processed yet"
            >
              {backfillLoading ? (
                <><span className={styles.spinner} /> Processing…</>
              ) : (
                "⚡ Extract all pending"
              )}
            </button>
          </div>
          {backfillResult && (
            <div className={styles.backfillSuccess}>
              ✓ Done — {backfillResult.extracted ?? 0} extracted,{" "}
              {backfillResult.skipped ?? 0} skipped,{" "}
              {backfillResult.failed ?? 0} failed
            </div>
          )}
          {backfillError && (
            <div className={styles.errorInline}>{backfillError}</div>
          )}
        </div>
      </div>

      {/* ── Summary chips ── */}
      <div className={styles.summaryRow}>
        <div className={styles.chip} data-color="blue">
          <span className={styles.chipValue}>{papers.length}</span>
          <span className={styles.chipLabel}>Total PDFs</span>
        </div>
        <div className={styles.chip} data-color="green">
          <span className={styles.chipValue}>{readyCount}</span>
          <span className={styles.chipLabel}>Ready</span>
        </div>
        <div className={styles.chip} data-color="red">
          <span className={styles.chipValue}>{failedCount}</span>
          <span className={styles.chipLabel}>Failed</span>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <input
          id="paperSearch"
          className={styles.searchInput}
          type="search"
          placeholder="Search by title or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          id="statusFilter"
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {selected.size > 0 && (
          <button
            id="btn-extract-selected"
            className={styles.extractBtn}
            onClick={handleExtractSelected}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <><span className={styles.spinner} /> Extracting…</>
            ) : (
              `Extract selected (${selected.size})`
            )}
          </button>
        )}

        <button
          className={styles.refreshBtn}
          onClick={loadPapers}
          disabled={tableLoading}
          title="Refresh list"
        >
          ↻
        </button>
      </div>

      {/* ── Action result ── */}
      {actionResult && (
        <div className={styles.actionSuccess}>
          <span className={styles.successDot}>✓</span>
          {actionResult.type === "single" ? (
            <>
              <strong>Paper #{actionResult.paperId}</strong> extracted —{" "}
              {actionResult.chars.toLocaleString()} characters indexed.
            </>
          ) : (
            <>
              Batch done: <strong>{actionResult.extracted}</strong> extracted,{" "}
              <strong>{actionResult.skipped}</strong> skipped,{" "}
              <strong>{actionResult.failed}</strong> failed out of{" "}
              <strong>{actionResult.total}</strong> submitted.
            </>
          )}
        </div>
      )}
      {actionError && (
        <div className={styles.errorBox}>{actionError}</div>
      )}

      {/* ── Table ── */}
      <div className={styles.tableWrapper}>
        {tableLoading ? (
          <div className={styles.tableLoading}>
            <span className={styles.spinner} /> Loading papers…
          </div>
        ) : tableError ? (
          <div className={styles.errorBox}>{tableError}</div>
        ) : filteredPapers.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No papers match your filters.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thCheck}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th className={styles.thId}>ID</th>
                <th>Title</th>
                <th className={styles.thStatus}>PDF Status</th>
                <th className={styles.thSize}>Size</th>
                <th className={styles.thAction}></th>
              </tr>
            </thead>
            <tbody>
              {filteredPapers.map((paper) => (
                <tr
                  key={paper.researchPaperId}
                  className={
                    selected.has(paper.researchPaperId)
                      ? styles.rowSelected
                      : styles.row
                  }
                  onClick={() => toggleOne(paper.researchPaperId)}
                >
                  <td className={styles.tdCheck} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(paper.researchPaperId)}
                      onChange={() => toggleOne(paper.researchPaperId)}
                      aria-label={`Select ${paper.paperTitle}`}
                    />
                  </td>
                  <td className={styles.tdId}>#{paper.researchPaperId}</td>
                  <td className={styles.tdTitle}>
                    <span className={styles.titleText}>
                      {paper.paperTitle || "Untitled"}
                    </span>
                    {paper.failureReason && (
                      <span
                        className={styles.failureReason}
                        title={paper.failureReason}
                      >
                        {paper.failureReason.slice(0, 60)}…
                      </span>
                    )}
                  </td>
                  <td className={styles.tdStatus}>
                    <StatusBadge status={paper.status} />
                  </td>
                  <td className={styles.tdSize}>{formatBytes(paper.sizeBytes)}</td>
                  <td
                    className={styles.tdAction}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={styles.rowActionBtn}
                      title="Extract text from this PDF"
                      disabled={actionLoading}
                      onClick={async () => {
                        setActionLoading(true);
                        setActionResult(null);
                        setActionError("");
                        try {
                          const res = await extractPdfTextForPaper(
                            paper.researchPaperId,
                            false
                          );
                          setActionResult({
                            type: "single",
                            paperId: paper.researchPaperId,
                            chars: res.extractedText?.length ?? 0,
                            status: res.status ?? "Ready",
                          });
                          loadPapers();
                        } catch (err) {
                          setActionError(getErrorMessage(err));
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                    >
                      ⟳ Extract
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className={styles.tableFooter}>
        Showing {filteredPapers.length} of {papers.length} papers
        {selected.size > 0 && ` — ${selected.size} selected`}
      </p>
    </div>
  );
}
