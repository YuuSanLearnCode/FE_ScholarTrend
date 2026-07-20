import { useEffect, useState } from "react";
import Pagination from "../../components/Pagination";
import {
  approvePendingSyncPapers,
  getPendingSyncJobById,
  getPendingSyncJobs,
  getSyncLogs,
  getSyncSchedule,
  getSyncScheduleHistory,
  getSyncStatus,
  getSyncStatusBySource,
  rejectPendingSyncJob,
  triggerAdminSync,
  updateSyncSchedule,
} from "../../services/adminService";
import styles from "./AdminApiConfigPage.module.css";

function Icon({ name, size = 19 }) {
  const paths = {
    refresh: (
      <>
        <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {paths[name]}
    </svg>
  );
}

function normalizePendingSyncJobs(result) {
  const jobs = result?.items || result?.jobs || result?.data || result;
  return Array.isArray(jobs) ? jobs : [];
}

function normalizeSyncLogs(result) {
  const logs = result?.items || result?.logs || result?.data || result;
  return Array.isArray(logs) ? logs : [];
}

function normalizeScheduleHistory(result) {
  const history = result?.items || result?.history || result?.data || result;
  return Array.isArray(history) ? history : [];
}

function normalizeSyncStatus(result) {
  return {
    isAnySyncRunning: Boolean(result?.isAnySyncRunning),
    sources: Array.isArray(result?.sources) ? result.sources : [],
    recentSyncs: Array.isArray(result?.recentSyncs) ? result.recentSyncs : [],
  };
}

function formatDate(value) {
  if (!value) return "Not available";
  let dateString = value;
  if (typeof dateString === 'string' && !dateString.endsWith('Z') && !dateString.match(/[+-]\d{2}:?\d{2}$/)) {
    dateString += 'Z';
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatAuthors(authors) {
  if (!Array.isArray(authors) || authors.length === 0) return "Unknown authors";
  return authors.filter(Boolean).join(", ");
}

function getPaperId(paper) {
  return paper?.id;
}

function canApprovePaper(paper) {
  const status = String(paper?.status || "").toLowerCase();
  return getPaperId(paper) != null && !["approved", "rejected", "imported"].includes(status);
}

function getSelectablePaperIds(papers) {
  if (!Array.isArray(papers)) return [];
  return papers.filter(canApprovePaper).map(getPaperId);
}

function buildScheduleDraft(schedule = {}) {
  return {
    enabled: Boolean(schedule.enabled),
    cronExpression: schedule.cronExpression || "",
    timeZone: schedule.timeZone || "",
    searchQueries: Array.isArray(schedule.searchQueries)
      ? schedule.searchQueries.filter(Boolean).join("\n")
      : "",
  };
}

function parseScheduleQueries(value) {
  return String(value || "")
    .split(/\r?\n|,/)
    .map((query) => query.trim())
    .filter(Boolean);
}

function AdminApiConfigPage() {
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncStatusLoading, setSyncStatusLoading] = useState(true);
  const [syncStatusError, setSyncStatusError] = useState("");
  const [sourceStatusName, setSourceStatusName] = useState("");
  const [sourceStatusDetail, setSourceStatusDetail] = useState(null);
  const [sourceStatusLoading, setSourceStatusLoading] = useState(false);
  const [sourceStatusError, setSourceStatusError] = useState("");
  const [syncSchedule, setSyncSchedule] = useState(null);
  const [scheduleDraft, setScheduleDraft] = useState(() => buildScheduleDraft());
  const [syncScheduleLoading, setSyncScheduleLoading] = useState(true);
  const [syncScheduleSaving, setSyncScheduleSaving] = useState(false);
  const [syncScheduleError, setSyncScheduleError] = useState("");
  const [syncScheduleNotice, setSyncScheduleNotice] = useState("");
  const [scheduleHistory, setScheduleHistory] = useState([]);
  const [scheduleHistoryPage, setScheduleHistoryPage] = useState(1);
  const [scheduleHistoryPageSize, setScheduleHistoryPageSize] = useState(20);
  const [scheduleHistoryTotalPages, setScheduleHistoryTotalPages] = useState(1);
  const [scheduleHistoryLoading, setScheduleHistoryLoading] = useState(true);
  const [scheduleHistoryError, setScheduleHistoryError] = useState("");
  const [triggerDraft, setTriggerDraft] = useState({
    sourceName: "",
    paperLimit: 50,
    searchQuery: "",
  });
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerError, setTriggerError] = useState("");
  const [triggerResult, setTriggerResult] = useState(null);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingPageSize, setPendingPageSize] = useState(20);
  const [pendingTotalPages, setPendingTotalPages] = useState(1);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState("");
  const [syncLogs, setSyncLogs] = useState([]);
  const [syncLogPage, setSyncLogPage] = useState(1);
  const [syncLogPageSize, setSyncLogPageSize] = useState(20);
  const [syncLogTotalPages, setSyncLogTotalPages] = useState(1);
  const [syncLogsLoading, setSyncLogsLoading] = useState(true);
  const [syncLogsError, setSyncLogsError] = useState("");
  const [selectedSyncJob, setSelectedSyncJob] = useState(null);
  const [syncDetailLoading, setSyncDetailLoading] = useState(false);
  const [syncDetailError, setSyncDetailError] = useState("");
  const [selectedPaperIds, setSelectedPaperIds] = useState([]);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [approveError, setApproveError] = useState("");
  const [approveNotice, setApproveNotice] = useState("");

  useEffect(() => {
    let active = true;

    getSyncSchedule()
      .then((result) => {
        if (!active) return;
        setSyncSchedule(result || null);
        setScheduleDraft(buildScheduleDraft(result || {}));
      })
      .catch((error) => {
        if (!active) return;
        setSyncSchedule(null);
        setSyncScheduleError(
          error.response?.data?.message ||
            error.message ||
            "Could not load sync schedule.",
        );
      })
      .finally(() => {
        if (active) setSyncScheduleLoading(false);
      });

    getSyncStatus()
      .then((result) => {
        if (!active) return;
        setSyncStatus(normalizeSyncStatus(result));
      })
      .catch((error) => {
        if (!active) return;
        setSyncStatus(null);
        setSyncStatusError(
          error.response?.data?.message ||
            error.message ||
            "Could not load sync status.",
        );
      })
      .finally(() => {
        if (active) setSyncStatusLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const refreshPendingSync = async () => {
    setPendingLoading(true);
    setPendingError("");
    setSyncDetailError("");
    setApproveError("");

    try {
      const result = await getPendingSyncJobs(pendingPage, pendingPageSize);
      const jobs = normalizePendingSyncJobs(result);
      setPendingJobs(jobs);
      setPendingTotalPages(result?.totalPages || 1);
      if (selectedSyncJob && !jobs.some((job) => String(job.id) === String(selectedSyncJob.id))) {
        setSelectedSyncJob(null);
        setSelectedPaperIds([]);
      }
    } catch (error) {
      setPendingJobs([]);
      setPendingError(
        error.response?.data?.message ||
          error.message ||
          "Could not load pending sync jobs.",
      );
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    refreshPendingSync();
  }, [pendingPage, pendingPageSize]);

  const refreshSyncStatus = async () => {
    setSyncStatusLoading(true);
    setSyncStatusError("");

    try {
      const result = await getSyncStatus();
      setSyncStatus(normalizeSyncStatus(result));
    } catch (error) {
      setSyncStatus(null);
      setSyncStatusError(
        error.response?.data?.message ||
          error.message ||
          "Could not load sync status.",
      );
    } finally {
      setSyncStatusLoading(false);
    }
  };

  const loadSourceSyncStatus = async (sourceName) => {
    const nextSourceName = String(sourceName || "").trim();

    if (!nextSourceName) {
      setSourceStatusError("Enter a source name to check.");
      setSourceStatusDetail(null);
      return;
    }

    setSourceStatusName(nextSourceName);
    setSourceStatusLoading(true);
    setSourceStatusError("");

    try {
      const result = await getSyncStatusBySource(nextSourceName);
      setSourceStatusDetail(result || null);
    } catch (error) {
      setSourceStatusDetail(null);
      setSourceStatusError(
        error.response?.data?.message ||
          error.message ||
          "Could not load this source sync status.",
      );
    } finally {
      setSourceStatusLoading(false);
    }
  };

  const handleSourceStatusSubmit = (event) => {
    event.preventDefault();
    loadSourceSyncStatus(sourceStatusName);
  };

  const refreshSyncSchedule = async () => {
    setSyncScheduleLoading(true);
    setSyncScheduleError("");
    setSyncScheduleNotice("");

    try {
      const result = await getSyncSchedule();
      setSyncSchedule(result || null);
      setScheduleDraft(buildScheduleDraft(result || {}));
    } catch (error) {
      setSyncSchedule(null);
      setSyncScheduleError(
        error.response?.data?.message ||
          error.message ||
          "Could not load sync schedule.",
      );
    } finally {
      setSyncScheduleLoading(false);
    }
  };

  const handleScheduleDraftChange = (event) => {
    const { checked, name, type, value } = event.target;
    setSyncScheduleNotice("");
    setScheduleDraft((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveSyncSchedule = async (event) => {
    event.preventDefault();

    const payload = {
      enabled: Boolean(scheduleDraft.enabled),
      cronExpression: scheduleDraft.cronExpression.trim(),
      timeZone: scheduleDraft.timeZone.trim(),
      searchQueries: parseScheduleQueries(scheduleDraft.searchQueries),
    };

    setSyncScheduleSaving(true);
    setSyncScheduleError("");
    setSyncScheduleNotice("");

    try {
      const result = await updateSyncSchedule(payload);
      const nextSchedule = result || payload;
      setSyncSchedule(nextSchedule);
      setScheduleDraft(buildScheduleDraft(nextSchedule));
      setSyncScheduleNotice("Sync schedule updated successfully.");
    } catch (error) {
      setSyncScheduleError(
        error.response?.data?.message ||
          error.message ||
          "Could not update sync schedule.",
      );
    } finally {
      setSyncScheduleSaving(false);
    }
  };

  const refreshScheduleHistory = async () => {
    setScheduleHistoryLoading(true);
    setScheduleHistoryError("");

    try {
      const result = await getSyncScheduleHistory(scheduleHistoryPage, scheduleHistoryPageSize);
      setScheduleHistory(normalizeScheduleHistory(result));
      setScheduleHistoryTotalPages(result?.totalPages || 1);
    } catch (error) {
      setScheduleHistory([]);
      setScheduleHistoryError(
        error.response?.data?.message ||
          error.message ||
          "Could not load sync schedule history.",
      );
    } finally {
      setScheduleHistoryLoading(false);
    }
  };

  useEffect(() => {
    refreshScheduleHistory();
  }, [scheduleHistoryPage, scheduleHistoryPageSize]);

  const handleTriggerDraftChange = (event) => {
    const { name, value } = event.target;
    setTriggerError("");
    setTriggerDraft((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleTriggerSync = async (event) => {
    event.preventDefault();

    const sourceName = triggerDraft.sourceName.trim();
    const searchQuery = triggerDraft.searchQuery.trim();
    const paperLimit = Math.max(0, Number(triggerDraft.paperLimit) || 0);

    if (!sourceName) {
      setTriggerError("Enter a source name before triggering sync.");
      setTriggerResult(null);
      return;
    }

    setTriggerLoading(true);
    setTriggerError("");
    setTriggerResult(null);

    try {
      const result = await triggerAdminSync({
        sourceName,
        paperLimit,
        searchQuery,
      });

      setTriggerResult(result || null);
      refreshSyncStatus();
      refreshPendingSync();
      refreshScheduleHistory();
    } catch (error) {
      setTriggerError(
        error.response?.data?.message ||
          error.message ||
          "Could not trigger sync.",
      );
    } finally {
      setTriggerLoading(false);
    }
  };

  const refreshSyncLogs = async () => {
    setSyncLogsLoading(true);
    setSyncLogsError("");

    try {
      const result = await getSyncLogs(syncLogPage, syncLogPageSize);
      setSyncLogs(normalizeSyncLogs(result));
      setSyncLogTotalPages(result?.totalPages || 1);
    } catch (error) {
      setSyncLogs([]);
      setSyncLogsError(
        error.response?.data?.message ||
          error.message ||
          "Could not load sync logs.",
      );
    } finally {
      setSyncLogsLoading(false);
    }
  };

  useEffect(() => {
    refreshSyncLogs();
  }, [syncLogPage, syncLogPageSize]);

  const viewPendingSyncDetail = async (job) => {
    if (!job?.id) return;

    setSelectedSyncJob(job);
    setSelectedPaperIds(getSelectablePaperIds(job.papers));
    setSyncDetailLoading(true);
    setSyncDetailError("");
    setApproveError("");
    setApproveNotice("");

    try {
      const result = await getPendingSyncJobById(job.id);
      setSelectedSyncJob(result || job);
      setSelectedPaperIds(getSelectablePaperIds((result || job).papers));
    } catch (error) {
      setSyncDetailError(
        error.response?.data?.message ||
          error.message ||
          "Could not load pending sync detail.",
      );
    } finally {
      setSyncDetailLoading(false);
    }
  };

  const togglePaperSelection = (paperId) => {
    setSelectedPaperIds((current) => {
      const exists = current.some((id) => String(id) === String(paperId));
      if (exists) {
        return current.filter((id) => String(id) !== String(paperId));
      }
      return [...current, paperId];
    });
  };

  const selectAllPapers = () => {
    setSelectedPaperIds(getSelectablePaperIds(selectedSyncJob?.papers));
  };

  const clearPaperSelection = () => {
    setSelectedPaperIds([]);
  };

  const handleApproveSelectedPapers = async () => {
    if (!selectedSyncJob?.id) return;

    if (selectedPaperIds.length === 0) {
      setApproveError("Select at least one paper to approve.");
      setApproveNotice("");
      return;
    }

    setApproveLoading(true);
    setApproveError("");
    setApproveNotice("");

    try {
      const result = await approvePendingSyncPapers(selectedSyncJob.id, selectedPaperIds);
      const approved = formatNumber(result?.papersApproved);
      const rejected = formatNumber(result?.papersRejected);

      setApproveNotice(
        result?.message ||
          `Approval completed. Approved ${approved} paper(s), rejected ${rejected}.`,
      );

      try {
        const jobsResult = await getPendingSyncJobs(Math.max(1, Number(pendingLimit) || 50));
        setPendingJobs(normalizePendingSyncJobs(jobsResult));
      } catch {
        setPendingError("Approved, but could not refresh the pending sync list.");
      }

      try {
        const detailResult = await getPendingSyncJobById(selectedSyncJob.id);
        const nextDetail = detailResult || selectedSyncJob;
        setSelectedSyncJob(nextDetail);
        setSelectedPaperIds(getSelectablePaperIds(nextDetail.papers));
      } catch {
        setSelectedPaperIds([]);
        setSyncDetailError("Approved, but could not refresh this sync detail.");
      }
    } catch (error) {
      setApproveError(
        error.response?.data?.message ||
          error.message ||
          "Could not approve the selected papers.",
      );
    } finally {
      setApproveLoading(false);
    }
  };

  const handleRejectSyncJob = async () => {
    if (!selectedSyncJob?.id) return;

    const confirmed = window.confirm(
      `Reject sync #${selectedSyncJob.id}? All pending papers in this sync will be rejected.`,
    );
    if (!confirmed) return;

    setRejectLoading(true);
    setApproveError("");
    setApproveNotice("");

    try {
      const result = await rejectPendingSyncJob(selectedSyncJob.id);
      const approved = formatNumber(result?.papersApproved);
      const rejected = formatNumber(result?.papersRejected);

      setApproveNotice(
        result?.message ||
          `Reject completed. Approved ${approved} paper(s), rejected ${rejected}.`,
      );

      try {
        const jobsResult = await getPendingSyncJobs(Math.max(1, Number(pendingLimit) || 50));
        setPendingJobs(normalizePendingSyncJobs(jobsResult));
      } catch {
        setPendingError("Rejected, but could not refresh the pending sync list.");
      }

      try {
        const detailResult = await getPendingSyncJobById(selectedSyncJob.id);
        const nextDetail = detailResult || selectedSyncJob;
        setSelectedSyncJob(nextDetail);
        setSelectedPaperIds(getSelectablePaperIds(nextDetail.papers));
      } catch {
        setSelectedPaperIds([]);
        setSyncDetailError("Rejected, but could not refresh this sync detail.");
      }
    } catch (error) {
      setApproveError(
        error.response?.data?.message ||
          error.message ||
          "Could not reject this pending sync.",
      );
    } finally {
      setRejectLoading(false);
    }
  };

  const reviewBusy = approveLoading || rejectLoading;
  const scheduleQueries = Array.isArray(syncSchedule?.searchQueries)
    ? syncSchedule.searchQueries
    : [];
  const lockedSources = Array.isArray(syncStatus?.sources) ? syncStatus.sources : [];
  const recentStatusSyncs = Array.isArray(syncStatus?.recentSyncs)
    ? syncStatus.recentSyncs
    : [];
  const lockedSourceCount = lockedSources.filter((source) => source?.isLocked).length;
  const triggerSourceResults = Array.isArray(triggerResult?.sourceResults)
    ? triggerResult.sourceResults
    : [];
  const sourceNameOptions = Array.from(
    new Set(
      lockedSources.map((source) => source?.sourceName).filter(Boolean),
    ),
  );

  return (
    <section className={styles.configPage}>
      <div className={styles.hero}>
        <div>
          <span className={styles.kicker}>Infrastructure</span>
          <h2 className={styles.pageTitle}>API & integrations</h2>
          <p className={styles.pageSubtitle}>
            Manage sync schedules, manual triggers, live status, logs, and pending paper reviews.
          </p>
        </div>
      </div>

      <article className={styles.routesPanel}>
        <div className={styles.syncPanelHeader}>
          <div>
            <span className={styles.kicker}>Synchronization</span>
            <h3>Sync schedule</h3>
          </div>
          <button
            type="button"
            className={styles.syncRefreshButton}
            onClick={refreshSyncSchedule}
            disabled={syncScheduleLoading}
          >
            <Icon name="refresh" size={15} />
            {syncScheduleLoading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {syncScheduleError && (
          <div className={styles.syncError} role="alert">
            {syncScheduleError}
          </div>
        )}

        {syncScheduleLoading ? (
          <div className={styles.scheduleGrid}>
            {Array.from({ length: 5 }, (_, index) => (
              <div className={styles.syncSkeleton} key={index}>
                <span />
                <span />
              </div>
            ))}
          </div>
        ) : syncSchedule ? (
          <>
            <div className={styles.scheduleGrid}>
              <div className={styles.scheduleItem}>
                <span>Status</span>
                <strong
                  className={syncSchedule.enabled ? styles.scheduleEnabled : styles.scheduleDisabled}
                >
                  {syncSchedule.enabled ? "Enabled" : "Disabled"}
                </strong>
              </div>
              <div className={styles.scheduleItem}>
                <span>Cron</span>
                <strong>{syncSchedule.cronExpression || "Not configured"}</strong>
              </div>
              <div className={styles.scheduleItem}>
                <span>Time zone</span>
                <strong>{syncSchedule.timeZone || "Not configured"}</strong>
              </div>
              <div className={styles.scheduleItem}>
                <span>Last sync</span>
                <strong>{formatDate(syncSchedule.lastSyncAt)}</strong>
              </div>
              <div className={styles.scheduleItem}>
                <span>Next sync</span>
                <strong>{formatDate(syncSchedule.nextSyncAt)}</strong>
              </div>
            </div>

            <div className={styles.queryList}>
              <span className={styles.kicker}>Search queries</span>
              <div className={styles.queryPills}>
                {scheduleQueries.length > 0 ? (
                  scheduleQueries.map((query) => (
                    <span key={query}>{query}</span>
                  ))
                ) : (
                  <span>No search queries configured</span>
                )}
              </div>
            </div>

            {syncScheduleNotice && (
              <div className={styles.scheduleNotice} role="status">
                {syncScheduleNotice}
              </div>
            )}

            <form className={styles.scheduleForm} onSubmit={handleSaveSyncSchedule}>
              <label className={styles.scheduleToggle}>
                <input
                  type="checkbox"
                  name="enabled"
                  checked={scheduleDraft.enabled}
                  onChange={handleScheduleDraftChange}
                  disabled={syncScheduleSaving}
                />
                <span />
                <div>
                  <strong>Enable scheduled sync</strong>
                  <small>Allow the backend scheduler to run automatic paper sync jobs.</small>
                </div>
              </label>

              <div className={styles.scheduleFormGrid}>
                <label>
                  Cron expression
                  <input
                    type="text"
                    name="cronExpression"
                    value={scheduleDraft.cronExpression}
                    onChange={handleScheduleDraftChange}
                    placeholder="0 0 * * *"
                    disabled={syncScheduleSaving}
                  />
                </label>
                <label>
                  Time zone
                  <input
                    type="text"
                    name="timeZone"
                    value={scheduleDraft.timeZone}
                    onChange={handleScheduleDraftChange}
                    placeholder="Asia/Bangkok"
                    disabled={syncScheduleSaving}
                  />
                </label>
              </div>

              <label className={styles.scheduleTextarea}>
                Search queries
                <textarea
                  name="searchQueries"
                  value={scheduleDraft.searchQueries}
                  onChange={handleScheduleDraftChange}
                  placeholder="Artificial Intelligence&#10;Machine Learning&#10;Cloud Computing"
                  disabled={syncScheduleSaving}
                  rows={4}
                />
                <small>Use one query per line, or separate queries with commas.</small>
              </label>

              <div className={styles.scheduleFormActions}>
                <button type="submit" disabled={syncScheduleSaving}>
                  {syncScheduleSaving ? "Saving..." : "Save schedule"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className={styles.syncEmpty}>
            <Icon name="clock" size={20} />
            <p>No sync schedule configured.</p>
          </div>
        )}
      </article>

      <article className={styles.routesPanel} id="admin-schedule-history">
        <div className={styles.syncPanelHeader}>
          <div>
            <span className={styles.kicker}>Synchronization</span>
            <h3>Schedule history</h3>
          </div>
          <div className={styles.pendingControls}>
            <label>
              Page size
              <select
                value={scheduleHistoryPageSize}
                onChange={(event) => {
                  setScheduleHistoryPageSize(Number(event.target.value));
                  setScheduleHistoryPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </label>
            <button
              type="button"
              className={styles.syncRefreshButton}
              onClick={refreshScheduleHistory}
              disabled={scheduleHistoryLoading}
            >
              <Icon name="refresh" size={15} />
              {scheduleHistoryLoading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {scheduleHistoryError && (
          <div className={styles.syncError} role="alert">
            {scheduleHistoryError}
          </div>
        )}

        <div className={styles.syncJobsList}>
          {scheduleHistoryLoading && scheduleHistory.length === 0 ? (
            Array.from({ length: 3 }, (_, index) => (
              <div className={styles.syncSkeleton} key={index}>
                <span />
                <span />
              </div>
            ))
          ) : scheduleHistory.length > 0 ? (
            scheduleHistory.map((job) => (
              <article className={styles.syncJobCard} key={job.id || `${job.jobId}-${job.startedAt}`}>
                <div className={styles.syncJobTop}>
                  <div>
                    <strong>{job.jobName || "Scheduled sync job"}</strong>
                    <span>
                      {formatDate(job.startedAt)} - {formatDate(job.completedAt)}
                    </span>
                  </div>
                  <em>{job.status || "Unknown"}</em>
                </div>
                <div className={styles.historyMeta}>
                  <span><strong>{job.id ?? "N/A"}</strong>History ID</span>
                  <span><strong>{job.jobId ?? "N/A"}</strong>Job ID</span>
                  <span><strong>{job.jobName || "Unknown"}</strong>Job name</span>
                </div>
                {job.errorMessage && (
                  <div className={styles.syncLogMessage}>
                    {job.errorMessage}
                  </div>
                )}
              </article>
            ))
          ) : (
            <div className={styles.syncEmpty}>
              <Icon name="clock" size={20} />
              <p>No schedule history yet.</p>
            </div>
          )}
        </div>
        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
          <Pagination
            page={scheduleHistoryPage}
            totalPages={scheduleHistoryTotalPages}
            onPageChange={(p) => {
              setScheduleHistoryPage(p);
              document.getElementById("admin-schedule-history")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        </div>
      </article>

      <article className={styles.routesPanel}>
        <div className={styles.syncPanelHeader}>
          <div>
            <span className={styles.kicker}>Synchronization</span>
            <h3>Manual sync trigger</h3>
          </div>
        </div>

        <form className={styles.triggerForm} onSubmit={handleTriggerSync}>
          <label>
            Source name
            <input
              type="text"
              list="sync-source-names"
              name="sourceName"
              value={triggerDraft.sourceName}
              onChange={handleTriggerDraftChange}
              placeholder="SemanticScholar"
              disabled={triggerLoading}
            />
          </label>
          <label>
            Paper limit
            <input
              type="number"
              min="0"
              name="paperLimit"
              value={triggerDraft.paperLimit}
              onChange={handleTriggerDraftChange}
              disabled={triggerLoading}
            />
          </label>
          <label>
            Search query
            <input
              type="text"
              name="searchQuery"
              value={triggerDraft.searchQuery}
              onChange={handleTriggerDraftChange}
              placeholder="Artificial Intelligence"
              disabled={triggerLoading}
            />
          </label>
          <button type="submit" disabled={triggerLoading}>
            {triggerLoading ? "Triggering..." : "Trigger sync"}
          </button>
        </form>

        {triggerError && (
          <div className={styles.syncError} role="alert">
            {triggerError}
          </div>
        )}

        {triggerResult && (
          <article className={styles.triggerResult}>
            <div className={styles.triggerResultTop}>
              <div>
                <strong>{triggerResult.sourceName || triggerDraft.sourceName || "Manual sync"}</strong>
                <span>{triggerResult.message || "Sync trigger completed."}</span>
              </div>
              <em className={triggerResult.success ? styles.sourceActive : styles.sourceInactive}>
                {triggerResult.success ? "Success" : "Failed"}
              </em>
            </div>

            <div className={styles.triggerStats}>
              <span><strong>{triggerResult.syncType || "Unknown"}</strong>Sync type</span>
              <span><strong>{formatDate(triggerResult.triggeredAt)}</strong>Triggered at</span>
              <span><strong>{triggerResult.triggeredBy || "System"}</strong>Triggered by</span>
              <span><strong>{formatNumber(triggerResult.papersFetched)}</strong>Fetched</span>
              <span><strong>{formatNumber(triggerResult.papersQueued)}</strong>Queued</span>
              <span><strong>{triggerResult.proposalId ?? "N/A"}</strong>Proposal ID</span>
            </div>

            {triggerSourceResults.length > 0 && (
              <div className={styles.triggerSourceResults}>
                <h4>Source results</h4>
                {triggerSourceResults.map((source) => (
                  <article
                    className={styles.triggerSourceCard}
                    key={`${source.sourceName || "source"}-${source.status || source.message}`}
                  >
                    <div className={styles.lockTop}>
                      <strong>{source.sourceName || "Unknown source"}</strong>
                      <em>{source.status || "Unknown"}</em>
                    </div>
                    <div className={styles.syncJobStats}>
                      <span><strong>{formatNumber(source.papersFetched)}</strong>Fetched</span>
                      <span><strong>{formatNumber(source.papersQueued)}</strong>Queued</span>
                      <span><strong>{source.message || "No message"}</strong>Message</span>
                    </div>
                    {source.errorMessage && (
                      <div
                        className={`${styles.syncLogMessage} ${
                          source.status === "Completed" || source.status === "AwaitingApproval"
                            ? styles.syncLogSuccess
                            : source.status === "Skipped"
                              ? styles.syncLogWarning
                              : styles.syncLogError
                        }`}
                      >
                        {source.errorMessage}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </article>
        )}
      </article>

      <article className={styles.routesPanel}>
        <div className={styles.syncPanelHeader}>
          <div>
            <span className={styles.kicker}>Synchronization</span>
            <h3>Live sync status</h3>
          </div>
          <button
            type="button"
            className={styles.syncRefreshButton}
            onClick={refreshSyncStatus}
            disabled={syncStatusLoading}
          >
            <Icon name="refresh" size={15} />
            {syncStatusLoading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {syncStatusError && (
          <div className={styles.syncError} role="alert">
            {syncStatusError}
          </div>
        )}

        <form className={styles.sourceStatusForm} onSubmit={handleSourceStatusSubmit}>
          <label>
            Source name
            <input
              type="text"
              list="sync-source-names"
              value={sourceStatusName}
              onChange={(event) => {
                setSourceStatusName(event.target.value);
                setSourceStatusError("");
              }}
              placeholder="SemanticScholar"
              disabled={sourceStatusLoading}
            />
          </label>
          <datalist id="sync-source-names">
            {sourceNameOptions.map((sourceName) => (
              <option key={sourceName} value={sourceName} />
            ))}
          </datalist>
          <button type="submit" disabled={sourceStatusLoading}>
            {sourceStatusLoading ? "Checking..." : "Check source"}
          </button>
        </form>

        {sourceStatusError && (
          <div className={styles.syncError} role="alert">
            {sourceStatusError}
          </div>
        )}

        {sourceStatusDetail && (
          <article className={styles.sourceStatusResult}>
            <div className={styles.lockTop}>
              <strong>{sourceStatusDetail.sourceName || sourceStatusName || "Unknown source"}</strong>
              <em
                className={
                  sourceStatusDetail.isLocked ? styles.lockedBadge : styles.unlockedBadge
                }
              >
                {sourceStatusDetail.isLocked ? "Locked" : "Unlocked"}
              </em>
            </div>
            <div className={styles.lockMeta}>
              <span><strong>{sourceStatusDetail.syncType || "Unknown"}</strong>Sync type</span>
              <span><strong>{sourceStatusDetail.triggeredBy || "System"}</strong>Triggered by</span>
              <span><strong>{formatDate(sourceStatusDetail.lockedAt)}</strong>Locked at</span>
              <span><strong>{formatDate(sourceStatusDetail.expiresAt)}</strong>Expires at</span>
            </div>
          </article>
        )}

        {syncStatusLoading && !syncStatus ? (
          <div className={styles.statusGrid}>
            {Array.from({ length: 4 }, (_, index) => (
              <div className={styles.syncSkeleton} key={index}>
                <span />
                <span />
              </div>
            ))}
          </div>
        ) : syncStatus ? (
          <>
            <div className={styles.statusSummary}>
              <div className={styles.statusHero}>
                <span
                  className={`${styles.statusBadge} ${
                    syncStatus.isAnySyncRunning ? styles.statusRunning : styles.statusIdle
                  }`}
                >
                  <i />
                  {syncStatus.isAnySyncRunning ? "Sync running" : "No sync running"}
                </span>
                <p>
                  {syncStatus.isAnySyncRunning
                    ? "A sync job is currently running or locked by the backend."
                    : "No active sync lock was reported by the backend."}
                </p>
              </div>
              <div className={styles.statusMetric}>
                <strong>{formatNumber(lockedSourceCount)}</strong>
                <span>Locked sources</span>
              </div>
              <div className={styles.statusMetric}>
                <strong>{formatNumber(recentStatusSyncs.length)}</strong>
                <span>Recent syncs</span>
              </div>
            </div>

            <div className={styles.statusSectionGrid}>
              <div className={styles.statusSection}>
                <h4>Source locks</h4>
                <div className={styles.statusList}>
                  {lockedSources.length > 0 ? (
                    lockedSources.map((source) => (
                      <article
                        className={styles.lockCard}
                        key={`${source.sourceName || "source"}-${source.lockedAt || source.syncType}`}
                      >
                        <div className={styles.lockTop}>
                          <strong>{source.sourceName || "Unknown source"}</strong>
                          <div className={styles.lockActions}>
                            <em className={source.isLocked ? styles.lockedBadge : styles.unlockedBadge}>
                              {source.isLocked ? "Locked" : "Unlocked"}
                            </em>
                            <button
                              type="button"
                              onClick={() => loadSourceSyncStatus(source.sourceName)}
                              disabled={sourceStatusLoading || !source.sourceName}
                            >
                              Inspect
                            </button>
                          </div>
                        </div>
                        <div className={styles.lockMeta}>
                          <span><strong>{source.syncType || "Unknown"}</strong>Sync type</span>
                          <span><strong>{source.triggeredBy || "System"}</strong>Triggered by</span>
                          <span><strong>{formatDate(source.lockedAt)}</strong>Locked at</span>
                          <span><strong>{formatDate(source.expiresAt)}</strong>Expires at</span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className={styles.statusEmpty}>No source locks reported.</div>
                  )}
                </div>
              </div>

              <div className={styles.statusSection}>
                <h4>Recent syncs</h4>
                <div className={styles.statusList}>
                  {recentStatusSyncs.length > 0 ? (
                    recentStatusSyncs.map((sync) => (
                      <article
                        className={styles.recentStatusCard}
                        key={sync.id || `${sync.source}-${sync.startedAt}`}
                      >
                        <div className={styles.lockTop}>
                          <strong>{sync.source || "Unknown source"}</strong>
                          <em>{sync.status || "Unknown"}</em>
                        </div>
                        <div className={styles.syncJobStats}>
                          <span><strong>{formatNumber(sync.papersFetched)}</strong>Fetched</span>
                          <span><strong>{formatNumber(sync.papersAdded)}</strong>Added</span>
                          <span><strong>{formatNumber(sync.papersUpdated)}</strong>Updated</span>
                        </div>
                        <small>
                          {formatDate(sync.startedAt)} - {formatDate(sync.completedAt)}
                        </small>
                        {sync.errorMessage && (
                          <div className={styles.syncLogMessage}>
                            {sync.errorMessage}
                          </div>
                        )}
                      </article>
                    ))
                  ) : (
                    <div className={styles.statusEmpty}>No recent syncs reported.</div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.syncEmpty}>
            <Icon name="clock" size={20} />
            <p>No sync status available.</p>
          </div>
        )}
      </article>

      <article className={styles.routesPanel} id="admin-sync-logs">
        <div className={styles.syncPanelHeader}>
          <div>
            <span className={styles.kicker}>Synchronization</span>
            <h3>Sync logs</h3>
          </div>
          <div className={styles.pendingControls}>
            <label>
              Page size
              <select
                value={syncLogPageSize}
                onChange={(event) => {
                  setSyncLogPageSize(Number(event.target.value));
                  setSyncLogPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </label>
            <button
              type="button"
              className={styles.syncRefreshButton}
              onClick={refreshSyncLogs}
              disabled={syncLogsLoading}
            >
              <Icon name="refresh" size={15} />
              {syncLogsLoading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {syncLogsError && (
          <div className={styles.syncError} role="alert">
            {syncLogsError}
          </div>
        )}

        <div className={styles.syncJobsList}>
          {syncLogsLoading && syncLogs.length === 0 ? (
            Array.from({ length: 3 }, (_, index) => (
              <div className={styles.syncSkeleton} key={index}>
                <span />
                <span />
              </div>
            ))
          ) : syncLogs.length > 0 ? (
            syncLogs.map((log) => (
              <div className={styles.syncJobCard} key={log.id || `${log.source}-${log.startedAt}`}>
                <div className={styles.syncJobTop}>
                  <div>
                    <strong>{log.source || "Unknown source"}</strong>
                    <span>
                      {formatDate(log.startedAt)} - {formatDate(log.completedAt)}
                    </span>
                  </div>
                  <em>{log.status || "Unknown"}</em>
                </div>
                <div className={styles.syncJobStats}>
                  <span><strong>{formatNumber(log.papersFetched)}</strong>Fetched</span>
                  <span><strong>{formatNumber(log.papersAdded)}</strong>Added</span>
                  <span><strong>{formatNumber(log.papersUpdated)}</strong>Updated</span>
                </div>
                {log.errorMessage && (
                  <div className={styles.syncLogMessage}>
                    {log.errorMessage}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className={styles.syncEmpty}>
              <Icon name="clock" size={20} />
              <p>No sync logs yet.</p>
            </div>
          )}
        </div>
        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
          <Pagination
            page={syncLogPage}
            totalPages={syncLogTotalPages}
            onPageChange={(p) => {
              setSyncLogPage(p);
              document.getElementById("admin-sync-logs")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        </div>
      </article>

      <article className={styles.routesPanel} id="admin-pending-sync">
        <div className={styles.syncPanelHeader}>
          <div>
            <span className={styles.kicker}>Synchronization</span>
            <h3>Pending sync jobs</h3>
          </div>
          <div className={styles.pendingControls}>
            <label>
              Page size
              <select
                value={pendingPageSize}
                onChange={(event) => {
                  setPendingPageSize(Number(event.target.value));
                  setPendingPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </label>
            <button
              type="button"
              className={styles.syncRefreshButton}
              onClick={refreshPendingSync}
              disabled={pendingLoading}
            >
              <Icon name="refresh" size={15} />
              {pendingLoading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {pendingError && (
          <div className={styles.syncError} role="alert">
            {pendingError}
          </div>
        )}

        <div className={styles.syncJobsList}>
          {pendingLoading && pendingJobs.length === 0 ? (
            Array.from({ length: 3 }, (_, index) => (
              <div className={styles.syncSkeleton} key={index}>
                <span />
                <span />
              </div>
            ))
          ) : pendingJobs.length > 0 ? (
            pendingJobs.map((job) => (
              <div className={styles.syncJobCard} key={job.id || job.createdAt}>
                <div className={styles.syncJobTop}>
                  <div>
                    <strong>Sync #{job.id ?? "unknown"}</strong>
                    <span>{formatDate(job.createdAt)}</span>
                  </div>
                  <div className={styles.syncJobActions}>
                    <em>{job.status || "Pending"}</em>
                    <button
                      type="button"
                      onClick={() => viewPendingSyncDetail(job)}
                      disabled={syncDetailLoading && String(selectedSyncJob?.id) === String(job.id)}
                    >
                      {syncDetailLoading && String(selectedSyncJob?.id) === String(job.id)
                        ? "Loading..."
                        : "Details"}
                    </button>
                  </div>
                </div>
                <div className={styles.syncJobStats}>
                  <span><strong>{formatNumber(job.totalFetched)}</strong>Total fetched</span>
                  <span><strong>{formatNumber(job.pendingCount)}</strong>Pending</span>
                  <span><strong>{formatNumber(job.totalApproved)}</strong>Approved</span>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.syncEmpty}>
              <Icon name="clock" size={20} />
              <p>No pending sync jobs right now.</p>
            </div>
          )}
        </div>
        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
          <Pagination
            page={pendingPage}
            totalPages={pendingTotalPages}
            onPageChange={(p) => {
              setPendingPage(p);
              document.getElementById("admin-pending-sync")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        </div>

        {selectedSyncJob && (
          <div className={styles.syncDetailPanel}>
            <div className={styles.syncDetailHeader}>
              <div>
                <span className={styles.kicker}>Sync detail</span>
                <h3>Sync #{selectedSyncJob.id ?? "unknown"}</h3>
                <p>{formatDate(selectedSyncJob.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedSyncJob(null);
                  setSelectedPaperIds([]);
                  setApproveError("");
                  setApproveNotice("");
                }}
              >
                Close
              </button>
            </div>

            {syncDetailLoading && (
              <p className={styles.syncDetailNotice}>Loading papers for this sync job...</p>
            )}
            {syncDetailError && (
              <div className={styles.syncError} role="alert">
                {syncDetailError}
              </div>
            )}

            <div className={styles.syncDetailStats}>
              <span><strong>{selectedSyncJob.status || "Pending"}</strong>Status</span>
              <span><strong>{formatNumber(selectedSyncJob.totalFetched)}</strong>Total fetched</span>
              <span><strong>{formatNumber(selectedSyncJob.totalApproved)}</strong>Approved</span>
              <span><strong>{formatDate(selectedSyncJob.reviewedAt)}</strong>Reviewed at</span>
            </div>

            {selectedSyncJob.reviewedByUserId && (
              <div className={styles.reviewMeta}>
                Reviewed by: <strong>{selectedSyncJob.reviewedByUserId}</strong>
              </div>
            )}

            <div className={styles.approveBar}>
              <div>
                <strong>{selectedPaperIds.length} selected</strong>
                <span>Choose papers to import into the library.</span>
              </div>
              <div className={styles.approveActions}>
                <button type="button" onClick={selectAllPapers} disabled={reviewBusy}>
                  Select all
                </button>
                <button type="button" onClick={clearPaperSelection} disabled={reviewBusy}>
                  Clear
                </button>
                <button
                  type="button"
                  className={styles.approveButton}
                  onClick={handleApproveSelectedPapers}
                  disabled={reviewBusy || selectedPaperIds.length === 0}
                >
                  {approveLoading ? "Approving..." : "Approve selected"}
                </button>
                <button
                  type="button"
                  className={styles.rejectButton}
                  onClick={handleRejectSyncJob}
                  disabled={reviewBusy}
                >
                  {rejectLoading ? "Rejecting..." : "Reject sync"}
                </button>
              </div>
            </div>

            {approveNotice && (
              <div className={styles.approveNotice} role="status">
                {approveNotice}
              </div>
            )}
            {approveError && (
              <div className={styles.syncError} role="alert">
                {approveError}
              </div>
            )}

            <div className={styles.paperList}>
              {(selectedSyncJob.papers || []).length > 0 ? (
                selectedSyncJob.papers.map((paper) => (
                  <article className={styles.paperCard} key={paper.id || paper.externalId}>
                    <div className={styles.paperCardHeader}>
                      <div className={styles.paperTitleRow}>
                        <label className={styles.paperCheckbox}>
                          <input
                            type="checkbox"
                            checked={selectedPaperIds.some(
                              (id) => String(id) === String(getPaperId(paper)),
                            )}
                            disabled={!canApprovePaper(paper) || reviewBusy}
                            onChange={() => togglePaperSelection(getPaperId(paper))}
                            aria-label={`Select ${paper.title || "paper"}`}
                          />
                          <span />
                        </label>
                        <div>
                          <strong>{paper.title || "Untitled paper"}</strong>
                          <span>{formatAuthors(paper.authors)}</span>
                        </div>
                      </div>
                      <em>{paper.status || "Pending"}</em>
                    </div>
                    <p>{paper.abstract || "No abstract available."}</p>
                    <div className={styles.paperMeta}>
                      <span>{paper.externalSource || "Unknown source"}</span>
                      <span>{paper.year || "No year"}</span>
                      <span>{formatNumber(paper.citationCount)} citations</span>
                      <span>{paper.doi || "No DOI"}</span>
                    </div>
                  </article>
                ))
              ) : (
                <div className={styles.syncEmpty}>
                  <Icon name="clock" size={20} />
                  <p>No papers found for this sync job.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </article>
    </section>
  );
}

export default AdminApiConfigPage;
