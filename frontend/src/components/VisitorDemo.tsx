import ChatWidget from "./ChatWidget";

const VisitorDemo = () => {
  const workspaceId = "f4391dc7-2637-4b83-baf8-7ac9fa2fa82b";

  return (
    <div className="visitor-demo">
      {/* <chatlio-widget widgetid="d9dd254f-233b-4995-4e8a-316515df45bf"></chatlio-widget> */}
      {/* Chat widget in visitor mode */}
      <ChatWidget workspaceId={workspaceId} />
    </div>
  );
};

export default VisitorDemo;
