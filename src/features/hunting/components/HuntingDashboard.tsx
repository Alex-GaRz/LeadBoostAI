import React from "react";
import OpportunityList from "./OpportunityList";

interface Props {
  strategyId: string;
  userBusinessName: string;
}

const HuntingDashboard: React.FC<Props> = ({ strategyId, userBusinessName }) => {
  console.log("PASO 2 (LLEGADA): El Panel de Resultados recibió este strategyId:", strategyId);

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <OpportunityList 
        strategyId={strategyId} 
        showMetrics={true} 
        layout="simple"
        className=""
        userBusinessName={userBusinessName}
      />
    </div>
  );
};

export default HuntingDashboard;
