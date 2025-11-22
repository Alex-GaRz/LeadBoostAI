import asyncio
import os
from microservice_analyst.services.strategy_engine import StrategyEngine
from microservice_analyst.models.schemas import MarketSignal
from datetime import datetime

async def main():
    engine = StrategyEngine()
    print('API KEY utilizada:', os.getenv('OPENAI_API_KEY'))
    signal = MarketSignal(
        source="reddit",
        content="Nueva tendencia viral en marketing digital",
        sentiment_score=0.8,
        timestamp=datetime.utcnow()
    )
    context = {
        "budget": 1000,
        "competitors": ["CompetitorA", "CompetitorB"]
    }
    proposal = await engine.generate_strategy_chain(signal, context)
    print(proposal.model_dump_json(indent=2))

if __name__ == "__main__":
    asyncio.run(main())
