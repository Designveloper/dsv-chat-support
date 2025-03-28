import ChatWidget from "./ChatWidget";

const VisitorDemo = () => {
  const workspaceId = "8a66cbb8-ef2f-4935-b69b-f5e32764419b";

  return (
    <div className="visitor-demo">
      {/* <chatlio-widget widgetid="d9dd254f-233b-4995-4e8a-316515df45bf"></chatlio-widget> */}
      {/* Chat widget in visitor mode */}
      <ChatWidget workspaceId={workspaceId} />
    </div>
  );
};

export default VisitorDemo;
