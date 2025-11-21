from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from models.memory_models import DecisionTrace

class LearningCore:
    def __init__(self, db: Session):
        self.db = db

    def calculate_success_rate(self, action_type: str = None, limit: int = 100):
        query = self.db.query(DecisionTrace).filter(DecisionTrace.status == "COMPLETED")
        
        if action_type:
            query = query.filter(DecisionTrace.action_type == action_type)
            
        records = query.filter(DecisionTrace.outcome_metric.isnot(None))\
                       .order_by(desc(DecisionTrace.timestamp))\
                       .limit(limit)\
                       .all()
        
        if not records:
            return {"success_rate": 0, "sample_size": 0, "message": "No data available"}

        avg_score = sum(r.outcome_metric for r in records) / len(records)
        interpretation = "Excellent" if avg_score > 0.8 else "Moderate" if avg_score > 0.5 else "Poor"
        
        return {
            "action_type": action_type or "ALL",
            "sample_size": len(records),
            "average_performance_score": round(avg_score, 2),
            "success_percentage": f"{round(avg_score * 100, 1)}%",
            "interpretation": interpretation
        }

    def get_top_strategies(self):
        """Solo devuelve estrategias que se ejecutaron y tienen métricas"""
        results = self.db.query(
            DecisionTrace.action_type,
            func.avg(DecisionTrace.outcome_metric).label('avg_score'),
            func.count(DecisionTrace.id).label('count')
        ).filter(
            DecisionTrace.outcome_metric.isnot(None)
        ).group_by(DecisionTrace.action_type).all()
        
        return [
            {
                "strategy": row.action_type,
                "performance": round(row.avg_score, 2),
                "executions": row.count
            }
            for row in results
        ]

    # --- NUEVA FUNCIÓN: TIMELINE DE AUDITORÍA ---
    def get_recent_activity(self, limit: int = 20):
        """
        Devuelve TODO: Bloqueos, Errores y Éxitos.
        Esencial para Auditoría y Debugging.
        """
        records = self.db.query(DecisionTrace)\
                      .order_by(desc(DecisionTrace.timestamp))\
                      .limit(limit)\
                      .all()
        
        return [
            {
                "trace_id": r.trace_id,
                "timestamp": r.timestamp,
                "action": r.action_type,
                "status": r.status, # AQUÍ VEREMOS 'BLOCKED_BY_GOVERNANCE'
                "score": r.outcome_metric
            }
            for r in records
        ]