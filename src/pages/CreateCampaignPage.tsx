import React from 'react';
import CreateCampaignButton from '../components/Dashboard/CreateCampaignButton';

const CreateCampaignPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7f8fa]">
      <CreateCampaignButton />
    </div>
  );
};

export default CreateCampaignPage;
