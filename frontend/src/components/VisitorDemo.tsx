import ChatWidget from "./ChatWidget";

const VisitorDemo = () => {
  const workspaceId = "9344a73e-bcda-4c0a-b460-d87c198b2834";

  return (
    <div className="visitor-demo">
      {/* <chatlio-widget widgetid="d9dd254f-233b-4995-4e8a-316515df45bf"></chatlio-widget> */}
      {/* Chat widget in visitor mode */}
      <ChatWidget workspaceId={workspaceId} />
    </div>
  );
};

export default VisitorDemo;
