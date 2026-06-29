import { useEffect, useState } from "react";
import {
  approvePendingSyncPapers,
  getAdminStats,
  getPendingSyncJobById,
  getPendingSyncJobs,
  getSyncDataSources,
  getSyncLogs,
  rejectPendingSyncJob,
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

function AdminApiConfigPage() {
  const [connection, setConnection] = useState("checking");
  const [message, setMessage] = useState("Checking the admin API...");
  const [dataSources, setDataSources] = useState([]);
  const [dataSourcesLoading, setDataSourcesLoading] = useState(true);
  const [dataSourcesError, setDataSourcesError] = useState("");
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
