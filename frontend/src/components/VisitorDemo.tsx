import ChatWidget from "./ChatWidget";

const VisitorDemo = () => {
  const workspaceId = "8a66cbb8-ef2f-4935-b69b-f5e32764419b";

  return (
    <div className="visitor-demo">
      {/* Chat widget in visitor mode */}
      <ChatWidget workspaceId={workspaceId} />
    </div>
  );
};

export default VisitorDemo;
