
from airflow import DAG
from airflow.providers.standard.sensors.python import PythonSensor
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import os
import csv
import logging
from datetime import datetime, timedelta

FILE_PATH = "/usr/local/airflow/include/data/orders.csv"


def check_file_exists():

    exists = os.path.exists(FILE_PATH)

    logging.info("Checking order file: %s", FILE_PATH)
    logging.info("File available: %s", exists)

    return exists


def process_orders():

    with open(FILE_PATH, "r") as file:

        reader = csv.DictReader(file)

        orders = list(reader)

    total_revenue = sum(
        int(order["quantity"]) * float(order["price"])
        for order in orders
    )

    logging.info("Total orders: %s", len(orders))
    logging.info("Total revenue: ₹%s", total_revenue)


with DAG(
    dag_id="ecommerce_file_sensor",
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    tags=["ecommerce", "sensors"],
    default_args={
        "owner": "data-engineering",
        "retries": 2,
        "retry_delay": timedelta(minutes=1),
    }
) as dag:

    wait_for_file = PythonSensor(
        task_id="wait_for_orders_file",
        python_callable=check_file_exists,
        poke_interval=30,
        timeout=600,
        mode="reschedule"
    )

    process_file = PythonOperator(
        task_id="process_orders",
        python_callable=process_orders
    )

    wait_for_file >> process_file
