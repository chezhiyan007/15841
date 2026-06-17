import { useEffect } from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { NotificationsPage } from "./pages/NotificationsPage";
import { PriorityNotificationsPage } from "./pages/PriorityNotificationsPage";
import { logger } from "./utils/logger";

function NavigationLogger() {
  const location = useLocation();

  useEffect(() => {
    logger.navigation(location.pathname);
  }, [location.pathname]);

  return null;
}

function AppShell() {
  return (
    <Box minHeight="100vh">
      <NavigationLogger />
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 2, py: 1 }}>
            <NotificationsActiveIcon color="primary" />
            <Typography
              variant="h6"
              component="h1"
              fontWeight={800}
              sx={{ flexGrow: 1 }}
            >
              Campus Notifications
            </Typography>
            <Button component={NavLink} to="/notifications" color="inherit">
              All
            </Button>
            <Button
              component={NavLink}
              to="/priority"
              color="inherit"
              startIcon={<PriorityHighIcon />}
            >
              Priority
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
        <Routes>
          <Route path="/" element={<Navigate to="/notifications" replace />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/priority" element={<PriorityNotificationsPage />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
