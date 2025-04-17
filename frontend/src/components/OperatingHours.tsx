import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Workspace } from "../services/workspaceService";
import "./OperatingHours.scss";
import { workspaceSettingsService } from "../services/workspaceSettingsService";

type ContextType = { workspace: Workspace | null };

type TimeRanges = {
  startTime: string;
  endTime: string;
};

type ScheduleItem = {
  day: string;
  timeRanges: TimeRanges[];
  enabled: boolean;
};

const initialSchedule: ScheduleItem[] = [
  {
    day: "Monday",
    timeRanges: [{ startTime: "", endTime: "" }],
    enabled: false,
  },
  {
    day: "Tuesday",
    timeRanges: [{ startTime: "", endTime: "" }],
    enabled: false,
  },
  {
    day: "Wednesday",
    timeRanges: [{ startTime: "", endTime: "" }],
    enabled: false,
  },
  {
    day: "Thursday",
    timeRanges: [{ startTime: "", endTime: "" }],
    enabled: false,
  },
  {
    day: "Friday",
    timeRanges: [{ startTime: "", endTime: "" }],
    enabled: false,
  },
  {
    day: "Saturday",
    timeRanges: [{ startTime: "", endTime: "" }],
    enabled: false,
  },
  {
    day: "Sunday",
    timeRanges: [{ startTime: "", endTime: "" }],
    enabled: false,
  },
];

const OperatingHours = () => {
  const { workspace } = useOutletContext<ContextType>();
  const [showScheduleSetup, setShowScheduleSetup] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
  const [schedule, setSchedule] = useState<ScheduleItem[]>(initialSchedule);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (workspace) {
      loadScheduleSettings(workspace.id);
    }
  }, [workspace]);

  useEffect(() => {
    const storedSchedule = localStorage.getItem(
      `operating_hours_${workspace?.id}`
    );
    if (storedSchedule) {
      setShowScheduleSetup(true);
    }
  }, [workspace]);

  const handleClearSchedule = async () => {
    if (!workspace?.id) return;

    setIsSaving(true);
    setError("");

    try {
      // Send 'none' to backend to indicate no operating hours are set
      await workspaceSettingsService.updateSettings(workspace.id, {
        operatingHours: "none",
      });

      // Reset the local state
      setSchedule(initialSchedule);
      setShowScheduleSetup(false);

      setSuccessMessage("Operating hours schedule cleared successfully!");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error clearing operating hours:", err);
      setError("Failed to clear schedule. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const loadScheduleSettings = async (workspaceId: string) => {
    setIsLoading(true);
    try {
      const settings = await workspaceSettingsService.getSettings(workspaceId);
      console.log("Loaded settings:", settings);

      if (settings.operating_hours && settings.operating_hours !== "none") {
        try {
          const scheduleData = JSON.parse(settings.operating_hours);

          if (scheduleData.timezone) {
            setTimezone(scheduleData.timezone);
          }

          if (scheduleData.schedule && Array.isArray(scheduleData.schedule)) {
            const newSchedule = scheduleData.schedule.map(
              (day: ScheduleItem) => {
                if ("startTime" in day && "endTime" in day) {
                  return {
                    day: day.day,
                    enabled: day.enabled,
                    timeRanges: day.enabled
                      ? [{ startTime: day.startTime, endTime: day.endTime }]
                      : [{ startTime: "", endTime: "" }],
                  };
                }
                return day;
              }
            );

            setSchedule(newSchedule);
          }

          setShowScheduleSetup(true);
        } catch (error) {
          console.error("Error parsing schedule data:", error);
        }
      }
    } catch (error) {
      console.error("Error loading schedule settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupSchedule = () => {
    setShowScheduleSetup(true);
  };

  const handleSaveChanges = async () => {
    if (!workspace?.id) return;

    setIsSaving(true);
    setError("");

    const allDaysDisabled = !schedule.some((day) => day.enabled);

    if (allDaysDisabled) {
      return handleClearSchedule();
    }

    const scheduleData = {
      timezone,
      schedule,
    };

    const scheduleJson = JSON.stringify(scheduleData);

    try {
      await workspaceSettingsService.updateSettings(workspace.id, {
        operatingHours: scheduleJson,
      });
      console.log(
        "🚀 ~ handleSaveChanges ~ workspaceSettingsService:",
        workspaceSettingsService
      );

      console.log("Schedule saved:", scheduleJson);

      setSuccessMessage("Schedule saved successfully!");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error saving operating hours:", err);
      setError("Failed to save schedule. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (workspace?.id) {
      loadScheduleSettings(workspace.id);
    }

    if (!schedule.some((day) => day.enabled)) {
      setShowScheduleSetup(false);
    }
  };

  const handleToggleDay = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index].enabled = !newSchedule[index].enabled;
    if (!newSchedule[index].enabled) {
      newSchedule[index].timeRanges = [{ startTime: "", endTime: "" }];
    } else if (newSchedule[index].timeRanges[0].startTime === "") {
      newSchedule[index].timeRanges = [
        { startTime: "09:00", endTime: "17:00" },
      ];
    }
    setSchedule(newSchedule);
  };

  const handleTimeChange = (
    dayIndex: number,
    rangeIndex: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].timeRanges[rangeIndex][field] = value;
    setSchedule(newSchedule);
  };

  const handleAddTimeRange = (dayIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].timeRanges.push({
      startTime: "09:00",
      endTime: "17:00",
    });
    setSchedule(newSchedule);
  };

  const handleRemoveTimeRange = (dayIndex: number, rangeIndex: number) => {
    const newSchedule = [...schedule];
    if (newSchedule[dayIndex].timeRanges.length > 1) {
      newSchedule[dayIndex].timeRanges.splice(rangeIndex, 1);
      setSchedule(newSchedule);
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        const timeString = `${formattedHour}:${formattedMinute}`;
        options.push(
          <option key={timeString} value={timeString}>
            {timeString}
          </option>
        );
      }
    }
    return options;
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading__spinner"></div>
      </div>
    );
  }

  if (showScheduleSetup) {
    return (
      <div className="operating-hours">
        <div className="operating-hours__schedule-setup">
          <h2 className="operating-hours__title">Operating Hours Setup</h2>

          {error && (
            <div className="operating-hours__error-message">{error}</div>
          )}

          <div className="operating-hours__timezone">
            <label className="operating-hours__timezone-label">
              Select your timezone
            </label>
            <select
              className="operating-hours__timezone-select"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <option value="Asia/Ho_Chi_Minh">
                Asia/Ho Chi_Minh (+07:00)
              </option>
              <option value="Asia/Bangkok">Asia/Bangkok (+07:00)</option>
              <option value="America/New_York">
                America/New_York (-05:00)
              </option>
              <option value="Europe/London">Europe/London (+00:00)</option>
            </select>
          </div>

          <div className="operating-hours__table-container">
            <table className="operating-hours__table">
              <thead>
                <tr>
                  <th className="operating-hours__table-header-day">Weekday</th>
                  <th className="operating-hours__table-header-time">
                    {workspace?.name || "Chat Support"} is ON between … and …
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((item, dayIndex) => (
                  <tr key={item.day} className="operating-hours__table-row">
                    <td className="operating-hours__table-day">
                      <label className="operating-hours__day-label">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={() => handleToggleDay(dayIndex)}
                          className="operating-hours__day-checkbox"
                        />
                        {item.day}
                      </label>
                    </td>
                    <td className="operating-hours__table-time">
                      {item.enabled ? (
                        <div className="operating-hours__time-ranges">
                          {item.timeRanges.map((timeRange, rangeIndex) => (
                            <div
                              key={rangeIndex}
                              className="operating-hours__time-range"
                            >
                              <div className="operating-hours__time-selectors">
                                <select
                                  value={timeRange.startTime}
                                  onChange={(e) =>
                                    handleTimeChange(
                                      dayIndex,
                                      rangeIndex,
                                      "startTime",
                                      e.target.value
                                    )
                                  }
                                  className="operating-hours__time-select"
                                >
                                  {timeRange.startTime === "" && (
                                    <option value="">–</option>
                                  )}
                                  {generateTimeOptions()}
                                </select>

                                <span className="operating-hours__time-separator">
                                  to
                                </span>

                                <select
                                  value={timeRange.endTime}
                                  onChange={(e) =>
                                    handleTimeChange(
                                      dayIndex,
                                      rangeIndex,
                                      "endTime",
                                      e.target.value
                                    )
                                  }
                                  className="operating-hours__time-select"
                                >
                                  {timeRange.endTime === "" && (
                                    <option value="">–</option>
                                  )}
                                  {generateTimeOptions()}
                                </select>

                                {item.timeRanges.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveTimeRange(
                                        dayIndex,
                                        rangeIndex
                                      )
                                    }
                                    className="operating-hours__time-range-remove"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => handleAddTimeRange(dayIndex)}
                            className="operating-hours__add-time-range"
                          >
                            + Add another time range
                          </button>
                        </div>
                      ) : (
                        <div className="operating-hours__time-disabled">
                          <span className="operating-hours__time-placeholder">
                            –
                          </span>
                          <span className="operating-hours__time-separator">
                            to
                          </span>
                          <span className="operating-hours__time-placeholder">
                            –
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {successMessage && (
            <div className="operating-hours__success-message">
              {successMessage}
            </div>
          )}

          <div className="operating-hours__actions">
            <button
              className="operating-hours__button operating-hours__button--secondary"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="operating-hours__button"
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="operating-hours">
      <div className="operating-hours__grid">
        <div className="operating-hours__image-container">
          <img
            src="https://chatlio.com/app/img/clock3.png"
            alt="Clock"
            className="operating-hours__image"
          />
        </div>
        <div className="operating-hours__content">
          <h2 className="operating-hours__title">Operating Hours</h2>

          <p className="operating-hours__description">
            Set a schedule to turn {workspace?.name || "Chat"} on.
          </p>

          <button
            className="operating-hours__button"
            onClick={handleSetupSchedule}
          >
            Setup chat schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperatingHours;
