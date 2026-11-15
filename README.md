# E-Commerce Data Platform

An end-to-end e-commerce data platform that combines a Go backend, a Next.js dashboard, PostgreSQL, and Apache Airflow (managed locally with Astronomer Astro).

The project brings operational e-commerce data and data-pipeline visibility into one application. The backend exposes REST APIs for orders, customers, products, analytics, and Airflow DAG information. The frontend provides the dashboard interface, while Airflow orchestrates data workflows.

## Architecture

```text
                  ┌─────────────────────────┐
                  │   Next.js Dashboard     │
                  │   React + TypeScript    │
                  │   http://localhost:3000 │
                  └────────────┬────────────┘
                               │ REST API
                               ▼
                  ┌─────────────────────────┐
                  │      Go Backend         │
                  │      Gin Framework      │
                  │   http://localhost:8081│
                  └───────┬─────────┬───────┘
                          │         │
                 SQL      │         │ Airflow REST API
                          ▼         ▼
                ┌────────────┐  ┌────────────────────┐
                │ PostgreSQL │  │ Apache Airflow     │
                │            │  │ Astro environment  │
                └────────────┘  │ localhost:8080     │
                                └────────────────────┘
```

### Technology stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Recharts, lucide-react |
| Backend | Go, Gin, pgx |
| Database | PostgreSQL |
| Query generation | SQLC |
| Database migrations | golang-migrate |
| Workflow orchestration | Apache Airflow 3, Astronomer Astro |
| Local containers | Docker, Docker Compose |

## Project structure

```text
ecommerce-platform/
├── backend/
│   ├── cmd/
│   ├── internal/
│   │   ├── airflow/
│   │   ├── ...
│   ├── Dockerfile
│   ├── .env                 # Local environment variables; do not commit
│   └── ...
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── .env.local           # Local environment variables; do not commit
│   └── ...
├── ecommerce-data-pipeline/
│   ├── dags/
│   ├── .astro/
│   ├── Dockerfile
│   └── ...
├── docker-compose.yml
└── README.md
```

The tree is representative; individual source files may differ as the project evolves.

## Services and local URLs

| Service | URL |
|---|---|
| Next.js frontend | http://localhost:3000 |
| Go backend | http://localhost:8081 |
| Backend API base | http://localhost:8081/api/v1 |
| Airflow API / UI | http://localhost:8080 |

The Astro project may also expose its Airflow UI through an Astro-managed local hostname. Use the URL printed by `astro dev start` if that differs from `http://localhost:8080`.

## Prerequisites

Install the following before starting the project:

- Git
- Docker Desktop with WSL 2 integration enabled (for Windows)
- Docker Compose
- Go (for running or developing the backend outside Docker)
- Node.js 22 and npm (for running or developing the frontend outside Docker)
- Astronomer Astro CLI (for the Airflow project)

Check installations:

```bash
docker --version
docker compose version
go version
node --version
npm --version
astro version
```

## Configuration

Create the environment files locally. Do not commit real credentials, tokens, or passwords.

### Backend: `backend/.env`

The backend configuration uses the following variables:

```env
APP_PORT=8081

DB_HOST=localhost
DB_PORT=5432
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
DB_SSLMODE=disable

DATABASE_URL=postgres://your_database_user:your_database_password@localhost:5432/your_database_name?sslmode=disable

AIRFLOW_BASE_URL=http://localhost:8080
AIRFLOW_USERNAME=admin
AIRFLOW_PASSWORD=your_airflow_password
```

Use the actual database credentials and database name configured by your local Astro/PostgreSQL environment. The values above are placeholders, not default credentials.

When the backend runs inside the root Docker Compose network, the Compose configuration overrides `DB_HOST` and `AIRFLOW_BASE_URL` to use `host.docker.internal` to reach services exposed by the host. When running the backend directly on the host, use the host-accessible values instead.

### Frontend: `frontend/.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081/api/v1
```

The frontend Docker image also receives this value as a build argument. If the API address changes, update the frontend configuration and rebuild the image.

### Secrets and Git

Ensure the following are excluded from version control:

```gitignore
.env
.env.*
!.env.example
```

Keep actual secrets in local environment files or a secret manager. Never paste passwords or access tokens into source control, issue trackers, or public documentation.

## Running the project with Docker

Run commands from the project root:

```bash
cd /mnt/c/Users/nimba/Coder/ecommerce-platform
```

Build and start the frontend and backend:

```bash
docker compose up -d --build
```

Check container status:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

Stop the frontend and backend containers:

```bash
docker compose stop
```

Start them again:

```bash
docker compose start
```

To rebuild only the backend after changing backend code or its environment:

```bash
docker compose up -d --build backend
```

To rebuild only the frontend:

```bash
docker compose up -d --build frontend
```

> **Database safety:** The Astro environment owns the project's PostgreSQL service. Start and stop it through the Astro project. Do not add a second PostgreSQL service to the root Compose file, and do not use volume-removal commands such as `docker compose down -v` unless you intentionally want to delete persisted data.

## Starting Airflow with Astro

Open a separate terminal and move into the Airflow project:

```bash
cd /mnt/c/Users/nimba/Coder/ecommerce-platform/ecommerce-data-pipeline
```

Start the local Airflow environment:

```bash
astro dev start
```

Check the Astro environment:

```bash
astro dev ps
```

Stop the Astro environment when required:

```bash
astro dev stop
```

Use the Airflow URL reported by Astro. In the current local setup, the Airflow API is available at:

```text
http://localhost:8080
```

The backend connects to Airflow using its REST API and configured Simple Auth Manager credentials. The configured user in the current development setup is `admin`; its password is generated by Airflow and should be read locally from the configured password file. Do not place the generated password in this README.

## API endpoints

The backend API base URL is:

```text
http://localhost:8081/api/v1
```

The following endpoints have been exercised successfully in the current development environment:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/orders` | Retrieve orders |
| GET | `/customers` | Retrieve customers |
| GET | `/products` | Retrieve products |
| GET | `/analytics/overview` | Retrieve dashboard overview metrics |
| GET | `/airflow/dags` | Retrieve DAG information from Airflow |

Example requests:

```bash
curl -i http://localhost:8081/api/v1/orders
curl -i http://localhost:8081/api/v1/customers
curl -i http://localhost:8081/api/v1/products
curl -i http://localhost:8081/api/v1/analytics/overview
curl -i http://localhost:8081/api/v1/airflow/dags
```

These are the endpoints verified so far; consult the backend route definitions for the complete and current API contract.

## Development

### Backend

For local Go development, open a terminal in `backend/` and use the project's Go module and entry point:

```bash
cd backend
go mod download
go run ./cmd/api
```

The backend expects its environment variables to be available. For local development, it can load them from `backend/.env`.

### Frontend

For local Next.js development:

```bash
cd frontend
npm ci
npm run dev
```

Open:

```text
http://localhost:3000
```

For a production build:

```bash
npm run build
npm run start
```

### Airflow DAG development

Place and maintain DAG definitions in the Airflow project's DAG directory. Start or restart the Astro environment after making changes if required, then inspect DAG status and task runs in the Airflow UI.

## Troubleshooting

### Backend cannot connect to PostgreSQL

- Confirm the Astro environment is running: `astro dev ps`.
- Confirm PostgreSQL is listening on port `5432`.
- Check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`.
- Remember that `localhost` inside a container refers to that container, not the Windows/WSL host. The root Compose configuration uses `host.docker.internal` for host-exposed services.

### Backend cannot authenticate with Airflow

- Confirm the Airflow API is reachable at `http://localhost:8080`.
- Check `AIRFLOW_BASE_URL`, `AIRFLOW_USERNAME`, and `AIRFLOW_PASSWORD`.
- The Airflow Simple Auth Manager password is generated and stored in its configured password file inside the Airflow container.
- After changing backend environment variables, recreate the backend:

```bash
docker compose up -d --build backend
```

- Test the integration:

```bash
curl -i http://localhost:8081/api/v1/airflow/dags
```

### Frontend cannot reach the backend

- Confirm the backend is running and responds at `http://localhost:8081`.
- Confirm `NEXT_PUBLIC_API_BASE_URL` is `http://localhost:8081/api/v1` for browser access.
- Rebuild the frontend after changing a build-time public API URL:

```bash
docker compose up -d --build frontend
```

### Inspect logs

```bash
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend
```

For Airflow, inspect the relevant Astro service logs through Docker or the Astro CLI.

## Current development status

The following parts have been verified in the local environment:

- Astro Airflow services and PostgreSQL are running.
- The Go backend starts successfully in Docker.
- The Next.js frontend starts successfully in Docker.
- Orders, customers, products, and analytics overview API requests return `200 OK`.
- The backend successfully authenticates with Airflow and retrieves DAG information (`200 OK`).

The project is under active development. Update this section as additional features, endpoints, tests, and deployment environments are completed.

## Contributing

1. Create a feature branch.
2. Make focused changes in the relevant service.
3. Run the relevant checks and test the affected API or UI flow.
4. Do not commit `.env` files, generated credentials, or other secrets.
5. Update this README when setup steps, environment variables, or API contracts change.

## License

No license has been specified yet. Add a `LICENSE` file and update this section before distributing the project publicly.
