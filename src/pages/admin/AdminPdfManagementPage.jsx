import { useState, useEffect, useCallback, useRef } from "react";
import {
  backfillPdfText,
  extractPdfTextForPaper,
  extractPdfTextBatch,
  getPdfStorageList,
  retryFailedDownloads,
} from "../../services/adminService";
import Pagination from "../../components/Pagination";
import styles from "./AdminPdfManagementPage.module.css";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All papers" },
  { value: "ready", label: "Ready (not extracted)" },
  { value: "extracted", label: "Extracted" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending" },
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
  const [papers, setPapers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [statusSummary, setStatusSummary] = useState({});
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [selected, setSelected] = useState(new Set());

  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState(null);
  const [actionError, setActionError] = useState("");

  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);
  const [backfillError, setBackfillError] = useState("");
  const [backfillMax, setBackfillMax] = useState(200);

  const [retryLoading, setRetryLoading] = useState(false);
  const [retryResult, setRetryResult] = useState(null);
  const [retryError, setRetryError] = useState("");

  const searchTimer = useRef(null);

  // Debounce search → reset to page 1
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchInput]);

  const loadPapers = useCallback(async () => {
    setTableLoading(true);
    setTableError("");
    try {
      const res = await getPdfStorageList({
        page,
        pageSize,
        search,
        status: statusFilter,
      });
      const count = res.totalCount ?? 0;
      const maxPage = Math.max(1, Math.ceil(count / pageSize));
      if (page > maxPage) {
        setPage(maxPage);
        return;
      }
      setPapers(res.items ?? []);
      setTotalCount(count);
      setStatusSummary(res.statusSummary ?? {});
      setSelected(new Set());
    } catch (err) {
      setTableError(getErrorMessage(err));
    } finally {
      setTableLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === papers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(papers.map((p) => p.researchPaperId)));
    }
  }

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

  async function handleRetryFailed() {
    setRetryLoading(true);
    setRetryResult(null);
    setRetryError("");
    try {
      const res = await retryFailedDownloads();
      setRetryResult(res);
      loadPapers();
    } catch (err) {
      setRetryError(getErrorMessage(err));
    } finally {
      setRetryLoading(false);
    }
  }

  function StatusBadge({ status, textExtracted }) {
    if (textExtracted) {
      return <span className={styles.badgeExtracted}>Extracted</span>;
    }
    const st = (status || "").toLowerCase();
    if (st === "ready") return <span className={styles.badgeReady}>Ready</span>;
    if (st === "failed" || st === "skipped") {
      return <span className={styles.badgeFailed}>Failed</span>;
    }
    return <span className={styles.badgePending}>Pending</span>;
  }

  const allSelected = papers.length > 0 && selected.size === papers.length;
  const someSelected = selected.size > 0 && selected.size < papers.length;

  const extractedCount = statusSummary.ExtractedText ?? 0;
  const readyCount = Math.max(0, (statusSummary.Ready ?? 0) - extractedCount);
  const failedCount = (statusSummary.Failed ?? 0) + (statusSummary.Skipped ?? 0);
  const pendingCount = Object.entries(statusSummary)
    .filter(([k]) => !["Ready", "Failed", "Skipped", "ExtractedText"].includes(k))
    .reduce((sum, [, n]) => sum + (Number(n) || 0), 0);
  const totalPdfs = (statusSummary.Ready ?? 0) + failedCount + pendingCount;

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.kicker}>PDF Management</p>
          <h1 className={styles.pageTitle}>PDF Text Extraction</h1>
          <p className={styles.pageSubtitle}>
            Select papers from the list below and extract their full PDF text
            to power richer AI gap analysis.
          </p>
        </div>

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
            <button
              className={styles.backfillBtn}
              onClick={handleRetryFailed}
              disabled={retryLoading}
              title="Reset all failed PDF downloads so the system can retry downloading them"
              style={{ backgroundColor: "var(--color-danger)", borderColor: "var(--color-danger)" }}
            >
              {retryLoading ? (
                <><span className={styles.spinner} /> Retrying…</>
              ) : (
                "🔄 Retry Failed"
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
          {retryResult && (
            <div className={styles.backfillSuccess} style={{ color: "var(--color-brand)" }}>
              ✓ Reset {retryResult.retryCount ?? 0} failed PDFs to Queued status. They will be downloaded shortly.
            </div>
          )}
          {backfillError && <div className={styles.errorInline}>{backfillError}</div>}
          {retryError && <div className={styles.errorInline}>{retryError}</div>}
        </div>
      </div>

      <div className={styles.summaryRow}>
        <div className={styles.chip} data-color="blue">
          <span className={styles.chipValue}>{totalPdfs}</span>
          <span className={styles.chipLabel}>Total PDFs</span>
        </div>
        <div className={styles.chip} data-color="green">
          <span className={styles.chipValue}>{readyCount}</span>
          <span className={styles.chipLabel}>Ready</span>
        </div>
        <div className={styles.chip} data-color="teal">
          <span className={styles.chipValue}>{extractedCount}</span>
          <span className={styles.chipLabel}>Extracted</span>
        </div>
        <div className={styles.chip} data-color="red">
          <span className={styles.chipValue}>{failedCount}</span>
          <span className={styles.chipLabel}>Failed</span>
        </div>
        <div className={styles.chip} data-color="amber">
          <span className={styles.chipValue}>{pendingCount}</span>
          <span className={styles.chipLabel}>Pending</span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <input
          id="paperSearch"
          className={styles.searchInput}
          type="search"
          placeholder="Search by title or ID…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          id="statusFilter"
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          aria-label="Items per page"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value="10">10 / page</option>
          <option value="20">20 / page</option>
          <option value="50">50 / page</option>
          <option value="100">100 / page</option>
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

      {actionResult && (
        <div className={actionResult.type === "batch" || actionResult.status === "Extracted" ? styles.actionSuccess : styles.errorBox}>
          {(actionResult.type === "batch" || actionResult.status === "Extracted") && <span className={styles.successDot}>✓</span>}
          {actionResult.type === "single" ? (
            <>
              <strong>Paper #{actionResult.paperId}</strong> {actionResult.status === "Extracted" ? "extracted" : "failed"} —{" "}
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
      {actionError && <div className={styles.errorBox}>{actionError}</div>}

      <div className={styles.tableWrapper}>
        {tableLoading ? (
          <div className={styles.tableLoading}>
            <span className={styles.spinner} /> Loading papers…
          </div>
        ) : tableError ? (
          <div className={styles.errorBox}>{tableError}</div>
        ) : papers.length === 0 ? (
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
                    aria-label="Select all on this page"
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
              {papers.map((paper) => (
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
                    <StatusBadge
                      status={paper.status}
                      textExtracted={paper.textExtracted}
                    />
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

      <div className={styles.paginationBar}>
        <p className={styles.tableFooter}>
          Page {page} / {totalPages} — showing {papers.length} of {totalCount} papers
          {selected.size > 0 && ` — ${selected.size} selected on this page`}
        </p>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
