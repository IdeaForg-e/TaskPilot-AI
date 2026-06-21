import uuid

from agents.agent_4_quality_agent import QualityAgent
from app.models.quality_report import QualityReport
from app.models.task import MasterTask


class QualityService:
    def __init__(self, db):
        self.db = db
        self.agent = QualityAgent()

    def evaluate_all(self):
        self.db.query(QualityReport).delete()
        tasks = self.db.query(MasterTask).all()
        reports = []
        actionable = 0
        needs_info = 0
        total_score = 0

        for task in tasks:
            is_critical = (task.urgency in ("critical", "high"))
            result = self.agent.evaluate(
                task.title,
                task.description or "",
                task.task_type or "",
                task.assignee or "",
                task.deadline or "",
                is_critical=is_critical,
            )
            report = QualityReport(
                id=str(uuid.uuid4()),
                master_task_id=task.id,
                overall_score=result.get("overall_score", 50),
                clear_title_score=result.get("clear_title"),
                reproduction_steps_score=result.get("reproduction_steps"),
                error_logs_score=result.get("error_logs"),
                environment_score=result.get("environment"),
                expected_behavior_score=result.get("expected_behavior"),
                severity_score=result.get("severity"),
                assignee_score=result.get("assignee"),
                missing_info=result.get("missing_info", []),
                clarification_questions=result.get("clarification_questions", []),
                actionability=result.get("actionability", "needs_info"),
            )
            self.db.add(report)
            reports.append(self._report_out(report, task.title))
            if report.actionability == "actionable":
                actionable += 1
            else:
                needs_info += 1
            total_score += report.overall_score

        self.db.commit()
        return {
            "total_evaluated": len(tasks),
            "actionable": actionable,
            "needs_info": needs_info,
            "avg_score": round(total_score / len(tasks), 1) if tasks else 0,
            "reports": reports,
        }

    def get_reports(self):
        tasks = {task.id: task.title for task in self.db.query(MasterTask).all()}
        reports = self.db.query(QualityReport).all()
        return [self._report_out(report, tasks.get(report.master_task_id, "")) for report in reports]

    def _report_out(self, report, task_title):
        return {
            "id": report.id,
            "master_task_id": report.master_task_id,
            "task_title": task_title,
            "title": task_title,
            "overall_score": report.overall_score,
            "score": report.overall_score,
            "clear_title_score": report.clear_title_score,
            "reproduction_steps_score": report.reproduction_steps_score,
            "error_logs_score": report.error_logs_score,
            "environment_score": report.environment_score,
            "expected_behavior_score": report.expected_behavior_score,
            "severity_score": report.severity_score,
            "assignee_score": report.assignee_score,
            "missing_info": report.missing_info or [],
            "missing_fields": report.missing_info or [],
            "clarification_questions": report.clarification_questions or [],
            "actionability": report.actionability,
        }
