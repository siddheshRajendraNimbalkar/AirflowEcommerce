
import Link from "next/link";
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  GitBranch,
  Layers3,
  Server,
  Workflow,
} from "lucide-react";

const dags = [
  {
    name: "ecommerce_postgres_etl",
    type: "Daily Batch ETL",
    schedule: "Daily at 12:00 AM",
    frequency: "Once per day",
    description:
      "Aggregates order information and generates daily sales analytics.",
    output: "sales_analytics",
    color: "blue",
    tasks: [
      {
        name: "Extract Orders",
        description: "Reads order records from the PostgreSQL orders table.",
      },
      {
        name: "Validate Orders",
        description:
          "Checks order IDs, positive amounts and cancelled order status.",
      },
      {
        name: "Transform Data",
        description:
          "Groups valid orders by report date and calculates order count and revenue.",
      },
      {
        name: "Load Analytics",
        description:
          "Upserts daily aggregates into sales_analytics.",
      },
    ],
  },
  {
    name: "ecommerce_incremental_etl",
    type: "Incremental ETL",
    schedule: "Every 5 minutes",
    frequency: "*/5 * * * *",
    description:
      "Detects new or updated orders and maintains an incrementally processed dataset.",
    output: "processed_orders + etl_watermarks",
    color: "purple",
    tasks: [
      {
        name: "Extract Orders",
        description:
          "Reads the watermark and fetches orders changed since that timestamp, with a five-minute overlap.",
      },
      {
        name: "Validate Orders",
        description:
          "Checks order ID, amount, status, created_at and updated_at.",
      },
      {
        name: "Load Orders",
        description:
          "Upserts records into processed_orders using order_id as the conflict key.",
      },
      {
        name: "Update Watermark",
        description:
          "Advances the pipeline watermark to the latest successfully loaded update timestamp.",
      },
      {
        name: "Data Quality Check",
        description:
          "Checks processed records for invalid or missing values.",
      },
    ],
  },
];

const integrations = [
  {
    title: "Frontend → Backend",
    detail:
      "The Next.js application calls the Go REST API using HTTP requests.",
    icon: Layers3,
  },
  {
    title: "Backend → Airflow",
    detail:
      "The Go backend communicates with the Airflow REST API to retrieve DAG information and DAG run history.",
    icon: Workflow,
  },
  {
    title: "Airflow → PostgreSQL",
    detail:
      "Airflow DAG tasks use the configured PostgreSQL connection to extract and load data.",
    icon: Database,
  },
  {
    title: "Backend → PostgreSQL",
    detail:
      "The Go backend uses pgx and SQLC-generated queries to read and manage application and analytics data.",
    icon: Server,
  },
];

const tables = [
  {
    name: "orders",
    purpose: "Operational source data containing customer, product, quantity, amount, status and timestamps.",
    writer: "Go backend",
    reader: "Both Airflow DAGs and Go backend",
  },
  {
    name: "sales_analytics",
    purpose: "Stores daily order counts and revenue aggregates.",
    writer: "Daily batch ETL DAG",
    reader: "Go analytics API",
  },
  {
    name: "processed_orders",
    purpose: "Stores incrementally processed order records.",
    writer: "Incremental ETL DAG",
    reader: "Data processing and quality checks",
  },
  {
    name: "etl_watermarks",
    purpose: "Stores the last processed timestamp for each incremental pipeline.",
    writer: "Incremental ETL DAG",
    reader: "Incremental ETL DAG",
  },
];

const apis = [
  {
    method: "GET",
    path: "/api/v1/airflow/dags",
    purpose: "Retrieves available Airflow DAGs.",
  },
  {
    method: "GET",
    path: "/api/v1/airflow/dags/:dag_id/runs",
    purpose: "Retrieves execution history for a selected DAG.",
  },
  {
    method: "GET",
    path: "/api/v1/analytics/overview",
    purpose: "Returns total orders, revenue and average order value.",
  },
  {
    method: "GET",
    path: "/api/v1/analytics/revenue",
    purpose: "Returns daily revenue aggregates from sales_analytics.",
  },
  {
    method: "GET",
    path: "/api/v1/analytics/top-products",
    purpose: "Returns top products based on order data.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
        {eyebrow}
      </p>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FlowBox({
  title,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs opacity-75">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default function PipelineDocumentationPage() {
  return (
    <main className="min-h-screen space-y-10 bg-muted/30 p-6 lg:p-8">
      {/* Header */}
      <header className="space-y-4">
        <Link
          href="/dashboard/pipelines"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pipeline Monitoring
        </Link>

        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Workflow className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Pipeline Documentation
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Technical documentation of the E-Commerce Data Platform,
              including Airflow workflows, backend integration, data
              processing and analytics architecture.
            </p>
          </div>
        </div>
      </header>

      {/* Architecture */}
      <section>
        <SectionHeading
          eyebrow="01 — System Architecture"
          title="How the platform works"
          description="An overview of how the frontend, backend, Airflow and PostgreSQL interact."
        />

        <div className="rounded-xl border bg-card p-5 sm:p-7">
          <div className="mx-auto max-w-2xl space-y-2">
            <FlowBox
              title="Next.js Frontend"
              subtitle="Dashboard · Orders · Products · Analytics · Pipeline Monitoring"
              icon={Layers3}
              color="border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300"
            />

            <div className="flex flex-col items-center text-muted-foreground">
              <ArrowDown className="h-5 w-5" />
              <span className="text-xs">HTTP / REST API</span>
            </div>

            <FlowBox
              title="Go Backend — Gin"
              subtitle="API handlers · Services · SQLC · pgx · Airflow integration"
              icon={Server}
              color="border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
            />

            <div className="grid gap-4 pt-2 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex flex-col items-center text-muted-foreground">
                  <ArrowDown className="h-5 w-5" />
                  <span className="text-xs">Airflow REST API</span>
                </div>
                <FlowBox
                  title="Apache Airflow"
                  subtitle="DAG scheduling, execution and monitoring"
                  icon={Workflow}
                  color="border-purple-500/30 bg-purple-500/5 text-purple-700 dark:text-purple-300"
                />
              </div>

              <div className="space-y-2">
                <div className="flex flex-col items-center text-muted-foreground">
                  <ArrowDown className="h-5 w-5" />
                  <span className="text-xs">SQL queries</span>
                </div>
                <FlowBox
                  title="PostgreSQL"
                  subtitle="Operational and analytical database"
                  icon={Database}
                  color="border-orange-500/30 bg-orange-500/5 text-orange-700 dark:text-orange-300"
                />
              </div>
            </div>

            <p className="pt-3 text-center text-xs text-muted-foreground">
              Airflow and the Go backend both connect to PostgreSQL for
              different responsibilities. The backend also communicates
              separately with Airflow to retrieve workflow information.
            </p>
          </div>
        </div>
      </section>

      {/* DAG documentation */}
      <section>
        <SectionHeading
          eyebrow="02 — Workflow Documentation"
          title="Airflow DAGs"
          description="The platform uses batch and incremental processing for different data engineering requirements."
        />

        <div className="grid gap-5 xl:grid-cols-2">
          {dags.map((dag, index) => (
            <article
              key={dag.name}
              className="rounded-xl border bg-card p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  {index === 0 ? (
                    <BarChart3 className="h-5 w-5" />
                  ) : (
                    <Activity className="h-5 w-5" />
                  )}
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {dag.type}
                </span>
              </div>

              <h3 className="break-all text-lg font-bold">{dag.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {dag.description}
              </p>

              <div className="my-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/70 p-3">
                  <Clock className="mb-2 h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Schedule</p>
                  <p className="mt-1 text-sm font-semibold">
                    {dag.schedule}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/70 p-3">
                  <Database className="mb-2 h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Output</p>
                  <p className="mt-1 break-words text-sm font-semibold">
                    {dag.output}
                  </p>
                </div>
              </div>

              <h4 className="mb-3 text-sm font-semibold">Task execution flow</h4>
              <div className="space-y-2">
                {dag.tasks.map((task, taskIndex) => (
                  <div key={task.name}>
                    <div className="rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {taskIndex + 1}
                        </span>
                        <p className="text-sm font-semibold">{task.name}</p>
                      </div>
                      <p className="mt-2 pl-8 text-xs leading-relaxed text-muted-foreground">
                        {task.description}
                      </p>
                    </div>
                    {taskIndex < dag.tasks.length - 1 && (
                      <div className="flex justify-center py-1 text-muted-foreground">
                        <ArrowDown className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Backend integration */}
      <section>
        <SectionHeading
          eyebrow="03 — Service Integration"
          title="Backend and Airflow communication"
          description="The Go backend acts as the integration layer between the frontend and Airflow."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {integrations.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-xl border bg-card p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border bg-card p-5">
          <h3 className="mb-3 font-semibold">Airflow API endpoints exposed by Go</h3>
          <div className="space-y-3">
            {apis.slice(0, 2).map((api) => (
              <div
                key={api.path}
                className="flex flex-col gap-2 border-b pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <span className="w-fit rounded bg-emerald-500/10 px-2 py-1 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  {api.method}
                </span>
                <code className="break-all text-xs">{api.path}</code>
                <span className="text-xs text-muted-foreground sm:ml-auto">
                  {api.purpose}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics */}
      <section>
        <SectionHeading
          eyebrow="04 — Analytics Architecture"
          title="How analytics connects to Airflow"
          description="The daily ETL DAG produces aggregated data, which the Go backend exposes to the frontend."
        />

        <div className="rounded-xl border bg-card p-5 sm:p-7">
          <div className="mx-auto max-w-xl space-y-2">
            {[
              ["PostgreSQL — orders", "Operational order records"],
              ["Airflow — Daily ETL", "Extract · Validate · Transform · Load"],
              ["PostgreSQL — sales_analytics", "Daily order count and revenue"],
              ["Go Analytics API", "SQLC queries and JSON responses"],
              ["Next.js Dashboard", "Revenue chart and analytics display"],
            ].map(([title, description], index) => (
              <div key={title}>
                <div className="rounded-lg border bg-muted/40 p-4 text-center">
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {description}
                  </p>
                </div>
                {index < 4 && (
                  <div className="flex justify-center py-1 text-muted-foreground">
                    <ArrowDown className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-sm font-semibold">Important data-flow distinction</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  The revenue endpoint reads the sales_analytics table populated
                  by the daily DAG. The overview and top-products endpoints
                  currently query operational tables through the Go backend.
                  The incremental DAG writes to processed_orders and does not
                  currently write to sales_analytics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics APIs */}
      <section>
        <SectionHeading
          eyebrow="05 — API Reference"
          title="Analytics API endpoints"
          description="The frontend consumes these Go backend endpoints to display analytical information."
        />

        <div className="overflow-hidden rounded-xl border bg-card">
          {apis.slice(2).map((api) => (
            <div
              key={api.path}
              className="flex flex-col gap-2 border-b p-4 last:border-0 sm:flex-row sm:items-center"
            >
              <span className="w-fit rounded bg-emerald-500/10 px-2 py-1 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {api.method}
              </span>
              <code className="break-all text-xs">{api.path}</code>
              <span className="text-xs text-muted-foreground sm:ml-auto">
                {api.purpose}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Database */}
      <section>
        <SectionHeading
          eyebrow="06 — Data Storage"
          title="Database table responsibilities"
          description="The main PostgreSQL tables involved in application operations and ETL processing."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {tables.map((table) => (
            <div key={table.name} className="rounded-xl border bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <h3 className="font-mono text-sm font-bold">{table.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {table.purpose}
              </p>
              <div className="mt-4 space-y-2 border-t pt-3 text-xs">
                <p>
                  <span className="text-muted-foreground">Writer: </span>
                  {table.writer}
                </p>
                <p>
                  <span className="text-muted-foreground">Reader: </span>
                  {table.reader}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Operations */}
      <section>
        <SectionHeading
          eyebrow="07 — Operations"
          title="Scheduling and monitoring"
          description="How the workflows are scheduled and how their execution is monitored."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-5">
            <Clock className="mb-3 h-5 w-5 text-primary" />
            <h3 className="font-semibold">Daily Batch Schedule</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The daily analytics DAG is scheduled at midnight using the
              Asia/Kolkata timezone.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <Activity className="mb-3 h-5 w-5 text-primary" />
            <h3 className="font-semibold">Incremental Schedule</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The incremental DAG runs every five minutes to detect changes
              in existing orders and process new updates.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <GitBranch className="mb-3 h-5 w-5 text-primary" />
            <h3 className="font-semibold">Retry and Execution Control</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The incremental DAG is configured with two retries and a
              two-minute retry delay, and limits concurrent DAG runs to one.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <ArrowLeftRight className="mb-3 h-5 w-5 text-primary" />
            <h3 className="font-semibold">Pipeline Monitoring</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The Pipeline Monitoring page retrieves DAG information and
              run history through the Go backend.
            </p>
            <Link
              href="/dashboard/pipelines"
              className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
            >
              Open Pipeline Monitoring
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t pt-5 text-center text-xs text-muted-foreground">
        E-Commerce Data Platform · Architecture and Pipeline Documentation
      </footer>
    </main>
  );
}
