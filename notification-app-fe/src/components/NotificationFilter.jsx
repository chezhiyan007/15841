import { ToggleButton, ToggleButtonGroup } from "@mui/material";

const filters = ["All", "Placement", "Result", "Event"];

export function NotificationFilter({ value, onChange }) {
  const handleChange = (_, nextValue) => {
    if (nextValue) {
      onChange(nextValue);
    }
  };

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      size="small"
      onChange={handleChange}
      sx={{ flexWrap: "wrap", gap: 0.5 }}
    >
      {filters.map((type) => (
        <ToggleButton
          key={type}
          value={type}
          sx={{ textTransform: "none", px: 2 }}
        >
          {type}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
