// route("/error-display");

import { ReactElement } from "react";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Typography from "@mui/material/Typography";
import { useLocation } from "react-router";

interface ErrorDisplayProps {
  kind: string;
  message: string;
}

export const ErrorDisplay = (): ReactElement => {
  const location = useLocation();
  const { kind, message } = location.state.props as ErrorDisplayProps;

  return (
    <>
      <Container sx={{ paddingTop: "5%" }}>
        <Alert severity="error">
          <AlertTitle>{kind}</AlertTitle>
          <Typography>{message}</Typography>
        </Alert>
        <Typography variant="body1" gutterBottom>
          An unexpected error occurred.
          <br />
          You can open an issue on the GitHub repository
          (https://github.com/colazcy/dodoco/issues) to request assistance.
        </Typography>
      </Container>
    </>
  );
};
