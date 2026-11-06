
from airflow.sdk import dag, task
import pendulum
import logging
from datetime import timedelta

@dag(
    dag_id="ecommerce_dynamic_mapping",
    start_date=pendulum.datetime(2026, 1, 1, tz="UTC"),
    schedule=None,
    catchup=False,
    tags=["ecommerce", "dynamic-mapping"],
    default_args = {
        "owner": "data-engineering",
        "retries": 2,
        "retry_delay": timedelta(minutes=1),
    }
)
def ecommerce_dynamic_mapping():

    # TASK 1: GET CATEGORIES
    @task
    def get_categories():

        categories = [
            "Electronics",
            "Clothing",
            "Books",
            "Furniture",
            "Sports"
        ]

        logging.info("Categories: %s", categories)

        return categories

    # TASK 2: PROCESS EACH CATEGORY
    @task
    def process_category(category):

        logging.info(
            "Processing category: %s",
            category
        )

        # Simulate category processing
        return {
            "category": category,
            "status": "processed"
        }

    # TASK 3: GENERATE REPORT
    @task
    def generate_report(results):

        logging.info("Category processing report")

        for result in results:
            logging.info(
                "%s: %s",
                result["category"],
                result["status"]
            )

        logging.info(
            "Total processed: %s",
            len(results)
        )

    categories = get_categories()

    processed_results = process_category.expand(
        category=categories
    )

    generate_report(processed_results)


ecommerce_dynamic_mapping()
