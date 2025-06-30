// route("/analysis-progress")

import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useConfigStore, useHydration } from "@/stores";
import { analyze, readFile } from "@/invoke";
import mime from "mime";
import {
  Container,
  LinearProgress,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@mui/material";
import { Probed } from "@/invoke/analyze";
import { InvokeError } from "@/invoke";
import { Clip, unwrap, unwrapRef } from "@/utils";

interface AnalysisProgressProps {
  path: string;
}

export const AnalysisProgress = (): ReactElement => {
  const navigate = useNavigate();
  const numClipsRef = useRef<number | null>(null);
  const [decoded, setDecoded] = useState(false);
  const [detected, setDetected] = useState(false);
  const [classified, setClassified] = useState(false);
  const metadataRef = useRef<Probed>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const {
    batchSize,
    pcmThreshold,
    timeThreshold,
    enableClassify,
    probThreshold,
  } = useConfigStore();
  const hydrated = useHydration();
  const location = useLocation();
  const { path } = location.state.props as AnalysisProgressProps;

  const work = useCallback(
    async (path: string) => {
      try {
        const audio = await readFile(path);
        const ext = path.split(".").pop();
        if (ext === undefined) return;
        const m = mime.getType(ext) || "application/octet-stream";
        const blob = new Blob([audio], { type: m });
        const url = URL.createObjectURL(blob);

        let res = await analyze(
          path,
          batchSize,
          pcmThreshold,
          timeThreshold,
          enableClassify,
          (evt) => {
            if (evt.event == "probed") {
              metadataRef.current = evt.data;
            }
            if (evt.event == "decodeProgress") {
              const metadata = unwrapRef(metadataRef);
              setAnalyzeProgress((evt.data.cur / metadata.numFrames) * 100);
            }
            if (evt.event == "decoded") {
              setDecoded(true);
              setAnalyzeProgress(0);
            }
            if (evt.event == "detectProgress") {
              const metadata = unwrapRef(metadataRef);
              setAnalyzeProgress((evt.data.cur / metadata.numFrames) * 100);
            }
            if (evt.event == "detected") {
              setDetected(true);
              setAnalyzeProgress(0);
              numClipsRef.current = evt.data.num_clips;
            }
            if (evt.event == "classifyProgress") {
              const numClips = unwrapRef(numClipsRef);
              setAnalyzeProgress((evt.data.cur / numClips) * 100);
            }
            if (evt.event == "classified") {
              setClassified(true);
            }
          },
        );

        let clips: Clip[] = [];
        if (enableClassify) {
          const id = 1;
          res = res.filter((clip) => {
            return (unwrap(clip[2])[id] as number) > probThreshold;
          });
          clips = res.map((c) => [c[0], c[1], unwrap(c[2])[id]]);
        } else clips = res.map((c) => [c[0], c[1], null]);

        const metadata = unwrapRef(metadataRef);

        navigate("/player", {
          state: {
            props: {
              url,
              clips: clips.map((c) => {
                return [
                  c[0] / metadata.sampleRate,
                  c[1] / metadata.sampleRate,
                  c[2],
                ];
              }),
            },
          },
        });
      } catch (err) {
        const { kind, message } = err as InvokeError;
        navigate("/error-display", {
          state: {
            props: {
              kind,
              message,
            },
          },
        });
      }
    },
    [
      batchSize,
      pcmThreshold,
      timeThreshold,
      enableClassify,
      probThreshold,
      navigate,
    ],
  );

  useEffect(() => {
    if (!hydrated) return;
    void work(path);
  }, [hydrated, work, path]);
  return (
    <>
      <Container sx={{ paddingTop: "3%" }}>
        <Stepper>
          <Step completed={decoded}>
            <StepLabel>Decode</StepLabel>
          </Step>
          <Step completed={detected}>
            <StepLabel>Detect</StepLabel>
          </Step>
          {enableClassify && (
            <Step completed={classified}>
              <StepLabel>Classify</StepLabel>
            </Step>
          )}
        </Stepper>
        <Table>
          <TableBody>
            {Object.entries(metadataRef.current || {}).map(([key, value]) => {
              return (
                <TableRow key={key}>
                  <TableCell>{key}</TableCell>
                  <TableCell>{value}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <LinearProgress variant="determinate" value={analyzeProgress} />
      </Container>
    </>
  );
};
