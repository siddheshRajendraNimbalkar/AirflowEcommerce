
from airflow.sdk import dag, task
import pendulum
import logging
from datetime import timedelta

@dag(
    dag_id="ecommerce_data_pipeline",
    description="E-commerce ETL pipeline",
    schedule="*/5 * * * *",
    start_date=pendulum.datetime(2026, 1, 1, tz="UTC"),
    catchup=False,
    tags=["ecommerce", "etl", "beginner"],
    default_args = {
        "owner": "data-engineering",
        "retries": 2,
        "retry_delay": timedelta(minutes=2),
    }
)
def ecommerce_data_pipeline():

    # TASK 1: EXTRACT
    @task
    def extract_orders():

        orders = [
            {
                "order_id": 101,
                "customer_id": 1,
                "product": "Laptop",
                "quantity": 1,
                "price": 60000
            },
            {
                "order_id": 102,
                "customer_id": 2,
                "product": "Mobile",
                "quantity": 2,
                "price": 15000
            },
            {
                "order_id": 103,
                "customer_id": 3,
                "product": "Headphones",
                "quantity": 1,
                "price": 3000
            }
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
                and order["customer_id"] is not None
                and order["quantity"] > 0
                and order["price"] > 0
            ):
                valid_orders.append(order)

        if not valid_orders:
            raise ValueError("No valid orders found")

        logging.info(
            "Validated %s orders",
            len(valid_orders)
        )

        return valid_orders

    # TASK 3: TRANSFORM
    @task
    def transform_orders(orders):

        transformed_orders = []

        for order in orders:

            total_amount = (
                order["quantity"] * order["price"]
            )

            transformed_orders.append({
                **order,
                "total_amount": total_amount
            })

        logging.info("Orders transformed successfully")

        return transformed_orders

    # TASK 4: REPORT
    @task
    def generate_report(orders):

        total_orders = len(orders)

        total_revenue = sum(
            order["total_amount"]
            for order in orders
        )

        report = {
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "average_order_value": (
                total_revenue / total_orders
            )
        }

        logging.info("E-COMMERCE SALES REPORT")
        logging.info("Total Orders: %s", total_orders)
        logging.info("Total Revenue: ₹%s", total_revenue)
        logging.info(
            "Average Order Value: ₹%.2f",
            report["average_order_value"]
        )

        return report

    # DEFINE TASK DEPENDENCIES
    extracted = extract_orders()

    validated = validate_orders(extracted)

    transformed = transform_orders(validated)

    generate_report(transformed)


ecommerce_data_pipeline()
    