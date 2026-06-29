import { useEffect, useState } from "react";
import {
  approvePendingSyncPapers,
  getAdminStats,
  getPendingSyncJobById,
  getPendingSyncJobs,
  getSyncDataSources,
  getSyncLogs,
  getSyncSchedule,
  getSyncStatus,
  getSyncStatusBySource,
  rejectPendingSyncJob,
  updateSyncDataSourceStatus,
  updateSyncSchedule,
} from "../../services/adminService";
import styles from "./AdminApiConfigPage.module.css";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5141/api";

function Icon({ name, size = 19 }) {
  const paths = {
    server: (
      <>
        <rect x="3" y="4" width="18" height="6" rx="2" />
        <rect x="3" y="14" width="18" height="6" rx="2" />
        <path d="M7 7h.01M7 17h.01" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
      </>
    ),
    code: (
      <>
        <path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
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

function normalizeDataSources(result) {
  const sources = result?.items || result?.sources || result?.data || result;
  return Array.isArray(sources) ? sources : [];
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
  const date = new Date(value);
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
  const [connection, setConnection] = useState("checking");
  const [message, setMessage] = useState("Checking the admin API...");
  const [dataSources, setDataSources] = useState([]);
  const [dataSourcesLoading, setDataSourcesLoading] = useState(true);
  const [dataSourcesError, setDataSourcesError] = useState("");
  const [pendingSourceId, setPendingSourceId] = useState(null);
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
  const [pendingJobs, setPendingJobs] = useState([]);
  const [pendingLimit, setPendingLimit] = useState(50);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState("");
  const [syncLogs, setSyncLogs] = useState([]);
  const [syncLogLimit, setSyncLogLimit] = useState(50);
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

  const testConnection = async () => {
    setConnection("checking");
    setMessage("Checking the admin API...");

    const startedAt = performance.now();
    try {
      await getAdminStats();
      const duration = Math.max(1, Math.round(performance.now() - startedAt));
      setConnection("connected");
      setMessage(`Connected successfully in ${duration} ms.`);
    } catch (error) {
      setConnection("disconnected");
      setMessage(
        error.response?.data?.message ||
          "The frontend could not reach the admin API. Verify the backend and token.",
      );
    }
  };

  useEffect(() => {
    let active = true;
    const startedAt = performance.now();

    getAdminStats()
      .then(() => {
        if (!active) return;
        const duration = Math.max(1, Math.round(performance.now() - startedAt));
        setConnection("connected");
        setMessage(`Connected successfully in ${duration} ms.`);
      })
      .catch((error) => {
        if (!active) return;
        setConnection("disconnected");
        setMessage(
          error.response?.data?.message ||
          "The frontend could not reach the admin API. Verify the backend and token.",
        );
      });

    getSyncDataSources()
      .then((result) => {
        if (!active) return;
        setDataSources(normalizeDataSources(result));
      })
      .catch((error) => {
        if (!active) return;
        setDataSources([]);
        setDataSourcesError(
          error.response?.data?.message ||
            error.message ||
            "Could not load sync data sources.",
        );
      })
      .finally(() => {
        if (active) setDataSourcesLoading(false);
      });

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

    getPendingSyncJobs(50)
      .then((result) => {
        if (!active) return;
        setPendingJobs(normalizePendingSyncJobs(result));
      })
      .catch((error) => {
        if (!active) return;
        setPendingJobs([]);
        setPendingError(
          error.response?.data?.message ||
            error.message ||
            "Could not load pending sync jobs.",
        );
      })
      .finally(() => {
        if (active) setPendingLoading(false);
      });

    getSyncLogs(50)
      .then((result) => {
        if (!active) return;
        setSyncLogs(normalizeSyncLogs(result));
      })
      .catch((error) => {
        if (!active) return;
        setSyncLogs([]);
        setSyncLogsError(
          error.response?.data?.message ||
            error.message ||
            "Could not load sync logs.",
        );
      })
      .finally(() => {
        if (active) setSyncLogsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const refreshPendingSync = async () => {
    const limit = Math.max(1, Number(pendingLimit) || 50);
    setPendingLoading(true);
    setPendingError("");
    setSyncDetailError("");
    setApproveError("");

    try {
      const result = await getPendingSyncJobs(limit);
      const jobs = normalizePendingSyncJobs(result);
      setPendingJobs(jobs);
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

  const refreshDataSources = async () => {
    setDataSourcesLoading(true);
    setDataSourcesError("");

    try {
      const result = await getSyncDataSources();
      setDataSources(normalizeDataSources(result));
    } catch (error) {
      setDataSources([]);
      setDataSourcesError(
        error.response?.data?.message ||
          error.message ||
          "Could not load sync data sources.",
      );
    } finally {
      setDataSourcesLoading(false);
    }
  };

  const handleToggleDataSource = async (source) => {
    if (!source?.id) return;

    const nextActive = !source.isActive;
    if (!nextActive) {
      const confirmed = window.confirm(
        `Deactivate ${source.name || "this data source"}? New sync jobs may stop using it.`,
      );
      if (!confirmed) return;
    }

    setPendingSourceId(source.id);
    setDataSourcesError("");

    try {
      const result = await updateSyncDataSourceStatus(source.id, nextActive);
      const updatedSource = {
        ...source,
        ...(result || {}),
        isActive: result?.isActive ?? nextActive,
      };

      setDataSources((current) =>
        current.map((item) =>
          String(item.id) === String(source.id) ? { ...item, ...updatedSource } : item,
        ),
      );
    } catch (error) {
      setDataSourcesError(
        error.response?.data?.message ||
          error.message ||
          "Could not update this data source.",
      );
    } finally {
      setPendingSourceId(null);
    }
  };

  const refreshSyncLogs = async () => {
    const limit = Math.max(1, Number(syncLogLimit) || 50);
    setSyncLogsLoading(true);
    setSyncLogsError("");

    try {
      const result = await getSyncLogs(limit);
      setSyncLogs(normalizeSyncLogs(result));
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
  const sourceNameOptions = Array.from(
    new Set(
      [
        ...lockedSources.map((source) => source?.sourceName),
        ...dataSources.map((source) => source?.name),
      ].filter(Boolean),
    ),
  );

  return (
    <section className={styles.configPage}>
      <div className={styles.hero}>
        <div>
          <span className={styles.kicker}>Infrastructure</span>
          <h2 className={styles.pageTitle}>API & integrations</h2>
          <p className={styles.pageSubtitle}>
            Inspect the frontend connection and confirm the services used by the admin console.
          </p>
        </div>
        <button
          type="button"
          className={styles.testButton}
          onClick={testConnection}
          disabled={connection === "checking"}
        >
          <Icon name="refresh" size={17} />
          {connection === "checking" ? "Testing..." : "Test connection"}
        </button>
      </div>

      <article className={styles.connectionCard}>
        <div className={styles.connectionHeader}>
          <div className={styles.serverIcon}><Icon name="server" size={22} /></div>
          <div>
            <span>Primary service</span>
            <h3>ScholarTrend API</h3>
          </div>
          <div className={`${styles.connectionBadge} ${styles[connection]}`}>
            <i />
            {connection === "checking" ? "Checking" : connection}
          </div>
        </div>
        <div className={styles.endpointBlock}>
          <span>Base URL</span>
          <code>{baseUrl}</code>
        </div>
        <p className={styles.connectionMessage}>{message}</p>
      </article>

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

        {syncStatusLoading ? (
          <div className={styles.statusSummary}>
            {Array.from({ length: 3 }, (_, index) => (
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

      <article className={styles.routesPanel}>
        <div className={styles.syncPanelHeader}>
          <div>
            <span className={styles.kicker}>Synchronization</span>
            <h3>Data sources</h3>
          </div>
          <button
            type="button"
            className={styles.syncRefreshButton}
            onClick={refreshDataSources}
            disabled={dataSourcesLoading}
          >
            <Icon name="refresh" size={15} />
            {dataSourcesLoading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {dataSourcesError && (
          <div className={styles.syncError} role="alert">
            {dataSourcesError}
          </div>
        )}

        <div className={styles.dataSourceGrid}>
          {dataSourcesLoading ? (
            Array.from({ length: 3 }, (_, index) => (
              <div className={styles.syncSkeleton} key={index}>
                <span />
                <span />
              </div>
            ))
          ) : dataSources.length > 0 ? (
            dataSources.map((source) => (
              <article className={styles.dataSourceCard} key={source.id || source.name}>
                <div className={styles.dataSourceTop}>
                  <div>
                    <strong>{source.name || "Unknown source"}</strong>
                    <code>{source.baseUrl || "No base URL"}</code>
                  </div>
                  <em className={source.isActive ? styles.sourceActive : styles.sourceInactive}>
                    {source.isActive ? "Active" : "Inactive"}
                  </em>
                </div>
                <span>Last sync: {formatDate(source.lastSyncAt)}</span>
                <button
                  type="button"
                  className={
                    source.isActive ? styles.sourceDeactivateButton : styles.sourceActivateButton
                  }
                  onClick={() => handleToggleDataSource(source)}
                  disabled={pendingSourceId === source.id}
                >
                  {pendingSourceId === source.id
                    ? "Saving..."
                    : source.isActive
                      ? "Deactivate"
                      : "Activate"}
                </button>
              </article>
            ))
          ) : (
            <div className={styles.syncEmpty}>
              <Icon name="server" size={20} />
              <p>No data sources configured.</p>
            </div>
          )}
        </div>
      </article>

      <div className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelTitle}>
            <div className={styles.smallIcon}><Icon name="code" /></div>
            <div>
              <span>Runtime configuration</span>
              <h3>Frontend environment</h3>
            </div>
          </div>

          <dl className={styles.detailList}>
            <div>
              <dt>Environment variable</dt>
              <dd><code>VITE_API_BASE_URL</code></dd>
            </div>
            <div>
              <dt>Authentication</dt>
              <dd>JWT bearer token</dd>
            </div>
            <div>
              <dt>Unauthorized response</dt>
              <dd>Redirect to login</dd>
            </div>
            <div>
              <dt>Sync schedule</dt>
              <dd>Managed by backend</dd>
            </div>
          </dl>

          <div className={styles.infoBox}>
            <strong>Deployment note</strong>
            <p>
              The API URL is injected when Vite builds the frontend. Change it in the environment
              file, then rebuild the application.
            </p>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelTitle}>
            <div className={styles.smallIcon}><Icon name="shield" /></div>
            <div>
              <span>Security</span>
              <h3>Connection checklist</h3>
            </div>
          </div>

          <div className={styles.checkList}>
            <div>
              <span className={styles.checkIcon}><Icon name="check" size={14} /></span>
              <p><strong>Token interceptor</strong><small>JWT is attached to protected requests.</small></p>
            </div>
            <div>
              <span className={styles.checkIcon}><Icon name="check" size={14} /></span>
              <p><strong>Role-protected routes</strong><small>Admin screens require the Admin role.</small></p>
            </div>
            <div>
              <span className={styles.checkIcon}><Icon name="check" size={14} /></span>
              <p><strong>No client-side API keys</strong><small>Secrets remain on the backend.</small></p>
            </div>
            <div>
              <span className={styles.checkIcon}><Icon name="clock" size={14} /></span>
              <p><strong>Metadata sync</strong><small>Timing and jobs are controlled by the API.</small></p>
            </div>
          </div>
        </article>
      </div>

      <article className={styles.routesPanel}>
        <div>
          <span className={styles.kicker}>Admin contract</span>
          <h3>Connected endpoints</h3>
        </div>
        <div className={styles.routeGrid}>
          <div><span className={styles.methodGet}>GET</span><code>/admin/dashboard</code><small>Dashboard metrics</small></div>
          <div><span className={styles.methodGet}>GET</span><code>/admin/users</code><small>User directory</small></div>
          <div><span className={styles.methodGet}>GET</span><code>/admin/users/:id</code><small>User detail</small></div>
          <div><span className={styles.methodPatch}>PATCH</span><code>/admin/users/:id/role</code><small>Role update</small></div>
          <div><span className={styles.methodPatch}>PATCH</span><code>/admin/users/:id/status</code><small>Activate or deactivate</small></div>
          <div><span className={styles.methodGet}>GET</span><code>/admin/sync/data-sources</code><small>Sync data sources</small></div>
          <div><span className={styles.methodPatch}>PATCH</span><code>/admin/sync/data-sources/:id</code><small>Update source status</small></div>
          <div><span className={styles.methodGet}>GET</span><code>/admin/sync/schedule</code><small>Sync schedule</small></div>
          <div><span className={styles.methodPut}>PUT</span><code>/admin/sync/schedule</code><small>Update sync schedule</small></div>
          <div><span className={styles.methodGet}>GET</span><code>/admin/sync/status</code><small>Live sync status</small></div>
          <div><span className={styles.methodGet}>GET</span><code>/admin/sync/status/:sourceName</code><small>Source sync status</small></div>
          <div><span className={styles.methodGet}>GET</span><code>/admin/sync/logs</code><small>Sync history</small></div>
          <div><span className={styles.methodGet}>GET</span><code>/admin/sync/pending</code><small>Pending sync jobs</small></div>
          <div><span className={styles.methodGet}>GET</span><code>/admin/sync/pending/:id</code><small>Sync job detail</small></div>
          <div><span className={styles.methodPost}>POST</span><code>/admin/sync/pending/:id/approve</code><small>Approve pending papers</small></div>
          <div><span className={styles.methodPost}>POST</span><code>/admin/sync/pending/:id/reject</code><small>Reject pending sync</small></div>
        </div>
      </article>

      <article className={styles.routesPanel}>
        <div className={styles.syncPanelHeader}>
          <div>
            <span className={styles.kicker}>Synchronization</span>
            <h3>Sync logs</h3>
          </div>
          <div className={styles.pendingControls}>
            <label>
              Limit
              <input
                type="number"
                min="1"
                max="200"
                value={syncLogLimit}
                onChange={(event) => setSyncLogLimit(event.target.value)}
              />
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
          {syncLogsLoading ? (
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
      </article>

      <article className={styles.routesPanel}>
        <div className={styles.syncPanelHeader}>
          <div>
            <span className={styles.kicker}>Synchronization</span>
            <h3>Pending sync jobs</h3>
          </div>
          <div className={styles.pendingControls}>
            <label>
              Limit
              <input
                type="number"
                min="1"
                max="200"
                value={pendingLimit}
                onChange={(event) => setPendingLimit(event.target.value)}
              />
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
          {pendingLoading ? (
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
