
from airflow.sdk import dag, task
from airflow.providers.postgres.hooks.postgres import PostgresHook
import pendulum
from datetime import timedelta

@dag(
    dag_id="test_postgres_connection",
    start_date=pendulum.datetime(
        2026, 1, 1, tz="UTC"
    ),
    schedule=None,
    catchup=False,
    tags=["ecommerce", "postgres"],
    default_args={
        "owner": "data-engineering",
        "retries": 2,
        "retry_delay": timedelta(minutes=1),
    }
)
def test_postgres_connection():

    @task
    def check_database():

        hook = PostgresHook(
            postgres_conn_id="ecommerce_postgres"
        )

        result = hook.get_first(
            "SELECT current_database(), version();"
        )

        print("Database:", result[0])
        print("PostgreSQL version:", result[1])

        return result[0]

    check_database()


test_postgres_connection()
