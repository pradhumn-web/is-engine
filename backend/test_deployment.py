from fastapi.testclient import TestClient

from app.main import DATA, app

client = TestClient(app)


def test_production_homepage_serves_bis_spec_frontend():
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert b"BIS.SPEC" in response.content


def test_submission_guide_is_available_from_production_origin():
    response = client.get("/sih-user-guide.html")
    assert response.status_code == 200
    assert b"SIH" in response.content
    assert b"Local run" in response.content or b"Run locally" in response.content


def test_public_health_and_standards_endpoints():
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["standards_loaded"] == len(DATA["standards"])

    catalog = client.get("/api/v1/standards")
    assert catalog.status_code == 200
    assert catalog.json()["count"] == len(DATA["standards"])
