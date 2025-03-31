import ChatWidget from "./ChatWidget";

const VisitorDemo = () => {
  const workspaceId = "430a8599-81ee-4b91-b595-75bfbf4299e1";

  return (
    <div className="visitor-demo">
      {/* <chatlio-widget widgetid="d9dd254f-233b-4995-4e8a-316515df45bf"></chatlio-widget> */}
      {/* Chat widget in visitor mode */}
      <ChatWidget workspaceId={workspaceId} />
    </div>
  );
};

export default VisitorDemo;
