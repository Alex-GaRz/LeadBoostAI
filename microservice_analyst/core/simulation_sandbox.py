# microservice_analyst/core/simulation_sandbox.py

import asyncio
import json
import os
from typing import List
from openai import AsyncOpenAI
from microservice_analyst.models.schemas import PersonaProfile, AgentReaction

class AdSimulator:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None

    async def run_simulation(self, personas: List[PersonaProfile], ad_copy: str) -> List[AgentReaction]:
        """
        Exposes the entire cohort to the ad copy simultaneously.
        """
        tasks = [self._simulate_single_agent(p, ad_copy) for p in personas]
        results = await asyncio.gather(*tasks)
        return [r for r in results if r is not None]

    async def _simulate_single_agent(self, persona: PersonaProfile, ad_copy: str) -> AgentReaction:
        """
        Injects the persona into the LLM and records the reaction.
        """
        if not self.client:
            return self._mock_reaction(persona)

        system_prompt = f"""
        YOU ARE {persona.name}. 
        Profile:
        - Age: {persona.age}
        - Financial: {persona.financial_status}
        - Biases: {', '.join(persona.cognitive_biases)}
        - Stressors: {', '.join(persona.current_stressors)}
        
        You are browsing your usual media ({', '.join(persona.media_diet)}).
        You see this ad: "{ad_copy}"
        
        Based ONLY on your specific biases and stressors, how do you react?
        
        Return JSON:
        {{
            "click_probability": float (0.0 to 1.0),
            "emotional_response": "str (e.g., Annoyed, Curious, Excited)",
            "primary_objection": "str (or null if none)",
            "purchase_intent": bool,
            "reasoning": "str (1 sentence why)"
        }}
        """

        try:
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "system", "content": system_prompt}],
                response_format={"type": "json_object"},
                temperature=0.5
            )
            data = json.loads(response.choices[0].message.content)
            return AgentReaction(
                agent_id=persona.id,
                click_probability=data.get("click_probability", 0.0),
                emotional_response=data.get("emotional_response", "Neutral"),
                primary_objection=data.get("primary_objection"),
                purchase_intent=data.get("purchase_intent", False),
                reasoning=data.get("reasoning", "")
            )
        except Exception as e:
            print(f"Error simulating agent {persona.name}: {e}")
            return self._mock_reaction(persona)

    def _mock_reaction(self, persona: PersonaProfile) -> AgentReaction:
        """Deterministic mock for testing."""
        import random
        # Simple logic: High stress + Loss Aversion = Low click rate
        score = 0.5
        if "Loss Aversion" in persona.cognitive_biases: score -= 0.2
        if "Inflation" in persona.current_stressors: score -= 0.2
        
        return AgentReaction(
            agent_id=persona.id,
            click_probability=max(0.1, score),
            emotional_response="Skeptical",
            primary_objection="Too risky given my finances",
            purchase_intent=False,
            reasoning="Mock reasoning based on stress."
        )