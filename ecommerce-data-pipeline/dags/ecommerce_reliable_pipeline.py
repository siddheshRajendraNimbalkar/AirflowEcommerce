
from airflow.sdk import dag, task
from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.operators.empty import EmptyOperator
from airflow.utils.trigger_rule import TriggerRule

from datetime import timedelta
import pendulum
import logging


def task_failure_alert(context):

    ti = context["ti"]

    logging.error("E-COMMERCE PIPELINE TASK FAILED")
    logging.error("DAG: %s", ti.dag_id)
    logging.error("Task: %s", ti.task_id)
    logging.error("Run: %s", ti.run_id)


@dag(
    dag_id="ecommerce_reliable_pipeline",

    description="Fault tolerant ecommerce ETL",

    start_date=pendulum.datetime(
        2026, 1, 1, tz="Asia/Kolkata"
    ),

    schedule=None,
    catchup=False,

    default_args={
        "owner": "data-engineering",
        "retries": 3,
        "retry_delay": timedelta(minutes=1),
        "retry_exponential_backoff": True,
        "max_retry_delay": timedelta(minutes=5),
        "on_failure_callback": task_failure_alert
    },

    tags=["ecommerce", "reliability"]
)
def ecommerce_reliable_pipeline():

    start = EmptyOperator(
        task_id="start"
    )

    @task(
        execution_timeout=timedelta(minutes=5)
    )
    def extract_orders():

        hook = PostgresHook(
            postgres_conn_id="ecommerce_postgres"
        )

        records = hook.get_records("""
            SELECT
                order_id,
                total_amount
            FROM orders
            WHERE order_status != 'CANCELLED'
        """)

        logging.info(
            "Extracted %s orders",
            len(records)
        )

        return records

    @task
    def transform_orders(orders):

        total_revenue = sum(
            float(order[1])
            for order in orders
        )

        logging.info(
            "Total revenue: ₹%s",
            total_revenue
        )

        return total_revenue

    @task
    def generate_report(revenue):

        logging.info("SALES REPORT")
        logging.info("Revenue: ₹%s", revenue)

    finish = EmptyOperator(
        task_id="finish",
        trigger_rule=TriggerRule.ALL_DONE
    )

    extracted = extract_orders()

    transformed = transform_orders(extracted)

    report = generate_report(transformed)

    start >> extracted >> transformed >> report >> finish


ecommerce_reliable_pipeline()
