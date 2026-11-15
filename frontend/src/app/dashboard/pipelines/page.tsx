
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import {
  Activity,
  Clock,
  RefreshCw,
  Workflow,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { airflowService } from "@/services/airflow.service";

import type {
  AirflowDag,
  AirflowDagRun,
} from "@/services/airflow.service";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// DAG execution status badge
function StatusBadge({ state }: { state: string }) {
  const normalized = state?.toLowerCase() || "unknown";

  const styles: Record<string, string> = {
    success: "bg-green-100 text-green-700",
    running: "bg-blue-100 text-blue-700",
    queued: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[normalized] || "bg-muted text-muted-foreground"
      }`}
    >
      {normalized}
    </span>
  );
}

// Format date and time
function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN");
}

// Calculate DAG execution duration
function duration(run: AirflowDagRun) {
  if (!run.start_date) return "—";

  const start = new Date(run.start_date).getTime();

  const end = run.end_date
    ? new Date(run.end_date).getTime()
    : Date.now();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return "—";
  }

  const seconds = Math.max(
    0,
    Math.floor((end - start) / 1000)
  );

  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
}

export default function PipelinesPage() {
  const [dags, setDags] = useState<AirflowDag[]>([]);
  const [runs, setRuns] = useState<AirflowDagRun[]>([]);
  const [selectedDag, setSelectedDag] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch available Airflow DAGs
  const loadDags = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await airflowService.getDags();

      setDags(data);

      if (data.length > 0) {
        setSelectedDag((current) =>
          data.some((dag) => dag.dag_id === current)
            ? current
            : data[0].dag_id
        );
      } else {
        setRuns([]);
        setSelectedDag("");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to retrieve Airflow DAGs.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load DAGs when the page mounts
  useEffect(() => {
    loadDags();
  }, [loadDags]);

  // Fetch execution history for the selected DAG
  useEffect(() => {
    if (!selectedDag) return;

    let cancelled = false;

    async function loadRuns() {
      try {
        const data = await airflowService.getDagRuns(selectedDag);

        if (!cancelled) {
          setRuns(data);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setRuns([]);
          setError("Unable to retrieve DAG run history.");
        }
      }
    }

    loadRuns();

    return () => {
      cancelled = true;
    };
  }, [selectedDag]);

  // Calculate execution statistics
  const successfulRuns = runs.filter(
    (run) => run.state === "success"
  ).length;

  const failedRuns = runs.filter(
    (run) => run.state === "failed"
  ).length;

  const runningRuns = runs.filter(
    (run) => run.state === "running"
  ).length;

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        Loading pipeline information...
      </div>
    );
  }

  return (
    <main className="min-h-screen space-y-6 bg-muted/30 p-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Pipeline Monitoring
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Monitor your Apache Airflow ETL workflows.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/pipelines/documentation"
            className="inline-flex items-center rounded-md border bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            Documentation
          </Link>

          <Button variant="outline" onClick={loadDags}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh DAGs
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md border border-red-300 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Workflow className="h-8 w-8 text-primary" />

            <div>
              <p className="text-sm text-muted-foreground">
                Total DAGs
              </p>

              <h2 className="text-2xl font-bold">
                {dags.length}
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <CheckCircle className="h-8 w-8 text-green-600" />

            <div>
              <p className="text-sm text-muted-foreground">
                Successful runs
              </p>

              <h2 className="text-2xl font-bold">
                {successfulRuns}
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <XCircle className="h-8 w-8 text-red-600" />

            <div>
              <p className="text-sm text-muted-foreground">
                Failed runs
              </p>

              <h2 className="text-2xl font-bold">
                {failedRuns}
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Activity className="h-8 w-8 text-blue-600" />

            <div>
              <p className="text-sm text-muted-foreground">
                Running
              </p>

              <h2 className="text-2xl font-bold">
                {runningRuns}
              </h2>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Available DAGs */}
      <Card>
        <CardHeader>
          <CardTitle>Available DAGs</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {dags.map((dag) => (
            <button
              key={dag.dag_id}
              onClick={() => {
                setSelectedDag(dag.dag_id);
                setError("");
              }}
              className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition ${
                selectedDag === dag.dag_id
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted"
              }`}
            >
              <div>
                <p className="font-medium">
                  {dag.dag_id}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {dag.description || "No description available"}
                </p>
              </div>

              <span className="text-xs text-muted-foreground">
                {dag.is_paused ? "Paused" : "Active"}
              </span>
            </button>
          ))}

          {dags.length === 0 && (
            <p className="py-6 text-center text-muted-foreground">
              No DAGs returned by Airflow.
            </p>
          )}
        </CardContent>
      </Card>

      {/* DAG Run History */}
      <Card>
        <CardHeader>
          <CardTitle>
            Run History {selectedDag ? `— ${selectedDag}` : ""}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3">Run ID</th>
                  <th className="p-3">State</th>
                  <th className="p-3">Started</th>
                  <th className="p-3">Duration</th>
                </tr>
              </thead>

              <tbody>
                {runs.map((run) => (
                  <tr
                    key={run.dag_run_id}
                    className="border-b"
                  >
                    <td className="p-3 font-medium">
                      {run.dag_run_id}
                    </td>

                    <td className="p-3">
                      <StatusBadge state={run.state} />
                    </td>

                    <td className="p-3">
                      {formatDate(run.start_date)}
                    </td>

                    <td className="p-3">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {duration(run)}
                      </span>
                    </td>
                  </tr>
                ))}

                {runs.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No run history available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
