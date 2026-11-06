
from airflow.sdk import dag, task
from airflow.providers.postgres.hooks.postgres import PostgresHook

from datetime import timedelta
import pendulum
import logging


POSTGRES_CONN_ID = "ecommerce_postgres"


@dag(
    dag_id="ecommerce_postgres_etl",
    description="E-commerce PostgreSQL ETL pipeline",
    start_date=pendulum.datetime(2026, 1, 1, tz="Asia/Kolkata"),
    schedule="0 0 * * *",
    catchup=False,
    tags=["ecommerce", "postgres", "etl"],
    default_args={
        "owner": "data-engineering",
        "retries": 2,
        "retry_delay": timedelta(minutes=2),
    },
)
def ecommerce_postgres_etl():

    # TASK 1: EXTRACT
    @task
    def extract_orders():

        hook = PostgresHook(
            postgres_conn_id=POSTGRES_CONN_ID
        )

        sql = """
            SELECT
                order_id,
                total_amount::FLOAT,
                created_at::DATE::TEXT,
                order_status
            FROM orders
        """

        records = hook.get_records(sql)

        orders = [
            {
                "order_id": row[0],
                "total_amount": row[1],
                "report_date": row[2],
                "order_status": row[3],
            }
            for row in records
        ]

        logging.info("Extracted %s orders", len(orders))

        return orders

    # TASK 2: VALIDATE
    @task
    def validate_orders(orders):

        valid_orders = []

        for order in orders:

            if (
                order["order_id"] is not None
                and order["total_amount"] is not None
                and order["total_amount"] > 0
                and order["order_status"] != "CANCELLED"
            ):
                valid_orders.append(order)

        logging.info(
            "Valid orders: %s",
            len(valid_orders)
        )

        return valid_orders

    # TASK 3: TRANSFORM
    @task
    def transform_orders(orders):

        daily_sales = {}

        for order in orders:

            date = order["report_date"]

            if date not in daily_sales:
                daily_sales[date] = {
                    "total_orders": 0,
                    "total_revenue": 0.0,
                }

            daily_sales[date]["total_orders"] += 1

            daily_sales[date]["total_revenue"] += (
                order["total_amount"]
            )

        results = []

        for date, metrics in daily_sales.items():

            results.append({
                "report_date": date,
                "total_orders": metrics["total_orders"],
                "total_revenue": round(
                    metrics["total_revenue"], 2
                ),
            })

        logging.info(
            "Generated %s daily sales records",
            len(results)
        )

        return results

    # TASK 4: LOAD
    @task
    def load_analytics(results):

        hook = PostgresHook(
            postgres_conn_id=POSTGRES_CONN_ID
        )

        sql = """
            INSERT INTO sales_analytics (
                report_date,
                total_orders,
                total_revenue
            )
            VALUES (%s, %s, %s)
            ON CONFLICT (report_date)
            DO UPDATE SET
                total_orders = EXCLUDED.total_orders,
                total_revenue = EXCLUDED.total_revenue,
                created_at = CURRENT_TIMESTAMP;
        """

        for record in results:

            hook.run(
                sql,
                parameters=(
                    record["report_date"],
                    record["total_orders"],
                    record["total_revenue"],
                ),
            )

        logging.info(
            "Loaded %s analytics records",
            len(results)
        )

    # TASK DEPENDENCIES
    extracted = extract_orders()

    validated = validate_orders(extracted)

    transformed = transform_orders(validated)

    load_analytics(transformed)


ecommerce_postgres_etl()
