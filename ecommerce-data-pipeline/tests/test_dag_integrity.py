from airflow.models import DagBag


def test_dags_load_without_errors():
    dag_bag = DagBag(
        dag_folder="dags/",
        include_examples=False
    )

    assert not dag_bag.import_errors


def test_incremental_etl_dag_exists():
    dag_bag = DagBag(
        dag_folder="dags/",
        include_examples=False
    )

    assert "ecommerce_incremental_etl" in dag_bag.dags