import React from "react";
import { useVisitorIdentification } from "../hooks/useVisitorIdentification";
import Input from "./Input";
import Button from "./Button";
import "./VisitorIdentificationForm.scss";

interface VisitorIdentificationFormProps {
  workspaceId: string | null;
  onComplete: () => void;
}

const VisitorIdentificationForm: React.FC<VisitorIdentificationFormProps> = ({
  workspaceId,
  onComplete,
}) => {
  const {
    visitorEmail,
    setVisitorEmail,
    visitorName,
    setVisitorName,
    identificationLoading,
    error,
    submitVisitorIdentification,
  } = useVisitorIdentification(workspaceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitVisitorIdentification();
    if (success) {
      onComplete();
    }
  };

  return (
    <div className="visitor-identification">
      <h3>Before we start chatting</h3>
      <p>Please let us know who you are so we can better assist you.</p>

      {error && <div className="visitor-identification__error">{error}</div>}

      <form onSubmit={handleSubmit} className="visitor-identification__form">
        <div className="visitor-identification__form-field">
          <Input
            id="visitor-email"
            type="email"
            placeholder="Email"
            value={visitorEmail}
            onChange={(e) => setVisitorEmail(e.target.value)}
            className="visitor-identification__form-input"
            required
          />
        </div>

        <div className="visitor-identification__form-field">
          <Input
            id="visitor-name"
            type="text"
            placeholder="Name (optional)"
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            className="visitor-identification__form-input"
          />
        </div>

        <Button
          label={identificationLoading ? "Processing..." : "Start Chat"}
          disabled={identificationLoading}
          onClick={() => {}}
          type="submit"
          fullWidth
          className="visitor-identification__form-submit"
        />
      </form>
    </div>
  );
};

export default VisitorIdentificationForm;
