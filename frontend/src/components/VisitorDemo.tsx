import ChatWidget from "./ChatWidget";

const VisitorDemo = () => {
  const workspaceId = "0edd3bb6-edb7-4d7c-aa14-05cbea7536a6";

  return (
    <div className="visitor-demo">
      {/* Chat widget in visitor mode */}
      <ChatWidget workspaceId={workspaceId} />
    </div>
  );
};

export default VisitorDemo;
