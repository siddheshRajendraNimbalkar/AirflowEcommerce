from airflow.sdk import dag, task, task_group
import pendulum
import logging
from datetime import datetime, timedelta

@dag(
    dag_id="ecommerce_task_groups",
    start_date=pendulum.datetime(2026, 1, 1, tz="UTC"),
    schedule=None,
    catchup=False,
    tags=["ecommerce", "task-groups"],
    default_args = {
        "retries": 3,
        "retry_delay": timedelta(minutes=1),
        "retry_exponential_backoff": True,
        "max_retry_delay": timedelta(minutes=10)
    }
)
def ecommerce_task_groups():

    # GROUP 1: EXTRACTION
    @task_group(group_id="extraction")
    def extraction_group():

        @task
        def extract_customers():
            logging.info("Extracting customers")

            return ["Rahul", "Priya", "Amit"]

        @task
        def extract_products():
            logging.info("Extracting products")

            return ["Laptop", "Mobile", "Headphones"]

        @task
        def extract_orders():
            logging.info("Extracting orders")

            return [1000, 2000, 3000]

        customers = extract_customers()
        products = extract_products()
        orders = extract_orders()

        return customers, products, orders

    # GROUP 2: TRANSFORMATION
    @task_group(group_id="transformation")
    def transformation_group(data):

        customers, products, orders = data

        @task
        def transform_orders(order_amounts):
            total_revenue = sum(order_amounts)

            logging.info(
                "Total revenue: ₹%s",
                total_revenue
            )

            return total_revenue

        @task
        def transform_products(product_list):
            logging.info(
                "Processing %s products",
                len(product_list)
            )

            return product_list

        revenue = transform_orders(orders)
        transformed_products = transform_products(products)

        return revenue

    # GROUP 3: LOADING
    @task_group(group_id="loading")
    def loading_group(revenue):

        @task
        def load_analytics(total_revenue):
            logging.info(
                "Loading revenue: ₹%s",
                total_revenue
            )

        load_analytics(revenue)

    extracted_data = extraction_group()

    transformed_revenue = transformation_group(
        extracted_data
    )

    loading_group(transformed_revenue)


ecommerce_task_groups()
