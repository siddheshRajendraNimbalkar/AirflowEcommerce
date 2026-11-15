
import { api } from "@/lib/api";

export interface AirflowDag {
  dag_id: string;
  is_paused: boolean;
  is_active?: boolean;
  description?: string;
}

export interface AirflowDagRun {
  dag_run_id: string;
  dag_id: string;
  state: string;
  start_date: string | null;
  end_date: string | null;
  logical_date?: string;
}

export const airflowService = {
  async getDags(): Promise<AirflowDag[]> {
    const response = await api.get("/airflow/dags");
    const result = response.data;

    return Array.isArray(result)
      ? result
      : result.dags ?? result.data ?? [];
  },

  async getDagRuns(dagId: string): Promise<AirflowDagRun[]> {
    const response = await api.get(
      `/airflow/dags/${encodeURIComponent(dagId)}/runs`
    );

    const result = response.data;

    return Array.isArray(result)
      ? result
      : result.dag_runs ?? result.data ?? [];
  },
};
