// route("/player");

import {
  ReactElement,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Container,
  Paper,
  Stack,
  Toolbar,
  List,
  ListItem,
  IconButton,
  ListItemText,
  Slider,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { Clip, unwrapRef } from "@/utils";
import { SpeedDial } from "@/components";
import { useLocation } from "react-router";
import { usePlayerStateStore } from "@/stores/usePlayerStateStore";
import { PauseRounded, PlayArrow, PlayCircle } from "@mui/icons-material";
interface PlayerProps {
  url: string;
  clips: Clip[];
}

export const Player = (): ReactElement => {
  const { url, clips } = useLocation().state.props as PlayerProps;
  const audioRef = useRef<HTMLAudioElement>(null);
  const setState = usePlayerStateStore.setState;

  useLayoutEffect(() => {
    const audio = unwrapRef(audioRef);
    audio.playbackRate = 1.0;
    setState({ audio });
  }, [setState]);

  return (
    <>
      <Container sx={{ paddingTop: "5%", paddingBottom: "15%" }}>
        <Stack spacing={2}>
          <audio controls src={url} ref={audioRef} />
          <Panel />
          <ClipsPlayer clips={clips} />
        </Stack>
      </Container>
      <SpeedDial />
    </>
  );
};

const Panel = (): ReactElement => {
  const audio = usePlayerStateStore.use.audio();
  const [speed, setSpeed] = useState<number>(1.0);

  if (audio === null) return <></>;
  interface Gear {
    name: string;
    speed: number;
  }

  const gears: Gear[] = [
    { name: "0.80", speed: 0.8 },
    { name: "1.00", speed: 1.0 },
    { name: "1.25", speed: 1.25 },
    { name: "1.50", speed: 1.5 },
  ];

  const onButtonChange = (
    _: React.MouseEvent<HTMLElement>,
    speed: number | null,
  ) => {
    if (speed === null) return;
    audio.playbackRate = speed;
    setSpeed(speed);
  };

  const onSliderChange = (_: Event, speed: number | number[]) => {
    audio.playbackRate = speed as number;
    setSpeed(speed as number);
  };

  return (
    <Paper>
      <Toolbar>
        <Stack
          direction="row"
          spacing={2}
          sx={{ width: "100%", alignItems: "center" }}
        >
          <ToggleButtonGroup
            color="primary"
            value={speed}
            exclusive
            onChange={onButtonChange}
          >
            {gears.map((gear, idx) => (
              <ToggleButton key={idx} value={gears[idx].speed}>
                {gear.name}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Slider
            value={speed}
            step={0.01}
            min={0.75}
            max={1.5}
            valueLabelDisplay="auto"
            onChange={onSliderChange}
          />
        </Stack>
      </Toolbar>
    </Paper>
  );
};

interface ClipsPlayerProps {
  clips: Clip[];
}

const ClipsPlayer = (props: ClipsPlayerProps): ReactElement => {
  const { clips } = props;
  return (
    <Paper>
      <List>
        {clips.map((clip, idx) => (
          <ClipPlayer
            key={idx}
            idx={idx}
            divider={idx + 1 !== clips.length}
            clip={clip}
          />
        ))}
      </List>
    </Paper>
  );
};
interface ClipPlayerProps {
  idx: number;
  clip: Clip;
  divider: boolean;
}

const ClipPlayer = (props: ClipPlayerProps): ReactElement => {
  const { idx, clip, divider } = props;
  const audio = usePlayerStateStore.use.audio();
  const isPlaying = usePlayerStateStore.use.isPlaying();
  const playing = usePlayerStateStore.use.playing();
  const setState = usePlayerStateStore.setState;
  const lenText = useMemo(() => {
    const date = new Date(0);
    date.setSeconds(clip[1] - clip[0]);
    return date.toISOString().substring(14, 19);
  }, [clip]);
  const prob = clip[2] !== null ? `(${clip[2].toFixed(2)})` : "";

  if (audio === null) return <></>;

  const onTimeUpdate = (): void => {
    if (audio.currentTime > clip[1]) {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      setState({ onTimeUpdate: null, playing: null, isPlaying: false });
    }
  };

  const onPlay = () => {
    const { onTimeUpdate: onTimeUpdatePrev } = usePlayerStateStore.getState();
    if (onTimeUpdatePrev !== null)
      audio.removeEventListener("timeupdate", onTimeUpdatePrev);

    audio.currentTime = clip[0];
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.play();
    setState({ onTimeUpdate, playing: clip, isPlaying: true });
  };

  const onPause = () => {
    audio.pause();
    setState({ isPlaying: false });
  };

  const onResume = () => {
    audio.play();
    setState({ isPlaying: true });
  };

  return (
    <ListItem
      divider={divider}
      secondaryAction={(() => {
        if (playing === clip) {
          return isPlaying ? (
            <IconButton onClick={onPause}>
              <PauseRounded />
            </IconButton>
          ) : (
            <IconButton onClick={onResume}>
              <PlayCircle />
            </IconButton>
          );
        } else {
          return (
            <IconButton onClick={onPlay}>
              <PlayArrow />
            </IconButton>
          );
        }
      })()}
    >
      <ListItemText primary={`Text ${idx + 1} [${lenText}] ${prob}`} />
    </ListItem>
  );
};
