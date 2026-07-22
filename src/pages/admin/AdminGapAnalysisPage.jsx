import { useState, useEffect } from "react";
import {
  assessGapAnalysisQuality,
  assessTopicGapAnalysisQuality,
  extractGapAnalysis,
  extractTopicGapAnalysis,
  generateGapAnalysisGaps,
  generateTopicGapAnalysisGaps,
  mineGapAnalysisPatterns,
  mineTopicGapAnalysisPatterns,
  regenerateTopicGapAnalysisGaps,
  runTopicGapAnalysisPipeline,
} from "../../services/adminService";
import {
  getTopicPatterns,
  getTopicGapTrends,
  getTopicCoverage,
  getTopicQuality,
  getTopics,
} from "../../services/topicService";
import styles from "./AdminGapAnalysisPage.module.css";

function getErrorMessage(error, fallbackMessage) {
  return (
    error.response?.data?.message ||
    error.response?.data?.errors?.[0] ||
    error.message ||
    fallbackMessage
  );
}

function formatResult(result) {
  if (result == null || result === "") return "No response data returned.";
  return typeof result === "string" ? result : JSON.stringify(result, null, 2);
}

function formatTime(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function AdminGapAnalysisPage() {
  const [reportTopicId, setReportTopicId] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportResult, setReportResult] = useState("");
  const [reportError, setReportError] = useState("");

  const [topicId, setTopicId] = useState("");
  const [extractTopicId, setExtractTopicId] = useState("");
  const [patternsTopicId, setPatternsTopicId] = useState("");
  const [generateTopicId, setGenerateTopicId] = useState("");
  const [regenerateTopicId, setRegenerateTopicId] = useState("");
  const [pipelineTopicId, setPipelineTopicId] = useState("");
  const [extractGlobalLoading, setExtractGlobalLoading] = useState(false);
  const [extractTopicLoading, setExtractTopicLoading] = useState(false);
  const [patternsGlobalLoading, setPatternsGlobalLoading] = useState(false);
  const [patternsTopicLoading, setPatternsTopicLoading] = useState(false);
  const [generateGlobalLoading, setGenerateGlobalLoading] = useState(false);
  const [generateTopicLoading, setGenerateTopicLoading] = useState(false);
  const [regenerateTopicLoading, setRegenerateTopicLoading] = useState(false);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [topicLoading, setTopicLoading] = useState(false);
  const [extractGlobalResult, setExtractGlobalResult] = useState("");
  const [extractTopicResult, setExtractTopicResult] = useState("");
  const [patternsGlobalResult, setPatternsGlobalResult] = useState("");
  const [patternsTopicResult, setPatternsTopicResult] = useState("");
  const [generateGlobalResult, setGenerateGlobalResult] = useState("");
  const [generateTopicResult, setGenerateTopicResult] = useState("");
  const [regenerateTopicResult, setRegenerateTopicResult] = useState("");
  const [pipelineResult, setPipelineResult] = useState("");
  const [globalResult, setGlobalResult] = useState("");
  const [topicResult, setTopicResult] = useState("");
  const [extractGlobalError, setExtractGlobalError] = useState("");
  const [extractTopicError, setExtractTopicError] = useState("");
  const [patternsGlobalError, setPatternsGlobalError] = useState("");
  const [patternsTopicError, setPatternsTopicError] = useState("");
  const [generateGlobalError, setGenerateGlobalError] = useState("");
  const [generateTopicError, setGenerateTopicError] = useState("");
  const [regenerateTopicError, setRegenerateTopicError] = useState("");
  const [pipelineError, setPipelineError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [topicError, setTopicError] = useState("");
  const [runHistory, setRunHistory] = useState([]);

  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(true);

  useEffect(() => {
    getTopics()
      .then(result => setTopics(result || []))
      .catch(console.error)
      .finally(() => setTopicsLoading(false));
  }, []);

  const handleFetchReport = async (reportName, fetchFn) => {
    if (!reportTopicId) {
      setReportError("Please enter a Topic ID first.");
      return;
    }
    setReportLoading(true);
    setReportError("");
    setReportResult("");
    try {
      const result = await fetchFn(reportTopicId);
      setReportResult(`--- ${reportName} ---\n` + formatResult(result));
    } catch (error) {
      setReportError(getErrorMessage(error, `Could not load ${reportName}.`));
    } finally {
      setReportLoading(false);
    }
  };

  const addRunHistory = (scope, result) => {
    setRunHistory((current) => [
      {
        id: `${Date.now()}-${scope}`,
        scope,
        result: formatResult(result),
        createdAt: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 5));
  };

  const handleExtractAll = async () => {
    setExtractGlobalLoading(true);
    setExtractGlobalError("");
    setExtractGlobalResult("");

    try {
      const result = await extractGapAnalysis();
      setExtractGlobalResult(formatResult(result));
      addRunHistory("Extract all topics", result);
    } catch (error) {
      setExtractGlobalError(
        getErrorMessage(error, "Could not run the global gap analysis extraction."),
      );
    } finally {
      setExtractGlobalLoading(false);
    }
  };

  const handleExtractTopic = async (event) => {
    event.preventDefault();
    setExtractTopicLoading(true);
    setExtractTopicError("");
    setExtractTopicResult("");

    try {
      const result = await extractTopicGapAnalysis(extractTopicId);
      setExtractTopicResult(formatResult(result));
      addRunHistory(`Extract topic #${Number(extractTopicId)}`, result);
    } catch (error) {
      setExtractTopicError(
        getErrorMessage(error, "Could not run this topic gap analysis extraction."),
      );
    } finally {
      setExtractTopicLoading(false);
    }
  };

  const handleMinePatternsAll = async () => {
    setPatternsGlobalLoading(true);
    setPatternsGlobalError("");
    setPatternsGlobalResult("");

    try {
      const result = await mineGapAnalysisPatterns();
      setPatternsGlobalResult(formatResult(result));
      addRunHistory("Mine all patterns", result);
    } catch (error) {
      setPatternsGlobalError(
        getErrorMessage(error, "Could not mine global gap analysis patterns."),
      );
    } finally {
      setPatternsGlobalLoading(false);
    }
  };

  const handleMinePatternsTopic = async (event) => {
    event.preventDefault();
    setPatternsTopicLoading(true);
    setPatternsTopicError("");
    setPatternsTopicResult("");

    try {
      const result = await mineTopicGapAnalysisPatterns(patternsTopicId);
      setPatternsTopicResult(formatResult(result));
      addRunHistory(`Mine patterns topic #${Number(patternsTopicId)}`, result);
    } catch (error) {
      setPatternsTopicError(
        getErrorMessage(error, "Could not mine patterns for this topic."),
      );
    } finally {
      setPatternsTopicLoading(false);
    }
  };

  const handleGenerateGapsAll = async () => {
    setGenerateGlobalLoading(true);
    setGenerateGlobalError("");
    setGenerateGlobalResult("");

    try {
      const result = await generateGapAnalysisGaps();
      setGenerateGlobalResult(formatResult(result));
      addRunHistory("Generate all gaps", result);
    } catch (error) {
      setGenerateGlobalError(
        getErrorMessage(error, "Could not generate global gap analysis gaps."),
      );
    } finally {
      setGenerateGlobalLoading(false);
    }
  };

  const handleGenerateGapsTopic = async (event) => {
    event.preventDefault();
    setGenerateTopicLoading(true);
    setGenerateTopicError("");
    setGenerateTopicResult("");

    try {
      const result = await generateTopicGapAnalysisGaps(generateTopicId);
      setGenerateTopicResult(formatResult(result));
      addRunHistory(`Generate gaps topic #${Number(generateTopicId)}`, result);
    } catch (error) {
      setGenerateTopicError(
        getErrorMessage(error, "Could not generate gaps for this topic."),
      );
    } finally {
      setGenerateTopicLoading(false);
    }
  };

  const handleRegenerateGapsTopic = async (event) => {
    event.preventDefault();
    setRegenerateTopicLoading(true);
    setRegenerateTopicError("");
    setRegenerateTopicResult("");

    try {
      const result = await regenerateTopicGapAnalysisGaps(regenerateTopicId);
      setRegenerateTopicResult(formatResult(result));
      addRunHistory(`Regenerate gaps topic #${Number(regenerateTopicId)}`, result);
    } catch (error) {
      setRegenerateTopicError(
        getErrorMessage(error, "Could not regenerate gaps for this topic."),
      );
    } finally {
      setRegenerateTopicLoading(false);
    }
  };

  const handleRunPipelineTopic = async (event) => {
    event.preventDefault();
    setPipelineLoading(true);
    setPipelineError("");
    setPipelineResult("");

    try {
      const result = await runTopicGapAnalysisPipeline(pipelineTopicId);
      setPipelineResult(formatResult(result));
      addRunHistory(`Run pipeline topic #${Number(pipelineTopicId)}`, result);
    } catch (error) {
      setPipelineError(
        getErrorMessage(error, "Could not run the gap analysis pipeline for this topic."),
      );
    } finally {
      setPipelineLoading(false);
    }
  };

  const handleAssessAll = async () => {
    setGlobalLoading(true);
    setGlobalError("");
    setGlobalResult("");

    try {
      const result = await assessGapAnalysisQuality();
      setGlobalResult(formatResult(result));
      addRunHistory("Assess all topics", result);
    } catch (error) {
      setGlobalError(
        getErrorMessage(error, "Could not run the global gap analysis assessment."),
      );
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleAssessTopic = async (event) => {
    event.preventDefault();
    setTopicLoading(true);
    setTopicError("");
    setTopicResult("");

    try {
      const result = await assessTopicGapAnalysisQuality(topicId);
      setTopicResult(formatResult(result));
      addRunHistory(`Assess topic #${Number(topicId)}`, result);
    } catch (error) {
      setTopicError(
        getErrorMessage(error, "Could not run this topic gap analysis assessment."),
      );
    } finally {
      setTopicLoading(false);
    }
  };

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.kicker}>AdminGapAnalysis</span>
          <h2 className={styles.pageTitle}>Gap analysis tools</h2>
          <p className={styles.pageSubtitle}>
            Run the topic pipeline, extract gap-analysis data, and check output quality.
          </p>
        </div>
      </header>

      <div className={styles.sectionIntro}>
        <span className={styles.kicker}>Analysis Reports</span>
        <h3>View Generated Topic Reports</h3>
      </div>

      <div className={styles.actionGrid}>
        <article className={`${styles.card} ${styles.wideCard}`}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Fetch Topic Data</h3>
            </div>
          </div>
          <p className={styles.cardText}>
            View the extracted gap trends, patterns, coverage, and quality for a topic.
          </p>

          <div className={styles.topicForm} style={{ alignItems: 'flex-end', marginBottom: '16px' }}>
            <label>
              Topic ID
              <select
                value={reportTopicId}
                onChange={(event) => setReportTopicId(event.target.value)}
                disabled={reportLoading || topicsLoading}
              >
                <option value="">-- Select a topic --</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button type="button" className={styles.secondaryButton} disabled={reportLoading} onClick={() => handleFetchReport("Gap Trends", getTopicGapTrends)}>Trends</button>
              <button type="button" className={styles.secondaryButton} disabled={reportLoading} onClick={() => handleFetchReport("Patterns", getTopicPatterns)}>Patterns</button>
              <button type="button" className={styles.secondaryButton} disabled={reportLoading} onClick={() => handleFetchReport("Coverage", getTopicCoverage)}>Coverage</button>
              <button type="button" className={styles.secondaryButton} disabled={reportLoading} onClick={() => handleFetchReport("Quality", getTopicQuality)}>Quality</button>
            </div>
          </div>

          {reportError && (
            <div className={styles.errorBox} role="alert">
              {reportError}
            </div>
          )}

          {reportResult && (
            <div className={styles.resultBox}>
              <span>Report Data</span>
              <pre>{reportResult}</pre>
            </div>
          )}
        </article>
      </div>

      <div className={styles.sectionIntro}>
        <span className={styles.kicker}>Full pipeline</span>
        <h3>Run every step for one topic</h3>
      </div>

      <div className={styles.actionGrid}>
        <article className={`${styles.card} ${styles.wideCard}`}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Run topic pipeline</h3>
            </div>
          </div>

          <p className={styles.cardText}>
            Execute the complete gap-analysis pipeline for one selected topic.
          </p>

          <form className={styles.topicForm} onSubmit={handleRunPipelineTopic}>
            <label>
              Topic ID
              <select
                value={pipelineTopicId}
                onChange={(event) => setPipelineTopicId(event.target.value)}
                disabled={pipelineLoading || topicsLoading}
              >
                <option value="">-- Select a topic --</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={pipelineLoading}
            >
              {pipelineLoading ? "Running pipeline..." : "Run topic pipeline"}
            </button>
          </form>

          {pipelineError && (
            <div className={styles.errorBox} role="alert">
              {pipelineError}
            </div>
          )}

          {pipelineResult && (
            <div className={styles.resultBox}>
              <span>Response</span>
              <pre>{pipelineResult}</pre>
            </div>
          )}
        </article>
      </div>

      <div className={styles.sectionIntro}>
        <span className={styles.kicker}>Extraction</span>
        <h3>Generate gap-analysis data</h3>
      </div>

      <div className={styles.actionGrid}>
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Extract all topics</h3>
            </div>
          </div>

          <p className={styles.cardText}>
            Trigger gap extraction for all available research topics.
          </p>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleExtractAll}
            disabled={extractGlobalLoading}
          >
            {extractGlobalLoading ? "Running extraction..." : "Run global extraction"}
          </button>

          {extractGlobalError && (
            <div className={styles.errorBox} role="alert">
              {extractGlobalError}
            </div>
          )}

          {extractGlobalResult && (
            <div className={styles.resultBox}>
              <span>Response</span>
              <pre>{extractGlobalResult}</pre>
            </div>
          )}
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Extract by topic</h3>
            </div>
          </div>

          <p className={styles.cardText}>
            Extract gap-analysis data for one selected topic.
          </p>

          <form className={styles.topicForm} onSubmit={handleExtractTopic}>
            <label>
              Topic ID
              <select
                value={extractTopicId}
                onChange={(event) => setExtractTopicId(event.target.value)}
                disabled={extractTopicLoading || topicsLoading}
              >
                <option value="">-- Select a topic --</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className={styles.secondaryButton}
              disabled={extractTopicLoading}
            >
              {extractTopicLoading ? "Running..." : "Run topic extraction"}
            </button>
          </form>

          {extractTopicError && (
            <div className={styles.errorBox} role="alert">
              {extractTopicError}
            </div>
          )}

          {extractTopicResult && (
            <div className={styles.resultBox}>
              <span>Response</span>
              <pre>{extractTopicResult}</pre>
            </div>
          )}
        </article>
      </div>

      <div className={styles.sectionIntro}>
        <span className={styles.kicker}>Pattern mining</span>
        <h3>Discover reusable gap patterns</h3>
      </div>

      <div className={styles.actionGrid}>
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Mine all patterns</h3>
            </div>
          </div>

          <p className={styles.cardText}>
            Discover recurring gap patterns across all extracted topic data.
          </p>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleMinePatternsAll}
            disabled={patternsGlobalLoading}
          >
            {patternsGlobalLoading ? "Mining patterns..." : "Mine global patterns"}
          </button>

          {patternsGlobalError && (
            <div className={styles.errorBox} role="alert">
              {patternsGlobalError}
            </div>
          )}

          {patternsGlobalResult && (
            <div className={styles.resultBox}>
              <span>Response</span>
              <pre>{patternsGlobalResult}</pre>
            </div>
          )}
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Mine patterns by topic</h3>
            </div>
          </div>

          <p className={styles.cardText}>
            Discover recurring gap patterns for one selected topic.
          </p>

          <form className={styles.topicForm} onSubmit={handleMinePatternsTopic}>
            <label>
              Topic ID
              <select
                value={patternsTopicId}
                onChange={(event) => setPatternsTopicId(event.target.value)}
                disabled={patternsTopicLoading || topicsLoading}
              >
                <option value="">-- Select a topic --</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className={styles.secondaryButton}
              disabled={patternsTopicLoading}
            >
              {patternsTopicLoading ? "Mining..." : "Mine topic patterns"}
            </button>
          </form>

          {patternsTopicError && (
            <div className={styles.errorBox} role="alert">
              {patternsTopicError}
            </div>
          )}

          {patternsTopicResult && (
            <div className={styles.resultBox}>
              <span>Response</span>
              <pre>{patternsTopicResult}</pre>
            </div>
          )}
        </article>
      </div>

      <div className={styles.sectionIntro}>
        <span className={styles.kicker}>Gap generation</span>
        <h3>Create research gap candidates</h3>
      </div>

      <div className={styles.actionGrid}>
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Generate all gaps</h3>
            </div>
          </div>

          <p className={styles.cardText}>
            Generate research gap candidates across all extracted topic data.
          </p>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleGenerateGapsAll}
            disabled={generateGlobalLoading}
          >
            {generateGlobalLoading ? "Generating gaps..." : "Generate global gaps"}
          </button>

          {generateGlobalError && (
            <div className={styles.errorBox} role="alert">
              {generateGlobalError}
            </div>
          )}

          {generateGlobalResult && (
            <div className={styles.resultBox}>
              <span>Response</span>
              <pre>{generateGlobalResult}</pre>
            </div>
          )}
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Generate gaps by topic</h3>
            </div>
          </div>

          <p className={styles.cardText}>
            Generate research gap candidates for one selected topic.
          </p>

          <form className={styles.topicForm} onSubmit={handleGenerateGapsTopic}>
            <label>
              Topic ID
              <select
                value={generateTopicId}
                onChange={(event) => setGenerateTopicId(event.target.value)}
                disabled={generateTopicLoading || topicsLoading}
              >
                <option value="">-- Select a topic --</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className={styles.secondaryButton}
              disabled={generateTopicLoading}
            >
              {generateTopicLoading ? "Generating..." : "Generate topic gaps"}
            </button>
          </form>

          {generateTopicError && (
            <div className={styles.errorBox} role="alert">
              {generateTopicError}
            </div>
          )}

          {generateTopicResult && (
            <div className={styles.resultBox}>
              <span>Response</span>
              <pre>{generateTopicResult}</pre>
            </div>
          )}
        </article>

        <article className={`${styles.card} ${styles.wideCard}`}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Regenerate gaps by topic</h3>
            </div>
          </div>

          <p className={styles.cardText}>
            Rebuild gap candidates for a topic when the underlying evidence has changed.
          </p>

          <form className={styles.topicForm} onSubmit={handleRegenerateGapsTopic}>
            <label>
              Topic ID
              <select
                value={regenerateTopicId}
                onChange={(event) => setRegenerateTopicId(event.target.value)}
                disabled={regenerateTopicLoading || topicsLoading}
              >
                <option value="">-- Select a topic --</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className={styles.secondaryButton}
              disabled={regenerateTopicLoading}
            >
              {regenerateTopicLoading ? "Regenerating..." : "Regenerate topic gaps"}
            </button>
          </form>

          {regenerateTopicError && (
            <div className={styles.errorBox} role="alert">
              {regenerateTopicError}
            </div>
          )}

          {regenerateTopicResult && (
            <div className={styles.resultBox}>
              <span>Response</span>
              <pre>{regenerateTopicResult}</pre>
            </div>
          )}
        </article>
      </div>

      <div className={styles.sectionIntro}>
        <span className={styles.kicker}>Quality assessment</span>
        <h3>Validate gap-analysis data</h3>
      </div>

      <div className={styles.actionGrid}>
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Assess all topics</h3>
            </div>
          </div>

          <p className={styles.cardText}>
            Run quality assessment for all available gap-analysis outputs.
          </p>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleAssessAll}
            disabled={globalLoading}
          >
            {globalLoading ? "Running assessment..." : "Run global assessment"}
          </button>

          {globalError && (
            <div className={styles.errorBox} role="alert">
              {globalError}
            </div>
          )}

          {globalResult && (
            <div className={styles.resultBox}>
              <span>Response</span>
              <pre>{globalResult}</pre>
            </div>
          )}
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Assess by topic</h3>
            </div>
          </div>

          <p className={styles.cardText}>
            Run quality assessment for one selected topic.
          </p>

          <form className={styles.topicForm} onSubmit={handleAssessTopic}>
            <label>
              Topic ID
              <select
                value={topicId}
                onChange={(event) => setTopicId(event.target.value)}
                disabled={topicLoading || topicsLoading}
              >
                <option value="">-- Select a topic --</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className={styles.secondaryButton} disabled={topicLoading}>
              {topicLoading ? "Running..." : "Run topic assessment"}
            </button>
          </form>

          {topicError && (
            <div className={styles.errorBox} role="alert">
              {topicError}
            </div>
          )}

          {topicResult && (
            <div className={styles.resultBox}>
              <span>Response</span>
              <pre>{topicResult}</pre>
            </div>
          )}
        </article>
      </div>

      <article className={styles.historyPanel}>
        <div className={styles.historyHeader}>
          <div>
            <span className={styles.kicker}>Recent tester runs</span>
            <h3>Local activity</h3>
          </div>
          <span>{runHistory.length} recorded</span>
        </div>

        {runHistory.length > 0 ? (
          <div className={styles.historyList}>
            {runHistory.map((item) => (
              <div className={styles.historyItem} key={item.id}>
                <div>
                  <strong>{item.scope}</strong>
                  <span>{formatTime(item.createdAt)}</span>
                </div>
                <p>{item.result}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>
            No gap-analysis action has been triggered from this screen yet.
          </p>
        )}
      </article>
    </section>
  );
}

export default AdminGapAnalysisPage;
