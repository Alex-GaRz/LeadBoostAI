
from fastapi import APIRouter, HTTPException, BackgroundTasks
from microservice_analyst.models.schemas import SimulationInput, ResonanceReport
from microservice_analyst.core.persona_engine import PersonaFactory
from microservice_analyst.core.simulation_sandbox import AdSimulator
from microservice_analyst.core.resonance_math import ResonanceAnalyzer
import uuid

router = APIRouter(prefix="/simulation", tags=["Audience Architect"])

# Initialize Engines
persona_factory = PersonaFactory()
ad_simulator = AdSimulator()

@router.post("/run", response_model=ResonanceReport)
async def run_market_simulation(input_data: SimulationInput):
    """
    Orchestrates the full Phase 4 pipeline:
    1. Generate Cohort (PersonaFactory)
    2. Run Parallel Simulation (AdSimulator)
    3. Analyze Results (ResonanceAnalyzer)
    """
    try:
        # Step 1: Genesis
        cohort = await persona_factory.generate_cohort(
            target_description=input_data.target_audience_description,
            quantity=input_data.sample_size
        )
        
        # Step 2: The Sandbox
        raw_reactions = await ad_simulator.run_simulation(
            personas=cohort,
            ad_copy=input_data.ad_copy
        )
        
        # Step 3: Math & Insight
        report = ResonanceAnalyzer.analyze_results(
            sim_id=str(uuid.uuid4()),
            results=raw_reactions
        )
        
        return report

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")