from unittest.mock import AsyncMock, MagicMock

import pytest

from models import ApplicationPipeline, PipelineStage


class TestPipelineStage:
    def test_all_stages_exist(self):
        stages = list(PipelineStage)
        assert len(stages) == 7
        assert PipelineStage.RESUME_UPLOADED.value == "resume_uploaded"
        assert PipelineStage.INTERVIEW_READY.value == "interview_ready"

    def test_stages_are_strings(self):
        for stage in PipelineStage:
            assert isinstance(stage.value, str)


class TestApplicationPipelineModel:
    def test_get_completed_empty(self, db_session):
        from models import Application, ApplicationPipeline
        app = Application(company="Test", role="Dev", job_description="jd")
        db_session.add(app)
        db_session.commit()
        pipeline = ApplicationPipeline(application_id=app.id)
        db_session.add(pipeline)
        db_session.commit()
        assert pipeline.get_completed() == []

    def test_advance_to(self, db_session):
        from models import Application, ApplicationPipeline
        app = Application(company="Test", role="Dev", job_description="jd")
        db_session.add(app)
        db_session.commit()
        pipeline = ApplicationPipeline(application_id=app.id)
        db_session.add(pipeline)
        db_session.commit()

        pipeline.advance_to(PipelineStage.APPLICATION_SAVED)
        db_session.commit()

        assert pipeline.current_stage == "application_saved"
        assert pipeline.get_completed() == ["resume_uploaded"]

    def test_advance_multiple_stages(self, db_session):
        from models import Application, ApplicationPipeline
        app = Application(company="Test", role="Dev", job_description="jd")
        db_session.add(app)
        db_session.commit()
        pipeline = ApplicationPipeline(application_id=app.id)
        db_session.add(pipeline)
        db_session.commit()

        pipeline.advance_to(PipelineStage.APPLICATION_SAVED)
        pipeline.advance_to(PipelineStage.COVER_LETTER_READY)
        pipeline.advance_to(PipelineStage.INTERVIEW_READY)
        db_session.commit()

        assert pipeline.current_stage == "interview_ready"
        completed = pipeline.get_completed()
        assert "resume_uploaded" in completed
        assert "application_saved" in completed
        assert "cover_letter_ready" in completed


class TestPipelineService:
    def test_get_or_create_pipeline(self, db_session):
        from models import Application
        from services.pipeline import get_or_create_pipeline
        app = Application(company="Test", role="Dev", job_description="jd")
        db_session.add(app)
        db_session.commit()

        pipeline = get_or_create_pipeline(db_session, app.id)
        assert pipeline is not None
        assert pipeline.application_id == app.id
        assert pipeline.current_stage == "resume_uploaded"

    def test_get_or_create_returns_existing(self, db_session):
        from models import Application
        from services.pipeline import get_or_create_pipeline, advance_pipeline
        app = Application(company="Test", role="Dev", job_description="jd")
        db_session.add(app)
        db_session.commit()

        advance_pipeline(db_session, app.id, PipelineStage.APPLICATION_SAVED)
        pipeline = get_or_create_pipeline(db_session, app.id)
        assert pipeline.current_stage == "application_saved"

    def test_advance_pipeline(self, db_session):
        from models import Application
        from services.pipeline import advance_pipeline
        app = Application(company="Test", role="Dev", job_description="jd")
        db_session.add(app)
        db_session.commit()

        pipeline = advance_pipeline(db_session, app.id, PipelineStage.APPLICATION_SAVED)
        assert pipeline.current_stage == "application_saved"
        assert "resume_uploaded" in pipeline.get_completed()

    def test_get_pipeline_status(self, db_session):
        from models import Application
        from services.pipeline import advance_pipeline, get_pipeline_status
        app = Application(company="Test", role="Dev", job_description="jd")
        db_session.add(app)
        db_session.commit()

        advance_pipeline(db_session, app.id, PipelineStage.APPLICATION_SAVED)
        advance_pipeline(db_session, app.id, PipelineStage.COVER_LETTER_READY)

        status = get_pipeline_status(db_session, app.id)
        assert status["current_stage"] == "cover_letter_ready"
        assert status["completed_count"] == 2
        assert status["total_stages"] == 7
        assert status["progress_pct"] == round(2 / 7 * 100, 1)
        assert status["next_stage"] == "recruiter_msg_ready"

    def test_get_user_progress_empty(self, db_session):
        from services.pipeline import get_user_progress
        progress = get_user_progress(db_session)
        assert progress["applications"] == []

    def test_get_user_progress_with_apps(self, db_session):
        from models import Application
        from services.pipeline import advance_pipeline, get_user_progress
        app1 = Application(company="Google", role="SWE", job_description="jd1")
        app2 = Application(company="Meta", role="FE", job_description="jd2")
        db_session.add_all([app1, app2])
        db_session.commit()

        advance_pipeline(db_session, app1.id, PipelineStage.APPLICATION_SAVED)
        advance_pipeline(db_session, app2.id, PipelineStage.INTERVIEW_READY)

        progress = get_user_progress(db_session)
        assert len(progress["applications"]) == 2
        assert progress["total_stages"] == 7

    def test_get_pipeline_context(self, db_session):
        from models import Application
        from services.pipeline import advance_pipeline, get_pipeline_context
        app = Application(company="Google", role="SWE", job_description="jd")
        db_session.add(app)
        db_session.commit()
        advance_pipeline(db_session, app.id, PipelineStage.APPLICATION_SAVED)

        ctx = get_pipeline_context(db_session)
        assert "Google" in ctx
        assert "application_saved" in ctx
        assert "[Application Pipeline Status]" in ctx

    def test_get_pipeline_context_empty(self, db_session):
        from services.pipeline import get_pipeline_context
        assert get_pipeline_context(db_session) == ""


class TestPipelineREST:
    def test_get_all_pipelines(self, client):
        r = client.get("/api/pipeline")
        assert r.status_code == 200
        assert "applications" in r.json()

    def test_get_pipeline_for_application(self, client, db_session):
        from models import Application
        app = Application(company="Test", role="Dev", job_description="jd")
        db_session.add(app)
        db_session.commit()
        r = client.get(f"/api/pipeline/{app.id}")
        assert r.status_code == 200
        data = r.json()
        assert data["application_id"] == app.id
        assert data["current_stage"] == "resume_uploaded"


class TestPipelineInDomainContext:
    def test_domain_context_includes_pipeline(self, db_session):
        from routers.chat import get_domain_context
        from models import Application
        from services.pipeline import advance_pipeline
        app = Application(company="Google", role="SWE", job_description="jd", match_score=0.85)
        db_session.add(app)
        db_session.commit()
        advance_pipeline(db_session, app.id, PipelineStage.APPLICATION_SAVED)

        ctx = get_domain_context(db_session)
        assert "Google" in ctx
        assert "progress:" in ctx
        assert "application_saved" in ctx

    def test_domain_context_empty_when_no_apps(self, db_session):
        from routers.chat import get_domain_context
        assert get_domain_context(db_session) == ""
