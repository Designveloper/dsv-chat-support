import ChatWidget from "./ChatWidget";

const VisitorDemo = () => {
  const workspaceId = "2540be3a-069a-4335-b6e4-672d738b2752";

  return (
    <div className="visitor-demo">
      {/* Chat widget in visitor mode */}
      <ChatWidget workspaceId={workspaceId} />
    </div>
  );
};

export default VisitorDemo;
