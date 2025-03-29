import ChatWidget from "./ChatWidget";

const VisitorDemo = () => {
  const workspaceId = "7f71a9c6-d0a6-4058-a65f-967025449850";

  return (
    <div className="visitor-demo">
      {/* <chatlio-widget widgetid="d9dd254f-233b-4995-4e8a-316515df45bf"></chatlio-widget> */}
      {/* Chat widget in visitor mode */}
      <ChatWidget workspaceId={workspaceId} />
    </div>
  );
};

export default VisitorDemo;
