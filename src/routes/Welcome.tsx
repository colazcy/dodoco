// route("/");

import { listen, TauriEvent } from "@tauri-apps/api/event";
import { ReactElement, useCallback, useLayoutEffect } from "react";
import { Container, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import { UploadFileRounded } from "@mui/icons-material";
import { SpeedDial } from "@/components";

export const Welcome = (): ReactElement => {
  const navigate = useNavigate();
  const onDrop = useCallback(
    (path: string) => {
      navigate("/analysis-progress", { state: { props: { path } } });
    },
    [navigate],
  );

  useLayoutEffect(() => {
    const unlisten = listen<{ paths: string[] }>(
      `${TauriEvent.DRAG_DROP}`,
      (e) => {
        const p = e.payload.paths;
        if (p.length !== 1) return;
        onDrop(p[0]);
      },
    );
    return () => {
      void unlisten.then((f) => f());
    };
  }, [navigate, onDrop]);

  return (
    <>
      <Container sx={{ paddingTop: "20%" }}>
        <Stack sx={{ alignItems: "center" }}>
          <UploadFileRounded sx={{ fontSize: 128 }} />
          <Typography variant="h6">
            Drag and drop an audio file here to get started
          </Typography>
        </Stack>
      </Container>
      <SpeedDial />
    </>
  );
};
