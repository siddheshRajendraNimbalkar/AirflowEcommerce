
from airflow import DAG

from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.providers.common.sql.operators.sql import (
    SQLExecuteQueryOperator
)

from airflow.operators.empty import EmptyOperator

from datetime import datetime, timedelta


def generate_report():

    print("Generating E-Commerce Sales Report")

    revenue = 93000

    print("Total Revenue:", revenue)


with DAG(
    dag_id="ecommerce_operators_pipeline",
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    tags=["ecommerce", "operators"],
    default_args={
        "owner": "data-engineering",
        "retries": 2,
        "retry_delay": timedelta(minutes=5),
    }
) as dag:

    start = EmptyOperator(
        task_id="start"
    )

    check_environment = BashOperator(
        task_id="check_environment",
        bash_command="python --version"
    )

    count_orders = SQLExecuteQueryOperator(
        task_id="count_orders",
        conn_id="ecommerce_postgres",
        sql="SELECT COUNT(*) FROM orders;"
    )

    generate_sales_report = PythonOperator(
        task_id="generate_sales_report",
        python_callable=generate_report
    )

    finish = EmptyOperator(
        task_id="finish"    
    )

    (
        start
        >> check_environment
        >> count_orders
        >> generate_sales_report
        >> finish
    )
