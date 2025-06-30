import { SpeedDial as MSpeedDial } from "@mui/material";
import { ArrowBack, Home, Settings } from "@mui/icons-material";
import { ReactElement, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { usePlayerStateStore } from "@/stores/usePlayerStateStore";
import { unwrap } from "@/utils";

export const SpeedDial = (): ReactElement => {
  const navigate = useNavigate();
  const location = useLocation();
  const p = location.pathname;
  const playing = usePlayerStateStore.use.playing();

  const icon = useMemo(() => {
    if (playing !== null) return <ArrowBack />;
    switch (p) {
      case "/":
        return <Settings />;
      case "/settings":
      case "/player":
        return <Home />;
      default:
        throw new Error("Invalid pathname");
    }
  }, [p, playing]);

  const onClick = useCallback(() => {
    if (playing !== null) {
      const audio = unwrap(usePlayerStateStore.getState().audio);
      const [L] = playing;
      audio.currentTime = Math.max(audio.currentTime - 5.0, L);
    } else {
      switch (p) {
        case "/":
          return navigate("/settings");
        case "/settings":
        case "/player":
          return navigate("/");
        default:
          throw new Error("Invalid pathname");
      }
    }
  }, [p, navigate, playing]);

  return (
    <MSpeedDial
      ariaLabel="Speed dial"
      sx={{ position: "fixed", bottom: 32, right: 32 }}
      icon={icon}
      onClick={onClick}
    />
  );
};
